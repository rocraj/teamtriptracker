import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import axios, { AxiosInstance } from 'axios';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
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

  /**
   * Get invitation info without authentication
   * Used for displaying invitation details before signup/login
   */
  getInvitationInfo(token: string): Observable<any> {
    return new Observable(observer => {
      this.api.get(`/teams/invitations/info/${token}`)
        .then(response => {
          observer.next(response.data);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  /**
   * Accept an invitation and join the team
   * Requires authentication
   */
  acceptInvitation(token: string): Observable<any> {
    return new Observable(observer => {
      this.api.post('/teams/accept-invite/invite', 
        { token },
        {
          headers: this.getHeaders()
        }
      )
        .then(response => {
          observer.next(response.data);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  /**
   * Get pending invitations for a team
   * Only team members can view
   */
  getTeamInvitations(teamId: string): Observable<any[]> {
    return new Observable(observer => {
      this.api.get(`/teams/${teamId}/invitations`, {
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
