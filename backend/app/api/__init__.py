from fastapi import APIRouter

from . import health, kit, orders, payments, quiz

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router, tags=["health"])
api_router.include_router(quiz.router, prefix="/quiz", tags=["quiz"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(kit.router, prefix="/kit", tags=["kit"])
