import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import axios, { AxiosInstance } from 'axios';
import { environment } from '../../environments/environment';
import { User, TokenResponse } from '../models/index';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private tokenSubject = new BehaviorSubject<string | null>(localStorage.getItem('token'));
  public token$ = this.tokenSubject.asObservable();
  
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: environment.apiUrl,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Load user from localStorage if token exists
    const token = localStorage.getItem('token');
    if (token) {
      this.tokenSubject.next(token);
      this.loadCurrentUser(token);
    }
  }

  register(email: string, name: string, password: string, invitationToken?: string): Observable<TokenResponse> {
    return new Observable(observer => {
      const payload: any = {
        email,
        name,
        password,
        auth_provider: 'email'
      };

      // Add invitation token if provided
      if (invitationToken) {
        payload.invitation_token = invitationToken;
      }

      this.api.post<TokenResponse>('/auth/register', payload)
      .then(response => {
        this.setToken(response.data.access_token);
        observer.next(response.data);
        observer.complete();
      })
      .catch(error => observer.error(error));
    });
  }

  login(email: string, password: string): Observable<TokenResponse> {
    return new Observable(observer => {
      this.api.post<TokenResponse>('/auth/login', {
        email,
        password
      })
      .then(response => {
        this.setToken(response.data.access_token);
        observer.next(response.data);
        observer.complete();
      })
      .catch(error => observer.error(error));
    });
  }

  googleSignIn(email: string, name: string, photoUrl?: string): Observable<TokenResponse> {
    return new Observable(observer => {
      this.api.post<TokenResponse>('/auth/google-signin', {
        email,
        name,
        photo_url: photoUrl
      })
      .then(response => {
        this.setToken(response.data.access_token);
        observer.next(response.data);
        observer.complete();
      })
      .catch(error => observer.error(error));
    });
  }

  requestMagicLink(email: string): Observable<any> {
    return new Observable(observer => {
      this.api.post('/auth/email/request-link', { email })
      .then(response => {
        observer.next(response.data);
        observer.complete();
      })
      .catch(error => observer.error(error));
    });
  }

  verifyMagicLink(token: string): Observable<TokenResponse> {
    return new Observable(observer => {
      this.api.get<TokenResponse>(`/auth/email/verify?token=${token}`)
      .then(response => {
        this.setToken(response.data.access_token);
        observer.next(response.data);
        observer.complete();
      })
      .catch(error => observer.error(error));
    });
  }

  private loadCurrentUser(token: string): void {
    this.api.get<User>('/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
      this.currentUserSubject.next(response.data);
    })
    .catch(() => {
      // Token invalid, clear it
      this.logout();
    });
  }

  private setToken(token: string): void {
    localStorage.setItem('token', token);
    this.tokenSubject.next(token);
    this.loadCurrentUser(token);
  }

  logout(): void {
    localStorage.removeItem('token');
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Get the email of the currently authenticated user
   * Returns null if no user is authenticated
   */
  getCurrentUserEmail(): string | null {
    const currentUser = this.currentUserSubject.value;
    return currentUser?.email || null;
  }

  /**
   * Get the current user object
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}
