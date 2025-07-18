import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage, logError } from "@/utils/errorHandler";

const DatabaseDiagnostics = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    const diagnosticResults = [];

    // Test 0: Internet connectivity
    try {
      console.log("Running diagnostic 0: Internet connectivity...");
      const startTime = Date.now();
      const response = await fetch("https://httpbin.org/status/200", {
        method: "GET",
        mode: "cors",
      });
      const endTime = Date.now();

      diagnosticResults.push({
        test: "Internet Connectivity",
        status: response.ok ? "success" : "error",
        message: response.ok
          ? "Internet connection working"
          : `Network error ${response.status}`,
        duration: `${endTime - startTime}ms`,
      });
    } catch (err: any) {
      logError("Internet connectivity test failed", err);
      diagnosticResults.push({
        test: "Internet Connectivity",
        status: "error",
        message: getErrorMessage(err),
        duration: "N/A",
        details: err,
      });
    }

    // Test 1: Basic connection
    try {
      console.log("Running diagnostic 1: Basic connection...");
      const startTime = Date.now();
      const response = await fetch(
        "https://wdieynendfjbkbhfovrx.supabase.co/rest/v1/",
        {
          headers: {
            apikey:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWV5bmVuZGZqYmtiaGZvdnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODI5MjEsImV4cCI6MjA2NjM1ODkyMX0.yFnLHavy8wzVjlg3sAI2mEG-XGDCV5FSr7OQsMefxL8",
          },
        },
      );
      const endTime = Date.now();

      diagnosticResults.push({
        test: "Basic HTTP Connection",
        status: response.ok ? "success" : "error",
        message: response.ok
          ? `Connected (${response.status})`
          : `HTTP Error ${response.status}`,
        duration: `${endTime - startTime}ms`,
      });
    } catch (err: any) {
      diagnosticResults.push({
        test: "Basic HTTP Connection",
        status: "error",
        message: err.message,
        duration: "N/A",
      });
    }

    // Test 2: Supabase client initialization
    try {
      console.log("Running diagnostic 2: Client initialization...");
      const channel = supabase.channel("test");
      diagnosticResults.push({
        test: "Supabase Client",
        status: "success",
        message: "Client initialized successfully",
        duration: "N/A",
      });
      channel.unsubscribe();
    } catch (err: any) {
      diagnosticResults.push({
        test: "Supabase Client",
        status: "error",
        message: err.message,
        duration: "N/A",
      });
    }

    // Test 3: Table exists check
    try {
      console.log("Running diagnostic 3: Table existence...");
      const startTime = Date.now();
      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .select("count(*)", { count: "exact", head: true });
      const endTime = Date.now();

      diagnosticResults.push({
        test: "Table Existence",
        status: error ? "error" : "success",
        message: error ? error.message : `Table accessible (count query)`,
        duration: `${endTime - startTime}ms`,
        details: error ? error : data,
      });
    } catch (err: any) {
      diagnosticResults.push({
        test: "Table Existence",
        status: "error",
        message: err.message,
        duration: "N/A",
      });
    }

    // Test 4: Simple select
    try {
      console.log("Running diagnostic 4: Simple select...");
      const startTime = Date.now();
      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .select("id")
        .limit(1);
      const endTime = Date.now();

      diagnosticResults.push({
        test: "Simple Select Query",
        status: error ? "error" : "success",
        message: error
          ? error.message
          : `Query successful (${data?.length || 0} records)`,
        duration: `${endTime - startTime}ms`,
        details: error ? error : data,
      });
    } catch (err: any) {
      diagnosticResults.push({
        test: "Simple Select Query",
        status: "error",
        message: err.message,
        duration: "N/A",
      });
    }

    // Test 5: Full select query (like estadisticas)
    try {
      console.log("Running diagnostic 5: Full select...");
      const startTime = Date.now();
      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .select("*")
        .limit(5);
      const endTime = Date.now();

      diagnosticResults.push({
        test: "Full Select Query",
        status: error ? "error" : "success",
        message: error
          ? error.message
          : `Query successful (${data?.length || 0} records)`,
        duration: `${endTime - startTime}ms`,
        details: error ? error : { recordCount: data?.length },
      });
    } catch (err: any) {
      diagnosticResults.push({
        test: "Full Select Query",
        status: "error",
        message: err.message,
        duration: "N/A",
      });
    }

    setResults(diagnosticResults);
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 border-green-300";
      case "error":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            <span>Diagnósticos de Base de Datos</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {isExpanded ? "Ocultar" : "Mostrar"}
          </Button>
        </CardTitle>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            <Button
              onClick={runDiagnostics}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isRunning ? "Ejecutando..." : "Ejecutar Diagnósticos"}
            </Button>

            {results.length > 0 && (
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <div className="font-medium">{result.test}</div>
                        <div className="text-sm text-gray-600">
                          {result.message}
                        </div>
                        {result.details && (
                          <details className="mt-1">
                            <summary className="text-xs cursor-pointer text-blue-600">
                              Ver detalles
                            </summary>
                            <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {result.duration}
                      </Badge>
                      <Badge
                        className={`text-xs ${getStatusColor(result.status)}`}
                      >
                        {result.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-xs text-gray-500 space-y-1">
              <p>
                <strong>Información de conexión:</strong>
              </p>
              <p>• URL: https://wdieynendfjbkbhfovrx.supabase.co</p>
              <p>• Proyecto: wdieynendfjbkbhfovrx</p>
              <p>• Tabla: profesionales_sanitarios</p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default DatabaseDiagnostics;
