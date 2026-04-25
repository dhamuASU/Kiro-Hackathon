"""OCR dispatcher — routes mode=front vs mode=back to the right LLM method."""
from unittest.mock import AsyncMock

import pytest

from services import ocr
from services.llm import client as llm_module


@pytest.mark.asyncio
async def test_front_mode_dispatches_to_extract_label_front(monkeypatch):
    front_mock = AsyncMock(return_value={"brand": "Native", "product_name": "Lavender", "confidence": 0.9})
    back_mock = AsyncMock()
    monkeypatch.setattr(llm_module.llm_client, "extract_label_front", front_mock)
    monkeypatch.setattr(llm_module.llm_client, "extract_label_back", back_mock)

    result = await ocr.extract_label("base64data", "front")
    assert result["brand"] == "Native"
    front_mock.assert_awaited_once_with("base64data")
    back_mock.assert_not_awaited()


@pytest.mark.asyncio
async def test_back_mode_dispatches_to_extract_label_back(monkeypatch):
    front_mock = AsyncMock()
    back_mock = AsyncMock(return_value={"ingredients_raw": "Aqua, Glycerin", "ingredients_parsed": ["Aqua", "Glycerin"], "confidence": 0.8})
    monkeypatch.setattr(llm_module.llm_client, "extract_label_front", front_mock)
    monkeypatch.setattr(llm_module.llm_client, "extract_label_back", back_mock)

    result = await ocr.extract_label("base64data", "back")
    assert result["ingredients_parsed"] == ["Aqua", "Glycerin"]
    back_mock.assert_awaited_once_with("base64data")
    front_mock.assert_not_awaited()


@pytest.mark.asyncio
async def test_unknown_mode_falls_back_to_back(monkeypatch):
    """Defensive: unknown mode shouldn't crash; the dispatcher routes to back.
    The router validates `mode` upstream, so this is safety-net behavior."""
    back_mock = AsyncMock(return_value={"ingredients_parsed": []})
    monkeypatch.setattr(llm_module.llm_client, "extract_label_back", back_mock)

    await ocr.extract_label("x", "unexpected-value")
    back_mock.assert_awaited_once()
