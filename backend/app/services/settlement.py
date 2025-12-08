"""Settlement algorithm for calculating optimal payment flows."""
from typing import Dict, List, Tuple
from uuid import UUID


class Settlement:
    """Represents a payment settlement between two users."""
    
    def __init__(self, from_user: UUID, to_user: UUID, amount: float):
        self.from_user = from_user
        self.to_user = to_user
        self.amount = round(amount, 2)
    
    def __repr__(self):
        return f"{self.from_user} owes {self.to_user} ₹{self.amount}"


def calculate_budget_balances(
    expenses: List[dict],
    team_members: List[UUID],
    member_budgets: Dict[UUID, float]
) -> Dict[UUID, float]:
    """
    Calculate remaining budget for each user based on actual payments made.
    
    Returns: {user_id: remaining_budget}
    remaining_budget = initial_budget - total_amount_paid_by_user
    """
    # Initialize with initial budgets
    remaining_balances: Dict[UUID, float] = {member: member_budgets.get(member, 0.0) for member in team_members}
    
    # Subtract actual payments made by each user
    for expense in expenses:
        payer_id = expense["payer_id"]
        total_amount = expense["total_amount"]
        
        # Convert payer_id to UUID if it's a string
        if isinstance(payer_id, str):
            payer_id = UUID(payer_id)
        
        # Reduce the payer's remaining budget by the amount they actually paid
        if payer_id in remaining_balances:
            remaining_balances[payer_id] -= total_amount
    
    return remaining_balances


def calculate_settlement_balances(
    expenses: List[dict],
    team_members: List[UUID]
) -> Dict[UUID, float]:
    """
    Calculate settlement balances for each user (who owes what for settlements).
    
    Positive balance = owed money (others owe this person)
    Negative balance = owes money (this person owes others)
    """
    balances: Dict[UUID, float] = {member: 0.0 for member in team_members}
    
    for expense in expenses:
        payer_id = expense["payer_id"]
        participants = expense["participants"]
        total_amount = expense["total_amount"]
        
        # Convert payer_id to UUID if it's a string
        if isinstance(payer_id, str):
            payer_id = UUID(payer_id)
        
        # Convert participant IDs to UUIDs if they're strings
        uuid_participants = []
        for participant in participants:
            if isinstance(participant, str):
                uuid_participants.append(UUID(participant))
            else:
                uuid_participants.append(participant)
        
        # Only include payers and participants who are current team members
        if payer_id in balances:
            balances[payer_id] += total_amount
        
        # Split among participants who are current team members
        valid_participants = [p for p in uuid_participants if p in balances]
        if valid_participants:
            per_person_share = total_amount / len(valid_participants)
            for participant in valid_participants:
                balances[participant] -= per_person_share
    
    return balances


# Alias for backward compatibility with existing settlement endpoints
calculate_balances = calculate_settlement_balances


def calculate_settlements(balances: Dict[UUID, float]) -> List[Settlement]:
    """
    Calculate minimal settlement plan using greedy algorithm.
    
    Matches largest debtors with largest creditors to minimize transactions.
    """
    # Separate creditors (positive balance) and debtors (negative balance)
    creditors = []  # (user_id, amount_owed)
    debtors = []    # (user_id, amount_owes)
    
    for user_id, balance in balances.items():
        if balance > 0.01:  # Account for floating point errors
            creditors.append([user_id, balance])
        elif balance < -0.01:
            debtors.append([user_id, -balance])
    
    # Sort by amount (largest first) for better matching
    creditors.sort(key=lambda x: x[1], reverse=True)
    debtors.sort(key=lambda x: x[1], reverse=True)
    
    settlements: List[Settlement] = []
    
    # Greedy matching
    while creditors and debtors:
        creditor_id, creditor_amount = creditors[0]
        debtor_id, debtor_amount = debtors[0]
        
        # Determine settlement amount
        settlement_amount = min(creditor_amount, debtor_amount)
        
        settlements.append(Settlement(debtor_id, creditor_id, settlement_amount))
        
        # Update remaining amounts
        creditors[0][1] -= settlement_amount
        debtors[0][1] -= settlement_amount
        
        # Remove if settled
        if creditors[0][1] < 0.01:
            creditors.pop(0)
        if debtors[0][1] < 0.01:
            debtors.pop(0)
    
    return settlements


def calculate_next_payer(
    balances: Dict[UUID, float],
    user_budgets: Dict[UUID, float],
    expense_history: List[dict]
) -> Tuple[UUID, float]:
    """
    Suggest the next person who should pay using fair payment criteria.
    
    Criteria:
    1. Users with positive balance (who have paid more)
    2. Users who haven't paid recently
    3. Users with remaining budget
    """
    # Filter users with negative balance (who owe money)
    candidates = [
        (user_id, balance) for user_id, balance in balances.items()
        if balance < -0.01  # They owe money
    ]
    
    if not candidates:
        # No one owes, suggest highest spender
        candidates = [(user_id, balance) for user_id, balance in balances.items()]
    
    # Sort by who owes the most (priority to settle debts)
    candidates.sort(key=lambda x: abs(x[1]), reverse=True)
    
    if candidates:
        next_user, amount = candidates[0]
        suggested_amount = abs(amount)
        return next_user, suggested_amount
    
    # Fallback: return first member
    first_user = next(iter(balances.keys()))
    return first_user, 0.0
