---
name: supabase-patterns
description: Supabase patterns — Postgres + auth + RLS, supabase-py on the server, @supabase/ssr in Next.js, MCP-driven debugging. Use when touching auth flow, RLS policies, migrations, or the Python/JS Supabase clients.
---

# Supabase Patterns (CleanLabel)

## Project facts

- **Project ref:** read from `SUPABASE_URL` env var (`https://<PROJECT_REF>.supabase.co`)
- **Tables:** `profiles`, `products`, `user_products`, `ingredients`, `analogies`, `bans`, `alternatives`, `analyses`, `feedback`, `audit_log` + `auth.users` (managed)
- **`analyses.wellness`** is `JSONB` — stores skin_age + AM/PM routine output
- **Modern asymmetric JWTs**: don't try to verify locally with HS256. Always go through `auth.get_user(token)`.

## Server (Python — supabase-py)

```python
# api/deps.py
from supabase import create_client, Client
from config import settings

def get_supabase() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_role_key)

async def current_user(credentials):
    """Modern Supabase uses asymmetric JWT keys; never decode locally."""
    sb = get_supabase()
    resp = sb.auth.get_user(credentials.credentials)
    user = getattr(resp, "user", None)
    if not user or not user.id:
        raise HTTPException(401, "Invalid or expired token")
    return {"sub": user.id, "email": user.email, "role": "authenticated", "aud": "authenticated"}
```

### Common pitfalls

- **UUID serialization:** `model_dump(mode="json")` before insert, otherwise supabase-py's `json.dumps` chokes on Pydantic UUIDs.
- **`.maybe_single()` vs `.limit(1)`:** `maybe_single()` returns `None` when empty AND the data is unwrapped (no `.data[0]`). `limit(1).execute().data` returns a list. Pick one and stick with it.
- **`supabase-py` < 2.10** rejects `sb_secret_*` keys with a regex. Pin `supabase>=2.10,<3` in pyproject.
- **Batch inserts:**
  ```python
  rows = [{**p.model_dump(mode="json", exclude_none=True), "user_id": user["sub"]} for p in body.products]
  db.table("user_products").insert(rows).execute()
  ```

### Batched lookups (kills N+1)

```python
# 80 ingredients → one round-trip instead of 80 ilike calls
ors = ",".join(f"inci_name.ilike.{n}" for n in names)
rows = db.table("ingredients").select("*").or_(ors).execute().data
```

## Browser (Next.js — @supabase/ssr)

```typescript
// frontend/lib/supabase/browser.ts
import { createBrowserClient } from "@supabase/ssr";

let _client: SupabaseClient | null = null;
export function getSupabaseBrowser() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_* envs");
  _client = createBrowserClient(url, key);
  return _client;
}
```

### Auth modes

- **Magic link (`signInWithOtp`)** needs working SMTP. Gmail SMTP is unreliable; Resend works first try.
- **Password (`signInWithPassword` / `signUp`)** is SMTP-free if "Confirm email" is OFF.
- **Auto-confirm trigger** (defense in depth) — bypasses dashboard config:
  ```sql
  create or replace function public.auto_confirm_user()
  returns trigger language plpgsql security definer as $$
  begin
    if new.email_confirmed_at is null then
      new.email_confirmed_at := now();
    end if;
    return new;
  end;
  $$;
  drop trigger if exists trg_auto_confirm_user on auth.users;
  create trigger trg_auto_confirm_user before insert on auth.users
  for each row execute function public.auto_confirm_user();
  ```

## RLS (always-on for `public` schema)

- Every exposed table MUST have RLS + a real policy. Don't default everything to the same `auth.uid()` shape.
- **Generated columns** (`auth.users.confirmed_at`) cannot be updated to a literal — only `DEFAULT`. Set the source column instead (`email_confirmed_at`).
- **Views bypass RLS** unless created `WITH (security_invoker = true)`.
- **UPDATE needs SELECT policy** — without it, the update silently affects 0 rows.

## CORS (FastAPI)

`api/config.py`:
```python
cors_origins: list[str] = ["http://localhost:3000"]
```
Set `CORS_ORIGINS='["http://localhost:3000","https://kirocleanlabel.netlify.app"]'` in production envs (Heroku config var).

## MCP debugging cheatsheet

When a flow breaks, fetch logs by service before guessing:

```
mcp__plugin_supabase_supabase__get_logs(project_id="<PROJECT_REF>", service="auth")
                                                                       service="api"
                                                                       service="postgres"
                                                                       service="edge-function"
                                                                       service="storage"
```

Common signatures:
- `535 5.7.8 BadCredentials` → SMTP host/user/app-password mismatch
- `over_email_send_rate_limit` → SMTP failed → confirmation email backed up → toggle "Confirm email" OFF
- `Email not confirmed` → trigger missing OR email confirm still required
- `One-time token not found` → magic-link reused or expired

## Migrations

- Use `mcp__plugin_supabase_supabase__execute_sql` for iteration; `apply_migration` writes a migration history row on every call (you'll get stuck).
- When ready to commit: `supabase db pull <name> --local --yes`, then `supabase db advisors` to lint.
- Always run `supabase db advisors` before merging schema changes.

## Security checklist (Supabase-specific)

- Never read `user_metadata` / `raw_user_meta_data` for authorization — it's user-editable.
- Service role key NEVER in `NEXT_PUBLIC_*`. Anything `NEXT_PUBLIC_*` ships to the browser.
- Storage upsert needs `INSERT + SELECT + UPDATE` — granting only INSERT silently fails on replace.
- Don't put `security definer` functions in an exposed schema.
