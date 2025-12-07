"""Expense category API endpoints."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from uuid import UUID

from app.core.database import get_session
from app.core.security import get_current_user_id
from app.models.schemas import (
    ExpenseCategoryResponse,
    TeamCustomCategoryResponse,
    TeamCustomCategoryCreate
)
from app.services.category import ExpenseCategoryService
from app.services.team import TeamService

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/default", response_model=List[ExpenseCategoryResponse])
def get_default_categories(
    session: Session = Depends(get_session)
):
    """Get all default expense categories."""
    return ExpenseCategoryService.get_default_categories(session)


@router.get("/team/{team_id}", response_model=dict)
def get_team_categories(
    team_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Get all categories (default + custom) for a team."""
    # Verify user is a team member
    user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
    members = TeamService.get_team_members(session, team_id)
    if not any(m.user_id == user_uuid for m in members):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )
    
    return ExpenseCategoryService.get_all_team_categories(session, team_id)


@router.post("/team/{team_id}/custom", response_model=TeamCustomCategoryResponse)
def create_team_custom_category(
    team_id: str,
    category_data: TeamCustomCategoryCreate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Create a new custom category for a team."""
    # Verify user is a team member
    user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
    members = TeamService.get_team_members(session, team_id)
    if not any(m.user_id == user_uuid for m in members):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )
    
    try:
        return ExpenseCategoryService.create_team_custom_category(
            session,
            team_id,
            user_id,
            category_data.name,
            category_data.emoji
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/team/{team_id}/custom/{category_id}")
def delete_team_custom_category(
    team_id: str,
    category_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Delete a team custom category."""
    # Verify user is a team member
    user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
    members = TeamService.get_team_members(session, team_id)
    if not any(m.user_id == user_uuid for m in members):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )
    
    try:
        success = ExpenseCategoryService.delete_team_custom_category(
            session,
            category_id,
            team_id,
            user_id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        
        return {"message": "Category deleted successfully"}
    
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )