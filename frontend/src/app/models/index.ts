export interface User {
  id: string;
  email: string;
  name: string;
  photo_url?: string;
  auth_provider: 'google' | 'email';
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  trip_budget?: number;
  created_by: string;
  created_at: string;
  member_count?: number;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  initial_budget: number;
  created_at: string;
  modified_at: string;
  user_name: string;
  user_email: string;
}

export interface BudgetStatus {
  user_id: string;
  user_name: string;
  user_email: string;
  initial_budget: number;
  current_balance: number;
  remaining_budget: number;
  total_spent: number;
  budget_utilization_percentage: number;
  is_over_budget: boolean;
  available_to_pay: boolean;
}

export interface BudgetInsights {
  team_summary: {
    total_initial_budget: number;
    total_remaining_budget: number;
    total_spent: number;
    budget_utilization_percentage: number;
  };
  members_over_budget: number;
  members_under_budget: number;
  recommendations: string[];
  member_details: BudgetStatus[];
}

export interface PayerSuggestion {
  suggested_payer: BudgetStatus;
  reason: string;
  confidence_score: number;
  alternative_payers: BudgetStatus[];
}

export interface Expense {
  id: string;
  team_id: string;
  payer_id: string;
  total_amount: number;
  participants: string[];
  category_id?: string;
  team_category_id?: string;
  note?: string;
  created_at: string;
  modified_at: string;
  category?: {
    id: string;
    name: string;
    emoji: string;
    is_default: boolean;
  };
  team_category?: {
    id: string;
    team_id: string;
    name: string;
    emoji: string;
    created_by: string;
    created_at: string;
    modified_at: string;
  };
  // Legacy fields for backward compatibility
  type_label?: string;
  type_emoji?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Balance {
  [userId: string]: number;
}

export interface Settlement {
  from_user: string;
  to_user: string;
  amount: number;
}

export interface SettlementResponse {
  team_id: string;
  settlements: Settlement[];
  total_transactions: number;
}
