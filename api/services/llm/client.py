"""
LLM client — OWNED BY AGENTS TEAMMATE.

Wraps Google Vertex AI (gemini-2.5-flash) via the google-genai SDK.
All methods are async. JSON methods use response_mime_type=application/json
for native enforcement. Vision methods accept base64-encoded JPEG strings.
"""
import base64
import json
import re

from config import settings

_client = None


def _get_client():
    global _client
    if _client is None:
        from google import genai  # lazy import — avoids crash when mocked in tests
        # An `AIzaSy…` key is a Gemini Developer API key, not a Vertex AI
        # service-account credential. `vertexai=True` + `api_key` is rejected
        # by google-genai ("Project/location and API key are mutually exclusive").
        # Auto-detect: developer key → Developer API mode; otherwise Vertex.
        api_key = settings.vertexai_api_key
        if api_key and api_key.startswith("AIza"):
            _client = genai.Client(api_key=api_key)
        else:
            _client = genai.Client(
                vertexai=True,
                project=getattr(settings, "vertexai_project", None) or None,
                location=settings.vertexai_location,
            )
    return _client


def _get_config():
    from google.genai import types
    # Tight HTTP timeout; per-agent asyncio.wait_for() also bounds wall time.
    # Try to disable thinking on 2.5-flash for ~3-5x speedup; fall back if the
    # SDK doesn't support that field.
    base = dict(
        response_mime_type="application/json",
        http_options=types.HttpOptions(timeout=12000),
    )
    try:
        base["thinking_config"] = types.ThinkingConfig(thinking_budget=0)
    except Exception:
        pass
    return types.GenerateContentConfig(**base)


def _make_part_from_bytes(data: bytes, mime_type: str):
    from google.genai import types
    return types.Part.from_bytes(data=data, mime_type=mime_type)


def _make_part_from_text(text: str):
    from google.genai import types
    return types.Part.from_text(text)


async def _generate_json(contents) -> dict | list:
    import logging
    log = logging.getLogger(__name__)
    import time
    t = time.monotonic()
    response = await _get_client().aio.models.generate_content(
        model=settings.gemini_model,
        contents=contents,
        config=_get_config(),
    )
    log.info("llm: %s in %.2fs", settings.gemini_model, time.monotonic() - t)
    return json.loads(response.text)


def _normalize_ingredients(raw: str) -> list[str]:
    """Split on , or ;, strip parenthetical notes, title-case, drop empties."""
    tokens = re.split(r"[,;]", raw)
    result = []
    for t in tokens:
        t = re.sub(r"\s*\(.*?\)", "", t).strip()
        if t:
            result.append(t.title())
    return result


class LLMClient:
    async def classify_ingredient(self, inci_name: str, prompt: str) -> dict:
        """
        Returns {"is_concerning": bool, "hazard_tags": [str]}
        """
        contents = f"{prompt}\n\nIngredient: {inci_name}"
        return await _generate_json(contents)  # type: ignore[return-value]

    async def rank_ingredients(self, profile: dict, flagged: list[dict], prompt: str) -> list[dict]:
        """
        Returns [{"inci_name": str, "product_id": str, "relevance": str, "reason": str}, ...]
        """
        contents = (
            f"{prompt}\n\n"
            f"User profile: {json.dumps(profile)}\n\n"
            f"Flagged ingredients: {json.dumps(flagged)}"
        )
        return await _generate_json(contents)  # type: ignore[return-value]

    async def write_analogy(self, ingredient: dict, profile: dict, goal_slug: str, prompt: str) -> dict:
        """
        Returns {"analogy_one_liner": str, "full_explanation": str}
        """
        contents = (
            f"{prompt}\n\n"
            f"Ingredient: {json.dumps(ingredient)}\n"
            f"User profile: {json.dumps(profile)}\n"
            f"Goal: {goal_slug}"
        )
        return await _generate_json(contents)  # type: ignore[return-value]

    async def fact_check_analogy(self, analogy: str, ingredient: dict, prompt: str) -> dict:
        """
        Returns {"passed": bool, "reason": str}
        """
        contents = (
            f"{prompt}\n\n"
            f"Analogy: {analogy}\n"
            f"Ingredient: {json.dumps(ingredient)}"
        )
        return await _generate_json(contents)  # type: ignore[return-value]

    async def find_alternatives(
        self, category_slug: str, avoid_tags: list[str], profile: dict, prompt: str
    ) -> list[dict]:
        """
        Returns [{"name": str, "brand": str, "price": str, "reason": str}, ...]
        """
        contents = (
            f"{prompt}\n\n"
            f"Category: {category_slug}\n"
            f"Avoid tags: {json.dumps(avoid_tags)}\n"
            f"User profile: {json.dumps(profile)}"
        )
        return await _generate_json(contents)  # type: ignore[return-value]

    async def resolve_product(self, brand: str, name: str, category_slug: str, prompt: str) -> dict:
        """
        Returns {"ingredients_parsed": [str], "confidence": float, "image_url": str | None}
        """
        contents = (
            f"{prompt}\n\n"
            f"Brand: {brand}\n"
            f"Product: {name}\n"
            f"Category: {category_slug}"
        )
        return await _generate_json(contents)  # type: ignore[return-value]

    async def extract_label_front(self, image_base64: str) -> dict:
        """
        Returns {"brand": str, "product_name": str, "confidence": float}
        """
        contents = [
            _make_part_from_bytes(base64.b64decode(image_base64), "image/jpeg"),
            _make_part_from_text(
                "Extract the brand name and product name from this cosmetic product label. "
                "Return JSON only, no prose, no code fences. "
                'Schema: {"brand": str, "product_name": str, "confidence": float}'
            ),
        ]
        return await _generate_json(contents)  # type: ignore[return-value]

    async def extract_label_back(self, image_base64: str) -> dict:
        """
        Returns {"ingredients_raw": str, "ingredients_parsed": [str], "confidence": float}
        """
        contents = [
            _make_part_from_bytes(base64.b64decode(image_base64), "image/jpeg"),
            _make_part_from_text(
                "Extract the full ingredient list from this cosmetic product back label. "
                "Return the raw text as-is in ingredients_raw, and a parsed list of individual "
                "INCI names in ingredients_parsed. "
                "Return JSON only, no prose, no code fences. "
                'Schema: {"ingredients_raw": str, "ingredients_parsed": [str], "confidence": float}'
            ),
        ]
        result: dict = await _generate_json(contents)  # type: ignore[assignment]
        # Normalize: re-parse from raw if model didn't split, then clean up
        raw = result.get("ingredients_raw", "")
        parsed = result.get("ingredients_parsed") or []
        if not parsed and raw:
            parsed = _normalize_ingredients(raw)
        else:
            parsed = [
                re.sub(r"\s*\(.*?\)", "", t).strip().title()
                for t in parsed
                if re.sub(r"\s*\(.*?\)", "", t).strip()
            ]
        result["ingredients_parsed"] = parsed
        return result


llm_client = LLMClient()
