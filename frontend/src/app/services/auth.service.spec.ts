import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Authentication', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should register a new user', (done) => {
      service.register('test@example.com', 'Test User', 'password123').subscribe(
        (response) => {
          expect(response).toBeTruthy();
          expect(response.access_token).toBeTruthy();
          expect(localStorage.getItem('token')).toBeTruthy();
          done();
        },
        (error) => {
          fail('Registration should succeed: ' + error);
        }
      );
    });

    it('should reject duplicate email registration', (done) => {
      service.register('duplicate@example.com', 'User 1', 'password123').subscribe(
        () => {
          service.register('duplicate@example.com', 'User 2', 'password456').subscribe(
            () => {
              fail('Should reject duplicate email');
            },
            (error) => {
              expect(error).toBeTruthy();
              done();
            }
          );
        }
      );
    });

    it('should login with valid credentials', (done) => {
      service.register('login@example.com', 'Login User', 'password123').subscribe(() => {
        service.login('login@example.com', 'password123').subscribe(
          (response) => {
            expect(response).toBeTruthy();
            expect(response.access_token).toBeTruthy();
            done();
          },
          (error) => {
            fail('Login should succeed: ' + error);
          }
        );
      });
    });

    it('should reject login with invalid password', (done) => {
      service.register('validuser@example.com', 'User', 'correctpassword').subscribe(() => {
        service.login('validuser@example.com', 'wrongpassword').subscribe(
          () => {
            fail('Should reject invalid password');
          },
          (error) => {
            expect(error).toBeTruthy();
            done();
          }
        );
      });
    });

    it('should reject login with non-existent user', (done) => {
      service.login('nonexistent@example.com', 'password123').subscribe(
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

  describe('Token Management', () => {
    it('should store token on successful login', (done) => {
      service.register('tokentest@example.com', 'Token User', 'password123').subscribe(
        (response) => {
          const storedToken = localStorage.getItem('token');
          expect(storedToken).toBe(response.access_token);
          done();
        }
      );
    });

    it('should return token with getToken()', (done) => {
      service.register('gettoken@example.com', 'Get Token User', 'password123').subscribe(() => {
        const token = service.getToken();
        expect(token).toBeTruthy();
        expect(token).toBe(localStorage.getItem('token'));
        done();
      });
    });

    it('should indicate authenticated when token exists', (done) => {
      service.register('isauth@example.com', 'Auth User', 'password123').subscribe(() => {
        expect(service.isAuthenticated()).toBe(true);
        done();
      });
    });

    it('should indicate not authenticated when no token', () => {
      localStorage.removeItem('token');
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should clear token on logout', (done) => {
      service.register('logout@example.com', 'Logout User', 'password123').subscribe(() => {
        service.logout();
        expect(localStorage.getItem('token')).toBeFalsy();
        expect(service.isAuthenticated()).toBe(false);
        done();
      });
    });
  });

  describe('User Data', () => {
    it('should load current user after login', (done) => {
      service.register('currentuser@example.com', 'Current User', 'password123').subscribe(() => {
        service.currentUser$.subscribe((user) => {
          if (user) {
            expect(user.email).toBe('currentuser@example.com');
            expect(user.name).toBe('Current User');
            expect(user.id).toBeTruthy();
            done();
          }
        });
      });
    });

    it('should clear user data on logout', (done) => {
      service.register('clearuser@example.com', 'Clear User', 'password123').subscribe(() => {
        service.logout();
        service.currentUser$.subscribe((user) => {
          expect(user).toBeFalsy();
          done();
        });
      });
    });
  });
});
