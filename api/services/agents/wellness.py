"""Wellness Agent — produces skin-age estimate + AM/PM routine.

Single LLM call. Cheap to compute, runs in parallel with the regulatory_xref
phase so it doesn't extend wall-clock time noticeably.
"""
import asyncio
import logging
from typing import Any

from services.agents.base import AbstractAgent
from services.llm.client import llm_client
from services.llm.prompts import WELLNESS_PROMPT

log = logging.getLogger(__name__)

LLM_TIMEOUT_S = 18.0


def _fallback_skin_age(profile: dict, flagged_count: int, high_count: int) -> dict:
    """Heuristic when the LLM call fails — keeps the dashboard non-empty."""
    age_range = (profile.get("age_range") or "25_34").split("_")
    try:
        base = int(age_range[0])
    except (ValueError, IndexError):
        base = 28
    # Each high-concern flag adds ~0.6yr, each medium ~0.3yr (cap +6)
    penalty = min(int(round(0.6 * high_count + 0.3 * (flagged_count - high_count))), 6)
    return {
        "current": base + penalty,
        "potential": base,
        "rationale": (
            f"Your routine has {flagged_count} flagged ingredient"
            f"{'s' if flagged_count != 1 else ''} ({high_count} high-concern). "
            "Adopting cleaner alternatives can plausibly recover several years "
            "of skin-barrier health by reducing daily irritant load."
        ),
        "sustainability_note": (
            "Cleaner products usually mean fewer microplastics, less synthetic "
            "fragrance, and refillable packaging — better for your skin and the "
            "ecosystems your routine eventually drains into."
        ),
    }


def _fallback_routine(profile: dict, products: list[dict]) -> dict:
    """Sensible default if the LLM is unavailable."""
    skin = (profile.get("skin_type") or "normal").lower()
    moisturizer_note = (
        "ceramides + glycerin" if skin in ("dry", "sensitive") else "hyaluronic acid"
    )
    return {
        "morning": [
            {"step": 1, "category": "cleanser", "why": "Reset the skin barrier without stripping", "key_ingredient": "low-pH amino-acid surfactants"},
            {"step": 2, "category": "moisturizer", "why": f"Lock in hydration for {skin} skin", "key_ingredient": moisturizer_note},
            {"step": 3, "category": "sunscreen", "why": "Photoreactive ingredients in older products make daily SPF non-negotiable", "key_ingredient": "zinc oxide or tinted mineral SPF 30+"},
        ],
        "evening": [
            {"step": 1, "category": "cleanser", "why": "Remove SPF and pollution residue", "key_ingredient": "non-stripping surfactant"},
            {"step": 2, "category": "treatment", "why": "Address your stated skin goals overnight", "key_ingredient": "niacinamide or retinaldehyde, depending on goal"},
            {"step": 3, "category": "moisturizer", "why": "Sealing step reduces overnight transepidermal water loss", "key_ingredient": "shea butter or squalane"},
        ],
    }


class WellnessAgent(AbstractAgent):
    async def run(self, input: Any) -> dict:
        """
        Input is a dict: {profile, products, flagged}.
        Returns {"skin_age": {...}, "routine": {...}}
        """
        profile = input.get("profile") or {}
        products = input.get("products") or []
        flagged = input.get("flagged") or []
        flagged_count = len(flagged)
        high_count = sum(1 for f in flagged if f.get("relevance") == "high")

        try:
            result = await asyncio.wait_for(
                llm_client.generate_wellness(profile, products, flagged, WELLNESS_PROMPT),
                timeout=LLM_TIMEOUT_S,
            )
            # Sanity-check the shape; fall through to fallback on missing keys
            if "skin_age" not in result or "routine" not in result:
                raise ValueError("missing keys in wellness output")
            log.info("wellness: llm ok current=%s potential=%s",
                     result["skin_age"].get("current"),
                     result["skin_age"].get("potential"))
            return result
        except (asyncio.TimeoutError, Exception) as exc:
            log.warning("wellness: llm failed err=%s — falling back", exc)
            return {
                "skin_age": _fallback_skin_age(profile, flagged_count, high_count),
                "routine": _fallback_routine(profile, products),
            }
