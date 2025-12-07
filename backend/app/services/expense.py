"""Expense management service."""
import json
from uuid import uuid4
from datetime import datetime
from typing import List, Optional
from sqlmodel import Session, select

from app.models.schemas import Expense


class ExpenseService:
    """Service for expense operations."""
    
    @staticmethod
    def create_expense(
        session: Session,
        team_id: str,
        payer_id: str,
        total_amount: float,
        participants: List[str],
        type_label: str = "Other",
        type_emoji: str = "💰",
        note: Optional[str] = None
    ) -> Expense:
        """Create a new expense."""
        expense = Expense(
            id=uuid4(),
            team_id=team_id,
            payer_id=payer_id,
            total_amount=total_amount,
            participants=json.dumps([str(p) for p in participants]),
            type_label=type_label,
            type_emoji=type_emoji,
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
