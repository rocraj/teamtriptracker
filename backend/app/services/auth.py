"""Authentication service for user management and token handling."""
import json
from uuid import uuid4
from datetime import datetime
from typing import Optional, Tuple
from sqlmodel import Session, select

from app.models.schemas import User, UserCreate, AuthProvider
from app.core.security import hash_password, verify_password, create_access_token


class AuthService:
    """Service for authentication operations."""
    
    @staticmethod
    def create_user(session: Session, user_data: UserCreate) -> User:
        """Create a new user."""
        # Check if user already exists
        existing = session.exec(
            select(User).where(User.email == user_data.email)
        ).first()
        
        if existing:
            raise ValueError(f"User with email {user_data.email} already exists")
        
        # Hash password if provided
        hashed_password = None
        if user_data.password:
            hashed_password = hash_password(user_data.password)
        
        user = User(
            id=uuid4(),
            email=user_data.email,
            name=user_data.name,
            photo_url=user_data.photo_url,
            auth_provider=user_data.auth_provider,
            hashed_password=hashed_password,
            created_at=datetime.utcnow()
        )
        
        session.add(user)
        session.commit()
        session.refresh(user)
        return user
    
    @staticmethod
    def get_user_by_email(session: Session, email: str) -> Optional[User]:
        """Get user by email address."""
        return session.exec(
            select(User).where(User.email == email)
        ).first()
    
    @staticmethod
    def get_user_by_id(session: Session, user_id: str) -> Optional[User]:
        """Get user by ID."""
        return session.exec(
            select(User).where(User.id == user_id)
        ).first()
    
    @staticmethod
    def authenticate_user(
        session: Session,
        email: str,
        password: str
    ) -> Optional[User]:
        """Authenticate user with email and password."""
        user = AuthService.get_user_by_email(session, email)
        
        if not user:
            return None
        
        if not user.hashed_password:
            return None
        
        if not verify_password(password, user.hashed_password):
            return None
        
        return user
    
    @staticmethod
    def create_or_update_google_user(
        session: Session,
        email: str,
        name: str,
        photo_url: Optional[str] = None
    ) -> User:
        """Create or update user from Google OAuth."""
        user = AuthService.get_user_by_email(session, email)
        
        if user:
            # Update existing user
            user.name = name
            if photo_url:
                user.photo_url = photo_url
            session.add(user)
        else:
            # Create new user
            user = User(
                id=uuid4(),
                email=email,
                name=name,
                photo_url=photo_url,
                auth_provider=AuthProvider.GOOGLE,
                created_at=datetime.utcnow()
            )
            session.add(user)
        
        session.commit()
        session.refresh(user)
        return user
    
    @staticmethod
    def generate_token(user_id: str) -> str:
        """Generate JWT token for user."""
        return create_access_token({"sub": str(user_id)})
