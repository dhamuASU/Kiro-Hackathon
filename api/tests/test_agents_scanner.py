"""Tests for ScannerAgent."""
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from schemas.agent import ScannerInput
from schemas.product import ProductOut
from services.agents.scanner import ScannerAgent
from services.events import EventBus


def _product(ingredients: list[str]) -> ProductOut:
    return ProductOut(id=uuid4(), name="Test Product", ingredients_parsed=ingredients)


def _db_with_rows(rows: list[dict]) -> MagicMock:
    """Mock the batched `or_(...).execute()` path used by ScannerAgent."""
    db = MagicMock()
    db.table.return_value.select.return_value.or_.return_value.execute.return_value.data = rows
    return db


@pytest.fixture
def bus():
    return EventBus()


async def test_db_hit_with_hazard_tags_flagged(bus):
    iid = str(uuid4())
    db = _db_with_rows([{"id": iid, "inci_name": "Sodium Lauryl Sulfate", "hazard_tags": ["irritant"]}])
    out = await ScannerAgent(bus, db).run(ScannerInput(product=_product(["Sodium Lauryl Sulfate"])))
    assert len(out.flagged) == 1
    assert out.flagged[0].known_in_db is True
    assert out.flagged[0].hazard_tags == ["irritant"]


async def test_db_hit_no_hazard_tags_not_flagged(bus):
    db = _db_with_rows([{"id": str(uuid4()), "inci_name": "Aqua", "hazard_tags": []}])
    out = await ScannerAgent(bus, db).run(ScannerInput(product=_product(["Aqua"])))
    assert len(out.flagged) == 0


async def test_unknown_unbanned_not_flagged(bus):
    """Unknown ingredients that are NOT in EU banned list are skipped — no LLM call."""
    db = _db_with_rows([])
    with patch(
        "services.agents.scanner.is_banned", return_value=False,
    ), patch(
        "services.agents.scanner.llm_client.classify_ingredient",
        new=AsyncMock(side_effect=AssertionError("LLM should not be called")),
    ):
        out = await ScannerAgent(bus, db).run(ScannerInput(product=_product(["UnknownSafeChem"])))
    assert len(out.flagged) == 0


async def test_unknown_banned_calls_llm(bus):
    db = _db_with_rows([])
    with patch(
        "services.agents.scanner.is_banned", return_value=True,
    ), patch(
        "services.agents.scanner.llm_client.classify_ingredient",
        new=AsyncMock(return_value={"is_concerning": True, "hazard_tags": ["sensitizer"]}),
    ):
        out = await ScannerAgent(bus, db).run(ScannerInput(product=_product(["BannedChem"])))
    assert len(out.flagged) == 1
    assert out.flagged[0].known_in_db is False
    assert "sensitizer" in out.flagged[0].hazard_tags


async def test_preserves_position(bus):
    """When DB knows ingredient #1 but not ingredient #0, position must reflect original list."""
    iid = str(uuid4())
    db = _db_with_rows([{"id": iid, "inci_name": "SLS", "hazard_tags": ["irritant"]}])
    out = await ScannerAgent(bus, db).run(ScannerInput(product=_product(["Aqua", "SLS"])))
    assert len(out.flagged) == 1
    assert out.flagged[0].position == 1
    assert out.flagged[0].inci_name == "SLS"
