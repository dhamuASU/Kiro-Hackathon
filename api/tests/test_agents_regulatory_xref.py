"""Tests for RegulatoryXrefAgent."""
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from schemas.agent import RegulatoryXrefInput
from services.agents.regulatory_xref import RegulatoryXrefAgent
from services.events import EventBus


def _ban_row(ingredient_id: str) -> dict:
    return {
        "id": str(uuid4()),
        "ingredient_id": ingredient_id,
        "region": "EU",
        "status": "banned",
        "regulation_ref": "EC 1223/2009 Annex II",
        "source_url": None,
        "reason": "Carcinogen",
        "effective_date": None,
    }


@pytest.fixture
def bus():
    return EventBus()


async def test_empty_ids_short_circuits(bus):
    db = MagicMock()
    out = await RegulatoryXrefAgent(bus, db).run(RegulatoryXrefInput(ingredient_ids=[]))
    assert out.bans == []
    db.table.assert_not_called()


async def test_single_match(bus):
    iid = uuid4()
    db = MagicMock()
    db.table.return_value.select.return_value.in_.return_value.execute.return_value.data = [
        _ban_row(str(iid))
    ]
    out = await RegulatoryXrefAgent(bus, db).run(RegulatoryXrefInput(ingredient_ids=[iid]))
    assert len(out.bans) == 1
    assert out.bans[0].region == "EU"


async def test_multiple_matches(bus):
    ids = [uuid4(), uuid4()]
    db = MagicMock()
    db.table.return_value.select.return_value.in_.return_value.execute.return_value.data = [
        _ban_row(str(ids[0])),
        _ban_row(str(ids[1])),
    ]
    out = await RegulatoryXrefAgent(bus, db).run(RegulatoryXrefInput(ingredient_ids=ids))
    assert len(out.bans) == 2
