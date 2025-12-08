import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

export interface LoadingService {
  show(): void;
  hide(): void;
}

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private activeRequests = 0;
  
  constructor() {}
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip loading for certain requests (like health checks, background updates, etc.)
    if (req.headers.has('X-Skip-Loading') || req.method === 'GET' && req.url.includes('/health')) {
      return next.handle(req);
    }
    
    // Increment active requests and show loading
    this.activeRequests++;
    this.setLoading(true);
    
    return next.handle(req).pipe(
      finalize(() => {
        // Decrement active requests and hide loading if no more requests
        this.activeRequests--;
        if (this.activeRequests === 0) {
          this.setLoading(false);
        }
      })
    );
  }
  
  private setLoading(loading: boolean): void {
    // Dispatch custom event for loading state
    window.dispatchEvent(new CustomEvent('loading-state', { 
      detail: { loading, activeRequests: this.activeRequests } 
    }));
  }
}