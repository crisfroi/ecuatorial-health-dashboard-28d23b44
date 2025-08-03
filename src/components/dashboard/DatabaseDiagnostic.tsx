
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { 
  Database,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Wifi,
  WifiOff,
  Server,
  Activity
} from 'lucide-react';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  duration?: number;
  details?: any;
}

const DatabaseDiagnostic: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState({
    url: '',
    key: ''
  });

  useEffect(() => {
    // Get connection info from environment variables instead of protected properties
    const url = 'https://wdieynendfjbkbhfovrx.supabase.co';
    const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWV5bmVuZGZqYmtiaGZvdnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODI5MjEsImV4cCI6MjA2NjM1ODkyMX0.yFnLHavy8wzVjlg3sAI2mEG-XGDCV5FSr7OQsMefxL8';
    
    setConnectionInfo({
      url,
      key: key ? `${key.substring(0, 20)}...` : 'No disponible'
    });
  }, []);

  const addResult = (result: DiagnosticResult) => {
    setResults(prev => [...prev, result]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    // Test 1: Basic Connection
    addResult({
      test: 'Conexión Básica',
      status: 'pending',
      message: 'Verificando conexión...',
    });

    const startTime = Date.now();
    try {
      const { error } = await supabase
        .from('profesionales_sanitarios')
        .select('id')
        .limit(1);

      const duration = Date.now() - startTime;

      if (error) {
        throw error;
      }

      setResults(prev => prev.map(r => 
        r.test === 'Conexión Básica' 
          ? { ...r, status: 'success', message: 'Conexión exitosa', duration }
          : r
      ));
    } catch (error: any) {
      const duration = Date.now() - startTime;
      setResults(prev => prev.map(r => 
        r.test === 'Conexión Básica' 
          ? { ...r, status: 'error', message: `Error: ${error.message}`, duration, details: error }
          : r
      ));
    }

    // Test 2: Authentication
    addResult({
      test: 'Autenticación',
      status: 'pending',
      message: 'Verificando estado de autenticación...',
    });

    const startTime2 = Date.now();
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      const duration = Date.now() - startTime2;

      setResults(prev => prev.map(r => 
        r.test === 'Autenticación' 
          ? { 
              ...r, 
              status: user ? 'success' : 'warning', 
              message: user ? `Usuario autenticado: ${user.email}` : 'No hay usuario autenticado',
              duration,
              details: user
            }
          : r
      ));
    } catch (error: any) {
      const duration = Date.now() - startTime2;
      setResults(prev => prev.map(r => 
        r.test === 'Autenticación' 
          ? { ...r, status: 'error', message: `Error: ${error.message}`, duration }
          : r
      ));
    }

    // Test 3: Data Query
    addResult({
      test: 'Consulta de Datos',
      status: 'pending',
      message: 'Consultando datos de profesionales...',
    });

    const startTime3 = Date.now();
    try {
      const { data, error, count } = await supabase
        .from('profesionales_sanitarios')
        .select('*', { count: 'exact' })
        .limit(10);

      const duration = Date.now() - startTime3;

      if (error) {
        throw error;
      }

      setResults(prev => prev.map(r => 
        r.test === 'Consulta de Datos' 
          ? { 
              ...r, 
              status: 'success', 
              message: `${count} registros totales, ${data?.length || 0} consultados`,
              duration,
              details: { count, sampleData: data?.slice(0, 3) }
            }
          : r
      ));
    } catch (error: any) {
      const duration = Date.now() - startTime3;
      setResults(prev => prev.map(r => 
        r.test === 'Consulta de Datos' 
          ? { ...r, status: 'error', message: `Error: ${error.message}`, duration }
          : r
      ));
    }

    // Test 4: RLS Policies
    addResult({
      test: 'Políticas RLS',
      status: 'pending',
      message: 'Verificando políticas de seguridad...',
    });

    const startTime4 = Date.now();
    try {
      // Try to access different tables to test RLS
      const tables = ['profesionales_sanitarios', 'centros_salud', 'carnets_generados'];
      const results = [];

      for (const table of tables) {
        try {
          const { error } = await supabase.from(table).select('id').limit(1);
          results.push({ table, status: error ? 'error' : 'success', error: error?.message });
        } catch (err: any) {
          results.push({ table, status: 'error', error: err.message });
        }
      }

      const duration = Date.now() - startTime4;
      const successCount = results.filter(r => r.status === 'success').length;

      setResults(prev => prev.map(r => 
        r.test === 'Políticas RLS' 
          ? { 
              ...r, 
              status: successCount === tables.length ? 'success' : 'warning', 
              message: `${successCount}/${tables.length} tablas accesibles`,
              duration,
              details: results
            }
          : r
      ));
    } catch (error: any) {
      const duration = Date.now() - startTime4;
      setResults(prev => prev.map(r => 
        r.test === 'Políticas RLS' 
          ? { ...r, status: 'error', message: `Error: ${error.message}`, duration }
          : r
      ));
    }

    // Test 5: Edge Functions
    addResult({
      test: 'Edge Functions',
      status: 'pending',
      message: 'Verificando funciones de borde...',
    });

    const startTime5 = Date.now();
    try {
      const { data, error } = await supabase.functions.invoke('ai-analytics-advanced', {
        body: { query: 'test', test: true }
      });

      const duration = Date.now() - startTime5;

      setResults(prev => prev.map(r => 
        r.test === 'Edge Functions' 
          ? { 
              ...r, 
              status: error ? 'error' : 'success', 
              message: error ? `Error: ${error.message}` : 'Edge Functions disponibles',
              duration
            }
          : r
      ));
    } catch (error: any) {
      const duration = Date.now() - startTime5;
      setResults(prev => prev.map(r => 
        r.test === 'Edge Functions' 
          ? { ...r, status: 'warning', message: `Advertencia: ${error.message}`, duration }
          : r
      ));
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Exitoso</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Advertencia</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendiente</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Database className="h-6 w-6 mr-2" />
            Diagnóstico de Base de Datos
          </h2>
          <p className="text-gray-600 mt-1">
            Verificación completa del estado y conectividad de la base de datos
          </p>
        </div>

        <Button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="flex items-center"
        >
          {isRunning ? (
            <Clock className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Activity className="h-4 w-4 mr-2" />
          )}
          {isRunning ? 'Ejecutando...' : 'Ejecutar Diagnóstico'}
        </Button>
      </div>

      {/* Connection Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="h-5 w-5 mr-2" />
            Información de Conexión
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-600">URL Supabase:</Label>
              <p className="font-mono text-sm break-all">{connectionInfo.url}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">API Key:</Label>
              <p className="font-mono text-sm">{connectionInfo.key}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diagnostic Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados del Diagnóstico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    {getStatusIcon(result.status)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{result.test}</h4>
                      <div className="flex items-center space-x-2">
                        {result.duration && (
                          <span className="text-xs text-gray-500">
                            {result.duration}ms
                          </span>
                        )}
                        {getStatusBadge(result.status)}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                    
                    {result.details && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                          Ver detalles
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-50 rounded overflow-x-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Information */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Información sobre el diagnóstico:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>La <strong>Conexión Básica</strong> verifica que podemos comunicarnos con Supabase</li>
            <li>La <strong>Autenticación</strong> muestra el estado del usuario actual</li>
            <li>La <strong>Consulta de Datos</strong> prueba el acceso a la tabla principal</li>
            <li>Las <strong>Políticas RLS</strong> verifican el acceso a múltiples tablas</li>
            <li>Las <strong>Edge Functions</strong> prueban la disponibilidad de funciones personalizadas</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default DatabaseDiagnostic;
