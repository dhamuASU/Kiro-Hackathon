"""Profile Reasoner Agent.

Single LLM call to rank the flagged items by relevance to *this* user.

Speed strategy:
- Cap the input size — if the Scanner produced 40+ flagged items we send only
  the top N by hazard severity to keep the prompt small and bounded.
- Resolve ingredient_ids via one batched query instead of one per row.
- Cap output to MAX_RANKED_ITEMS so downstream Analogy Writer doesn't fan out
  to 50+ parallel LLM calls.
"""
import asyncio
import logging
from uuid import UUID

from services.agents.base import AbstractAgent
from schemas.agent import ProfileReasonerInput, ProfileReasonerOutput, RankedFlaggedItem
from schemas.product import ProductOut
from services.llm.client import llm_client
from services.llm.prompts import PROFILE_REASONER_PROMPT

log = logging.getLogger(__name__)

MAX_INPUT_ITEMS = 30
MAX_RANKED_ITEMS = 12
LLM_TIMEOUT_S = 15.0

_SEVERE = {"endocrine_disruptor", "carcinogen", "formaldehyde_releaser", "eu_banned"}


def _severity(tags: list[str]) -> int:
    return sum(2 if t in _SEVERE else 1 for t in tags)


class ProfileReasonerAgent(AbstractAgent):
    async def run(self, input: ProfileReasonerInput) -> ProfileReasonerOutput:
        flat: list[dict] = []
        for scan in input.scans:
            for item in scan.flagged:
                flat.append({
                    "product_id": str(scan.product_id),
                    "inci_name": item.inci_name,
                    "hazard_tags": item.hazard_tags,
                    "_sev": _severity(item.hazard_tags),
                })

        if not flat:
            log.info("profile_reasoner: no flagged items")
            return ProfileReasonerOutput(flagged=[], flagged_products=[])

        # Cap and prioritize by severity
        flat.sort(key=lambda f: f["_sev"], reverse=True)
        capped = flat[:MAX_INPUT_ITEMS]
        for f in capped:
            f.pop("_sev", None)
        log.info("profile_reasoner: in=%d capped=%d", len(flat), len(capped))

        try:
            ranked_raw = await asyncio.wait_for(
                llm_client.rank_ingredients(
                    input.profile.model_dump(mode="json"),
                    capped,
                    PROFILE_REASONER_PROMPT,
                ),
                timeout=LLM_TIMEOUT_S,
            )
        except (asyncio.TimeoutError, Exception) as exc:
            log.warning("profile_reasoner: llm failed err=%s — heuristic fallback", exc)
            ranked_raw = [
                {
                    "inci_name": f["inci_name"],
                    "product_id": f["product_id"],
                    "relevance": "high" if any(t in _SEVERE for t in f["hazard_tags"]) else "medium",
                    "reason": f"Flagged for: {', '.join(f['hazard_tags'])}",
                }
                for f in capped
            ]

        ranked_raw = ranked_raw[:MAX_RANKED_ITEMS]

        # Batch-resolve ingredient_ids in one query
        unique_inci = list({(r.get("inci_name") or "").lower() for r in ranked_raw if r.get("inci_name")})
        id_map: dict[str, str] = {}
        if unique_inci:
            ors = ",".join(f"inci_name.ilike.{n.replace(',', '')}" for n in unique_inci)
            try:
                rows = (
                    self.db.table("ingredients")
                    .select("id, inci_name")
                    .or_(ors)
                    .execute()
                ).data or []
                id_map = {r["inci_name"].lower(): r["id"] for r in rows}
            except Exception as exc:
                log.warning("profile_reasoner: id resolve failed err=%s", exc)

        ranked: list[RankedFlaggedItem] = []
        flagged_product_ids: set[str] = set()

        for item in ranked_raw:
            inci = (item.get("inci_name") or "").lower()
            ing_id = id_map.get(inci)
            if not ing_id:
                continue
            try:
                ranked.append(RankedFlaggedItem(
                    ingredient_id=UUID(ing_id),
                    product_id=UUID(item["product_id"]),
                    relevance=item.get("relevance", "low"),
                    reason=item.get("reason", ""),
                ))
                flagged_product_ids.add(item["product_id"])
            except (KeyError, ValueError) as exc:
                log.warning("profile_reasoner: skip malformed item err=%s", exc)

        # Batch-fetch flagged ProductOut rows in one query
        flagged_products: list[ProductOut] = []
        if flagged_product_ids:
            try:
                rows = (
                    self.db.table("products")
                    .select("*")
                    .in_("id", list(flagged_product_ids))
                    .execute()
                ).data or []
                flagged_products = [ProductOut(**r) for r in rows]
            except Exception as exc:
                log.warning("profile_reasoner: products fetch failed err=%s", exc)

        log.info("profile_reasoner: ranked=%d products=%d", len(ranked), len(flagged_products))
        return ProfileReasonerOutput(flagged=ranked, flagged_products=flagged_products)
