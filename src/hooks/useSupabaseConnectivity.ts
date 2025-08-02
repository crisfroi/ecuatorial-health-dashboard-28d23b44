import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSupabaseConnectivity = () => {
  return useQuery({
    queryKey: ['supabase-connectivity'],
    queryFn: async () => {
      try {
        console.log('🔍 Testing Supabase connectivity...');
        
        // Use the public URLs instead of protected properties
        const supabaseUrl = "https://wdieynendfjbkbhfovrx.supabase.co";
        const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWV5bmVuZGZqYmtiaGZvdnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODA3ODI5MjEsImV4cCI6MTk5NjM1ODkyMX0.yFnLHavy8wzVjlg3sAI2mEG-XGDCV5FSr7OQsMefxL8";

        // Perform a simple query to test connectivity
        const { data, error } = await supabase.from('profesionales_sanitarios').select('id').limit(1);

        if (error) {
          throw new Error(`Supabase query failed: ${error.message}`);
        }

        if (!data) {
          throw new Error('No data returned from Supabase, possible connection issue.');
        }

        return {
          connected: true,
          url: supabaseUrl,
          keyPresent: !!supabaseKey,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('❌ Supabase connectivity test failed:', error);
        return {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        };
      }
    },
    refetchInterval: 30000
  });
};
