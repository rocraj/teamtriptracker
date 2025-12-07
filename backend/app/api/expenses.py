"""Expense API endpoints."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from uuid import UUID

from app.core.database import get_session
from app.core.security import get_current_user_id
from app.models.schemas import ExpenseCreate, ExpenseResponse, Team
from app.services.expense import ExpenseService
from app.services.team import TeamService

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.post("", response_model=ExpenseResponse)
def create_expense(
    expense_data: ExpenseCreate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Create a new expense."""
    # Verify user is a team member
    user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
    members = TeamService.get_team_members(session, str(expense_data.team_id))
    if not any(m.user_id == user_uuid for m in members):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )
    
    expense = ExpenseService.create_expense(
        session,
        str(expense_data.team_id),
        user_id,
        expense_data.total_amount,
        expense_data.participants,
        expense_data.type_label,
        expense_data.type_emoji,
        expense_data.note
    )
    
    return expense


@router.get("/{team_id}", response_model=List[ExpenseResponse])
def list_team_expenses(
    team_id: str,
    limit: int = 100,
    offset: int = 0,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Get all expenses for a team."""
    # Verify user is a team member
    user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
    members = TeamService.get_team_members(session, team_id)
    if not any(m.user_id == user_uuid for m in members):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )
    
    expenses = ExpenseService.get_team_expenses(session, team_id, limit, offset)
    return expenses


@router.get("/{team_id}/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    team_id: str,
    expense_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Get expense details."""
    # Verify user is a team member
    user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
    members = TeamService.get_team_members(session, team_id)
    if not any(m.user_id == user_uuid for m in members):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )
    
    expense = ExpenseService.get_expense(session, expense_id)
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    return expense


@router.delete("/{expense_id}")
def delete_expense(
    expense_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Delete an expense."""
    expense = ExpenseService.get_expense(session, expense_id)
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    # Verify user is the payer or team owner
    team = session.exec(
        select(Team).where(Team.id == expense.team_id)
    ).first()
    
    if str(expense.payer_id) != user_id and str(team.created_by) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot delete this expense"
        )
    
    ExpenseService.delete_expense(session, expense_id)
    return {"message": "Expense deleted"}
