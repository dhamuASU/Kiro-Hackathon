"""Onboarding router — the 3-minute wizard happy paths and validation."""
from uuid import uuid4

from tests.conftest import USER_ID, make_profile_row


def test_save_profile_step_persists_and_returns_profile(client, fake_db):
    fake_db.program([make_profile_row()])

    resp = client.post(
        "/api/onboarding/profile",
        json={
            "age_range": "25_34",
            "gender": "female",
            "skin_type": "sensitive",
            "skin_goals": ["reduce_acne", "less_sensitivity"],
            "allergies": ["fragrance"],
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["id"] == USER_ID
    assert body["skin_type"] == "sensitive"


def test_save_profile_rejects_unknown_skin_goal(client):
    resp = client.post(
        "/api/onboarding/profile",
        json={
            "age_range": "25_34",
            "gender": "female",
            "skin_type": "sensitive",
            "skin_goals": ["learn_telekinesis"],
        },
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "VALIDATION_ERROR"


def test_save_products_batch(client, fake_db):
    pid = str(uuid4())
    fake_db.program([
        {
            "id": str(uuid4()),
            "user_id": USER_ID,
            "product_id": pid,
            "category_slug": "shampoo",
            "custom_name": None,
            "custom_ingredients": None,
        },
        {
            "id": str(uuid4()),
            "user_id": USER_ID,
            "product_id": None,
            "category_slug": "face_cleanser",
            "custom_name": "Pasted",
            "custom_ingredients": "Aqua, Glycerin",
        },
    ])

    resp = client.post(
        "/api/onboarding/products",
        json={
            "products": [
                {"category_slug": "shampoo", "product_id": pid},
                {
                    "category_slug": "face_cleanser",
                    "custom_name": "Pasted",
                    "custom_ingredients": "Aqua, Glycerin",
                },
            ]
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert len(body["user_products"]) == 2


def test_complete_marks_profile_then_kicks_off_analysis(client, fake_db):
    """`/onboarding/complete` does:
       1. update profiles.onboarding_complete=true
       2. read profile snapshot
       3. read user_products
       4. insert into analyses
    Program 4 responses; the route should return 202 with an analysis_id."""
    fake_db.program(
        [],                            # 1. update profiles
        make_profile_row(onboarding_complete=True),  # 2. select profile snapshot
        [],                            # 3. select user_product_ids
        [],                            # 4. insert analyses
    )

    resp = client.post("/api/onboarding/complete")
    assert resp.status_code == 202
    body = resp.json()
    assert "analysis_id" in body
    assert body["status"] == "pending"


def test_complete_requires_auth(anon_client):
    resp = anon_client.post("/api/onboarding/complete")
    assert resp.status_code in (401, 403)
