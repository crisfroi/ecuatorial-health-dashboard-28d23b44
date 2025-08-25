import { useState, useEffect } from 'react';
import { getConnectionStatus } from '@/integrations/supabase/client';

interface NetworkStatus {
  isOnline: boolean;
  isSupabaseHealthy: boolean;
  connectionAttempts: number;
  lastChecked: Date;
}

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSupabaseHealthy: true,
    connectionAttempts: 0,
    lastChecked: new Date()
  });

  useEffect(() => {
    // Monitor browser online/offline status
    const handleOnline = () => {
      console.log('🌐 Browser is online');
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: true,
        lastChecked: new Date()
      }));
    };

    const handleOffline = () => {
      console.log('🌐 Browser is offline');
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        lastChecked: new Date()
      }));
    };

    // Monitor Supabase connection status
    const checkSupabaseHealth = () => {
      const supabaseStatus = getConnectionStatus();
      setNetworkStatus(prev => ({
        ...prev,
        isSupabaseHealthy: supabaseStatus.isHealthy,
        connectionAttempts: supabaseStatus.attempts,
        lastChecked: new Date()
      }));
    };

    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check Supabase health periodically
    const healthCheckInterval = setInterval(checkSupabaseHealth, 30000); // Every 30 seconds

    // Initial check
    checkSupabaseHealth();

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(healthCheckInterval);
    };
  }, []);

  const refreshStatus = () => {
    const supabaseStatus = getConnectionStatus();
    setNetworkStatus({
      isOnline: navigator.onLine,
      isSupabaseHealthy: supabaseStatus.isHealthy,
      connectionAttempts: supabaseStatus.attempts,
      lastChecked: new Date()
    });
  };

  return {
    ...networkStatus,
    refreshStatus
  };
};

export default useNetworkStatus;
