import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { InvitationService } from '../../services/invitation.service';
import { isValidEmail, isValidPassword, getErrorMessage } from '../../utils/validation';

@Component({
  selector: 'app-login-page',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.css']
})
export class LoginPageComponent implements OnInit {
  email: string = '';
  password: string = '';
  error: string = '';
  success: string = '';
  loading: boolean = false;

  // Invitation state
  invitationToken: string | null = null;
  invitationInfo: any = null;
  invitationLoading: boolean = false;
  invitationError: string = '';

  constructor(
    private authService: AuthService,
    private invitationService: InvitationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check if there's an invitation token in query params
    this.route.queryParams.subscribe(params => {
      if (params['invite']) {
        this.invitationToken = params['invite'];
        this.loadInvitationInfo();
      }
    });
  }

  loadInvitationInfo(): void {
    if (!this.invitationToken) return;

    this.invitationLoading = true;
    this.invitationError = '';

    this.invitationService.getInvitationInfo(this.invitationToken).subscribe(
      (info) => {
        this.invitationInfo = info;
        // Pre-fill email with invitee email
        if (info.invitee_email) {
          this.email = info.invitee_email;
        }
        this.invitationLoading = false;
      },
      (error) => {
        this.invitationError = getErrorMessage(error);
        this.invitationLoading = false;
      }
    );
  }

  login(): void {
    if (!isValidEmail(this.email)) {
      this.error = 'Please enter a valid email';
      return;
    }

    if (!isValidPassword(this.password)) {
      this.error = 'Password must be at least 6 characters';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.authService.login(this.email, this.password).subscribe(
      () => {
        // If there's an invitation, accept it
        if (this.invitationToken) {
          this.acceptInvitation();
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      }
    );
  }

  acceptInvitation(): void {
    if (!this.invitationToken) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.invitationService.acceptInvitation(this.invitationToken).subscribe(
      (response) => {
        this.success = `✅ Successfully joined ${this.invitationInfo.team_name}!`;
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/teams', response.team_id]);
        }, 1500);
      },
      (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      }
    );
  }

  requestMagicLink(): void {
    if (!isValidEmail(this.email)) {
      this.error = 'Please enter a valid email';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.requestMagicLink(this.email).subscribe(
      () => {
        alert('✅ Check your email for the magic link!');
        this.loading = false;
      },
      (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      }
    );
  }
}
