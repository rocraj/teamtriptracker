/**
 * Validation utilities
 */

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

export function isValidName(name: string): boolean {
  return name.trim().length >= 2;
}

export function isValidAmount(amount: any): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
}

/**
 * Parse error messages
 */
export function getErrorMessage(error: any): string {
  // If it's a string, return it directly
  if (typeof error === 'string') return error;
  
  // Handle axios errors
  if (error?.response?.data) {
    const data = error.response.data;
    
    // If data has detail property (from FastAPI Pydantic validation)
    if (data.detail) {
      // If detail is an array (validation errors)
      if (Array.isArray(data.detail)) {
        return data.detail
          .map((err: any) => err.msg || (typeof err === 'string' ? err : err.message))
          .join(', ');
      }
      // If detail is a string
      return data.detail;
    }
    
    // If data is a string (sometimes error responses are just strings)
    if (typeof data === 'string') return data;
  }
  
  // Handle HttpErrorResponse from Angular HttpClient
  if (error?.error) {
    // If error.error is an object with detail property
    if (typeof error.error === 'object' && error.error?.detail) {
      // If detail is an array (Pydantic validation errors)
      if (Array.isArray(error.error.detail)) {
        return error.error.detail
          .map((err: any) => err.msg || err)
          .join(', ');
      }
      return error.error.detail;
    }
    // If error.error is a string
    if (typeof error.error === 'string') return error.error;
  }
  
  // Fallback to message property
  if (error?.message) return error.message;
  
  // Last resort - return JSON string representation for debugging
  return 'An unexpected error occurred';
}
