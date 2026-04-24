from typing import Any, Literal

from pydantic import BaseModel

ErrorCode = Literal[
    "UNAUTHORIZED",
    "FORBIDDEN",
    "NOT_FOUND",
    "VALIDATION_ERROR",
    "LLM_FAILURE",
    "OBF_UNAVAILABLE",
    "RATE_LIMITED",
    "INTERNAL_ERROR",
]


class ErrorBody(BaseModel):
    code: str
    message: str
    details: dict[str, Any] | None = None


class ErrorResponse(BaseModel):
    error: ErrorBody


_STATUS_TO_CODE: dict[int, str] = {
    400: "VALIDATION_ERROR",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    422: "VALIDATION_ERROR",
    429: "RATE_LIMITED",
    500: "INTERNAL_ERROR",
    502: "LLM_FAILURE",
    503: "OBF_UNAVAILABLE",
}


def code_for_status(status_code: int) -> str:
    return _STATUS_TO_CODE.get(status_code, "INTERNAL_ERROR")
