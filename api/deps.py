from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client, create_client

from config import settings

_supabase: Client | None = None


def get_supabase() -> Client:
    """Lazy singleton — uses the service-role key, so bypasses RLS."""
    global _supabase
    if _supabase is None:
        _supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)
    return _supabase


_bearer = HTTPBearer()


async def current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
) -> dict:
    """Validate a Supabase access token.

    Modern Supabase projects sign JWTs with asymmetric keys (ES256/RS256)
    exposed via a JWKS endpoint — they are NOT verifiable with an HS256
    shared secret. The only signature scheme that works across both
    legacy and modern projects is to let Supabase's auth server validate
    the token for us via `auth.get_user(jwt)`. Adds ~40-80ms per request;
    completely safe.

    Returns a dict shaped like the old `jwt.decode` payload so existing
    routers (`user["sub"]`, `user["email"]`, `user["role"]`) keep working.
    """
    token = credentials.credentials
    sb = get_supabase()

    try:
        resp = sb.auth.get_user(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc

    user = getattr(resp, "user", None)
    if not user or not getattr(user, "id", None):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    return {
        "sub": user.id,
        "email": getattr(user, "email", None),
        "role": getattr(user, "role", None) or "authenticated",
        "aud": getattr(user, "aud", None) or "authenticated",
    }


CurrentUser = Annotated[dict, Depends(current_user)]
SupabaseClient = Annotated[Client, Depends(get_supabase)]
