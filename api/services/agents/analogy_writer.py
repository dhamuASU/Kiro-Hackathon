"""Analogy Writer Agent — OWNED BY AGENTS TEAMMATE."""
from services.agents.base import AbstractAgent
from schemas.agent import AnalogyWriterInput, AnalogyWriterOutput
from services.llm.client import llm_client
from services.llm.prompts import ANALOGY_FACTCHECK_PROMPT, ANALOGY_WRITER_PROMPT

_BANNED = ("TOXIC", "POISON", "AVOID AT ALL COSTS", "2 kg")


def _contains_banned(text: str) -> bool:
    upper = text.upper()
    return any(b.upper() in upper for b in _BANNED)


class AnalogyWriterAgent(AbstractAgent):
    async def run(self, input: AnalogyWriterInput) -> AnalogyWriterOutput:
        ingredient_id = str(input.ingredient.id)

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
            return AnalogyWriterOutput(
                analogy_one_liner=rows[0]["analogy_one_liner"],
                full_explanation=rows[0]["full_explanation"],
                source="curated",
                fact_check_passed=True,
            )

        # 3. LLM generation + immediate fact-check
        analogy_result = await llm_client.write_analogy(
            input.ingredient.model_dump(mode="json"),
            input.profile.model_dump(mode="json"),
            input.goal_slug,
            ANALOGY_WRITER_PROMPT,
        )
        one_liner: str = analogy_result.get("analogy_one_liner", "")
        full_exp: str = analogy_result.get("full_explanation", "")

        # Banned-word gate
        if _contains_banned(one_liner) or _contains_banned(full_exp):
            return AnalogyWriterOutput(
                analogy_one_liner=None,
                full_explanation=full_exp,
                source="llm",
                fact_check_passed=False,
            )

        fc = await llm_client.fact_check_analogy(
            one_liner,
            input.ingredient.model_dump(mode="json"),
            ANALOGY_FACTCHECK_PROMPT,
        )
        passed: bool = fc.get("passed", False)

        return AnalogyWriterOutput(
            analogy_one_liner=one_liner if passed else None,
            full_explanation=full_exp,
            source="llm",
            fact_check_passed=passed,
        )
