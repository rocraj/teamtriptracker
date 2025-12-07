import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import axios, { AxiosInstance } from 'axios';
import { environment } from '../../environments/environment';
import { Balance, Settlement, SettlementResponse } from '../models/index';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SummaryService {
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

  getBalances(teamId: string): Observable<any> {
    return new Observable(observer => {
      this.api.get(`/summary/${teamId}/balances`, {
        headers: this.getHeaders()
      })
      .then(response => {
        observer.next(response.data);
        observer.complete();
      })
      .catch(error => observer.error(error));
    });
  }

  getSettlements(teamId: string): Observable<SettlementResponse> {
    return new Observable(observer => {
      this.api.get<SettlementResponse>(`/summary/${teamId}/settlements`, {
        headers: this.getHeaders()
      })
      .then(response => {
        observer.next(response.data);
        observer.complete();
      })
      .catch(error => observer.error(error));
    });
  }

  getNextPayer(teamId: string): Observable<any> {
    return new Observable(observer => {
      this.api.get(`/summary/${teamId}/next-payer`, {
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
