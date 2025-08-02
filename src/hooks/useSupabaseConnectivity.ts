
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ConnectivityResult {
  connected: boolean;
  url?: string;
  keyPresent?: boolean;
  timestamp: string;
  error?: string;
  status?: string;
  hasRecords?: boolean;
  recordCount?: number;
  details?: {
    url: string;
    keyLength: number;
    environment: string;
  };
}

export const useSupabaseConnectivity = () => {
  return useQuery({
    queryKey: ['supabase-connectivity'],
    queryFn: async (): Promise<ConnectivityResult> => {
      try {
        console.log('🔍 Testing Supabase connectivity...');
        
        // Use the public URLs instead of protected properties
        const supabaseUrl = "https://wdieynendfjbkbhfovrx.supabase.co";
        const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWV5bmVuZGZqYmtiaGZvdnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODI5MjEsImV4cCI6MjA2NjM1ODkyMX0.yFnLHavy8wzVjlg3sAI2mEG-XGDCV5FSr7OQsMefxL8";

        // Perform a simple query to test connectivity
        const { data, error, count } = await supabase
          .from('profesionales_sanitarios')
          .select('id', { count: 'exact' })
          .limit(5);

        if (error) {
          throw new Error(`Supabase query failed: ${error.message}`);
        }

        return {
          connected: true,
          url: supabaseUrl,
          keyPresent: !!supabaseKey,
          timestamp: new Date().toISOString(),
          status: 'connected',
          hasRecords: (data?.length || 0) > 0,
          recordCount: count || 0,
          details: {
            url: supabaseUrl,
            keyLength: supabaseKey?.length || 0,
            environment: 'production'
          }
        };
      } catch (error) {
        console.error('❌ Supabase connectivity test failed:', error);
        return {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          status: 'error'
        };
      }
    },
    refetchInterval: 30000
  });
};
