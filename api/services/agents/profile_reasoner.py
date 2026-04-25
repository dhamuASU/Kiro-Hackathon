"""Profile Reasoner Agent — OWNED BY AGENTS TEAMMATE."""
from uuid import UUID

from services.agents.base import AbstractAgent
from schemas.agent import ProfileReasonerInput, ProfileReasonerOutput, RankedFlaggedItem
from schemas.product import ProductOut
from services.llm.client import llm_client
from services.llm.prompts import PROFILE_REASONER_PROMPT


class ProfileReasonerAgent(AbstractAgent):
    async def run(self, input: ProfileReasonerInput) -> ProfileReasonerOutput:
        # Build flat list of flagged items across all scans
        flat: list[dict] = []
        scan_by_product: dict[str, "ScannerOutput"] = {}  # type: ignore[name-defined]
        for scan in input.scans:
            scan_by_product[str(scan.product_id)] = scan
            for item in scan.flagged:
                flat.append({
                    "product_id": str(scan.product_id),
                    "inci_name": item.inci_name,
                    "hazard_tags": item.hazard_tags,
                })

        if not flat:
            return ProfileReasonerOutput(flagged=[], flagged_products=[])

        ranked_raw: list[dict] = await llm_client.rank_ingredients(
            input.profile.model_dump(mode="json"),
            flat,
            PROFILE_REASONER_PROMPT,
        )

        ranked: list[RankedFlaggedItem] = []
        flagged_product_ids: set[str] = set()

        for item in ranked_raw:
            inci = item.get("inci_name", "")
            rows = (
                self.db.table("ingredients")
                .select("id")
                .ilike("inci_name", inci)
                .execute()
            ).data
            if not rows:
                continue  # unresolvable — skip

            ingredient_id = UUID(rows[0]["id"])
            product_id = UUID(item["product_id"])
            ranked.append(
                RankedFlaggedItem(
                    ingredient_id=ingredient_id,
                    product_id=product_id,
                    relevance=item.get("relevance", "low"),
                    reason=item.get("reason", ""),
                )
            )
            flagged_product_ids.add(str(product_id))

        # Collect unique ProductOut for flagged products
        flagged_products: list[ProductOut] = []
        seen_pids: set[str] = set()
        for scan in input.scans:
            pid = str(scan.product_id)
            if pid in flagged_product_ids and pid not in seen_pids:
                # product is carried on the ScannerInput; retrieve from DB
                rows = (
                    self.db.table("products")
                    .select("*")
                    .eq("id", pid)
                    .execute()
                ).data
                if rows:
                    flagged_products.append(ProductOut(**rows[0]))
                    seen_pids.add(pid)

        return ProfileReasonerOutput(flagged=ranked, flagged_products=flagged_products)
