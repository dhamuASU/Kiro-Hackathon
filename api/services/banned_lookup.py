"""In-memory lookup of EU-banned cosmetic substances (COSING Annex II)."""
import csv
import os

_BANNED: set[str] | None = None
_FILE = os.path.join(os.path.dirname(__file__), "..", "banned_chemicals", "COSING_Annex_II_v2.txt")


def _load() -> set[str]:
    names: set[str] = set()
    with open(_FILE, encoding="utf-8") as f:
        reader = csv.reader(f)
        for i, row in enumerate(reader):
            if i < 5:
                continue
            # Col 1: Chemical name / INN
            if len(row) > 1 and row[1].strip():
                names.add(row[1].strip().upper())
            # Col 8: Identified INGREDIENTS (INCI names)
            if len(row) > 8 and row[8].strip():
                for name in row[8].split(","):
                    n = name.strip()
                    if len(n) > 2:
                        names.add(n.upper())
    return names


def is_banned(inci_name: str) -> bool:
    global _BANNED
    if _BANNED is None:
        _BANNED = _load()
    return inci_name.strip().upper() in _BANNED
