"""Scanner Agent.

Reads each product's ingredient list and flags anything we already know is a concern.

Speed strategy:
- One batched Supabase query per product (`in_("inci_name_lower", […])`) instead
  of N ilike queries. For an 83-ingredient product this is the difference between
  ~10s of round-trips and ~150ms.
- LLM is only invoked when an ingredient is BOTH unknown to our DB AND on the
  EU banned list. Capped at MAX_LLM_PER_PRODUCT to keep latency bounded.
"""
import asyncio
import logging
from typing import Iterable

from services.agents.base import AbstractAgent
from schemas.agent import FlaggedItem, ScannerInput, ScannerOutput
from services.banned_lookup import is_banned
from services.llm.client import llm_client
from services.llm.prompts import SCANNER_PROMPT

log = logging.getLogger(__name__)

MAX_LLM_PER_PRODUCT = 5
LLM_TIMEOUT_S = 8.0


def _norm(name: str) -> str:
    return name.strip().lower()


class ScannerAgent(AbstractAgent):
    async def run(self, input: ScannerInput) -> ScannerOutput:
        product = input.product
        names = [n for n in product.ingredients_parsed if n and n.strip()]
        if not names:
            log.info("scanner: product=%s has no ingredients", product.id)
            return ScannerOutput(product_id=product.id, flagged=[])

        log.info("scanner: product=%s ingredients=%d", product.id, len(names))
        await self.emit("scanner.progress", {
            "product_id": str(product.id),
            "ingredients": len(names),
        })

        # ── 1. Batch DB lookup (single round-trip) ───────────────────────────
        lower_set = {_norm(n) for n in names}
        rows = self._batch_fetch(lower_set)
        # Build a normalized map: lowercased inci -> row
        db_map = {_norm(r["inci_name"]): r for r in rows}

        flagged: list[FlaggedItem] = []
        unknown_banned: list[tuple[int, str]] = []  # (position, inci)

        for position, inci in enumerate(names):
            key = _norm(inci)
            row = db_map.get(key)
            if row is not None:
                tags = row.get("hazard_tags") or []
                if tags:
                    flagged.append(FlaggedItem(
                        inci_name=row["inci_name"],
                        position=position,
                        hazard_tags=tags,
                        known_in_db=True,
                    ))
                continue
            if is_banned(inci):
                unknown_banned.append((position, inci))

        # ── 2. LLM classify the unknown-but-banned ones (capped, parallel) ───
        capped = unknown_banned[:MAX_LLM_PER_PRODUCT]
        if capped:
            log.info("scanner: product=%s llm_classify=%d (skipped %d)",
                     product.id, len(capped), len(unknown_banned) - len(capped))
            results = await asyncio.gather(*[
                self._classify(inci) for _, inci in capped
            ], return_exceptions=True)
            for (position, inci), result in zip(capped, results):
                if isinstance(result, Exception):
                    log.warning("scanner: classify failed inci=%s err=%s", inci, result)
                    tags = ["eu_banned"]
                else:
                    tags = result.get("hazard_tags") or ["eu_banned"]
                flagged.append(FlaggedItem(
                    inci_name=inci,
                    position=position,
                    hazard_tags=tags,
                    known_in_db=False,
                ))

        # Plus any banned-but-uncalled ones get a default flag (no LLM cost)
        for position, inci in unknown_banned[MAX_LLM_PER_PRODUCT:]:
            flagged.append(FlaggedItem(
                inci_name=inci,
                position=position,
                hazard_tags=["eu_banned"],
                known_in_db=False,
            ))

        log.info("scanner: product=%s flagged=%d", product.id, len(flagged))
        return ScannerOutput(product_id=product.id, flagged=flagged)

    def _batch_fetch(self, lower_names: Iterable[str]) -> list[dict]:
        """One Supabase query for all the names. We re-normalize client-side."""
        names = list(lower_names)
        if not names:
            return []
        # Supabase has no case-insensitive in_(); pull a generous range and
        # filter in Python. We chunk to keep `or_` filter strings reasonable.
        chunk_size = 80
        all_rows: list[dict] = []
        for i in range(0, len(names), chunk_size):
            chunk = names[i:i + chunk_size]
            ors = ",".join(f"inci_name.ilike.{n.replace(',', '')}" for n in chunk)
            try:
                resp = (
                    self.db.table("ingredients")
                    .select("id, inci_name, hazard_tags")
                    .or_(ors)
                    .execute()
                )
                all_rows.extend(resp.data or [])
            except Exception as exc:
                log.warning("scanner: batch fetch failed chunk=%d err=%s", i, exc)
        return all_rows

    async def _classify(self, inci: str) -> dict:
        return await asyncio.wait_for(
            llm_client.classify_ingredient(inci, SCANNER_PROMPT),
            timeout=LLM_TIMEOUT_S,
        )
