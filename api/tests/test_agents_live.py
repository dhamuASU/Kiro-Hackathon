"""
Live integration tests for the agent pipeline.

These tests hit the REAL Vertex AI / Gemini API and the REAL Supabase database.
They are NOT mocked — they verify the agents work end-to-end.

Run:
    pytest tests/test_agents_live.py -v -s

The -s flag lets you see the LLM output as it happens.
Requires a valid .env with VERTEXAI_API_KEY and SUPABASE_* credentials.
"""
import asyncio
import pytest
from uuid import uuid4

from config import settings
from services.events import EventBus
from services.llm.client import llm_client

# ── Test data: Head & Shoulders Classic ──────────────────────────────────────

HS_PRODUCT = {
    "name": "head and shoulders classic",
    "brand": "Head & Shoulders",
    "ingredients_parsed": [
        "Aqua", "Sodium Laureth Sulfate", "Sodium Lauryl Sulfate",
        "Sodium Chloride", "Cocamidopropyl Betaine", "Sodium Xylenesulfonate",
        "Glycol Distearate", "Sodium Citrate", "Parfum",
        "Piroctone Olamine", "Sodium Benzoate", "Dimethiconol",
        "Citric Acid", "Sodium Salicylate",
        "Guar Hydroxypropyltrimonium Chloride", "Dimethicone",
        "Hexyl Cinnamal", "Linalool", "Tetrasodium Edta",
        "Sodium Hydroxide", "Tea-Dodecylbenzenesulfonate", "Trideceth-10",
        "Niacinamide", "Panthenol", "Tocopheryl Acetate",
        "Benzyl Alcohol", "Triethylene Glycol", "Propylene Glycol",
        "Ci 42090", "Ci 17200",
    ],
}

TEST_PROFILE = {
    "id": str(uuid4()),
    "display_name": "Test User",
    "age_range": "25_34",
    "gender": "female",
    "skin_type": "sensitive",
    "skin_goals": ["hydration", "less_sensitivity"],
    "allergies": [],
    "life_stage": "none",
    "onboarding_complete": True,
}


def _get_db():
    """Return a live Supabase client."""
    from supabase import create_client
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def _make_product_out(db) -> "ProductOut":
    """Insert the H&S product into the DB and return a ProductOut."""
    from schemas.product import ProductOut

    row = db.table("products").insert({
        "name": HS_PRODUCT["name"],
        "brand": HS_PRODUCT["brand"],
        "ingredients_raw": ", ".join(HS_PRODUCT["ingredients_parsed"]),
        "ingredients_parsed": HS_PRODUCT["ingredients_parsed"],
        "category_slug": "shampoo",
        "source": "user_paste",
    }).execute()
    return ProductOut(**row.data[0])


# ── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def db():
    return _get_db()


@pytest.fixture(scope="module")
def bus():
    return EventBus()


@pytest.fixture(scope="module")
def product(db):
    p = _make_product_out(db)
    yield p
    # cleanup
    db.table("products").delete().eq("id", str(p.id)).execute()


@pytest.fixture(scope="module")
def profile():
    from schemas.profile import ProfileOut
    return ProfileOut(**TEST_PROFILE)


# ── 1. LLM Client — raw classify call ───────────────────────────────────────

@pytest.mark.asyncio
async def test_llm_classify_sls():
    """Verify Gemini can classify SLS as concerning."""
    from services.llm.prompts import SCANNER_PROMPT
    result = await llm_client.classify_ingredient("Sodium Lauryl Sulfate", SCANNER_PROMPT)

    print(f"\n[LLM classify] SLS → {result}")
    assert isinstance(result, dict)
    assert result["is_concerning"] is True
    assert len(result["hazard_tags"]) > 0


@pytest.mark.asyncio
async def test_llm_classify_aqua():
    """Aqua (water) should NOT be flagged."""
    from services.llm.prompts import SCANNER_PROMPT
    result = await llm_client.classify_ingredient("Aqua", SCANNER_PROMPT)

    print(f"\n[LLM classify] Aqua → {result}")
    assert isinstance(result, dict)
    assert result["is_concerning"] is False


# ── 2. Scanner Agent ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_scanner_agent(bus, db, product):
    """Scanner should flag at least SLS and Parfum from H&S ingredients."""
    from services.agents.scanner import ScannerAgent
    from schemas.agent import ScannerInput

    agent = ScannerAgent(bus, db)
    result = await agent.run(ScannerInput(product=product))

    flagged_names = [f.inci_name.lower() for f in result.flagged]
    print(f"\n[Scanner] Flagged {len(result.flagged)} ingredients: {flagged_names}")

    assert len(result.flagged) > 0
    assert result.product_id == product.id
    # SLS is a well-known irritant — should always be flagged
    assert any("sulfate" in n for n in flagged_names), "Expected at least one sulfate to be flagged"


