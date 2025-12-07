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
