"""
Shared pytest fixtures for the CleanLabel backend.

The real Supabase client and JWT auth aren't available in the test environment,
so every test that hits an authenticated route uses dependency overrides.
"""
from __future__ import annotations

from typing import Any, Callable
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient

from deps import current_user, get_supabase
from main import app


# ── Fake Supabase ────────────────────────────────────────────────────────────

class _Result:
    """Mimics the `result` object returned by `supabase-py`'s `.execute()`."""

    def __init__(self, data: Any) -> None:
        self.data = data


class _Chain:
    """
    Fluent builder that absorbs every chained Supabase call (`select`, `eq`,
    `ilike`, `order`, `limit`, `insert`, `upsert`, `update`, `delete`,
    `single`, `maybe_single`, ...) and only "fires" on `.execute()`.

    Each `.execute()` consumes one entry from the FakeSupabase queue.
    Tests therefore program responses in the same order the route will call
    `.execute()`.
    """

    def __init__(self, parent: "FakeSupabase") -> None:
        self._parent = parent

    def __getattr__(self, _name: str) -> Callable[..., "_Chain"]:
        def _passthrough(*_a: Any, **_kw: Any) -> "_Chain":
            return self
        return _passthrough

    def execute(self) -> _Result:
        if self._parent.queue:
            data = self._parent.queue.pop(0)
        else:
            data = []
        self._parent.execute_count += 1
        return _Result(data)


class FakeSupabase:
    """
    Drop-in replacement for `supabase.Client` in tests.

    Usage:
        fake_db.program({"id": "...", ...})              # for `.single()`
        fake_db.program([{"id": "..."}, {"id": "..."}])  # for list returns
        fake_db.program(None)                            # for `.maybe_single()` miss

    Each subsequent `.execute()` call inside the route consumes one entry.
    """

    def __init__(self) -> None:
        self.queue: list[Any] = []
        self.execute_count: int = 0

    def program(self, *responses: Any) -> None:
        self.queue.extend(responses)

    def table(self, _name: str) -> _Chain:
        return _Chain(self)


# ── Fixtures ─────────────────────────────────────────────────────────────────

USER_ID = "11111111-1111-4111-8111-111111111111"


@pytest.fixture
def fake_db() -> FakeSupabase:
    return FakeSupabase()


@pytest.fixture
def fake_user() -> dict:
    """Stand-in JWT payload — what `current_user` would return after decode."""
    return {"sub": USER_ID, "aud": "authenticated", "email": "test@example.com"}


@pytest.fixture
def client(fake_db: FakeSupabase, fake_user: dict) -> TestClient:
    """
    A TestClient with `current_user` and `get_supabase` overridden.
    Routes that don't need auth still work because FastAPI only invokes the
    dependency when the route declares it.
    """
    app.dependency_overrides[current_user] = lambda: fake_user
    app.dependency_overrides[get_supabase] = lambda: fake_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.pop(current_user, None)
        app.dependency_overrides.pop(get_supabase, None)


@pytest.fixture
def anon_client() -> TestClient:
    """A TestClient with NO dependency overrides — for testing 401/403 paths."""
    return TestClient(app)


# ── Object factories — Pydantic-valid example payloads ───────────────────────

def make_profile_row(**overrides: Any) -> dict:
    base = {
        "id": USER_ID,
        "display_name": "Maya",
        "age_range": "25_34",
        "gender": "female",
        "skin_type": "sensitive",
        "skin_goals": ["reduce_acne", "less_sensitivity"],
        "allergies": ["fragrance"],
        "life_stage": "none",
        "onboarding_complete": False,
    }
    base.update(overrides)
    return base


def make_product_row(**overrides: Any) -> dict:
    base = {
        "id": str(uuid4()),
        "off_id": "3600523417865",
        "name": "Hydro Boost Water Gel",
        "brand": "Neutrogena",
        "category_slug": "moisturizer",
        "ingredients_raw": "Aqua, Glycerin, Sodium Hyaluronate",
        "ingredients_parsed": ["Aqua", "Glycerin", "Sodium Hyaluronate"],
        "image_url": "https://example.com/img.jpg",
        "source": "open_beauty_facts",
        "popularity": 100,
    }
    base.update(overrides)
    return base


def make_alternative_row(**overrides: Any) -> dict:
    base = {
        "id": str(uuid4()),
        "category_slug": "shampoo",
        "product_name": "Vanicream Free & Clear Shampoo",
        "brand": "Vanicream",
        "free_of_tags": ["sulfate_free", "fragrance_free"],
        "good_for_skin_types": ["sensitive", "dry"],
        "good_for_goals": ["less_sensitivity"],
        "avg_price_usd": 9.99,
        "url": "https://example.com",
        "image_url": None,
        "reason": "Sulfate-free and fragrance-free",
    }
    base.update(overrides)
    return base


def make_ingredient_row(**overrides: Any) -> dict:
    base = {
        "id": str(uuid4()),
        "inci_name": "Sodium Lauryl Sulfate",
        "common_name": "SLS",
        "cas_number": "151-21-3",
        "category": "surfactant",
        "function_short": "cleanses",
        "plain_english": "A common detergent.",
        "hazard_tags": ["irritant", "drying"],
        "goals_against": ["less_sensitivity", "hydration"],
        "bad_for_skin_types": ["sensitive", "dry"],
        "dose_notes": "Concentrations above 1% in leave-on are restricted in the EU.",
    }
    base.update(overrides)
    return base


def make_user_product_row(**overrides: Any) -> dict:
    base = {
        "id": str(uuid4()),
        "user_id": USER_ID,
        "product_id": str(uuid4()),
        "category_slug": "shampoo",
        "custom_name": None,
        "custom_ingredients": None,
        "product": make_product_row(),
    }
    base.update(overrides)
    return base
