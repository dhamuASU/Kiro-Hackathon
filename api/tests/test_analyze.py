"""Smoke tests for the analyze router (real routing, no live deps)."""
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_analyze_requires_auth():
    resp = client.post("/api/analyze")
    assert resp.status_code in (401, 403)
    body = resp.json()
    assert body["error"]["code"] in ("UNAUTHORIZED", "FORBIDDEN")


def test_analyze_bad_jwt_is_unauthorized():
    resp = client.post("/api/analyze", headers={"Authorization": "Bearer garbage.jwt.sig"})
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "UNAUTHORIZED"


def test_unknown_route_is_enveloped_404():
    resp = client.get("/api/totally-fake-route")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "NOT_FOUND"


def test_openapi_spec_reachable():
    resp = client.get("/openapi.json")
    assert resp.status_code == 200
    paths = resp.json().get("paths", {})
    # The demo-critical endpoints should all be registered
    for required in (
        "/api/health",
        "/api/profile",
        "/api/onboarding/profile",
        "/api/analyze",
        "/api/analyze/{analysis_id}/stream",
        "/api/scan/barcode",
        "/api/scan/label",
        "/api/products/resolve",
        "/api/alternatives",
    ):
        assert required in paths, f"missing route in OpenAPI: {required}"
