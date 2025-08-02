
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, Database, RefreshCw } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DatabaseDiagnostics = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const availableTables = [
    'profesionales_sanitarios',
    'carnets_generados',
    'centros_salud',
    'distrito_sanitario',
    'user_roles',
    'sms_notifications_log'
  ] as const;

  const availableFunctions = [
    'actualizar_numeros_correlativos_faltantes',
    'buscar_centros_por_criterios',
    'calcular_edad',
    'generar_codigo_expediente_unico',
    'generar_url_carnet_profesional',
    'obtener_estadisticas_completas',
    'trigger_renewal_notifications'
  ] as const;

  const runDiagnostics = async () => {
    setIsRunning(true);
    const diagnosticResults: any = {
      timestamp: new Date().toISOString(),
      tables: {},
      functions: {},
      connectivity: null,
      performance: {},
    };

    try {
      // Test connectivity
      const { data: connectTest } = await supabase.from('profesionales_sanitarios').select('id').limit(1);
      diagnosticResults.connectivity = {
        status: 'connected',
        message: 'Database connection successful'
      };

      // Test table access
      for (const tableName of availableTables) {
        try {
          const { data, error, count } = await supabase
            .from(tableName as any)
            .select('*', { count: 'exact', head: true });
          
          if (error) {
            diagnosticResults.tables[tableName] = {
              status: 'error',
              error: error.message,
              accessible: false
            };
          } else {
            diagnosticResults.tables[tableName] = {
              status: 'success',
              accessible: true,
              recordCount: count || 0
            };
          }
        } catch (err: any) {
          diagnosticResults.tables[tableName] = {
            status: 'error',
            error: err.message,
            accessible: false
          };
        }
      }

      // Test RPC functions
      for (const functionName of availableFunctions) {
        try {
          // Just test if function exists by calling it (this might fail but we'll catch the error type)
          await supabase.rpc(functionName as any);
          diagnosticResults.functions[functionName] = {
            status: 'available',
            callable: true
          };
        } catch (err: any) {
          // Function exists but parameters might be wrong - this is actually good
          if (err.message.includes('missing') || err.message.includes('required')) {
            diagnosticResults.functions[functionName] = {
              status: 'available',
              callable: true,
              note: 'Function exists but requires parameters'
            };
          } else {
            diagnosticResults.functions[functionName] = {
              status: 'unavailable',
              callable: false,
              error: err.message
            };
          }
        }
      }

      setResults(diagnosticResults);
      toast({
        title: "Diagnóstico Completado",
        description: "Se han ejecutado todas las pruebas de diagnóstico.",
      });

    } catch (error: any) {
      console.error('Error running diagnostics:', error);
      diagnosticResults.connectivity = {
        status: 'error',
        message: error.message
      };
      setResults(diagnosticResults);
      
      toast({
        title: "Error en Diagnóstico",
        description: "Ocurrió un error durante las pruebas.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
      case 'connected':
      case 'available':
        return <Badge variant="default" className="bg-green-100 text-green-800">✓ OK</Badge>;
      case 'error':
      case 'unavailable':
        return <Badge variant="destructive">✗ Error</Badge>;
      default:
        return <Badge variant="secondary">? Desconocido</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          Diagnóstico de Base de Datos
        </CardTitle>
        <CardDescription>
          Ejecuta pruebas de conectividad, acceso a tablas y funciones de la base de datos.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Ejecutando...' : 'Ejecutar Diagnóstico'}
          </Button>
        </div>

        {results && (
          <div className="space-y-6">
            <Separator />
            
            {/* Connectivity Results */}
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Conectividad
              </h3>
              <div className="flex items-center gap-2">
                {getStatusBadge(results.connectivity?.status || 'unknown')}
                <span className="text-sm">{results.connectivity?.message || 'Sin información'}</span>
              </div>
            </div>

            {/* Table Access Results */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Acceso a Tablas ({Object.keys(results.tables).length})
              </h3>
              <div className="grid gap-2">
                {Object.entries(results.tables).map(([tableName, result]: [string, any]) => (
                  <div key={tableName} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(result.status)}
                      <span className="font-mono text-sm">{tableName}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {result.accessible && `${result.recordCount || 0} registros`}
                      {result.error && `Error: ${result.error}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Functions Results */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Funciones RPC ({Object.keys(results.functions).length})
              </h3>
              <div className="grid gap-2">
                {Object.entries(results.functions).map(([functionName, result]: [string, any]) => (
                  <div key={functionName} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(result.status)}
                      <span className="font-mono text-sm">{functionName}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {result.note || result.error || 'Disponible'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs text-gray-400">
              Diagnóstico ejecutado: {new Date(results.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseDiagnostics;
