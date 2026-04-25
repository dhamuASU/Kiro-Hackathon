"""
Orchestrator Agent.

Drives the five sub-agents, emits SSE events at each phase boundary, and
composes the final ProductAnalysis[] payload.

Emits start + done events so the frontend can flip rows to "running" instantly.
"""
import asyncio
import logging
import time
from typing import Any

from services.agents.alternative_finder import AlternativeFinderAgent
from services.agents.analogy_writer import AnalogyWriterAgent
from services.agents.base import AbstractAgent
from services.agents.profile_reasoner import ProfileReasonerAgent
from services.agents.regulatory_xref import RegulatoryXrefAgent
from services.agents.scanner import ScannerAgent
from services.agents.wellness import WellnessAgent
from services.events import EventBus
from schemas.agent import (
    AlternativeFinderInput,
    AnalogyWriterInput,
    ProfileReasonerInput,
    RegulatoryXrefInput,
    ScannerInput,
)
from schemas.analysis import FlaggedIngredient, ProductAnalysis
from schemas.ingredient import IngredientOut
from schemas.product import ProductOut
from schemas.profile import ProfileOut

log = logging.getLogger(__name__)

_RELEVANCE_ORDER = {"high": 0, "medium": 1, "low": 2}


class OrchestratorAgent(AbstractAgent):
    def __init__(self, bus: EventBus, db: Any) -> None:
        super().__init__(bus, db)
        self.scanner = ScannerAgent(bus, db)
        self.profile_reasoner = ProfileReasonerAgent(bus, db)
        self.analogy_writer = AnalogyWriterAgent(bus, db)
        self.alternative_finder = AlternativeFinderAgent(bus, db)
        self.regulatory_xref = RegulatoryXrefAgent(bus, db)
        self.wellness = WellnessAgent(bus, db)
        # Captured by run_from_rows so the analyze router can persist it.
        self.last_wellness: dict | None = None

    async def run(self, input: Any) -> Any:
        return await self.run_from_rows(
            analysis_id=str(input.analysis_id),
            profile_row=input.profile.model_dump(mode="json"),
            product_rows=[{"product": p.model_dump(mode="json")} for p in input.products],
        )

    async def run_from_rows(
        self,
        analysis_id: str,
        profile_row: dict,
        product_rows: list[dict],
    ) -> list[dict]:
        t0 = time.monotonic()
        profile = ProfileOut(**profile_row)
        products = [ProductOut(**row["product"]) for row in product_rows if row.get("product")]
        log.info("orchestrator: analysis=%s products=%d", analysis_id, len(products))

        if not products:
            return []

        # ── 1. Scanner (parallel per product) ────────────────────────────────
        await self.emit("scanner.start", {"product_count": len(products)})
        t = time.monotonic()
        scans = list(await asyncio.gather(*[
            self.scanner.run(ScannerInput(product=p)) for p in products
        ]))
        total_flagged = sum(len(s.flagged) for s in scans)
        log.info("orchestrator: scanner done in %.2fs flagged=%d",
                 time.monotonic() - t, total_flagged)
        await self.emit("scanner.done", {
            "product_count": len(products),
            "flagged_total": total_flagged,
        })

        # ── 2. Profile Reasoner ───────────────────────────────────────────────
        await self.emit("profile_reasoner.start", {"flagged_total": total_flagged})
        t = time.monotonic()
        reasoner_out = await self.profile_reasoner.run(
            ProfileReasonerInput(profile=profile, scans=scans)
        )
        log.info("orchestrator: profile_reasoner done in %.2fs ranked=%d",
                 time.monotonic() - t, len(reasoner_out.flagged))
        await self.emit("profile_reasoner.done", {"flagged_count": len(reasoner_out.flagged)})

        if not reasoner_out.flagged:
            await self.emit("analogy_writer.start", {"count": 0})
            await self.emit("analogy_writer.done", {"count": 0})
            await self.emit("alternative_finder.start", {"count": 0})
            await self.emit("alternative_finder.done", {"count": 0})
            await self.emit("regulatory_xref.start", {"count": 0})
            await self.emit("regulatory_xref.done", {"banned_count": 0})
            # Still produce a wellness payload — the dashboard expects it.
            self.last_wellness = await self.wellness.run({
                "profile": profile.model_dump(mode="json"),
                "products": [p.model_dump(mode="json") for p in products],
                "flagged": [],
            })
            log.info("orchestrator: nothing flagged — short-circuit, wellness ok")
            return []

        # ── 3a. Batch-resolve full IngredientOut for all ranked items ────────
        unique_ids = list({str(r.ingredient_id) for r in reasoner_out.flagged})
        ingredient_map: dict[str, IngredientOut] = {}
        if unique_ids:
            try:
                rows = (
                    self.db.table("ingredients")
                    .select("*")
                    .in_("id", unique_ids)
                    .execute()
                ).data or []
                ingredient_map = {r["id"]: IngredientOut(**r) for r in rows}
            except Exception as exc:
                log.warning("orchestrator: ingredient batch fetch failed err=%s", exc)

        primary_goal = profile.skin_goals[0] if profile.skin_goals else "general_maintenance"

        # ── 3b. Run Analogy Writer + Alternative Finder + Regulatory Xref in parallel ─
        # These three phases don't depend on each other, so we fan out together.
        analogy_inputs = [
            (r, ingredient_map[str(r.ingredient_id)])
            for r in reasoner_out.flagged
            if str(r.ingredient_id) in ingredient_map
        ]
        await self.emit("analogy_writer.start", {"count": len(analogy_inputs)})
        await self.emit("alternative_finder.start", {"count": len(reasoner_out.flagged_products)})
        await self.emit("regulatory_xref.start", {"count": len(unique_ids)})

        t = time.monotonic()
        analogy_task = asyncio.gather(*[
            self.analogy_writer.run(
                AnalogyWriterInput(ingredient=ing, profile=profile, goal_slug=primary_goal)
            )
            for _, ing in analogy_inputs
        ], return_exceptions=True)

        alt_task = asyncio.gather(*[
            self.alternative_finder.run(
                AlternativeFinderInput(
                    category_slug=p.category_slug or "",
                    avoid_tags=self._collect_avoid_tags(p, scans),
                    profile=profile,
                )
            )
            for p in reasoner_out.flagged_products
        ], return_exceptions=True)

        xref_task = self.regulatory_xref.run(
            RegulatoryXrefInput(ingredient_ids=[r.ingredient_id for r in reasoner_out.flagged])
        )

        wellness_task = self.wellness.run({
            "profile": profile.model_dump(mode="json"),
            "products": [p.model_dump(mode="json") for p in products],
            "flagged": [
                {
                    "inci_name": ingredient_map[str(r.ingredient_id)].inci_name
                                  if str(r.ingredient_id) in ingredient_map else "?",
                    "relevance": r.relevance,
                    "reason": r.reason,
                }
                for r in reasoner_out.flagged
            ],
        })

        analogy_results, alt_results, xref_out, wellness_out = await asyncio.gather(
            analogy_task, alt_task, xref_task, wellness_task
        )
        self.last_wellness = wellness_out
        log.info("orchestrator: parallel phase done in %.2fs", time.monotonic() - t)

        await self.emit("analogy_writer.done", {"count": len(analogy_results)})
        await self.emit("alternative_finder.done", {"count": len(alt_results)})
        await self.emit("regulatory_xref.done", {"banned_count": len(xref_out.bans)})

        # ── 4. Compose ProductAnalysis[] ──────────────────────────────────────
        bans_by_ingredient: dict[str, list] = {}
        for ban in xref_out.bans:
            bans_by_ingredient.setdefault(str(ban.ingredient_id), []).append(ban)

        flagged_by_product: dict[str, list[FlaggedIngredient]] = {}
        for (ranked, ingredient), analogy in zip(analogy_inputs, analogy_results):
            if isinstance(analogy, Exception):
                log.warning("orchestrator: analogy crashed for %s err=%s",
                            ingredient.inci_name, analogy)
                analogy = None
            pid = str(ranked.product_id)
            iid = str(ranked.ingredient_id)
            position = self._find_position(pid, ingredient.inci_name, scans)

            one_liner = None
            full_exp = ""
            if analogy is not None and analogy.fact_check_passed:
                one_liner = analogy.analogy_one_liner
                full_exp = analogy.full_explanation
            elif analogy is not None:
                full_exp = analogy.full_explanation

            fi = FlaggedIngredient(
                ingredient_id=ranked.ingredient_id,
                inci_name=ingredient.inci_name,
                product_id=ranked.product_id,
                position=position,
                hazard_tags=ingredient.hazard_tags,
                relevance=ranked.relevance,
                reason=ranked.reason,
                analogy_one_liner=one_liner,
                full_explanation=full_exp,
                bans=bans_by_ingredient.get(iid, []),
            )
            flagged_by_product.setdefault(pid, []).append(fi)

        for pid in flagged_by_product:
            flagged_by_product[pid].sort(
                key=lambda fi: (_RELEVANCE_ORDER.get(fi.relevance, 9), fi.position)
            )

        alts_by_product: dict[str, list] = {}
        for product, alt_out in zip(reasoner_out.flagged_products, alt_results):
            if isinstance(alt_out, Exception):
                log.warning("orchestrator: alt crashed for %s err=%s", product.id, alt_out)
                continue
            alts_by_product[str(product.id)] = alt_out.alternatives

        product_analyses: list[ProductAnalysis] = []
        for product in products:
            pid = str(product.id)
            flagged = flagged_by_product.get(pid, [])
            if not flagged:
                continue
            product_analyses.append(
                ProductAnalysis(
                    product=product,
                    flagged=flagged,
                    alternatives=alts_by_product.get(pid, []),
                )
            )

        log.info("orchestrator: analysis=%s done in %.2fs reports=%d",
                 analysis_id, time.monotonic() - t0, len(product_analyses))
        return [pa.model_dump(mode="json") for pa in product_analyses]

    # ── helpers ───────────────────────────────────────────────────────────────

    def _find_position(self, product_id: str, inci_name: str, scans: list) -> int:
        for scan in scans:
            if str(scan.product_id) == product_id:
                for item in scan.flagged:
                    if item.inci_name.lower() == inci_name.lower():
                        return item.position
        return 0

    def _collect_avoid_tags(self, product: ProductOut, scans: list) -> list[str]:
        pid = str(product.id)
        tags: set[str] = set()
        for scan in scans:
            if str(scan.product_id) == pid:
                for item in scan.flagged:
                    tags.update(item.hazard_tags)
        return list(tags)
