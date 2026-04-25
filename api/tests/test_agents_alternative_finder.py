"""Tests for AlternativeFinderAgent."""
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from schemas.agent import AlternativeFinderInput
from schemas.profile import ProfileOut
from services.agents.alternative_finder import AlternativeFinderAgent
from services.events import EventBus


def _profile(skin_type="dry", goals=None) -> ProfileOut:
    return ProfileOut(
        id=uuid4(), age_range="25_34", gender="female",
        skin_type=skin_type, skin_goals=goals or ["hydration"], onboarding_complete=True,
    )


def _alt_row(**kwargs) -> dict:
    base = {
        "id": str(uuid4()), "category_slug": "cleanser", "product_name": "Gentle Wash",
        "brand": "CeraVe", "free_of_tags": ["sls", "sulfates"],
        "good_for_skin_types": ["dry", "sensitive"], "good_for_goals": ["hydration"],
        "avg_price_usd": "12.99", "url": None, "image_url": None, "reason": "Gentle",
    }
    base.update(kwargs)
    return base


def _db(rows: list[dict]) -> MagicMock:
    db = MagicMock()
    db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = rows
    return db


@pytest.fixture
def bus():
    return EventBus()


async def test_curated_match(bus):
    out = await AlternativeFinderAgent(bus, _db([_alt_row()])).run(
        AlternativeFinderInput(category_slug="cleanser", avoid_tags=["sls"], profile=_profile())
    )
    assert len(out.alternatives) == 1
    assert out.alternatives[0].brand == "CeraVe"


async def test_avoid_tags_superset_required(bus):
    # Row only has "sls", but we need both "sls" and "parabens"
    with patch("services.agents.alternative_finder.llm_client.find_alternatives",
               new=AsyncMock(return_value=[])):
        out = await AlternativeFinderAgent(bus, _db([_alt_row(free_of_tags=["sls"])])).run(
            AlternativeFinderInput(category_slug="cleanser", avoid_tags=["sls", "parabens"], profile=_profile())
        )
    assert len(out.alternatives) == 0


async def test_skin_type_filter(bus):
    with patch("services.agents.alternative_finder.llm_client.find_alternatives",
               new=AsyncMock(return_value=[])):
        out = await AlternativeFinderAgent(bus, _db([_alt_row(good_for_skin_types=["oily"])])).run(
            AlternativeFinderInput(category_slug="cleanser", avoid_tags=[], profile=_profile(skin_type="dry"))
        )
    assert len(out.alternatives) == 0


async def test_llm_fallback(bus):
    llm_result = [{"name": "La Roche-Posay", "brand": "LRP", "price": "$18", "reason": "gentle"}]
    with patch("services.agents.alternative_finder.llm_client.find_alternatives",
               new=AsyncMock(return_value=llm_result)):
        out = await AlternativeFinderAgent(bus, _db([])).run(
            AlternativeFinderInput(category_slug="cleanser", avoid_tags=["sls"], profile=_profile())
        )
    assert len(out.alternatives) == 1
    assert out.alternatives[0].brand == "LRP"


async def test_goal_overlap_ranking(bus):
    row_a = _alt_row(product_name="A", good_for_goals=["hydration", "anti_aging"])
    row_b = _alt_row(product_name="B", good_for_goals=["reduce_acne"])
    out = await AlternativeFinderAgent(bus, _db([row_b, row_a])).run(
        AlternativeFinderInput(category_slug="cleanser", avoid_tags=[], profile=_profile(goals=["hydration"]))
    )
    assert out.alternatives[0].product_name == "A"
