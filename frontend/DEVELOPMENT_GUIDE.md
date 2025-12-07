# TeamTripTracker Frontend - Development Guide

Complete reference for building features using established patterns. All new features should follow these patterns.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication Pattern](#authentication-pattern)
3. [Teams Feature Pattern](#teams-feature-pattern)
4. [Add Team Member Pattern](#add-team-member-pattern)
5. [Invitation Acceptance Pattern](#invitation-acceptance-pattern)
6. [Feature Implementation Template](#feature-implementation-template)
7. [Service Layer Pattern](#service-layer-pattern)
8. [Component Patterns](#component-patterns)
9. [State Management](#state-management)
10. [Error Handling](#error-handling)
11. [Best Practices](#best-practices)

---

## Architecture Overview

```
Frontend Architecture:
├── Services (Data Layer)
│   ├── auth.service.ts - Authentication & user state
│   ├── team.service.ts - Team & member management
│   ├── expense.service.ts - Expense operations
│   └── summary.service.ts - Balances & settlements
│
├── Components
│   ├── Pages (Route-level components)
│   │   ├── login.page.ts
│   │   ├── signup.page.ts
│   │   ├── dashboard.page.ts
│   │   ├── teams.page.ts
│   │   ├── team-detail.page.ts
│   │   └── settings.page.ts
│   │
│   └── Shared Components (Reusable UI)
│       ├── header.component.ts
│       ├── alert.component.ts
│       ├── button.component.ts
│       ├── loading.component.ts
│       ├── create-team-modal.component.ts
│       └── add-team-member-modal.component.ts
│
└── Models
    └── index.ts - Type definitions

API Communication: axios (Observable wrapper)
State Management: RxJS Observables & BehaviorSubjects
Styling: Tailwind CSS
Forms: Two-way binding with ngModel
```

---

## Authentication Pattern

### Service Implementation (auth.service.ts)

```typescript
// State Management with BehaviorSubject
private currentUserSubject = new BehaviorSubject<User | null>(null);
public currentUser$ = this.currentUserSubject.asObservable();

private tokenSubject = new BehaviorSubject<string | null>(localStorage.getItem('token'));
public token$ = this.tokenSubject.asObservable();

// API Methods returning Observables
register(email: string, name: string, password: string): Observable<TokenResponse> {
  return new Observable(observer => {
    this.api.post<TokenResponse>('/auth/register', {
      email, name, password, auth_provider: 'email'
    })
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
    this.api.post<TokenResponse>('/auth/login', { email, password })
    .then(response => {
      this.setToken(response.data.access_token);
      observer.next(response.data);
      observer.complete();
    })
    .catch(error => observer.error(error));
  });
}

// Helper to set token and update state
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
```

### Page Component (signup.page.ts / login.page.ts)

```typescript
export class SignupPageComponent implements OnInit {
  email: string = '';
  name: string = '';
  password: string = '';
  loading: boolean = false;
  error: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  signup(): void {
    if (!this.validateForm()) return;
    
    this.loading = true;
    this.error = '';

    this.authService.register(this.email, this.name, this.password).subscribe(
      (response) => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      }
    );
  }

  validateForm(): boolean {
    if (!this.email.trim()) {
      this.error = 'Email is required';
      return false;
    }
    if (!this.name.trim()) {
      this.error = 'Name is required';
      return false;
    }
    if (!this.password || this.password.length < 6) {
      this.error = 'Password must be at least 6 characters';
      return false;
    }
    return true;
  }
}
```

### Template Pattern

```html
<!-- Form Section -->
<div class="space-y-4">
  <input [(ngModel)]="email" type="email" placeholder="Email" [disabled]="loading" />
  <input [(ngModel)]="password" type="password" placeholder="Password" [disabled]="loading" />
  
  <!-- Error Display -->
  <app-alert *ngIf="error" [message]="error" type="error" [visible]="!!error"></app-alert>
  
  <!-- Submit Button -->
  <app-button 
    (click)="signup()" 
    [disabled]="loading" 
    [text]="loading ? 'Signing up...' : 'Sign Up'">
  </app-button>
</div>
```

---

## Teams Feature Pattern

### Service Implementation (team.service.ts)

```typescript
export class TeamService {
  private api: AxiosInstance;

  constructor(private authService: AuthService) {
    this.api = axios.create({
      baseURL: environment.apiUrl,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get headers with auth token
  private getHeaders() {
    const token = this.authService.getToken();
    return { 'Authorization': `Bearer ${token}` };
  }

  // Create team
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

  // List user's teams
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

  // Get single team
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

  // Get team members
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

  // Invite member by email
  inviteMember(teamId: string, email: string): Observable<any> {
    return new Observable(observer => {
      this.api.post(`/teams/${teamId}/invite`, { email }, {
        headers: this.getHeaders()
      })
      .then(response => {
        observer.next(response.data);
        observer.complete();
      })
      .catch(error => observer.error(error));
    });
  }

  // Set member budget
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
}
```

### Page Component (teams.page.ts)

```typescript
export class TeamsPageComponent implements OnInit {
  teams: Team[] = [];
  loading: boolean = true;
  error: string = '';
  showCreateModal: boolean = false;

  constructor(
    private teamService: TeamService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTeams();
  }

  loadTeams(): void {
    this.loading = true;
    this.error = '';

    this.teamService.listTeams().subscribe(
      (teams) => {
        this.teams = teams;
        this.loading = false;
      },
      (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      }
    );
  }

  openCreateModal(): void {
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  onTeamCreated(newTeam: Team): void {
    this.teams.push(newTeam);
    this.closeCreateModal();
  }

  navigateToTeam(teamId: string): void {
    this.router.navigate(['/teams', teamId]);
  }
}
```

---

## Add Team Member Pattern

### Service Method (team.service.ts)

```typescript
// Add this method to TeamService
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
```

### Modal Component (add-team-member-modal.component.ts)

```typescript
@Component({
  selector: 'app-add-team-member-modal',
  templateUrl: './add-team-member-modal.component.html',
  styleUrls: ['./add-team-member-modal.component.css']
})
export class AddTeamMemberModalComponent {
  @Input() isOpen: boolean = false;
  @Input() teamId: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() memberAdded = new EventEmitter<any>();

  userId: string = '';
  loading: boolean = false;
  error: string = '';
  success: string = '';

  constructor(private teamService: TeamService) {}

  closeModal(): void {
    this.resetForm();
    this.close.emit();
  }

  resetForm(): void {
    this.userId = '';
    this.error = '';
    this.success = '';
  }

  addMember(): void {
    // Validation
    if (!this.userId.trim()) {
      this.error = 'Please enter a user ID';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    // Call service
    this.teamService.addTeamMember(this.teamId, this.userId).subscribe(
      (member) => {
        // Success
        this.success = 'Member added successfully!';
        this.loading = false;
        
        // Auto-close after 1 second
        setTimeout(() => {
          this.memberAdded.emit(member);
          this.closeModal();
        }, 1000);
      },
      (error) => {
        // Error
        this.error = getErrorMessage(error);
        this.loading = false;
      }
    );
  }
}
```

### Modal Template Pattern

```html
<div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
  <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
    <!-- Header -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-gray-900">Add Team Member</h2>
      <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
    </div>

    <!-- Alerts -->
    <app-alert *ngIf="error" [message]="error" type="error" [visible]="!!error"></app-alert>
    <app-alert *ngIf="success" [message]="success" type="success" [visible]="!!success"></app-alert>

    <!-- Form -->
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">User ID</label>
        <input [(ngModel)]="userId" type="text" placeholder="Enter user ID" [disabled]="loading" 
          class="w-full px-4 py-2 border border-gray-300 rounded-lg" />
      </div>

      <!-- Buttons -->
      <div class="flex gap-2 pt-4">
        <button (click)="closeModal()" [disabled]="loading" 
          class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Cancel</button>
        <button (click)="addMember()" [disabled]="loading" 
          class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">
          {{ loading ? 'Adding...' : 'Add Member' }}
        </button>
      </div>
    </div>
  </div>
</div>
```

### Page Integration (team-detail.page.ts)

```typescript
export class TeamDetailPageComponent implements OnInit {
  teamId: string = '';
  team: Team | null = null;
  members: TeamMember[] = [];
  loading: boolean = true;
  error: string = '';
  showAddMemberModal: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private teamService: TeamService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.teamId = params['id'];
      this.loadTeamData();
    });
  }

  loadTeamData(): void {
    this.loading = true;

    this.teamService.getTeam(this.teamId).subscribe(
      (team) => {
        this.team = team;
        this.loadMembers();
      },
      (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      }
    );
  }

  loadMembers(): void {
    this.teamService.getMembers(this.teamId).subscribe(
      (members) => {
        this.members = members;
        this.loading = false;
      },
      (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      }
    );
  }

  openAddMemberModal(): void {
    this.showAddMemberModal = true;
  }

  closeAddMemberModal(): void {
    this.showAddMemberModal = false;
  }

  onMemberAdded(): void {
    this.loadMembers();
    this.closeAddMemberModal();
  }
}
```

---

## Invitation Acceptance Pattern

This pattern handles accepting team invitations through three different flows: direct link, login, and signup.

### Service Layer (InvitationService)

**Location**: `src/app/services/invitation.service.ts`

The invitation service manages all invitation-related API operations with the backend.

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

interface InvitationInfo {
  token: string;
  teamId: string;
  teamName: string;
  inviterName: string;
  inviteeEmail: string;
  expiresAt: string;
  isExpired: boolean;
}

interface AcceptInvitationResponse {
  teamId: string;
  teamName: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  private API_URL = 'http://localhost:8000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getInvitationInfo(token: string): Observable<InvitationInfo> {
    return this.http.get<InvitationInfo>(
      `${this.API_URL}/teams/invitations/info/${token}`
    );
  }

  acceptInvitation(token: string): Observable<AcceptInvitationResponse> {
    return this.http.post<AcceptInvitationResponse>(
      `${this.API_URL}/teams/accept-invite/${token}`,
      {},
      { headers: { Authorization: `Bearer ${this.authService.getToken()}` } }
    );
  }

  getTeamInvitations(teamId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.API_URL}/teams/${teamId}/invitations`,
      { headers: { Authorization: `Bearer ${this.authService.getToken()}` } }
    );
  }
}
```

### Enhanced Login Page with Invitation Support

**Location**: `src/app/pages/login/login.page.ts`

The login page detects invitation tokens in query parameters and allows users to accept after authentication.

**Key Properties Added**:
- `invitationToken`: Stores the token from query params
- `invitationInfo`: Holds invitation details (team name, sender, etc.)
- `invitationLoading`: Loading state for invitation info fetch
- `invitationError`: Error message display for invitation issues
- `acceptanceSuccess`: Tracks successful invitation acceptance

**Key Methods Added**:
- `loadInvitationInfo()`: Fetches public invitation details without auth
- `acceptInvitation()`: Accepts invitation after successful login

**Implementation Example**:

```typescript
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { InvitationService } from '../../services/invitation.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login-page',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.css']
})
export class LoginPageComponent implements OnInit {
  email = '';
  password = '';
  loading = false;
  error = '';

  invitationToken: string | null = null;
  invitationInfo: any = null;
  invitationLoading = false;
  invitationError = '';
  acceptanceSuccess = false;

  constructor(
    private authService: AuthService,
    private invitationService: InvitationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['invite']) {
        this.invitationToken = params['invite'];
        this.loadInvitationInfo();
      }
    });
  }

  loadInvitationInfo() {
    if (!this.invitationToken) return;
    
    this.invitationLoading = true;
    this.invitationService.getInvitationInfo(this.invitationToken).subscribe({
      next: (info) => {
        this.invitationInfo = info;
        this.email = info.inviteeEmail;
        this.invitationLoading = false;
      },
      error: (err) => {
        this.invitationError = 'Unable to load invitation details';
        this.invitationLoading = false;
      }
    });
  }

  login() {
    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        if (this.invitationToken) {
          this.acceptInvitation();
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.error = 'Login failed';
      }
    });
  }

  acceptInvitation() {
    if (!this.invitationToken) return;

    this.invitationService.acceptInvitation(this.invitationToken).subscribe({
      next: (response) => {
        this.acceptanceSuccess = true;
        setTimeout(() => {
          this.router.navigate([`/teams/${response.teamId}`]);
        }, 2000);
      },
      error: (err) => {
        this.invitationError = 'Failed to accept invitation';
      }
    });
  }
}
```

**Template Updates** (`login.page.html`):

```html
<!-- Invitation Banner (shown when invite token present) -->
<div *ngIf="invitationToken" class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
  <div *ngIf="invitationLoading" class="text-center text-sm text-gray-600">
    Loading invitation details...
  </div>
  <div *ngIf="invitationInfo && !invitationLoading">
    <p class="text-sm font-semibold text-blue-900 mb-2">
      You're invited to join <span class="text-blue-700">{{ invitationInfo.teamName }}</span>
    </p>
    <p class="text-sm text-blue-800">
      by {{ invitationInfo.inviterName }}
    </p>
  </div>
  <div *ngIf="invitationError" class="text-sm text-red-600 mt-2">
    {{ invitationError }}
  </div>
</div>

<!-- Dynamic Button Text -->
<button 
  type="submit"
  [disabled]="loading"
  class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition"
>
  {{ invitationToken ? 'Sign In & Accept Invite' : 'Sign In' }}
</button>

<!-- Success Alert -->
<div *ngIf="acceptanceSuccess" class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
  <p class="text-sm text-green-700 font-semibold">
    ✓ Invitation accepted! Redirecting to team...
  </p>
</div>
```

### Enhanced Signup Page with Invitation Support

**Location**: `src/app/pages/signup/signup.page.ts`

The signup page follows the same pattern as login, allowing new users to accept invitations immediately after account creation.

**Implementation Pattern**:
- Identical invitation handling to login page
- Loads invitation info on component init
- Pre-fills email from invitation
- Accepts invitation after successful signup
- Redirects to team dashboard after acceptance

### Dedicated Invite Acceptance Page

**Location**: `src/app/pages/invite-accept/invite-accept.page.ts`

This page handles direct invitation acceptance for users who click invitation links in emails.

```typescript
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InvitationService } from '../../services/invitation.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-invite-accept-page',
  templateUrl: './invite-accept.page.html',
  styleUrls: ['./invite-accept.page.css']
})
export class InviteAcceptPageComponent implements OnInit {
  invitationToken: string = '';
  invitationInfo: any = null;
  loading = true;
  error = '';
  isAuthenticated = false;

  constructor(
    private invitationService: InvitationService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.isAuthenticated = !!this.authService.getToken();
    
    this.route.params.subscribe(params => {
      this.invitationToken = params['token'];
      this.loadInvitationInfo();
    });
  }

  loadInvitationInfo() {
    this.invitationService.getInvitationInfo(this.invitationToken).subscribe({
      next: (info) => {
        this.invitationInfo = info;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Invitation not found or has expired';
        this.loading = false;
      }
    });
  }

  acceptInvitation() {
    this.invitationService.acceptInvitation(this.invitationToken).subscribe({
      next: (response) => {
        this.router.navigate([`/teams/${response.teamId}`]);
      },
      error: (err) => {
        this.error = 'Failed to accept invitation';
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login'], { queryParams: { invite: this.invitationToken } });
  }

  goToSignup() {
    this.router.navigate(['/signup'], { queryParams: { invite: this.invitationToken } });
  }
}
```

**Template** (`invite-accept.page.html`):

```html
<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
  <div class="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
    <!-- Loading State -->
    <div *ngIf="loading" class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p class="text-gray-600">Loading invitation...</p>
    </div>

    <!-- Error State -->
    <div *ngIf="error && !loading" class="text-center">
      <p class="text-red-600 font-semibold mb-4">{{ error }}</p>
      <button
        (click)="goToLogin()"
        class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700"
      >
        Go to Login
      </button>
    </div>

    <!-- Invitation Details -->
    <div *ngIf="invitationInfo && !loading" class="text-center">
      <h1 class="text-2xl font-bold text-gray-800 mb-4">🎉 You're Invited!</h1>
      
      <div class="bg-blue-100 border-l-4 border-blue-600 p-4 mb-6">
        <p class="text-lg font-bold text-blue-900">{{ invitationInfo.teamName }}</p>
      </div>

      <p class="text-gray-700 mb-2">
        <span class="font-semibold">{{ invitationInfo.inviterName }}</span> invited you to join their team
      </p>

      <p class="text-sm text-gray-600 mb-6">
        Invited as: <span class="font-mono text-blue-600">{{ invitationInfo.inviteeEmail }}</span>
      </p>

      <p class="text-xs mb-6"
        [ngClass]="invitationInfo.isExpired ? 'text-red-600' : 'text-green-600'"
      >
        {{ invitationInfo.isExpired ? '⚠️ This invitation has expired' : '✓ Invitation is valid' }}
      </p>

      <!-- Action Buttons -->
      <div class="space-y-3">
        <!-- Authenticated User -->
        <button
          *ngIf="isAuthenticated"
          (click)="acceptInvitation()"
          class="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700"
        >
          Accept Invitation
        </button>

        <!-- Unauthenticated User -->
        <div *ngIf="!isAuthenticated" class="space-y-2">
          <button
            (click)="goToLogin()"
            class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700"
          >
            Sign In to Accept
          </button>
          <p class="text-sm text-gray-600">or</p>
          <button
            (click)="goToSignup()"
            class="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700"
          >
            Create Account to Accept
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
```

### Routing Configuration

**Location**: `src/app/app-routing.module.ts`

```typescript
const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  { path: 'signup', component: SignupPageComponent },
  { path: 'invite/:token', component: InviteAcceptPageComponent }, // New route for direct invitations
  // ... other routes
];
```

### Module Registration

**Location**: `src/app/app.module.ts`

```typescript
@NgModule({
  declarations: [
    // ... other components
    InviteAcceptPageComponent, // Add this
  ],
  imports: [
    // ... other imports
  ]
})
export class AppModule { }
```

### Team Service Integration

**Location**: `src/app/services/team.service.ts`

The team service's `inviteMember` method passes the email as a query parameter:

```typescript
inviteMember(teamId: string, email: string): Observable<any> {
  return this.http.post(
    `${this.API_URL}/teams/${teamId}/invite?email=${encodeURIComponent(email)}`,
    {},
    { headers: { Authorization: `Bearer ${this.authService.getToken()}` } }
  );
}
```

### Key Features Summary

1. **Three Entry Points**:
   - Direct link: `/invite/{token}` - Dedicated page for email links
   - Login flow: `/login?invite={token}` - Accept after authentication
   - Signup flow: `/signup?invite={token}` - Accept after account creation

2. **Public & Protected Endpoints**:
   - `getInvitationInfo()` - No auth required (users can see invitation details before login)
   - `acceptInvitation()` - Requires authentication (prevents unauthorized acceptance)

3. **Email Pre-filling**:
   - Invitation email automatically pre-populated in login/signup forms
   - Reduces friction and prevents user error

4. **Status Indicators**:
   - Expiration status shown on invitation page
   - Visual feedback for valid vs. expired invitations

5. **Auto-redirect**:
   - Successful acceptance redirects to team dashboard
   - Seamless transition from invitation to team view

---

## Feature Implementation Template

Use this template when implementing new features:

### 1. Service Method Pattern

```typescript
// In appropriate service (e.g., team.service.ts, expense.service.ts)

featureMethod(param1: string, param2: any): Observable<ResponseType> {
  return new Observable(observer => {
    this.api.post<ResponseType>('/endpoint', {
      param1,
      param2
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
```

### 2. Component State Pattern

```typescript
export class FeatureComponent {
  // Data
  data: any[] = [];
  selectedItem: any = null;
  
  // UI State
  loading: boolean = false;
  error: string = '';
  success: string = '';
  showModal: boolean = false;
  
  // Form Data
  formField1: string = '';
  formField2: string = '';

  constructor(private service: SomeService) {}

  // Load data
  loadData(): void {
    this.loading = true;
    this.error = '';

    this.service.getData().subscribe(
      (response) => {
        this.data = response;
        this.loading = false;
      },
      (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      }
    );
  }

  // Handle action
  performAction(): void {
    if (!this.validateForm()) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    this.service.featureMethod(this.formField1, this.formField2).subscribe(
      (response) => {
        this.success = 'Action completed successfully!';
        this.loading = false;
        // Refresh data or navigate
      },
      (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      }
    );
  }

  validateForm(): boolean {
    if (!this.formField1.trim()) {
      this.error = 'Field 1 is required';
      return false;
    }
    return true;
  }

  resetForm(): void {
    this.formField1 = '';
    this.formField2 = '';
    this.error = '';
    this.success = '';
  }
}
```

### 3. Module Registration Pattern

```typescript
// In app.module.ts

import { NewFeatureComponent } from './components/new-feature.component';

@NgModule({
  declarations: [
    // ... existing components
    NewFeatureComponent,
  ],
  imports: [
    // ... existing imports
    CommonModule,
    FormsModule,
  ]
})
export class AppModule { }
```

### 4. Routing Pattern

```typescript
// In app-routing.module.ts

const routes: Routes = [
  {
    path: 'path-to-feature',
    component: FeaturePageComponent,
    canActivate: [AuthGuard] // Protect route
  }
];
```

---

## Service Layer Pattern

### Creating a New Service

```typescript
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import axios, { AxiosInstance } from 'axios';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NewFeatureService {
  private api: AxiosInstance;

  constructor(private authService: AuthService) {
    this.api = axios.create({
      baseURL: environment.apiUrl,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Helper method for auth headers
  private getHeaders() {
    const token = this.authService.getToken();
    return { 'Authorization': `Bearer ${token}` };
  }

  // API method pattern
  methodName(param: string): Observable<ResponseType> {
    return new Observable(observer => {
      this.api.post<ResponseType>('/endpoint', { param }, {
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
```

---

## Component Patterns

### Page Component Pattern

```typescript
export class FeaturePageComponent implements OnInit {
  // Data
  items: any[] = [];
  
  // State
  loading: boolean = true;
  error: string = '';

  constructor(
    private service: SomeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = '';

    this.service.getItems().subscribe(
      (items) => {
        this.items = items;
        this.loading = false;
      },
      (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      }
    );
  }
}
```

### Modal Component Pattern

```typescript
@Component({
  selector: 'app-feature-modal',
  templateUrl: './feature-modal.component.html',
  styleUrls: ['./feature-modal.component.css']
})
export class FeatureModalComponent {
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<any>();

  formData: string = '';
  loading: boolean = false;
  error: string = '';

  performAction(): void {
    if (!this.validateForm()) return;

    this.loading = true;
    this.error = '';

    this.service.doAction(this.formData).subscribe(
      (result) => {
        this.submit.emit(result);
        this.closeModal();
      },
      (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      }
    );
  }

  closeModal(): void {
    this.formData = '';
    this.error = '';
    this.close.emit();
  }

  validateForm(): boolean {
    if (!this.formData.trim()) {
      this.error = 'Field is required';
      return false;
    }
    return true;
  }
}
```

---

## State Management

### Observable Pattern

```typescript
// In service
private dataSubject = new BehaviorSubject<Data[]>([]);
public data$ = this.dataSubject.asObservable();

// Update state
private updateState(newData: Data[]): void {
  this.dataSubject.next(newData);
}

// In component - Subscribe
this.service.data$.subscribe(data => {
  this.data = data;
});
```

### Proper Cleanup

```typescript
export class ComponentName implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.service.getData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.data = data;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

---

## Error Handling

### Utility Function (validation.ts)

```typescript
export function getErrorMessage(error: any): string {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}
```

### Component Error Handling

```typescript
this.service.method().subscribe(
  (response) => {
    // Handle success
    this.data = response;
    this.loading = false;
  },
  (error) => {
    // Handle error
    this.error = getErrorMessage(error);
    this.loading = false;
  }
);
```

---

## Best Practices

### 1. State Management
- ✅ Use BehaviorSubject for shared state
- ✅ Expose Observables, not direct subjects
- ✅ Always initialize with default values
- ✅ Persist auth token to localStorage

### 2. Component Structure
- ✅ Separate concerns: data (service), UI (component)
- ✅ Use loading/error/success flags for user feedback
- ✅ Validate forms before API calls
- ✅ Disable inputs during loading

### 3. Error Handling
- ✅ Always catch API errors
- ✅ Display user-friendly error messages
- ✅ Use utility functions for error extraction
- ✅ Log errors for debugging

### 4. Type Safety
- ✅ Use TypeScript interfaces for all data
- ✅ Type all Observable returns
- ✅ Use strict mode in tsconfig

### 5. Performance
- ✅ Unsubscribe from observables in OnDestroy
- ✅ Use OnPush change detection strategy where possible
- ✅ Lazy load modules for routes
- ✅ Avoid memory leaks with takeUntil pattern

### 6. Code Organization
- ✅ One component per file
- ✅ Shared components in `/shared` folder
- ✅ Page components in `/pages` folder
- ✅ Services in `/services` folder

### 7. API Integration
- ✅ Always include auth headers
- ✅ Handle 401 (unauthorized) responses
- ✅ Implement retry logic for transient failures
- ✅ Use consistent API patterns across services

### 8. Testing Components
- ✅ Mock services in component tests
- ✅ Test happy path and error scenarios
- ✅ Verify user feedback (errors, loading)
- ✅ Test form validation

---

## Common Implementation Checklist

When adding a new feature, ensure:

- [ ] Service method created with proper Observable pattern
- [ ] Component/page created with loading/error/success states
- [ ] Form validation implemented (if form-based)
- [ ] Error messages display to user
- [ ] Loading state prevents duplicate submissions
- [ ] Modal/dialog properly integrated (if needed)
- [ ] Component registered in app.module.ts
- [ ] Route added to app-routing.module.ts (if page)
- [ ] AuthGuard applied (if protected route)
- [ ] Tested with actual backend API
- [ ] No TypeScript compilation errors

---

## File Structure Reference

```
src/app/
├── services/
│   ├── auth.service.ts          ✓ Implemented
│   ├── team.service.ts          ✓ Implemented
│   ├── expense.service.ts       ✓ Implemented
│   └── summary.service.ts       ✓ Implemented
│
├── pages/
│   ├── login/
│   │   ├── login.page.ts        ✓ Implemented
│   │   ├── login.page.html
│   │   └── login.page.css
│   ├── signup/
│   │   ├── signup.page.ts       ✓ Implemented
│   │   ├── signup.page.html
│   │   └── signup.page.css
│   ├── dashboard/
│   │   ├── dashboard.page.ts    ✓ Implemented
│   │   ├── dashboard.page.html
│   │   └── dashboard.page.css
│   ├── teams/
│   │   ├── teams.page.ts        ✓ Implemented
│   │   ├── teams.page.html
│   │   └── teams.page.css
│   ├── team-detail/
│   │   ├── team-detail.page.ts  ✓ Implemented
│   │   ├── team-detail.page.html
│   │   └── team-detail.page.css
│   └── settings/
│       ├── settings.page.ts     ✓ Implemented
│       ├── settings.page.html
│       └── settings.page.css
│
├── components/
│   ├── shared/
│   │   ├── header.component.ts              ✓ Implemented
│   │   ├── alert.component.ts              ✓ Implemented
│   │   ├── button.component.ts             ✓ Implemented
│   │   ├── loading.component.ts            ✓ Implemented
│   │   ├── create-team-modal.component.ts  ✓ Implemented
│   │   └── add-team-member-modal.component.ts  ✓ Implemented
│   ├── cards/
│   │   ├── team-card.component.ts          ✓ Implemented
│   │   └── expense-card.component.ts       ✓ Implemented
│   ├── form/
│   │   ├── input-field.component.ts        ✓ Implemented
│   │   └── select-field.component.ts       ✓ Implemented
│   └── login/ & signup/
│       └── [component files]               ✓ Implemented
│
├── guards/
│   └── auth.guard.ts                       ✓ Implemented
│
├── models/
│   └── index.ts                            ✓ Implemented
│
├── utils/
│   ├── format.ts
│   └── validation.ts
│
├── app.module.ts
├── app-routing.module.ts
└── app.component.ts
```

---

## Summary

This guide provides complete patterns for:
1. **Authentication** - Registration, login, token management
2. **Teams Management** - Create teams, manage members
3. **Add Team Member** - Modal-based member addition with validation
4. **Future Features** - Use provided templates for consistency

All new features should follow these established patterns to maintain code quality and consistency across the application.
