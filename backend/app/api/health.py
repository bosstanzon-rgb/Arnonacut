from fastapi import APIRouter

from ..config import get_settings
from ..schemas import HealthOut

router = APIRouter()


@router.get("/health", response_model=HealthOut)
def health() -> HealthOut:
    return HealthOut(status="ok", app=get_settings().app_name)
