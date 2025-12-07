"""Tests for authentication endpoints."""
import pytest
from fastapi.testclient import TestClient


class TestAuthEndpoints:
    """Test suite for authentication endpoints."""

    def test_register_success(self, client: TestClient):
        """Test successful user registration."""
        response = client.post(
            "/auth/register",
            json={
                "email": "newuser@example.com",
                "name": "New User",
                "password": "testPassword123!",
                "auth_provider": "email"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_register_duplicate_email(self, client: TestClient):
        """Test registration fails with duplicate email."""
        email = "duplicate@example.com"
        # First registration
        client.post(
            "/auth/register",
            json={
                "email": email,
                "name": "Test User",
                "password": "testPassword123!",
                "auth_provider": "email"
            }
        )
        
        # Second registration with same email
        response = client.post(
            "/auth/register",
            json={
                "email": email,
                "name": "Another User",
                "password": "anotherPassword123!",
                "auth_provider": "email"
            }
        )
        assert response.status_code == 400

    def test_register_long_password(self, client: TestClient):
        """Test registration with very long password (>72 bytes)."""
        long_password = "a" * 100 + "!@#"
        response = client.post(
            "/auth/register",
            json={
                "email": "longpass@example.com",
                "name": "Long Pass User",
                "password": long_password,
                "auth_provider": "email"
            }
        )
        assert response.status_code == 200
        assert "access_token" in response.json()

    def test_get_current_user_no_token(self, client: TestClient):
        """Test getting current user without token."""
        response = client.get("/auth/me")
        assert response.status_code == 401

    def test_get_current_user_invalid_token(self, client: TestClient):
        """Test getting current user with invalid token."""
        response = client.get(
            "/auth/me",
            params={"token": "invalid_token"}
        )
        assert response.status_code == 401

