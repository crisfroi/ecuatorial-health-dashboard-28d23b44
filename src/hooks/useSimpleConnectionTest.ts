import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSimpleConnectionTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const runTest = async () => {
    setIsLoading(true);
    setResults([]);

    const testResults: any[] = [];

    // Test 1: Basic ping
    try {
      console.log("=== TEST 1: Basic Supabase Health Check ===");
      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .select("count(*)", { count: "exact", head: true });

      console.log("Raw response data:", data);
      console.log("Raw response error:", error);

      if (error) {
        console.log("Error object analysis:");
        console.log("- typeof error:", typeof error);
        console.log("- error.constructor.name:", error?.constructor?.name);
        console.log("- Object.keys(error):", Object.keys(error || {}));
        console.log("- error.message:", error.message);
        console.log("- typeof error.message:", typeof error.message);
        console.log("- error.details:", error.details);
        console.log("- error.hint:", error.hint);
        console.log("- error.code:", error.code);

        // Try different ways to extract the message
        let extractedMessage = "Unknown error";
        if (typeof error.message === "string" && error.message.trim()) {
          extractedMessage = error.message;
        } else if (error.details) {
          extractedMessage = error.details;
        } else if (error.hint) {
          extractedMessage = error.hint;
        }

        testResults.push({
          test: "Supabase Health Check",
          status: "error",
          error: error,
          extractedMessage: extractedMessage,
          rawMessage: error.message,
          messageType: typeof error.message,
        });
      } else {
        testResults.push({
          test: "Supabase Health Check",
          status: "success",
          data: data,
        });
      }
    } catch (catchError: any) {
      console.log("Caught error in try-catch:");
      console.log("- typeof catchError:", typeof catchError);
      console.log(
        "- catchError.constructor.name:",
        catchError?.constructor?.name,
      );
      console.log("- catchError.message:", catchError.message);
      console.log("- catchError:", catchError);

      testResults.push({
        test: "Supabase Health Check",
        status: "caught_error",
        error: catchError,
        message: catchError.message,
        messageType: typeof catchError.message,
      });
    }

    // Test 2: Simple select
    try {
      console.log("=== TEST 2: Simple Select Query ===");
      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .select("id")
        .limit(1);

      if (error) {
        console.log("Select error:", error);
        testResults.push({
          test: "Simple Select",
          status: "error",
          error: error,
          message: error.message,
        });
      } else {
        testResults.push({
          test: "Simple Select",
          status: "success",
          data: data,
        });
      }
    } catch (catchError: any) {
      testResults.push({
        test: "Simple Select",
        status: "caught_error",
        error: catchError,
        message: catchError.message,
      });
    }

    // Test 3: Auth status
    try {
      console.log("=== TEST 3: Auth Status ===");
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      testResults.push({
        test: "Auth Status",
        status: authError ? "error" : "success",
        data: authData,
        error: authError,
      });
    } catch (catchError: any) {
      testResults.push({
        test: "Auth Status",
        status: "caught_error",
        error: catchError,
      });
    }

    setResults(testResults);
    setIsLoading(false);
  };

  return {
    runTest,
    isLoading,
    results,
  };
}
