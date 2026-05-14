"""Shared logic to mark an order paid and issue kit download URLs (demo / placeholder / future webhooks)."""

from __future__ import annotations

import secrets
from datetime import datetime

from sqlalchemy.orm import Session

from ..models import Order
from ..schemas import PaymentCompleteOut


def finalize_order_as_paid(db: Session, order_id: str) -> PaymentCompleteOut:
    order = db.get(Order, order_id)
    if order is None:
        raise ValueError("order_not_found")
    if order.status == "paid":
        token = order.access_token
        if not token:
            token = secrets.token_urlsafe(32)
            order.access_token = token
            db.commit()
    else:
        token = secrets.token_urlsafe(32)
        order.status = "paid"
        order.paid_at = datetime.utcnow()
        order.access_token = token
        db.commit()

    base = "/api/v1/kit"
    return PaymentCompleteOut(
        access_token=token,
        kit_urls={
            "checklist_pdf": f"{base}/{token}/checklist.pdf",
            "templates_zip": f"{base}/{token}/templates.zip",
        },
    )
