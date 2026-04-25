"""Tests for ProfileReasonerAgent."""
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from schemas.agent import FlaggedItem, ProfileReasonerInput, ScannerOutput
from schemas.profile import ProfileOut
from services.agents.profile_reasoner import ProfileReasonerAgent
from services.events import EventBus


def _profile() -> ProfileOut:
    return ProfileOut(
        id=uuid4(), age_range="25_34", gender="female",
        skin_type="dry", skin_goals=["hydration"], onboarding_complete=True,
    )


def _scan(product_id, flagged_items) -> ScannerOutput:
    return ScannerOutput(product_id=product_id, flagged=flagged_items)


def _flagged(inci_name="SLS", position=0) -> FlaggedItem:
    return FlaggedItem(inci_name=inci_name, position=position, hazard_tags=["irritant"], known_in_db=True)


@pytest.fixture
def bus():
    return EventBus()


async def test_empty_scans_returns_empty(bus):
    db = MagicMock()
    out = await ProfileReasonerAgent(bus, db).run(
        ProfileReasonerInput(profile=_profile(), scans=[])
    )
    assert out.flagged == []
    assert out.flagged_products == []


async def test_ranked_items_resolved(bus):
    pid = uuid4()
    iid = uuid4()
    scan = _scan(pid, [_flagged("Sodium Lauryl Sulfate")])

    db = MagicMock()
    # DB lookup for ingredient resolution
    db.table.return_value.select.return_value.ilike.return_value.execute.return_value.data = [
        {"id": str(iid)}
    ]
    # DB lookup for product
    db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
        {"id": str(pid), "name": "Test Product", "ingredients_parsed": [], "source": "open_beauty_facts", "popularity": 0}
    ]

    ranked_raw = [{"inci_name": "Sodium Lauryl Sulfate", "product_id": str(pid), "relevance": "high", "reason": "drying"}]
    with patch("services.agents.profile_reasoner.llm_client.rank_ingredients",
               new=AsyncMock(return_value=ranked_raw)):
        out = await ProfileReasonerAgent(bus, db).run(
            ProfileReasonerInput(profile=_profile(), scans=[scan])
        )

    assert len(out.flagged) == 1
    assert out.flagged[0].relevance == "high"
    assert len(out.flagged_products) == 1


async def test_unresolvable_ingredient_skipped(bus):
    pid = uuid4()
    scan = _scan(pid, [_flagged("UnknownChem")])

    db = MagicMock()
    db.table.return_value.select.return_value.ilike.return_value.execute.return_value.data = []

    ranked_raw = [{"inci_name": "UnknownChem", "product_id": str(pid), "relevance": "low", "reason": "unknown"}]
    with patch("services.agents.profile_reasoner.llm_client.rank_ingredients",
               new=AsyncMock(return_value=ranked_raw)):
        out = await ProfileReasonerAgent(bus, db).run(
            ProfileReasonerInput(profile=_profile(), scans=[scan])
        )

    assert out.flagged == []
    assert out.flagged_products == []


async def test_flagged_products_deduplicated(bus):
    pid = uuid4()
    iid = uuid4()
    # Two flagged items from the same product
    scan = _scan(pid, [_flagged("SLS", 0), _flagged("Parabens", 1)])

    db = MagicMock()
    db.table.return_value.select.return_value.ilike.return_value.execute.return_value.data = [
        {"id": str(iid)}
    ]
    db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
        {"id": str(pid), "name": "Test Product", "ingredients_parsed": [], "source": "open_beauty_facts", "popularity": 0}
    ]

    ranked_raw = [
        {"inci_name": "SLS", "product_id": str(pid), "relevance": "high", "reason": "r1"},
        {"inci_name": "Parabens", "product_id": str(pid), "relevance": "medium", "reason": "r2"},
    ]
    with patch("services.agents.profile_reasoner.llm_client.rank_ingredients",
               new=AsyncMock(return_value=ranked_raw)):
        out = await ProfileReasonerAgent(bus, db).run(
            ProfileReasonerInput(profile=_profile(), scans=[scan])
        )

    assert len(out.flagged_products) == 1  # deduplicated
