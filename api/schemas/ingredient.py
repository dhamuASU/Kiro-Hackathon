from datetime import date
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

BanStatus = Literal["banned", "restricted", "requires_warning"]


class IngredientOut(BaseModel):
    id: UUID
    inci_name: str
    common_name: str | None = None
    cas_number: str | None = None
    category: str | None = None
    function_short: str | None = None
    plain_english: str
    hazard_tags: list[str] = []
    goals_against: list[str] = []
    bad_for_skin_types: list[str] = []
    dose_notes: str | None = None


class BanOut(BaseModel):
    id: UUID
    ingredient_id: UUID
    region: str
    status: BanStatus
    regulation_ref: str | None = None
    source_url: str | None = None
    reason: str | None = None
    effective_date: date | None = None
