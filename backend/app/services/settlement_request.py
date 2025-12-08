"""Settlement request management service."""
from uuid import UUID, uuid4
from datetime import datetime, timedelta
from typing import List, Optional
from sqlmodel import Session, select
from ..models.schemas import (
    SettlementRequest, SettlementStatus, User, TeamMember, Team
)
from .email import EmailService


class SettlementRequestService:
    """Service for managing settlement requests and approvals."""
    
    @staticmethod
    def create_settlement_request(
        session: Session,
        team_id: str,
        from_user_id: str,
        to_user_id: str,
        amount: float,
        message: Optional[str] = None
    ) -> SettlementRequest:
        """Create a new settlement request."""
        # Verify both users are team members
        team_uuid = UUID(team_id)
        from_uuid = UUID(from_user_id)
        to_uuid = UUID(to_user_id)
        
        print(f"Creating settlement request: team={team_uuid}, from={from_uuid}, to={to_uuid}, amount={amount}")
        
        from_member = session.exec(
            select(TeamMember).where(
                (TeamMember.team_id == team_uuid) & 
                (TeamMember.user_id == from_uuid)
            )
        ).first()
        
        to_member = session.exec(
            select(TeamMember).where(
                (TeamMember.team_id == team_uuid) & 
                (TeamMember.user_id == to_uuid)
            )
        ).first()
        
        print(f"Found members: from_member={from_member is not None}, to_member={to_member is not None}")
        
        if not from_member or not to_member:
            # Get all team members for debugging
            all_members = session.exec(select(TeamMember).where(TeamMember.team_id == team_uuid)).all()
            member_ids = [str(m.user_id) for m in all_members]
            print(f"Team members: {member_ids}")
            print(f"Looking for from_user: {from_user_id}, to_user: {to_user_id}")
            raise ValueError("Both users must be team members")
        
        # Check for existing pending settlement between these users
        existing = session.exec(
            select(SettlementRequest).where(
                (SettlementRequest.team_id == team_uuid) &
                (SettlementRequest.from_user_id == from_uuid) &
                (SettlementRequest.to_user_id == to_uuid) &
                (SettlementRequest.status == SettlementStatus.PENDING)
            )
        ).first()
        
        if existing:
            raise ValueError("A pending settlement request already exists between these users")
        
        # Create settlement request
        settlement = SettlementRequest(
            id=uuid4(),
            team_id=team_uuid,
            from_user_id=from_uuid,
            to_user_id=to_uuid,
            amount=amount,
            message=message,
            expires_at=datetime.utcnow() + timedelta(days=7)  # 7 day expiry
        )
        
        session.add(settlement)
        session.commit()
        session.refresh(settlement)
        
        # Send email notification
        SettlementRequestService._send_settlement_request_email(session, settlement)
        
        return settlement
    
    @staticmethod
    def approve_settlement(
        session: Session,
        settlement_id: str,
        approver_user_id: str
    ) -> SettlementRequest:
        """Approve a settlement request and update balances."""
        settlement_uuid = UUID(settlement_id)
        approver_uuid = UUID(approver_user_id)
        
        settlement = session.exec(
            select(SettlementRequest).where(SettlementRequest.id == settlement_uuid)
        ).first()
        
        if not settlement:
            raise ValueError("Settlement request not found")
        
        if settlement.to_user_id != approver_uuid:
            raise ValueError("Only the recipient can approve this settlement")
        
        if settlement.status != SettlementStatus.PENDING:
            raise ValueError("Settlement request is not pending")
        
        if settlement.expires_at < datetime.utcnow():
            settlement.status = SettlementStatus.EXPIRED
            session.commit()
            raise ValueError("Settlement request has expired")
        
        # Update settlement status
        settlement.status = SettlementStatus.APPROVED
        settlement.approved_at = datetime.utcnow()
        
        # Create an offsetting expense to balance the books
        # This represents the settlement payment from debtor to creditor
        from ..models.schemas import Expense
        
        settlement_expense = Expense(
            id=uuid4(),
            team_id=settlement.team_id,
            description=f"Settlement payment: {settlement.message or 'Debt settlement'}",
            total_amount=settlement.amount,
            payer_id=settlement.from_user_id,  # Person who owed money pays
            participants=[settlement.from_user_id, settlement.to_user_id],  # Both involved
            participant_shares={  # Equal split means creditor gets half back
                str(settlement.from_user_id): settlement.amount / 2,
                str(settlement.to_user_id): settlement.amount / 2
            }
        )
        
        session.add(settlement_expense)
        
        session.commit()
        session.refresh(settlement)
        
        # Send confirmation email
        SettlementRequestService._send_settlement_approved_email(session, settlement)
        
        return settlement
    
    @staticmethod
    def get_user_settlement_requests(
        session: Session,
        team_id: str,
        user_id: str
    ) -> List[dict]:
        """Get all settlement requests for a user (sent and received)."""
        team_uuid = UUID(team_id)
        user_uuid = UUID(user_id)
        
        # Get settlements sent by user
        sent_settlements = session.exec(
            select(SettlementRequest).where(
                (SettlementRequest.team_id == team_uuid) &
                (SettlementRequest.from_user_id == user_uuid)
            ).order_by(SettlementRequest.created_at.desc())
        ).all()
        
        # Get settlements received by user
        received_settlements = session.exec(
            select(SettlementRequest).where(
                (SettlementRequest.team_id == team_uuid) &
                (SettlementRequest.to_user_id == user_uuid)
            ).order_by(SettlementRequest.created_at.desc())
        ).all()
        
        # Format response with user names
        result = []
        
        for settlement in sent_settlements:
            to_user = session.exec(select(User).where(User.id == settlement.to_user_id)).first()
            result.append({
                "id": str(settlement.id),
                "type": "sent",
                "amount": settlement.amount,
                "status": settlement.status,
                "other_user_id": str(settlement.to_user_id),
                "other_user_name": to_user.name if to_user else "Unknown",
                "message": settlement.message,
                "created_at": settlement.created_at,
                "expires_at": settlement.expires_at
            })
        
        for settlement in received_settlements:
            from_user = session.exec(select(User).where(User.id == settlement.from_user_id)).first()
            result.append({
                "id": str(settlement.id),
                "type": "received",
                "amount": settlement.amount,
                "status": settlement.status,
                "other_user_id": str(settlement.from_user_id),
                "other_user_name": from_user.name if from_user else "Unknown",
                "message": settlement.message,
                "created_at": settlement.created_at,
                "expires_at": settlement.expires_at
            })
        
        return result
    
    @staticmethod
    def _send_settlement_request_email(session: Session, settlement: SettlementRequest):
        """Send email notification for settlement request."""
        try:
            from_user = session.exec(select(User).where(User.id == settlement.from_user_id)).first()
            to_user = session.exec(select(User).where(User.id == settlement.to_user_id)).first()
            team = session.exec(select(Team).where(Team.id == settlement.team_id)).first()
            
            if from_user and to_user and team:
                subject = f"Settlement Request from {from_user.name}"
                body = f"""
                {from_user.name} has sent you a settlement request for ₹{settlement.amount:.2f} in team "{team.name}".
                
                Message: {settlement.message or "No message"}
                
                Please log in to your account to approve or decline this settlement.
                """
                
                EmailService.send_email(to_user.email, subject, body)
        except Exception as e:
            print(f"Failed to send settlement request email: {e}")
    
    @staticmethod
    def _send_settlement_approved_email(session: Session, settlement: SettlementRequest):
        """Send email notification when settlement is approved."""
        try:
            from_user = session.exec(select(User).where(User.id == settlement.from_user_id)).first()
            to_user = session.exec(select(User).where(User.id == settlement.to_user_id)).first()
            team = session.exec(select(Team).where(Team.id == settlement.team_id)).first()
            
            if from_user and to_user and team:
                # Email to requester
                subject = f"Settlement Approved by {to_user.name}"
                body = f"""
                Great news! {to_user.name} has approved your settlement request for ₹{settlement.amount:.2f} in team "{team.name}".
                
                The settlement has been completed and balances have been updated.
                """
                
                EmailService.send_email(from_user.email, subject, body)
                
                # Email to approver
                subject = f"Settlement Completed"
                body = f"""
                You have successfully approved a settlement request from {from_user.name} for ₹{settlement.amount:.2f} in team "{team.name}".
                
                Your budget has been credited with ₹{settlement.amount:.2f}.
                """
                
                EmailService.send_email(to_user.email, subject, body)
        except Exception as e:
            print(f"Failed to send settlement approved email: {e}")