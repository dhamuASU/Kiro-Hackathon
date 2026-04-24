from fastapi import APIRouter, BackgroundTasks

from deps import CurrentUser, SupabaseClient
from schemas.analysis import AnalysisCreateResponse
from schemas.product import UserProductBatchCreate, UserProductOut
from schemas.profile import ProfileCreate, ProfileOut

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.post("/profile", response_model=ProfileOut, status_code=201)
async def save_profile(body: ProfileCreate, user: CurrentUser, db: SupabaseClient) -> ProfileOut:
    """Steps 1–3: save age, gender, skin type, goals, allergies."""
    data = {**body.model_dump(), "id": user["sub"]}
    result = db.table("profiles").upsert(data).execute()
    return ProfileOut(**result.data[0])


@router.post("/products", response_model=dict, status_code=201)
async def save_products(body: UserProductBatchCreate, user: CurrentUser, db: SupabaseClient) -> dict:
    """Step 4: batch-save user's products."""
    rows = [
        {**p.model_dump(exclude_none=True), "user_id": user["sub"]}
        for p in body.products
    ]
    result = db.table("user_products").insert(rows).execute()
    return {"user_products": result.data}


@router.post("/complete", response_model=AnalysisCreateResponse, status_code=202)
async def complete_onboarding(
    user: CurrentUser,
    db: SupabaseClient,
    background_tasks: BackgroundTasks,
) -> AnalysisCreateResponse:
    """Mark onboarding complete and trigger first analysis."""
    db.table("profiles").update({"onboarding_complete": True}).eq("id", user["sub"]).execute()

    # Delegate to analyze router logic by importing the trigger function
    from routers.analyze import _trigger
    return await _trigger(user, db, background_tasks)