# ── 3. Profile Reasoner Agent ────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_profile_reasoner_agent(bus, db, product, profile):
    """Profile Reasoner should rank flagged ingredients by relevance to the user."""
    from services.agents.scanner import ScannerAgent
    from services.agents.profile_reasoner import ProfileReasonerAgent
    from schemas.agent import ScannerInput, ProfileReasonerInput

    scanner = ScannerAgent(bus, db)
    scan = await scanner.run(ScannerInput(product=product))
    print(f"\n[ProfileReasoner] Scanner found {len(scan.flagged)} flagged items")

    if not scan.flagged:
        pytest.skip("Scanner found nothing to rank")

    reasoner = ProfileReasonerAgent(bus, db)
    result = await reasoner.run(ProfileReasonerInput(profile=profile, scans=[scan]))

    print(f"[ProfileReasoner] Ranked {len(result.flagged)} items:")
    for r in result.flagged:
        print(f"  {r.relevance}: {r.reason[:80]}")

    assert len(result.flagged) > 0
    assert all(r.relevance in ("high", "medium", "low") for r in result.flagged)


# ── 4. Analogy Writer Agent ──────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_analogy_writer_agent(bus, db, profile):
    """Analogy Writer should produce an analogy for SLS + hydration goal."""
    from services.agents.analogy_writer import AnalogyWriterAgent
    from schemas.agent import AnalogyWriterInput

    # Look up SLS from the DB
    rows = db.table("ingredients").select("*").ilike("inci_name", "Sodium Lauryl Sulfate").execute().data
    if not rows:
        pytest.skip("SLS not in ingredients table — seed data missing")

    from schemas.ingredient import IngredientOut
    ingredient = IngredientOut(**rows[0])

    agent = AnalogyWriterAgent(bus, db)
    result = await agent.run(AnalogyWriterInput(
        ingredient=ingredient, profile=profile, goal_slug="hydration",
    ))

    print(f"\n[AnalogyWriter] one-liner: {result.analogy_one_liner}")
    print(f"[AnalogyWriter] source: {result.source}, fact_check: {result.fact_check_passed}")
    print(f"[AnalogyWriter] explanation: {result.full_explanation[:200]}")

    assert result.full_explanation
    assert result.source in ("curated", "llm")
    # Banned words must never appear
    for banned in ("TOXIC", "POISON", "AVOID AT ALL COSTS"):
        assert banned not in (result.full_explanation or "").upper()
        assert banned not in (result.analogy_one_liner or "").upper()


# ── 5. Alternative Finder Agent ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_alternative_finder_agent(bus, db, profile):
    """Alternative Finder should suggest shampoo swaps for sensitive skin."""
    from services.agents.alternative_finder import AlternativeFinderAgent
    from schemas.agent import AlternativeFinderInput

    agent = AlternativeFinderAgent(bus, db)
    result = await agent.run(AlternativeFinderInput(
        category_slug="shampoo",
        avoid_tags=["irritant", "drying"],
        profile=profile,
    ))

    print(f"\n[AltFinder] Found {len(result.alternatives)} alternatives:")
    for alt in result.alternatives:
        print(f"  {alt.brand} — {alt.product_name} (reason: {alt.reason})")

    assert len(result.alternatives) > 0


# ── 6. Regulatory Xref Agent ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_regulatory_xref_agent(bus, db):
    """Regulatory Xref should find bans for known-banned ingredients."""
    from services.agents.regulatory_xref import RegulatoryXrefAgent
    from schemas.agent import RegulatoryXrefInput

    # Grab ingredient IDs that have bans
    ban_rows = db.table("bans").select("ingredient_id").limit(5).execute().data
    if not ban_rows:
        pytest.skip("No bans in DB — seed data missing")

    ids = list({r["ingredient_id"] for r in ban_rows})
    agent = RegulatoryXrefAgent(bus, db)
    result = await agent.run(RegulatoryXrefInput(
        ingredient_ids=[__import__("uuid").UUID(i) for i in ids]
    ))

    print(f"\n[RegXref] Found {len(result.bans)} bans:")
    for b in result.bans:
        print(f"  {b.region}: {b.reason or 'no reason'}")

    assert len(result.bans) > 0


# ── 7. Full Orchestrator Pipeline ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_orchestrator_full_pipeline(bus, db, product, profile):
    """End-to-end: orchestrator runs all 5 agents on H&S Classic."""
    from services.agents.orchestrator import OrchestratorAgent

    collected_events: list[str] = []
    original_emit = bus.emit

    async def _capture_emit(event, data):
        collected_events.append(event)
        print(f"  [SSE] {event}: {data}")
        await original_emit(event, data)

    bus.emit = _capture_emit  # type: ignore[assignment]

    agent = OrchestratorAgent(bus, db)
    results = await agent.run_from_rows(
        analysis_id=str(uuid4()),
        profile_row=profile.model_dump(mode="json"),
        product_rows=[{"product": product.model_dump(mode="json")}],
    )

    bus.emit = original_emit  # restore

    print(f"\n[Orchestrator] Produced {len(results)} product analyses")
    for pa in results:
        print(f"  Product: {pa['product']['name']}")
        print(f"  Flagged: {len(pa['flagged'])} ingredients")
        for fi in pa["flagged"][:3]:
            print(f"    - {fi['inci_name']} ({fi['relevance']}): {fi.get('analogy_one_liner', 'n/a')}")
        print(f"  Alternatives: {len(pa.get('alternatives', []))}")

    # The pipeline should have emitted events for each stage
    assert "scanner.done" in collected_events
    assert "profile_reasoner.done" in collected_events

    # Should produce at least one product analysis with flagged ingredients
    if results:
        assert len(results[0]["flagged"]) > 0
        # Verify structure
        fi = results[0]["flagged"][0]
        assert "inci_name" in fi
        assert "relevance" in fi
        assert "reason" in fi
