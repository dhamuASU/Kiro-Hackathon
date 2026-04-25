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


def _db_rows(rows: list[dict]) -> MagicMock:
    db = MagicMock()
    db.table.return_value.select.return_value.ilike.return_value.execute.return_value.data = rows
    return db


@pytest.fixture
def bus():
    return EventBus()


async def test_db_hit_with_hazard_tags_flagged(bus):
    iid = str(uuid4())
    db = _db_rows([{"id": iid, "inci_name": "Sodium Lauryl Sulfate", "hazard_tags": ["irritant"]}])
    out = await ScannerAgent(bus, db).run(ScannerInput(product=_product(["Sodium Lauryl Sulfate"])))
    assert len(out.flagged) == 1
    assert out.flagged[0].known_in_db is True
    assert out.flagged[0].hazard_tags == ["irritant"]


async def test_db_hit_no_hazard_tags_not_flagged(bus):
    db = _db_rows([{"id": str(uuid4()), "inci_name": "Aqua", "hazard_tags": []}])
    out = await ScannerAgent(bus, db).run(ScannerInput(product=_product(["Aqua"])))
    assert len(out.flagged) == 0


async def test_llm_fallback_concerning(bus):
    db = _db_rows([])
    with patch(
        "services.agents.scanner.llm_client.classify_ingredient",
        new=AsyncMock(return_value={"is_concerning": True, "hazard_tags": ["sensitizer"]}),
    ):
        out = await ScannerAgent(bus, db).run(ScannerInput(product=_product(["UnknownChem"])))
    assert len(out.flagged) == 1
    assert out.flagged[0].known_in_db is False


async def test_llm_fallback_not_concerning(bus):
    db = _db_rows([])
    with patch(
        "services.agents.scanner.llm_client.classify_ingredient",
        new=AsyncMock(return_value={"is_concerning": False, "hazard_tags": []}),
    ):
        out = await ScannerAgent(bus, db).run(ScannerInput(product=_product(["SafeIngredient"])))
    assert len(out.flagged) == 0


async def test_preserves_position(bus):
    iid = str(uuid4())
    db = MagicMock()
    db.table.return_value.select.return_value.ilike.return_value.execute.side_effect = [
        MagicMock(data=[]),  # Aqua — not in DB
        MagicMock(data=[{"id": iid, "inci_name": "SLS", "hazard_tags": ["irritant"]}]),  # SLS
    ]
    with patch(
        "services.agents.scanner.llm_client.classify_ingredient",
        new=AsyncMock(return_value={"is_concerning": False, "hazard_tags": []}),
    ):
        out = await ScannerAgent(bus, db).run(ScannerInput(product=_product(["Aqua", "SLS"])))
    assert out.flagged[0].position == 1
