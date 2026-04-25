from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

from schemas.ingredient import BanOut
from schemas.product import AlternativeOut, ProductOut

AnalysisStatus = Literal["pending", "running", "completed", "failed"]
Relevance = Literal["high", "medium", "low"]


class FlaggedIngredient(BaseModel):
    ingredient_id: UUID
    inci_name: str
    product_id: UUID
    position: int
    hazard_tags: list[str]
    relevance: Relevance
    reason: str
    analogy_one_liner: str | None = None
    full_explanation: str | None = None
    bans: list[BanOut] = []


class ProductAnalysis(BaseModel):
    product: ProductOut
    flagged: list[FlaggedIngredient]
    alternatives: list[AlternativeOut] = []


class AnalysisOut(BaseModel):
    id: UUID
    user_id: UUID
    status: AnalysisStatus
    profile_snapshot: dict = {}
    user_product_ids: list[str] = []
    output: list[ProductAnalysis] | None = None
    wellness: dict | None = None
    llm_model: str | None = None
    total_tokens: int | None = None
    duration_ms: int | None = None
    error: str | None = None
    created_at: datetime | None = None
    completed_at: datetime | None = None


class AnalysisCreateResponse(BaseModel):
    analysis_id: UUID
    status: AnalysisStatus = "pending"
