import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import axios, { AxiosInstance } from 'axios';
import { environment } from '../../environments/environment';
import { Team, TeamMember } from '../models/index';
import { AuthService } from './auth.service';

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

  createTeam(name: string): Observable<Team> {
    return new Observable(observer => {
      this.api.post<Team>('/teams', { name }, {
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
