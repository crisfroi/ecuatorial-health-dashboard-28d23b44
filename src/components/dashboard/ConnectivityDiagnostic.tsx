import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Wifi, 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Info,
  Settings
} from 'lucide-react';
import { useConnectivityTest } from '@/hooks/useConnectivityTest';
import { useToast } from '@/hooks/use-toast';

const ConnectivityDiagnostic = () => {
  const { 
    testDatabaseConnection, 
    testTableOperations, 
    isTestingConnection, 
    lastTestResult 
  } = useConnectivityTest();
  const { toast } = useToast();
  const [diagnosticHistory, setDiagnosticHistory] = useState<any[]>([]);

  const runFullDiagnostic = async () => {
    try {
      // Test 1: Basic connection
      const connectionResult = await testDatabaseConnection();
      
      // Test 2: Table operations
      const tableResult = await testTableOperations();
      
      const fullResult = {
        timestamp: new Date().toISOString(),
        connection: connectionResult,
        tableOperations: tableResult,
        overall: connectionResult.isSuccess && tableResult.isSuccess
      };

      setDiagnosticHistory(prev => [fullResult, ...prev.slice(0, 4)]);

      if (fullResult.overall) {
        toast({
          title: "Diagnóstico Exitoso",
          description: "Todas las pruebas de conectividad pasaron correctamente.",
        });
      } else {
        toast({
          title: "Problemas Detectados",
          description: "Se encontraron problemas de conectividad. Revisa los detalles.",
          variant: "destructive"
        });
      }

    } catch (error) {
      toast({
        title: "Error en Diagnóstico",
        description: "No se pudo completar el diagnóstico completo.",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (isSuccess: boolean) => {
    return isSuccess ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    );
  };

  const getStatusBadge = (isSuccess: boolean) => {
    return (
      <Badge 
        className={isSuccess ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
      >
        {isSuccess ? "OK" : "ERROR"}
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Diagnóstico de Conectividad
          </span>
          <Button
            onClick={runFullDiagnostic}
            disabled={isTestingConnection}
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isTestingConnection ? 'animate-spin' : ''}`} />
            {isTestingConnection ? 'Diagnosticando...' : 'Ejecutar Diagnóstico'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Status */}
        {lastTestResult && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Estado Actual de Conexión</span>
              {getStatusBadge(lastTestResult.isSuccess)}
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-2">
                {getStatusIcon(lastTestResult.isSuccess)}
                <div className="flex-1">
                  <p className="text-sm font-medium">{lastTestResult.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(lastTestResult.timestamp).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>
              
              {lastTestResult.details && (
                <details className="mt-3">
                  <summary className="text-xs cursor-pointer text-blue-600 hover:text-blue-800">
                    Ver detalles técnicos
                  </summary>
                  <pre className="text-xs bg-white p-2 rounded mt-2 overflow-auto">
                    {JSON.stringify(lastTestResult.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Individual Tests */}
        <div className="space-y-3">
          <h4 className="font-medium">Pruebas Individuales</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={testDatabaseConnection}
              disabled={isTestingConnection}
              className="flex items-center gap-2 h-auto p-4"
            >
              <Database className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">Conexión Base</div>
                <div className="text-xs text-gray-500">Prueba conexión a Supabase</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={testTableOperations}
              disabled={isTestingConnection}
              className="flex items-center gap-2 h-auto p-4"
            >
              <Wifi className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">Operaciones de Tabla</div>
                <div className="text-xs text-gray-500">Prueba acceso a datos</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Diagnostic History */}
        {diagnosticHistory.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium">Historial de Diagnósticos</h4>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {diagnosticHistory.map((result, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {new Date(result.timestamp).toLocaleString('es-ES')}
                      </span>
                      {getStatusBadge(result.overall)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(result.connection?.isSuccess)}
                        <span>Conexión</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(result.tableOperations?.isSuccess)}
                        <span>Operaciones</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Network Information */}
        <Separator />
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <Info className="w-4 h-4" />
            Información de Red
          </h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Estado de Conexión:</span>
              <Badge variant={navigator.onLine ? "default" : "destructive"}>
                {navigator.onLine ? "En línea" : "Sin conexión"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>URL de Supabase:</span>
              <span className="text-xs font-mono">wdieynendfjbkbhfovrx.supabase.co</span>
            </div>
            <div className="flex justify-between">
              <span>Protocolo:</span>
              <span className="text-xs">HTTPS/WSS</span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {lastTestResult && !lastTestResult.isSuccess && (
          <>
            <Separator />
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 mb-2">Recomendaciones</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Verifica tu conexión a internet</li>
                    <li>• Asegúrate de que Supabase esté accesible</li>
                    <li>• Revisa las credenciales de la base de datos</li>
                    <li>• Verifica que el usuario tenga permisos adecuados</li>
                    <li>• Comprueba si hay firewalls bloqueando la conexión</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectivityDiagnostic;
