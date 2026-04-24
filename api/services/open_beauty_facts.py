import httpx

from config import settings
from schemas.product import ProductOut


async def lookup_barcode(barcode: str, db) -> ProductOut | None:
    """Check local cache first, then Open Beauty Facts."""
    cached = db.table("products").select("*").eq("off_id", barcode).maybe_single().execute()
    if cached.data:
        return ProductOut(**cached.data)

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(f"{settings.obf_base_url}/product/{barcode}.json")
        if resp.status_code != 200:
            return None
        data = resp.json().get("product")
        if not data:
            return None

    product = {
        "off_id": barcode,
        "name": data.get("product_name", ""),
        "brand": data.get("brands", ""),
        "ingredients_raw": data.get("ingredients_text", ""),
        "ingredients_parsed": [i.strip() for i in (data.get("ingredients_text") or "").split(",") if i.strip()],
        "image_url": data.get("image_url"),
        "source": "open_beauty_facts",
    }

    result = db.table("products").upsert(product, on_conflict="off_id").execute()
    return ProductOut(**result.data[0])


async def search_products(query: str, category_slug: str | None = None) -> list[dict]:
    params = {"search_terms": query, "json": 1, "page_size": 8}
    if category_slug:
        params["tagtype_0"] = "categories"
        params["tag_contains_0"] = "contains"
        params["tag_0"] = category_slug

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(f"{settings.obf_base_url}/search", params=params)
        resp.raise_for_status()
        return resp.json().get("products", [])
