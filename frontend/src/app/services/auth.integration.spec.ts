import { TestBed, ComponentFixture } from '@angular/core/testing';
import { LoginComponent } from '../components/login/login.component';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

describe('Auth Flow Integration Tests', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        {
          provide: Router,
          useValue: { navigate: jasmine.createSpy('navigate') }
        }
      ]
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Sign Up Flow', () => {
    it('should complete full signup flow', (done) => {
      const email = 'newuser@example.com';
      const name = 'New User';
      const password = 'SecurePassword123!';

      // Step 1: User provides signup details
      authService.register(email, name, password).subscribe(
        (response) => {
          // Step 2: User is registered
          expect(response.access_token).toBeTruthy();
          expect(response.token_type).toBe('bearer');

          // Step 3: Token is stored
          expect(localStorage.getItem('token')).toBeTruthy();

          // Step 4: User is authenticated
          expect(authService.isAuthenticated()).toBe(true);

          // Step 5: Current user is available
          authService.currentUser$.subscribe((user) => {
            if (user) {
              expect(user.email).toBe(email);
              expect(user.name).toBe(name);
              expect(user.id).toBeTruthy();
              done();
            }
          });
        },
        (error) => {
          fail('Signup should succeed: ' + error);
        }
      );
    });

    it('should handle signup with validation errors', (done) => {
      // Empty email
      authService.register('', 'User', 'password123').subscribe(
        () => {
          fail('Should reject invalid email');
        },
        (error) => {
          expect(error).toBeTruthy();
          done();
        }
      );
    });

    it('should prevent duplicate signup', (done) => {
      const email = 'duplicate@example.com';

      authService.register(email, 'User 1', 'password123').subscribe(() => {
        authService.register(email, 'User 2', 'password456').subscribe(
          () => {
            fail('Should reject duplicate email');
          },
          (error) => {
            expect(error).toBeTruthy();
            done();
          }
        );
      });
    });
  });

  describe('Login Flow', () => {
    beforeEach((done) => {
      authService.register('existing@example.com', 'Existing User', 'password123').subscribe(() => {
        authService.logout();
        done();
      });
    });

    it('should complete full login flow', (done) => {
      const email = 'existing@example.com';
      const password = 'password123';

      // Step 1: User provides login credentials
      authService.login(email, password).subscribe(
        (response) => {
          // Step 2: User is logged in
          expect(response.access_token).toBeTruthy();

          // Step 3: Token is stored
          expect(localStorage.getItem('token')).toBeTruthy();

          // Step 4: User is authenticated
          expect(authService.isAuthenticated()).toBe(true);

          // Step 5: Current user is loaded
          authService.currentUser$.subscribe((user) => {
            if (user) {
              expect(user.email).toBe(email);
              done();
            }
          });
        },
        (error) => {
          fail('Login should succeed: ' + error);
        }
      );
    });

    it('should reject login with wrong password', (done) => {
      authService.login('existing@example.com', 'wrongpassword').subscribe(
        () => {
          fail('Should reject wrong password');
        },
        (error) => {
          expect(error).toBeTruthy();
          done();
        }
      );
    });

    it('should reject login with non-existent user', (done) => {
      authService.login('nonexistent@example.com', 'password123').subscribe(
        () => {
          fail('Should reject non-existent user');
        },
        (error) => {
          expect(error).toBeTruthy();
          done();
        }
      );
    });
  });

  describe('Session Management', () => {
    it('should persist session on page reload', (done) => {
      authService.register('persist@example.com', 'Persist User', 'password123').subscribe(() => {
        const tokenBeforeReload = localStorage.getItem('token');

        // Simulate page reload by creating new service instance
        const newAuthService = new AuthService();
        expect(newAuthService.isAuthenticated()).toBe(true);

        newAuthService.currentUser$.subscribe((user) => {
          if (user) {
            expect(user.email).toBe('persist@example.com');
            done();
          }
        });
      });
    });

    it('should clear session on logout', (done) => {
      authService.register('logout@example.com', 'Logout User', 'password123').subscribe(() => {
        expect(authService.isAuthenticated()).toBe(true);

        authService.logout();

        expect(authService.isAuthenticated()).toBe(false);
        expect(localStorage.getItem('token')).toBeFalsy();

        authService.currentUser$.subscribe((user) => {
          expect(user).toBeFalsy();
          done();
        });
      });
    });
  });

  describe('Auth Error Handling', () => {
    it('should handle network errors gracefully', (done) => {
      authService.login('test@example.com', 'password').subscribe(
        () => {
          fail('Should fail with network error');
        },
        (error) => {
          expect(error).toBeTruthy();
          done();
        }
      );
    });

    it('should maintain auth state on failed login', (done) => {
      authService.register('test@example.com', 'Test', 'password').subscribe(() => {
        authService.logout();

        authService.login('test@example.com', 'wrongpassword').subscribe(
          () => {
            fail('Should fail with wrong password');
          },
          () => {
            expect(authService.isAuthenticated()).toBe(false);
            done();
          }
        );
      });
    });
  });
});
