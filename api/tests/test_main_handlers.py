"""
Tests for the global exception handlers in main.py — every error must come
back wrapped in the {"error": {"code", "message", "details"}} envelope.
"""
from fastapi import HTTPException

from main import app


def test_http_exception_with_dict_detail_extracts_code_and_message(client):
    """When a route raises HTTPException(detail={"code", "message"}), the
    handler unwraps that into the envelope rather than re-stringifying."""

    @app.get("/api/_test/throw_dict_detail")
    async def _throw():
        raise HTTPException(
            status_code=502,
            detail={
                "code": "LLM_FAILURE",
                "message": "Upstream model misbehaved",
                "details": {"reason": "timeout"},
            },
        )

    try:
        resp = client.get("/api/_test/throw_dict_detail")
        assert resp.status_code == 502
        body = resp.json()
        assert body == {
            "error": {
                "code": "LLM_FAILURE",
                "message": "Upstream model misbehaved",
                "details": {"reason": "timeout"},
            }
        }
    finally:
        # remove the test-only route so it doesn't bleed into other tests
        app.router.routes = [r for r in app.router.routes if getattr(r, "path", None) != "/api/_test/throw_dict_detail"]


def test_http_exception_with_string_detail_uses_status_to_code(client):
    @app.get("/api/_test/throw_string_detail")
    async def _throw():
        raise HTTPException(status_code=404, detail="Profile not found")

    try:
        resp = client.get("/api/_test/throw_string_detail")
        assert resp.status_code == 404
        body = resp.json()
        assert body["error"]["code"] == "NOT_FOUND"
        assert body["error"]["message"] == "Profile not found"
    finally:
        app.router.routes = [r for r in app.router.routes if getattr(r, "path", None) != "/api/_test/throw_string_detail"]


def test_validation_error_envelope_has_errors_array(client):
    """Posting an invalid body to a real route should produce 422 with the
    canonical VALIDATION_ERROR envelope and a list of field errors."""
    resp = client.post(
        "/api/onboarding/profile",
        json={"age_range": "25_34"},  # missing gender, skin_type, skin_goals
    )
    assert resp.status_code == 422
    body = resp.json()
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert "errors" in body["error"]["details"]
    assert isinstance(body["error"]["details"]["errors"], list)
    assert len(body["error"]["details"]["errors"]) >= 1


def test_unhandled_exception_returns_500_envelope(fake_db, fake_user):
    """Any unhandled error inside a route must be enveloped, not leak text.

    TestClient re-raises server exceptions by default; pass raise_server_exceptions=False
    so the global handler can produce its envelope."""
    from fastapi.testclient import TestClient
    from deps import current_user, get_supabase

    @app.get("/api/_test/explode")
    async def _explode():
        raise RuntimeError("something blew up")

    app.dependency_overrides[current_user] = lambda: fake_user
    app.dependency_overrides[get_supabase] = lambda: fake_db
    try:
        c = TestClient(app, raise_server_exceptions=False)
        resp = c.get("/api/_test/explode")
        assert resp.status_code == 500
        body = resp.json()
        assert body["error"]["code"] == "INTERNAL_ERROR"
        assert body["error"]["message"] == "Internal server error"
        assert body["error"]["details"]["type"] == "RuntimeError"
    finally:
        app.dependency_overrides.pop(current_user, None)
        app.dependency_overrides.pop(get_supabase, None)
        app.router.routes = [r for r in app.router.routes if getattr(r, "path", None) != "/api/_test/explode"]


def test_unknown_route_envelope(anon_client):
    resp = anon_client.get("/api/this-route-does-not-exist")
    assert resp.status_code == 404
    body = resp.json()
    assert body["error"]["code"] == "NOT_FOUND"


def test_health_endpoint_is_unauthed_and_ok(anon_client):
    resp = anon_client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_openapi_advertises_demo_critical_routes(anon_client):
    resp = anon_client.get("/openapi.json")
    assert resp.status_code == 200
    paths = resp.json().get("paths", {})
    for required in (
        "/api/health",
        "/api/profile",
        "/api/onboarding/profile",
        "/api/onboarding/products",
        "/api/onboarding/complete",
        "/api/analyze",
        "/api/analyze/{analysis_id}",
        "/api/analyze/{analysis_id}/stream",
        "/api/scan/barcode",
        "/api/scan/label",
        "/api/products/search",
        "/api/products/common",
        "/api/products/resolve",
        "/api/user-products",
        "/api/alternatives",
        "/api/ingredient/{inci_name}",
    ):
        assert required in paths, f"missing route in OpenAPI: {required}"
