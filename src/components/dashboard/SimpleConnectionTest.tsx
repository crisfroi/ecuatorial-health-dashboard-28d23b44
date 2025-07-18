import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { useSimpleConnectionTest } from "@/hooks/useSimpleConnectionTest";

const SimpleConnectionTest = () => {
  const { runTest, isLoading, results } = useSimpleConnectionTest();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "error":
      case "caught_error":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "error":
      case "caught_error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Test de Conexión Simplificado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={runTest}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Ejecutando..." : "Ejecutar Test"}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.test}</span>
                  </div>
                  <Badge className={getStatusColor(result.status)}>
                    {result.status}
                  </Badge>
                </div>

                {result.status === "success" && (
                  <div className="text-sm text-green-700">✅ Test exitoso</div>
                )}

                {(result.status === "error" ||
                  result.status === "caught_error") && (
                  <div className="space-y-2">
                    <div className="text-sm text-red-700">
                      <strong>Error detectado:</strong>
                    </div>

                    {result.extractedMessage && (
                      <div className="text-xs bg-red-50 p-2 rounded">
                        <strong>Mensaje extraído:</strong>{" "}
                        {result.extractedMessage}
                      </div>
                    )}

                    {result.rawMessage !== undefined && (
                      <div className="text-xs bg-orange-50 p-2 rounded">
                        <strong>Mensaje raw ({result.messageType}):</strong>{" "}
                        {typeof result.rawMessage === "object"
                          ? JSON.stringify(result.rawMessage)
                          : String(result.rawMessage)}
                      </div>
                    )}

                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                        Ver error completo
                      </summary>
                      <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto max-h-40 whitespace-pre-wrap">
                        {JSON.stringify(
                          result.error,
                          Object.getOwnPropertyNames(result.error),
                          2,
                        )}
                      </pre>
                    </details>
                  </div>
                )}

                {result.data && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-green-600 hover:text-green-800">
                      Ver datos de respuesta
                    </summary>
                    <pre className="mt-2 bg-green-50 p-2 rounded overflow-auto max-h-40 whitespace-pre-wrap">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-500 border-t pt-3">
          <p>
            <strong>Este test ayuda a identificar:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Problemas específicos con el formato de errores</li>
            <li>
              Diferencias entre errores de Supabase y errores de JavaScript
            </li>
            <li>Estado de autenticación actual</li>
            <li>Accesibilidad básica a la base de datos</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleConnectionTest;
