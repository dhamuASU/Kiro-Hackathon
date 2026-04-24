"""
Analogy Writer Agent — OWNED BY AGENTS TEAMMATE.

Generates ONE analogy-first explanation for ONE flagged ingredient,
calibrated to ONE user goal. This is the money agent — the "sulfates are
like sugar" moment.

Required behavior (from the spec):
  1. Curated-first: SELECT from `analogies` where `ingredient_id` matches
     and `goal_slug` matches (or is NULL, for generic fallbacks). Prefer
     the goal-specific row; fall back to the generic one. If found, return
     it with `source="curated"`, `fact_check_passed=True`.
  2. LLM fallback: call `llm_client.write_analogy()` with the
     ANALOGY_WRITER_PROMPT. The prompt enforces: respect dose, respect goal,
     be true, never use "TOXIC", no scare tactics.
  3. Fact-check pass: immediately call `llm_client.fact_check_analogy()`
     with the ANALOGY_FACTCHECK_PROMPT to verify the analogy accurately
     reflects the chemistry. Store the result on the output.

Input schema:  schemas.agent.AnalogyWriterInput
Output schema: schemas.agent.AnalogyWriterOutput
"""
from services.agents.base import AbstractAgent
from schemas.agent import AnalogyWriterInput, AnalogyWriterOutput


class AnalogyWriterAgent(AbstractAgent):
    async def run(self, input: AnalogyWriterInput) -> AnalogyWriterOutput:
        raise NotImplementedError("AnalogyWriterAgent.run — owned by agents teammate")
