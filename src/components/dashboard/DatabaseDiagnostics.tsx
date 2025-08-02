
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Database, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const DatabaseDiagnostics = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const availableFunctions = [
    'actualizar_numeros_correlativos_faltantes',
    'buscar_centros_por_criterios',
    'calcular_edad',
    'generar_codigo_expediente_unico',
    'generar_url_carnet_profesional',
    'get_notification_count',
    'marcar_carnet_generado',
    'obtener_color_categoria',
    'obtener_profesionales_por_centro',
    'trigger_generar_carnet_automatico',
    'trigger_renewal_notifications'
  ];

  const runDiagnostics = async () => {
    setIsRunning(true);
    const diagnosticResults = [];

    try {
      // Test 1: Basic Connection
      diagnosticResults.push({
        test: 'Conexión básica',
        status: 'running',
        message: 'Probando conexión...'
      });

      const { data: connectionTest, error: connectionError } = await supabase
        .from('profesionales_sanitarios')
        .select('id')
        .limit(1);

      if (connectionError) {
        diagnosticResults[0] = {
          test: 'Conexión básica',
          status: 'error',
          message: `Error: ${connectionError.message}`
        };
      } else {
        diagnosticResults[0] = {
          test: 'Conexión básica',
          status: 'success',
          message: 'Conexión exitosa'
        };
      }

      // Test 2: Count records
      const { count, error: countError } = await supabase
        .from('profesionales_sanitarios')
        .select('*', { count: 'exact', head: true });

      diagnosticResults.push({
        test: 'Conteo de registros',
        status: countError ? 'error' : 'success',
        message: countError 
          ? `Error: ${countError.message}`
          : `${count} profesionales encontrados`
      });

      // Test 3: Check available functions (simplified)
      diagnosticResults.push({
        test: 'Funciones disponibles',
        status: 'info',
        message: `${availableFunctions.length} funciones catalogadas`
      });

      // Test 4: Check tables
      const tables = [
        'profesionales_sanitarios',
        'centros_salud', 
        'categorias_titulacion',
        'sms_notifications_log'
      ];

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        diagnosticResults.push({
          test: `Tabla ${table}`,
          status: error ? 'error' : 'success',
          message: error ? `Error: ${error.message}` : 'Accesible'
        });
      }

    } catch (error: any) {
      diagnosticResults.push({
        test: 'Error general',
        status: 'error',
        message: error.message
      });
    }

    setResults(diagnosticResults);
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      running: 'secondary',
      info: 'secondary'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Diagnósticos de Base de Datos
        </CardTitle>
        <CardDescription>
          Verifica el estado y conectividad de la base de datos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics}
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Database className="h-4 w-4 mr-2" />
          )}
          {isRunning ? 'Ejecutando diagnósticos...' : 'Ejecutar diagnósticos'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Resultados:</h4>
            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <p className="font-medium">{result.test}</p>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                  </div>
                </div>
                {getStatusBadge(result.status)}
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Funciones disponibles:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {availableFunctions.map((func, index) => (
              <Badge key={index} variant="outline" className="justify-start">
                {func}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseDiagnostics;
