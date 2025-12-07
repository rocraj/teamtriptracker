"""Tests for expense endpoints."""
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine
from sqlmodel.pool import StaticPool

from app.main import app
from app.core.database import get_session
from app.models.schemas import SQLModel


def get_auth_headers(token: str) -> dict:
    """Helper to create authorization headers."""
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(name="session")
def session_fixture():
    """Create a test database session."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    """Create a test client with test database."""
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture(name="auth_token")
def auth_token_fixture(client: TestClient):
    """Create and return an auth token for testing."""
    response = client.post(
        "/auth/register",
        json={
            "email": "testuser@example.com",
            "name": "Test User",
            "password": "testPassword123!",
            "auth_provider": "email"
        }
    )
    return response.json()["access_token"]


@pytest.fixture(name="team_id")
def team_id_fixture(client: TestClient, auth_token: str):
    """Create and return a team ID for testing."""
    response = client.post(
        "/teams",
        json={"name": "Test Team"},
        headers=get_auth_headers(auth_token)
    )
    return response.json()["id"]


@pytest.fixture(name="user_id")
def user_id_fixture(client: TestClient, auth_token: str):
    """Get user ID from token."""
    response = client.get(
        "/auth/me",
        headers=get_auth_headers(auth_token)
    )
    return response.json()["id"]


class TestExpenseEndpoints:
    """Test suite for expense endpoints."""

    def test_create_expense_success(
        self, client: TestClient, auth_token: str, team_id: str, user_id: str
    ):
        """Test successful expense creation."""
        response = client.post(
            "/expenses",
            json={
                "team_id": team_id,
                "total_amount": 100.0,
                "participants": [user_id],
                "type_label": "Dinner",
                "type_emoji": "🍽️",
                "note": "Team dinner"
            },
            headers=get_auth_headers(auth_token)
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_amount"] == 100.0
        assert data["type_label"] == "Dinner"
        assert data["type_emoji"] == "🍽️"

    def test_create_expense_no_token(self, client: TestClient, team_id: str, user_id: str):
        """Test expense creation fails without token."""
        response = client.post(
            "/expenses",
            json={
                "team_id": team_id,
                "total_amount": 100.0,
                "participants": [user_id],
                "type_label": "Dinner",
                "type_emoji": "🍽️"
            }
        )
        assert response.status_code == 401

    def test_create_expense_not_member(self, client: TestClient):
        """Test expense creation fails if user is not team member."""
        # Create user 1 and team
        token1 = client.post(
            "/auth/register",
            json={
                "email": "user1@example.com",
                "name": "User 1",
                "password": "pass123!",
                "auth_provider": "email"
            }
        ).json()["access_token"]
        
        team_response = client.post(
            "/teams",
            json={"name": "User1 Team"},
            headers=get_auth_headers(token1)
        )
        team_id = team_response.json()["id"]
        
        # Create user 2
        token2 = client.post(
            "/auth/register",
            json={
                "email": "user2@example.com",
                "name": "User 2",
                "password": "pass123!",
                "auth_provider": "email"
            }
        ).json()["access_token"]
        
        user2_response = client.get(
            "/auth/me",
            headers=get_auth_headers(token2)
        )
        user2_id = user2_response.json()["id"]
        
        # User 2 tries to create expense in User 1's team
        response = client.post(
            "/expenses",
            json={
                "team_id": team_id,
                "total_amount": 100.0,
                "participants": [user2_id],
                "type_label": "Expense",
                "type_emoji": "💰"
            },
            headers=get_auth_headers(token2)
        )
        assert response.status_code == 403

    def test_list_team_expenses(
        self, client: TestClient, auth_token: str, team_id: str, user_id: str
    ):
        """Test listing team expenses."""
        # Create expenses
        client.post(
            "/expenses",
            json={
                "team_id": team_id,
                "total_amount": 50.0,
                "participants": [user_id],
                "type_label": "Lunch",
                "type_emoji": "🍔"
            },
            headers=get_auth_headers(auth_token)
        )
        
        client.post(
            "/expenses",
            json={
                "team_id": team_id,
                "total_amount": 75.0,
                "participants": [user_id],
                "type_label": "Dinner",
                "type_emoji": "🍽️"
            },
            headers=get_auth_headers(auth_token)
        )
        
        # List expenses
        response = client.get(
            f"/expenses/{team_id}",
            headers=get_auth_headers(auth_token)
        )
        assert response.status_code == 200
        expenses = response.json()
        assert len(expenses) == 2

    def test_list_team_expenses_empty(self, client: TestClient, auth_token: str, team_id: str):
        """Test listing team with no expenses."""
        response = client.get(
            f"/expenses/{team_id}",
            headers=get_auth_headers(auth_token)
        )
        assert response.status_code == 200
        expenses = response.json()
        assert len(expenses) == 0

    def test_get_expense(
        self, client: TestClient, auth_token: str, team_id: str, user_id: str
    ):
        """Test getting single expense."""
        # Create expense
        create_response = client.post(
            "/expenses",
            json={
                "team_id": team_id,
                "total_amount": 100.0,
                "participants": [user_id],
                "type_label": "Test",
                "type_emoji": "💰"
            },
            headers=get_auth_headers(auth_token)
        )
        expense_id = create_response.json()["id"]
        
        # Get expense
        response = client.get(
            f"/expenses/{team_id}/{expense_id}",
            headers=get_auth_headers(auth_token)
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_amount"] == 100.0

    def test_delete_expense_success(
        self, client: TestClient, auth_token: str, team_id: str, user_id: str
    ):
        """Test successful expense deletion."""
        # Create expense
        create_response = client.post(
            "/expenses",
            json={
                "team_id": team_id,
                "total_amount": 100.0,
                "participants": [user_id],
                "type_label": "Delete Test",
                "type_emoji": "🗑️"
            },
            headers=get_auth_headers(auth_token)
        )
        expense_id = create_response.json()["id"]
        
        # Delete expense
        response = client.delete(
            f"/expenses/{expense_id}",
            headers=get_auth_headers(auth_token)
        )
        assert response.status_code == 200
        assert "deleted" in response.json()["message"]

    def test_delete_expense_not_owner(self, client: TestClient):
        """Test expense deletion fails if user is not owner."""
        # User 1 creates expense
        token1 = client.post(
            "/auth/register",
            json={
                "email": "user1@example.com",
                "name": "User 1",
                "password": "pass123!",
                "auth_provider": "email"
            }
        ).json()["access_token"]
        
        user1_response = client.get(
            "/auth/me",
            headers=get_auth_headers(token1)
        )
        user1_id = user1_response.json()["id"]
        
        team_response = client.post(
            "/teams",
            json={"name": "Team"},
            headers=get_auth_headers(token1)
        )
        team_id = team_response.json()["id"]
        
        expense_response = client.post(
            "/expenses",
            json={
                "team_id": team_id,
                "total_amount": 100.0,
                "participants": [user1_id],
                "type_label": "Expense",
                "type_emoji": "💰"
            },
            headers=get_auth_headers(token1)
        )
        expense_id = expense_response.json()["id"]
        
        # User 2 tries to delete
        token2 = client.post(
            "/auth/register",
            json={
                "email": "user2@example.com",
                "name": "User 2",
                "password": "pass123!",
                "auth_provider": "email"
            }
        ).json()["access_token"]
        
        # Invite user 2 to team
        client.post(
            f"/teams/{team_id}/invite",
            params={
                "token": token1,
                "email": "user2@example.com"
            }
        )
        
        # User 2 tries to delete
        response = client.delete(
            f"/expenses/{expense_id}",
            headers=get_auth_headers(token2)
        )
        assert response.status_code == 403
