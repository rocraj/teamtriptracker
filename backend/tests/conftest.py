"""Shared pytest configuration and fixtures."""
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


@pytest.fixture(scope="session")
def test_db_setup():
    """Setup test database."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    return engine


@pytest.fixture(scope="function")
def db_session(test_db_setup):
    """Create a fresh database session for each test."""
    engine = test_db_setup
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session: Session):
    """Create a test client with test database."""
    def get_session_override():
        return db_session
    
    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    
    yield client
    
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def auth_token(client: TestClient):
    """Create a test user and return auth token."""
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


@pytest.fixture(scope="function")
def user_id(client: TestClient, auth_token: str):
    """Get the user ID for the test user."""
    response = client.get(
        "/auth/me",
        headers=get_auth_headers(auth_token)
    )
    return response.json()["id"]


@pytest.fixture(scope="function")
def team_id(client: TestClient, auth_token: str):
    """Create a test team and return its ID."""
    response = client.post(
        "/teams",
        json={"name": "Test Team"},
        headers=get_auth_headers(auth_token)
    )
    return response.json()["id"]
