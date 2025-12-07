# TeamTripTracker Quick Reference Guide

**Version:** 1.0.0  
**Last Updated:** December 8, 2025

---

## Quick Start

### Installation (5 minutes)
```bash
# 1. Clone and setup
git clone https://github.com/rocraj/teamtriptracker.git
cd teamtriptracker/backend

# 2. Virtual environment
python -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Setup environment
cp .env.example .env
# Edit .env with your settings

# 5. Initialize database
python -c "from app.core.database import *; from app.models.schemas import *; SQLModel.metadata.create_all(engine)"

# 6. Run server
python -m uvicorn app.main:app --reload --port 8000
```

### Access Documentation
- **API Docs:** http://localhost:8000/docs (Swagger UI)
- **Alternative Docs:** http://localhost:8000/redoc (ReDoc)

---

## Common API Calls

### Authentication

**Register**
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "SecurePass123!"
  }'
```

**Login**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
# Returns: { "access_token": "...", "token_type": "bearer" }
```

**Get Current User**
```bash
curl -X GET http://localhost:8000/auth/me \
  -H "Authorization: Bearer {token}"
```

---

### Teams

**Create Team**
```bash
curl -X POST http://localhost:8000/teams \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Summer Vacation" }'
```

**List Teams**
```bash
curl -X GET http://localhost:8000/teams \
  -H "Authorization: Bearer {token}"
```

**Send Invitations**
```bash
curl -X POST http://localhost:8000/teams/{team_id}/send-invites \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "emails": ["alice@example.com", "bob@example.com"]
  }'
```

**Set Member Budget**
```bash
curl -X POST http://localhost:8000/teams/{team_id}/budget \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "{user_id}",
    "budget_amount": 5000
  }'
```

---

### Expenses

**Create Expense**
```bash
curl -X POST http://localhost:8000/expenses \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "team_id": "{team_id}",
    "total_amount": 150,
    "participants": ["{user_id_1}", "{user_id_2}"],
    "type_label": "Food",
    "type_emoji": "🍔",
    "note": "Lunch"
  }'
```

**List Expenses**
```bash
curl -X GET "http://localhost:8000/expenses/{team_id}?limit=50&offset=0" \
  -H "Authorization: Bearer {token}"
```

**Delete Expense**
```bash
curl -X DELETE http://localhost:8000/expenses/{expense_id} \
  -H "Authorization: Bearer {token}"
```

---

### Summary

**Get Balances**
```bash
curl -X GET http://localhost:8000/summary/{team_id}/balances \
  -H "Authorization: Bearer {token}"
```

**Get Settlements**
```bash
curl -X GET http://localhost:8000/summary/{team_id}/settlements \
  -H "Authorization: Bearer {token}"
```

**Next Payer**
```bash
curl -X GET http://localhost:8000/summary/{team_id}/next-payer \
  -H "Authorization: Bearer {token}"
```

---

## Project Structure Cheat Sheet

```
app/
├── api/               ← API routes
│   ├── auth.py       (login, register, profile)
│   ├── teams.py      (team management)
│   ├── expenses.py   (expense tracking)
│   └── summary.py    (analytics)
├── services/          ← Business logic
│   ├── auth.py
│   ├── team.py
│   ├── expense.py
│   ├── settlement.py
│   ├── email.py
│   └── invitation.py
├── models/            ← Database & schemas
│   └── schemas.py
├── core/              ← Configuration & security
│   ├── config.py      (env variables)
│   ├── database.py    (DB connection)
│   └── security.py    (JWT, password)
└── main.py            ← FastAPI app
```

---

## Testing Cheat Sheet

```bash
# Run all tests
pytest tests/ -v

# Run specific file
pytest tests/test_auth.py -v

# Run specific test
pytest tests/test_auth.py::test_register_success -v

# With coverage
pytest tests/ --cov=app

# Watch mode (requires pytest-watch)
ptw tests/
```

---

## Environment Variables

### Required
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/teamtriptracker
JWT_SECRET=your-super-secret-min-32-chars
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Optional
```env
JWT_EXPIRATION_MINUTES=1440
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
FRONTEND_URL=http://localhost:4200
BACKEND_URL=http://localhost:8000
CORS_ORIGINS=["http://localhost:4200"]
```

---

## Development Commands

