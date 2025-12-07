import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InvitationService } from '../../services/invitation.service';
import { AuthService } from '../../services/auth.service';
import { getErrorMessage } from '../../utils/validation';

@Component({
  selector: 'app-invite-accept-page',
  templateUrl: './invite-accept.page.html',
  styleUrls: ['./invite-accept.page.css']
})
export class InviteAcceptPageComponent implements OnInit {
  token: string | null = null;
  invitationInfo: any = null;
  loading: boolean = true;
  error: string = '';
  isAuthenticated: boolean = false;
  accepting: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private invitationService: InvitationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Check if user is already authenticated
    this.isAuthenticated = this.authService.isAuthenticated();

    // Get token from route params
    this.route.params.subscribe(params => {
      if (params['token']) {
        this.token = params['token'];
        this.loadInvitationInfo();
      } else {
        this.error = 'Invalid invitation link';
        this.loading = false;
      }
    });
  }

  loadInvitationInfo(): void {
    if (!this.token) return;

    this.invitationService.getInvitationInfo(this.token).subscribe(
      (info) => {
        this.invitationInfo = info;
        this.loading = false;
      },
      (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      }
    );
  }

  acceptInvitation(): void {
    if (!this.token) return;

    this.accepting = true;
    this.error = '';

    this.invitationService.acceptInvitation(this.token).subscribe(
      (response) => {
        // Redirect to the team
        this.router.navigate(['/teams', response.team_id]);
      },
      (error) => {
        this.error = getErrorMessage(error);
        this.accepting = false;
      }
    );
  }

  goToLogin(): void {
    this.router.navigate(['/login'], {
      queryParams: { invite: this.token }
    });
  }

  goToSignup(): void {
    this.router.navigate(['/signup'], {
      queryParams: { invite: this.token }
    });
  }
}
