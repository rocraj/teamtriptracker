"""Expense category service for managing default and team-specific categories."""
from typing import List, Optional, Any
from uuid import UUID, uuid4

try:
    from sqlmodel import Session, select
except ImportError:
    # Fallback for development environment
    Session = Any
    def select(*args): pass

from app.models.schemas import (
    ExpenseCategory,
    TeamCustomCategory,
    ExpenseCategoryResponse,
    TeamCustomCategoryResponse,
    TeamCustomCategoryCreate
)


class ExpenseCategoryService:
    """Service for managing expense categories."""

    @staticmethod
    def create_default_categories(session: Session) -> None:
        """Create default expense categories if they don't exist."""
        default_categories = [
            {"name": "travel", "emoji": "✈️"},
            {"name": "food", "emoji": "🍽️"},
            {"name": "entertainment", "emoji": "🎭"},
            {"name": "stay", "emoji": "🏨"},
            {"name": "personal", "emoji": "🛍️"}
        ]

        for category_data in default_categories:
            # Check if category already exists
            existing = session.exec(
                select(ExpenseCategory).where(
                    ExpenseCategory.name == category_data["name"],
                    ExpenseCategory.is_default == True
                )
            ).first()

            if not existing:
                category = ExpenseCategory(
                    id=uuid4(),
                    name=category_data["name"],
                    emoji=category_data["emoji"],
                    is_default=True
                )
                session.add(category)
        
        session.commit()

    @staticmethod
    def get_default_categories(session: Session) -> List[ExpenseCategoryResponse]:
        """Get all default expense categories."""
        categories = session.exec(
            select(ExpenseCategory).where(ExpenseCategory.is_default == True)
        ).all()
        
        return [ExpenseCategoryResponse.model_validate(cat) for cat in categories]

    @staticmethod
    def get_team_custom_categories(session: Session, team_id: str) -> List[TeamCustomCategoryResponse]:
        """Get all custom categories for a team."""
        team_uuid = UUID(team_id) if isinstance(team_id, str) else team_id
        
        categories = session.exec(
            select(TeamCustomCategory).where(TeamCustomCategory.team_id == team_uuid)
        ).all()
        
        return [TeamCustomCategoryResponse.model_validate(cat) for cat in categories]

    @staticmethod
    def get_all_team_categories(session: Session, team_id: str) -> dict:
        """Get both default and team custom categories for a team."""
        default_categories = ExpenseCategoryService.get_default_categories(session)
        custom_categories = ExpenseCategoryService.get_team_custom_categories(session, team_id)
        
        return {
            "default": default_categories,
            "custom": custom_categories
        }

    @staticmethod
    def create_team_custom_category(
        session: Session,
        team_id: str,
        user_id: str,
        name: str,
        emoji: str = "💰"
    ) -> TeamCustomCategoryResponse:
        """Create a new custom category for a team."""
        team_uuid = UUID(team_id) if isinstance(team_id, str) else team_id
        user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id

        # Check if category name already exists for this team
        existing = session.exec(
            select(TeamCustomCategory).where(
                TeamCustomCategory.team_id == team_uuid,
                TeamCustomCategory.name.ilike(name.strip())
            )
        ).first()

        if existing:
            raise ValueError(f"Category '{name}' already exists for this team")

        # Check if it conflicts with default category names
        existing_default = session.exec(
            select(ExpenseCategory).where(
                ExpenseCategory.name.ilike(name.strip()),
                ExpenseCategory.is_default == True
            )
        ).first()

        if existing_default:
            raise ValueError(f"Category '{name}' conflicts with default category")

        category = TeamCustomCategory(
            id=uuid4(),
            team_id=team_uuid,
            name=name.strip().lower(),
            emoji=emoji,
            created_by=user_uuid
        )

        session.add(category)
        session.commit()
        session.refresh(category)

        return TeamCustomCategoryResponse.model_validate(category)

    @staticmethod
    def delete_team_custom_category(
        session: Session,
        category_id: str,
        team_id: str,
        user_id: str
    ) -> bool:
        """Delete a team custom category."""
        category_uuid = UUID(category_id) if isinstance(category_id, str) else category_id
        team_uuid = UUID(team_id) if isinstance(team_id, str) else team_id
        user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id

        category = session.exec(
            select(TeamCustomCategory).where(
                TeamCustomCategory.id == category_uuid,
                TeamCustomCategory.team_id == team_uuid
            )
        ).first()

        if not category:
            return False

        # Only creator or team owner can delete
        # Note: You might want to add team ownership check here
        if category.created_by != user_uuid:
            raise PermissionError("Only category creator can delete this category")

        session.delete(category)
        session.commit()
        return True

    @staticmethod
    def get_category_by_id(session: Session, category_id: str) -> Optional[ExpenseCategoryResponse]:
        """Get default category by ID."""
        category_uuid = UUID(category_id) if isinstance(category_id, str) else category_id
        
        category = session.exec(
            select(ExpenseCategory).where(ExpenseCategory.id == category_uuid)
        ).first()
        
        if category:
            return ExpenseCategoryResponse.model_validate(category)
        return None

    @staticmethod
    def get_team_category_by_id(session: Session, category_id: str, team_id: str) -> Optional[TeamCustomCategoryResponse]:
        """Get team custom category by ID."""
        category_uuid = UUID(category_id) if isinstance(category_id, str) else category_id
        team_uuid = UUID(team_id) if isinstance(team_id, str) else team_id
        
        category = session.exec(
            select(TeamCustomCategory).where(
                TeamCustomCategory.id == category_uuid,
                TeamCustomCategory.team_id == team_uuid
            )
        ).first()
        
        if category:
            return TeamCustomCategoryResponse.model_validate(category)
        return None