"""Tests for summary endpoints."""
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


@pytest.fixture(name="setup_team_with_expenses")
def setup_team_with_expenses_fixture(client: TestClient):
    """Setup a team with multiple users and expenses."""
    # Create user 1
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
    
    # Create team
    team_response = client.post(
        "/teams",
        json={"name": "Test Team"},
        headers=get_auth_headers(token1)
    )
    team_id = team_response.json()["id"]
    
    # Add user 2 to team
    client.post(
        f"/teams/{team_id}/members",
        json={"user_id": user2_id},
        headers=get_auth_headers(token1)
    )
    
    # Create expenses
    # User 1 pays $300 for 2 people ($150 each)
    client.post(
        "/expenses",
        json={
            "team_id": team_id,
            "total_amount": 300.0,
            "participants": [user1_id, user2_id],
            "type_label": "Dinner",
            "type_emoji": "🍽️"
        },
        headers=get_auth_headers(token1)
    )
    
    # User 2 pays $100 for 2 people ($50 each)
    client.post(
        "/expenses",
        json={
            "team_id": team_id,
            "total_amount": 100.0,
            "participants": [user1_id, user2_id],
            "type_label": "Lunch",
            "type_emoji": "🍔"
        },
        headers=get_auth_headers(token2)
    )
    
    return {
        "team_id": team_id,
        "token1": token1,
        "token2": token2,
        "user1_id": user1_id,
        "user2_id": user2_id,
        "client": client
    }


class TestSummaryEndpoints:
    """Test suite for summary endpoints."""

    def test_get_team_balances(self, setup_team_with_expenses):
        """Test getting team member balances."""
        data = setup_team_with_expenses
        response = data["client"].get(
            f"/summary/{data['team_id']}/balances",
            headers=get_auth_headers(data["token1"])
        )
        assert response.status_code == 200
        result = response.json()
        assert "balances" in result
        assert data["team_id"] == result["team_id"]
        
        # Check balances
        # User 1 paid 300 + 50 = 350, owes 150 + 50 = 200, balance = +150
        # User 2 paid 100 + 0 = 100, owes 150 + 50 = 200, balance = -100
        balances = result["balances"]
        user1_balance = balances.get(data["user1_id"], 0)
        user2_balance = balances.get(data["user2_id"], 0)
        
        assert user1_balance > 0  # User 1 is owed money
        assert user2_balance < 0  # User 2 owes money

    def test_get_team_balances_no_token(self, setup_team_with_expenses):
        """Test getting balances without token."""
        data = setup_team_with_expenses
        response = data["client"].get(
            f"/summary/{data['team_id']}/balances"
        )
        assert response.status_code == 401

    def test_get_team_balances_not_member(self, client: TestClient):
        """Test getting balances fails if user is not member."""
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
            json={"name": "Team"},
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
        
        # User 2 tries to get balances
        response = client.get(
            f"/summary/{team_id}/balances",
            headers=get_auth_headers(token2)
        )
        assert response.status_code == 403

    def test_get_settlement_plan(self, setup_team_with_expenses):
        """Test getting settlement plan."""
        data = setup_team_with_expenses
        response = data["client"].get(
            f"/summary/{data['team_id']}/settlements",
            headers=get_auth_headers(data["token1"])
        )
        assert response.status_code == 200
        result = response.json()
        assert "settlements" in result
        assert "total_transactions" in result
        
        # Should have at least one settlement
        settlements = result["settlements"]
        assert len(settlements) > 0
        
        # Each settlement should have from_user, to_user, and amount
        for settlement in settlements:
            assert "from_user" in settlement
            assert "to_user" in settlement
            assert "amount" in settlement
            assert settlement["amount"] > 0

    def test_get_settlement_plan_no_expenses(self, client: TestClient):
        """Test settlement plan for team with no expenses."""
        # Create user and team
        token = client.post(
            "/auth/register",
            json={
                "email": "user@example.com",
                "name": "User",
                "password": "pass123!",
                "auth_provider": "email"
            }
        ).json()["access_token"]
        
        team_response = client.post(
            "/teams",
            json={"name": "Team"},
            headers=get_auth_headers(token)
        )
        team_id = team_response.json()["id"]
        
        # Get settlements
        response = client.get(
            f"/summary/{team_id}/settlements",
            headers=get_auth_headers(token)
        )
        assert response.status_code == 200
        result = response.json()
        assert result["total_transactions"] == 0

    def test_get_next_payer(self, setup_team_with_expenses):
        """Test getting suggestion for next payer."""
        data = setup_team_with_expenses
        response = data["client"].get(
            f"/summary/{data['team_id']}/next-payer",
            headers=get_auth_headers(data["token1"])
        )
        assert response.status_code == 200
        result = response.json()
        assert "next_payer_id" in result
        assert "suggested_amount" in result
        assert "team_id" in result
        assert result["team_id"] == data["team_id"]

    def test_get_next_payer_no_token(self, setup_team_with_expenses):
        """Test getting next payer without token."""
        data = setup_team_with_expenses
        response = data["client"].get(
            f"/summary/{data['team_id']}/next-payer"
        )
        assert response.status_code == 401

    def test_balances_sum_to_zero(self, setup_team_with_expenses):
        """Test that all balances sum to approximately zero."""
        data = setup_team_with_expenses
        response = data["client"].get(
            f"/summary/{data['team_id']}/balances",
            headers=get_auth_headers(data["token1"])
        )
        result = response.json()
        balances = result["balances"]
        
        # Sum of all balances should be ~0 (with floating point tolerance)
        total = sum(balances.values())
        assert abs(total) < 0.01
