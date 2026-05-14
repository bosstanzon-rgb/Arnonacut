from dataclasses import asdict
from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..arnona_schemas import (
    BreakdownLineOut,
    CalculateIn,
    CalculateOut,
    ChecklistIn,
    ChecklistItemOut,
    ChecklistOut,
    CitiesOut,
    CityOut,
    DeadlineCityOut,
    DeadlinesOut,
)
from ..database import get_db
from ..models import Order
from ..services.checklist_builder import build_checklist_items
from ..services.discount_engine import CalculationInput, calculate_discount
from ..services.rules_loader import RulesNotFoundError, load_municipal_rules

router = APIRouter(prefix="/api", tags=["arnona"])


def _require_premium_order(
    db: Session,
    x_access_token: Optional[str],
) -> Order:
    if not x_access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="premium_token_required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    order = (
        db.query(Order)
        .filter(Order.access_token == x_access_token, Order.status == "paid")
        .one_or_none()
    )
    if order is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="invalid_or_unpaid_token")
    return order


@router.post("/calculate", response_model=CalculateOut)
def post_calculate(payload: CalculateIn) -> CalculateOut:
    try:
        doc = load_municipal_rules(payload.rules_year)
    except RulesNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="rules_year_not_found")
    inp = CalculationInput(
        city_id=payload.city_id,
        household_size=payload.household_size,
        gross_monthly_income_nis=payload.gross_monthly_income_nis,
        special_statuses=list(payload.special_statuses),
        apartment_sqm=payload.apartment_sqm,
        year=payload.rules_year,
    )
    try:
        out = calculate_discount(inp, doc)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    disclaimer = str(doc.get("disclaimer", ""))
    return CalculateOut(
        city_id=out.city_id,
        rules_year=out.rules_year,
        estimate_min_pct=out.estimate_min_pct,
        estimate_max_pct=out.estimate_max_pct,
        breakdown=[BreakdownLineOut(**asdict(b)) for b in out.breakdown],
        warnings=out.warnings,
        disclaimer=disclaimer,
    )


@router.get("/cities", response_model=CitiesOut)
def get_cities(rules_year: int = Query(default=2026, ge=2024, le=2035)) -> CitiesOut:
    try:
        doc = load_municipal_rules(rules_year)
    except RulesNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="rules_year_not_found")
    cities_raw = doc.get("cities") or {}
    cities: List[CityOut] = []
    for _key, row in sorted(cities_raw.items(), key=lambda kv: kv[1].get("names", {}).get("en", kv[0])):
        cities.append(
            CityOut(
                id=str(row.get("id", _key)),
                names=row.get("names") or {"en": _key},
                tier=row.get("tier"),
                rules_note=row.get("note"),
            )
        )
    catalog = list(doc.get("special_status_catalog") or [])
    return CitiesOut(rules_year=int(doc.get("year", rules_year)), cities=cities, special_status_catalog=catalog)


@router.get("/deadlines", response_model=DeadlinesOut)
def get_deadlines(
    city_id: Optional[str] = Query(default=None, description="Filter to one municipality id (e.g. tel_aviv)"),
    rules_year: int = Query(default=2026, ge=2024, le=2035),
) -> DeadlinesOut:
    try:
        doc = load_municipal_rules(rules_year)
    except RulesNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="rules_year_not_found")
    cities_raw = doc.get("cities") or {}
    default_en = str(doc.get("default_deadlines_en", ""))
    default_he = str(doc.get("default_deadlines_he", ""))
    out_list: List[DeadlineCityOut] = []
    for key, row in cities_raw.items():
        cid = str(row.get("id", key))
        if city_id:
            norm = city_id.strip().lower().replace(" ", "_").replace("-", "_")
            if cid != norm:
                continue
        out_list.append(
            DeadlineCityOut(
                city_id=cid,
                names=row.get("names") or {"en": cid},
                deadlines=row.get("deadlines_2026") or {},
                default_reminder_en=default_en,
                default_reminder_he=default_he,
            )
        )
    if city_id and not out_list:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="city_not_found")
    out_list.sort(key=lambda x: x.names.get("en", x.city_id))
    return DeadlinesOut(rules_year=int(doc.get("year", rules_year)), cities=out_list)


@router.post("/generate-checklist", response_model=ChecklistOut)
def post_generate_checklist(
    payload: ChecklistIn,
    db: Session = Depends(get_db),
    x_access_token: Optional[str] = Header(default=None, alias="X-Access-Token"),
) -> ChecklistOut:
    _require_premium_order(db, x_access_token)
    try:
        doc = load_municipal_rules(payload.rules_year)
    except RulesNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="rules_year_not_found")
    inp = CalculationInput(
        city_id=payload.city_id,
        household_size=payload.household_size,
        gross_monthly_income_nis=payload.gross_monthly_income_nis,
        special_statuses=list(payload.special_statuses),
        apartment_sqm=payload.apartment_sqm,
        year=payload.rules_year,
    )
    try:
        calc = calculate_discount(inp, doc)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    calc_summary = {
        "estimate_min_pct": calc.estimate_min_pct,
        "estimate_max_pct": calc.estimate_max_pct,
        "rules_year": calc.rules_year,
    }
    raw_items = build_checklist_items(payload, doc, calc_summary, payload.notes_to_self)
    disclaimer = str(doc.get("disclaimer", "")) + " Premium checklist is generic guidance for your edits only."
    return ChecklistOut(
        rules_year=calc.rules_year,
        city_id=calc.city_id,
        disclaimer=disclaimer,
        items=[ChecklistItemOut(**i) for i in raw_items],
    )
