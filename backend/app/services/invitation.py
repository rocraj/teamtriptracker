"""Invitation token service for managing team member invitations."""
from datetime import datetime, timedelta
from uuid import uuid4, UUID
from typing import Optional
from sqlmodel import Session, select

from app.core.config import get_settings
from app.core.security import create_access_token, decode_access_token
from app.models.schemas import TeamInvitation


class InvitationService:
    """Service for managing team member invitations."""
    
    INVITATION_EXPIRATION_HOURS = 24 * 7  # 7 days
    
    @staticmethod
    def create_invitation_token(
        team_id: str,
        invitee_email: str,
        inviter_id: str
    ) -> tuple[str, TeamInvitation]:
        """Create an invitation token and store it in the database.
        
        Args:
            team_id: UUID of the team
            invitee_email: Email of the person being invited
            inviter_id: UUID of the person sending the invitation
            
        Returns:
            Tuple of (token, invitation_record)
        """
        invitation = TeamInvitation(
            id=uuid4(),
            team_id=UUID(team_id) if isinstance(team_id, str) else team_id,
            invitee_email=invitee_email,
            inviter_id=UUID(inviter_id) if isinstance(inviter_id, str) else inviter_id,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(hours=InvitationService.INVITATION_EXPIRATION_HOURS),
            is_used=False
        )
        
        # Create JWT token with invitation data
        token_data = {
            "sub": str(invitation.id),
            "team_id": str(team_id),
            "invitee_email": invitee_email,
            "type": "team_invitation"
        }
        
        # Create token with 7-day expiration
        token = create_access_token(
            token_data,
            expires_delta=timedelta(hours=InvitationService.INVITATION_EXPIRATION_HOURS)
        )
        
        return token, invitation
    
    @staticmethod
    def validate_invitation_token(token: str) -> Optional[dict]:
        """Validate an invitation token.
        
        Args:
            token: The invitation token to validate
            
        Returns:
            Token payload if valid, None otherwise
        """
        payload = decode_access_token(token)
        
        if not payload:
            return None
        
        if payload.get("type") != "team_invitation":
            return None
        
        return payload
    
    @staticmethod
    def get_invitation(session: Session, invitation_id: str) -> Optional[TeamInvitation]:
        """Get an invitation by ID."""
        invitation_uuid = UUID(invitation_id) if isinstance(invitation_id, str) else invitation_id
        return session.exec(
            select(TeamInvitation).where(TeamInvitation.id == invitation_uuid)
        ).first()
    
    @staticmethod
    def get_invitation_by_email_and_team(
        session: Session,
        email: str,
        team_id: str
    ) -> Optional[TeamInvitation]:
        """Get an active invitation for an email and team."""
        team_uuid = UUID(team_id) if isinstance(team_id, str) else team_id
        return session.exec(
            select(TeamInvitation).where(
                (TeamInvitation.invitee_email == email) &
                (TeamInvitation.team_id == team_uuid) &
                (TeamInvitation.is_used == False) &
                (TeamInvitation.expires_at > datetime.utcnow())
            )
        ).first()
    
    @staticmethod
    def mark_invitation_as_used(session: Session, invitation_id: str) -> bool:
        """Mark an invitation as used."""
        invitation = InvitationService.get_invitation(session, invitation_id)
        if not invitation:
            return False
        
        invitation.is_used = True
        session.add(invitation)
        session.commit()
        return True
    
    @staticmethod
    def get_pending_invitations(
        session: Session,
        team_id: str
    ) -> list[TeamInvitation]:
        """Get all pending (unused and non-expired) invitations for a team."""
        team_uuid = UUID(team_id) if isinstance(team_id, str) else team_id
        return session.exec(
            select(TeamInvitation).where(
                (TeamInvitation.team_id == team_uuid) &
                (TeamInvitation.is_used == False) &
                (TeamInvitation.expires_at > datetime.utcnow())
            )
        ).all()
