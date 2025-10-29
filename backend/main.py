"""
Main FastAPI application for Racing Data Platform
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Data directory: {settings.DATA_DIR}")
    
    # TODO: Initialize database
    # TODO: Load ML models
    # TODO: Start background tasks
    
    yield
    
    # Shutdown
    logger.info("Shutting down application")
    # TODO: Cleanup resources


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Real-time racing analytics and strategy platform",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "data_dir_exists": settings.DATA_DIR.exists(),
        "models_loaded": False,  # TODO: Check if models are loaded
        "cache_connected": False,  # TODO: Check Redis connection
    }


# Import and include routers
from api import race
app.include_router(race.router, prefix=f"{settings.API_V1_PREFIX}/race", tags=["race"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )