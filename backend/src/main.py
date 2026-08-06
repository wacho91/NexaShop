import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src import models, routes  # noqa: F401  (import models to register tables)
from src.database import engine, init_db

# CORS: comma-separated list of allowed origins, default to local frontend
_FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", _FRONTEND_ORIGIN).split(",")
    if origin.strip()
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialize database on startup, dispose pool on shutdown."""
    # Startup
    await init_db()
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title="NexaShop API",
    description="Backend API for NexaShop e-commerce",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration - allows the frontend origin(s) to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes (all under /api/v1)
app.include_router(routes.router)


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint for basic API health check."""
    return {"status": "ok", "service": "NexaShop API"}


@app.get("/health", tags=["Health"])
async def health():
    """Detailed health check endpoint."""
    return {"status": "healthy", "version": app.version}
