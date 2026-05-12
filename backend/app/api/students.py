"""Student management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.student import Registration, Student
from app.models.user import User
from app.schemas import (
    PaginatedResponse,
    StudentCreate,
    StudentDetailResponse,
    StudentResponse,
)

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("", response_model=PaginatedResponse)
async def list_students(
    page: int = Query(1, ge=1),
    per_page: int = Query(25, ge=1, le=100),
    search: str | None = None,
    region: str | None = None,
    age_band: str | None = None,
    education: str | None = None,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = select(Student)

    if search:
        query = query.where(
            Student.student_id == int(search)
            if search.isdigit()
            else Student.region.ilike(f"%{search}%")
        )
    if region:
        query = query.where(Student.region == region)
    if age_band:
        query = query.where(Student.age_band == age_band)
    if education:
        query = query.where(Student.highest_education == education)

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar()

    # Paginate
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    students = result.scalars().all()

    return PaginatedResponse(
        items=[StudentResponse.model_validate(s) for s in students],
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page,
    )


@router.get("/{student_id}", response_model=StudentDetailResponse)
async def get_student(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = (
        select(Student)
        .where(Student.student_id == student_id)
        .options(selectinload(Student.registrations))
    )
    result = await db.execute(query)
    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    return student


@router.post("", response_model=StudentResponse, status_code=201)
async def create_student(
    body: StudentCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    existing = await db.execute(
        select(Student).where(Student.student_id == body.student_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Student ID already exists")

    student = Student(**body.model_dump())
    db.add(student)
    await db.flush()
    await db.refresh(student)
    return student


@router.get("/filters/options")
async def get_filter_options(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Return distinct values for filter dropdowns."""
    regions = (await db.execute(select(Student.region).distinct())).scalars().all()
    age_bands = (await db.execute(select(Student.age_band).distinct())).scalars().all()
    educations = (
        (await db.execute(select(Student.highest_education).distinct())).scalars().all()
    )
    modules = (
        (await db.execute(select(Registration.module_code).distinct())).scalars().all()
    )

    return {
        "regions": sorted(regions),
        "age_bands": sorted(age_bands),
        "educations": sorted(educations),
        "modules": sorted(modules),
    }
