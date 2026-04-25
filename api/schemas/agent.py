from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel

from schemas.ingredient import BanOut
from schemas.product import ProductOut
from schemas.profile import ProfileOut


# ── Scanner ──────────────────────────────────────────────────────────────────

class ScannerInput(BaseModel):
    product: ProductOut


class FlaggedItem(BaseModel):
    inci_name: str
    position: int
    hazard_tags: list[str]
    known_in_db: bool


class ScannerOutput(BaseModel):
    product_id: UUID
    flagged: list[FlaggedItem]


# ── Profile Reasoner ─────────────────────────────────────────────────────────

class ProfileReasonerInput(BaseModel):
    profile: ProfileOut
    scans: list[ScannerOutput]


class RankedFlaggedItem(BaseModel):
    ingredient_id: UUID
    product_id: UUID
    relevance: Literal["high", "medium", "low"]
    reason: str


class ProfileReasonerOutput(BaseModel):
    flagged: list[RankedFlaggedItem]
    flagged_products: list[ProductOut]


# ── Analogy Writer ────────────────────────────────────────────────────────────

class AnalogyWriterInput(BaseModel):
    ingredient: Any  # IngredientOut
    profile: ProfileOut
    goal_slug: str


class AnalogyWriterOutput(BaseModel):
    analogy_one_liner: str | None
    full_explanation: str
    source: Literal["curated", "llm"]
    fact_check_passed: bool


# ── Alternative Finder ────────────────────────────────────────────────────────

class AlternativeFinderInput(BaseModel):
    category_slug: str
    avoid_tags: list[str]
    profile: ProfileOut


class AlternativeFinderOutput(BaseModel):
    alternatives: list[Any]  # AlternativeOut


# ── Regulatory Cross-ref ──────────────────────────────────────────────────────

class RegulatoryXrefInput(BaseModel):
    ingredient_ids: list[UUID]


class RegulatoryXrefOutput(BaseModel):
    bans: list[BanOut]


# ── Orchestrator ──────────────────────────────────────────────────────────────

class OrchestratorInput(BaseModel):
    analysis_id: UUID
    profile: ProfileOut
    products: list[ProductOut]


class OrchestratorOutput(BaseModel):
    analysis_id: UUID
    product_analyses: list[Any]  # ProductAnalysis


# ── SSE event ─────────────────────────────────────────────────────────────────

class AgentEvent(BaseModel):
    event: str          # e.g. "scanner.done"
    data: dict[str, Any]
