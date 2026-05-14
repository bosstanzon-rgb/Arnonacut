"""Premium personalized checklist rows derived from calculation inputs (no uploads)."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from .rules_loader import get_city_rules


def build_checklist_items(
    inp: Any,
    rules_doc: Dict[str, Any],
    calc_summary: Dict[str, Any],
    notes_to_self: Optional[str],
) -> List[Dict[str, Any]]:
    cid = inp.city_id.strip().lower().replace(" ", "_").replace("-", "_")
    city = get_city_rules(cid, inp.rules_year if hasattr(inp, "rules_year") else 2026) or {}
    names = city.get("names") or {}
    city_en = names.get("en", inp.city_id)
    dl = city.get("deadlines_2026") or {}
    year = int(rules_doc.get("year", getattr(inp, "rules_year", 2026)))

    items: List[Dict[str, Any]] = [
        {
            "id": "doc-1",
            "title": "Gather official notices",
            "detail": f"Collect all {year} arnona notices and payment receipts for the property in {city_en}.",
            "category": "documents",
        },
        {
            "id": "doc-2",
            "title": "Income evidence (if claiming income-linked relief)",
            "detail": "Prepare factual, dated documentation that matches what you will state. Do not upload documents to ArnonaCut.",
            "category": "documents",
        },
        {
            "id": "facts-1",
            "title": "Household composition table",
            "detail": f"List permanent residents ({inp.household_size}) with move-in dates as officially recorded.",
            "category": "facts",
        },
        {
            "id": "facts-2",
            "title": "Apartment facts",
            "detail": f"Confirm registered sqm ({inp.apartment_sqm}), use category, and any split/annex facts from tabu or municipality records.",
            "category": "facts",
        },
        {
            "id": "status-1",
            "title": "Special statuses to verify locally",
            "detail": "For each selected status, write the exact municipal or national criterion you believe applies and where you read it.",
            "category": "status",
        },
        {
            "id": "calc-1",
            "title": "Illustrative estimate snapshot (non-binding)",
            "detail": (
                f"Engine range for planning: {calc_summary.get('estimate_min_pct')}% – "
                f"{calc_summary.get('estimate_max_pct')}% (rules year {calc_summary.get('rules_year')}). "
                "This is not a promise of discount."
            ),
            "category": "planning",
        },
        {
            "id": "proc-1",
            "title": "Deadlines reminder",
            "detail": dl.get("objection_window_open_en")
            or rules_doc.get("default_deadlines_en", "Verify deadlines on the official municipality site."),
            "category": "process",
        },
        {
            "id": "proc-2",
            "title": "Official channel",
            "detail": dl.get("official_url_hint", "Bookmark the municipality arnona page and confirm forms for 2026."),
            "category": "process",
        },
    ]

    if inp.special_statuses:
        items.insert(
            4,
            {
                "id": "status-0",
                "title": "Selected statuses (review definitions)",
                "detail": "Statuses selected: "
                + ", ".join(inp.special_statuses)
                + ". Remove any that do not meet published definitions.",
                "category": "status",
            },
        )

    if notes_to_self and notes_to_self.strip():
        items.append(
            {
                "id": "user-note",
                "title": "Your notes",
                "detail": notes_to_self.strip()[:1500],
                "category": "notes",
            }
        )

    return items
