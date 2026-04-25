import re

from fastapi import APIRouter, Query

from deps import CurrentUser, SupabaseClient
from schemas.product import (
    ProductOut,
    ProductPasteRequest,
    ProductResolveRequest,
    ProductResolveResponse,
    ProductSearchResult,
)
from services.llm.client import llm_client
from services.llm.prompts import PRODUCT_RESOLVER_PROMPT
from services.open_beauty_facts import search_products as obf_search

router = APIRouter(prefix="/products", tags=["products"])


def _split_ingredients(raw: str) -> list[str]:
    """Split a comma-separated INCI paste into a clean array.

    Drops empties, strips whitespace, drops trailing punctuation. Lightweight —
    the Scanner agent is responsible for real name resolution downstream."""
    parts = [p.strip().rstrip(".").strip() for p in raw.split(",")]
    return [p for p in parts if p]


_STOPWORDS = {"and", "the", "of", "for", "a", "an", "or", "in", "with"}


def _tokenize_query(q: str) -> list[str]:
    """Break a user query into meaningful tokens.

    Drops connectors ("and", "the"), ampersands, and punctuation so that
    "head and shoulders" maps onto a DB row whose brand is "Head & Shoulders".
    We search each remaining token independently across name + brand and AND
    the results together — it's precision over recall, but for 2-3 word queries
    against a small curated catalog that's what we want.
    """
    cleaned = re.sub(r"[&,/\\\-]", " ", q.lower())
    tokens = [
        t for t in cleaned.split()
        if len(t) >= 2 and t not in _STOPWORDS
    ]
    return tokens


def _obf_row_to_product(raw: dict, fallback_category: str | None) -> dict | None:
    """Normalize a raw OBF search hit into our `products` row shape.

    Only returns rows that have at least a name and a barcode — anything
    without an `_id`/`code` is noise we can't cache without a unique key."""
    barcode = raw.get("code") or raw.get("_id")
    name = raw.get("product_name") or raw.get("generic_name") or ""
    if not barcode or not name:
        return None

    tags: list[str] = raw.get("ingredients_tags") or []
    parsed = [
        " ".join(w.capitalize() for w in t.split(":", 1)[-1].replace("_", "-").split("-"))
        for t in tags if t
    ]
    if not parsed:
        parsed = [
            p.strip()
            for p in (raw.get("ingredients_text") or "").split(",")
            if p.strip()
        ]

    return {
        "off_id": str(barcode),
        "name": name,
        "brand": raw.get("brands") or None,
        "category_slug": fallback_category,
        "ingredients_raw": raw.get("ingredients_text") or "",
        "ingredients_parsed": parsed,
        "image_url": raw.get("image_front_url") or raw.get("image_url"),
        "source": "open_beauty_facts",
    }


@router.get("/search", response_model=ProductSearchResult)
async def search_products(
    db: SupabaseClient,
    q: str = Query(..., min_length=2),
    category_slug: str | None = None,
) -> ProductSearchResult:
    """Search products: local cache first, Open Beauty Facts as fallback.

    1. Tokenized search against the cached `products` table. Every meaningful
       token (dropping "and", "&", etc.) must appear in name or brand.
    2. If the cache has no hit AND the query is at least 3 chars, hit OBF's
       live search API, normalize the results, upsert them into our cache,
       and return up to 8. This is the "1 call = 1 real scan" path OBF
       etiquette allows — a user is actively typing."""
    tokens = _tokenize_query(q)
    if not tokens:
        return ProductSearchResult(results=[])

    query = db.table("products").select("*")
    for token in tokens:
        query = query.or_(f"name.ilike.%{token}%,brand.ilike.%{token}%")
    if category_slug:
        query = query.eq("category_slug", category_slug)
    local = query.limit(8).execute().data or []

    if local:
        return ProductSearchResult(results=[ProductOut(**r) for r in local])

    # Cache miss → ask OBF. Only worth it for 3+ char queries (OBF rate-limits
    # noisy short ones anyway).
    if len(q.strip()) < 3:
        return ProductSearchResult(results=[])

    try:
        obf_hits = await obf_search(q, category_slug)
    except Exception:
        return ProductSearchResult(results=[])

    upserts: list[dict] = []
    for raw in obf_hits[:8]:
        row = _obf_row_to_product(raw, category_slug)
        if row:
            upserts.append(row)

    if not upserts:
        return ProductSearchResult(results=[])

    persisted = (
        db.table("products")
        .upsert(upserts, on_conflict="off_id")
        .execute()
    )
    return ProductSearchResult(results=[ProductOut(**r) for r in (persisted.data or [])])


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


@router.post("/paste", response_model=ProductOut, status_code=201)
async def paste_product(
    body: ProductPasteRequest,
    user: CurrentUser,
    db: SupabaseClient,
) -> ProductOut:
    """Create a product record from a user-pasted ingredient list.

    No LLM, no Open Beauty Facts lookup — pure insert. The resulting `product_id`
    is what the frontend attaches to a `user_products` row. Downstream agents
    then treat this like any other seeded product."""
    parsed = body.ingredients_parsed or _split_ingredients(body.ingredients_raw)
    inserted = (
        db.table("products")
        .insert({
            "name": body.name,
            "brand": body.brand,
            "category_slug": body.category_slug,
            "ingredients_raw": body.ingredients_raw,
            "ingredients_parsed": parsed,
            "source": "user_paste",
        })
        .execute()
    )
    return ProductOut(**inserted.data[0])


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
