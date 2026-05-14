import math
import re
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

_CODE_RE = re.compile(r"^[\w.-]{1,64}$")


class CalculateIn(BaseModel):
    city_id: str = Field(..., min_length=2, max_length=64)
    household_size: int = Field(..., ge=1, le=30)
    gross_monthly_income_nis: float = Field(..., ge=0, le=5_000_000)
    special_statuses: List[str] = Field(default_factory=list)
    apartment_sqm: float = Field(..., gt=0, le=5000)
    rules_year: int = Field(default=2026, ge=2024, le=2035)

    @field_validator("city_id", mode="before")
    @classmethod
    def _strip_city(cls, v: object) -> str:
        if v is None:
            raise ValueError("city_id_required")
        s = str(v).strip()
        if len(s) < 2:
            raise ValueError("city_id_too_short")
        return s[:64]

    @field_validator("special_statuses", mode="before")
    @classmethod
    def _sanitize_statuses(cls, v: object) -> List[str]:
        if v is None:
            return []
        if not isinstance(v, list):
            raise ValueError("special_statuses_must_be_list")
        out: List[str] = []
        seen: set[str] = set()
        for raw in v[:24]:
            if not isinstance(raw, str):
                continue
            code = raw.strip()[:64]
            if not code or code in seen:
                continue
            if not _CODE_RE.match(code):
                continue
            seen.add(code)
            out.append(code)
        return out

    @field_validator("gross_monthly_income_nis", "apartment_sqm", mode="before")
    @classmethod
    def _finite_float(cls, v: object) -> float:
        if isinstance(v, bool):
            raise ValueError("invalid_numeric")
        try:
            x = float(v)  # type: ignore[arg-type]
        except (TypeError, ValueError) as exc:
            raise ValueError("invalid_numeric") from exc
        if not math.isfinite(x):
            raise ValueError("non_finite_numeric")
        return x


class BreakdownLineOut(BaseModel):
    component: str
    contribution_min_pct: float
    contribution_max_pct: float
    notes: str = ""


class CalculateOut(BaseModel):
    city_id: str
    rules_year: int
    estimate_min_pct: float
    estimate_max_pct: float
    breakdown: List[BreakdownLineOut]
    warnings: List[str] = Field(default_factory=list)
    disclaimer: str


class CityOut(BaseModel):
    id: str
    names: dict
    tier: Optional[str] = None
    rules_note: Optional[str] = None


class CitiesOut(BaseModel):
    rules_year: int
    cities: List[CityOut]
    special_status_catalog: List[dict]


class DeadlineCityOut(BaseModel):
    city_id: str
    names: dict
    deadlines: dict
    default_reminder_en: str = ""
    default_reminder_he: str = ""


class DeadlinesOut(BaseModel):
    rules_year: int
    cities: List[DeadlineCityOut]


class ChecklistIn(CalculateIn):
    locale: str = Field(default="en", max_length=8)
    notes_to_self: Optional[str] = Field(default=None, max_length=2000)

    @field_validator("locale", mode="before")
    @classmethod
    def _locale_strip(cls, v: object) -> str:
        s = str(v or "en").strip()[:8]
        return s or "en"

    @field_validator("notes_to_self", mode="before")
    @classmethod
    def _notes_strip(cls, v: object) -> Optional[str]:
        if v is None:
            return None
        s = str(v).strip()
        return s[:2000] if s else None


class ChecklistItemOut(BaseModel):
    id: str
    title: str
    detail: str
    category: str = "general"


class ChecklistOut(BaseModel):
    rules_year: int
    city_id: str
    disclaimer: str
    items: List[ChecklistItemOut]
