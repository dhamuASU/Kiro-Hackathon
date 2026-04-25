"""Open Beauty Facts service — cache-first lookup with httpx fallback."""
from typing import Any

import httpx
import pytest

from services import open_beauty_facts as obf
from tests.conftest import FakeSupabase, make_product_row


# ── lookup_barcode ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_lookup_barcode_returns_cached_when_off_id_present():
    db = FakeSupabase()
    cached = make_product_row(off_id="3600523417865")
    # supabase-py `.maybe_single().execute()` returns `.data` dict (not list)
    db.program(cached)

    product = await obf.lookup_barcode("3600523417865", db)
    assert product is not None
    assert str(product.off_id) == "3600523417865"
    # Should NOT have hit OBF — only one .execute() call (the cache check)
    assert db.execute_count == 1


@pytest.mark.asyncio
async def test_lookup_barcode_falls_through_to_obf_on_cache_miss(monkeypatch):
    db = FakeSupabase()
    # First execute (cache check) returns None → miss
    # Second execute (upsert) returns the inserted row
    fresh = make_product_row(off_id="9999")
    db.program(None, [fresh])

    class _FakeResp:
        status_code = 200
        def json(self) -> dict[str, Any]:
            return {
                "product": {
                    "product_name": "Mystery Cream",
                    "brands": "MysteryCo",
                    "ingredients_text": "Aqua, Glycerin, Sodium Hyaluronate",
                    "image_url": "https://example.com/x.jpg",
                }
            }

    class _FakeClient:
        def __init__(self, *_a, **_kw): ...
        async def __aenter__(self): return self
        async def __aexit__(self, *_a): return False
        async def get(self, *_a, **_kw): return _FakeResp()

    monkeypatch.setattr(httpx, "AsyncClient", _FakeClient)

    product = await obf.lookup_barcode("9999", db)
    assert product is not None
    assert db.execute_count == 2  # one read + one upsert


@pytest.mark.asyncio
async def test_lookup_barcode_returns_none_on_obf_404(monkeypatch):
    db = FakeSupabase()
    db.program(None)  # cache miss

    class _FakeResp:
        status_code = 404
        def json(self): return {}

    class _FakeClient:
        def __init__(self, *_a, **_kw): ...
        async def __aenter__(self): return self
        async def __aexit__(self, *_a): return False
        async def get(self, *_a, **_kw): return _FakeResp()

    monkeypatch.setattr(httpx, "AsyncClient", _FakeClient)

    assert await obf.lookup_barcode("0000000000000", db) is None
    # Only one execute (the cache-miss read). No upsert when nothing was found.
    assert db.execute_count == 1


@pytest.mark.asyncio
async def test_lookup_barcode_returns_none_when_obf_has_no_product_field(monkeypatch):
    db = FakeSupabase()
    db.program(None)  # cache miss

    class _FakeResp:
        status_code = 200
        def json(self): return {"product": None}

    class _FakeClient:
        def __init__(self, *_a, **_kw): ...
        async def __aenter__(self): return self
        async def __aexit__(self, *_a): return False
        async def get(self, *_a, **_kw): return _FakeResp()

    monkeypatch.setattr(httpx, "AsyncClient", _FakeClient)

    assert await obf.lookup_barcode("0000000000000", db) is None
