import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import axios, { AxiosInstance } from 'axios';
import { environment } from '../../environments/environment';
import { BudgetStatus, BudgetInsights, PayerSuggestion } from '../models/index';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private api: AxiosInstance;

  constructor(private authService: AuthService) {
    this.api = axios.create({
      baseURL: environment.apiUrl,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private getHeaders() {
    const token = this.authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  getBudgetStatus(teamId: string): Observable<BudgetStatus[]> {
    return new Observable(observer => {
      this.api.get<{budget_status: BudgetStatus[]}>(`/teams/${teamId}/budget-status`, {
        headers: this.getHeaders()
      })
      .then(response => {
        observer.next(response.data.budget_status);
        observer.complete();
      })
      .catch(error => observer.error(error));
    });
  }

  getBudgetInsights(teamId: string): Observable<BudgetInsights> {
    return new Observable(observer => {
      this.api.get<BudgetInsights>(`/teams/${teamId}/budget-insights`, {
        headers: this.getHeaders()
      })
      .then(response => {
        observer.next(response.data);
        observer.complete();
      })
      .catch(error => observer.error(error));
    });
  }

  suggestOptimalPayer(teamId: string, amount: number): Observable<PayerSuggestion | null> {
    return new Observable(observer => {
      this.api.post<{suggestion: PayerSuggestion | null, message?: string}>(`/teams/${teamId}/suggest-payer`, 
        { amount }, 
        { headers: this.getHeaders() }
      )
      .then(response => {
        observer.next(response.data.suggestion);
        observer.complete();
      })
      .catch(error => observer.error(error));
    });
  }

  updateMemberBudget(teamId: string, userId: string, budget: number): Observable<boolean> {
    return new Observable(observer => {
      this.api.put<{success: boolean}>(`/teams/${teamId}/members/${userId}/budget`, 
        { budget }, 
        { headers: this.getHeaders() }
      )
      .then(response => {
        observer.next(response.data.success);
        observer.complete();
      })
      .catch(error => observer.error(error));
    });
  }

  recalculateBudgetsEqually(teamId: string): Observable<boolean> {
    return new Observable(observer => {
      this.api.post<{success: boolean}>(`/teams/${teamId}/recalculate-budgets`, 
        {}, 
        { headers: this.getHeaders() }
      )
      .then(response => {
        observer.next(response.data.success);
        observer.complete();
      })
      .catch(error => observer.error(error));
    });
  }
}