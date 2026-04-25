"""Alternative Finder Agent.

Tries the curated `alternatives` table first; falls back to a single LLM call.
Per-call timeout so a slow LLM response can't stall the orchestrator.
"""
import asyncio
import logging
from decimal import Decimal, InvalidOperation
from uuid import uuid4

from services.agents.base import AbstractAgent
from schemas.agent import AlternativeFinderInput, AlternativeFinderOutput
from schemas.product import AlternativeOut
from services.llm.client import llm_client
from services.llm.prompts import ALTERNATIVE_FINDER_PROMPT

log = logging.getLogger(__name__)

LLM_TIMEOUT_S = 12.0


def _qualifies(row: dict, avoid_tags: list[str], skin_type: str) -> bool:
    free_of = set(row.get("free_of_tags") or [])
    if not set(avoid_tags).issubset(free_of):
        return False
    good_for = row.get("good_for_skin_types") or []
    if skin_type and good_for and skin_type not in good_for:
        return False
    return True


def _parse_price(raw: str | None) -> Decimal | None:
    if not raw:
        return None
    try:
        cleaned = raw.replace("$", "").split("-")[0].strip()
        return Decimal(cleaned)
    except (InvalidOperation, ValueError, AttributeError):
        return None


class AlternativeFinderAgent(AbstractAgent):
    async def run(self, input: AlternativeFinderInput) -> AlternativeFinderOutput:
        try:
            rows = (
                self.db.table("alternatives")
                .select("*")
                .eq("category_slug", input.category_slug)
                .execute()
            ).data or []
        except Exception as exc:
            log.warning("alternative_finder: db read failed err=%s", exc)
            rows = []

        skin_type = input.profile.skin_type
        matches = [r for r in rows if _qualifies(r, input.avoid_tags, skin_type)]
        user_goals = set(input.profile.skin_goals)
        matches.sort(
            key=lambda r: len(user_goals & set(r.get("good_for_goals") or [])),
            reverse=True,
        )
        matches = matches[:3]

        if matches:
            log.info("alternative_finder: %s curated=%d", input.category_slug, len(matches))
            return AlternativeFinderOutput(
                alternatives=[AlternativeOut(**r) for r in matches]
            )

        # LLM fallback (timeout-bounded)
        try:
            llm_results = await asyncio.wait_for(
                llm_client.find_alternatives(
                    input.category_slug,
                    input.avoid_tags,
                    input.profile.model_dump(mode="json"),
                    ALTERNATIVE_FINDER_PROMPT,
                ),
                timeout=LLM_TIMEOUT_S,
            )
        except (asyncio.TimeoutError, Exception) as exc:
            log.warning("alternative_finder: %s llm failed err=%s", input.category_slug, exc)
            return AlternativeFinderOutput(alternatives=[])

        alternatives = []
        for item in (llm_results or [])[:3]:
            alternatives.append(AlternativeOut(
                id=uuid4(),
                category_slug=input.category_slug,
                product_name=item.get("name", "") or "",
                brand=item.get("brand", "") or "",
                reason=item.get("reason"),
                avg_price_usd=_parse_price(item.get("price")),
            ))
        log.info("alternative_finder: %s llm=%d", input.category_slug, len(alternatives))
        return AlternativeFinderOutput(alternatives=alternatives)
