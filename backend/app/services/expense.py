"""Expense management service."""
import json
from uuid import uuid4
from datetime import datetime
from typing import List, Optional
from sqlmodel import Session, select

from app.models.schemas import Expense, ExpenseResponse, ExpenseCategory, TeamCustomCategory


class ExpenseService:
    """Service for expense operations."""
    
    @staticmethod
    def create_expense(
        session: Session,
        team_id: str,
        payer_id: str,
        total_amount: float,
        participants: List[str],
        category_id: Optional[str] = None,
        team_category_id: Optional[str] = None,
        note: Optional[str] = None
    ) -> Expense:
        """Create a new expense."""
        expense = Expense(
            id=uuid4(),
            team_id=team_id,
            payer_id=payer_id,
            total_amount=total_amount,
            participants=json.dumps([str(p) for p in participants]),
            category_id=category_id,
            team_category_id=team_category_id,
            note=note,
            created_at=datetime.utcnow()
        )
        session.add(expense)
        session.commit()
        session.refresh(expense)
        return expense
    
    @staticmethod
    def get_expense(session: Session, expense_id: str) -> Optional[Expense]:
        """Get expense by ID."""
        return session.exec(
            select(Expense).where(Expense.id == expense_id)
        ).first()
    
    @staticmethod
    def get_team_expenses(
        session: Session,
        team_id: str,
        limit: int = 100,
        offset: int = 0
    ) -> List[Expense]:
        """Get all expenses for a team."""
        return session.exec(
            select(Expense)
            .where(Expense.team_id == team_id)
            .order_by(Expense.created_at.desc())
            .limit(limit)
            .offset(offset)
        ).all()
    
    @staticmethod
    def delete_expense(session: Session, expense_id: str) -> bool:
        """Delete an expense."""
        expense = ExpenseService.get_expense(session, expense_id)
        if not expense:
            return False
        
        session.delete(expense)
        session.commit()
        return True
    
    @staticmethod
    def get_expense_participants(expense: Expense) -> List[str]:
        """Parse participants from expense JSON."""
        try:
            return json.loads(expense.participants)
        except (json.JSONDecodeError, TypeError):
            return []

    @staticmethod
    def enrich_expense_with_categories(session: Session, expense: Expense) -> ExpenseResponse:
        """Enrich expense with category details."""
        # Convert expense to response format
        expense_data = {
            "id": expense.id,
            "team_id": expense.team_id,
            "payer_id": expense.payer_id,
            "total_amount": expense.total_amount,
            "participants": json.loads(expense.participants) if expense.participants else [],
            "category_id": expense.category_id,
            "team_category_id": expense.team_category_id,
            "note": expense.note,
            "created_at": expense.created_at,
            "modified_at": expense.modified_at,
            "category": None,
            "team_category": None
        }
        
        # Load default category if present
        if expense.category_id:
            category = session.exec(
                select(ExpenseCategory).where(ExpenseCategory.id == expense.category_id)
            ).first()
            if category:
                expense_data["category"] = {
                    "id": category.id,
                    "name": category.name,
                    "emoji": category.emoji,
                    "is_default": category.is_default,
                    "created_at": category.created_at,
                    "modified_at": category.modified_at
                }
        
        # Load team custom category if present
        if expense.team_category_id:
            team_category = session.exec(
                select(TeamCustomCategory).where(TeamCustomCategory.id == expense.team_category_id)
            ).first()
            if team_category:
                expense_data["team_category"] = {
                    "id": team_category.id,
                    "name": team_category.name,
                    "emoji": team_category.emoji,
                    "team_id": team_category.team_id,
                    "created_by": team_category.created_by,
                    "created_at": team_category.created_at,
                    "modified_at": team_category.modified_at
                }
        
        return ExpenseResponse(**expense_data)

    @staticmethod
    def get_enriched_team_expenses(
        session: Session,
        team_id: str,
        limit: int = 100,
        offset: int = 0
    ) -> List[ExpenseResponse]:
        """Get all expenses for a team with category details."""
        expenses = ExpenseService.get_team_expenses(session, team_id, limit, offset)
        return [ExpenseService.enrich_expense_with_categories(session, expense) for expense in expenses]
    
    @staticmethod
    def update_expense(
        session: Session,
        expense_id: str,
        total_amount: Optional[float] = None,
        participants: Optional[List[str]] = None,
        category_id: Optional[str] = None,
        team_category_id: Optional[str] = None,
        note: Optional[str] = None
    ) -> Optional[Expense]:
        """Update an existing expense."""
        expense = session.exec(
            select(Expense).where(Expense.id == expense_id)
        ).first()
        
        if not expense:
            return None
        
        # Update only provided fields
        if total_amount is not None:
            expense.total_amount = total_amount
        
        if participants is not None:
            expense.participants = json.dumps([str(p) for p in participants])
        
        if category_id is not None:
            expense.category_id = category_id
            # Clear team category if regular category is set
            if category_id:
                expense.team_category_id = None
        
        if team_category_id is not None:
            expense.team_category_id = team_category_id
            # Clear regular category if team category is set
            if team_category_id:
                expense.category_id = None
        
        if note is not None:
            expense.note = note
        
        expense.modified_at = datetime.utcnow()
        session.add(expense)
        session.commit()
        session.refresh(expense)
        
        return expense
