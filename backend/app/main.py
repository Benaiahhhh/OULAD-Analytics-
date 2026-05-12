"""OULAD Student Retention Analytics — FastAPI Application."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, dashboard, predictions, students
from app.core.config import get_settings
from app.ml.predictor import predictor

settings = get_settings()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: load ML model. Shutdown: cleanup."""
    logger.info("Starting OULAD Analytics API...")
    predictor.load()
    if predictor.is_loaded:
        logger.info("ML model v%s loaded successfully", predictor.version)
    else:
        logger.warning("ML model not found — running in demo mode")
    yield
    logger.info("Shutting down OULAD Analytics API")


app = FastAPI(
    title="OULAD Student Retention Analytics",
    description=(
        "API for predicting student dropout risk using the Open University "
        "Learning Analytics Dataset. Serves a logistic regression model "
        "(AUC 0.877) with real-time predictions and feature explanations."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router, prefix="/api/v1")
app.include_router(students.router, prefix="/api/v1")
app.include_router(predictions.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": predictor.is_loaded,
        "model_version": predictor.version,
    }
