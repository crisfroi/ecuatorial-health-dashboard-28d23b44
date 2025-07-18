import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useErrorAnalysis } from "@/hooks/useErrorAnalysis";

const ErrorAnalysis = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: analysis, isLoading, error, refetch } = useErrorAnalysis();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
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
            <AlertTriangle className="w-5 h-5" />
            <span>Análisis Detallado de Errores</span>
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
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              {isLoading ? "Analizando..." : "Ejecutar Análisis"}
            </Button>

            {error && (
              <div className="p-3 border border-red-300 rounded-lg bg-red-50">
                <p className="text-red-800 font-medium">
                  Error en el análisis:
                </p>
                <p className="text-red-600 text-sm">{error.message}</p>
              </div>
            )}

            {analysis && (
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <strong>Análisis ejecutado:</strong>{" "}
                  {new Date(analysis.timestamp).toLocaleString()}
                </div>

                {analysis.results.map((result: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <span className="font-medium">{result.test}</span>
                      </div>
                      <Badge
                        className={`text-xs ${getStatusColor(result.status)}`}
                      >
                        {result.status}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <details>
                        <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                          Ver datos completos
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-96 whitespace-pre-wrap">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>

                      {result.status === "error" && result.data && (
                        <div className="bg-red-50 p-3 rounded border border-red-200">
                          <p className="text-sm font-medium text-red-800 mb-2">
                            Análisis del Error:
                          </p>
                          <div className="space-y-1 text-xs text-red-700">
                            <p>
                              <strong>Tipo:</strong> {result.data.type}
                            </p>
                            <p>
                              <strong>Constructor:</strong>{" "}
                              {result.data.constructor}
                            </p>
                            <p>
                              <strong>Mensaje:</strong>{" "}
                              {result.data.message || "Sin mensaje"}
                            </p>
                            {result.data.code && (
                              <p>
                                <strong>Código:</strong> {result.data.code}
                              </p>
                            )}
                            {result.data.details && (
                              <p>
                                <strong>Detalles:</strong> {result.data.details}
                              </p>
                            )}
                            {result.data.hint && (
                              <p>
                                <strong>Sugerencia:</strong> {result.data.hint}
                              </p>
                            )}
                            <p>
                              <strong>Propiedades:</strong> [
                              {result.data.keys?.join(", ") || "ninguna"}]
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-xs text-gray-500 space-y-1 border-t pt-3">
              <p>
                <strong>Este análisis ayuda a identificar:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Si el problema es de conectividad de red</li>
                <li>Si hay errores de autenticación con Supabase</li>
                <li>Si las políticas RLS están bloqueando el acceso</li>
                <li>Si la tabla existe y es accesible</li>
                <li>Detalles específicos de los errores de PostgreSQL</li>
              </ul>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ErrorAnalysis;
