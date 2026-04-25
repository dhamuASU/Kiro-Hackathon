"""Profile router — GET / POST / PATCH /api/profile."""
from tests.conftest import USER_ID, make_profile_row


def test_get_profile_returns_persisted_row(client, fake_db):
    fake_db.program(make_profile_row(skin_type="dry"))
    resp = client.get("/api/profile")
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == USER_ID
    assert body["skin_type"] == "dry"


def test_get_profile_404_when_no_row(client, fake_db):
    fake_db.program(None)
    resp = client.get("/api/profile")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "NOT_FOUND"


def test_create_profile_upserts_user_payload(client, fake_db):
    """POST /api/profile should round-trip the request as the response shape."""
    inserted = make_profile_row()
    fake_db.program([inserted])  # upsert returns a list

    resp = client.post(
        "/api/profile",
        json={
            "age_range": "25_34",
            "gender": "female",
            "skin_type": "sensitive",
            "skin_goals": ["reduce_acne", "less_sensitivity"],
            "allergies": ["fragrance"],
            "life_stage": "none",
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["id"] == USER_ID
    assert body["skin_type"] == "sensitive"


def test_create_profile_rejects_invalid_enum(client):
    """Validation runs before db is touched."""
    resp = client.post(
        "/api/profile",
        json={
            "age_range": "25_34",
            "gender": "alien",  # invalid
            "skin_type": "sensitive",
            "skin_goals": ["reduce_acne"],
        },
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "VALIDATION_ERROR"


def test_patch_profile_only_sends_provided_fields(client, fake_db):
    updated = make_profile_row(skin_goals=["anti_aging", "hydration"])
    fake_db.program([updated])

    resp = client.patch(
        "/api/profile",
        json={"skin_goals": ["anti_aging", "hydration"]},
    )
    assert resp.status_code == 200
    assert resp.json()["skin_goals"] == ["anti_aging", "hydration"]


def test_profile_routes_require_auth(anon_client):
    """Without overrides the bearer dep raises 403."""
    assert anon_client.get("/api/profile").status_code in (401, 403)
    assert anon_client.post("/api/profile", json={}).status_code in (401, 403)
    assert anon_client.patch("/api/profile", json={}).status_code in (401, 403)
