import uuid
from datetime import datetime

from typing import Optional

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class QuizSession(Base):
    __tablename__ = "quiz_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    locale: Mapped[str] = mapped_column(String(8), default="en")
    answers: Mapped[dict] = mapped_column(JSON, default=dict)
    estimate: Mapped[dict] = mapped_column(JSON, default=dict)

    orders: Mapped[list["Order"]] = relationship(back_populates="session")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("quiz_sessions.id"), index=True)
    amount_ils: Mapped[int] = mapped_column(Integer, default=99)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending | paid
    access_token: Mapped[Optional[str]] = mapped_column(String(64), unique=True, index=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    profile_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    session: Mapped["QuizSession"] = relationship(back_populates="orders")
