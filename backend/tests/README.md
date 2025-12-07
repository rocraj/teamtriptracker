# Backend API Tests

Comprehensive pytest test suite for all TeamSplit API endpoints.

## Test Coverage

### Authentication Tests (`test_auth.py`)
- ✅ User registration (normal and duplicate email)
- ✅ Long password handling (>72 bytes)
- ✅ User login (success and invalid credentials)
- ✅ Google OAuth sign-in
- ✅ Magic link request and verification
- ✅ Get current user information

### Team Tests (`test_teams.py`)
- ✅ Create team
- ✅ List user teams
- ✅ Get team details
- ✅ Access control (non-members cannot access)
- ✅ Invite team members
- ✅ Set member budgets
- ✅ Get team members list

### Expense Tests (`test_expenses.py`)
- ✅ Create expense
- ✅ List team expenses
- ✅ Get individual expense
- ✅ Delete expense (owner only)
- ✅ Access control for expense operations
- ✅ Multi-participant expense tracking

### Summary Tests (`test_summary.py`)
- ✅ Calculate team member balances
- ✅ Generate settlement plans
- ✅ Suggest next payer
- ✅ Validate balance consistency (sum to zero)
- ✅ Access control for summary endpoints

## Running Tests

### Run all tests
```bash
cd backend
./venv/bin/pytest tests/ -v
```

### Run specific test file
```bash
./venv/bin/pytest tests/test_auth.py -v
```

### Run specific test class
```bash
./venv/bin/pytest tests/test_auth.py::TestAuthEndpoints -v
```

### Run specific test
```bash
./venv/bin/pytest tests/test_auth.py::TestAuthEndpoints::test_register_success -v
```

### Run with coverage
```bash
./venv/bin/pytest tests/ --cov=app --cov-report=html
```

### Run with output capture disabled (see print statements)
```bash
./venv/bin/pytest tests/ -v -s
```

## Test Database

Tests use an in-memory SQLite database that is created fresh for each test. This ensures:
- Tests don't interfere with each other
- No external database required
- Fast test execution
- Clean state for each test

## Fixtures

Common fixtures available across tests:

- `client` - FastAPI TestClient with test database
- `db_session` - Database session for test
- `auth_token` - JWT token for authenticated test user
- `user_id` - ID of test user
- `team_id` - ID of test team
- `setup_team_with_expenses` - Pre-configured team with multiple users and expenses

## Key Test Scenarios

### Authentication Flow
1. Register new user → Get token
2. Login existing user → Get token
3. Use token to access protected endpoints

### Team Management Flow
1. Create team (user becomes member)
2. Invite other users to team
3. Set budgets for team members
4. View team member list

### Expense Tracking Flow
1. Create expense with multiple participants
2. List expenses for team
3. Delete expense (owner only)
4. View individual expense details

### Settlement Calculation Flow
1. Create multiple expenses with different payers
2. Calculate balances for all members
3. Generate optimal settlement plan
4. Suggest next payer based on balances

## Notes

- Passwords longer than 72 bytes are truncated during hashing (bcrypt limitation)
- Balances should sum to zero (validated in tests)
- Access control is enforced: users can only access teams/expenses they're members of
- All endpoints return proper error codes (400, 401, 403, 404, etc.)
