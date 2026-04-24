"""
Profile Reasoner Agent — OWNED BY AGENTS TEAMMATE.

Takes the user's profile + all ScannerAgent outputs and RANKS each flagged
ingredient by relevance to *this specific user*. Drops noise, promotes
anything that directly sabotages a stated goal.

Required behavior (from the spec):
  - Flatten all flagged items across all scans into a single list, paired
    with their `product_id`.
  - Call `llm_client.rank_ingredients(profile, flagged, PROFILE_REASONER_PROMPT)`.
    The LLM's job is judgment-heavy, so this one is LLM-based (unlike the
    Regulatory Xref which is pure SQL).
  - For each ranked item the LLM returns, resolve the `ingredient_id` by
    looking up the INCI name in the `ingredients` table. Skip any that
    don't resolve (Scanner may have found LLM-only entries for unknowns).
  - Populate `flagged_products` with the full ProductOut rows for every
    product that still has at least one ranked-flagged item after the cull —
    the Orchestrator uses this to drive AlternativeFinder.

Input schema:  schemas.agent.ProfileReasonerInput
Output schema: schemas.agent.ProfileReasonerOutput
"""
from services.agents.base import AbstractAgent
from schemas.agent import ProfileReasonerInput, ProfileReasonerOutput


class ProfileReasonerAgent(AbstractAgent):
    async def run(self, input: ProfileReasonerInput) -> ProfileReasonerOutput:
        raise NotImplementedError("ProfileReasonerAgent.run — owned by agents teammate")
