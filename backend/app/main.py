"""Main FastAPI application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import create_db_and_tables
from app.api import auth, teams, expenses, summary

# Initialize settings
settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title="TeamSplit API",
    description="Group expense & budget sharing application",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(teams.router)
app.include_router(expenses.router)
app.include_router(summary.router)


@app.on_event("startup")
async def on_startup():
    """Initialize database on startup."""
    create_db_and_tables()


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "TeamSplit API",
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
