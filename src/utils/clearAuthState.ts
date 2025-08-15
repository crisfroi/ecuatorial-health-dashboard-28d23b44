// Utility to clear any stuck authentication state that might be causing token errors
export const clearAuthState = () => {
  try {
    // Clear localStorage auth keys
    const authKeys = [
      'sb-wdieynendfjbkbhfovrx-auth-token',
      'supabase.auth.token',
      'sb-auth-token',
      'app-offline-mode',
      'app-offline-reason'
    ];
    
    authKeys.forEach(key => {
      localStorage.removeItem(key);
      // Also try with different prefixes
      Object.keys(localStorage).forEach(storageKey => {
        if (storageKey.includes(key) || storageKey.includes('auth') || storageKey.includes('supabase')) {
          localStorage.removeItem(storageKey);
        }
      });
    });
    
    // Clear sessionStorage as well
    sessionStorage.clear();
    
    console.log('🧹 Cleared all authentication state from storage');
  } catch (error) {
    console.warn('Could not clear authentication state:', error);
  }
};

// Auto-clear on import
clearAuthState();
