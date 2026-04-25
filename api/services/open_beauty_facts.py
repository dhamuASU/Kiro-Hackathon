"""
Open Beauty Facts (OBF) integration.

OBF etiquette (https://wiki.openfoodfacts.org/API):
  • Every request MUST include a descriptive User-Agent so OBF can reach us if
    our app misbehaves. Requests without one can be rate-limited.
  • 1 API call = 1 real user scan. Never loop the live API to build your own
    copy — for bulk, use the Parquet dumps instead:
      https://huggingface.co/datasets/openfoodfacts/product-database
"""
from typing import Any

import httpx

from config import settings
from schemas.product import ProductOut

# Hazard-relevant / dose-relevant tags we'll surface to the frontend via the
# product `image_url`/category payload. Kept as a hint; the Scanner Agent does
# the real classification downstream.
_LIGHT_HAZARD_LABELS = {
    "en:palm-oil",
    "en:fragrance-sensitizer-free",
    "en:sulfate-free",
    "en:paraben-free",
    "en:cruelty-free",
    "en:vegan",
    "en:organic",
}


def _headers() -> dict[str, str]:
    return {
        "User-Agent": settings.obf_user_agent,
        "Accept": "application/json",
    }


def _parse_product(barcode: str, raw: dict[str, Any]) -> dict:
    """
    Normalize an OBF `product` blob into our `products` row shape.

    `ingredients_tags` is preferred when present (OBF normalizes names, strips
    "organic-" prefixes, resolves synonyms); we fall back to splitting the raw
    text if it's empty — common for partial / community entries.
    """
    tags: list[str] = raw.get("ingredients_tags") or []
    parsed_from_tags = [_pretty_tag(t) for t in tags if t]

    if not parsed_from_tags:
        parsed_from_tags = [
            p.strip()
            for p in (raw.get("ingredients_text") or "").split(",")
            if p.strip()
        ]

    return {
        "off_id": barcode,
        "name": raw.get("product_name") or raw.get("generic_name") or "",
        "brand": raw.get("brands") or None,
        # OBF `categories_tags` is an array like ["en:face-care", "en:moisturizers"];
        # we leave category_slug to the caller (the user picked one in the UI).
        "category_slug": None,
        "ingredients_raw": raw.get("ingredients_text") or "",
        "ingredients_parsed": parsed_from_tags,
        "image_url": raw.get("image_front_url") or raw.get("image_url"),
        "source": "open_beauty_facts",
    }


def _pretty_tag(tag: str) -> str:
    """en:sodium-lauryl-sulfate -> Sodium Lauryl Sulfate."""
    core = tag.split(":", 1)[-1]
    return " ".join(w.capitalize() for w in core.replace("_", "-").split("-"))


async def lookup_barcode(barcode: str, db) -> ProductOut | None:
    """
    Resolve a barcode to a Product. Cache-first (avoids a network round trip
    and respects OBF's "1 call = 1 real scan" request), then hits the live
    OBF JSON API.
    """
    # supabase-py 2.x returns a list for .select(); use the first result if any.
    cached = (
        db.table("products").select("*").eq("off_id", barcode).limit(1).execute()
    )
    if cached.data:
        return ProductOut(**cached.data[0])

    url = f"{settings.obf_base_url}/product/{barcode}.json"
    async with httpx.AsyncClient(timeout=10, headers=_headers()) as client:
        try:
            resp = await client.get(url)
        except httpx.HTTPError:
            return None

    if resp.status_code != 200:
        return None

    payload = resp.json()
    # OBF returns {"status": 0, "status_verbose": "product not found"} when missing.
    if payload.get("status") != 1:
        return None
    raw = payload.get("product")
    if not raw:
        return None

    product = _parse_product(barcode, raw)
    # category_slug can't be inferred reliably from OBF alone — leave nullable
    # unless the caller (scan router) already knows it.
    result = db.table("products").upsert(product, on_conflict="off_id").execute()
    return ProductOut(**result.data[0]) if result.data else ProductOut(**product)


async def search_products(query: str, category_slug: str | None = None) -> list[dict]:
    """
    Free-text search via OBF's v1 CGI endpoint (`/cgi/search.pl`).

    IMPORTANT: OBF's v2 `/api/v2/search` endpoint does NOT filter by
    `search_terms` — it returns the entire 58K-product database unfiltered.
    Only the legacy v1 CGI endpoint actually scopes results by query.
    Page size kept small — we never want to scrape OBF (1 call = 1 real
    user search per their etiquette).
    """
    # Derive the CGI root from obf_base_url: strip `/api/v2` if present.
    root = settings.obf_base_url.rstrip("/")
    if root.endswith("/api/v2"):
        root = root[: -len("/api/v2")]

    # Category filtering against OBF's tag taxonomy is too strict — many real
    # products (Nioxin, some Head & Shoulders) have incomplete category tags
    # and get filtered out. We rely on the text query + popularity sort and
    # let the user pick from the first page.
    params: dict[str, str | int] = {
        "search_terms": query,
        "json": 1,
        "page_size": 12,
        "sort_by": "unique_scans_n",
    }
    _ = category_slug  # kept for future use; ignored on the OBF side today.

    async with httpx.AsyncClient(timeout=10, headers=_headers()) as client:
        resp = await client.get(f"{root}/cgi/search.pl", params=params)
        resp.raise_for_status()
        return resp.json().get("products", [])
