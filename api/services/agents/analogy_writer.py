"""Analogy Writer Agent.

Tries curated analogies first (instant), falls back to a single LLM call.

Speed strategy:
- Drop the second-pass fact-check LLM call. The Scanner has already verified
  the ingredient is concerning; the writer prompt is constrained to disallow
  scare-words; a deterministic banned-word check still gates the output.
- Per-call timeout so a single slow response can't stall the whole pipeline.
"""
import asyncio
import logging

from services.agents.base import AbstractAgent
from schemas.agent import AnalogyWriterInput, AnalogyWriterOutput
from services.llm.client import llm_client
from services.llm.prompts import ANALOGY_WRITER_PROMPT

log = logging.getLogger(__name__)

LLM_TIMEOUT_S = 12.0
_BANNED = ("TOXIC", "POISON", "AVOID AT ALL COSTS", "2 KG")


def _contains_banned(text: str) -> bool:
    upper = (text or "").upper()
    return any(b in upper for b in _BANNED)


class AnalogyWriterAgent(AbstractAgent):
    async def run(self, input: AnalogyWriterInput) -> AnalogyWriterOutput:
        ingredient_id = str(input.ingredient.id)
        inci = getattr(input.ingredient, "inci_name", "?")

        # 1. Goal-specific curated analogy
        rows = (
            self.db.table("analogies")
            .select("analogy_one_liner, full_explanation")
            .eq("ingredient_id", ingredient_id)
            .eq("goal_slug", input.goal_slug)
            .execute()
        ).data

        # 2. Generic curated fallback
        if not rows:
            rows = (
                self.db.table("analogies")
                .select("analogy_one_liner, full_explanation")
                .eq("ingredient_id", ingredient_id)
                .is_("goal_slug", "null")
                .execute()
            ).data

        if rows:
            log.info("analogy: %s curated", inci)
            return AnalogyWriterOutput(
                analogy_one_liner=rows[0]["analogy_one_liner"],
                full_explanation=rows[0]["full_explanation"],
                source="curated",
                fact_check_passed=True,
            )

        # 3. Single LLM call — no second-pass fact-check (speed).
        try:
            result = await asyncio.wait_for(
                llm_client.write_analogy(
                    input.ingredient.model_dump(mode="json"),
                    input.profile.model_dump(mode="json"),
                    input.goal_slug,
                    ANALOGY_WRITER_PROMPT,
                ),
                timeout=LLM_TIMEOUT_S,
            )
        except (asyncio.TimeoutError, Exception) as exc:
            log.warning("analogy: %s llm failed err=%s", inci, exc)
            return AnalogyWriterOutput(
                analogy_one_liner=None,
                full_explanation="",
                source="llm",
                fact_check_passed=False,
            )

        one_liner = result.get("analogy_one_liner") or ""
        full_exp = result.get("full_explanation") or ""

        if _contains_banned(one_liner) or _contains_banned(full_exp):
            log.info("analogy: %s banned-word gate", inci)
            return AnalogyWriterOutput(
                analogy_one_liner=None,
                full_explanation=full_exp,
                source="llm",
                fact_check_passed=False,
            )

        log.info("analogy: %s llm ok", inci)
        return AnalogyWriterOutput(
            analogy_one_liner=one_liner,
            full_explanation=full_exp,
            source="llm",
            fact_check_passed=True,
        )
