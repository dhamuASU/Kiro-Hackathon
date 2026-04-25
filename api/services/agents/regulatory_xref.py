"""Regulatory Cross-Reference Agent — OWNED BY AGENTS TEAMMATE. Pure SQL, no LLM."""
from services.agents.base import AbstractAgent
from schemas.agent import RegulatoryXrefInput, RegulatoryXrefOutput
from schemas.ingredient import BanOut


class RegulatoryXrefAgent(AbstractAgent):
    async def run(self, input: RegulatoryXrefInput) -> RegulatoryXrefOutput:
        if not input.ingredient_ids:
            return RegulatoryXrefOutput(bans=[])

        rows = (
            self.db.table("bans")
            .select("*")
            .in_("ingredient_id", [str(i) for i in input.ingredient_ids])
            .execute()
        ).data

        return RegulatoryXrefOutput(bans=[BanOut(**r) for r in rows])
