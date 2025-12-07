from uuid import UUID
from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Column, String
from enum import Enum
import json
from pydantic import field_validator


class AuthProvider(str, Enum):
    """Authentication provider types."""
    GOOGLE = "google"
    EMAIL = "email"


class User(SQLModel, table=True):
    """User model representing an application user."""
    
    id: Optional[UUID] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    name: str
    photo_url: Optional[str] = None
    auth_provider: AuthProvider
    hashed_password: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    modified_at: datetime = Field(default_factory=datetime.utcnow)


class Team(SQLModel, table=True):
    """Team model for grouping users and expenses."""
    
    id: Optional[UUID] = Field(default=None, primary_key=True)
    name: str
    trip_budget: Optional[float] = Field(default=None)
    created_by: UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    modified_at: datetime = Field(default_factory=datetime.utcnow)


class TeamMember(SQLModel, table=True):
    """Team member association with budget tracking."""
    
    id: Optional[UUID] = Field(default=None, primary_key=True)
    team_id: UUID = Field(foreign_key="team.id")
    user_id: UUID = Field(foreign_key="user.id")
    initial_budget: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    modified_at: datetime = Field(default_factory=datetime.utcnow)


class Expense(SQLModel, table=True):
    """Expense model for tracking payments."""
    
    id: Optional[UUID] = Field(default=None, primary_key=True)
    team_id: UUID = Field(foreign_key="team.id")
    payer_id: UUID = Field(foreign_key="user.id")
    total_amount: float
    participants: str = Field(default="[]")  # JSON string of UUIDs
    type_label: str = "Other"
    type_emoji: str = "💰"
    note: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    modified_at: datetime = Field(default_factory=datetime.utcnow)


class TeamInvitation(SQLModel, table=True):
    """Team invitation model for tracking pending member invitations."""
    
    id: Optional[UUID] = Field(default=None, primary_key=True)
    team_id: UUID = Field(foreign_key="team.id", index=True)
    invitee_email: str = Field(index=True)
    inviter_id: UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    modified_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    is_used: bool = Field(default=False, index=True)


# Pydantic schemas for API requests/responses
class UserBase(SQLModel):
    """Base user schema."""
    email: str
    name: str
    photo_url: Optional[str] = None


class UserCreate(UserBase):
    """User creation schema."""
    password: Optional[str] = None
    auth_provider: AuthProvider = AuthProvider.EMAIL


class UserLogin(SQLModel):
    """User login schema - only email and password."""
    email: str
    password: str


class UserResponse(UserBase):
    """User response schema."""
    id: UUID
    auth_provider: AuthProvider
    created_at: datetime
    modified_at: datetime


class TeamBase(SQLModel):
    """Base team schema."""
    name: str
    trip_budget: Optional[float] = None


class TeamCreate(TeamBase):
    """Team creation schema."""
    pass


class TeamResponse(TeamBase):
    """Team response schema."""
    id: UUID
    created_by: UUID
    created_at: datetime
    modified_at: datetime
    trip_budget: Optional[float] = None


class TeamMemberResponse(SQLModel):
    """Team member response schema."""
    id: UUID
    team_id: UUID
    user_id: UUID
    initial_budget: float
    created_at: datetime
    modified_at: datetime


class ExpenseBase(SQLModel):
    """Base expense schema."""
    total_amount: float
    participants: List[UUID]
    type_label: str = "Other"
    type_emoji: str = "💰"
    note: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    """Expense creation schema."""
    team_id: UUID


class ExpenseResponse(ExpenseBase):
    """Expense response schema."""
    id: UUID
    team_id: UUID
    payer_id: UUID
    created_at: datetime
    modified_at: datetime

    @field_validator('participants', mode='before')
    @classmethod
    def parse_participants(cls, v):
        """Convert JSON string to list if needed."""
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return []
        return v


class TokenResponse(SQLModel):
    """Token response schema."""
    access_token: str
    token_type: str = "bearer"


class MagicLinkRequest(SQLModel):
    """Magic link request schema."""
    email: str


class BudgetSet(SQLModel):
    """Budget setting schema."""
    user_id: UUID
    budget_amount: float


class AddTeamMember(SQLModel):
    """Add team member schema."""
    user_id: UUID


class SendInvitationsRequest(SQLModel):
    """Request schema for sending team invitations."""
    emails: List[str]  # List of email addresses to invite


class InvitationResponse(SQLModel):
    """Team invitation response schema."""
    id: UUID
    team_id: UUID
    invitee_email: str
    inviter_id: UUID
    created_at: datetime
    modified_at: datetime
    expires_at: datetime
    is_used: bool


class AcceptInvitationRequest(SQLModel):
    """Request schema for accepting a team invitation."""
    token: str


class BulkInvitationResult(SQLModel):
    """Result of sending bulk invitations."""
    team_id: Optional[str] = None
    invited_emails: Optional[List[str]] = None
    added_existing_users: Optional[List[str]] = None
    failed_emails: Optional[List[str]] = None
    total_invitations_sent: Optional[int] = None
    successful: Optional[int] = None
    failed: Optional[int] = None
    message: Optional[str] = None
    details: Optional[List[dict]] = None


class TokenAuth(SQLModel):
    """Token authentication schema."""
    token: str
