"""Budget management API endpoints."""

from typing import Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from ..core.database import get_session
from ..core.security import get_current_user_id
from ..services.team import TeamService
from ..services.budget import BudgetService
from ..models.schemas import TeamMember

router = APIRouter()


@router.get("/{team_id}/budget-status")
def get_team_budget_status(
    team_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Get budget status for all team members."""
    # Verify user is a team member
    from uuid import UUID
    user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
    members = TeamService.get_team_members(session, team_id)
    if not any(m.user_id == user_uuid for m in members):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )
    
    budget_status = BudgetService.get_member_budget_status(session, team_id)
    return {"budget_status": budget_status}


@router.get("/{team_id}/budget-insights")
def get_team_budget_insights(
    team_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Get team budget insights and recommendations."""
    # Verify user is a team member
    from uuid import UUID
    user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
    members = TeamService.get_team_members(session, team_id)
    if not any(m.user_id == user_uuid for m in members):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )
    
    insights = BudgetService.get_budget_insights(session, team_id)
    return insights


@router.post("/{team_id}/recalculate-budgets")
def recalculate_team_budgets_equally(
    team_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Recalculate budgets equally among all team members."""
    # Verify user is team creator or member
    from uuid import UUID
    user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
    
    team = TeamService.get_team(session, team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Only team creator can recalculate budgets
    if team.created_by != user_uuid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team creator can recalculate budgets"
        )
    
    success = TeamService.recalculate_equal_budgets(session, team_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to recalculate budgets. Ensure team has a trip budget set."
        )
    
    return {"message": "Budgets recalculated successfully", "success": True}


@router.put("/{team_id}/members/{member_user_id}/budget")
def update_member_budget(
    team_id: str,
    member_user_id: str,
    request_data: Dict,  # {"budget": float}
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Update a specific member's budget."""
    # Verify user is team creator
    from uuid import UUID
    user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
    
    team = TeamService.get_team(session, team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Only team creator can update member budgets
    if team.created_by != user_uuid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team creator can update member budgets"
        )
    
    new_budget = request_data.get("budget")
    if new_budget is None or new_budget < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid budget amount"
        )
    
    success = TeamService.update_member_budget(session, team_id, member_user_id, new_budget)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update member budget"
        )
    
    return {"message": "Member budget updated successfully", "success": True}


@router.post("/{team_id}/suggest-payer")
def suggest_optimal_payer(
    team_id: str,
    request_data: Dict,  # {"amount": float}
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Get optimal payer suggestion for an expense amount."""
    # Verify user is a team member
    from uuid import UUID
    user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
    members = TeamService.get_team_members(session, team_id)
    if not any(m.user_id == user_uuid for m in members):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )
    
    expense_amount = request_data.get("amount")
    if expense_amount is None or expense_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid expense amount"
        )
    
    suggestion = BudgetService.suggest_optimal_payer(session, team_id, expense_amount)
    
    if not suggestion:
        return {
            "suggestion": None,
            "message": "No members have sufficient budget to cover this expense"
        }
    
    return {"suggestion": suggestion}