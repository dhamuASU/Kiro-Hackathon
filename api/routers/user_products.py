from fastapi import APIRouter

from deps import CurrentUser, SupabaseClient
from schemas.product import UserProductCreate, UserProductOut

router = APIRouter(prefix="/user-products", tags=["user-products"])


@router.get("", response_model=list[UserProductOut])
async def list_user_products(user: CurrentUser, db: SupabaseClient) -> list[UserProductOut]:
    result = (
        db.table("user_products")
        .select("*, product:products(*)")
        .eq("user_id", user["sub"])
        .execute()
    )
    return [UserProductOut(**r) for r in result.data]


@router.post("", response_model=UserProductOut, status_code=201)
async def add_user_product(body: UserProductCreate, user: CurrentUser, db: SupabaseClient) -> UserProductOut:
    # mode="json" serializes UUID fields (product_id) to strings before
    # supabase-py's httpx JSON encoder sees them.
    data = {**body.model_dump(mode="json", exclude_none=True), "user_id": user["sub"]}
    result = db.table("user_products").insert(data).execute()
    return UserProductOut(**result.data[0])


@router.delete("/{user_product_id}", status_code=204)
async def remove_user_product(user_product_id: str, user: CurrentUser, db: SupabaseClient) -> None:
    db.table("user_products").delete().eq("id", user_product_id).eq("user_id", user["sub"]).execute()
