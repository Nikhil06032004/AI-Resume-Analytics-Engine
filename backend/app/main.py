import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.limiter import limiter
from app.routers import resume

# ─────────────────────────────────────────────────────────────────
#  Startup / shutdown
# ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    _print_startup_banner()
    try:
        from app.services.db_service import ensure_indexes
        await ensure_indexes()
    except Exception as exc:
        print(f"[Startup] DB index creation skipped: {exc}")
    yield
    print("[Shutdown] Server stopped.")


def _print_startup_banner() -> None:
    """Log configuration status so ops can verify the environment at a glance."""
    lines = [
        "",
        "╔══════════════════════════════════════════╗",
        "║       Resume Insights API  v5.0.0        ║",
        "╚══════════════════════════════════════════╝",
        f"  AI insights  : {'✓ enabled' if settings.ai_api_key  else '✗ disabled (AI_API_KEY not set)'}",
        f"  MongoDB      : {'✓ enabled' if settings.mongodb_uri else '✗ disabled (MONGODB_URI not set)'}",
        f"  Frontend URL : {settings.frontend_url or '(all origins allowed — set FRONTEND_URL in prod)'}",
        f"  Debug mode   : {settings.debug}",
        "",
    ]
    for line in lines:
        print(line)


# ─────────────────────────────────────────────────────────────────
#  Application
# ─────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Resume Insights API",
    description="OCR · NLP · deterministic scoring · Gemini AI · MongoDB GridFS",
    version="5.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Rate limiting ────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ─────────────────────────────────────────────────────────
# Production: set FRONTEND_URL to a comma-separated list of allowed origins.
# Example: "https://resume-insight-engine.vercel.app"
# Dev: leave FRONTEND_URL unset → falls back to allow_origins=["*"].
# allow_credentials stays False — this API uses no cookies or sessions.
_DEV_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

def _build_cors_origins() -> list[str]:
    if not settings.frontend_url:
        return ["*"]
    prod = [u.strip().rstrip("/") for u in settings.frontend_url.split(",") if u.strip()]
    return prod + _DEV_ORIGINS

_CORS_ORIGINS = _build_cors_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=_CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Authorization"],
    expose_headers=["X-Process-Time-Ms"],
)

# ── Request timing middleware ─────────────────────────────────────
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    ms = round((time.perf_counter() - start) * 1000, 1)
    response.headers["X-Process-Time-Ms"] = str(ms)
    return response

# ── Routers ──────────────────────────────────────────────────────
app.include_router(resume.router, prefix="/resume", tags=["Resume"])


# ─────────────────────────────────────────────────────────────────
#  Health check
# ─────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
async def health_check() -> dict:
    from app.core.database import ping
    db_ok = False
    try:
        db_ok = await ping()
    except Exception:
        pass
    return {
        "status":        "ok",
        "version":       settings.app_version,
        "database":      "connected" if db_ok else "disconnected",
        "ai_configured": bool(settings.ai_api_key),
    }


@app.get("/debug", tags=["Health"])
async def debug_config() -> dict:
    """Shows non-secret runtime config — use to verify env vars on Render."""
    return {
        "version":        settings.app_version,
        "debug":          settings.debug,
        "ai_configured":  bool(settings.ai_api_key),
        "db_configured":  bool(settings.mongodb_uri),
        "frontend_url":   settings.frontend_url or "(not set — all origins allowed)",
        "cors_origins":   _CORS_ORIGINS,
        "cors_mode":      "restricted" if settings.frontend_url else "wildcard (dev)",
    }


@app.get("/health", tags=["Health"])
async def health_detailed() -> JSONResponse:
    """Detailed health check used by Render / load balancers."""
    from app.core.database import ping
    db_ok = False
    try:
        db_ok = await ping()
    except Exception:
        pass

    status_code = 200 if db_ok or not settings.mongodb_uri else 503
    return JSONResponse(
        status_code=status_code,
        content={
            "status":        "healthy" if status_code == 200 else "degraded",
            "version":       settings.app_version,
            "database":      "connected" if db_ok else "disconnected",
            "ai_configured": bool(settings.ai_api_key),
        },
    )
