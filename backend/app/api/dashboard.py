"""Dashboard aggregate endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy import case, cast, Float, func, select, literal_column
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.student import Prediction, Registration, Student
from app.models.user import User
from app.schemas import CohortSummary, DashboardResponse, ModuleSummary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardResponse)
async def dashboard_summary(
    module_code: str | None = None,
    presentation: str | None = None,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    # ── Cohort summary from latest predictions ───────────────────────────
    pred_query = select(Prediction)
    if module_code:
        pred_query = pred_query.where(Prediction.module_code == module_code)
    if presentation:
        pred_query = pred_query.where(Prediction.presentation == presentation)

    predictions = (await db.execute(pred_query)).scalars().all()

    if predictions:
        risk_dist = {"low": 0, "medium": 0, "high": 0, "critical": 0}
        total_score = 0.0
        for p in predictions:
            risk_dist[p.risk_level] = risk_dist.get(p.risk_level, 0) + 1
            total_score += p.risk_score

        at_risk = risk_dist["high"] + risk_dist["critical"]
        total = len(predictions)

        cohort = CohortSummary(
            total_students=total,
            at_risk_count=at_risk,
            at_risk_percentage=round(at_risk / total * 100, 1) if total else 0,
            avg_risk_score=round(total_score / total, 4) if total else 0,
            risk_distribution=risk_dist,
        )
    else:
        # Fallback: derive from registration outcomes
        total_count = (await db.execute(select(func.count(Student.id)))).scalar()
        cohort = CohortSummary(
            total_students=total_count or 0,
            at_risk_count=0,
            at_risk_percentage=0.0,
            avg_risk_score=0.0,
            risk_distribution={"low": 0, "medium": 0, "high": 0, "critical": 0},
        )

    # ── Per-module summaries ─────────────────────────────────────────────
    module_stats_query = (
        select(
            Registration.module_code,
            Registration.presentation,
            func.count(Registration.id).label("enrolled"),
            func.avg(Registration.total_clicks).label("avg_engagement"),
            (
                cast(
                    func.sum(
                        case(
                            (Registration.final_result.in_(["Pass", "Distinction"]), 1),
                            else_=0,
                        )
                    ),
                    Float,
                )
                / func.count(Registration.id)
                * 100
            ).label("pass_rate"),
        )
        .group_by(Registration.module_code, Registration.presentation)
        .order_by(Registration.module_code)
    )
    module_rows = (await db.execute(module_stats_query)).all()

    modules = []
    for row in module_rows:
        at_risk_q = select(func.count(Prediction.id)).where(
            Prediction.module_code == row.module_code,
            Prediction.presentation == row.presentation,
            Prediction.risk_level.in_(["high", "critical"]),
        )
        at_risk_count = (await db.execute(at_risk_q)).scalar() or 0

        modules.append(ModuleSummary(
            module_code=row.module_code,
            presentation=row.presentation,
            enrolled=row.enrolled,
            at_risk=at_risk_count,
            avg_engagement=round(float(row.avg_engagement or 0), 1),
            pass_rate=round(float(row.pass_rate or 0), 1),
        ))

    # ── Risk trend (fixed GROUP BY) ──────────────────────────────────────
    date_col = func.date_trunc('day', Prediction.predicted_at).label("date")
    trend_query = (
        select(
            date_col,
            func.avg(Prediction.risk_score).label("avg_score"),
            func.count(Prediction.id).label("count"),
        )
        .group_by(date_col)
        .order_by(date_col)
        .limit(90)
    )
    trend_rows = (await db.execute(trend_query)).all()
    risk_trend = [
        {
            "date": row.date.isoformat() if row.date else "",
            "avg_score": round(float(row.avg_score), 4),
            "count": row.count,
        }
        for row in trend_rows
    ]

    return DashboardResponse(
        cohort=cohort,
        modules=modules,
        risk_trend=risk_trend,
        top_risk_factors=[],
    )
