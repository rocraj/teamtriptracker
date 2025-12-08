"""Settlement request API endpoints."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from uuid import UUID

from app.core.database import get_session
from app.core.security import get_current_user_id
from app.services.team import TeamService
from app.services.settlement_request import SettlementRequestService
from app.models.schemas import CreateSettlementRequest, ApproveSettlementRequest

router = APIRouter(prefix="/settlements", tags=["settlements"])


@router.post("/{team_id}/create")
def create_settlement_request(
    team_id: str,
    request: CreateSettlementRequest,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Create a new settlement request."""
    # Verify user is a team member
    user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
    members = TeamService.get_team_members(session, team_id)
    if not any(m.user_id == user_uuid for m in members):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )
    
    try:
        settlement = SettlementRequestService.create_settlement_request(
            session=session,
            team_id=team_id,
            from_user_id=user_id,
            to_user_id=request.to_user_id,
            amount=request.amount,
            message=request.message
        )
        
        return {
            "settlement_id": str(settlement.id),
            "message": "Settlement request created successfully",
            "status": settlement.status,
            "expires_at": settlement.expires_at
        }
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create settlement request"
        )


@router.post("/approve")
def approve_settlement(
    request: ApproveSettlementRequest,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Approve a settlement request."""
    try:
        settlement = SettlementRequestService.approve_settlement(
            session=session,
            settlement_id=request.settlement_id,
            approver_user_id=user_id
        )
        
        return {
            "settlement_id": str(settlement.id),
            "message": "Settlement approved successfully",
            "amount": settlement.amount,
            "approved_at": settlement.approved_at
        }
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to approve settlement"
        )


@router.get("/{team_id}/requests")
def get_user_settlement_requests(
    team_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Get all settlement requests for the current user in a team."""
    # Verify user is a team member
    user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
    members = TeamService.get_team_members(session, team_id)
    if not any(m.user_id == user_uuid for m in members):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )
    
    try:
        settlement_requests = SettlementRequestService.get_user_settlement_requests(
            session=session,
            team_id=team_id,
            user_id=user_id
        )
        
        return {
            "team_id": team_id,
            "settlement_requests": settlement_requests,
            "total_requests": len(settlement_requests)
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve settlement requests"
        )