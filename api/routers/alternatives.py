from fastapi import APIRouter, Query

from deps import CurrentUser, SupabaseClient
from schemas.product import AlternativeOut

router = APIRouter(prefix="/alternatives", tags=["alternatives"])


@router.get("", response_model=list[AlternativeOut])
async def get_alternatives(
    user: CurrentUser,
    db: SupabaseClient,
    category_slug: str = Query(...),
    avoid_tags: list[str] = Query(default=[]),
    skin_type: str | None = None,
) -> list[AlternativeOut]:
    """Find cleaner swaps in the seeded alternatives catalog.

    Applies the same filter logic as the AlternativeFinder agent: an alternative
    qualifies only if its free_of_tags is a superset of the caller's avoid_tags,
    and (when skin_type is given) good_for_skin_types contains it — unless the
    alternative has no skin-type restrictions at all.
    """
    result = (
        db.table("alternatives")
        .select("*")
        .eq("category_slug", category_slug)
        .execute()
    )

    def qualifies(row: dict) -> bool:
        free_of = set(row.get("free_of_tags") or [])
        if not set(avoid_tags).issubset(free_of):
            return False
        good_for = row.get("good_for_skin_types") or []
        if skin_type and good_for and skin_type not in good_for:
            return False
        return True

    matches = [r for r in result.data if qualifies(r)][:10]
    return [AlternativeOut(**m) for m in matches]
