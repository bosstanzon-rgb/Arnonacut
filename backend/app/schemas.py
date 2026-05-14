from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from .arnona_schemas import CalculateIn


class QuizAnswer(BaseModel):
    question_id: str = Field(..., min_length=2, max_length=64)
    value: str = Field(default="", max_length=500)

    @field_validator("question_id", mode="before")
    @classmethod
    def _strip_qid(cls, v: object) -> str:
        s = str(v).strip()[:64]
        if len(s) < 2:
            raise ValueError("invalid_question_id")
        return s

    @field_validator("value", mode="before")
    @classmethod
    def _strip_value(cls, v: object) -> str:
        if v is None:
            return ""
        return str(v).strip()[:500]


class QuizEvaluateIn(BaseModel):
    locale: str = Field(default="en", max_length=8)
    answers: list[QuizAnswer] = Field(default_factory=list)

    @field_validator("answers", mode="before")
    @classmethod
    def _cap_answers(cls, v: object) -> list:
        if v is None:
            return []
        if not isinstance(v, list):
            raise ValueError("answers_must_be_list")
        return v[:40]

    @field_validator("locale", mode="before")
    @classmethod
    def _locale(cls, v: object) -> str:
        s = str(v or "en").strip()[:8]
        return s or "en"


class QuizEvaluateOut(BaseModel):
    session_id: str
    estimate_min_pct: float
    estimate_max_pct: float
    confidence: str  # low | medium | high
    summary_key: str
    factors: list[str]


class OrderCreateIn(BaseModel):
    session_id: str = Field(..., min_length=36, max_length=36)
    customer_profile: Optional[CalculateIn] = None

    @field_validator("session_id", mode="before")
    @classmethod
    def _session_uuid(cls, v: object) -> str:
        return str(UUID(str(v)))


class OrderCreateOut(BaseModel):
    order_id: str
    amount_ils: int
    currency: str = "ILS"


class PaymentCompleteOut(BaseModel):
    access_token: str
    kit_urls: dict[str, str]


class PlaceholderPaymentConfirmIn(BaseModel):
    order_id: str = Field(..., min_length=36, max_length=36)

    @field_validator("order_id", mode="before")
    @classmethod
    def _order_uuid(cls, v: object) -> str:
        return str(UUID(str(v)))


class KitMetaOut(BaseModel):
    valid: bool
    checklist_pdf: Optional[str] = None
    templates_zip: Optional[str] = None
    message: Optional[str] = None


class ErrorOut(BaseModel):
    detail: str
    code: Optional[str] = None


class HealthOut(BaseModel):
    status: str
    app: str
