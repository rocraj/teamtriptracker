"""Summary and analytics API endpoints."""
from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from uuid import UUID

from app.core.database import get_session
from app.core.security import get_current_user_id
from app.services.team import TeamService
from app.services.expense import ExpenseService
from app.services.settlement import (
    calculate_balances, calculate_settlements, calculate_next_payer,
    calculate_budget_balances, Settlement
)

router = APIRouter(prefix="/summary", tags=["summary"])


@router.get("/{team_id}/balances")
def get_team_balances(
    team_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Get remaining budget balances for each team member."""
    # Verify user is a team member
    user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
    members = TeamService.get_team_members(session, team_id)
    if not any(m.user_id == user_uuid for m in members):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )
    
    # Get all expenses for the team
    expenses = ExpenseService.get_team_expenses(session, team_id, limit=10000)
    
    # Parse expenses into format expected by budget calculator
    expense_list = []
    team_member_ids = [str(m.user_id) for m in members]
    
    for expense in expenses:
        participants = ExpenseService.get_expense_participants(expense)
        expense_list.append({
            "payer_id": str(expense.payer_id),
            "participants": participants,
            "total_amount": expense.total_amount
        })
    
    # Calculate budget balances (remaining budget after actual payments)
    team_member_uuids = [UUID(uid) for uid in team_member_ids]
    member_budgets = {UUID(str(m.user_id)): m.initial_budget for m in members}
    budget_balances = calculate_budget_balances(expense_list, team_member_uuids, member_budgets)
    
    # Format response with string keys for frontend compatibility
    return {
        "team_id": team_id,
        "balances": {
            member_id: float(budget_balances.get(UUID(member_id), 0.0))
            for member_id in team_member_ids
        }
    }


@router.get("/{team_id}/settlements")
def get_settlement_plan(
    team_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Get optimal settlement plan."""
    # Verify user is a team member
    user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
    members = TeamService.get_team_members(session, team_id)
    if not any(m.user_id == user_uuid for m in members):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )
    
    # Get all expenses
    expenses = ExpenseService.get_team_expenses(session, team_id, limit=10000)
    
    # Parse expenses
    expense_list = []
    team_member_ids = [str(m.user_id) for m in members]
    
    for expense in expenses:
        participants = ExpenseService.get_expense_participants(expense)
        expense_list.append({
            "payer_id": str(expense.payer_id),
            "participants": participants,
            "total_amount": expense.total_amount
        })
    
    # Calculate balances and settlements using UUID conversion
    team_member_uuids = [UUID(uid) for uid in team_member_ids]
    balances = calculate_balances(expense_list, team_member_uuids)
    settlements = calculate_settlements(balances)
    
    # Format response to match frontend expectations
    settlement_list = [
        {
            "from_user": str(s.from_user),
            "to_user": str(s.to_user),
            "amount": s.amount
        }
        for s in settlements
    ]
    
    return {
        "team_id": team_id,
        "settlements": settlement_list,
        "total_transactions": len(settlement_list)
    }


@router.get("/{team_id}/next-payer")
def get_next_payer(
    team_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Get suggestion for next person who should pay."""
    # Verify user is a team member
    user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
    members = TeamService.get_team_members(session, team_id)
    if not any(m.user_id == user_uuid for m in members):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )
    
    # Get all expenses
    expenses = ExpenseService.get_team_expenses(session, team_id, limit=10000)
    
    # Parse expenses
    expense_list = []
    team_member_ids = [str(m.user_id) for m in members]
    user_budgets = {str(m.user_id): m.initial_budget for m in members}
    
    for expense in expenses:
        participants = ExpenseService.get_expense_participants(expense)
        expense_list.append({
            "payer_id": str(expense.payer_id),
            "participants": participants,
            "total_amount": expense.total_amount
        })
    
    # Calculate balances and get next payer suggestion using UUID conversion
    team_member_uuids = [UUID(uid) for uid in team_member_ids]
    balances = calculate_balances(expense_list, team_member_uuids)
    next_user, suggested_amount = calculate_next_payer(
        balances, user_budgets, expense_list
    )
    
    return {
        "team_id": team_id,
        "next_payer_id": str(next_user),
        "suggested_amount": suggested_amount
    }
