from fastapi import APIRouter, HTTPException

from deps import CurrentUser, SupabaseClient
from schemas.profile import ProfileCreate, ProfileOut, ProfileUpdate

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=ProfileOut)
async def get_profile(user: CurrentUser, db: SupabaseClient) -> ProfileOut:
    result = db.table("profiles").select("*").eq("id", user["sub"]).single().execute()
    if not result.data:
        raise HTTPException(404, "Profile not found")
    return ProfileOut(**result.data)


@router.post("", response_model=ProfileOut, status_code=201)
async def create_profile(body: ProfileCreate, user: CurrentUser, db: SupabaseClient) -> ProfileOut:
    data = {**body.model_dump(), "id": user["sub"]}
    result = db.table("profiles").upsert(data).execute()
    return ProfileOut(**result.data[0])


@router.patch("", response_model=ProfileOut)
async def update_profile(body: ProfileUpdate, user: CurrentUser, db: SupabaseClient) -> ProfileOut:
    updates = body.model_dump(exclude_none=True)
    result = db.table("profiles").update(updates).eq("id", user["sub"]).execute()
    return ProfileOut(**result.data[0])
