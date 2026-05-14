"""Load municipal discount rules from versioned JSON (annual updates)."""

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Optional

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"


class RulesNotFoundError(FileNotFoundError):
    pass


def rules_path_for_year(year: int) -> Path:
    return _DATA_DIR / f"municipal_rules_{year}.json"


@lru_cache(maxsize=8)
def load_municipal_rules(year: int = 2026) -> Dict[str, Any]:
    path = rules_path_for_year(year)
    if not path.is_file():
        raise RulesNotFoundError(f"No rules file at {path}")
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def get_city_rules(city_id: str, year: int = 2026) -> Optional[Dict[str, Any]]:
    data = load_municipal_rules(year)
    cities = data.get("cities") or {}
    cid = city_id.strip().lower().replace(" ", "_").replace("-", "_")
    return cities.get(cid)


def clear_rules_cache() -> None:
    """For tests or hot-reload after editing JSON."""
    load_municipal_rules.cache_clear()
