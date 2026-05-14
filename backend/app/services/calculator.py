"""
Heuristic-only discount estimation for educational purposes.
Not legal or tax advice; municipality rules vary.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class EstimateResult:
    min_pct: float
    max_pct: float
    confidence: str
    summary_key: str
    factors: list[str]


def _answers_map(answers: list[dict]) -> dict[str, str]:
    return {a["question_id"]: a["value"] for a in answers}


def evaluate_quiz(answers: list[dict]) -> EstimateResult:
    m = _answers_map(answers)
    score = 0.0
    factors: list[str] = []

    situation = m.get("q1", "")
    if situation == "owner_occupied":
        score += 1.5
        factors.append("factor_owner_occupied")
    elif situation == "rental":
        score += 0.5
        factors.append("factor_rental")
    elif situation == "mixed_use":
        score += 1.0
        factors.append("factor_mixed_use")

    hardship = m.get("q2", "")
    if hardship == "yes_documented":
        score += 2.0
        factors.append("factor_hardship_docs")
    elif hardship == "maybe":
        score += 1.0
        factors.append("factor_hardship_review")
    else:
        factors.append("factor_hardship_none")

    bill_change = m.get("q3", "")
    if bill_change == "jumped":
        score += 2.0
        factors.append("factor_bill_jump")
    elif bill_change == "slow_rise":
        score += 1.0
        factors.append("factor_bill_rise")
    else:
        factors.append("factor_bill_stable")

    comparables = m.get("q4", "")
    if comparables == "researched":
        score += 1.5
        factors.append("factor_comparables_ready")
    elif comparables == "some":
        score += 0.8
        factors.append("factor_comparables_partial")
    else:
        factors.append("factor_comparables_none")

    readiness = m.get("q5", "")
    if readiness == "ready_timeline":
        score += 1.2
        factors.append("factor_timeline_ready")
    elif readiness == "need_help":
        score += 0.6
        factors.append("factor_timeline_help")
    else:
        factors.append("factor_timeline_unclear")

    base_min = 3.0 + min(score, 7.0) * 0.8
    base_max = 8.0 + min(score, 7.0) * 1.4
    min_pct = round(min(base_min, 35.0), 1)
    max_pct = round(min(base_max, 55.0), 1)

    if score >= 6.5:
        confidence = "high"
        summary_key = "summary_strong_case"
    elif score >= 4.0:
        confidence = "medium"
        summary_key = "summary_moderate_case"
    else:
        confidence = "low"
        summary_key = "summary_explore_case"

    return EstimateResult(
        min_pct=min_pct,
        max_pct=max_pct,
        confidence=confidence,
        summary_key=summary_key,
        factors=factors[:6],
    )
