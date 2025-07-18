import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SupabaseConnectionTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const runBasicTest = async () => {
    setIsLoading(true);
    setResults([]);

    const testResults: any[] = [];

    // Test 1: Auth status
    try {
      console.log("=== Testing Auth Status ===");
      const { data: authData, error: authError } =
        await supabase.auth.getSession();

      if (authError) {
        console.error("Auth error:", authError);
        testResults.push({
          test: "Auth Status",
          status: "error",
          error: authError,
          details: `Auth error: ${authError.message || "Unknown auth error"}`,
        });
      } else {
        testResults.push({
          test: "Auth Status",
          status: "success",
          details: `Session status: ${authData.session ? "Active" : "No session"}`,
        });
      }
    } catch (error) {
      testResults.push({
        test: "Auth Status",
        status: "error",
        error,
        details: "Auth test failed with exception",
      });
    }

    // Test 2: Basic table access
    try {
      console.log("=== Testing Basic Table Access ===");

      // Try to access the table without any filters first
      const { data, error, count } = await supabase
        .from("profesionales_sanitarios")
        .select("id", { count: "exact", head: true });

      console.log("Table access result:", { data, error, count });

      if (error) {
        console.error("Table access error:", {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        testResults.push({
          test: "Table Access",
          status: "error",
          error,
          details: `Table error: ${error.details || error.hint || error.message || "Unknown table error"}`,
        });
      } else {
        testResults.push({
          test: "Table Access",
          status: "success",
          details: `Table accessible, count: ${count || "unknown"}`,
        });
      }
    } catch (error) {
      console.error("Table access exception:", error);
      testResults.push({
        test: "Table Access",
        status: "error",
        error,
        details: "Table access failed with exception",
      });
    }

    // Test 3: Simple select query
    try {
      console.log("=== Testing Simple Select ===");

      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .select("id, estado_solicitud")
        .limit(1);

      console.log("Select result:", { data, error });

      if (error) {
        console.error("Select error:", {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        testResults.push({
          test: "Simple Select",
          status: "error",
          error,
          details: `Select error: ${error.details || error.hint || error.message || "Unknown select error"}`,
        });
      } else {
        testResults.push({
          test: "Simple Select",
          status: "success",
          details: `Select successful, rows: ${data?.length || 0}`,
        });
      }
    } catch (error) {
      console.error("Select exception:", error);
      testResults.push({
        test: "Simple Select",
        status: "error",
        error,
        details: "Select query failed with exception",
      });
    }

    // Test 4: Filtered query (like the one that's failing)
    try {
      console.log("=== Testing Filtered Query ===");

      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .select("id, nombre, apellidos, estado_solicitud")
        .eq("estado_solicitud", "Pendiente de Firma")
        .limit(5);

      console.log("Filtered query result:", { data, error });

      if (error) {
        console.error("Filtered query error:", {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        testResults.push({
          test: "Filtered Query",
          status: "error",
          error,
          details: `Filtered query error: ${error.details || error.hint || error.message || "Unknown filter error"}`,
        });
      } else {
        testResults.push({
          test: "Filtered Query",
          status: "success",
          details: `Filtered query successful, pending signatures: ${data?.length || 0}`,
        });
      }
    } catch (error) {
      console.error("Filtered query exception:", error);
      testResults.push({
        test: "Filtered Query",
        status: "error",
        error,
        details: "Filtered query failed with exception",
      });
    }

    setResults(testResults);
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Test de Conexión Supabase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={runBasicTest}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Ejecutando..." : "Ejecutar Test Básico"}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  {result.status === "success" ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="font-medium">{result.test}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      result.status === "success"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {result.status}
                  </span>
                </div>

                <div className="text-sm text-gray-700 mb-2">
                  {result.details}
                </div>

                {result.error && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-red-600 hover:text-red-800">
                      Ver error completo
                    </summary>
                    <pre className="mt-2 bg-red-50 p-2 rounded overflow-auto max-h-40 whitespace-pre-wrap">
                      {JSON.stringify(
                        {
                          message: result.error.message,
                          details: result.error.details,
                          hint: result.error.hint,
                          code: result.error.code,
                          full: result.error,
                        },
                        null,
                        2,
                      )}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-500 border-t pt-3">
          <p>
            <strong>Este test verifica:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Estado de autenticación con Supabase</li>
            <li>Acceso básico a la tabla profesionales_sanitarios</li>
            <li>Consultas simples y filtradas</li>
            <li>Detalles específicos de errores de base de datos</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupabaseConnectionTest;
