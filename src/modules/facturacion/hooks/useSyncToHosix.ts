import { useState } from 'react';
import { toast } from 'sonner';

export interface SyncStatus {
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
  syncedRecords: number;
}

export function useSyncToHosix() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isLoading: false,
    error: null,
    lastSync: null,
    syncedRecords: 0,
  });

  const triggerSync = async (event: {
    type: 'insert' | 'update' | 'delete';
    table: string;
    record: any;
    old_record?: any;
  }) => {
    setSyncStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const edgeFunctionUrl = import.meta.env.VITE_SUPABASE_URL + '/functions/v1/sync-masters';
      
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(window as any).__SUPABASE_ANON_KEY__}`,
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sync failed');
      }

      const result = await response.json();
      
      setSyncStatus(prev => ({
        ...prev,
        isLoading: false,
        lastSync: new Date(),
        syncedRecords: (prev.syncedRecords || 0) + 1,
      }));

      toast.success('Cambio sincronizado a HOSIX');
      return result;
    } catch (error: any) {
      const errorMsg = error.message || 'Error desconocido en sincronización';
      setSyncStatus(prev => ({
        ...prev,
        isLoading: false,
        error: errorMsg,
      }));
      
      toast.error(`Error en sincronización: ${errorMsg}`);
      throw error;
    }
  };

  const resetStatus = () => {
    setSyncStatus({
      isLoading: false,
      error: null,
      lastSync: null,
      syncedRecords: 0,
    });
  };

  return {
    syncStatus,
    triggerSync,
    resetStatus,
  };
}
