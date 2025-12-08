"""Team API endpoints."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from uuid import UUID
from datetime import datetime

from app.core.database import get_session
from app.core.security import get_current_user_id
from app.core.config import get_settings
from app.models.schemas import (
    TeamCreate, TeamResponse, TeamMemberResponse,
    BudgetSet, UserResponse, AddTeamMember, User,
    SendInvitationsRequest, BulkInvitationResult, AcceptInvitationRequest,
    InvitationResponse, TeamUpdate
)
from app.services.team import TeamService
from app.services.auth import AuthService
from app.services.email import EmailService
from app.services.invitation import InvitationService
from app.services.budget import BudgetService

router = APIRouter(prefix="/teams", tags=["teams"])


@router.post("", response_model=TeamResponse)
def create_team(
    team_data: TeamCreate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Create a new team and add creator as default member."""
    team = TeamService.create_team(session, team_data.name, user_id, team_data.trip_budget)
    
    # Creator is already added as team member in create_team method
    return team


@router.get("", response_model=List[TeamResponse])
def list_user_teams(
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Get all teams for the current user."""
    teams = TeamService.get_user_teams(session, user_id)
    return teams


@router.get("/{team_id}", response_model=TeamResponse)
def get_team(
    team_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Get team details."""
    from uuid import UUID
    team = TeamService.get_team(session, team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Verify user is a member - convert user_id to UUID for comparison
    user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
    members = TeamService.get_team_members(session, team_id)
    if not any(m.user_id == user_uuid for m in members):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )
    
    return team


@router.put("/{team_id}", response_model=TeamResponse)
def update_team(
    team_id: str,
    team_data: TeamUpdate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Update team name and/or budget. Any team member can update."""
    try:
        team = TeamService.update_team(
            session, 
            team_id, 
            user_id, 
            team_data.name, 
            team_data.trip_budget
        )
        return team
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.delete("/{team_id}")
def delete_team(
    team_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Delete a team. Only the team creator can delete the team."""
    try:
        TeamService.delete_team(session, team_id, user_id)
        return {"message": "Team deleted successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.post("/{team_id}/invite")
def invite_member(
    team_id: str,
    email: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Invite a member to the team."""
    from uuid import UUID
    # Verify user is a member - convert user_id to UUID for comparison
    user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
    members = TeamService.get_team_members(session, team_id)
    if not any(m.user_id == user_uuid for m in members):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )
    
    # Get user to invite
    invite_user = AuthService.get_user_by_email(session, email)
    if not invite_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Add user to team
    TeamService.add_team_member(session, team_id, str(invite_user.id))
    
    return {
        "message": f"User {email} has been added to the team"
    }


@router.post("/{team_id}/members", response_model=TeamMemberResponse)
def add_member(
    team_id: str,
    member_data: AddTeamMember,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Add a member directly to a team by user ID."""
    from uuid import UUID
    # Verify user is a member (must be team member to add others)
    user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
    members = TeamService.get_team_members(session, team_id)
    if not any(m.user_id == user_uuid for m in members):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )
    
    # Verify the user to add exists
    user_to_add = session.exec(
        select(User).where(User.id == member_data.user_id)
    ).first()
    if not user_to_add:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Add user to team with appropriate budget
    # Get team details to determine budget allocation
    team = TeamService.get_team(session, team_id)
    current_member_count = len(members)
    new_member_count = current_member_count + 1
    
    # Calculate fair budget share (team budget divided by new total members)
    initial_budget = 0.0
    if team and team.trip_budget:
        initial_budget = team.trip_budget / new_member_count
    
    added_member = TeamService.add_team_member(
        session, team_id, str(member_data.user_id), initial_budget
    )
    
    return added_member


@router.post("/{team_id}/budget")
def set_member_budget(
    team_id: str,
    budget: BudgetSet,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Set a member's budget."""
    from uuid import UUID
    # Verify user is a team member - convert user_id to UUID for comparison
    user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
    members = TeamService.get_team_members(session, team_id)
    if not any(m.user_id == user_uuid for m in members):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )
    
    member = TeamService.set_member_budget(
        session, team_id, str(budget.user_id), budget.budget_amount
    )
    return member


@router.get("/{team_id}/members", response_model=List[TeamMemberResponse])
def get_team_members(
    team_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Get all members of a team."""
    # Verify user is a member - convert user_id to UUID for comparison
    user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
    members = TeamService.get_team_members(session, team_id)
    if not any(m.user_id == user_uuid for m in members):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )
    
    # Get enriched member data with user details
    enriched_members = TeamService.get_team_members_enriched(session, team_id)
    return enriched_members


@router.post("/{team_id}/send-invites", response_model=BulkInvitationResult)
def send_team_invitations(
    team_id: str,
    request: SendInvitationsRequest,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Send invitation emails to add new members to a team.
    
    Only team members can send invitations.
    Sends invitation emails to provided email addresses.
    """
    # Verify user is a team member
    user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
    members = TeamService.get_team_members(session, team_id)
    if not any(m.user_id == user_uuid for m in members):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )
    
    # Get team and inviter details
    team = TeamService.get_team(session, team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    inviter = session.exec(
        select(User).where(User.id == UUID(user_id) if isinstance(user_id, str) else user_id)
    ).first()
    
    # Validate and prepare invitations
    settings = get_settings()
    invitation_links_list = []
    tokens_list = []
    invitations_to_store = []
    existing_users_added = []
    already_members = []
    invalid_emails = []
    
    for email in request.emails:
        # Validate email format
        if not email or "@" not in email:
            invalid_emails.append(email)
            continue
        
        # Check if user already exists in the system
        existing_user = AuthService.get_user_by_email(session, email)
        if existing_user:
            # User already exists, check if already a team member
            user_uuid_check = UUID(str(existing_user.id)) if not isinstance(existing_user.id, UUID) else existing_user.id
            if any(m.user_id == user_uuid_check for m in members):
                already_members.append({"email": email, "name": existing_user.name})
                continue  # Skip, already a member
            else:
                # Add user directly to team
                try:
                    TeamService.add_team_member(session, team_id, str(existing_user.id))
                    existing_users_added.append({"email": email, "name": existing_user.name, "user_id": str(existing_user.id)})
                    
                    # Send notification email to existing user about being added to team
                    EmailService.send_team_addition_notification(
                        recipient_email=email,
                        recipient_name=existing_user.name,
                        team_name=team.name,
                        inviter_name=inviter.name if inviter else "Team Admin"
                    )
                except Exception as e:
                    print(f"Error adding existing user {email} to team: {e}")
                    # Fall back to sending invitation
                    pass
                continue
        
        # Create invitation for new user
        try:
            token, invitation = InvitationService.create_invitation_token(
                team_id, email, user_id
            )
            
            invitations_to_store.append(invitation)
            tokens_list.append(token)
            
            # Build invitation link
            invitation_link = f"{settings.FRONTEND_URL}/accept-invite/{token}"
            invitation_links_list.append(invitation_link)
        except Exception as e:
            print(f"Error creating invitation for {email}: {e}")
            invalid_emails.append(email)
    
    # Store invitations in database
    for invitation in invitations_to_store:
        session.add(invitation)
    session.commit()
    
    # Send emails
    if invitations_to_store:
        recipient_names = [email.split("@")[0] for email in request.emails[-len(invitations_to_store):]]
        email_results = EmailService.send_bulk_invitations(
            recipient_emails=request.emails[-len(invitations_to_store):],
            recipient_names=recipient_names,
            team_name=team.name,
            inviter_name=inviter.name,
            invitation_links=invitation_links_list
        )
    else:
        email_results = {
            "successful": 0,
            "failed": 0,
            "details": []
        }
    
    # Prepare detailed response
    total_processed = len(request.emails)
    
    return BulkInvitationResult(
        successful=email_results["successful"] + len(existing_users_added),
        failed=email_results["failed"] + len(invalid_emails),
        message=f"Processed {total_processed} invitations: {len(existing_users_added)} added directly, {email_results['successful']} invitations sent, {len(already_members)} already members, {len(invalid_emails)} invalid",
        details=email_results["details"] + [
            f"{user['email']}: Added directly to team" for user in existing_users_added
        ] + [
            f"{user['email']}: Already a team member" for user in already_members
        ] + [
            f"{email}: Invalid email or user not found" for email in invalid_emails
        ]
    )


@router.post("/accept-invite/invite", response_model=dict)
def accept_team_invitation(
    request: AcceptInvitationRequest,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Accept a team invitation and add user to the team.
    
    The user must be logged in. The invitation token must be valid and not expired.
    """
    # Validate the token
    payload = InvitationService.validate_invitation_token(request.token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired invitation token"
        )
    
    invitation_id = payload.get("sub")
    team_id = payload.get("team_id")
    invitee_email = payload.get("invitee_email")
    
    # Get the current user
    current_user = session.exec(
        select(User).where(User.id == UUID(user_id) if isinstance(user_id, str) else user_id)
    ).first()
    
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Verify the invitation email matches the current user's email
    if current_user.email != invitee_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This invitation is for a different email address"
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


@router.get("/{team_id}/invitations", response_model=List[InvitationResponse])
def get_team_invitations(
    team_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Get pending invitations for a team.
    
    Only team members can view pending invitations.
    """
    # Verify user is a team member
    user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
    members = TeamService.get_team_members(session, team_id)
    if not any(m.user_id == user_uuid for m in members):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )
    
    invitations = InvitationService.get_pending_invitations(session, team_id)
    return invitations


@router.get("/invitations/info/{token}")
def get_invitation_info(
    token: str,
    session: Session = Depends(get_session)
):
    """Get public invitation information without requiring authentication.
    
    Allows users to see invitation details before signing up or logging in.
    Returns: team name, inviter name, invitee email, status.
    """
    # Validate the token
    payload = InvitationService.validate_invitation_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired invitation token"
        )
    
    invitation_id = payload.get("sub")
    team_id = payload.get("team_id")
    invitee_email = payload.get("invitee_email")
    
    # Get invitation from database
    invitation = InvitationService.get_invitation(session, invitation_id)
    if not invitation or invitation.is_used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation has already been used or is invalid"
        )
    
    # Get team and inviter details
    team = TeamService.get_team(session, team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    inviter = session.exec(
        select(User).where(User.id == invitation.inviter_id)
    ).first()
    
    if not inviter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inviter not found"
        )
    
    return {
        "team_name": team.name,
        "team_id": str(team.id),
        "inviter_name": inviter.name,
        "inviter_email": inviter.email,
        "invitee_email": invitee_email,
        "created_at": invitation.created_at,
        "expires_at": invitation.expires_at,
        "is_expired": invitation.expires_at < datetime.utcnow()
    }


# Budget Management Endpoints
@router.get("/{team_id}/budget-status")
def get_budget_status(
    team_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Get budget status for all team members."""
    # Verify user is a team member
    user_uuid = UUID(user_id)
    members = TeamService.get_team_members(session, team_id)
    if not any(m.user_id == user_uuid for m in members):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )
    
    budget_status = BudgetService.get_member_budget_status(session, team_id)
    return {"budget_status": budget_status}


@router.get("/{team_id}/budget-insights")
def get_budget_insights(
    team_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Get budget insights and recommendations for the team."""
    # Verify user is a team member
    user_uuid = UUID(user_id)
    members = TeamService.get_team_members(session, team_id)
    if not any(m.user_id == user_uuid for m in members):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )
    
    insights = BudgetService.get_budget_insights(session, team_id)
    return insights


@router.post("/{team_id}/suggest-payer")
def suggest_optimal_payer(
    team_id: str,
    request: dict,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Suggest the optimal payer for an expense."""
    # Verify user is a team member
    user_uuid = UUID(user_id)
    members = TeamService.get_team_members(session, team_id)
    if not any(m.user_id == user_uuid for m in members):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )
    
    amount = request.get("amount", 0)
    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be greater than 0"
        )
    
    suggestion = BudgetService.suggest_optimal_payer(session, team_id, amount)
    
    if not suggestion:
        return {
            "suggestion": None,
            "message": "No team members have sufficient budget for this expense"
        }
    
    return {"suggestion": suggestion}


@router.put("/{team_id}/members/{member_user_id}/budget")
def update_member_budget(
    team_id: str,
    member_user_id: str,
    request: dict,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Update a team member's budget."""
    # Verify user is a team member
    user_uuid = UUID(user_id)
    members = TeamService.get_team_members(session, team_id)
    if not any(m.user_id == user_uuid for m in members):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )
    
    budget = request.get("budget", 0)
    if budget < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Budget cannot be negative"
        )
    
    success = BudgetService.update_member_budget(session, team_id, member_user_id, budget)
    return {"success": success}


@router.post("/{team_id}/recalculate-budgets")
def recalculate_budgets_equally(
    team_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Recalculate budgets equally among all team members."""
    # Verify user is a team member
    user_uuid = UUID(user_id)
    members = TeamService.get_team_members(session, team_id)
    if not any(m.user_id == user_uuid for m in members):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )
    
    # Get team trip budget
    team = TeamService.get_team(session, team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Calculate equal budget per member
    member_count = len(members)
    if member_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot recalculate budgets for team with no members"
        )
    
    equal_budget = team.trip_budget / member_count
    
    # Update all member budgets
    success_count = 0
    for member in members:
        if BudgetService.update_member_budget(session, team_id, str(member.user_id), equal_budget):
            success_count += 1
    
    return {"success": success_count == member_count}
