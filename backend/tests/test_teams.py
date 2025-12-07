"""Tests for team endpoints."""
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine
from sqlmodel.pool import StaticPool
from uuid import UUID

from app.main import app
from app.core.database import get_session
from app.models.schemas import SQLModel
from app.services.auth import AuthService


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


class TestTeamEndpoints:
    """Test suite for team endpoints."""

    def test_create_team_success(self, client: TestClient, auth_token: str):
        """Test successful team creation."""
        response = client.post(
            "/teams",
            json={"name": "Test Team"},
            headers=get_auth_headers(auth_token)
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Team"
        assert "id" in data

    def test_create_team_no_token(self, client: TestClient):
        """Test team creation fails without token."""
        response = client.post(
            "/teams",
            json={"name": "Test Team"}
        )
        assert response.status_code == 401

    def test_list_user_teams(self, client: TestClient, auth_token: str):
        """Test listing user's teams."""
        # Create a team
        client.post(
            "/teams",
            json={"name": "Team 1"},
            headers=get_auth_headers(auth_token)
        )
        client.post(
            "/teams",
            json={"name": "Team 2"},
            headers=get_auth_headers(auth_token)
        )
        
        # List teams
        response = client.get(
            "/teams",
            headers=get_auth_headers(auth_token)
        )
        assert response.status_code == 200
        teams = response.json()
        assert len(teams) == 2
        assert teams[0]["name"] in ["Team 1", "Team 2"]

    def test_list_user_teams_empty(self, client: TestClient, auth_token: str):
        """Test listing teams when user has none."""
        response = client.get(
            "/teams",
            headers=get_auth_headers(auth_token)
        )
        assert response.status_code == 200
        teams = response.json()
        assert len(teams) == 0

    def test_get_team_success(self, client: TestClient, auth_token: str):
        """Test getting team details."""
        # Create team
        create_response = client.post(
            "/teams",
            json={"name": "Test Team"},
            headers=get_auth_headers(auth_token)
        )
        team_id = create_response.json()["id"]
        
        # Get team
        response = client.get(
            f"/teams/{team_id}",
            headers=get_auth_headers(auth_token)
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Team"
        assert str(data["id"]) == team_id

    def test_get_team_not_member(self, client: TestClient):
        """Test getting team fails if user is not a member."""
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
        
        # User 2 tries to get team
        response = client.get(
            f"/teams/{team_id}",
            headers=get_auth_headers(token2)
        )
        assert response.status_code == 403

    def test_invite_member_success(self, client: TestClient, auth_token: str):
        """Test inviting a member to team."""
        # Create team
        team_response = client.post(
            "/teams",
            json={"name": "Test Team"},
            headers=get_auth_headers(auth_token)
        )
        team_id = team_response.json()["id"]
        
        # Create another user
        client.post(
            "/auth/register",
            json={
                "email": "invite@example.com",
                "name": "Invite User",
                "password": "invitePass123!",
                "auth_provider": "email"
            }
        )
        
        # Invite user
        response = client.post(
            f"/teams/{team_id}/invite",
            params={"email": "invite@example.com"},
            headers=get_auth_headers(auth_token)
        )
        assert response.status_code == 200
        assert "added to the team" in response.json()["message"]

    def test_invite_member_nonexistent(self, client: TestClient, auth_token: str):
        """Test inviting non-existent user."""
        # Create team
        team_response = client.post(
            "/teams",
            json={"name": "Test Team"},
            headers=get_auth_headers(auth_token)
        )
        team_id = team_response.json()["id"]
        
        # Invite non-existent user
        response = client.post(
            f"/teams/{team_id}/invite",
            params={"email": "nonexistent@example.com"},
            headers=get_auth_headers(auth_token)
        )
        assert response.status_code == 404

    def test_set_member_budget(self, client: TestClient, auth_token: str):
        """Test setting member budget."""
        # Create team
        team_response = client.post(
            "/teams",
            json={"name": "Test Team"},
            headers=get_auth_headers(auth_token)
        )
        team_id = team_response.json()["id"]
        
        # Get user ID from token (register to get ID)
        user_response = client.get(
            "/auth/me",
            headers=get_auth_headers(auth_token)
        )
        user_id = user_response.json()["id"]
        
        # Set budget
        response = client.post(
            f"/teams/{team_id}/budget",
            json={
                "user_id": user_id,
                "budget_amount": 1000.0
            },
            headers=get_auth_headers(auth_token)
        )
        assert response.status_code == 200
        data = response.json()
        assert data["initial_budget"] == 1000.0

    def test_get_team_members(self, client: TestClient, auth_token: str):
        """Test getting team members."""
        # Create team
        team_response = client.post(
            "/teams",
            json={"name": "Test Team"},
            headers=get_auth_headers(auth_token)
        )
        team_id = team_response.json()["id"]
        
        # Get members
        response = client.get(
            f"/teams/{team_id}/members",
            headers=get_auth_headers(auth_token)
        )
        assert response.status_code == 200
        members = response.json()
        assert len(members) >= 1  # At least the creator
