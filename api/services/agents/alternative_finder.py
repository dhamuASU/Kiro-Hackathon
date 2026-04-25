"""Alternative Finder Agent — OWNED BY AGENTS TEAMMATE."""
from decimal import Decimal

from services.agents.base import AbstractAgent
from schemas.agent import AlternativeFinderInput, AlternativeFinderOutput
from schemas.product import AlternativeOut
from services.llm.client import llm_client
from services.llm.prompts import ALTERNATIVE_FINDER_PROMPT


def _qualifies(row: dict, avoid_tags: list[str], skin_type: str) -> bool:
    free_of = set(row.get("free_of_tags") or [])
    if not set(avoid_tags).issubset(free_of):
        return False
    good_for = row.get("good_for_skin_types") or []
    if skin_type and good_for and skin_type not in good_for:
        return False
    return True


class AlternativeFinderAgent(AbstractAgent):
    async def run(self, input: AlternativeFinderInput) -> AlternativeFinderOutput:
        rows = (
            self.db.table("alternatives")
            .select("*")
            .eq("category_slug", input.category_slug)
            .execute()
        ).data

        skin_type = input.profile.skin_type
        matches = [r for r in rows if _qualifies(r, input.avoid_tags, skin_type)]

        # Rank by goal overlap
        user_goals = set(input.profile.skin_goals)
        matches.sort(
            key=lambda r: len(user_goals & set(r.get("good_for_goals") or [])),
            reverse=True,
        )
        matches = matches[:3]

        if matches:
            return AlternativeFinderOutput(
                alternatives=[AlternativeOut(**r) for r in matches]
            )

        # LLM fallback
        llm_results = await llm_client.find_alternatives(
            input.category_slug,
            input.avoid_tags,
            input.profile.model_dump(mode="json"),
            ALTERNATIVE_FINDER_PROMPT,
        )
        # LLM returns minimal dicts — build stub AlternativeOut objects
        from uuid import uuid4
        alternatives = []
        for item in llm_results[:3]:
            alternatives.append(
                AlternativeOut(
                    id=uuid4(),
                    category_slug=input.category_slug,
                    product_name=item.get("name", ""),
                    brand=item.get("brand", ""),
                    reason=item.get("reason"),
                    avg_price_usd=Decimal(str(item["price"].replace("$", "").split("-")[0].strip()))
                    if item.get("price")
                    else None,
                )
            )
        return AlternativeFinderOutput(alternatives=alternatives)
