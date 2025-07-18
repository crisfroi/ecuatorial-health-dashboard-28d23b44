import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SupabaseDebugTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const runDebugTest = async () => {
    setIsLoading(true);
    setResults([]);

    const testResults: any[] = [];

    // Test 1: Check if the table actually exists
    try {
      console.log("=== Testing if profesionales_sanitarios table exists ===");

      const { data, error, count } = await supabase
        .from("profesionales_sanitarios")
        .select("*", { count: "exact", head: true });

      console.log("Table existence test:", { data, error, count });

      if (error) {
        // Log every possible property of the error
        console.log("Error object detailed analysis:");
        console.log("- error:", error);
        console.log("- error.message:", error.message);
        console.log("- error.details:", error.details);
        console.log("- error.hint:", error.hint);
        console.log("- error.code:", error.code);
        console.log("- typeof error.message:", typeof error.message);
        console.log("- error.message.length:", error.message?.length);
        console.log("- JSON.stringify(error):", JSON.stringify(error, null, 2));

        // Try to get ALL enumerable properties
        const allProps = Object.getOwnPropertyNames(error);
        console.log("- All error properties:", allProps);
        allProps.forEach((prop) => {
          console.log(`  - ${prop}:`, error[prop]);
        });

        testResults.push({
          test: "Table Existence Check",
          status: "error",
          message: error.message || "No message",
          details: error.details || "No details",
          hint: error.hint || "No hint",
          code: error.code || "No code",
          fullError: error,
          errorType: typeof error,
          errorConstructor: error?.constructor?.name,
        });
      } else {
        testResults.push({
          test: "Table Existence Check",
          status: "success",
          count: count,
          message: `Table exists with ${count} records`,
        });
      }
    } catch (catchError: any) {
      console.error("Caught exception:", catchError);
      testResults.push({
        test: "Table Existence Check",
        status: "exception",
        message: catchError.message || "No message in exception",
        error: catchError,
      });
    }

    // Test 2: Try to get session info
    try {
      console.log("=== Testing Session Info ===");
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        console.log("Session error:", sessionError);
        testResults.push({
          test: "Session Check",
          status: "error",
          message: sessionError.message || "No session error message",
          error: sessionError,
        });
      } else {
        testResults.push({
          test: "Session Check",
          status: "success",
          hasSession: !!sessionData.session,
          sessionData: sessionData.session ? "Session exists" : "No session",
        });
      }
    } catch (catchError: any) {
      testResults.push({
        test: "Session Check",
        status: "exception",
        message: catchError.message || "No message in session exception",
        error: catchError,
      });
    }

    // Test 3: Try a very simple query
    try {
      console.log("=== Testing Simple Query ===");
      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .select("id")
        .limit(1);

      if (error) {
        console.log("Simple query error:", error);
        // Detailed error analysis again
        const errorDetails = {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          messageType: typeof error.message,
          messageEmpty: error.message === "",
          messageLength: error.message?.length,
          hasMessage: "message" in error,
          allKeys: Object.keys(error),
          jsonString: JSON.stringify(error, null, 2),
        };

        console.log("Simple query error details:", errorDetails);

        testResults.push({
          test: "Simple Query",
          status: "error",
          ...errorDetails,
          fullError: error,
        });
      } else {
        testResults.push({
          test: "Simple Query",
          status: "success",
          resultCount: data?.length || 0,
          message: `Query successful, got ${data?.length || 0} results`,
        });
      }
    } catch (catchError: any) {
      testResults.push({
        test: "Simple Query",
        status: "exception",
        message: catchError.message || "No message in query exception",
        error: catchError,
      });
    }

    setResults(testResults);
    setIsLoading(false);
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Debug Test Supabase - Análisis Detallado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={runDebugTest}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Ejecutando..." : "Ejecutar Debug Test"}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">Resultados del Test de Debug:</h3>
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

                <div className="text-sm space-y-1">
                  {result.message && (
                    <div>
                      <strong>Mensaje:</strong> "{result.message}"
                    </div>
                  )}
                  {result.details && (
                    <div>
                      <strong>Detalles:</strong> {result.details}
                    </div>
                  )}
                  {result.hint && (
                    <div>
                      <strong>Sugerencia:</strong> {result.hint}
                    </div>
                  )}
                  {result.code && (
                    <div>
                      <strong>Código:</strong> {result.code}
                    </div>
                  )}
                  {result.count !== undefined && (
                    <div>
                      <strong>Conteo:</strong> {result.count}
                    </div>
                  )}
                  {result.messageType && (
                    <div>
                      <strong>Tipo de Mensaje:</strong> {result.messageType}
                    </div>
                  )}
                  {result.messageEmpty !== undefined && (
                    <div>
                      <strong>Mensaje Vacío:</strong>{" "}
                      {result.messageEmpty ? "Sí" : "No"}
                    </div>
                  )}
                  {result.messageLength !== undefined && (
                    <div>
                      <strong>Longitud del Mensaje:</strong>{" "}
                      {result.messageLength}
                    </div>
                  )}
                </div>

                {(result.status === "error" || result.status === "exception") &&
                  result.fullError && (
                    <details className="text-xs mt-2">
                      <summary className="cursor-pointer text-red-600 hover:text-red-800">
                        Ver error completo
                      </summary>
                      <pre className="mt-2 bg-red-50 p-2 rounded overflow-auto max-h-40 whitespace-pre-wrap">
                        {JSON.stringify(
                          result.fullError,
                          Object.getOwnPropertyNames(result.fullError),
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
            <strong>Este test específico verifica:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Si la tabla profesionales_sanitarios existe y es accesible</li>
            <li>Estado de la sesión de autenticación</li>
            <li>Capacidad de realizar consultas básicas</li>
            <li>Análisis detallado de errores incluyendo propiedades vacías</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupabaseDebugTest;
