import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  constructor(private router: Router) {}
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Get the auth token from localStorage
    const token = localStorage.getItem('token');
    
    // Clone the request and add headers
    let authReq = req;
    
    if (token) {
      authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
    }
    
    // Handle the request and catch authentication errors
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // If we get a 401 error, the token might be expired
        if (error.status === 401) {
          // Clear the invalid token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Redirect to login page unless we're already on login/register pages
          const currentUrl = this.router.url;
          if (!currentUrl.includes('/login') && 
              !currentUrl.includes('/signup') && 
              !currentUrl.includes('/accept-invite')) {
            this.router.navigate(['/login']);
          }
        }
        
        return throwError(() => error);
      })
    );
  }
}