import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import QuizSession
from ..schemas import QuizEvaluateIn, QuizEvaluateOut
from ..services.calculator import evaluate_quiz

router = APIRouter()


@router.post("/evaluate", response_model=QuizEvaluateOut)
def evaluate_quiz_endpoint(payload: QuizEvaluateIn, db: Session = Depends(get_db)) -> QuizEvaluateOut:
    answers_list = [a.model_dump() for a in payload.answers]
    result = evaluate_quiz(answers_list)
    sid = str(uuid.uuid4())
    answers_map = {a.question_id: a.value for a in payload.answers}
    row = QuizSession(
        id=sid,
        locale=payload.locale,
        answers=answers_map,
        estimate={
            "min_pct": result.min_pct,
            "max_pct": result.max_pct,
            "confidence": result.confidence,
            "summary_key": result.summary_key,
            "factors": result.factors,
        },
    )
    db.add(row)
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="session_persist_failed",
        ) from None
    return QuizEvaluateOut(
        session_id=sid,
        estimate_min_pct=result.min_pct,
        estimate_max_pct=result.max_pct,
        confidence=result.confidence,
        summary_key=result.summary_key,
        factors=result.factors,
    )
