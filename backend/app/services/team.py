"""Team management service."""
from uuid import uuid4, UUID
from datetime import datetime
from typing import List, Optional
from sqlmodel import Session, select

from app.models.schemas import Team, TeamMember, User


class TeamService:
    """Service for team operations."""
    
    @staticmethod
    def create_team(session: Session, name: str, created_by_id: str) -> Team:
        """Create a new team."""
        # Ensure created_by_id is a UUID
        if isinstance(created_by_id, str):
            created_by_id = UUID(created_by_id)
        
        team = Team(
            id=uuid4(),
            name=name,
            created_by=created_by_id,
            created_at=datetime.utcnow()
        )
        session.add(team)
        session.commit()
        session.refresh(team)
        return team
    
    @staticmethod
    def get_team(session: Session, team_id: str) -> Optional[Team]:
        """Get team by ID."""
        # Ensure team_id is a UUID
        if isinstance(team_id, str):
            team_id = UUID(team_id)
        return session.exec(
            select(Team).where(Team.id == team_id)
        ).first()
    
    @staticmethod
    def get_user_teams(session: Session, user_id: str) -> List[Team]:
        """Get all teams for a user."""
        # Ensure user_id is a UUID
        if isinstance(user_id, str):
            user_id = UUID(user_id)
        
        # Get team IDs where user is a member
        team_member_ids = session.exec(
            select(TeamMember.team_id).where(TeamMember.user_id == user_id)
        ).all()
        
        if not team_member_ids:
            return []
        
        teams = session.exec(
            select(Team).where(Team.id.in_(team_member_ids))
        ).all()
        return teams
    
    @staticmethod
    def add_team_member(
        session: Session,
        team_id: str,
        user_id: str,
        initial_budget: float = 0.0
    ) -> TeamMember:
        """Add a member to a team."""
        # Ensure IDs are UUIDs
        if isinstance(team_id, str):
            team_id = UUID(team_id)
        if isinstance(user_id, str):
            user_id = UUID(user_id)
        
        # Check if already a member
        existing = session.exec(
            select(TeamMember).where(
                (TeamMember.team_id == team_id) &
                (TeamMember.user_id == user_id)
            )
        ).first()
        
        if existing:
            return existing
        
        member = TeamMember(
            id=uuid4(),
            team_id=team_id,
            user_id=user_id,
            initial_budget=initial_budget
        )
        session.add(member)
        session.commit()
        session.refresh(member)
        return member
    
    @staticmethod
    def get_team_members(session: Session, team_id: str) -> List[TeamMember]:
        """Get all members of a team."""
        # Ensure team_id is a UUID
        if isinstance(team_id, str):
            team_id = UUID(team_id)
        return session.exec(
            select(TeamMember).where(TeamMember.team_id == team_id)
        ).all()
    
    @staticmethod
    def set_member_budget(
        session: Session,
        team_id: str,
        user_id: str,
        budget: float
    ) -> TeamMember:
        """Set or update a member's budget."""
        # Ensure IDs are UUIDs
        if isinstance(team_id, str):
            team_id = UUID(team_id)
        if isinstance(user_id, str):
            user_id = UUID(user_id)
        
        member = session.exec(
            select(TeamMember).where(
                (TeamMember.team_id == team_id) &
                (TeamMember.user_id == user_id)
            )
        ).first()
        
        if not member:
            raise ValueError(f"User {user_id} is not a member of team {team_id}")
        
        member.initial_budget = budget
        session.add(member)
        session.commit()
        session.refresh(member)
        return member
