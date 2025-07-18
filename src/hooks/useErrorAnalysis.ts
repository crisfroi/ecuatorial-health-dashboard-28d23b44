import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useErrorAnalysis() {
  return useQuery({
    queryKey: ["error-analysis"],
    queryFn: async () => {
      console.log("Starting detailed error analysis...");

      const results: any[] = [];

      // Test 1: Raw fetch to Supabase
      try {
        console.log("Test 1: Raw fetch to Supabase REST API...");
        const response = await fetch(
          "https://wdieynendfjbkbhfovrx.supabase.co/rest/v1/",
          {
            headers: {
              apikey:
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWV5bmVuZGZqYmtiaGZvdnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODI5MjEsImV4cCI6MjA2NjM1ODkyMX0.yFnLHavy8wzVjlg3sAI2mEG-XGDCV5FSr7OQsMefxL8",
              Authorization:
                "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWV5bmVuZGZqYmtiaGZvdnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODI5MjEsImV4cCI6MjA2NjM1ODkyMX0.yFnLHavy8wzVjlg3sAI2mEG-XGDCV5FSr7OQsMefxL8",
            },
          },
        );

        const responseText = await response.text();

        results.push({
          test: "Raw Fetch",
          status: response.ok ? "success" : "error",
          data: {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: responseText.substring(0, 500),
          },
        });
      } catch (error: any) {
        console.error("Raw fetch failed:", error);

        // Análisis detallado del error
        const errorAnalysis = {
          type: typeof error,
          constructor: error?.constructor?.name,
          message: error?.message,
          name: error?.name,
          stack: error?.stack?.substring(0, 200),
          keys: Object.keys(error || {}),
          stringified: (() => {
            try {
              return JSON.stringify(error, Object.getOwnPropertyNames(error));
            } catch (e) {
              return "Cannot stringify";
            }
          })(),
          toString: (() => {
            try {
              return error?.toString();
            } catch (e) {
              return "Cannot toString";
            }
          })(),
        };

        results.push({
          test: "Raw Fetch",
          status: "error",
          data: errorAnalysis,
        });
      }

      // Test 2: Supabase client simple query
      try {
        console.log("Test 2: Supabase client query...");
        const { data, error } = await supabase
          .from("profesionales_sanitarios")
          .select("count(*)", { count: "exact", head: true });

        if (error) {
          console.error("Supabase query error:", error);

          const errorAnalysis = {
            type: typeof error,
            constructor: error?.constructor?.name,
            message: error?.message,
            details: error?.details,
            hint: error?.hint,
            code: error?.code,
            keys: Object.keys(error || {}),
            fullError: error,
          };

          results.push({
            test: "Supabase Query",
            status: "error",
            data: errorAnalysis,
          });
        } else {
          results.push({
            test: "Supabase Query",
            status: "success",
            data: { count: data },
          });
        }
      } catch (error: any) {
        console.error("Supabase query failed:", error);

        const errorAnalysis = {
          type: typeof error,
          constructor: error?.constructor?.name,
          message: error?.message,
          name: error?.name,
          stack: error?.stack?.substring(0, 200),
          keys: Object.keys(error || {}),
          stringified: (() => {
            try {
              return JSON.stringify(error, Object.getOwnPropertyNames(error));
            } catch (e) {
              return "Cannot stringify";
            }
          })(),
        };

        results.push({
          test: "Supabase Query",
          status: "error",
          data: errorAnalysis,
        });
      }

      return {
        timestamp: new Date().toISOString(),
        results,
      };
    },
    retry: false,
    refetchInterval: false,
  });
}
