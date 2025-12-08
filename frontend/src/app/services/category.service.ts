import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ExpenseCategory {
  id: string;
  name: string;
  emoji: string;
  is_default: boolean;
  color?: string;
}

export interface TeamCustomCategory {
  id: string;
  team_id: string;
  name: string;
  emoji: string;
  created_by: string;
  created_at: string;
  modified_at: string;
  color?: string;
}

export interface TeamCategoriesResponse {
  default: ExpenseCategory[];
  custom: TeamCustomCategory[];
}

export interface CreateCustomCategoryRequest {
  name: string;
  emoji: string;
  team_id: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly apiUrl = `${environment.apiUrl}/categories`;
  
  private readonly additionalEmojis = [
    // Money & Shopping
    '💰', '💴', '💵', '💶', '💷', '💸', '💳', '🧾', '🛒', '🛍️',
    // Food & Drinks  
    '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🥝', '🍅',
    '🍞', '🥐', '🥨', '🧀', '🥚', '🍳', '🥓', '🥞', '🧇', '🥗',
    '☕', '🍵', '🧃', '🥤', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸',
    // Travel & Transport
    '✈️', '🛩️', '🛫', '🛬', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️',
    '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵',
    '🚲', '🛴', '🛹', '🛼', '🚁', '🚠', '🚡', '🛶', '⛵', '🚤',
    // Entertainment & Activities
    '🎬', '🎭', '🎪', '🎨', '🎮', '🎯', '🎲', '🃏', '🎸', '🎹',
    '🥁', '🎺', '🎻', '🎤', '🎧', '🎵', '🎶', '🎼', '🎩', '🎭',
    // Sports & Fitness
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
    '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥊', '🥋', '🎽', '🏋️',
    // Objects & Tech
    '📱', '📞', '☎️', '📟', '📠', '🔋', '🔌', '💻', '🖥️', '🖨️',
    '⌨️', '🖱️', '📀', '💽', '💾', '💿', '📷', '📹', '📼', '🎥'
  ];

  private readonly categoryColors = {
    travel: 'bg-blue-100 text-blue-800',
    food: 'bg-green-100 text-green-800',
    entertainment: 'bg-purple-100 text-purple-800',
    stay: 'bg-yellow-100 text-yellow-800',
    personal: 'bg-pink-100 text-pink-800',
    default: 'bg-gray-100 text-gray-800'
  };

  constructor(private http: HttpClient) { }

  getDefaultCategories(): Observable<ExpenseCategory[]> {
    return this.http.get<ExpenseCategory[]>(`${this.apiUrl}/default`);
  }

  getTeamCategories(teamId: string): Observable<TeamCategoriesResponse> {
    return this.http.get<TeamCategoriesResponse>(`${this.apiUrl}/team/${teamId}`);
  }

  createTeamCustomCategory(teamId: string, data: CreateCustomCategoryRequest): Observable<TeamCustomCategory> {
    return this.http.post<TeamCustomCategory>(`${this.apiUrl}/team/${teamId}/custom`, data);
  }

  deleteTeamCustomCategory(teamId: string, categoryId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/team/${teamId}/custom/${categoryId}`);
  }

  getAdditionalEmojis(): string[] {
    return [...this.additionalEmojis];
  }

  getCategoryColor(categoryName: string): string {
    const key = categoryName.toLowerCase() as keyof typeof this.categoryColors;
    return this.categoryColors[key] || this.categoryColors.default;
  }

  getAllEmojis(): string[] {
    // This method can be used for the emoji picker
    // We'll get the current categories and extract their emojis
    return [...this.additionalEmojis];
  }
}