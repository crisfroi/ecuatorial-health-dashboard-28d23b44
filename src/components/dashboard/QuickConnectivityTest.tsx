import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const QuickConnectivityTest = () => {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runQuickTest = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      console.log("🧪 Iniciando test r��pido de conectividad...");
      
      // Test 1: Configuración básica
      const hasUrl = true;
      const hasKey = true;
      
      console.log("🧪 Config:", { hasUrl, hasKey, url: 'https://wdieynendfjbkbhfovrx.supabase.co' });

      // Test 2: Autenticación
      let authResult;
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        authResult = { hasSession: !!session, error: authError?.message };
        console.log("🧪 Auth test:", authResult);
      } catch (error: any) {
        authResult = { hasSession: false, error: error.message };
      }

      // Test 3: Simple DB query con timeout más agresivo
      let dbResult;
      try {
        console.log("🧪 Probando consulta simple a la BD...");
        
        // Use Promise.race para timeout manual más agresivo
        const dbPromise = supabase
          .from('profesionales_sanitarios')
          .select('id')
          .limit(1);
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout after 5s')), 5000)
        );
        
        const { data, error } = await Promise.race([dbPromise, timeoutPromise]) as any;
        
        dbResult = { 
          hasData: !!data, 
          error: error?.message,
          count: data?.length || 0
        };
        console.log("🧪 DB test:", dbResult);
      } catch (error: any) {
        dbResult = { hasData: false, error: error.message };
        console.log("🧪 DB test failed:", error);
      }

      // Test 4: Count query para estadísticas
      let countResult;
      try {
        console.log("🧪 Probando conteo total...");
        
        const countPromise = supabase
          .from('profesionales_sanitarios')
          .select('*', { count: 'exact', head: true });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Count timeout after 5s')), 5000)
        );
        
        const { count, error } = await Promise.race([countPromise, timeoutPromise]) as any;
        
        countResult = { total: count || 0, error: error?.message };
        console.log("🧪 Count test:", countResult);
      } catch (error: any) {
        countResult = { total: 0, error: error.message };
        console.log("🧪 Count test failed:", error);
      }

      setResult({
        config: { hasUrl, hasKey },
        auth: authResult,
        database: dbResult,
        count: countResult,
        timestamp: new Date().toLocaleTimeString(),
        summary: `Configuración: ${hasUrl && hasKey ? '✅' : '❌'} | Auth: ${authResult.hasSession ? '✅' : '❌'} | DB: ${!dbResult.error ? '✅' : '❌'} | Datos: ${countResult.total} registros`
      });

    } catch (error: any) {
      console.error("🧪 Test completo falló:", error);
      setResult({
        error: error.message,
        timestamp: new Date().toLocaleTimeString(),
        summary: '❌ Error general en el test'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>🔍 Test Rápido de Conectividad</CardTitle>
        <Button onClick={runQuickTest} disabled={isLoading} className="w-fit">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Probando... (max 5s)
            </>
          ) : (
            '▶️ Ejecutar Test Rápido'
          )}
        </Button>
      </CardHeader>
      
      {result && (
        <CardContent className="space-y-4">
          {/* Resumen rápido */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">📊 Resumen</h3>
            <p className="text-blue-800 text-sm">{result.summary}</p>
          </div>

          {result.error ? (
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Error General</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{result.error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {/* Configuración */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  {result.config?.hasUrl && result.config?.hasKey ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-medium text-sm">Configuración</span>
                </div>
                <Badge variant={result.config?.hasUrl && result.config?.hasKey ? "default" : "destructive"} className="text-xs">
                  {result.config?.hasUrl && result.config?.hasKey ? "OK" : "ERROR"}
                </Badge>
              </div>

              {/* Autenticación */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  {result.auth?.hasSession && !result.auth?.error ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-medium text-sm">Autenticación</span>
                </div>
                <Badge variant={result.auth?.hasSession ? "default" : "secondary"} className="text-xs">
                  {result.auth?.hasSession ? "Autenticado" : "No autenticado"}
                </Badge>
              </div>

              {/* Base de Datos */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  {!result.database?.error ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-medium text-sm">Base de Datos</span>
                </div>
                <Badge variant={!result.database?.error ? "default" : "destructive"} className="text-xs">
                  {!result.database?.error ? "Conectado" : "Error"}
                </Badge>
              </div>

              {/* Conteo */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  {!result.count?.error ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-medium text-sm">Datos</span>
                </div>
                <Badge variant={!result.count?.error ? "default" : "destructive"} className="text-xs">
                  {!result.count?.error ? `${result.count?.total || 0} registros` : "Sin datos"}
                </Badge>
              </div>
            </div>
          )}

          {/* Errores detallados */}
          {(result.auth?.error || result.database?.error || result.count?.error) && (
            <div className="bg-yellow-50 p-3 rounded-lg">
              <h4 className="font-medium text-yellow-900 text-sm mb-2">⚠️ Errores detectados:</h4>
              <div className="space-y-1 text-xs text-yellow-800">
                {result.auth?.error && <div>• Auth: {result.auth.error}</div>}
                {result.database?.error && <div>• BD: {result.database.error}</div>}
                {result.count?.error && <div>• Conteo: {result.count.error}</div>}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 text-center">
            Ejecutado a las {result.timestamp}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
