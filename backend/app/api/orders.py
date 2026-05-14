from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..models import Order, QuizSession
from ..schemas import OrderCreateIn, OrderCreateOut, PaymentCompleteOut
from ..services.order_checkout import finalize_order_as_paid

router = APIRouter()


@router.post("/", response_model=OrderCreateOut)
def create_order(payload: OrderCreateIn, db: Session = Depends(get_db)) -> OrderCreateOut:
    session = db.get(QuizSession, payload.session_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="session_not_found")
    settings = get_settings()
    profile_json = None
    if payload.customer_profile is not None:
        profile_json = payload.customer_profile.model_dump(mode="json")
    order = Order(
        session_id=session.id,
        amount_ils=settings.kit_price_ils,
        status="pending",
        profile_json=profile_json,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return OrderCreateOut(order_id=order.id, amount_ils=order.amount_ils)


@router.post("/{order_id}/complete-demo", response_model=PaymentCompleteOut)
def complete_demo_payment(
    order_id: str,
    db: Session = Depends(get_db),
    x_demo_secret: Optional[str] = Header(default=None, alias="X-Demo-Secret"),
) -> PaymentCompleteOut:
    """
    Demo-only completion hook. In production, replace with a verified webhook
    from your payment provider and remove demo header authentication.
    """
    settings = get_settings()
    if not settings.allow_insecure_demo_checkout:
        if x_demo_secret != settings.demo_payment_secret:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_demo_secret")

    try:
        return finalize_order_as_paid(db, order_id)
    except ValueError as e:
        if str(e) == "order_not_found":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="order_not_found") from e
        raise
