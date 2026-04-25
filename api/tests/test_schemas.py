"""Pydantic schema validation tests — the contract."""
from uuid import uuid4

import pytest
from pydantic import ValidationError

from schemas.product import (
    ProductOut,
    ProductResolveRequest,
    UserProductCreate,
)
from schemas.profile import ProfileCreate, ProfileUpdate
from schemas.scan import BarcodeScanRequest, LabelScanRequest


# ── Profile ──────────────────────────────────────────────────────────────────

def test_profile_create_minimum_required_fields():
    p = ProfileCreate(
        age_range="25_34",
        gender="female",
        skin_type="sensitive",
        skin_goals=["reduce_acne"],
    )
    assert p.allergies == []
    assert p.life_stage == "none"
    assert p.display_name is None


@pytest.mark.parametrize(
    "field,bad_value",
    [
        ("age_range", "30"),                # not in enum
        ("gender", "androgynous"),          # not in enum
        ("skin_type", "leathery"),          # not in enum
        ("life_stage", "expecting"),        # not in enum
        ("skin_goals", ["world_peace"]),    # not in enum
    ],
)
def test_profile_create_rejects_unknown_enum_values(field: str, bad_value):
    payload = {
        "age_range": "25_34",
        "gender": "female",
        "skin_type": "sensitive",
        "skin_goals": ["reduce_acne"],
    }
    payload[field] = bad_value
    with pytest.raises(ValidationError):
        ProfileCreate(**payload)


def test_profile_update_all_fields_optional():
    """ProfileUpdate is a partial — empty is valid."""
    p = ProfileUpdate()
    assert p.model_dump(exclude_none=True) == {}


def test_profile_update_partial_only_includes_provided():
    p = ProfileUpdate(skin_goals=["anti_aging", "hydration"])
    out = p.model_dump(exclude_none=True)
    assert out == {"skin_goals": ["anti_aging", "hydration"]}


# ── Scan: barcode ────────────────────────────────────────────────────────────

def test_barcode_scan_request_min_length_enforced():
    with pytest.raises(ValidationError):
        BarcodeScanRequest(barcode="123")  # < 6


def test_barcode_scan_request_max_length_enforced():
    with pytest.raises(ValidationError):
        BarcodeScanRequest(barcode="x" * 33)  # > 32


def test_barcode_scan_request_accepts_typical_ean13():
    req = BarcodeScanRequest(barcode="3600523417865", category_hint="shampoo")
    assert req.barcode == "3600523417865"
    assert req.category_hint == "shampoo"


# ── Scan: label ──────────────────────────────────────────────────────────────

def test_label_scan_request_mode_must_be_front_or_back():
    with pytest.raises(ValidationError):
        LabelScanRequest(image_base64="abc", mode="side")  # type: ignore[arg-type]


def test_label_scan_request_image_base64_required_non_empty():
    with pytest.raises(ValidationError):
        LabelScanRequest(image_base64="", mode="back")


def test_label_scan_request_happy():
    req = LabelScanRequest(image_base64="aGVsbG8=", mode="front", category_hint="moisturizer")
    assert req.mode == "front"


# ── Product / resolve ────────────────────────────────────────────────────────

def test_product_resolve_request_requires_brand_name_category():
    with pytest.raises(ValidationError):
        ProductResolveRequest(brand="Native", name="Coconut")  # missing category_slug
    req = ProductResolveRequest(brand="Native", name="Coconut", category_slug="deodorant")
    assert req.category_slug == "deodorant"


def test_product_out_defaults_are_safe():
    p = ProductOut(id=uuid4(), name="Generic Cleanser")
    assert p.ingredients_parsed == []
    assert p.source == "open_beauty_facts"
    assert p.popularity == 0
    assert p.brand is None


def test_product_out_rejects_unknown_source():
    with pytest.raises(ValidationError):
        ProductOut(id=uuid4(), name="x", source="hand_dipped_fairy_dust")  # type: ignore[arg-type]


# ── User products ────────────────────────────────────────────────────────────

def test_user_product_create_picker_path():
    """Picker path: product_id supplied, no custom name/ingredients."""
    up = UserProductCreate(category_slug="shampoo", product_id=uuid4())
    assert up.custom_name is None and up.custom_ingredients is None


def test_user_product_create_paste_path():
    """Paste path: no product_id, custom name + ingredients."""
    up = UserProductCreate(
        category_slug="face_cleanser",
        custom_name="Homemade goo",
        custom_ingredients="Aqua, Glycerin, Sodium Lauryl Sulfate",
    )
    assert up.product_id is None
    assert "Sodium Lauryl Sulfate" in up.custom_ingredients
