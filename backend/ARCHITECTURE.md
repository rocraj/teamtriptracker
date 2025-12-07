# TeamTripTracker Backend - Architecture & Setup Guide

**Version:** 1.0.0  
**Last Updated:** December 8, 2025

---

## Table of Contents

1. [Project Architecture](#project-architecture)
2. [Technology Stack](#technology-stack)
3. [Setup Instructions](#setup-instructions)
4. [Project Structure](#project-structure)
5. [Key Design Patterns](#key-design-patterns)
6. [Database Schema](#database-schema)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Project Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────┐
│         Frontend Application             │
│    (React, Angular, or Vue.js)           │
└────────────┬────────────────────────────┘
             │
             │ HTTP/REST
             │
┌────────────▼────────────────────────────┐
│      FastAPI Web Server                  │
│  ┌────────────────────────────────────┐  │
│  │      API Routes & Endpoints        │  │
│  │  - /auth   (Authentication)        │  │
│  │  - /teams  (Team Management)       │  │
│  │  - /expenses (Expense Tracking)    │  │
│  │  - /summary (Analytics)            │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │    Service Layer (Business Logic)  │  │
│  │  - AuthService                     │  │
│  │  - TeamService                     │  │
│  │  - ExpenseService                  │  │
│  │  - EmailService (SMTP)             │  │
│  │  - InvitationService               │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │    Security & Utilities            │  │
│  │  - JWT Token Generation/Validation │  │
│  │  - Password Hashing (Argon2)       │  │
│  │  - Dependency Injection            │  │
│  └────────────────────────────────────┘  │
└────────────┬────────────────────────────┘
             │
             │ SQLAlchemy ORM
             │
┌────────────▼────────────────────────────┐
│      PostgreSQL Database                 │
│  ┌────────────────────────────────────┐  │
│  │  - Users Table                     │  │
│  │  - Teams Table                     │  │
│  │  - TeamMembers Table               │  │
│  │  - Expenses Table                  │  │
│  │  - TeamInvitations Table           │  │
│  └────────────────────────────────────┘  │
└────────────────────────────────────────┘

External Services:
┌────────────────────────────────────────┐
│   Google SMTP (Email Invitations)      │
│   - OAuth 2.0 Integration              │
└────────────────────────────────────────┘
```

### Component Responsibilities

**API Layer (`app/api/`):**
- Route handling
- Request validation
- Response formatting
- HTTP status code management

**Service Layer (`app/services/`):**
- Business logic
- Data processing
- External service integration
- Error handling

**Models Layer (`app/models/`):**
- Database ORM models
- Pydantic schemas (for validation)
- Data serialization

**Core Layer (`app/core/`):**
- Configuration management
- Database connection
- Security utilities
- Authentication logic

---

## Technology Stack

### Backend Framework
- **FastAPI** 0.104.1 - High-performance async web framework
- **Uvicorn** - ASGI server for running FastAPI

### Database & ORM
- **PostgreSQL** - Relational database
- **SQLModel** - SQL database ORM combining SQLAlchemy & Pydantic
- **Alembic** (optional) - Database migrations

### Authentication & Security
- **Python-jose** - JWT token handling (HS256)
- **Passlib** - Password hashing with Argon2
- **Python-multipart** - Form data parsing

### Email
- **smtplib** - Built-in Python SMTP
- **email.mime** - Built-in Python email formatting

### Testing
- **pytest** - Testing framework
- **pytest-asyncio** - Async test support
- **httpx** - Async HTTP client for testing

### Utilities
- **python-dotenv** - Environment variable management
- **pydantic** - Data validation
- **uuid** - Unique identifier generation

---

## Setup Instructions

### Prerequisites

- **Python:** 3.10 or higher
- **PostgreSQL:** 12 or higher
- **pip:** Python package manager
- **Git:** Version control

### Installation Steps

#### 1. Clone Repository
```bash
git clone https://github.com/rocraj/teamtriptracker.git
cd teamtriptracker/backend
```

#### 2. Create Virtual Environment
```bash
# Create venv
python -m venv venv

# Activate venv (macOS/Linux)
source venv/bin/activate

# Activate venv (Windows)
venv\Scripts\activate
```

#### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 4. Setup Environment Variables
```bash
# Copy example file
cp .env.example .env

# Edit .env with your values
nano .env  # or vim, code, etc.
```

**Required environment variables:**
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/teamtriptracker

# JWT
JWT_SECRET=your-super-secret-key-min-32-characters-long
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440

# Email (Google SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password

# URLs
FRONTEND_URL=http://localhost:4200
BACKEND_URL=http://localhost:8000
CORS_ORIGINS=["http://localhost:4200"]
```

#### 5. Setup Database
```bash
# Create database (if using PostgreSQL locally)
createdb teamtriptracker

# Run migrations (if using Alembic - not yet implemented)
# alembic upgrade head

# Alternatively, create tables from models
python -c "
from sqlmodel import create_all, Session, SQLModel
from app.core.database import engine
from app.models.schemas import *

create_all(engine)
print('Database tables created successfully!')
"
```

#### 6. Verify Installation
```bash
# Run tests
pytest tests/ -v

# Start development server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Check health at http://localhost:8000/health (if implemented)
# View API docs at http://localhost:8000/docs
```

### Gmail SMTP Setup

1. Enable 2-Step Verification:
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. Generate App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Generate password
   - Copy the 16-character password to `SMTP_PASSWORD`

---

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app initialization
│   │
│   ├── api/                    # Route handlers
│   │   ├── __init__.py
│   │   ├── auth.py            # Authentication endpoints
│   │   ├── teams.py           # Team management endpoints
│   │   ├── expenses.py        # Expense tracking endpoints
│   │   └── summary.py         # Analytics & summary endpoints
│   │
│   ├── services/              # Business logic layer
│   │   ├── __init__.py
│   │   ├── auth.py            # Authentication logic
│   │   ├── team.py            # Team service
│   │   ├── expense.py         # Expense service
│   │   ├── settlement.py      # Settlement calculations
│   │   ├── email.py           # Email sending
│   │   └── invitation.py      # Invitation token management
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py         # SQLModel models & Pydantic schemas
│   │
│   ├── core/                  # Core utilities
│   │   ├── __init__.py
│   │   ├── config.py          # Environment configuration
│   │   ├── database.py        # Database connection
│   │   └── security.py        # JWT & password utilities
│   │
│   └── utils/
│       └── __init__.py
│
├── tests/                     # Test suite
│   ├── __init__.py
│   ├── conftest.py           # Pytest configuration
│   ├── test_auth.py          # Auth tests
│   ├── test_teams.py         # Team tests
│   ├── test_expenses.py      # Expense tests
│   ├── test_summary.py       # Summary tests
│   └── README.md             # Testing guide
│
├── Dockerfile                 # Docker configuration
├── requirements.txt          # Python dependencies
├── .env.example              # Example environment file
├── README.md                 # Project README
└── API_DOCUMENTATION.md      # (This file) API documentation
```

### File Descriptions

#### `app/main.py`
- FastAPI app initialization
- CORS configuration
- Route registration
- Startup/shutdown events

#### `app/api/auth.py`
- User registration endpoint
- User login endpoint
- Google OAuth endpoint
- Current user endpoint
- Email check endpoint
- Invitation acceptance endpoints

#### `app/api/teams.py`
- Create team endpoint
- List user teams endpoint
- Get team details endpoint
- Add team members endpoints
- Send bulk invitations endpoint
- Get pending invitations endpoint

#### `app/api/expenses.py`
- Create expense endpoint
- List expenses endpoint
- Get expense details endpoint
- Delete expense endpoint

#### `app/api/summary.py`
- Get balances endpoint
- Get settlements endpoint
- Get next payer suggestion endpoint

#### `app/services/auth.py`
- User registration logic
- User login logic
- Token generation
- User retrieval

#### `app/services/team.py`
- Team creation logic
- Team retrieval logic
- Member management logic
- Budget setting logic

#### `app/services/expense.py`
- Expense creation logic
- Expense retrieval logic
- Expense deletion logic

#### `app/services/settlement.py`
- Settlement calculation
- Balance computation
- Next payer suggestion

#### `app/services/email.py`
- SMTP connection
- Email template rendering
- Bulk email sending
- Error handling

#### `app/services/invitation.py`
- Invitation token generation
- Invitation token validation
- Invitation database management
- Expiration tracking

#### `app/core/config.py`
- Environment variable loading
- Configuration validation
- SMTP settings
- JWT settings

#### `app/core/database.py`
- SQLModel engine initialization
- Database connection management
- Session dependency

#### `app/core/security.py`
- JWT token creation
- JWT token validation
- Password hashing
- Current user dependency

#### `app/models/schemas.py`
- User model
- Team model
- TeamMember model
- Expense model
- TeamInvitation model
- Request/Response schemas

---

## Key Design Patterns

### 1. Dependency Injection
```python
# FastAPI automatically resolves dependencies
def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    # Returns current user from JWT token
    ...

@app.get("/me")
async def me(user: User = Depends(get_current_user)):
    return user
```

### 2. Service Layer Pattern
```python
# API layer delegates business logic to services
@router.post("/teams")
async def create_team(
    team_in: TeamCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Call service
    return await team_service.create_team(session, team_in, current_user.id)
```

### 3. Transaction Management
```python
# Database sessions automatically rollback on errors
async def create_team(session: Session, ...):
    team = Team(...)
    session.add(team)
    session.commit()  # Auto-rollback if exception
    return team
```

### 4. JWT Token Pattern
```python
# Custom JWT payload for invitations
def create_invitation_token(team_id: UUID, email: str) -> str:
    payload = {
        "team_id": str(team_id),
        "email": email,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
```

### 5. Error Handling
```python
# Consistent error responses
if not user:
    raise HTTPException(
        status_code=404,
        detail="User not found"
    )
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐
│   Users     │
├─────────────┤
│ id (PK)     │
│ email       │ (unique)
│ name        │
│ password    │ (hashed)
│ auth_prov   │
│ photo_url   │
│ created_at  │
└──────┬──────┘
       │
       │ 1:N
       │
       ├─────────────────────────┐
       │                         │
       ▼                         ▼
┌─────────────────┐      ┌──────────────────┐
│  TeamMembers    │      │  TeamInvitation  │
├─────────────────┤      ├──────────────────┤
│ id (PK)         │      │ id (PK)          │
│ team_id (FK)    │      │ team_id (FK)     │
│ user_id (FK)    │      │ inviter_id (FK)  │
│ budget          │      │ invitee_email    │
└────────┬────────┘      │ created_at       │
         │               │ expires_at       │
         │               │ is_used          │
         │               └──────────────────┘
         │
      1:N │
         │
         └──────────────────────┐
                                │
         ┌──────────────────────┘
         │
         ▼
    ┌─────────┐
    │ Teams   │
    ├─────────┤
    │ id (PK) │
    │ name    │
    │ created │
    │ created │
    └────┬────┘
         │
         │ 1:N
         │
         ▼
    ┌──────────────┐
    │ Expenses     │
    ├──────────────┤
    │ id (PK)      │
    │ team_id (FK) │
    │ payer_id (FK)│
    │ amount       │
    │ participants │
    │ label        │
    │ emoji        │
    │ note         │
    │ created_at   │
    └──────────────┘
```

### Tables

#### Users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255),
    auth_provider VARCHAR(50),
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Teams
```sql
CREATE TABLE teams (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### TeamMembers
```sql
CREATE TABLE team_members (
    id UUID PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id),
    user_id UUID NOT NULL REFERENCES users(id),
    initial_budget FLOAT DEFAULT 0.0,
    UNIQUE(team_id, user_id)
);
```

#### Expenses
```sql
CREATE TABLE expenses (
    id UUID PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id),
    payer_id UUID NOT NULL REFERENCES users(id),
    total_amount FLOAT NOT NULL,
    participants TEXT NOT NULL, -- JSON array
    type_label VARCHAR(255),
    type_emoji VARCHAR(10),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### TeamInvitations
```sql
CREATE TABLE team_invitations (
    id UUID PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id),
    invitee_email VARCHAR(255) NOT NULL,
    inviter_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE
);
```

---

## Testing

### Test Structure

```
tests/
├── conftest.py          # Shared fixtures
├── test_auth.py         # Authentication tests
├── test_teams.py        # Team management tests
├── test_expenses.py     # Expense tracking tests
├── test_summary.py      # Analytics tests
└── README.md            # Testing guide
```

### Running Tests

```bash
# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/test_auth.py -v

# Run specific test
pytest tests/test_auth.py::test_register_success -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html

# Run in watch mode
pytest-watch tests/
```

### Test Coverage

Current test coverage:
- Auth: 5/5 tests passing (100%)
- Teams: 10/10 tests passing (100%)
- Expenses: Basic tests (to be expanded)
- Summary: Basic tests (to be expanded)

### Writing Tests

**Example test:**
```python
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_register_success():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/auth/register",
            json={
                "email": "test@example.com",
                "name": "Test User",
                "password": "SecurePassword123!"
            }
        )
        assert response.status_code == 200
        assert "access_token" in response.json()
```

---

## Deployment

### Docker Deployment

#### Building Docker Image
```bash
# Build image
docker build -t teamtriptracker-backend:1.0.0 .

# Run container
docker run -p 8000:8000 \
  --env-file .env \
  teamtriptracker-backend:1.0.0
```

#### Docker Compose (Recommended)
```bash
# Create docker-compose.yml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: ttt_user
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: teamtriptracker
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://ttt_user:secure_password@db:5432/teamtriptracker
      JWT_SECRET: your-secret-key
    depends_on:
      - db
    volumes:
      - ./app:/app

volumes:
  postgres_data:

# Run services
docker-compose up -d
```

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Secret keys generated and secured
- [ ] SMTP credentials configured
- [ ] CORS origins configured
- [ ] SSL/TLS certificates installed (production)
- [ ] Database backups configured
- [ ] Logging configured
- [ ] Monitoring configured

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Error
```
Error: Can't connect to PostgreSQL
```

**Solution:**
```bash
# Check PostgreSQL is running
psql --version

# Create database
createdb teamtriptracker

# Update DATABASE_URL in .env
# Format: postgresql://username:password@localhost:5432/teamtriptracker
```

#### 2. JWT Secret Not Set
```
Error: JWT_SECRET not configured
```

**Solution:**
```bash
# Generate secure secret
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Add to .env
JWT_SECRET=generated_secret_here
```

#### 3. Email Not Sending
```
Error: SMTP authentication failed
```

**Solution:**
```
1. Check SMTP_USER and SMTP_PASSWORD in .env
2. Verify app password (not regular password for Gmail)
3. Check SMTP_HOST=smtp.gmail.com and SMTP_PORT=587
4. Enable "Less secure app access" if needed (not recommended)
```

#### 4. CORS Error
```
Error: Cross-Origin Request Blocked
```

**Solution:**
```
Update CORS_ORIGINS in .env to include frontend URL:
CORS_ORIGINS=["http://localhost:4200"]
```

#### 5. Port Already in Use
```
Error: Port 8000 already in use
```

**Solution:**
```bash
# Use different port
python -m uvicorn app.main:app --reload --port 8001
```

### Debugging Commands

```bash
# Check Python version
python --version

# List installed packages
pip list

# Check database connection
psql -U username -d teamtriptracker -c "SELECT NOW();"

# View FastAPI docs
# Open http://localhost:8000/docs in browser

# Test endpoint
curl -X GET http://localhost:8000/health

# Check logs
tail -f logs/app.log
```

---

## Performance Optimization

### Current Optimizations
- Async/await for non-blocking I/O
- Connection pooling via SQLModel
- JWT caching in client

### Recommended Future Optimizations
- Database query result caching (Redis)
- API response caching
- Database indexing on frequently queried columns
- Rate limiting
- Compression for API responses
- CDN for static assets

---

## Security Best Practices

✅ Implemented:
- Password hashing with Argon2
- JWT token expiration
- SQL injection protection (ORM)
- CORS validation
- Email validation
- Token validation in invitations

⚠️ To Implement:
- Rate limiting
- Request validation schemas
- Audit logging
- API versioning
- Secret key rotation
- Database encryption at rest

---

## Contributing Guidelines

1. Create feature branch: `git checkout -b feature/name`
2. Make changes following code style
3. Write tests for new features
4. Run tests: `pytest tests/ -v`
5. Commit with clear messages: `git commit -m "Add feature: xyz"`
6. Push and create Pull Request

---

**Last Updated:** December 8, 2025  
**Maintained By:** TeamTripTracker Team
