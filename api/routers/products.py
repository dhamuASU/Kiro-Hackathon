from fastapi import APIRouter, Query

from deps import SupabaseClient
from schemas.product import (
    ProductOut,
    ProductResolveRequest,
    ProductResolveResponse,
    ProductSearchResult,
)
from services.llm.client import llm_client
from services.llm.prompts import PRODUCT_RESOLVER_PROMPT

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/search", response_model=ProductSearchResult)
async def search_products(
    db: SupabaseClient,
    q: str = Query(..., min_length=2),
    category_slug: str | None = None,
) -> ProductSearchResult:
    """Full-text search against Open Beauty Facts cache."""
    query = db.table("products").select("*").ilike("name", f"%{q}%")
    if category_slug:
        query = query.eq("category_slug", category_slug)
    result = query.limit(8).execute()
    return ProductSearchResult(results=[ProductOut(**r) for r in result.data])


@router.get("/common", response_model=ProductSearchResult)
async def common_products(
    db: SupabaseClient,
    category_slug: str,
) -> ProductSearchResult:
    """Top-50 pre-seeded products for a category (instant, no API call)."""
    result = (
        db.table("products")
        .select("*")
        .eq("category_slug", category_slug)
        .order("popularity", desc=True)
        .limit(50)
        .execute()
    )
    return ProductSearchResult(results=[ProductOut(**r) for r in result.data])


@router.post("/resolve", response_model=ProductResolveResponse)
async def resolve_product(
    body: ProductResolveRequest,
    db: SupabaseClient,
) -> ProductResolveResponse:
    """LLM-resolve a brand+name when Open Beauty Facts has no match.

    Persists the resolved product with source='llm_resolved' so the dashboard
    can treat it like any cached product."""
    resolved = await llm_client.resolve_product(
        brand=body.brand,
        name=body.name,
        category_slug=body.category_slug,
        prompt=PRODUCT_RESOLVER_PROMPT,
    )
    ingredients = resolved.get("ingredients_parsed") or []
    confidence = float(resolved.get("confidence", 0.0))

    inserted = (
        db.table("products")
        .insert({
            "name": body.name,
            "brand": body.brand,
            "category_slug": body.category_slug,
            "ingredients_raw": ", ".join(ingredients),
            "ingredients_parsed": ingredients,
            "image_url": resolved.get("image_url"),
            "source": "llm_resolved",
        })
        .execute()
    )
    product = ProductOut(**inserted.data[0])

    warning = None
    if confidence < 0.7:
        warning = "Ingredient list LLM-generated; please verify against the actual label."

    return ProductResolveResponse(
        product=product,
        confidence=confidence,
        warning=warning,
    )
