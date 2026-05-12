"""
Seed the database with sample OULAD data for development.

Run: python -m app.seed_data
"""

import asyncio
import random

from sqlalchemy import text

from app.core.database import Base, async_session, engine
from app.core.security import hash_password
from app.models.student import Prediction, Registration, Student
from app.models.user import User

# OULAD domain values
REGIONS = [
    "East Anglian Region", "Scotland", "North Western Region",
    "South East Region", "West Midlands Region", "Wales",
    "Yorkshire Region", "London Region", "North Region",
    "South West Region", "East Midlands Region", "Ireland",
]
EDUCATIONS = [
    "No Formal quals", "Lower Than A Level", "A Level or Equivalent",
    "HE Qualification", "Post Graduate Qualification",
]
IMD_BANDS = ["0-10%", "10-20%", "20-30%", "30-40%", "40-50%",
             "50-60%", "60-70%", "70-80%", "80-90%", "90-100%"]
AGE_BANDS = ["0-35", "35-55", "55<="]
MODULES = ["AAA", "BBB", "CCC", "DDD", "EEE", "FFF", "GGG"]
PRESENTATIONS = ["2013B", "2013J", "2014B", "2014J"]
RESULTS = ["Pass", "Distinction", "Fail", "Withdrawn"]

random.seed(42)


def generate_student(sid: int) -> dict:
    return {
        "student_id": 10000 + sid,
        "gender": random.choice(["M", "F"]),
        "region": random.choice(REGIONS),
        "highest_education": random.choice(EDUCATIONS),
        "imd_band": random.choice(IMD_BANDS),
        "age_band": random.choice(AGE_BANDS),
        "num_of_prev_attempts": random.choices([0, 1, 2, 3], weights=[60, 25, 10, 5])[0],
        "studied_credits": random.choice([30, 60, 90, 120, 150, 180, 240]),
        "disability": random.choice(["N", "N", "N", "N", "Y"]),  # ~20% disabled
    }


def generate_registration(student_db_id: int) -> dict:
    module = random.choice(MODULES)
    pres = random.choice(PRESENTATIONS)
    result = random.choices(RESULTS, weights=[45, 10, 20, 25])[0]

    # Engagement correlates with outcome
    if result in ("Pass", "Distinction"):
        clicks = random.randint(200, 3000)
        assess_avg = random.uniform(55, 95)
    elif result == "Fail":
        clicks = random.randint(50, 800)
        assess_avg = random.uniform(20, 55)
    else:  # Withdrawn
        clicks = random.randint(0, 400)
        assess_avg = random.uniform(10, 50) if random.random() > 0.3 else None

    days = max(1, clicks // random.randint(5, 20))
    submitted = random.randint(0, 8)
    total = random.randint(submitted, submitted + 4)

    return {
        "student_id": student_db_id,
        "module_code": module,
        "presentation": pres,
        "final_result": result,
        "total_clicks": clicks,
        "avg_daily_clicks": round(clicks / max(days, 1), 2),
        "days_active": days,
        "assessment_score_avg": round(assess_avg, 1) if assess_avg else None,
        "assessment_score_std": round(random.uniform(5, 25), 1) if assess_avg else None,
        "assessments_submitted": submitted,
        "assessments_total": total,
        "first_activity_day": random.randint(-20, 10),
        "last_activity_day": random.randint(100, 269),
    }


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # Check if already seeded
        result = await session.execute(text("SELECT COUNT(*) FROM students"))
        if result.scalar() > 0:
            print("Database already seeded. Skipping.")
            return

        # Create admin user
        admin = User(
            email="admin@oulad.ac.uk",
            full_name="Admin User",
            hashed_password=hash_password("admin1234"),
            role="admin",
        )
        session.add(admin)

        # Create demo staff user
        staff = User(
            email="staff@oulad.ac.uk",
            full_name="Jane Doe",
            hashed_password=hash_password("staff1234"),
            role="staff",
        )
        session.add(staff)
        await session.flush()

        # Create students
        students = []
        for i in range(200):
            data = generate_student(i)
            student = Student(**data)
            session.add(student)
            students.append(student)

        await session.flush()

        # Create registrations (1-3 per student)
        for student in students:
            n_regs = random.randint(1, 3)
            for _ in range(n_regs):
                reg_data = generate_registration(student.id)
                session.add(Registration(**reg_data))

        await session.commit()
        print(f"Seeded {len(students)} students with registrations.")
        print("Admin login: admin@oulad.ac.uk / admin1234")
        print("Staff login: staff@oulad.ac.uk / staff1234")


if __name__ == "__main__":
    asyncio.run(seed())
