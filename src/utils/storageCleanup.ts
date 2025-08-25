/**
 * Utility functions for cleaning up localStorage and sessionStorage
 * to prevent authentication conflicts
 */

export class StorageCleanup {
  
  /**
   * Clean up all authentication-related storage data
   */
  static cleanAuthStorage(): void {
    console.log('🧹 Cleaning authentication storage...');
    
    try {
      // Remove all Supabase auth keys
      const authKeys = [
        'supabase.auth.token',
        'sb-wdieynendfjbkbhfovrx-auth-token',
        'sb-auth-token',
        'supabase.auth.refreshToken',
        'supabase.auth.expiresAt',
      ];
      
      authKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      // Remove any keys that contain 'auth' or 'supabase'
      Object.keys(localStorage).forEach(key => {
        if (key.includes('auth') || key.includes('supabase')) {
          console.log(`Removing localStorage key: ${key}`);
          localStorage.removeItem(key);
        }
      });
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('auth') || key.includes('supabase')) {
          console.log(`Removing sessionStorage key: ${key}`);
          sessionStorage.removeItem(key);
        }
      });
      
      console.log('✅ Authentication storage cleaned');
    } catch (error) {
      console.error('❌ Error cleaning auth storage:', error);
    }
  }
  
  /**
   * Clean up corrupted auth data and force fresh login
   */
  static forceAuthReset(): void {
    console.log('🔄 Forcing authentication reset...');
    
    this.cleanAuthStorage();
    
    // Clear any cached user data
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      localStorage.removeItem('authState');
      
      console.log('✅ Authentication reset completed');
    } catch (error) {
      console.error('❌ Error during auth reset:', error);
    }
  }
  
  /**
   * Check for corrupted auth tokens
   */
  static hasCorruptedTokens(): boolean {
    try {
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) return false;
      
      // Try to parse the token
      const parsed = JSON.parse(token);
      
      // Check if token structure is valid
      if (!parsed.access_token || !parsed.refresh_token) {
        console.log('⚠️ Corrupted token structure detected');
        return true;
      }
      
      // Check if token is expired (basic check)
      if (parsed.expires_at && Date.now() / 1000 > parsed.expires_at) {
        console.log('⚠️ Expired token detected');
        return true;
      }
      
      return false;
    } catch (error) {
      console.log('⚠️ Error parsing token, assuming corrupted');
      return true;
    }
  }
}

// Check for corrupted tokens on module load
if (StorageCleanup.hasCorruptedTokens()) {
  console.log('🚨 Corrupted auth tokens detected - cleaning up');
  StorageCleanup.cleanAuthStorage();
}
