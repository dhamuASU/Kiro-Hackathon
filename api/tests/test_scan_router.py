"""Scan router — barcode and label OCR paths."""
import base64

import pytest

from tests.conftest import make_product_row


# ── helpers ──────────────────────────────────────────────────────────────────

VALID_B64 = base64.b64encode(b"\xff\xd8\xff\xe0fake-jpeg-bytes").decode()


# ── /scan/barcode ────────────────────────────────────────────────────────────

def test_barcode_matched_returns_product(client, fake_db, monkeypatch):
    """The router does `from services.open_beauty_facts import lookup_barcode`,
    so the function is bound into `routers.scan` at import time. Patch there."""
    matched = make_product_row(off_id="3600523417865")
    from schemas.product import ProductOut

    async def lookup(barcode, db):
        return ProductOut(**matched)

    monkeypatch.setattr("routers.scan.lookup_barcode", lookup)

    resp = client.post(
        "/api/scan/barcode",
        json={"barcode": "3600523417865", "category_hint": "shampoo"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["matched"] is True
    assert body["product"]["off_id"] == "3600523417865"


def test_barcode_unmatched_returns_hint(client, fake_db, monkeypatch):
    async def lookup(barcode, db):
        return None

    monkeypatch.setattr("routers.scan.lookup_barcode", lookup)

    resp = client.post(
        "/api/scan/barcode",
        json={"barcode": "9999999999999"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["matched"] is False
    assert body["barcode"] == "9999999999999"
    assert "Open Beauty Facts" in body["hint"] or "back" in body["hint"]


def test_barcode_short_value_rejected(client):
    resp = client.post("/api/scan/barcode", json={"barcode": "123"})
    assert resp.status_code == 422


# ── /scan/label common validation ────────────────────────────────────────────

def test_label_rejects_invalid_base64(client):
    resp = client.post(
        "/api/scan/label",
        json={"image_base64": "!!! not base64 !!!", "mode": "back"},
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "VALIDATION_ERROR"


def test_label_rejects_oversized_image(client):
    huge = "A" * (15 * 1024 * 1024)
    resp = client.post(
        "/api/scan/label",
        json={"image_base64": huge, "mode": "back"},
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "VALIDATION_ERROR"


def test_label_invalid_mode_is_422(client):
    resp = client.post(
        "/api/scan/label",
        json={"image_base64": VALID_B64, "mode": "side"},
    )
    assert resp.status_code == 422


def test_label_llm_failure_wraps_to_502(client, monkeypatch):
    async def boom(_b64, _mode):
        raise RuntimeError("vision model exploded")

    monkeypatch.setattr("routers.scan.extract_label", boom)

    resp = client.post(
        "/api/scan/label",
        json={"image_base64": VALID_B64, "mode": "back"},
    )
    assert resp.status_code == 502
    assert resp.json()["error"]["code"] == "LLM_FAILURE"


# ── /scan/label mode=back ────────────────────────────────────────────────────

def test_label_back_high_confidence_persists_product(client, fake_db, monkeypatch):
    async def fake_extract(_b64, _mode):
        return {
            "ingredients_raw": "Aqua, Sodium Lauryl Sulfate, Glycerin",
            "ingredients_parsed": ["Aqua", "Sodium Lauryl Sulfate", "Glycerin"],
            "confidence": 0.85,
        }
    monkeypatch.setattr("routers.scan.extract_label", fake_extract)

    fake_db.program([
        make_product_row(
            name="Scanned product (back label)",
            ingredients_parsed=["Aqua", "Sodium Lauryl Sulfate", "Glycerin"],
            source="user_paste",
        )
    ])

    resp = client.post(
        "/api/scan/label",
        json={"image_base64": VALID_B64, "mode": "back", "category_hint": "shampoo"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["mode"] == "back"
    assert body["confidence"] == pytest.approx(0.85)
    assert body["product"] is not None
    assert body["product"]["source"] == "user_paste"


def test_label_back_low_confidence_does_not_persist(client, fake_db, monkeypatch):
    async def fake_extract(_b64, _mode):
        return {
            "ingredients_raw": "blurry text",
            "ingredients_parsed": ["blurry text"],
            "confidence": 0.3,
        }
    monkeypatch.setattr("routers.scan.extract_label", fake_extract)

    resp = client.post(
        "/api/scan/label",
        json={"image_base64": VALID_B64, "mode": "back"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["product"] is None
    assert body["confidence"] == pytest.approx(0.3)
    # Must not have called insert
    assert fake_db.execute_count == 0


# ── /scan/label mode=front ───────────────────────────────────────────────────

def test_label_front_returns_sorted_match_candidates(client, fake_db, monkeypatch):
    async def fake_extract(_b64, _mode):
        return {"brand": "Head & Shoulders", "product_name": "Classic Clean", "confidence": 0.9}
    monkeypatch.setattr("routers.scan.extract_label", fake_extract)

    # Pre-program the candidate-search row set
    fake_db.program([
        make_product_row(name="Head & Shoulders Classic Clean Shampoo", brand="Head & Shoulders"),
        make_product_row(name="Pantene Pro-V", brand="Pantene"),
    ])

    resp = client.post(
        "/api/scan/label",
        json={"image_base64": VALID_B64, "mode": "front", "category_hint": "shampoo"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["mode"] == "front"
    assert body["extracted"]["brand"] == "Head & Shoulders"
    assert len(body["matches"]) == 2
    # The Head & Shoulders row should outrank Pantene
    assert body["matches"][0]["match_score"] >= body["matches"][1]["match_score"]


def test_label_front_with_no_extracted_fields_returns_empty_matches(client, fake_db, monkeypatch):
    async def fake_extract(_b64, _mode):
        return {"brand": "", "product_name": "", "confidence": 0.1}
    monkeypatch.setattr("routers.scan.extract_label", fake_extract)

    resp = client.post(
        "/api/scan/label",
        json={"image_base64": VALID_B64, "mode": "front"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["matches"] == []
