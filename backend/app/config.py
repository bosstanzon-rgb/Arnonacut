from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
        env_prefix="ARNONACUT_",
    )

    app_name: str = "ArnonaCut API"
    database_url: str = "sqlite:///./arnonacut.db"
    demo_payment_secret: str = "change-me-demo-secret"
    allow_insecure_demo_checkout: bool = False
    # Simulated card / wallet flow for development. Disable in production and use a real PSP webhook.
    enable_placeholder_payments: bool = True
    kit_price_ils: int = 99
    cors_origins: str = "http://127.0.0.1:8000,http://localhost:8000"
    rate_limit_public_api_per_minute: int = 120
    # If empty, admin rules routes return 404. Set a long random secret for PATCH/PUT /api/admin/rules/...
    admin_api_key: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()


BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR.parent / "frontend" / "public"
