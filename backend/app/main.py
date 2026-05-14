from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .api import admin_rules, api_router, arnona
from .config import STATIC_DIR, get_settings
from .database import init_db
from .http_middleware import RateLimitMiddleware, SecurityHeadersMiddleware


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(title=settings.app_name, lifespan=lifespan)

    origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
    if not origins:
        origins = ["http://127.0.0.1:8000", "http://localhost:8000"]

    application.add_middleware(
        RateLimitMiddleware,
        requests_per_minute=settings.rate_limit_public_api_per_minute,
    )
    application.add_middleware(SecurityHeadersMiddleware)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(arnona.router)
    application.include_router(admin_rules.router)
    application.include_router(api_router)

    static_path = Path(STATIC_DIR)
    if static_path.is_dir():
        index_file = static_path / "index.html"

        @application.get("/")
        async def spa_index():
            if not index_file.is_file():
                return {
                    "detail": "index.html missing in static directory. Run the frontend CSS build and ensure public/index.html exists.",
                }
            return FileResponse(index_file)

        checkout_file = static_path / "checkout.html"

        @application.get("/checkout")
        @application.get("/checkout.html")
        async def checkout_page():
            if not checkout_file.is_file():
                return {"detail": "checkout.html missing in static directory."}
            return FileResponse(checkout_file)

        def _legal_page(name: str):
            f = static_path / name

            async def _serve():
                if not f.is_file():
                    return {"detail": f"{name} missing in static directory."}
                return FileResponse(f)

            return _serve

        application.get("/privacy", include_in_schema=False)(_legal_page("privacy.html"))
        application.get("/privacy.html", include_in_schema=False)(_legal_page("privacy.html"))
        application.get("/terms", include_in_schema=False)(_legal_page("terms.html"))
        application.get("/terms.html", include_in_schema=False)(_legal_page("terms.html"))
        application.get("/disclaimers", include_in_schema=False)(_legal_page("disclaimers.html"))
        application.get("/disclaimers.html", include_in_schema=False)(_legal_page("disclaimers.html"))

        manifest_file = static_path / "manifest.webmanifest"
        sw_file = static_path / "sw.js"

        @application.get("/manifest.webmanifest", include_in_schema=False)
        async def pwa_manifest():
            if not manifest_file.is_file():
                return {"detail": "manifest missing"}
            return FileResponse(manifest_file, media_type="application/manifest+json")

        @application.get("/sw.js", include_in_schema=False)
        async def pwa_service_worker():
            if not sw_file.is_file():
                return {"detail": "service worker missing"}
            return FileResponse(sw_file, media_type="application/javascript")

        application.mount("/assets", StaticFiles(directory=str(static_path)), name="assets")
    else:
        @application.get("/")
        def _missing_static():
            return {
                "detail": "Frontend static directory not found. Build Tailwind CSS into frontend/public/css/tailwind.css",
            }

    return application


app = create_app()
