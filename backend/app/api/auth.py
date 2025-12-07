"""Authentication API endpoints."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.core.database import get_session
from app.core.config import get_settings
from app.core.security import decode_access_token, get_current_user_id
from app.models.schemas import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    AuthProvider, MagicLinkRequest
)
from app.services.auth import AuthService
from app.services.invitation import InvitationService
from app.services.team import TeamService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(
    user_data: UserCreate,
    session: Session = Depends(get_session)
):
    """Register a new user with email and password.
    
    Optionally accepts an invitation_token in the request body to auto-join a team.
    If token is provided and valid, user is added to the team after registration.
    """
    try:
        user = AuthService.create_user(session, user_data)
        token = AuthService.generate_token(str(user.id))
        
        team_id = None
        
        # If invitation token provided in user_data, validate and add user to team
        invitation_token = user_data.invitation_token if hasattr(user_data, 'invitation_token') else None
        if invitation_token:
            payload = InvitationService.validate_invitation_token(invitation_token)
            if payload:
                invitee_email = payload.get("invitee_email")
                team_id_str = payload.get("team_id")
                invitation_id = payload.get("sub")
                
                # Verify email matches
                if invitee_email == user_data.email:
                    try:
                        # Add user to team
                        TeamService.add_team_member(session, team_id_str, str(user.id))
                        # Mark invitation as used
                        InvitationService.mark_invitation_as_used(session, invitation_id)
                        team_id = team_id_str
                    except Exception as e:
                        # Log error but don't fail the registration
                        print(f"Error adding user to team: {str(e)}")
                        import traceback
                        traceback.print_exc()
                        team_id = None
        
        return TokenResponse(access_token=token, team_id=team_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=TokenResponse)
def login(
    user_data: UserLogin,
    session: Session = Depends(get_session)
):
    """Login with email and password."""
    user = AuthService.authenticate_user(session, user_data.email, user_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    token = AuthService.generate_token(str(user.id))
    return TokenResponse(access_token=token)


@router.post("/google-signin", response_model=TokenResponse)
def google_signin(
    email: str,
    name: str,
    photo_url: Optional[str] = None,
    session: Session = Depends(get_session)
):
    """Sign in or create user via Google OAuth."""
    user = AuthService.create_or_update_google_user(
        session, email, name, photo_url
    )
    token = AuthService.generate_token(str(user.id))
    return TokenResponse(access_token=token)


@router.post("/email/request-link")
def request_magic_link(
    request: MagicLinkRequest,
    session: Session = Depends(get_session)
):
    """Request a magic link for passwordless login."""
    # Check if user exists
    user = AuthService.get_user_by_email(session, request.email)
    
    if not user:
        # Create user if doesn't exist
        user_data = UserCreate(
            email=request.email,
            name=request.email.split("@")[0],
            auth_provider=AuthProvider.EMAIL
        )
        user = AuthService.create_user(session, user_data)
    
    # TODO: Send magic link email
    # For now, just return success
    return {"message": "Check your email for the magic link"}


@router.get("/email/verify")
def verify_magic_link(token: str):
    """Verify magic link token."""
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def get_current_user(
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session)
):
    """Get current authenticated user."""
    user = AuthService.get_user_by_id(session, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.get("/check-email/{email}")
def check_email_exists(
    email: str,
    session: Session = Depends(get_session)
):
    """Check if an email already has an account.
    
    Helps frontend decide whether to show signup or login form.
    Public endpoint - no authentication required.
    """
    user = AuthService.get_user_by_email(session, email)
    return {
        "email": email,
        "exists": user is not None,
        "message": "Account exists" if user else "No account found"
    }


@router.post("/teams/accept-invite", response_model=dict)
def accept_team_invitation(
    invitation_token: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Accept a team invitation and add user to the team.
    
    For users who already have an account and are logged in.
    Validates that the invitation email matches the current user's email.
    """
    from uuid import UUID
    
    # Validate the token
    payload = InvitationService.validate_invitation_token(invitation_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired invitation token"
        )
    
    invitation_id = payload.get("sub")
    team_id = payload.get("team_id")
    invitee_email = payload.get("invitee_email")
    
    # Get the current user
    current_user = AuthService.get_user_by_id(session, user_id)
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Verify the invitation email matches the current user's email
    if current_user.email != invitee_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This invitation is for {invitee_email}, not {current_user.email}. "
                   f"Please logout and login with the correct account."
        )
    
    # Get the invitation from database
    invitation = InvitationService.get_invitation(session, invitation_id)
    if not invitation or invitation.is_used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation has already been used or is invalid"
        )
    
    # Check if user is already a member
    members = TeamService.get_team_members(session, team_id)
    user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
    if any(m.user_id == user_uuid for m in members):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this team"
        )
    
    # Add user to team
    TeamService.add_team_member(session, team_id, user_id)
    
    # Mark invitation as used
    InvitationService.mark_invitation_as_used(session, invitation_id)
    
    return {
        "message": "Successfully joined the team",
        "team_id": team_id
    }
