"""
Orchestrator Agent — OWNED BY AGENTS TEAMMATE.

Drives the five sub-agents in order, emits SSE events, and composes the
final ProductAnalysis[] payload that the router writes to analyses.output.
"""
import asyncio
from typing import Any
from uuid import UUID

from services.agents.alternative_finder import AlternativeFinderAgent
from services.agents.analogy_writer import AnalogyWriterAgent
from services.agents.base import AbstractAgent
from services.agents.profile_reasoner import ProfileReasonerAgent
from services.agents.regulatory_xref import RegulatoryXrefAgent
from services.agents.scanner import ScannerAgent
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

_RELEVANCE_ORDER = {"high": 0, "medium": 1, "low": 2}


class OrchestratorAgent(AbstractAgent):
    def __init__(self, bus: EventBus, db: Any) -> None:
        super().__init__(bus, db)
        self.scanner = ScannerAgent(bus, db)
        self.profile_reasoner = ProfileReasonerAgent(bus, db)
        self.analogy_writer = AnalogyWriterAgent(bus, db)
        self.alternative_finder = AlternativeFinderAgent(bus, db)
        self.regulatory_xref = RegulatoryXrefAgent(bus, db)

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
        profile = ProfileOut(**profile_row)
        products = [ProductOut(**row["product"]) for row in product_rows if row.get("product")]

        if not products:
            return []

        # ── 1. Scanner (parallel per product) ────────────────────────────────
        scans = list(
            await asyncio.gather(*[
                self.scanner.run(ScannerInput(product=p)) for p in products
            ])
        )
        await self.emit("scanner.done", {"product_count": len(products)})

        # ── 2. Profile Reasoner ───────────────────────────────────────────────
        reasoner_out = await self.profile_reasoner.run(
            ProfileReasonerInput(profile=profile, scans=scans)
        )
        await self.emit("profile_reasoner.done", {"flagged_count": len(reasoner_out.flagged)})

        if not reasoner_out.flagged:
            await self.emit("analogy_writer.done", {"count": 0})
            await self.emit("alternative_finder.done", {"count": 0})
            await self.emit("regulatory_xref.done", {"banned_count": 0})
            return []

        # ── 3. Analogy Writer (parallel per flagged item × primary goal) ──────
        primary_goal = profile.skin_goals[0] if profile.skin_goals else "general_maintenance"

        # Resolve full IngredientOut for each ranked item
        ingredient_map: dict[str, IngredientOut] = {}
        for ranked in reasoner_out.flagged:
            iid = str(ranked.ingredient_id)
            if iid not in ingredient_map:
                rows = (
                    self.db.table("ingredients")
                    .select("*")
                    .eq("id", iid)
                    .execute()
                ).data
                if rows:
                    ingredient_map[iid] = IngredientOut(**rows[0])

        analogy_tasks = [
            self.analogy_writer.run(
                AnalogyWriterInput(
                    ingredient=ingredient_map[str(r.ingredient_id)],
                    profile=profile,
                    goal_slug=primary_goal,
                )
            )
            for r in reasoner_out.flagged
            if str(r.ingredient_id) in ingredient_map
        ]
        analogy_results = list(await asyncio.gather(*analogy_tasks))
        await self.emit("analogy_writer.done", {"count": len(analogy_results)})

        # ── 4. Alternative Finder (parallel per flagged product) ──────────────
        alt_tasks = [
            self.alternative_finder.run(
                AlternativeFinderInput(
                    category_slug=p.category_slug or "",
                    avoid_tags=self._collect_avoid_tags(p, reasoner_out.flagged, scans),
                    profile=profile,
                )
            )
            for p in reasoner_out.flagged_products
        ]
        alt_results = list(await asyncio.gather(*alt_tasks))
        await self.emit("alternative_finder.done", {"count": len(alt_results)})

        # ── 5. Regulatory Xref (single call, all unique ingredient IDs) ───────
        unique_ids = list({r.ingredient_id for r in reasoner_out.flagged})
        xref_out = await self.regulatory_xref.run(
            RegulatoryXrefInput(ingredient_ids=unique_ids)
        )
        await self.emit("regulatory_xref.done", {"banned_count": len(xref_out.bans)})

        # ── 6. Compose ProductAnalysis[] ──────────────────────────────────────
        bans_by_ingredient: dict[str, list] = {}
        for ban in xref_out.bans:
            bans_by_ingredient.setdefault(str(ban.ingredient_id), []).append(ban)

        # Map ranked items to analogy results (same order as analogy_tasks)
        ranked_with_analogy = list(zip(
            [r for r in reasoner_out.flagged if str(r.ingredient_id) in ingredient_map],
            analogy_results,
        ))

        # Group flagged items by product
        flagged_by_product: dict[str, list[FlaggedIngredient]] = {}
        for ranked, analogy in ranked_with_analogy:
            pid = str(ranked.product_id)
            iid = str(ranked.ingredient_id)
            ingredient = ingredient_map[iid]

            # Find position from original scan
            position = self._find_position(pid, ingredient.inci_name, scans)

            fi = FlaggedIngredient(
                ingredient_id=ranked.ingredient_id,
                inci_name=ingredient.inci_name,
                product_id=ranked.product_id,
                position=position,
                hazard_tags=ingredient.hazard_tags,
                relevance=ranked.relevance,
                reason=ranked.reason,
                analogy_one_liner=analogy.analogy_one_liner if analogy.fact_check_passed else None,
                full_explanation=analogy.full_explanation,
                bans=bans_by_ingredient.get(iid, []),
            )
            flagged_by_product.setdefault(pid, []).append(fi)

        # Sort each product's flagged list: relevance order then position asc
        for pid in flagged_by_product:
            flagged_by_product[pid].sort(
                key=lambda fi: (_RELEVANCE_ORDER.get(fi.relevance, 9), fi.position)
            )

        # Build alternatives map keyed by product id
        alts_by_product: dict[str, list] = {}
        for product, alt_out in zip(reasoner_out.flagged_products, alt_results):
            alts_by_product[str(product.id)] = alt_out.alternatives

        # Assemble final list — one entry per product that has flagged items
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

        return [pa.model_dump(mode="json") for pa in product_analyses]

    # ── helpers ───────────────────────────────────────────────────────────────

    def _find_position(self, product_id: str, inci_name: str, scans: list) -> int:
        for scan in scans:
            if str(scan.product_id) == product_id:
                for item in scan.flagged:
                    if item.inci_name.lower() == inci_name.lower():
                        return item.position
        return 0

    def _collect_avoid_tags(self, product: ProductOut, ranked: list, scans: list) -> list[str]:
        """Collect all hazard_tags from flagged items belonging to this product."""
        pid = str(product.id)
        tags: set[str] = set()
        for scan in scans:
            if str(scan.product_id) == pid:
                for item in scan.flagged:
                    tags.update(item.hazard_tags)
        return list(tags)
