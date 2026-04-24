import base64
import binascii
from difflib import SequenceMatcher
from typing import Union

from fastapi import APIRouter, HTTPException, status

from deps import CurrentUser, SupabaseClient
from schemas.product import ProductOut
from schemas.scan import (
    BarcodeMatched,
    BarcodeScanRequest,
    BarcodeUnmatched,
    FrontExtracted,
    FrontMatchCandidate,
    LabelBackResponse,
    LabelFrontResponse,
    LabelScanRequest,
)
from services.ocr import extract_label
from services.open_beauty_facts import lookup_barcode

router = APIRouter(prefix="/scan", tags=["scan"])

# ~10 MB raw → ~13.3 MB base64. Keep a little headroom.
_MAX_IMAGE_B64_BYTES = 14 * 1024 * 1024


def _validate_image_b64(data: str) -> None:
    if len(data) > _MAX_IMAGE_B64_BYTES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "VALIDATION_ERROR", "message": "Image exceeds 10MB limit"},
        )
    try:
        base64.b64decode(data, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "VALIDATION_ERROR", "message": "Invalid base64 image data"},
        )


BarcodeResponse = Union[BarcodeMatched, BarcodeUnmatched]


@router.post("/barcode", response_model=BarcodeResponse)
async def scan_barcode(
    body: BarcodeScanRequest,
    user: CurrentUser,
    db: SupabaseClient,
) -> BarcodeResponse:
    """Decode a client-side barcode → look up in Open Beauty Facts."""
    product = await lookup_barcode(body.barcode, db)
    if product is None:
        return BarcodeUnmatched(
            barcode=body.barcode,
            hint="Barcode not in Open Beauty Facts. Try scanning the back of the product or paste the ingredient list.",
        )
    return BarcodeMatched(product=product)


LabelResponse = Union[LabelFrontResponse, LabelBackResponse]


@router.post("/label", response_model=LabelResponse)
async def scan_label(
    body: LabelScanRequest,
    user: CurrentUser,
    db: SupabaseClient,
) -> LabelResponse:
    """Claude-vision OCR. `front` mode extracts brand+name and searches OBF;
    `back` mode extracts the ingredient list directly."""
    _validate_image_b64(body.image_base64)

    try:
        raw = await extract_label(body.image_base64, body.mode)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "LLM_FAILURE", "message": str(exc)},
        ) from exc

    if body.mode == "front":
        extracted = FrontExtracted(
            brand=raw.get("brand", ""),
            product_name=raw.get("product_name", ""),
        )
        matches = await _match_front(db, extracted, body.category_hint)
        return LabelFrontResponse(
            extracted=extracted,
            confidence=float(raw.get("confidence", 0.85)),
            matches=matches,
        )

    ingredients_parsed = raw.get("ingredients_parsed") or []
    extracted_text = raw.get("ingredients_raw") or ", ".join(ingredients_parsed)
    confidence = float(raw.get("confidence", 0.0))

    product: ProductOut | None = None
    if confidence >= 0.7 and ingredients_parsed:
        # Persist as a user_paste-source product for immediate use downstream
        inserted = (
            db.table("products")
            .insert({
                "name": "Scanned product (back label)",
                "category_slug": body.category_hint,
                "ingredients_raw": extracted_text,
                "ingredients_parsed": ingredients_parsed,
                "source": "user_paste",
            })
            .execute()
        )
        if inserted.data:
            product = ProductOut(**inserted.data[0])

    return LabelBackResponse(
        extracted_text=extracted_text,
        ingredients_parsed=ingredients_parsed,
        confidence=confidence,
        product=product,
    )


async def _match_front(
    db,
    extracted: FrontExtracted,
    category_hint: str | None,
) -> list[FrontMatchCandidate]:
    """Fuzzy-match extracted brand+name against the local products cache.

    For MVP we search the cache only; a production build would also hit OBF
    search directly when local cache misses."""
    if not extracted.brand and not extracted.product_name:
        return []

    query = db.table("products").select(
        "id, name, brand, category_slug, image_url"
    )
    if category_hint:
        query = query.eq("category_slug", category_hint)
    if extracted.brand:
        query = query.ilike("brand", f"%{extracted.brand}%")
    elif extracted.product_name:
        query = query.ilike("name", f"%{extracted.product_name}%")

    rows = query.limit(10).execute().data or []

    needle = f"{extracted.brand} {extracted.product_name}".strip().lower()
    scored: list[FrontMatchCandidate] = []
    for r in rows:
        haystack = f"{r.get('brand') or ''} {r.get('name') or ''}".strip().lower()
        score = SequenceMatcher(None, needle, haystack).ratio() if needle else 0.0
        scored.append(FrontMatchCandidate(match_score=round(score, 2), **r))
    scored.sort(key=lambda m: m.match_score, reverse=True)
    return scored[:5]
