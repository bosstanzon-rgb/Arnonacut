"""Security headers and lightweight in-memory rate limiting for the public API."""

from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import Deque, Dict

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Baseline OWASP-friendly headers on every response."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault(
            "Permissions-Policy",
            "geolocation=(), microphone=(), camera=(), payment=()",
        )
        if request.url.scheme == "https":
            response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Per-IP sliding window (60s) for paths under ``path_prefix``.
    In-memory only — use Redis-backed limits in multi-instance production.
    """

    def __init__(self, app, requests_per_minute: int = 120, path_prefix: str = "/api") -> None:
        super().__init__(app)
        self.rpm = max(10, min(requests_per_minute, 10_000))
        self.path_prefix = path_prefix
        self._hits: Dict[str, Deque[float]] = defaultdict(deque)
        self._prune_counter = 0

    def _client_ip(self, request: Request) -> str:
        xff = request.headers.get("x-forwarded-for")
        if xff:
            return xff.split(",")[0].strip()[:100]
        if request.client:
            return request.client.host
        return "unknown"

    def _should_limit(self, path: str) -> bool:
        if not path.startswith(self.path_prefix):
            return False
        if path.rstrip("/").endswith("/health"):
            return False
        return True

    def _prune_stale(self, now: float) -> None:
        empty: list[str] = []
        for ip, dq in self._hits.items():
            while dq and now - dq[0] > 60.0:
                dq.popleft()
            if not dq:
                empty.append(ip)
        for ip in empty:
            del self._hits[ip]

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path
        if not self._should_limit(path):
            return await call_next(request)

        self._prune_counter += 1
        if self._prune_counter >= 2000:
            self._prune_counter = 0
            self._prune_stale(time.time())

        ip = self._client_ip(request)
        now = time.time()
        dq = self._hits[ip]
        while dq and now - dq[0] > 60.0:
            dq.popleft()
        if len(dq) >= self.rpm:
            return JSONResponse(
                {"detail": "rate_limit_exceeded"},
                status_code=429,
                headers={"Retry-After": "60"},
            )
        dq.append(now)
        return await call_next(request)
