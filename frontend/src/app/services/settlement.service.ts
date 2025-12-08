import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import axios, { AxiosInstance } from 'axios';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface SettlementRequest {
  id: string;
  type: 'sent' | 'received';
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  other_user_id: string;
  other_user_name: string;
  message?: string;
  created_at: string;
  expires_at: string;
}

export interface CreateSettlementRequest {
  to_user_id: string;
  amount: number;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SettlementService {
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

  createSettlementRequest(teamId: string, request: CreateSettlementRequest): Observable<any> {
    return new Observable(observer => {
      this.api.post(`/settlements/${teamId}/create`, request, {
        headers: this.getHeaders()
      })
      .then(response => {
        observer.next(response.data);
        observer.complete();
      })
      .catch(error => {
        console.error('Settlement request error:', error);
        console.error('Error response:', error.response?.data);
        observer.error(error);
      });
    });
  }

  approveSettlement(settlementId: string): Observable<any> {
    return new Observable(observer => {
      this.api.post('/settlements/approve', { settlement_id: settlementId }, {
        headers: this.getHeaders()
      })
      .then(response => {
        observer.next(response.data);
        observer.complete();
      })
      .catch(error => observer.error(error));
    });
  }

  getUserSettlementRequests(teamId: string): Observable<{ settlement_requests: SettlementRequest[] }> {
    return new Observable(observer => {
      this.api.get(`/settlements/${teamId}/requests`, {
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