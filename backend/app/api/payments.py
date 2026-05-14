"""Placeholder payment provider — replace with CreditGuard / PayPlus / Stripe + verified webhooks."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..schemas import PaymentCompleteOut, PlaceholderPaymentConfirmIn
from ..services.order_checkout import finalize_order_as_paid

router = APIRouter()


@router.post("/placeholder/confirm", response_model=PaymentCompleteOut)
def placeholder_payment_confirm(
    payload: PlaceholderPaymentConfirmIn,
    db: Session = Depends(get_db),
) -> PaymentCompleteOut:
    """
    Simulates a successful charge. Safe to remove once a real PSP calls `finalize_order_as_paid`
    from an authenticated webhook handler.
    """
    settings = get_settings()
    if not settings.enable_placeholder_payments:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="placeholder_payments_disabled",
        )
    try:
        return finalize_order_as_paid(db, payload.order_id)
    except ValueError as e:
        if str(e) == "order_not_found":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="order_not_found") from e
        raise
