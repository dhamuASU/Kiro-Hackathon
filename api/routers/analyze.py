import json
import logging
import time
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks
from sse_starlette.sse import EventSourceResponse

from config import settings
from deps import CurrentUser, SupabaseClient
from schemas.analysis import AnalysisCreateResponse, AnalysisOut
from services.agents.orchestrator import OrchestratorAgent
from services.events import EventBus

log = logging.getLogger(__name__)

router = APIRouter(prefix="/analyze", tags=["analyze"])

_buses: dict[str, EventBus] = {}


async def _trigger(user: CurrentUser, db: SupabaseClient, background_tasks: BackgroundTasks) -> AnalysisCreateResponse:
    analysis_id = str(uuid4())

    # Snapshot profile + product ids at trigger time
    profile_row = db.table("profiles").select("*").eq("id", user["sub"]).single().execute()
    product_rows = db.table("user_products").select("id").eq("user_id", user["sub"]).execute()
    user_product_ids = [r["id"] for r in product_rows.data]

    db.table("analyses").insert({
        "id": analysis_id,
        "user_id": user["sub"],
        "status": "pending",
        "profile_snapshot": profile_row.data or {},
        "user_product_ids": user_product_ids,
    }).execute()

    bus = EventBus()
    _buses[analysis_id] = bus
    background_tasks.add_task(_run, analysis_id, user["sub"], db, bus)
    return AnalysisCreateResponse(analysis_id=analysis_id)  # type: ignore[arg-type]


@router.post("", response_model=AnalysisCreateResponse, status_code=202)
async def trigger_analysis(
    user: CurrentUser,
    db: SupabaseClient,
    background_tasks: BackgroundTasks,
) -> AnalysisCreateResponse:
    return await _trigger(user, db, background_tasks)


@router.get("/{analysis_id}/stream")
async def stream_analysis(analysis_id: str, user: CurrentUser) -> EventSourceResponse:
    bus = _buses.get(analysis_id)

    async def generator():
        if bus is None:
            yield {"event": "error", "data": json.dumps({"detail": "Analysis not found"})}
            return
        async for event in bus.subscribe():
            yield {"event": event.event, "data": json.dumps(event.data)}

    return EventSourceResponse(generator())


@router.get("/latest", response_model=AnalysisOut | None)
async def latest_analysis(user: CurrentUser, db: SupabaseClient) -> AnalysisOut | None:
    """Most recent completed analysis for the user, or None."""
    result = (
        db.table("analyses")
        .select("*")
        .eq("user_id", user["sub"])
        .eq("status", "completed")
        .order("completed_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        return None
    return AnalysisOut(**result.data[0])


@router.get("/{analysis_id}", response_model=AnalysisOut)
async def get_analysis(analysis_id: str, user: CurrentUser, db: SupabaseClient) -> AnalysisOut:
    result = (
        db.table("analyses")
        .select("*")
        .eq("id", analysis_id)
        .eq("user_id", user["sub"])
        .single()
        .execute()
    )
    return AnalysisOut(**result.data)


async def _run(analysis_id: str, user_id: str, db: SupabaseClient, bus: EventBus) -> None:
    start = time.monotonic()
    log.info("analyze: start id=%s user=%s", analysis_id, user_id)
    try:
        db.table("analyses").update({"status": "running"}).eq("id", analysis_id).execute()

        profile_row = db.table("profiles").select("*").eq("id", user_id).single().execute()
        product_rows = (
            db.table("user_products")
            .select("*, product:products(*)")
            .eq("user_id", user_id)
            .execute()
        )
        log.info("analyze: id=%s products=%d", analysis_id, len(product_rows.data or []))

        orchestrator = OrchestratorAgent(bus=bus, db=db)
        output = await orchestrator.run_from_rows(
            analysis_id=analysis_id,
            profile_row=profile_row.data,
            product_rows=product_rows.data,
        )

        duration_ms = int((time.monotonic() - start) * 1000)
        db.table("analyses").update({
            "status": "completed",
            "output": output,
            "duration_ms": duration_ms,
            "llm_model": settings.gemini_model,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", analysis_id).execute()

        log.info("analyze: done id=%s in %dms reports=%d",
                 analysis_id, duration_ms, len(output))
        await bus.emit("done", {"analysis_id": analysis_id, "duration_ms": duration_ms})
    except Exception as exc:
        log.exception("analyze: failed id=%s err=%s", analysis_id, exc)
        db.table("analyses").update({"status": "failed", "error": str(exc)}).eq("id", analysis_id).execute()
        await bus.emit("error", {"detail": str(exc)})
    finally:
        _buses.pop(analysis_id, None)
