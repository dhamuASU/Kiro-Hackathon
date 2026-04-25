"""Tests for LLMClient — mocks google-genai, no real API calls."""
import base64
import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from services.llm.client import LLMClient, _normalize_ingredients
from services.llm.prompts import ANALOGY_FACTCHECK_PROMPT, ANALOGY_WRITER_PROMPT, SCANNER_PROMPT


def _mock_response(payload) -> MagicMock:
    m = MagicMock()
    m.text = json.dumps(payload)
    return m


@pytest.fixture
def client():
    return LLMClient()


@pytest.fixture(autouse=True)
def patch_genai(client):
    mock_generate = AsyncMock(return_value=_mock_response({}))
    mock_config = MagicMock()
    mock_part = MagicMock()
    with (
        patch("services.llm.client._get_client") as mock_get,
        patch("services.llm.client._get_config", return_value=mock_config),
        patch("services.llm.client._make_part_from_bytes", return_value=mock_part),
        patch("services.llm.client._make_part_from_text", return_value=mock_part),
    ):
        mock_aio = MagicMock()
        mock_aio.models.generate_content = mock_generate
        mock_get.return_value.aio = mock_aio
        yield mock_generate


async def test_classify_ingredient_concerning(patch_genai, client):
    patch_genai.return_value = _mock_response({"is_concerning": True, "hazard_tags": ["irritant"]})
    result = await client.classify_ingredient("Sodium Lauryl Sulfate", SCANNER_PROMPT)
    assert result["is_concerning"] is True
    assert "irritant" in result["hazard_tags"]


async def test_classify_ingredient_not_concerning(patch_genai, client):
    patch_genai.return_value = _mock_response({"is_concerning": False, "hazard_tags": []})
    result = await client.classify_ingredient("Aqua", SCANNER_PROMPT)
    assert result["is_concerning"] is False


async def test_rank_ingredients_returns_list(patch_genai, client):
    payload = [{"inci_name": "SLS", "product_id": "abc", "relevance": "high", "reason": "drying"}]
    patch_genai.return_value = _mock_response(payload)
    result = await client.rank_ingredients({}, [{"inci_name": "SLS"}], "prompt")
    assert isinstance(result, list)
    assert result[0]["relevance"] == "high"


async def test_write_analogy(patch_genai, client):
    payload = {"analogy_one_liner": "SLS is like dish soap", "full_explanation": "strips oils"}
    patch_genai.return_value = _mock_response(payload)
    result = await client.write_analogy({}, {}, "hydration", ANALOGY_WRITER_PROMPT)
    assert "analogy_one_liner" in result


async def test_fact_check_analogy(patch_genai, client):
    patch_genai.return_value = _mock_response({"passed": True, "reason": "accurate"})
    result = await client.fact_check_analogy("SLS is like dish soap", {}, ANALOGY_FACTCHECK_PROMPT)
    assert result["passed"] is True


async def test_find_alternatives(patch_genai, client):
    payload = [{"name": "CeraVe", "brand": "CeraVe", "price": "$15", "reason": "gentle"}]
    patch_genai.return_value = _mock_response(payload)
    result = await client.find_alternatives("cleanser", ["sls"], {}, "prompt")
    assert isinstance(result, list)
    assert result[0]["name"] == "CeraVe"


async def test_resolve_product(patch_genai, client):
    payload = {"ingredients_parsed": ["Aqua", "Glycerin"], "confidence": 0.9, "image_url": None}
    patch_genai.return_value = _mock_response(payload)
    result = await client.resolve_product("CeraVe", "Moisturizer", "moisturizer", "prompt")
    assert result["confidence"] == 0.9


async def test_extract_label_front(patch_genai, client):
    payload = {"brand": "CeraVe", "product_name": "Moisturizer", "confidence": 0.95}
    patch_genai.return_value = _mock_response(payload)
    fake_b64 = base64.b64encode(b"fake").decode()
    result = await client.extract_label_front(fake_b64)
    assert result["brand"] == "CeraVe"


async def test_extract_label_back_normalizes_from_raw(patch_genai, client):
    payload = {
        "ingredients_raw": "Water, Glycerin (2%), , sodium lauryl sulfate",
        "ingredients_parsed": [],
        "confidence": 0.9,
    }
    patch_genai.return_value = _mock_response(payload)
    fake_b64 = base64.b64encode(b"fake").decode()
    result = await client.extract_label_back(fake_b64)
    assert "Water" in result["ingredients_parsed"]
    assert "Glycerin" in result["ingredients_parsed"]
    assert "Sodium Lauryl Sulfate" in result["ingredients_parsed"]
    assert "" not in result["ingredients_parsed"]


def test_normalize_ingredients():
    raw = "Water, Glycerin (2%), , sodium lauryl sulfate; Niacinamide"
    assert _normalize_ingredients(raw) == ["Water", "Glycerin", "Sodium Lauryl Sulfate", "Niacinamide"]
