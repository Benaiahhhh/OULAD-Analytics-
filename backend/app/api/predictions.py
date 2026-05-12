"""ML prediction endpoints."""

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.ml.predictor import predictor
from app.models.student import Prediction, Registration, Student
from app.models.user import User
from app.schemas import (
    BatchPredictionRequest,
    BatchPredictionResponse,
    PredictionRequest,
    PredictionResponse,
)

router = APIRouter(prefix="/predict", tags=["Predictions"])


async def _get_student_features(
    student_id: int, module_code: str, presentation: str, db: AsyncSession
) -> dict:
    """Assemble feature vector from student record + registration data."""
    result = await db.execute(
        select(Student).where(Student.student_id == student_id)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student {student_id} not found")

    reg_result = await db.execute(
        select(Registration).where(
            Registration.student_id == student.id,
            Registration.module_code == module_code,
            Registration.presentation == presentation,
        )
    )
    registration = reg_result.scalar_one_or_none()

    features = {
        "gender": student.gender,
        "region": student.region,
        "highest_education": student.highest_education,
        "imd_band": student.imd_band,
        "age_band": student.age_band,
        "num_of_prev_attempts": student.num_of_prev_attempts,
        "studied_credits": student.studied_credits,
        "disability": student.disability,
    }

    if registration:
        features.update({
            "total_clicks": registration.total_clicks,
            "avg_daily_clicks": registration.avg_daily_clicks,
            "days_active": registration.days_active,
            "assessment_score_avg": registration.assessment_score_avg,
            "assessment_score_std": registration.assessment_score_std,
            "assessments_submitted": registration.assessments_submitted,
            "assessments_total": registration.assessments_total,
            "first_activity_day": registration.first_activity_day,
            "last_activity_day": registration.last_activity_day,
        })
    else:
        # No registration data yet — zero-fill engagement features
        features.update({
            "total_clicks": 0, "avg_daily_clicks": 0.0, "days_active": 0,
            "assessment_score_avg": None, "assessment_score_std": None,
            "assessments_submitted": 0, "assessments_total": 0,
            "first_activity_day": None, "last_activity_day": None,
        })

    return features, student


@router.post("/single", response_model=PredictionResponse)
async def predict_single(
    body: PredictionRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    features, student = await _get_student_features(
        body.student_id, body.module_code, body.presentation, db
    )

    result = predictor.predict(features)

    # Store prediction for audit
    prediction_record = Prediction(
        student_id=student.id,
        module_code=body.module_code,
        presentation=body.presentation,
        risk_score=result["risk_score"],
        risk_level=result["risk_level"],
        model_version=result["model_version"],
        feature_contributions=json.dumps(result["features"]),
        predicted_by=user.id,
    )
    db.add(prediction_record)
    await db.flush()

    return PredictionResponse(
        student_id=body.student_id,
        risk_score=result["risk_score"],
        risk_level=result["risk_level"],
        model_version=result["model_version"],
        features=result["features"],
        predicted_at=datetime.now(timezone.utc),
    )


@router.post("/batch", response_model=BatchPredictionResponse)
async def predict_batch(
    body: BatchPredictionRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    predictions = []
    for req in body.students:
        features, student = await _get_student_features(
            req.student_id, req.module_code, req.presentation, db
        )
        result = predictor.predict(features)

        prediction_record = Prediction(
            student_id=student.id,
            module_code=req.module_code,
            presentation=req.presentation,
            risk_score=result["risk_score"],
            risk_level=result["risk_level"],
            model_version=result["model_version"],
            feature_contributions=json.dumps(result["features"]),
            predicted_by=user.id,
        )
        db.add(prediction_record)

        predictions.append(PredictionResponse(
            student_id=req.student_id,
            risk_score=result["risk_score"],
            risk_level=result["risk_level"],
            model_version=result["model_version"],
            features=result["features"],
            predicted_at=datetime.now(timezone.utc),
        ))

    await db.flush()

    # Summary statistics
    scores = [p.risk_score for p in predictions]
    summary = {
        "total": len(predictions),
        "critical": sum(1 for p in predictions if p.risk_level == "critical"),
        "high": sum(1 for p in predictions if p.risk_level == "high"),
        "medium": sum(1 for p in predictions if p.risk_level == "medium"),
        "low": sum(1 for p in predictions if p.risk_level == "low"),
        "avg_risk_score": round(sum(scores) / len(scores), 4) if scores else 0,
    }

    return BatchPredictionResponse(predictions=predictions, summary=summary)


@router.get("/history/{student_id}")
async def prediction_history(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Get prediction history for a student."""
    student_result = await db.execute(
        select(Student).where(Student.student_id == student_id)
    )
    student = student_result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    result = await db.execute(
        select(Prediction)
        .where(Prediction.student_id == student.id)
        .order_by(Prediction.predicted_at.desc())
        .limit(50)
    )
    predictions = result.scalars().all()

    return [
        {
            "risk_score": p.risk_score,
            "risk_level": p.risk_level,
            "model_version": p.model_version,
            "module_code": p.module_code,
            "presentation": p.presentation,
            "predicted_at": p.predicted_at.isoformat(),
        }
        for p in predictions
    ]
