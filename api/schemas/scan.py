from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from schemas.product import ProductOut


# ── Barcode ──────────────────────────────────────────────────────────────────

class BarcodeScanRequest(BaseModel):
    barcode: str = Field(..., min_length=6, max_length=32)
    category_hint: str | None = None


class BarcodeMatched(BaseModel):
    matched: Literal[True] = True
    product: ProductOut


class BarcodeUnmatched(BaseModel):
    matched: Literal[False] = False
    barcode: str
    hint: str


# ── Label (camera) ───────────────────────────────────────────────────────────

LabelMode = Literal["front", "back"]


class LabelScanRequest(BaseModel):
    image_base64: str = Field(..., min_length=1)
    mode: LabelMode
    category_hint: str | None = None


class FrontExtracted(BaseModel):
    brand: str
    product_name: str


class FrontMatchCandidate(BaseModel):
    id: UUID
    name: str
    brand: str | None = None
    category_slug: str | None = None
    image_url: str | None = None
    match_score: float


class LabelFrontResponse(BaseModel):
    mode: Literal["front"] = "front"
    extracted: FrontExtracted
    confidence: float
    matches: list[FrontMatchCandidate] = []


class LabelBackResponse(BaseModel):
    mode: Literal["back"] = "back"
    extracted_text: str
    ingredients_parsed: list[str]
    confidence: float
    product: ProductOut | None = None
