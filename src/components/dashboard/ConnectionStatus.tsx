import { AlertTriangle, CheckCircle, Wifi, WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  useSupabaseHealth,
  useSupabaseConnectionInfo,
} from "@/hooks/useSupabaseHealth";

const ConnectionStatus = () => {
  const { data: health, isLoading } = useSupabaseHealth();
  const connectionInfo = useSupabaseConnectionInfo();

  if (isLoading) {
    return (
      <Alert>
        <Wifi className="h-4 w-4" />
        <AlertDescription>
          Verificando conexión a la base de datos...
        </AlertDescription>
      </Alert>
    );
  }

  if (!health) {
    return null;
  }

  const getStatusColor = () => {
    switch (health.status) {
      case "healthy":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "network_error":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = () => {
    switch (health.status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "network_error":
        return <WifiOff className="h-4 w-4 text-orange-600" />;
      default:
        return <Wifi className="h-4 w-4 text-gray-600" />;
    }
  };

  if (health.status === "healthy") {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {getStatusIcon()}
        <span>Conectado</span>
        {health.responseTime && (
          <Badge variant="outline" className="text-xs">
            {health.responseTime}ms
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Alert variant="destructive" className="mb-4">
      {getStatusIcon()}
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-semibold">
            {health.status === "network_error"
              ? "Error de Conexión"
              : "Error de Base de Datos"}
          </p>
          <p>{health.message}</p>

          {health.status === "network_error" && (
            <div className="mt-2 text-xs space-y-1">
              <p>Información de conexión:</p>
              <p>• Servidor: {connectionInfo.project}.supabase.co</p>
              <p>• URL: {connectionInfo.url}</p>
              <p>• Verifica tu conexión a internet</p>
            </div>
          )}

          {health.details && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-medium">
                Detalles técnicos
              </summary>
              <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                {typeof health.details === "string"
                  ? health.details
                  : JSON.stringify(health.details, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ConnectionStatus;
