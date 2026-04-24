"""
Regulatory Cross-Reference Agent — OWNED BY AGENTS TEAMMATE.

Pure SQL. No LLM. The spec is explicit about this: we want exact regulation
citations, not paraphrased ones — hallucinated regulations are worse than
no regulations.

Required behavior (from the spec):
  - SELECT * FROM bans WHERE ingredient_id IN (input.ingredient_ids).
  - Map to `BanOut` records and return.
  - If `ingredient_ids` is empty, short-circuit to an empty list.

Input schema:  schemas.agent.RegulatoryXrefInput
Output schema: schemas.agent.RegulatoryXrefOutput (list of BanOut)
"""
from services.agents.base import AbstractAgent
from schemas.agent import RegulatoryXrefInput, RegulatoryXrefOutput


class RegulatoryXrefAgent(AbstractAgent):
    async def run(self, input: RegulatoryXrefInput) -> RegulatoryXrefOutput:
        raise NotImplementedError("RegulatoryXrefAgent.run — owned by agents teammate")
