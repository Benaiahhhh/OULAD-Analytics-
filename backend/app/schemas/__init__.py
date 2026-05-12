"""Pydantic v2 schemas for API request/response validation."""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ── Auth ─────────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=255)
    password: str = Field(min_length=8)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Students ─────────────────────────────────────────────────────────────────
class StudentBase(BaseModel):
    student_id: int
    gender: str
    region: str
    highest_education: str
    imd_band: str | None = None
    age_band: str
    num_of_prev_attempts: int = 0
    studied_credits: int
    disability: str = "N"


class StudentCreate(StudentBase):
    pass


class StudentResponse(StudentBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class RegistrationResponse(BaseModel):
    id: int
    module_code: str
    presentation: str
    final_result: str
    total_clicks: int
    avg_daily_clicks: float
    days_active: int
    assessment_score_avg: float | None
    assessments_submitted: int
    assessments_total: int

    model_config = {"from_attributes": True}


class StudentDetailResponse(StudentResponse):
    registrations: list[RegistrationResponse] = []


# ── Predictions ──────────────────────────────────────────────────────────────
class PredictionRequest(BaseModel):
    student_id: int
    module_code: str
    presentation: str


class BatchPredictionRequest(BaseModel):
    students: list[PredictionRequest]


class FeatureContribution(BaseModel):
    feature: str
    value: float
    contribution: float
    direction: str  # "risk" or "protective"


class PredictionResponse(BaseModel):
    student_id: int
    risk_score: float = Field(ge=0.0, le=1.0)
    risk_level: str
    model_version: str
    features: list[FeatureContribution] = []
    predicted_at: datetime

    model_config = {"from_attributes": True}


class BatchPredictionResponse(BaseModel):
    predictions: list[PredictionResponse]
    summary: dict


# ── Dashboard ────────────────────────────────────────────────────────────────
class CohortSummary(BaseModel):
    total_students: int
    at_risk_count: int
    at_risk_percentage: float
    avg_risk_score: float
    risk_distribution: dict[str, int]  # {"low": 40, "medium": 25, ...}


class ModuleSummary(BaseModel):
    module_code: str
    presentation: str
    enrolled: int
    at_risk: int
    avg_engagement: float
    pass_rate: float | None


class DashboardResponse(BaseModel):
    cohort: CohortSummary
    modules: list[ModuleSummary]
    risk_trend: list[dict]  # time-series data for charts
    top_risk_factors: list[FeatureContribution]


# ── Pagination ───────────────────────────────────────────────────────────────
class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    per_page: int
    pages: int
