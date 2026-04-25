"""Tests for OrchestratorAgent — all sub-agents mocked."""
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from schemas.agent import (
    AlternativeFinderOutput,
    AnalogyWriterOutput,
    ProfileReasonerOutput,
    RankedFlaggedItem,
    RegulatoryXrefOutput,
    ScannerOutput,
    FlaggedItem,
)
from schemas.product import ProductOut
from services.agents.orchestrator import OrchestratorAgent
from services.events import EventBus


def _product(pid=None) -> ProductOut:
    return ProductOut(
        id=pid or uuid4(), name="Test Product",
        category_slug="cleanser", ingredients_parsed=["SLS"],
    )


def _profile_row(pid=None) -> dict:
    return {
        "id": str(pid or uuid4()), "age_range": "25_34", "gender": "female",
        "skin_type": "dry", "skin_goals": ["hydration"],
        "allergies": [], "life_stage": "none", "onboarding_complete": True,
        "display_name": None,
    }


@pytest.fixture
def bus():
    return EventBus()


async def test_empty_products_returns_empty(bus):
    db = MagicMock()
    orch = OrchestratorAgent(bus, db)
    result = await orch.run_from_rows("aid", _profile_row(), [])
    assert result == []


async def test_all_done_events_emitted(bus):
    pid = uuid4()
    iid = uuid4()
    product = _product(pid)

    scanner_out = ScannerOutput(
        product_id=pid,
        flagged=[FlaggedItem(inci_name="SLS", position=0, hazard_tags=["irritant"], known_in_db=True)],
    )
    reasoner_out = ProfileReasonerOutput(
        flagged=[RankedFlaggedItem(ingredient_id=iid, product_id=pid, relevance="high", reason="drying")],
        flagged_products=[product],
    )
    analogy_out = AnalogyWriterOutput(
        analogy_one_liner="SLS is like dish soap",
        full_explanation="strips oils",
        source="curated",
        fact_check_passed=True,
    )
    alt_out = AlternativeFinderOutput(alternatives=[])
    xref_out = RegulatoryXrefOutput(bans=[])

    db = MagicMock()
    # ingredient lookup for analogy writer
    db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
        {
            "id": str(iid), "inci_name": "SLS", "plain_english": "surfactant",
            "hazard_tags": ["irritant"], "goals_against": [], "bad_for_skin_types": [],
            "common_name": None, "cas_number": None, "category": None,
            "function_short": None, "dose_notes": None,
        }
    ]

    emitted = []

    async def fake_emit(event, data):
        emitted.append(event)

    orch = OrchestratorAgent(bus, db)
    orch.emit = fake_emit

    with (
        patch.object(orch.scanner, "run", new=AsyncMock(return_value=scanner_out)),
        patch.object(orch.profile_reasoner, "run", new=AsyncMock(return_value=reasoner_out)),
        patch.object(orch.analogy_writer, "run", new=AsyncMock(return_value=analogy_out)),
        patch.object(orch.alternative_finder, "run", new=AsyncMock(return_value=alt_out)),
        patch.object(orch.regulatory_xref, "run", new=AsyncMock(return_value=xref_out)),
    ):
        result = await orch.run_from_rows(
            "aid",
            _profile_row(),
            [{"product": product.model_dump(mode="json")}],
        )

    assert "scanner.done" in emitted
    assert "profile_reasoner.done" in emitted
    assert "analogy_writer.done" in emitted
    assert "alternative_finder.done" in emitted
    assert "regulatory_xref.done" in emitted
    assert emitted.index("scanner.done") < emitted.index("profile_reasoner.done")

    assert len(result) == 1
    assert result[0]["flagged"][0]["relevance"] == "high"
    assert result[0]["flagged"][0]["analogy_one_liner"] == "SLS is like dish soap"


async def test_fact_check_failed_analogy_suppressed(bus):
    pid = uuid4()
    iid = uuid4()
    product = _product(pid)

    scanner_out = ScannerOutput(
        product_id=pid,
        flagged=[FlaggedItem(inci_name="SLS", position=0, hazard_tags=["irritant"], known_in_db=True)],
    )
    reasoner_out = ProfileReasonerOutput(
        flagged=[RankedFlaggedItem(ingredient_id=iid, product_id=pid, relevance="high", reason="drying")],
        flagged_products=[product],
    )
    analogy_out = AnalogyWriterOutput(
        analogy_one_liner=None, full_explanation="...", source="llm", fact_check_passed=False
    )

    db = MagicMock()
    db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
        {
            "id": str(iid), "inci_name": "SLS", "plain_english": "surfactant",
            "hazard_tags": ["irritant"], "goals_against": [], "bad_for_skin_types": [],
            "common_name": None, "cas_number": None, "category": None,
            "function_short": None, "dose_notes": None,
        }
    ]

    orch = OrchestratorAgent(bus, db)
    orch.emit = AsyncMock()

    with (
        patch.object(orch.scanner, "run", new=AsyncMock(return_value=scanner_out)),
        patch.object(orch.profile_reasoner, "run", new=AsyncMock(return_value=reasoner_out)),
        patch.object(orch.analogy_writer, "run", new=AsyncMock(return_value=analogy_out)),
        patch.object(orch.alternative_finder, "run", new=AsyncMock(return_value=AlternativeFinderOutput(alternatives=[]))),
        patch.object(orch.regulatory_xref, "run", new=AsyncMock(return_value=RegulatoryXrefOutput(bans=[]))),
    ):
        result = await orch.run_from_rows(
            "aid", _profile_row(), [{"product": product.model_dump(mode="json")}]
        )

    assert result[0]["flagged"][0]["analogy_one_liner"] is None
