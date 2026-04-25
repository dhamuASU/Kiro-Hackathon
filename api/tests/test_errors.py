"""Error-envelope mapping table — must stay in sync with the docs."""
import pytest

from schemas.errors import code_for_status


@pytest.mark.parametrize(
    "status,expected",
    [
        (400, "VALIDATION_ERROR"),
        (401, "UNAUTHORIZED"),
        (403, "FORBIDDEN"),
        (404, "NOT_FOUND"),
        (422, "VALIDATION_ERROR"),
        (429, "RATE_LIMITED"),
        (500, "INTERNAL_ERROR"),
        (502, "LLM_FAILURE"),
        (503, "OBF_UNAVAILABLE"),
    ],
)
def test_code_for_status_known(status: int, expected: str) -> None:
    assert code_for_status(status) == expected


def test_code_for_status_unknown_falls_back_to_internal_error() -> None:
    assert code_for_status(418) == "INTERNAL_ERROR"
    assert code_for_status(599) == "INTERNAL_ERROR"
