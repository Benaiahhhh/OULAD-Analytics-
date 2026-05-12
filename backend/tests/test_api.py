"""API test suite using httpx async client."""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.main import app

# Test database (SQLite async for speed)
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
test_session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with test_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient):
    """Register a user and return auth headers."""
    await client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "full_name": "Test User",
        "password": "testpass123",
    })
    response = await client.post("/api/v1/auth/login", data={
        "username": "test@example.com",
        "password": "testpass123",
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ── Auth Tests ───────────────────────────────────────────────────────────────
class TestAuth:
    @pytest.mark.asyncio
    async def test_register(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/register", json={
            "email": "new@example.com",
            "full_name": "New User",
            "password": "password123",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "new@example.com"
        assert data["role"] == "staff"

    @pytest.mark.asyncio
    async def test_register_duplicate(self, client: AsyncClient):
        payload = {
            "email": "dup@example.com",
            "full_name": "Dup User",
            "password": "password123",
        }
        await client.post("/api/v1/auth/register", json=payload)
        response = await client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient):
        await client.post("/api/v1/auth/register", json={
            "email": "login@example.com",
            "full_name": "Login User",
            "password": "password123",
        })
        response = await client.post("/api/v1/auth/login", data={
            "username": "login@example.com",
            "password": "password123",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient):
        await client.post("/api/v1/auth/register", json={
            "email": "wrong@example.com",
            "full_name": "Wrong User",
            "password": "password123",
        })
        response = await client.post("/api/v1/auth/login", data={
            "username": "wrong@example.com",
            "password": "wrongpass",
        })
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_me(self, client: AsyncClient, auth_headers: dict):
        response = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["email"] == "test@example.com"


# ── Student Tests ────────────────────────────────────────────────────────────
class TestStudents:
    @pytest.mark.asyncio
    async def test_create_student(self, client: AsyncClient, auth_headers: dict):
        response = await client.post("/api/v1/students", headers=auth_headers, json={
            "student_id": 99999,
            "gender": "F",
            "region": "London Region",
            "highest_education": "A Level or Equivalent",
            "imd_band": "40-50%",
            "age_band": "0-35",
            "num_of_prev_attempts": 0,
            "studied_credits": 120,
            "disability": "N",
        })
        assert response.status_code == 201
        assert response.json()["student_id"] == 99999

    @pytest.mark.asyncio
    async def test_list_students_unauthorized(self, client: AsyncClient):
        response = await client.get("/api/v1/students")
        assert response.status_code == 401


# ── Health Check ─────────────────────────────────────────────────────────────
class TestHealth:
    @pytest.mark.asyncio
    async def test_health(self, client: AsyncClient):
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
