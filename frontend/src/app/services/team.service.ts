import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import axios, { AxiosInstance } from 'axios';
import { environment } from '../../environments/environment';
import { Team, TeamMember } from '../models/index';
import { AuthService } from './auth.service';

export interface SendInvitationsRequest {
  emails: string[];
}

export interface BulkInvitationResult {
  team_id: string;
  invited_emails: string[];
  added_existing_users: string[];
  failed_emails: string[];
  total_invitations_sent: number;
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {
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

  createTeam(name: string, trip_budget?: number): Observable<Team> {
    return new Observable(observer => {
      const payload: any = { name };
      if (trip_budget !== undefined && trip_budget !== null) {
        payload.trip_budget = trip_budget;
      }
      this.api.post<Team>('/teams', payload, {
        headers: this.getHeaders()
      })
      .then(response => {
        observer.next(response.data);
        observer.complete();
      })
      .catch(error => observer.error(error));
    });
  }

  listTeams(): Observable<Team[]> {
    return new Observable(observer => {
      this.api.get<Team[]>('/teams', {
        headers: this.getHeaders()
      })
      .then(response => {
        observer.next(response.data);
        observer.complete();
      })
      .catch(error => observer.error(error));
    });
  }

  getTeam(teamId: string): Observable<Team> {
    return new Observable(observer => {
      this.api.get<Team>(`/teams/${teamId}`, {
        headers: this.getHeaders()
      })
      .then(response => {
        observer.next(response.data);
        observer.complete();
      })
      .catch(error => observer.error(error));
    });
  }

  inviteMember(teamId: string, email: string): Observable<any> {
    return new Observable(observer => {
      this.api.post(`/teams/${teamId}/invite?email=${encodeURIComponent(email)}`, {}, {
        headers: this.getHeaders()
      })
      .then(response => {
        observer.next(response.data);
        observer.complete();
      })
      .catch(error => observer.error(error));
    });
  }

  /**
   * Send bulk invitation emails to multiple users
   * Creates invitations for new users, adds existing users directly to team
   */
  sendBulkInvitations(teamId: string, emails: string[]): Observable<BulkInvitationResult> {
    return new Observable(observer => {
      this.api.post<BulkInvitationResult>(
        `/teams/${teamId}/send-invites`,
        { emails } as SendInvitationsRequest,
        { headers: this.getHeaders() }
      )
      .then(response => {
        observer.next(response.data);
        observer.complete();
      })
      .catch(error => observer.error(error));
    });
  }

  setMemberBudget(teamId: string, userId: string, budget: number): Observable<TeamMember> {
    return new Observable(observer => {
      this.api.post<TeamMember>(`/teams/${teamId}/budget`, {
        user_id: userId,
        budget_amount: budget
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

  getMembers(teamId: string): Observable<TeamMember[]> {
    return new Observable(observer => {
      this.api.get<TeamMember[]>(`/teams/${teamId}/members`, {
        headers: this.getHeaders()
      })
      .then(response => {
        observer.next(response.data);
        observer.complete();
      })
      .catch(error => observer.error(error));
    });
  }

  deleteTeam(teamId: string): Observable<any> {
    return new Observable(observer => {
      this.api.delete(`/teams/${teamId}`, {
        headers: this.getHeaders()
      })
      .then(response => {
        observer.next(response.data);
        observer.complete();
      })
      .catch(error => observer.error(error));
    });
  }

  addTeamMember(teamId: string, userId: string): Observable<TeamMember> {
    return new Observable(observer => {
      this.api.post<TeamMember>(`/teams/${teamId}/members`, {
        user_id: userId
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
}
