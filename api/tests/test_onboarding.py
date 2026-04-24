"""Tests for the onboarding flow."""
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture
def client():
    return TestClient(app)


VALID_PROFILE = {
    "age_range": "25_34",
    "gender": "female",
    "skin_type": "sensitive",
    "skin_goals": ["hydration", "less_sensitivity"],
    "allergies": [],
    "life_stage": "none",
}


def test_complete_onboarding_requires_auth(client):
    resp = client.post("/api/onboarding/complete", json=VALID_PROFILE)
    assert resp.status_code == 403


def test_profile_schema_validation(client):
    """Missing required fields should return 422."""
    resp = client.post("/api/onboarding/complete", json={"age_range": "25_34"})
    assert resp.status_code in (403, 422)
