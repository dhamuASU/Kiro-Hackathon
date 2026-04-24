from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

ProductSource = Literal["open_beauty_facts", "llm_resolved", "user_paste"]


class ProductOut(BaseModel):
    id: UUID
    off_id: str | None = None
    name: str
    brand: str | None = None
    category_slug: str | None = None
    ingredients_raw: str | None = None
    ingredients_parsed: list[str] = []
    image_url: str | None = None
    source: ProductSource = "open_beauty_facts"
    popularity: int = 0


class ProductSearchResult(BaseModel):
    results: list[ProductOut]


class ProductResolveRequest(BaseModel):
    brand: str
    name: str
    category_slug: str


class ProductResolveResponse(BaseModel):
    product: ProductOut
    confidence: float
    warning: str | None = None


# ── user_products ─────────────────────────────────────────────────────────────

class UserProductCreate(BaseModel):
    category_slug: str
    product_id: UUID | None = None          # nullable: paste path
    custom_name: str | None = None
    custom_ingredients: str | None = None   # raw paste


class UserProductBatchCreate(BaseModel):
    products: list[UserProductCreate]


class UserProductOut(BaseModel):
    id: UUID
    user_id: UUID
    product_id: UUID | None = None
    category_slug: str | None = None
    custom_name: str | None = None
    custom_ingredients: str | None = None
    product: ProductOut | None = None


# ── alternatives ──────────────────────────────────────────────────────────────

class AlternativeOut(BaseModel):
    id: UUID
    category_slug: str
    product_name: str
    brand: str
    free_of_tags: list[str] = []
    good_for_skin_types: list[str] = []
    good_for_goals: list[str] = []
    avg_price_usd: Decimal | None = None
    url: str | None = None
    image_url: str | None = None
    reason: str | None = None
