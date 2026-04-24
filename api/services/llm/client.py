"""
LLM client — OWNED BY AGENTS TEAMMATE.

Every method below is a stub. The signatures + docstrings are the contract
the rest of the backend builds against (routers, agents, OCR). Fill in the
implementations using the Anthropic SDK (`anthropic.AsyncAnthropic`) with
`settings.claude_model` and the prompt templates in `services/llm/prompts.py`.

Conventions:
- All methods are async.
- JSON-returning methods MUST return a parsed dict/list (no markdown fences).
- Vision methods accept a base64-encoded JPEG string.
- On upstream failure the router layer wraps errors into a `LLM_FAILURE`
  error envelope — feel free to raise normal exceptions from here.
"""
import anthropic

from config import settings

_client: anthropic.AsyncAnthropic | None = None


def _get_client() -> anthropic.AsyncAnthropic:
    """Lazy-init Anthropic async client. Safe to use; do not stub."""
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


class LLMClient:
    async def classify_ingredient(self, inci_name: str, prompt: str) -> dict:
        """
        TODO [agents teammate]: Classify whether a single INCI ingredient is a
        concern. Called by ScannerAgent for ingredients NOT found in the
        local `ingredients` table (~5% of cases).

        Contract:
          input  → inci_name (e.g. "Sodium Lauryl Sulfate"), prompt (system
                   prompt; pass SCANNER_PROMPT from services.llm.prompts)
          output → {"is_concerning": bool, "hazard_tags": [str]}
                   hazard_tags drawn from:
                     endocrine_disruptor | irritant | sensitizer | drying
                     comedogenic | photoreactive | formaldehyde_releaser
        """
        raise NotImplementedError("classify_ingredient — owned by agents teammate")

    async def rank_ingredients(self, profile: dict, flagged: list[dict], prompt: str) -> list[dict]:
        """
        TODO [agents teammate]: Rank flagged ingredients by relevance to THIS
        user's skin type + goals. Called by ProfileReasonerAgent.

        Contract:
          input  → profile (ProfileOut dict: age_range, gender, skin_type,
                   skin_goals, allergies, life_stage); flagged (array of
                   {product_id, inci_name, hazard_tags}); PROFILE_REASONER_PROMPT
          output → [{"inci_name": str, "product_id": str,
                    "relevance": "high"|"medium"|"low", "reason": str}, ...]

        Logic hint: HIGH when the ingredient's goals_against intersects the
        user's skin_goals; bump further if bad_for_skin_types matches.
        """
        raise NotImplementedError("rank_ingredients — owned by agents teammate")

    async def write_analogy(self, ingredient: dict, profile: dict, goal_slug: str, prompt: str) -> dict:
        """
        TODO [agents teammate]: Generate an analogy-first explanation for one
        flagged ingredient, calibrated to one user goal. Called by
        AnalogyWriterAgent only when no curated analogy exists in the
        `analogies` table.

        Contract:
          input  → ingredient (IngredientOut dict), profile (ProfileOut dict),
                   goal_slug (one of the skin_goals), ANALOGY_WRITER_PROMPT
          output → {"analogy_one_liner": str, "full_explanation": str}

        Rules (also in the prompt — but enforce any way you can):
          1. Respect dose.
          2. Respect the user's goal.
          3. Be true.
          4. Never use the word "TOXIC". No scare tactics.
        """
        raise NotImplementedError("write_analogy — owned by agents teammate")

    async def fact_check_analogy(self, analogy: str, ingredient: dict, prompt: str) -> dict:
        """
        TODO [agents teammate]: Second LLM pass that validates the chemistry in
        a generated analogy. Called immediately after write_analogy().

        Contract:
          input  → analogy (one-liner string), ingredient (IngredientOut dict),
                   ANALOGY_FACTCHECK_PROMPT
          output → {"passed": bool, "reason": str}

        If passed is False, the router stores the analogy with
        fact_check_passed=False so the frontend can suppress or flag it.
        """
        raise NotImplementedError("fact_check_analogy — owned by agents teammate")

    async def find_alternatives(self, category_slug: str, avoid_tags: list[str], profile: dict, prompt: str) -> list[dict]:
        """
        TODO [agents teammate]: LLM fallback for AlternativeFinderAgent when the
        curated `alternatives` table has no matches for the category +
        avoid_tags combo.

        Contract:
          input  → category_slug, avoid_tags (list[str]), profile (dict),
                   ALTERNATIVE_FINDER_PROMPT
          output → 1–3 items: [{"name": str, "brand": str, "price": str,
                   "reason": str}, ...]
        """
        raise NotImplementedError("find_alternatives — owned by agents teammate")

    async def resolve_product(self, brand: str, name: str, category_slug: str, prompt: str) -> dict:
        """
        TODO [agents teammate]: Given a brand + product name + category, return
        the most likely ingredient list (INCI). Called by POST
        /api/products/resolve when Open Beauty Facts has no match.

        Contract:
          input  → brand, name, category_slug, PRODUCT_RESOLVER_PROMPT
          output → {"ingredients_parsed": [str], "confidence": float,
                    "image_url": str | null}

        Guardrails: if you aren't confident the product exists, return
        confidence < 0.3 and an empty ingredients_parsed. The router will
        surface a warning to the user when confidence < 0.7.
        """
        raise NotImplementedError("resolve_product — owned by agents teammate")

    async def extract_label_front(self, image_base64: str) -> dict:
        """
        TODO [agents teammate]: Claude vision — extract brand + product name
        from a photo of the FRONT of a cosmetic product. Called by the
        POST /api/scan/label (mode=front) flow.

        Contract:
          input  → image_base64 (JPEG, up to ~10 MB raw)
          output → {"brand": str, "product_name": str, "confidence": float}
        """
        raise NotImplementedError("extract_label_front — owned by agents teammate")

    async def extract_label_back(self, image_base64: str) -> dict:
        """
        TODO [agents teammate]: Claude vision — extract the ingredient list
        from a photo of the BACK of a cosmetic product. Called by the
        POST /api/scan/label (mode=back) flow.

        Contract:
          input  → image_base64 (JPEG, up to ~10 MB raw)
          output → {"ingredients_raw": str, "ingredients_parsed": [str],
                    "confidence": float}

        The router auto-persists the result as a `user_paste`-source product
        when confidence >= 0.7; below that threshold the user is asked to
        confirm the extracted text.
        """
        raise NotImplementedError("extract_label_back — owned by agents teammate")


llm_client = LLMClient()
