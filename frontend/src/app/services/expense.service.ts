import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import axios, { AxiosInstance } from 'axios';
import { environment } from '../../environments/environment';
import { Expense } from '../models/index';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
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
      'Authorization': `Bearer ${token}`
    };
  }

  createExpense(
    teamId: string,
    totalAmount: number,
    participants: string[],
    typeLabel: string = 'Other',
    typeEmoji: string = '💰',
    note?: string
  ): Observable<Expense> {
    return new Observable(observer => {
      this.api.post<Expense>('/expenses', {
        team_id: teamId,
        total_amount: totalAmount,
        participants,
        type_label: typeLabel,
        type_emoji: typeEmoji,
        note
      }, {
        headers: this.getHeaders()
      })
      .then(response => {
        observer.next(response.data);
        observer.complete();
      })
      .catch(error => observer.error(error));
    });
  }

  listExpenses(teamId: string, limit: number = 100, offset: number = 0): Observable<Expense[]> {
    return new Observable(observer => {
      this.api.get<Expense[]>(`/expenses/${teamId}?limit=${limit}&offset=${offset}`, {
        headers: this.getHeaders()
      })
      .then(response => {
        observer.next(response.data);
        observer.complete();
      })
      .catch(error => observer.error(error));
    });
  }

  getExpense(teamId: string, expenseId: string): Observable<Expense> {
    return new Observable(observer => {
      this.api.get<Expense>(`/expenses/${teamId}/${expenseId}`, {
        headers: this.getHeaders()
      })
      .then(response => {
        observer.next(response.data);
        observer.complete();
      })
      .catch(error => observer.error(error));
    });
  }

  deleteExpense(expenseId: string): Observable<any> {
    return new Observable(observer => {
      this.api.delete(`/expenses/${expenseId}`, {
        headers: this.getHeaders()
      })
      .then(response => {
        observer.next(response.data);
        observer.complete();
      })
      .catch(error => observer.error(error));
    });
  }
}
