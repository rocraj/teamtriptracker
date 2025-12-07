import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InvitationService } from '../../services/invitation.service';
import { AuthService } from '../../services/auth.service';
import { getErrorMessage } from '../../utils/validation';

interface InvitationData {
  team_name: string;
  inviter_name: string;
  inviter_email: string;
  invitee_email: string;
  created_at: string;
  expires_at: string;
  is_expired: boolean;
}

@Component({
  selector: 'app-invite-accept-page',
  templateUrl: './invite-accept.page.html',
  styleUrls: ['./invite-accept.page.css']
})
export class InviteAcceptPageComponent implements OnInit {
  // Token management
  token: string | null = null;
  tokenValid: boolean = false;

  // Invitation data
  invitationInfo: InvitationData | null = null;
  inviteeEmail: string = '';

  // Loading and error states
  loading: boolean = true;
  error: string = '';
  accepting: boolean = false;

  // Authentication state
  isAuthenticated: boolean = false;
  currentUserEmail: string | null = null;

  // UX states
  emailMatchConfirmed: boolean = false;
  showEmailConfirmation: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private invitationService: InvitationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Check if user is authenticated
    this.isAuthenticated = this.authService.isAuthenticated();
    if (this.isAuthenticated) {
      this.currentUserEmail = this.authService.getCurrentUserEmail();
    }

    // Get token from route params
    this.route.params.subscribe(params => {
      if (params['token']) {
        this.token = params['token'];
        this.loadInvitationInfo();
      } else {
        this.error = 'Invalid invitation link - no token provided';
        this.loading = false;
      }
    });
  }

  /**
   * Load invitation information from backend
   * Validates token and retrieves invitation details
   */
  loadInvitationInfo(): void {
    if (!this.token) {
      this.error = 'Token is missing';
      this.loading = false;
      return;
    }

    this.invitationService.getInvitationInfo(this.token).subscribe(
      (info) => {
        this.invitationInfo = info;
        this.inviteeEmail = info.invitee_email;
        this.tokenValid = true;

        // If user is authenticated but email doesn't match, show warning
        if (this.isAuthenticated && this.currentUserEmail && this.currentUserEmail !== this.inviteeEmail) {
          this.showEmailConfirmation = true;
        }

        this.loading = false;
      },
      (error) => {
        this.error = getErrorMessage(error);
        this.tokenValid = false;
        this.loading = false;
      }
    );
  }

  /**
   * Accept invitation for authenticated user
   * Validates email match if user is signed in with different email
   */
  acceptInvitation(): void {
    if (!this.token) {
      this.error = 'Token is missing';
      return;
    }

    // If user is authenticated but email doesn't match invitation, require confirmation
    if (
      this.isAuthenticated &&
      this.currentUserEmail &&
      this.currentUserEmail !== this.inviteeEmail &&
      !this.emailMatchConfirmed
    ) {
      this.showEmailConfirmation = true;
      return;
    }

    this.accepting = true;
    this.error = '';

    this.invitationService.acceptInvitation(this.token).subscribe(
      (response) => {
        // Show success and redirect to team
        this.router.navigate(['/teams', response.team_id]);
      },
      (error) => {
        this.error = getErrorMessage(error);
        this.accepting = false;
      }
    );
  }

  /**
   * Confirm email mismatch and proceed with acceptance
   */
  confirmEmailMismatch(): void {
    this.emailMatchConfirmed = true;
    this.acceptInvitation();
  }

  /**
   * Cancel email mismatch and redirect to login/signup with correct email
   */
  switchAccount(): void {
    // Clear current session and redirect to signup with invitation token and correct email
    this.router.navigate(['/signup'], {
      queryParams: { invite: this.token, email: this.inviteeEmail }
    });
  }

  /**
   * Navigate to login with invitation token
   * Pre-fills email if not authenticated
   */
  goToLogin(): void {
    this.router.navigate(['/login'], {
      queryParams: { invite: this.token, email: this.inviteeEmail }
    });
  }

  /**
   * Navigate to signup with invitation token
   * Pre-fills email if not authenticated
   */
  goToSignup(): void {
    this.router.navigate(['/signup'], {
      queryParams: { invite: this.token, email: this.inviteeEmail }
    });
  }

  /**
   * Format time remaining until expiry
   */
  getTimeUntilExpiry(): string {
    if (!this.invitationInfo) return '';
    const expiresAt = new Date(this.invitationInfo.expires_at);
    const now = new Date();
    const hoursRemaining = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
    return hoursRemaining > 0 ? `${hoursRemaining} hours` : 'less than 1 hour';
  }

  /**
   * Check if email matches the invitation email
   */
  emailMatches(): boolean {
    return this.currentUserEmail === this.inviteeEmail;
  }
}
