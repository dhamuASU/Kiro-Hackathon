"""
verify_supabase.py — sanity check that the backend can talk to Supabase.

Reads .env, connects with the service-role key, and runs a few read-only queries
that mirror what the agents and routers actually do at runtime:
  • categories     → 12 (the onboarding picker)
  • ingredients    → ≥ 20 (Scanner DB-first lookup)
  • analogies      → ≥ 15 (Analogy Writer curated path)
  • bans           → ≥ 19 (Regulatory Xref)
  • products       → ≥ 11 (common-products picker + demo)
Run from `api/`:   python scripts/verify_supabase.py
"""
import os
import sys
from pathlib import Path

# Load .env without importing pydantic-settings (keeps this script standalone)
ENV_FILE = Path(__file__).resolve().parent.parent / ".env"
if ENV_FILE.exists():
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        os.environ.setdefault(k.strip(), v.strip())

url = os.environ.get("SUPABASE_URL", "")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not url or "YOUR_PROJECT_REF" in url:
    sys.exit("✗ SUPABASE_URL not set in .env")
if not key or "REPLACE_WITH" in key:
    sys.exit("✗ SUPABASE_SERVICE_ROLE_KEY still has the placeholder — paste your real key into api/.env")

try:
    from supabase import create_client
except ImportError:
    sys.exit("✗ supabase-py not installed — run `pip install -e .` from the api/ dir")

print(f"→ {url}")
db = create_client(url, key)

EXPECTED = [
    ("categories",   12),
    ("ingredients",  20),
    ("analogies",    15),
    ("bans",         19),
    ("alternatives", 17),
    ("products",     11),
]

failures: list[str] = []
for table, expected in EXPECTED:
    try:
        rows = db.table(table).select("*", count="exact").limit(1).execute()
        got = rows.count or 0
        ok = got >= expected
        marker = "✓" if ok else "✗"
        print(f"  {marker} {table:14} got {got:3} (expected ≥ {expected})")
        if not ok:
            failures.append(f"{table}: got {got}, expected ≥ {expected}")
    except Exception as exc:
        print(f"  ✗ {table:14} ERROR: {exc}")
        failures.append(f"{table}: {exc}")

# Spot-check the analogy money path (the demo's pitch line)
print("\n→ analogy money path (SLS × less_sensitivity):")
try:
    sls = db.table("ingredients").select("id").eq("inci_name", "Sodium Lauryl Sulfate").single().execute()
    sls_id = sls.data["id"]
    analogy = (
        db.table("analogies").select("analogy_one_liner, full_explanation")
        .eq("ingredient_id", sls_id).eq("goal_slug", "less_sensitivity").single().execute()
    )
    print(f'  ✓ "{analogy.data["analogy_one_liner"]}"')
except Exception as exc:
    print(f"  ✗ {exc}")
    failures.append(f"analogy lookup: {exc}")

if failures:
    print("\n✗ FAILED:")
    for f in failures:
        print(f"  · {f}")
    sys.exit(1)

print("\n✓ Supabase wired up. The backend can read everything it needs.")
