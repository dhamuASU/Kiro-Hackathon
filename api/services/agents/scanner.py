"""Scanner Agent — OWNED BY AGENTS TEAMMATE."""
from services.agents.base import AbstractAgent
from schemas.agent import FlaggedItem, ScannerInput, ScannerOutput
from services.llm.client import llm_client
from services.llm.prompts import SCANNER_PROMPT


class ScannerAgent(AbstractAgent):
    async def run(self, input: ScannerInput) -> ScannerOutput:
        flagged: list[FlaggedItem] = []

        for position, inci_name in enumerate(input.product.ingredients_parsed):
            rows = (
                self.db.table("ingredients")
                .select("id, inci_name, hazard_tags")
                .ilike("inci_name", inci_name)
                .execute()
            ).data

            if rows:
                row = rows[0]
                hazard_tags = row.get("hazard_tags") or []
                if hazard_tags:
                    flagged.append(
                        FlaggedItem(
                            inci_name=row["inci_name"],
                            position=position,
                            hazard_tags=hazard_tags,
                            known_in_db=True,
                        )
                    )
            else:
                result = await llm_client.classify_ingredient(inci_name, SCANNER_PROMPT)
                if result.get("is_concerning"):
                    flagged.append(
                        FlaggedItem(
                            inci_name=inci_name,
                            position=position,
                            hazard_tags=result.get("hazard_tags", []),
                            known_in_db=False,
                        )
                    )

        return ScannerOutput(product_id=input.product.id, flagged=flagged)
