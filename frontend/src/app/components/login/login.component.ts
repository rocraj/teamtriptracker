import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  error: string = '';
  loading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login(): void {
    if (!this.email || !this.password) {
      this.error = 'Please fill in all fields';
      return;
    }

    this.loading = true;
    this.authService.login(this.email, this.password).subscribe(
      () => {
        this.router.navigate(['/dashboard']);
      },
      (error) => {
        this.error = 'Invalid email or password';
        this.loading = false;
      }
    );
  }

  googleSignIn(): void {
    // TODO: Implement Google OAuth flow
    alert('Google sign-in integration coming soon');
  }

  magicLink(): void {
    if (!this.email) {
      this.error = 'Please enter your email';
      return;
    }

    this.loading = true;
    this.authService.requestMagicLink(this.email).subscribe(
      () => {
        alert('Check your email for the magic link!');
        this.loading = false;
      },
      (error) => {
        this.error = 'Failed to send magic link';
        this.loading = false;
      }
    );
  }
}
