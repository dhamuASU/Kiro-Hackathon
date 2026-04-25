"""Products router — search, common, resolve."""
from unittest.mock import AsyncMock

import pytest

from services.llm import client as llm_module
from tests.conftest import make_product_row


# ── /search ──────────────────────────────────────────────────────────────────

def test_search_requires_min_length_q(client):
    resp = client.get("/api/products/search?q=a")
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "VALIDATION_ERROR"


def test_search_returns_products_from_cache(client, fake_db):
    fake_db.program([
        make_product_row(name="Hydro Boost"),
        make_product_row(name="Hydro Surge"),
    ])
    resp = client.get("/api/products/search?q=Hydro")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["results"]) == 2
    assert body["results"][0]["name"].startswith("Hydro")


def test_search_with_category_filter_passes_through(client, fake_db):
    fake_db.program([make_product_row(category_slug="moisturizer")])
    resp = client.get("/api/products/search?q=Moisture&category_slug=moisturizer")
    assert resp.status_code == 200
    assert resp.json()["results"][0]["category_slug"] == "moisturizer"


# ── /common ──────────────────────────────────────────────────────────────────

def test_common_requires_category_slug(client):
    resp = client.get("/api/products/common")
    assert resp.status_code == 422


def test_common_returns_seeded_top_50(client, fake_db):
    fake_db.program([make_product_row(popularity=p) for p in (100, 95, 90)])
    resp = client.get("/api/products/common?category_slug=shampoo")
    assert resp.status_code == 200
    assert len(resp.json()["results"]) == 3


# ── /resolve ─────────────────────────────────────────────────────────────────

@pytest.fixture
def patch_llm_resolve(monkeypatch):
    """Patch the LLM resolve_product method on the singleton."""
    mock = AsyncMock()
    monkeypatch.setattr(llm_module.llm_client, "resolve_product", mock)
    return mock


def test_resolve_high_confidence_persists_with_no_warning(
    client, fake_db, patch_llm_resolve,
):
    patch_llm_resolve.return_value = {
        "ingredients_parsed": ["Aqua", "Glycerin", "Sodium Hyaluronate"],
        "confidence": 0.91,
        "image_url": "https://example.com/img.jpg",
    }
    persisted = make_product_row(
        name="Coconut Vanilla Deodorant",
        brand="Native",
        category_slug="deodorant",
        source="llm_resolved",
        ingredients_parsed=["Aqua", "Glycerin", "Sodium Hyaluronate"],
    )
    fake_db.program([persisted])

    resp = client.post(
        "/api/products/resolve",
        json={"brand": "Native", "name": "Coconut Vanilla Deodorant", "category_slug": "deodorant"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["confidence"] == pytest.approx(0.91)
    assert body["warning"] is None
    assert body["product"]["source"] == "llm_resolved"
    patch_llm_resolve.assert_awaited_once()


def test_resolve_low_confidence_attaches_warning(
    client, fake_db, patch_llm_resolve,
):
    patch_llm_resolve.return_value = {
        "ingredients_parsed": ["Aqua"],
        "confidence": 0.4,
    }
    fake_db.program([make_product_row(source="llm_resolved")])

    resp = client.post(
        "/api/products/resolve",
        json={"brand": "Obscure Co", "name": "Mystery Goo", "category_slug": "lip_balm"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["warning"] is not None
    assert "verify" in body["warning"].lower()


def test_resolve_handles_missing_optional_keys(
    client, fake_db, patch_llm_resolve,
):
    """If the LLM returns no `ingredients_parsed` and no `confidence`, the
    route must still produce a valid response."""
    patch_llm_resolve.return_value = {}
    fake_db.program([make_product_row(source="llm_resolved", ingredients_parsed=[])])

    resp = client.post(
        "/api/products/resolve",
        json={"brand": "?", "name": "?", "category_slug": "shampoo"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["confidence"] == 0.0
    assert body["warning"]  # below 0.7 → warn
