"""Student and related analytics models mapped to the OULAD dataset."""

from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Student(Base):
    """Core student record."""
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    student_id: Mapped[int] = mapped_column(Integer, unique=True, index=True)
    gender: Mapped[str] = mapped_column(String(10))
    region: Mapped[str] = mapped_column(String(100))
    highest_education: Mapped[str] = mapped_column(String(100))
    imd_band: Mapped[str | None] = mapped_column(String(20), nullable=True)
    age_band: Mapped[str] = mapped_column(String(20))
    num_of_prev_attempts: Mapped[int] = mapped_column(Integer, default=0)
    studied_credits: Mapped[int] = mapped_column(Integer)
    disability: Mapped[str] = mapped_column(String(10), default="N")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    registrations: Mapped[list["Registration"]] = relationship(back_populates="student")
    predictions: Mapped[list["Prediction"]] = relationship(back_populates="student")


class Registration(Base):
    """Student registration in a module presentation (semester)."""
    __tablename__ = "registrations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    module_code: Mapped[str] = mapped_column(String(10))
    presentation: Mapped[str] = mapped_column(String(10))  # e.g. "2014J"
    final_result: Mapped[str] = mapped_column(String(20))  # Pass, Fail, Withdrawn, Distinction

    # Aggregated engagement features (pre-computed from VLE logs)
    total_clicks: Mapped[int] = mapped_column(Integer, default=0)
    avg_daily_clicks: Mapped[float] = mapped_column(Float, default=0.0)
    days_active: Mapped[int] = mapped_column(Integer, default=0)
    assessment_score_avg: Mapped[float | None] = mapped_column(Float, nullable=True)
    assessment_score_std: Mapped[float | None] = mapped_column(Float, nullable=True)
    assessments_submitted: Mapped[int] = mapped_column(Integer, default=0)
    assessments_total: Mapped[int] = mapped_column(Integer, default=0)
    first_activity_day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    last_activity_day: Mapped[int | None] = mapped_column(Integer, nullable=True)

    student: Mapped["Student"] = relationship(back_populates="registrations")


class Prediction(Base):
    """Stored prediction results for audit trail."""
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    module_code: Mapped[str] = mapped_column(String(10))
    presentation: Mapped[str] = mapped_column(String(10))
    risk_score: Mapped[float] = mapped_column(Float)  # 0.0 to 1.0
    risk_level: Mapped[str] = mapped_column(String(20))  # low, medium, high, critical
    model_version: Mapped[str] = mapped_column(String(20))
    feature_contributions: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON
    predicted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    predicted_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )

    student: Mapped["Student"] = relationship(back_populates="predictions")
