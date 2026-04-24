"""
Alternative Finder Agent — OWNED BY AGENTS TEAMMATE.

Suggests 1–3 cleaner products for a flagged product. DB-first; LLM only
as a fallback when the curated catalog has nothing.

Required behavior (from the spec):
  - Query `alternatives` WHERE `category_slug = input.category_slug`.
  - Filter client-side so that EVERY entry in `input.avoid_tags` appears
    in the alternative's `free_of_tags` (i.e. `avoid_tags ⊆ free_of_tags`).
    ⚠ NOTE: Kiro's draft had this inverted (used OR instead of superset).
    Get it right this time.
  - Apply the skin-type filter: if `good_for_skin_types` is non-empty,
    the user's `skin_type` must appear in it.
  - Rank by overlap between the alternative's `good_for_goals` and the
    user's `skin_goals`; higher overlap wins. Return up to 3.
  - If zero rows qualify, call `llm_client.find_alternatives()` with the
    ALTERNATIVE_FINDER_PROMPT as a fallback.

The GET /api/alternatives router already implements the same qualifies()
filter — feel free to factor it out if you want.

Input schema:  schemas.agent.AlternativeFinderInput
Output schema: schemas.agent.AlternativeFinderOutput
"""
from services.agents.base import AbstractAgent
from schemas.agent import AlternativeFinderInput, AlternativeFinderOutput


class AlternativeFinderAgent(AbstractAgent):
    async def run(self, input: AlternativeFinderInput) -> AlternativeFinderOutput:
        raise NotImplementedError("AlternativeFinderAgent.run — owned by agents teammate")
