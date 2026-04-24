from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from config import settings
from routers import (
    analyze,
    alternatives,
    health,
    ingredients,
    onboarding,
    products,
    profile,
    scan,
    user_products,
)
from schemas.errors import code_for_status

app = FastAPI(title="CleanLabel API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(onboarding.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(scan.router, prefix="/api")
app.include_router(user_products.router, prefix="/api")
app.include_router(analyze.router, prefix="/api")
app.include_router(ingredients.router, prefix="/api")
app.include_router(alternatives.router, prefix="/api")


def _envelope(status_code: int, message: str, details: dict | None = None, code: str | None = None) -> dict:
    return {
        "error": {
            "code": code or code_for_status(status_code),
            "message": message,
            "details": details,
        }
    }


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    detail = exc.detail
    code: str | None = None
    message: str
    details: dict | None = None

    if isinstance(detail, dict):
        code = detail.get("code")
        message = detail.get("message") or str(detail)
        details = detail.get("details")
    else:
        message = str(detail) if detail else "Error"

    return JSONResponse(
        status_code=exc.status_code,
        content=_envelope(exc.status_code, message, details, code),
        headers=exc.headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content=_envelope(
            422,
            "Request body failed validation",
            details={"errors": jsonable_encoder(exc.errors())},
            code="VALIDATION_ERROR",
        ),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    """Catch-all so nothing leaks FastAPI's default plain-text 500 response."""
    return JSONResponse(
        status_code=500,
        content=_envelope(500, "Internal server error", details={"type": exc.__class__.__name__}),
    )
