import { supabase } from '@/integrations/supabase/client';
import { StorageCleanup } from './storageCleanup';

/**
 * Handles Supabase authentication errors and provides recovery mechanisms
 */
export class AuthErrorHandler {
  
  /**
   * Checks if an error is related to invalid refresh token
   */
  static isRefreshTokenError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    return (
      errorMessage.includes('refresh token') ||
      errorMessage.includes('invalid token') ||
      errorMessage.includes('token not found') ||
      error?.code === 'invalid_refresh_token'
    );
  }

  /**
   * Handles refresh token errors by clearing session and redirecting to login
   */
  static async handleRefreshTokenError(): Promise<void> {
    console.log('🚨 Handling refresh token error - clearing session');
    
    try {
      // Clear the session without calling the server (since the token is invalid)
      await supabase.auth.signOut({ scope: 'local' });

      // Clear any remaining auth data from storage
      StorageCleanup.cleanAuthStorage();
      
      // Redirect to login page
      if (window.location.pathname !== '/auth' && window.location.pathname !== '/') {
        window.location.href = '/auth';
      }
    } catch (clearError) {
      console.error('Error clearing invalid session:', clearError);
      // Force redirect even if clearing fails
      window.location.href = '/auth';
    }
  }

  /**
   * Attempts to recover from authentication errors
   */
  static async recoverFromAuthError(error: any): Promise<boolean> {
    if (this.isRefreshTokenError(error)) {
      await this.handleRefreshTokenError();
      return true;
    }
    
    return false;
  }

  /**
   * Checks if the current session is valid
   */
  static async validateSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session validation error:', error);
        
        if (this.isRefreshTokenError(error)) {
          await this.handleRefreshTokenError();
          return false;
        }
      }
      
      return !!session;
    } catch (error) {
      console.error('Failed to validate session:', error);
      return false;
    }
  }
}

/**
 * Global error handler for authentication errors
 */
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason;
  
  if (AuthErrorHandler.isRefreshTokenError(error)) {
    console.log('🚨 Unhandled refresh token error detected');
    event.preventDefault(); // Prevent the error from showing in console
    AuthErrorHandler.handleRefreshTokenError();
  }
});

/**
 * Periodic session validation (every 5 minutes)
 */
setInterval(async () => {
  const isValid = await AuthErrorHandler.validateSession();
  if (!isValid) {
    console.log('⚠️ Session validation failed during periodic check');
  }
}, 5 * 60 * 1000); // 5 minutes
