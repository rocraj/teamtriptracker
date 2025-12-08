"""Budget tracking and smart suggestions service."""

from typing import List, Dict, Optional, Tuple
from uuid import UUID
from sqlmodel import Session, select
from ..models.schemas import TeamMember, Expense, User
from .expense import ExpenseService
from . import settlement as settlement_module


class BudgetService:
    """Service for budget tracking and smart payer suggestions."""
    
    @staticmethod
    def get_member_budget_status(session: Session, team_id: str) -> List[Dict]:
        """Get budget status for all team members."""
        # Get all team members with their budgets
        members_query = select(TeamMember, User).join(
            User, TeamMember.user_id == User.id
        ).where(TeamMember.team_id == UUID(team_id))
        
        member_results = session.exec(members_query).all()
        
        # Get current balances using the settlement calculation logic
        members = [member for member, user in member_results]
        expenses = ExpenseService.get_team_expenses(session, team_id, limit=10000)
        
        # Parse expenses into format expected by settlement calculator
        expense_list = []
        team_member_ids = [str(m.user_id) for m in members]
        
        for expense in expenses:
            participants = ExpenseService.get_expense_participants(expense)
            expense_list.append({
                "payer_id": str(expense.payer_id),
                "participants": participants,
                "total_amount": expense.total_amount
            })
        
        # Calculate budget balances (actual payments made, not settlement splits)
        # Convert team member IDs to UUIDs for calculation
        team_member_uuids = [UUID(uid) for uid in team_member_ids]
        member_budgets = {member.user_id: member.initial_budget for member in members}
        remaining_budgets = settlement_module.calculate_budget_balances(
            expense_list, team_member_uuids, member_budgets
        )
        
        budget_status = []
        for member, user in member_results:
            # Get remaining budget for this member
            remaining_budget = remaining_budgets.get(member.user_id, member.initial_budget)
            total_spent = member.initial_budget - remaining_budget
            
            budget_status.append({
                "user_id": str(member.user_id),
                "user_name": user.name,
                "user_email": user.email,
                "initial_budget": member.initial_budget,
                "current_balance": remaining_budget,  # Remaining budget, not settlement balance
                "remaining_budget": remaining_budget,
                "total_spent": max(0, total_spent),  # Ensure non-negative spending
                "budget_utilization_percentage": (total_spent / member.initial_budget * 100) if member.initial_budget > 0 else 0,
                "is_over_budget": remaining_budget < 0,
                "available_to_pay": remaining_budget > 0
            })
        
        return budget_status
    
    @staticmethod
    def suggest_optimal_payer(session: Session, team_id: str, expense_amount: float) -> Optional[Dict]:
        """Suggest the best member to pay for an expense based on budget availability."""
        budget_status = BudgetService.get_member_budget_status(session, team_id)
        
        # Filter members who can afford the expense
        affordable_members = [
            member for member in budget_status 
            if member["remaining_budget"] >= expense_amount and member["available_to_pay"]
        ]
        
        if not affordable_members:
            return None
        
        # Sort by most available budget (highest remaining budget)
        optimal_payer = max(affordable_members, key=lambda x: x["remaining_budget"])
        
        return {
            "suggested_payer": optimal_payer,
            "reason": "highest_available_budget",
            "confidence_score": min(100, (optimal_payer["remaining_budget"] / expense_amount) * 50),
            "alternative_payers": sorted(
                [m for m in affordable_members if m["user_id"] != optimal_payer["user_id"]], 
                key=lambda x: x["remaining_budget"], 
                reverse=True
            )[:2]  # Top 2 alternatives
        }
    
    @staticmethod
    def update_member_budget(session: Session, team_id: str, user_id: str, new_budget: float) -> bool:
        """Update a team member's budget."""
        try:
            member_query = select(TeamMember).where(
                TeamMember.team_id == UUID(team_id),
                TeamMember.user_id == UUID(user_id)
            )
            member = session.exec(member_query).first()
            
            if not member:
                return False
            
            member.initial_budget = new_budget
            session.add(member)
            session.commit()
            session.refresh(member)
            return True
            
        except Exception:
            session.rollback()
            return False
    
    @staticmethod
    def get_budget_insights(session: Session, team_id: str) -> Dict:
        """Get team budget insights and recommendations."""
        budget_status = BudgetService.get_member_budget_status(session, team_id)
        
        total_initial_budget = sum(member["initial_budget"] for member in budget_status)
        total_remaining = sum(member["remaining_budget"] for member in budget_status)
        total_spent = sum(member["total_spent"] for member in budget_status)
        
        over_budget_members = [m for m in budget_status if m["is_over_budget"]]
        under_budget_members = [m for m in budget_status if not m["is_over_budget"] and m["remaining_budget"] > 0]
        
        return {
            "team_summary": {
                "total_initial_budget": total_initial_budget,
                "total_remaining_budget": total_remaining,
                "total_spent": total_spent,
                "budget_utilization_percentage": (total_spent / total_initial_budget * 100) if total_initial_budget > 0 else 0
            },
            "members_over_budget": len(over_budget_members),
            "members_under_budget": len(under_budget_members),
            "recommendations": BudgetService._generate_recommendations(budget_status),
            "member_details": budget_status
        }
    
    @staticmethod
    def _generate_recommendations(budget_status: List[Dict]) -> List[str]:
        """Generate budget recommendations based on current status."""
        recommendations = []
        
        over_budget_count = len([m for m in budget_status if m["is_over_budget"]])
        high_utilization_count = len([m for m in budget_status if m["budget_utilization_percentage"] > 80])
        
        if over_budget_count > 0:
            recommendations.append(f"{over_budget_count} member(s) are over budget. Consider budget adjustments or expense reallocation.")
        
        if high_utilization_count > 0:
            recommendations.append(f"{high_utilization_count} member(s) have used >80% of their budget. Monitor spending closely.")
        
        # Find members with significantly more budget remaining
        avg_remaining = sum(m["remaining_budget"] for m in budget_status) / len(budget_status)
        high_budget_members = [m for m in budget_status if m["remaining_budget"] > avg_remaining * 1.5]
        
        if high_budget_members:
            recommendations.append(f"Consider having {', '.join([m['user_name'] for m in high_budget_members[:2]])} cover more expenses.")
        
        if not recommendations:
            recommendations.append("Budget allocation looks balanced across team members.")
        
        return recommendations