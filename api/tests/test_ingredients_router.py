"""Ingredients router — Learn-mode public read."""
from tests.conftest import make_ingredient_row


def test_get_ingredient_by_inci_name(anon_client, fake_db, monkeypatch):
    """The endpoint is unauthed; we still need to override the supabase dep
    on a separate TestClient because the `anon_client` fixture doesn't override
    `get_supabase`. We override it here per test."""
    from main import app
    from deps import get_supabase

    app.dependency_overrides[get_supabase] = lambda: fake_db
    try:
        fake_db.program(make_ingredient_row(inci_name="Sodium Lauryl Sulfate"))
        resp = anon_client.get("/api/ingredient/Sodium Lauryl Sulfate")
        assert resp.status_code == 200
        body = resp.json()
        assert body["inci_name"] == "Sodium Lauryl Sulfate"
        assert "irritant" in body["hazard_tags"]
    finally:
        app.dependency_overrides.pop(get_supabase, None)
