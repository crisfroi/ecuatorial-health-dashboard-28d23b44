import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage, logError } from "@/utils/errorHandler";

export function useEstadisticasTest() {
  return useQuery({
    queryKey: ["estadisticas-test"],
    queryFn: async () => {
      console.log("Testing simple estadisticas fetch...");

      try {
        // Pre-test: Validate Supabase configuration
        console.log("Pre-test: Validating Supabase configuration...");

        if (!supabase) {
          throw new Error("Supabase client not initialized");
        }

        // Check if we have a valid URL and key
        const supabaseUrl = supabase.supabaseUrl;
        const supabaseKey = supabase.supabaseKey;

        console.log("Supabase URL:", supabaseUrl?.substring(0, 30) + "...");
        console.log("Supabase Key:", supabaseKey?.substring(0, 20) + "...");
        console.log("Supabase client auth:", !!supabase.auth);
        console.log("Supabase client realtime:", !!supabase.realtime);

        if (!supabaseUrl) {
          throw new Error("Supabase URL not configured");
        }

        if (!supabaseKey) {
          throw new Error("Supabase key not configured");
        }

        // Validate URL format
        try {
          new URL(supabaseUrl);
        } catch (urlError) {
          throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`);
        }

        // Test basic network connectivity first
        console.log("Pre-test: Checking network connectivity...");
        try {
          // Create timeout controller for better browser support
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          // Simple fetch test to check if we can reach the internet
          const connectivityTest = await fetch("https://httpbin.org/get", {
            method: "GET",
            mode: "cors",
            cache: "no-cache",
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!connectivityTest.ok) {
            console.warn(
              "Internet connectivity test failed, but proceeding with database test",
            );
          } else {
            console.log("Internet connectivity test passed");
          }
        } catch (connectivityError) {
          console.warn("Internet connectivity test failed:", connectivityError);
          console.warn("Proceeding with database test anyway...");
        }

        // Test Supabase service availability
        console.log("Testing Supabase service availability...");
        try {
          const supabaseHealthCheck = await fetch(`${supabaseUrl}/health`, {
            method: "GET",
            cache: "no-cache",
          });

          console.log(
            "Supabase health check status:",
            supabaseHealthCheck.status,
          );

          if (supabaseHealthCheck.ok) {
            console.log("Supabase service is reachable");
          } else {
            console.warn(
              "Supabase service returned non-200 status:",
              supabaseHealthCheck.status,
            );
          }
        } catch (supabaseError) {
          console.warn("Supabase service check failed:", supabaseError);
          console.warn(
            "This might indicate network issues or service unavailability",
          );
        }

        // Test 1a: Basic ping test
        console.log("Test 1a: Basic ping test...");
        try {
          const { data: pingTest, error: pingError } = await supabase
            .from("profesionales_sanitarios")
            .select("id")
            .limit(1)
            .maybeSingle();

          console.log("Ping test result:", {
            data: pingTest,
            error: pingError,
          });

          if (pingError) {
            console.error("Ping test failed:", pingError);
            throw new Error(`Ping test failed: ${getErrorMessage(pingError)}`);
          }
        } catch (pingErr: any) {
          console.error("Ping test exception:", pingErr);
          throw new Error(
            `Network connectivity issue: ${getErrorMessage(pingErr)}`,
          );
        }

        // Test 1b: Simple table access test (avoid count which might be restricted)
        console.log("Test 1b: Simple table access test...");
        const { data: connectionTest, error: connectionError } = await supabase
          .from("profesionales_sanitarios")
          .select("id")
          .limit(1);

        if (connectionError) {
          console.error("=== CONNECTION ERROR DEBUGGING ===");
          console.error("- Type:", typeof connectionError);
          console.error("- Constructor:", connectionError?.constructor?.name);
          console.error("- Keys:", Object.keys(connectionError || {}));
          console.error(
            "- Own Property Names:",
            Object.getOwnPropertyNames(connectionError || {}),
          );
          console.error(
            "- Message property type:",
            typeof connectionError?.message,
          );
          console.error("- Message property value:", connectionError?.message);
          console.error("- Message length:", connectionError?.message?.length);
          console.error("- Code:", connectionError?.code);
          console.error("- Details:", connectionError?.details);
          console.error("- Hint:", connectionError?.hint);
          console.error("- Status:", connectionError?.status);
          console.error("- StatusText:", connectionError?.statusText);
          console.error("- Name:", connectionError?.name);
          console.error("- Full object:", connectionError);

          // Try different serialization methods
          try {
            console.error(
              "- JSON.stringify (basic):",
              JSON.stringify(connectionError),
            );
          } catch (e) {
            console.error("- JSON.stringify (basic) failed:", e);
          }

          try {
            console.error(
              "- JSON.stringify (with getOwnPropertyNames):",
              JSON.stringify(
                connectionError,
                Object.getOwnPropertyNames(connectionError),
                2,
              ),
            );
          } catch (e) {
            console.error(
              "- JSON.stringify (with getOwnPropertyNames) failed:",
              e,
            );
          }

          // Check if it's a network error
          if (
            connectionError instanceof TypeError &&
            connectionError.message.includes("fetch")
          ) {
            console.error("- DETECTED: Network fetch error");
          }

          // Check for specific error patterns
          if (
            connectionError.message === "" ||
            connectionError.message === undefined
          ) {
            console.error("- DETECTED: Empty or undefined message");

            // Look for alternative error information
            const alternativeInfo = [];
            if (connectionError.code)
              alternativeInfo.push(`Code: ${connectionError.code}`);
            if (connectionError.status)
              alternativeInfo.push(`Status: ${connectionError.status}`);
            if (connectionError.statusText)
              alternativeInfo.push(`StatusText: ${connectionError.statusText}`);
            if (connectionError.name)
              alternativeInfo.push(`Name: ${connectionError.name}`);

            if (alternativeInfo.length > 0) {
              console.error(
                "- Alternative error info:",
                alternativeInfo.join(", "),
              );
            }
          }

          // Additional debugging for empty message errors
          if (connectionError.message === "") {
            console.error("EMPTY MESSAGE DETECTED - Additional debugging:");
            console.error("- Error toString():", connectionError.toString());
            console.error("- Error valueOf():", connectionError.valueOf());
            console.error(
              "- All properties:",
              Object.getOwnPropertyNames(connectionError),
            );

            // Try to extract more information
            const allProps = Object.getOwnPropertyNames(connectionError);
            allProps.forEach((prop) => {
              console.error(`- ${prop}:`, connectionError[prop]);
            });
          }

          logError("Connection test failed", connectionError);

          // Generate more specific error message based on error analysis
          let errorMsg = getErrorMessage(connectionError);
          console.error("Processed error message:", errorMsg);

          // If we got the generic empty response message, try to provide more context
          if (
            errorMsg === "Database connection failed - empty error response"
          ) {
            console.error(
              "Attempting to provide more context for empty error...",
            );

            // Check for common connection issues
            const diagnostics = [];

            // Check if we're online
            if (!navigator.onLine) {
              diagnostics.push("Device appears to be offline");
            }

            // Check current URL for potential issues
            const currentUrl = window.location.href;
            if (currentUrl.includes("localhost")) {
              diagnostics.push(
                "Running on localhost - may have different CORS/connection behavior",
              );
            }

            // Check if error has any properties at all
            const errorKeys = Object.keys(connectionError || {});
            if (errorKeys.length === 0) {
              diagnostics.push("Error object is completely empty");
            } else {
              diagnostics.push(`Error has properties: ${errorKeys.join(", ")}`);
            }

            // Check error type
            if (connectionError instanceof TypeError) {
              diagnostics.push("TypeError suggests network/fetch issue");
            } else if (connectionError instanceof Error) {
              diagnostics.push(
                `Standard Error type: ${connectionError.constructor.name}`,
              );
            }

            if (diagnostics.length > 0) {
              errorMsg = `Database connection failed. Diagnostics: ${diagnostics.join("; ")}`;
            } else {
              errorMsg =
                "Database connection failed - unable to determine cause. Check network connection and Supabase configuration.";
            }
          }

          throw new Error(`Connection failed: ${errorMsg}`);
        }

        console.log("Connection test passed");

        // Test 2: Simple select with retry logic
        console.log("Test 2: Simple select test...");

        let data, error;
        const maxRetries = 3;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`Select attempt ${attempt}/${maxRetries}`);

            const result = await supabase
              .from("profesionales_sanitarios")
              .select("id, estado_solicitud")
              .limit(5);

            data = result.data;
            error = result.error;

            // If no error, break out of retry loop
            if (!error) {
              console.log("Select succeeded on attempt", attempt);
              break;
            }

            console.log(`Select attempt ${attempt} failed:`, error);

            // If it's not a network error, don't retry
            if (!error.message?.includes("fetch") && error.message !== "") {
              console.log("Non-network error detected, stopping retries");
              break;
            }

            // Wait before retry (exponential backoff)
            if (attempt < maxRetries) {
              const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
              console.log(`Waiting ${delayMs}ms before retry...`);
              await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
          } catch (selectException: any) {
            console.error(
              `Select attempt ${attempt} threw exception:`,
              selectException,
            );
            error = selectException;

            // If it's the last attempt, let the error bubble up
            if (attempt === maxRetries) {
              break;
            }
          }
        }

        if (error) {
          console.error("=== SELECT ERROR ANALYSIS ===");
          console.error("- Type:", typeof error);
          console.error("- Constructor:", error?.constructor?.name);
          console.error("- Keys:", Object.keys(error || {}));
          console.error("- Message property:", error?.message);
          console.error("- Full object:", error);

          // Check for specific fetch failure patterns
          const isFetchError =
            error?.message?.includes("fetch") ||
            error?.message?.includes("Failed to fetch") ||
            (error?.name === "TypeError" && error?.message?.includes("fetch"));

          const isNetworkError =
            error?.message?.includes("network") ||
            error?.message?.includes("NetworkError") ||
            error?.code === "NETWORK_ERROR";

          const isCorsError =
            error?.message?.includes("CORS") ||
            error?.message?.includes("Cross-Origin") ||
            error?.message?.includes("cors");

          console.error("Error classification:");
          console.error("- Is fetch error:", isFetchError);
          console.error("- Is network error:", isNetworkError);
          console.error("- Is CORS error:", isCorsError);

          logError("Select test failed", error);
          let errorMsg = getErrorMessage(error);
          console.error("Processed select error message:", errorMsg);

          // Provide specific guidance based on error type
          if (isFetchError) {
            errorMsg = `Network request failed: ${errorMsg}. This could be due to CORS policy, network connectivity, or Supabase service unavailability.`;
          } else if (isNetworkError) {
            errorMsg = `Network error: ${errorMsg}. Check internet connection and firewall settings.`;
          } else if (isCorsError) {
            errorMsg = `CORS error: ${errorMsg}. Check Supabase project settings and allowed origins.`;
          }

          throw new Error(`Select failed: ${errorMsg}`);
        }

        console.log("Test query successful:", data);
        console.log("Data length:", data?.length);

        // Return simple test data
        return {
          total: data?.length || 0,
          aprobados:
            data?.filter((p) => p.estado_solicitud === "Aprobado").length || 0,
          pendientes:
            data?.filter((p) => p.estado_solicitud === "Pendiente").length || 0,
          test: "working",
          sampleData: data?.slice(0, 2), // Show first 2 records for debugging
        };
      } catch (err: any) {
        console.error("=== COMPREHENSIVE ERROR DEBUGGING ===");
        console.error("Error caught in test:", err);
        console.error("Error type:", typeof err);
        console.error("Error constructor:", err?.constructor?.name);
        console.error("Error instanceof Error:", err instanceof Error);
        console.error("Error keys:", Object.keys(err || {}));
        console.error(
          "Error own property names:",
          Object.getOwnPropertyNames(err || {}),
        );

        // Check for network-related issues
        if (err?.message?.includes("fetch") || err?.name === "NetworkError") {
          console.error("Network error detected");
        }

        // Check for CORS issues
        if (
          err?.message?.includes("CORS") ||
          err?.message?.includes("origin")
        ) {
          console.error("CORS error detected");
        }

        // Check for authentication issues
        if (err?.status === 401 || err?.message?.includes("unauthorized")) {
          console.error("Authentication error detected");
        }

        // Log browser/environment info
        console.error("Environment info:");
        console.error("- User agent:", navigator.userAgent);
        console.error("- Online:", navigator.onLine);
        console.error("- Location:", window.location.href);

        logError("Test query failed", err);
        throw new Error(`Test failed: ${getErrorMessage(err)}`);
      }
    },
    retry: 1,
    refetchInterval: false,
  });
}
