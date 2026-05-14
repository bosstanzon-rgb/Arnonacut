from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Order
from ..schemas import KitMetaOut
from ..services.pdf_kit_bundle import build_kit_context, build_professional_kit_zip, render_personalized_checklist_pdf

router = APIRouter()


def _paid_order_by_token(db: Session, token: str) -> Order:
    row = db.query(Order).filter(Order.access_token == token, Order.status == "paid").one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="kit_not_found")
    return row


@router.get("/{access_token}/meta", response_model=KitMetaOut)
def kit_meta(access_token: str, db: Session = Depends(get_db)) -> KitMetaOut:
    order = db.query(Order).filter(Order.access_token == access_token).one_or_none()
    if order is None or order.status != "paid":
        return KitMetaOut(valid=False, message="not_available")
    base = f"/api/v1/kit/{access_token}"
    return KitMetaOut(
        valid=True,
        checklist_pdf=f"{base}/checklist.pdf",
        templates_zip=f"{base}/templates.zip",
        message=None,
    )


def _session_id_or_500(order: Order) -> str:
    if order.session is not None:
        return order.session.id
    if order.session_id:
        return order.session_id
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="order_session_missing",
    )


@router.get("/{access_token}/checklist.pdf")
def download_checklist(access_token: str, db: Session = Depends(get_db)) -> Response:
    order = _paid_order_by_token(db, access_token)
    sid = _session_id_or_500(order)
    profile = order.profile_json if isinstance(order.profile_json, dict) else None
    ctx = build_kit_context(order_id=order.id, session_id=sid, profile=profile)
    pdf_bytes = render_personalized_checklist_pdf(ctx)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": 'attachment; filename="arnonacut-checklist-hebrew.pdf"',
            "Cache-Control": "private, no-store",
        },
    )


@router.get("/{access_token}/templates.zip")
def download_templates(access_token: str, db: Session = Depends(get_db)) -> Response:
    order = _paid_order_by_token(db, access_token)
    sid = _session_id_or_500(order)
    profile = order.profile_json if isinstance(order.profile_json, dict) else None
    zip_bytes = build_professional_kit_zip(
        order_id=order.id,
        session_id=sid,
        profile=profile,
    )
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={
            "Content-Disposition": 'attachment; filename="arnonacut-professional-kit.zip"',
            "Cache-Control": "private, no-store",
        },
    )