```bash
# Start development server
python -m uvicorn app.main:app --reload

# Run tests
pytest tests/ -v

# Run specific test file
pytest tests/test_auth.py -v

# Check syntax
python -m py_compile app/api/*.py app/services/*.py

# Create database
createdb teamtriptracker

# Drop database
dropdb teamtriptracker

# View FastAPI docs
# Open http://localhost:8000/docs in browser

# Format code (if using black)
black app/

# Lint code (if using pylint)
pylint app/

# Check imports (if using isort)
isort app/
```

---

## Database Commands

### PostgreSQL

```bash
# Connect to database
psql -U username -d teamtriptracker

# List tables
\dt

# Describe table
\d table_name

# Execute SQL
SELECT * FROM users;

# Backup database
pg_dump teamtriptracker > backup.sql

# Restore database
psql teamtriptracker < backup.sql
```

---

## Debugging Tips

### 1. Print current request/user
```python
print(f"User: {current_user.id}")
print(f"Team: {team_id}")
```

### 2. Check database state
```python
users = session.exec(select(User)).all()
print(f"Users: {users}")
```

### 3. Verify token
```python
from app.core.security import verify_token
payload = verify_token(token)
print(f"Token payload: {payload}")
```

### 4. Test endpoint quickly
```bash
curl -X GET http://localhost:8000/auth/me \
  -H "Authorization: Bearer eyJ..."
```

---

## Common Error Solutions

| Error | Solution |
|-------|----------|
| `401 Unauthorized` | Check token is valid and not expired |
| `403 Forbidden` | User not member of team |
| `404 Not Found` | Resource doesn't exist - check IDs |
| `400 Bad Request` | Invalid input - check request body |
| `Database connection error` | Check DATABASE_URL and PostgreSQL running |
| `SMTP error` | Check email credentials and 2FA enabled |
| `Port already in use` | Use `--port 8001` or kill process on 8000 |

---

## Code Snippets

### Add New Service Method
```python
class TeamService:
    @staticmethod
    async def new_method(session: Session, param: str):
        """Description."""
        # Implementation
        return result
```

### Add New API Endpoint
```python
@router.post("/teams/{team_id}/new-endpoint")
async def new_endpoint(
    team_id: UUID,
    data: RequestSchema,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
) -> ResponseSchema:
    """Endpoint description."""
    # Implementation
    return response
```

### Add New Test
```python
@pytest.mark.asyncio
async def test_new_feature():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/endpoint", json={...})
        assert response.status_code == 200
        assert response.json()["key"] == "value"
```

---

## File Locations

| What | Where |
|------|-------|
| API Routes | `app/api/` |
| Business Logic | `app/services/` |
| Database Models | `app/models/schemas.py` |
| Configuration | `app/core/config.py` |
| Security Utils | `app/core/security.py` |
| Tests | `tests/` |
| Documentation | Root directory |
| Environment | `.env` |
| Dependencies | `requirements.txt` |

---

## Feature Request Template

When adding new features, follow this template:

```python
"""
FEATURE: Feature Name

DESCRIPTION:
Brief description of what the feature does.

ENDPOINTS:
- POST /path - Description
- GET /path - Description

DATABASE MODELS:
- NewModel

SERVICES:
- FeatureService

TESTS:
- test_feature_success
- test_feature_error

DEPENDENCIES:
- None or list of services
"""
```

---

## Performance Tips

1. **Use pagination** for list endpoints
   ```python
   @router.get("/list?limit=50&offset=0")
   ```

2. **Index frequently queried columns**
   ```python
   class Model(SQLModel, table=True):
       email: str = Field(index=True)
   ```

3. **Use async operations**
   ```python
   async def fetch_data():
       return await service.get_data()
   ```

4. **Batch operations when possible**
   ```python
   for item in items:
       session.add(item)
   session.commit()  # Single commit
   ```

---

## Release Checklist

- [ ] All tests passing
- [ ] No syntax errors
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Environment variables documented
- [ ] Database migrations run
- [ ] CORS configured correctly
- [ ] JWT secret changed for production
- [ ] SMTP credentials secured
- [ ] Database backups configured

---

## Useful Links

- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **SQLModel Docs:** https://sqlmodel.tiangolo.com/
- **Pydantic Docs:** https://docs.pydantic.dev/
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Python Docs:** https://docs.python.org/3/
- **JWT Docs:** https://tools.ietf.org/html/rfc7519

---

## Support

- **Issues:** GitHub Issues
- **Questions:** Open GitHub Discussion
- **Email:** support@teamtriptracker.com
- **Documentation:** See ARCHITECTURE.md, API_DOCUMENTATION.md, FEATURES_GUIDE.md

---

**Last Updated:** December 8, 2025  
**Version:** 1.0.0
