# OULAD Student Retention Analytics Platform

A full-stack analytics application that productionises a student retention prediction model (AUC 0.877) built on the Open University Learning Analytics Dataset (OULAD). University staff can monitor cohorts, identify at-risk students, and take data-driven intervention decisions.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│  Dashboard │ Predictions │ Student Profiles │ Auth   │
├─────────────────────────────────────────────────────┤
│                   FastAPI Backend                     │
│  /api/v1/auth  │  /api/v1/students  │  /api/v1/predict │
├─────────────────────────────────────────────────────┤
│           PostgreSQL  │  Redis (cache/sessions)      │
├─────────────────────────────────────────────────────┤
│              ML Model (scikit-learn pipeline)         │
│        Logistic Regression · AUC 0.877               │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer       | Technology                                      |
|-------------|--------------------------------------------------|
| Frontend    | React 18, Recharts, TailwindCSS, React Router   |
| Backend     | FastAPI, SQLAlchemy 2.0, Pydantic v2, Alembic    |
| Database    | PostgreSQL 16, Redis 7                           |
| ML          | scikit-learn, pandas, joblib                     |
| Auth        | JWT (python-jose), bcrypt, OAuth2 password flow  |
| Deploy      | Docker Compose, Nginx, Gunicorn + Uvicorn        |

## Quick Start

### Docker (recommended)

```bash
cp .env.example .env
docker compose up --build
```

App runs at `http://localhost:3000`, API at `http://localhost:8000/docs`.

### Local Development

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python -m app.seed_data  # Load OULAD sample data
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Project Structure

```
oulad-analytics/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry
│   │   ├── api/                  # Route handlers
│   │   │   ├── auth.py           # Login, register, token refresh
│   │   │   ├── students.py       # Student CRUD + search
│   │   │   ├── predictions.py    # ML prediction endpoints
│   │   │   └── dashboard.py      # Aggregate stats
│   │   ├── core/                 # Config, security, dependencies
│   │   ├── models/               # SQLAlchemy ORM models
│   │   ├── schemas/              # Pydantic request/response models
│   │   ├── services/             # Business logic layer
│   │   └── ml/                   # Model loading + inference
│   ├── alembic/                  # Database migrations
│   ├── tests/                    # pytest test suite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── hooks/                # Custom React hooks
│   │   ├── lib/                  # API client, utilities
│   │   └── pages/                # Page-level components
│   └── package.json
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
├── docker-compose.yml
└── .env.example
```

## ML Model Details

The prediction model uses logistic regression trained on the OULAD dataset:

- **Features**: VLE click counts, assessment scores, prior qualifications, IMD band, age band, disability status, number of previous attempts, studied credits
- **Target**: Binary classification — student completes module vs. withdraws/fails
- **Performance**: AUC 0.877 (5-fold cross-validated), bootstrap 95% CI [0.871, 0.883]
- **Serving**: Serialised via joblib, loaded at API startup, predictions cached in Redis

## API Endpoints

| Method | Endpoint                          | Description                      |
|--------|-----------------------------------|----------------------------------|
| POST   | `/api/v1/auth/login`              | Authenticate, receive JWT        |
| POST   | `/api/v1/auth/register`           | Create new staff account         |
| GET    | `/api/v1/dashboard/summary`       | Cohort overview statistics       |
| GET    | `/api/v1/students`                | List students with filters       |
| GET    | `/api/v1/students/{id}`           | Student detail + history         |
| POST   | `/api/v1/predict/single`          | Predict one student              |
| POST   | `/api/v1/predict/batch`           | Batch predict (CSV upload)       |
| GET    | `/api/v1/predict/features/{id}`   | Feature importance for student   |

## Environment Variables

See `.env.example` for all required configuration.

## License

MIT
