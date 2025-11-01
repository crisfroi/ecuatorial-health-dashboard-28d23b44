import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SyncConfig {
  deviceUrl: string;
  deviceSn?: string;
  autoSyncInterval?: number; // milliseconds, 0 to disable
}

interface SyncStatus {
  isLoading: boolean;
  lastSync: Date | null;
  recordsSynced: number;
  error: string | null;
  status: 'idle' | 'syncing' | 'success' | 'error';
}

export function useBiometricSync(config: SyncConfig) {
  const { toast } = useToast();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isLoading: false,
    lastSync: null,
    recordsSynced: 0,
    error: null,
    status: 'idle',
  });

  const autoSyncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Call Edge Function to sync with device
  const syncRecords = useCallback(async () => {
    if (syncStatus.isLoading) {
      console.log('Sync already in progress');
      return;
    }

    setSyncStatus((prev) => ({ ...prev, isLoading: true, status: 'syncing' }));

    try {
      const { data, error } = await supabase.functions.invoke('sync-biometric-device', {
        body: {
          deviceUrl: config.deviceUrl,
          deviceSn: config.deviceSn,
          action: 'sync',
        },
      });

      if (error) {
        throw error;
      }

      setSyncStatus((prev) => ({
        ...prev,
        lastSync: new Date(),
        recordsSynced: data.synced || 0,
        error: data.error || null,
        status: data.error ? 'error' : 'success',
        isLoading: false,
      }));

      if (data.error) {
        toast({
          title: 'Sync completado con advertencia',
          description: `${data.synced} registros sincronizados. ${data.error}`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Sincronización exitosa',
          description: `${data.synced} registros sincronizados desde el dispositivo`,
        });
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Error desconocido durante la sincronización';
      setSyncStatus((prev) => ({
        ...prev,
        error: errorMsg,
        status: 'error',
        isLoading: false,
      }));

      toast({
        title: 'Error de sincronización',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  }, [config.deviceUrl, config.deviceSn, syncStatus.isLoading, toast]);

  // Get device status from SDK
  const getDeviceStatus = useCallback(async () => {
    if (!config.deviceUrl || config.deviceUrl.trim().length === 0) {
      const errorMsg = 'Device URL not configured. Please enter a valid SDK URL.';
      console.error('Error getting device status:', errorMsg);
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('sync-biometric-device', {
        body: {
          deviceUrl: config.deviceUrl,
          action: 'get-status',
        },
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (err: any) {
      console.error('Error getting device status:', err);
      return null;
    }
  }, [config.deviceUrl]);

  // Get list of devices from SDK
  const getDevices = useCallback(async () => {
    if (!config.deviceUrl || config.deviceUrl.trim().length === 0) {
      const errorMsg = 'Device URL not configured. Please enter a valid SDK URL.';
      console.error('Error getting devices:', errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const { data, error } = await supabase.functions.invoke('sync-biometric-device', {
        body: {
          deviceUrl: config.deviceUrl,
          action: 'get-devices',
        },
      });

      if (error) {
        throw error;
      }

      return data.devices || [];
    } catch (err: any) {
      console.error('Error getting devices:', err);
      throw err;
    }
  }, [config.deviceUrl]);

  // Get records from SDK
  const getRecords = useCallback(async (deviceSn?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('sync-biometric-device', {
        body: {
          deviceUrl: config.deviceUrl,
          deviceSn: deviceSn || config.deviceSn,
          action: 'get-records',
        },
      });

      if (error) {
        throw error;
      }

      return data.records || [];
    } catch (err: any) {
      console.error('Error getting records:', err);
      return [];
    }
  }, [config.deviceUrl, config.deviceSn]);

  // Set up auto-sync timer
  useEffect(() => {
    if (!config.autoSyncInterval || config.autoSyncInterval <= 0) {
      return;
    }

    // Initial sync
    syncRecords();

    // Set up interval
    autoSyncTimerRef.current = setInterval(() => {
      syncRecords();
    }, config.autoSyncInterval);

    return () => {
      if (autoSyncTimerRef.current) {
        clearInterval(autoSyncTimerRef.current);
      }
    };
  }, [config.autoSyncInterval, config.deviceUrl, syncRecords]);

  // Get sync history
  const getSyncHistory = useCallback(
    async (limit: number = 10) => {
      try {
        const { data, error } = await supabase
          .from('biometric_sync_logs')
          .select('*')
          .order('synced_at', { ascending: false })
          .limit(limit);

        if (error) {
          throw error;
        }

        return data || [];
      } catch (err: any) {
        console.error('Error getting sync history:', err);
        return [];
      }
    },
    []
  );

  return {
    syncStatus,
    syncRecords,
    getDeviceStatus,
    getDevices,
    getRecords,
    getSyncHistory,
  };
}
