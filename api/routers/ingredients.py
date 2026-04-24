from fastapi import APIRouter

from deps import SupabaseClient
from schemas.ingredient import IngredientOut

router = APIRouter(prefix="/ingredient", tags=["ingredients"])


@router.get("/{inci_name}", response_model=IngredientOut)
async def get_ingredient(inci_name: str, db: SupabaseClient) -> IngredientOut:
    """Learn mode — public read, no auth required."""
    result = (
        db.table("ingredients")
        .select("*")
        .ilike("inci_name", inci_name)
        .single()
        .execute()
    )
    return IngredientOut(**result.data)
