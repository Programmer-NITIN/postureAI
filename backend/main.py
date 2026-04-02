"""
AI Posture Correction & Physiotherapy Assistant — Backend Server

FastAPI application entry point.
Configures CORS, registers API routers, and initializes the database.
"""

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.database.connection import init_db
from backend.api.sessions import router as sessions_router
from backend.api.analytics import router as analytics_router
from backend.api.exercises import router as exercises_router
from backend.api.chat import router as chat_router
from backend.api.plan import router as plan_router
from backend.api.signaling import router as signaling_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database tables on startup."""
    init_db()
    yield


app = FastAPI(
    title="AI Posture Correction Assistant",
    description="Real-time posture analysis and physiotherapy guidance API",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS Configuration ──────────────────────────────────────────
# Allow the Next.js frontend to communicate with the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Widened for deployment (Vercel, Render, etc.)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register API Routers ────────────────────────────────────────
app.include_router(sessions_router)
app.include_router(analytics_router)
app.include_router(exercises_router)
app.include_router(chat_router)
app.include_router(plan_router)
app.include_router(signaling_router)


@app.get("/")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "AI Posture Correction Assistant",
        "version": "1.0.0",
    }


@app.get("/api")
def api_root():
    """API documentation shortcut."""
    return {
        "endpoints": {
            "sessions": "/api/sessions",
            "analytics": "/api/analytics/summary",
            "trend": "/api/analytics/trend",
            "exercises": "/api/exercises",
            "chat": "/api/chat",
            "plan": "/api/plan/questions",
            "telehealth_doctors": "/api/telehealth/doctors",
            "signaling_ws": "ws://<host>/ws/signaling/{client_id}/{role}",
            "docs": "/docs",
        }
    }
