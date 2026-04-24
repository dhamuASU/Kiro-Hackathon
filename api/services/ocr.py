"""
OCR service — OWNED BY AGENTS TEAMMATE.

Thin wrapper that dispatches to the Claude-vision methods on `llm_client`.
The dispatch logic below is safe; the actual vision work lives in
`services.llm.client.extract_label_{front,back}` which the teammate fills in.
"""
from services.llm.client import llm_client


async def extract_label(image_base64: str, mode: str) -> dict:
    """
    Called by POST /api/scan/label.

    mode="front" → {"brand": str, "product_name": str, "confidence": float}
    mode="back"  → {"ingredients_raw": str, "ingredients_parsed": [str],
                    "confidence": float}

    The router validates the base64 payload and wraps LLM failures into
    a 502 LLM_FAILURE error envelope, so this service can raise freely.
    """
    if mode == "front":
        return await llm_client.extract_label_front(image_base64)
    return await llm_client.extract_label_back(image_base64)
