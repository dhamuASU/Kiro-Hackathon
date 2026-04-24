"""
Scanner Agent — OWNED BY AGENTS TEAMMATE.

Reads ONE product's ingredient list → returns a `ScannerOutput` listing the
ingredients of concern.

Required behavior (from the spec):
  - DB-first lookup: for each `inci_name` in the product's parsed list,
    SELECT from the `ingredients` table (case-insensitive match).
  - If the ingredient is present AND has non-empty `hazard_tags`, add it to
    the `flagged` list with `known_in_db=True`.
  - If the ingredient is NOT in the DB (the ~5% tail), call
    `llm_client.classify_ingredient()` with the SCANNER_PROMPT. If the LLM
    returns `is_concerning=True`, add it to `flagged` with `known_in_db=False`
    and use the LLM-provided `hazard_tags`.
  - Preserve the `position` of each ingredient (its index in the INCI list) —
    that's a rough proxy for concentration, which the downstream Profile
    Reasoner and Analogy Writer both care about.

Input schema:  schemas.agent.ScannerInput
Output schema: schemas.agent.ScannerOutput
"""
from services.agents.base import AbstractAgent
from schemas.agent import ScannerInput, ScannerOutput


class ScannerAgent(AbstractAgent):
    async def run(self, input: ScannerInput) -> ScannerOutput:
        raise NotImplementedError("ScannerAgent.run — owned by agents teammate")
