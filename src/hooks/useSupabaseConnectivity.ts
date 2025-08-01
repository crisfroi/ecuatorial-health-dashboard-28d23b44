import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSupabaseConnectivity() {
  return useQuery({
    queryKey: ["supabase-connectivity"],
    queryFn: async () => {
      console.log("=== ENHANCED SUPABASE CONNECTIVITY TEST ===");

      try {
        // Test 1: Check if supabase client exists
        if (!supabase) {
          throw new Error("Supabase client not initialized");
        }

        console.log("✓ Supabase client exists");

        // Test 2: Check configuration
        const url = supabase.supabaseUrl;
        const key = supabase.supabaseKey;

        if (!url || !key) {
          throw new Error(
            `Missing configuration - URL: ${!!url}, Key: ${!!key}`,
          );
        }

        console.log("✓ Supabase configuration present");
        console.log("- URL:", url?.substring(0, 30) + "...");
        console.log("- Key:", key?.substring(0, 20) + "...");

        // Test 3: Network connectivity check
        console.log("Testing network connectivity...");
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const response = await fetch("https://httpbin.org/get", {
            method: "GET",
            mode: "cors",
            cache: "no-cache",
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            console.log("✓ Internet connectivity confirmed");
          } else {
            console.warn("⚠ Internet connectivity test returned non-200 status");
          }
        } catch (netError) {
          console.warn("⚠ Internet connectivity test failed:", netError);
          // Don't fail the entire test, just log the warning
        }

        // Test 4: Try to access auth (doesn't require database access)
        try {
          const session = await supabase.auth.getSession();
          console.log(
            "✓ Auth module accessible, session:",
            !!session.data.session,
          );
        } catch (authError) {
          console.warn("⚠ Auth access failed:", authError);
          // Continue with database test
        }

        // Test 5: Enhanced database query with retry logic
        console.log("Testing database access with retry logic...");

        let lastError: any = null;
        const maxRetries = 3;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`Database attempt ${attempt}/${maxRetries}`);
            
            const { data, error } = await supabase
              .from("profesionales_sanitarios")
              .select("id")
              .limit(1);

            if (error) {
              console.log(`Attempt ${attempt} database error:`, {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
              });
              
              lastError = error;
              
              // If it's not a network error, don't retry
              if (!error.message?.includes('fetch') && 
                  !error.message?.includes('network') &&
                  !error.message?.includes('timeout')) {
                console.log("Non-network error detected, stopping retries");
                break;
              }
              
              // Wait before retry (exponential backoff)
              if (attempt < maxRetries) {
                const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s
                console.log(`Waiting ${delayMs}ms before retry...`);
                await new Promise((resolve) => setTimeout(resolve, delayMs));
              }
              continue;
            }

            console.log("✓ Database query successful");
            console.log("- Records available:", data?.length || 0);

            return {
              status: "connected",
              hasRecords: (data?.length || 0) > 0,
              recordCount: data?.length || 0,
              message: "Supabase connection successful",
              attempts: attempt,
            };
          } catch (queryErr: any) {
            console.error(`Database attempt ${attempt} exception:`, queryErr);
            lastError = queryErr;
            
            // Enhanced error classification
            const isFetchError = queryErr?.message?.includes('fetch') ||
                                queryErr?.message?.includes('Failed to fetch') ||
                                queryErr?.name === 'TypeError';
            
            const isNetworkError = queryErr?.message?.includes('network') ||
                                  queryErr?.message?.includes('timeout') ||
                                  queryErr?.name === 'NetworkError';
            
            console.log(`Error classification - Fetch: ${isFetchError}, Network: ${isNetworkError}`);
            
            // If it's not a retryable error and it's the last attempt, break
            if (!isFetchError && !isNetworkError && attempt === maxRetries) {
              break;
            }
            
            // Wait before retry
            if (attempt < maxRetries) {
              const delayMs = Math.pow(2, attempt) * 1000;
              console.log(`Waiting ${delayMs}ms before retry after exception...`);
              await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
          }
        }

        // If we got here, all attempts failed
        console.error("All database connection attempts failed");
        
        const errorMessage = lastError?.message ||
                           lastError?.details ||
                           lastError?.hint ||
                           JSON.stringify(lastError) ||
                           "Unknown database error";
        
        throw new Error(`Database connection failed after ${maxRetries} attempts: ${errorMessage}`);
        
      } catch (error: any) {
        console.error("=== CONNECTIVITY TEST FAILED ===");
        console.error("Error:", error);
        console.error("Type:", typeof error);
        console.error("Constructor:", error?.constructor?.name);
        console.error("Message:", error?.message);
        console.error("Stack:", error?.stack);

        // Enhanced error reporting
        const errorType = error?.constructor?.name || typeof error;
        const errorMessage = error?.message || error?.toString() || "Unknown error";
        
        // Provide specific guidance based on error type
        let userFriendlyMessage = errorMessage;
        if (errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
          userFriendlyMessage = "Network connection failed. Please check your internet connection and try refreshing the page.";
        } else if (errorMessage.includes('timeout')) {
          userFriendlyMessage = "Connection timeout. The server is taking too long to respond.";
        } else if (errorMessage.includes('CORS')) {
          userFriendlyMessage = "Cross-origin request blocked. This might be a browser security issue.";
        }

        return {
          status: "failed",
          error: userFriendlyMessage,
          originalError: errorMessage,
          details: {
            type: errorType,
            hasMessage: !!error?.message,
            hasStack: !!error?.stack,
            timestamp: new Date().toISOString(),
          },
        };
      }
    },
    retry: (failureCount, error) => {
      // Retry up to 2 times for network errors
      if (failureCount < 2) {
        const errorMessage = error?.message || '';
        return errorMessage.includes('fetch') || 
               errorMessage.includes('network') || 
               errorMessage.includes('timeout');
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchInterval: false,
    gcTime: 0, // Don't cache results
  });
}
