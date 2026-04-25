"""Tests for AnalogyWriterAgent."""
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from schemas.agent import AnalogyWriterInput
from schemas.ingredient import IngredientOut
from schemas.profile import ProfileOut
from services.agents.analogy_writer import AnalogyWriterAgent
from services.events import EventBus


def _ingredient() -> IngredientOut:
    return IngredientOut(id=uuid4(), inci_name="Sodium Lauryl Sulfate", plain_english="harsh surfactant")


def _profile() -> ProfileOut:
    return ProfileOut(
        id=uuid4(), age_range="25_34", gender="female",
        skin_type="dry", skin_goals=["hydration"], onboarding_complete=True,
    )


def _inp() -> AnalogyWriterInput:
    return AnalogyWriterInput(ingredient=_ingredient(), profile=_profile(), goal_slug="hydration")


def _db_curated(goal_rows, generic_rows=None) -> MagicMock:
    db = MagicMock()
    db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = goal_rows
    db.table.return_value.select.return_value.eq.return_value.is_.return_value.execute.return_value.data = (
        generic_rows or []
    )
    return db


@pytest.fixture
def bus():
    return EventBus()


async def test_curated_goal_specific(bus):
    db = _db_curated([{"analogy_one_liner": "SLS is like dish soap", "full_explanation": "strips oils"}])
    out = await AnalogyWriterAgent(bus, db).run(_inp())
    assert out.source == "curated"
    assert out.fact_check_passed is True
    assert out.analogy_one_liner == "SLS is like dish soap"


async def test_curated_generic_fallback(bus):
    db = _db_curated([], [{"analogy_one_liner": "generic", "full_explanation": "generic exp"}])
    out = await AnalogyWriterAgent(bus, db).run(_inp())
    assert out.source == "curated"
    assert out.analogy_one_liner == "generic"


async def test_llm_clean_passes(bus):
    """No more 2-pass fact-check — a single LLM call returns and we accept if no banned words."""
    db = _db_curated([], [])
    with patch(
        "services.agents.analogy_writer.llm_client.write_analogy",
        new=AsyncMock(return_value={"analogy_one_liner": "SLS is like dish soap", "full_explanation": "..."}),
    ):
        out = await AnalogyWriterAgent(bus, db).run(_inp())
    assert out.source == "llm"
    assert out.fact_check_passed is True
    assert out.analogy_one_liner == "SLS is like dish soap"


async def test_llm_failure_returns_empty(bus):
    db = _db_curated([], [])
    with patch(
        "services.agents.analogy_writer.llm_client.write_analogy",
        new=AsyncMock(side_effect=RuntimeError("upstream timeout")),
    ):
        out = await AnalogyWriterAgent(bus, db).run(_inp())
    assert out.fact_check_passed is False
    assert out.analogy_one_liner is None


async def test_banned_word_rejected(bus):
    db = _db_curated([], [])
    with patch("services.agents.analogy_writer.llm_client.write_analogy",
               new=AsyncMock(return_value={"analogy_one_liner": "This is TOXIC!", "full_explanation": "..."})):
        out = await AnalogyWriterAgent(bus, db).run(_inp())
    assert out.fact_check_passed is False
    assert out.analogy_one_liner is None
