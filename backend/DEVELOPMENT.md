# TeamTripTracker Development Guide

**Version:** 1.0.0  
**Last Updated:** December 8, 2025

---

## Table of Contents

1. [Code Style Guide](#code-style-guide)
2. [Adding New Features](#adding-new-features)
3. [Database Migrations](#database-migrations)
4. [Testing New Features](#testing-new-features)
5. [Debugging Guide](#debugging-guide)
6. [Common Development Tasks](#common-development-tasks)

---

## Code Style Guide

### Python Style

Follow **PEP 8** with the following project-specific conventions:

#### Imports
```python
# Standard library imports first
import os
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict

# Third-party imports next
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

# Local imports last
from app.core.security import get_current_user
from app.services.team import TeamService
from app.models.schemas import Team
```

#### Type Hints (Always use)
```python
# ✅ Good
async def create_team(
    team_in: TeamCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
) -> Team:
    """Create a new team.
    
    Args:
        team_in: Team creation data
        current_user: Current authenticated user
        session: Database session
        
    Returns:
        Created team object
    """
    pass

# ❌ Bad
async def create_team(team_in, current_user, session):
    pass
```

#### Docstrings
```python
# ✅ Good - Google style docstrings
def calculate_settlement(balances: Dict[str, float]) -> List[Dict]:
    """Calculate optimal settlement plan from balances.
    
    Minimizes number of transactions needed to settle all debts.
    
    Args:
        balances: Dict mapping user_id to balance amount
        
    Returns:
        List of settlement transactions with from_user, to_user, amount
        
    Raises:
        ValueError: If balances don't sum to zero
    """
    pass

# ❌ Bad - Missing information
def calculate_settlement(balances):
    # Calculate settlement
    pass
```

#### Variable Naming
```python
# ✅ Good
user_id = "550e8400-e29b-41d4-a716-446655440000"
total_amount = 150.00
team_members = [...]
is_used = False

# ❌ Bad
uid = "550e8400-e29b-41d4-a716-446655440000"
amt = 150.00
members = [...]
used = False
```

#### Function Naming
```python
# ✅ Good
def get_user_teams(user_id: str) -> List[Team]:
    pass

def create_expense(expense_data: ExpenseCreate) -> Expense:
    pass

def is_user_team_member(user_id: str, team_id: str) -> bool:
    pass

# ❌ Bad
def getUserTeams(user_id):
    pass

def make_expense(data):
    pass

def check_membership(u_id, t_id):
    pass
```

#### Error Handling
```python
# ✅ Good
try:
    user = session.exec(select(User).where(User.id == user_id)).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"User with id {user_id} not found"
        )
    return user
except Exception as e:
    logger.error(f"Error fetching user: {e}")
    raise HTTPException(status_code=500, detail="Internal server error")

# ❌ Bad
try:
    user = session.exec(select(User).where(User.id == user_id)).first()
except:
    pass
return None
```

#### Async/Await
```python
# ✅ Good - Use async for I/O operations
async def send_invitation_email(email: str, token: str) -> bool:
    """Send invitation email asynchronously."""
    pass

async def get_team_with_members(team_id: str, session: Session):
    """Fetch team with members."""
    pass

# ❌ Bad - Don't use async unnecessarily
async def format_team_name(name: str) -> str:
    """This doesn't need async."""
    return name.upper()
```

---

## Adding New Features

### Step-by-Step Guide for Adding a New Endpoint

#### Step 1: Define Database Models (if needed)

**Location:** `app/models/schemas.py`

```python
from sqlmodel import SQLModel, Field, Column, JSON
from typing import List, Optional
from datetime import datetime
import uuid

# Database model (with SQLModel table=True)
class Receipt(SQLModel, table=True):
    """Receipt attached to an expense."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    expense_id: uuid.UUID = Field(foreign_key="expense.id")
    file_url: str
    file_size: int  # in bytes
    mime_type: str  # e.g., "image/jpeg"
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)


# Request schema (Pydantic for validation)
class ReceiptCreate(SQLModel):
    """Request body for creating receipt."""
    file_url: str
    file_size: int
    mime_type: str


# Response schema
class ReceiptRead(SQLModel):
    """Response body for receipt."""
    id: uuid.UUID
    expense_id: uuid.UUID
    file_url: str
    file_size: int
    mime_type: str
    uploaded_at: datetime
```

#### Step 2: Create Service Layer

**Location:** `app/services/receipt.py`

```python
from typing import List, Optional
from uuid import UUID
from sqlmodel import Session, select
from app.models.schemas import Receipt, ReceiptCreate
from fastapi import HTTPException

class ReceiptService:
    """Service for managing receipts."""
    
    @staticmethod
    async def create_receipt(
        session: Session,
        expense_id: UUID,
        receipt_in: ReceiptCreate
    ) -> Receipt:
        """Create new receipt for expense.
        
        Args:
            session: Database session
            expense_id: Expense to attach receipt to
            receipt_in: Receipt creation data
            
        Returns:
            Created receipt
            
        Raises:
            HTTPException: If expense not found
        """
        # Verify expense exists
        from app.services.expense import ExpenseService
        expense = await ExpenseService.get_expense(session, expense_id)
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
        
        # Create receipt
        receipt = Receipt(
            expense_id=expense_id,
            **receipt_in.dict()
        )
        session.add(receipt)
        session.commit()
        session.refresh(receipt)
        return receipt
    
    @staticmethod
    async def get_receipts(
        session: Session,
        expense_id: UUID
    ) -> List[Receipt]:
        """Get all receipts for expense."""
        statement = select(Receipt).where(Receipt.expense_id == expense_id)
        return session.exec(statement).all()
    
    @staticmethod
    async def delete_receipt(
        session: Session,
        receipt_id: UUID
    ) -> None:
        """Delete receipt."""
        receipt = session.exec(
            select(Receipt).where(Receipt.id == receipt_id)
        ).first()
        if not receipt:
            raise HTTPException(status_code=404, detail="Receipt not found")
        session.delete(receipt)
        session.commit()
```

#### Step 3: Create API Endpoint

**Location:** `app/api/expenses.py` (add to existing file)

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from uuid import UUID
from app.core.database import get_session
from app.core.security import get_current_user
from app.services.receipt import ReceiptService
from app.models.schemas import ReceiptCreate, ReceiptRead, User

# Add to existing router
@router.post("/{expense_id}/receipts", response_model=ReceiptRead)
async def add_receipt(
    expense_id: UUID,
    receipt_in: ReceiptCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Add receipt to expense.
    
    Args:
        expense_id: Expense ID
        receipt_in: Receipt data
        current_user: Current authenticated user
        session: Database session
        
    Returns:
        Created receipt
    """
    # Verify user is expense payer or team admin
    from app.services.expense import ExpenseService
    expense = await ExpenseService.get_expense(session, expense_id)
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    if expense.payer_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only expense payer can add receipts"
        )
    
    # Create receipt
    return await ReceiptService.create_receipt(
        session,
        expense_id,
        receipt_in
    )


@router.get("/{expense_id}/receipts", response_model=List[ReceiptRead])
async def get_receipts(
    expense_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get receipts for expense."""
    return await ReceiptService.get_receipts(session, expense_id)


@router.delete("/receipts/{receipt_id}")
async def delete_receipt(
    receipt_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Delete receipt."""
    await ReceiptService.delete_receipt(session, receipt_id)
    return {"message": "Receipt deleted"}
```

#### Step 4: Write Tests

**Location:** `tests/test_receipts.py` (new file)

```python
import pytest
from httpx import AsyncClient
from app.main import app
from tests.conftest import create_test_user, create_test_team, create_test_expense


@pytest.mark.asyncio
async def test_add_receipt_success():
    """Test adding receipt to expense."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Setup
        user = await create_test_user()
        team = await create_test_team(user.id)
        expense = await create_test_expense(team.id, user.id)
        
        token = "test_token"  # Get from login
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test
        response = await client.post(
            f"/expenses/{expense.id}/receipts",
            headers=headers,
            json={
                "file_url": "https://storage.example.com/receipt.jpg",
                "file_size": 1024000,
                "mime_type": "image/jpeg"
            }
        )
        
        # Verify
        assert response.status_code == 200
        data = response.json()
        assert data["file_url"] == "https://storage.example.com/receipt.jpg"
        assert data["expense_id"] == str(expense.id)


@pytest.mark.asyncio
async def test_add_receipt_unauthorized():
    """Test that only payer can add receipts."""
    # Test code here
    pass
```

#### Step 5: Update Documentation

Update `API_DOCUMENTATION.md` and `FEATURES_GUIDE.md` with:
- New endpoint description
- Request/response examples
- When to use
- Error scenarios

---

## Database Migrations

### Adding New Tables/Columns

#### Using SQLModel + Alembic (Recommended)

```bash
# Install alembic if needed
pip install alembic

# Initialize alembic (one time)
alembic init migrations

# Create migration
alembic revision --autogenerate -m "Add receipts table"

# Review migration file in migrations/versions/
# Edit if needed

# Run migration
alembic upgrade head
```

#### Manual Setup (if not using migrations)

```python
# In app/core/database.py
from sqlmodel import create_all, SQLModel
from app.models.schemas import *  # Import all models

def init_db():
    """Initialize database tables."""
    SQLModel.metadata.create_all(engine)
    print("Database initialized")

# Run once
if __name__ == "__main__":
    init_db()
```

---

## Testing New Features

### Test Structure

```python
import pytest
from httpx import AsyncClient
from sqlmodel import Session
from app.main import app
from app.core.database import get_session


class TestNewFeature:
    """Test suite for new feature."""
    
    @pytest.mark.asyncio
    async def test_happy_path(self):
        """Test successful scenario."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Setup
            # Execute
            # Assert
            pass
    
    @pytest.mark.asyncio
    async def test_error_scenario(self):
        """Test error handling."""
        pass
    
    @pytest.mark.asyncio
    async def test_edge_case(self):
        """Test edge cases."""
        pass


# Run tests
# pytest tests/test_new_feature.py -v
# pytest tests/test_new_feature.py::TestNewFeature::test_happy_path -v
```

### Test Fixtures

```python
# In conftest.py
@pytest.fixture
async def test_user(session: Session):
    """Create test user."""
    user = User(
        email="test@example.com",
        name="Test User",
        hashed_password="hashed_password"
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture
async def test_team(session: Session, test_user: User):
    """Create test team."""
    team = Team(
        name="Test Team",
        created_by=test_user.id
    )
    session.add(team)
    session.commit()
    session.refresh(team)
    return team
```

---

## Debugging Guide

### Print Debugging
```python
import logging

logger = logging.getLogger(__name__)

# Log at different levels
logger.debug(f"Debug: {variable}")
logger.info(f"Info: {variable}")
logger.warning(f"Warning: {variable}")
logger.error(f"Error: {variable}")

# In production config
logging.basicConfig(level=logging.INFO)
```

### Database Debugging
```python
# Print SQL queries
from sqlalchemy import event
from sqlalchemy.engine import Engine

@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    print(f"SQL: {statement}")
    print(f"PARAMS: {parameters}")
```

### FastAPI Debugging
```python
# Add debug mode
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        reload=True,
        debug=True,
        log_level="debug"
    )
```

### VS Code Debugging
```json
// .vscode/launch.json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "FastAPI",
            "type": "python",
            "request": "launch",
            "module": "uvicorn",
            "args": [
                "app.main:app",
                "--reload",
                "--host", "0.0.0.0",
                "--port", "8000"
            ],
            "jinja": true,
            "justMyCode": true
        }
    ]
}
```

---

## Common Development Tasks

### 1. Add New Authentication Provider

**File:** `app/services/auth.py`

```python
async def authenticate_with_oauth_provider(
    provider: str,
    access_token: str
) -> User:
    """Authenticate with OAuth provider.
    
    Args:
        provider: Provider name (google, github, etc.)
        access_token: OAuth access token
        
    Returns:
        User object
    """
    if provider == "github":
        # Implement GitHub OAuth
        pass
    elif provider == "microsoft":
        # Implement Microsoft OAuth
        pass
```

### 2. Add New Expense Category

**File:** `app/models/schemas.py`

```python
from enum import Enum

class ExpenseCategory(str, Enum):
    """Expense categories."""
    FOOD = "food"
    TRANSPORT = "transport"
    ACCOMMODATION = "accommodation"
    ENTERTAINMENT = "entertainment"
    SHOPPING = "shopping"
    UTILITIES = "utilities"
    OTHER = "other"


class Expense(SQLModel, table=True):
    # ... existing fields
    category: ExpenseCategory = Field(default=ExpenseCategory.OTHER)
```

### 3. Add Recurring Expense Feature

**Database Model:**
```python
class RecurringExpense(SQLModel, table=True):
    """Recurring expense template."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    team_id: uuid.UUID = Field(foreign_key="team.id")
    name: str
    amount: float
    participants: str  # JSON array
    frequency: str  # daily, weekly, monthly
    next_occurrence: datetime
    is_active: bool = True
```

**Service:**
```python
async def create_recurring_expense(
    session: Session,
    team_id: UUID,
    recurring_in: RecurringExpenseCreate
) -> RecurringExpense:
    """Create recurring expense."""
    recurring = RecurringExpense(
        team_id=team_id,
        **recurring_in.dict()
    )
    session.add(recurring)
    session.commit()
    session.refresh(recurring)
    return recurring


async def process_recurring_expenses():
    """Process due recurring expenses (run via scheduler)."""
    # Find due recurring expenses
    # Create actual expenses
    # Update next_occurrence
    pass
```

### 4. Add Multi-Currency Support

**Database Model:**
```python
from enum import Enum

class Currency(str, Enum):
    """Supported currencies."""
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"
    INR = "INR"


class Expense(SQLModel, table=True):
    # ... existing fields
    currency: Currency = Field(default=Currency.USD)
    exchange_rate: float = Field(default=1.0)  # Rate at time of creation
```

**Service:**
```python
async def get_expense_in_base_currency(
    session: Session,
    expense: Expense,
    base_currency: Currency = Currency.USD
) -> float:
    """Convert expense to base currency."""
    if expense.currency == base_currency:
        return expense.total_amount
    
    # Fetch exchange rate
    rate = await fetch_exchange_rate(
        expense.currency,
        base_currency,
        expense.created_at
    )
    return expense.total_amount * rate
```

### 5. Add Expense Filtering

**API Endpoint:**
```python
@router.get("/expenses/{team_id}")
async def list_expenses(
    team_id: UUID,
    category: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    payer_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """List team expenses with filters."""
    query = select(Expense).where(Expense.team_id == team_id)
    
    if category:
        query = query.where(Expense.type_label == category)
    
    if start_date:
        query = query.where(Expense.created_at >= start_date)
    
    if end_date:
        query = query.where(Expense.created_at <= end_date)
    
    if payer_id:
        query = query.where(Expense.payer_id == payer_id)
    
    return session.exec(query).all()
```

---

## Performance Considerations

### Query Optimization
```python
# ❌ Bad - N+1 query problem
expenses = session.exec(select(Expense)).all()
for expense in expenses:
    print(expense.team.name)  # Separate query for each expense

# ✅ Good - Single query with eager loading
from sqlalchemy.orm import selectinload
expenses = session.exec(
    select(Expense).options(selectinload(Expense.team))
).all()
```

### Caching
```python
from functools import lru_cache

@lru_cache(maxsize=128)
def get_user_by_email(email: str) -> Optional[User]:
    """Get user by email with caching."""
    # Implementation
    pass
```

### Async Best Practices
```python
# ✅ Good - Awaiting concurrent operations
import asyncio

results = await asyncio.gather(
    send_email_1(),
    send_email_2(),
    send_email_3()
)

# ❌ Bad - Sequential operations
await send_email_1()
await send_email_2()
await send_email_3()
```

---

## Common Patterns

### Service Dependency Pattern
```python
class TeamService:
    """Team service with dependencies."""
    
    def __init__(
        self,
        expense_service: ExpenseService,
        settlement_service: SettlementService
    ):
        self.expense_service = expense_service
        self.settlement_service = settlement_service
    
    async def get_team_summary(self, team_id: UUID):
        """Get team summary with related data."""
        expenses = await self.expense_service.get_team_expenses(team_id)
        settlements = await self.settlement_service.calculate_settlements(team_id)
        return {
            "expenses": expenses,
            "settlements": settlements
        }
```

### Error Handling Pattern
```python
from enum import Enum

class ErrorCode(str, Enum):
    """Error codes for consistent error responses."""
    USER_NOT_FOUND = "USER_NOT_FOUND"
    TEAM_NOT_FOUND = "TEAM_NOT_FOUND"
    UNAUTHORIZED = "UNAUTHORIZED"
    INVALID_INPUT = "INVALID_INPUT"


class APIException(Exception):
    """Custom API exception."""
    
    def __init__(self, code: ErrorCode, message: str, status_code: int):
        self.code = code
        self.message = message
        self.status_code = status_code


@app.exception_handler(APIException)
async def api_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_code": exc.code,
            "message": exc.message
        }
    )
```

---

**Last Updated:** December 8, 2025  
**Maintained By:** TeamTripTracker Team
