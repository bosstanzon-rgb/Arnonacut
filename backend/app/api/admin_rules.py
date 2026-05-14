"""Authenticated admin endpoints to update municipal rules JSON on disk."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, Header, HTTPException, Path as ApiPath, status
from pydantic import BaseModel, Field

from ..config import get_settings
from ..services.rules_loader import clear_rules_cache, load_municipal_rules, rules_path_for_year


router = APIRouter(prefix="/api/admin", tags=["admin"])


def _norm_city_id(city_id: str) -> str:
    return city_id.strip().lower().replace(" ", "_").replace("-", "_")


def _require_admin(x_admin_key: Optional[str]) -> None:
    settings = get_settings()
    if not settings.admin_api_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not_found")
    if not x_admin_key or x_admin_key != settings.admin_api_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not_found")


def _atomic_write_json(path: Path, data: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    text = json.dumps(data, ensure_ascii=False, indent=2)
    tmp.write_text(text, encoding="utf-8")
    tmp.replace(path)


class CityRulesPatch(BaseModel):
    """Partial city document merged into the existing city entry (shallow merge at top level)."""

    data: Dict[str, Any] = Field(default_factory=dict)


@router.get("/rules/{year}", include_in_schema=False)
def admin_get_rules(
    year: int = ApiPath(..., ge=2024, le=2035),
    x_admin_key: Optional[str] = Header(default=None, alias="X-Admin-Key"),
) -> Dict[str, Any]:
    _require_admin(x_admin_key)
    try:
        return load_municipal_rules(year)
    except OSError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)) from e


@router.put("/rules/{year}", include_in_schema=False)
def admin_put_rules(
    year: int = ApiPath(..., ge=2024, le=2035),
    x_admin_key: Optional[str] = Header(default=None, alias="X-Admin-Key"),
    body: Dict[str, Any] = Body(...),
) -> Dict[str, str]:
    """Replace the entire rules document for a year (use with care)."""
    _require_admin(x_admin_key)
    path = rules_path_for_year(year)
    _atomic_write_json(path, body)
    clear_rules_cache()
    return {"ok": True, "path": str(path)}


@router.patch("/rules/{year}/cities/{city_id}", include_in_schema=False)
def admin_patch_city_rules(
    year: int = ApiPath(..., ge=2024, le=2035),
    city_id: str = ApiPath(..., min_length=1, max_length=120),
    x_admin_key: Optional[str] = Header(default=None, alias="X-Admin-Key"),
    patch: CityRulesPatch = Body(...),
) -> Dict[str, Any]:
    """
    Merge `patch.data` into `cities[city_id]` inside the rules file, creating the city entry if missing.
    Typical keys inside a city object: `names`, `income_brackets`, `sqm_threshold`, etc. (see municipal_rules_*.json).
    """
    _require_admin(x_admin_key)
    doc = dict(load_municipal_rules(year))
    cities = dict(doc.get("cities") or {})
    cid = _norm_city_id(city_id)
    current = dict(cities.get(cid) or {})
    merged = {**current, **patch.data}
    cities[cid] = merged
    doc["cities"] = cities
    path = rules_path_for_year(year)
    _atomic_write_json(path, doc)
    clear_rules_cache()
    return {"ok": True, "city_id": cid, "city": merged}


@router.post("/rules/{year}/reload-cache", include_in_schema=False)
def admin_reload_rules_cache(
    year: int = ApiPath(..., ge=2024, le=2035),
    x_admin_key: Optional[str] = Header(default=None, alias="X-Admin-Key"),
) -> Dict[str, str]:
    """Clear the in-process rules LRU cache (year is accepted for symmetry; clears all cached years)."""
    _require_admin(x_admin_key)
    clear_rules_cache()
    return {"ok": True}
