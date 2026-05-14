"""
Illustrative arnona discount / relief *planning* engine.

Outputs are non-binding estimates for UX only. Municipal ordinances and
individual facts always prevail over this file-based model.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from .rules_loader import get_city_rules


@dataclass
class CalculationInput:
    city_id: str
    household_size: int
    gross_monthly_income_nis: float
    special_statuses: List[str]
    apartment_sqm: float
    year: int = 2026


@dataclass
class BreakdownLine:
    component: str
    contribution_min_pct: float
    contribution_max_pct: float
    notes: str = ""


@dataclass
class CalculationResult:
    city_id: str
    rules_year: int
    estimate_min_pct: float
    estimate_max_pct: float
    breakdown: List[BreakdownLine] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)


def _pick_income_bracket(monthly_income: float, brackets: List[Dict[str, Any]]) -> Dict[str, Any]:
    for row in brackets:
        cap = row.get("up_to")
        if cap is None or monthly_income <= float(cap):
            return row
    return brackets[-1]


def _clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def _sqm_component(sqm: float, cfg: Dict[str, Any]) -> Tuple[float, float, str]:
    thr = float(cfg.get("threshold_sqm", 100))
    rate = float(cfg.get("pct_per_sqm_above", 0.04))
    cap = float(cfg.get("cap_pct_each_side", 4.0))
    excess = max(0.0, float(sqm) - thr)
    raw = excess * rate
    lo = _clamp(raw, 0.0, cap)
    hi = _clamp(raw * 1.12, 0.0, cap * 1.05)
    note = f"sqm={sqm}, threshold={thr}, rate={rate}, cap={cap}"
    return lo, hi, note


def _household_component(size: int, cfg: Dict[str, Any]) -> Tuple[float, float, str]:
    size = max(1, int(size))
    extra = max(0, size - 1)
    per = float(cfg.get("pct_per_extra_resident", 0.5))
    cap = float(cfg.get("max_extra_pct_each_side", 3.0))
    raw = extra * per
    lo = _clamp(raw, 0.0, cap)
    hi = _clamp(raw * 1.1, 0.0, cap * 1.05)
    return lo, hi, f"residents={size}, extra={extra}"


def _special_statuses_component(
    codes: List[str],
    city_specials: Dict[str, Any],
    catalog: List[Dict[str, Any]],
) -> Tuple[float, float, List[str], str]:
    valid_codes = {c["code"] for c in catalog}
    unknown = [c for c in codes if c not in valid_codes]
    weights = [1.0, 0.68, 0.48]
    smin = 0.0
    smax = 0.0
    applied: List[str] = []
    for i, code in enumerate(codes):
        if code not in valid_codes:
            continue
        row = city_specials.get(code)
        if not row:
            continue
        w = weights[i] if i < len(weights) else weights[-1]
        smin += float(row.get("add_min", 0)) * w
        smax += float(row.get("add_max", 0)) * w
        applied.append(code)
    cap_each = 14.0
    smin = _clamp(smin, 0.0, cap_each)
    smax = _clamp(smax, 0.0, cap_each * 1.1)
    note = "weighted stacking for multiple statuses"
    return smin, smax, unknown, note


def calculate_discount(inp: CalculationInput, rules_doc: Dict[str, Any]) -> CalculationResult:
    warnings: List[str] = []
    cid = (
        inp.city_id.strip()
        .lower()
        .replace(" ", "_")
        .replace("-", "_")
    )
    city = get_city_rules(cid, inp.year)
    if city is None:
        raise ValueError(f"unknown_city:{inp.city_id}")

    if inp.household_size < 1:
        warnings.append("household_size_coerced_to_1")
    if inp.gross_monthly_income_nis < 0:
        warnings.append("negative_income_treated_as_0")
    if inp.apartment_sqm <= 0:
        warnings.append("non_positive_sqm_treated_as_55")

    income = max(0.0, float(inp.gross_monthly_income_nis))
    sqm = float(inp.apartment_sqm) if inp.apartment_sqm > 0 else 55.0

    brackets = city.get("income_brackets_monthly_nis") or []
    if not brackets:
        raise ValueError("city_missing_income_brackets")

    br = _pick_income_bracket(income, brackets)
    base_min = float(br.get("base_min_pct", 0))
    base_max = float(br.get("base_max_pct", 0))
    breakdown: List[BreakdownLine] = [
        BreakdownLine(
            component="income_bracket",
            contribution_min_pct=base_min,
            contribution_max_pct=base_max,
            notes=str(br.get("notes") or ""),
        )
    ]

    sqm_cfg = city.get("sqm_factor") or {}
    sq_lo, sq_hi, sq_note = _sqm_component(sqm, sqm_cfg)
    breakdown.append(BreakdownLine("sqm_above_threshold", sq_lo, sq_hi, sq_note))

    hh_cfg = city.get("household_factor") or {}
    hh_lo, hh_hi, hh_note = _household_component(inp.household_size, hh_cfg)
    breakdown.append(BreakdownLine("household_size", hh_lo, hh_hi, hh_note))

    catalog = rules_doc.get("special_status_catalog") or []
    city_spec = city.get("special_status_deltas") or {}
    spec_lo, spec_hi, unknown, spec_note = _special_statuses_component(
        [s.strip() for s in inp.special_statuses if s.strip()],
        city_spec,
        catalog,
    )
    for u in unknown:
        warnings.append(f"unknown_special_status:{u}")
    breakdown.append(BreakdownLine("special_statuses", spec_lo, spec_hi, spec_note))

    est_min = _clamp(base_min + sq_lo + hh_lo + spec_lo, 0.0, 48.0)
    est_max = _clamp(base_max + sq_hi + hh_hi + spec_hi, 0.0, 55.0)
    if est_max < est_min:
        est_max = est_min

    return CalculationResult(
        city_id=str(city.get("id", cid)),
        rules_year=int(rules_doc.get("year", inp.year)),
        estimate_min_pct=round(est_min, 2),
        estimate_max_pct=round(est_max, 2),
        breakdown=breakdown,
        warnings=warnings,
    )
