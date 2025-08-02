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
      console.log("🧪 Iniciando test rápido de conectividad...");
      
      // Test 1: Configuración básica
      const hasUrl = !!supabase.supabaseUrl;
      const hasKey = !!supabase.supabaseKey;
      
      console.log("🧪 Config:", { hasUrl, hasKey, url: supabase.supabaseUrl?.substring(0, 30) + '...' });

      // Test 2: Autenticación
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      console.log("🧪 Auth test:", { hasSession: !!session, authError });

      // Test 3: Simple DB query con timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      let dbError, dbData;
      try {
        const { data, error } = await supabase
          .from('profesionales_sanitarios')
          .select('count')
          .limit(1);
        
        clearTimeout(timeoutId);
        dbData = data;
        dbError = error;
        console.log("🧪 DB test:", { hasData: !!data, error });
      } catch (error) {
        clearTimeout(timeoutId);
        dbError = error;
        console.log("🧪 DB test failed:", error);
      }

      // Test 4: Count query para estadísticas
      let countError, totalCount = 0;
      try {
        const { count, error } = await supabase
          .from('profesionales_sanitarios')
          .select('*', { count: 'exact', head: true });
        
        totalCount = count || 0;
        countError = error;
        console.log("🧪 Count test:", { count, error });
      } catch (error) {
        countError = error;
        console.log("🧪 Count test failed:", error);
      }

      setResult({
        config: { hasUrl, hasKey },
        auth: { hasSession: !!session, error: authError?.message },
        database: { hasData: !!dbData, error: dbError?.message },
        count: { total: totalCount, error: countError?.message },
        timestamp: new Date().toLocaleTimeString()
      });

    } catch (error: any) {
      console.error("🧪 Test completo falló:", error);
      setResult({
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Test Rápido de Conectividad</CardTitle>
        <Button onClick={runQuickTest} disabled={isLoading} className="w-fit">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Probando...
            </>
          ) : (
            'Ejecutar Test Rápido'
          )}
        </Button>
      </CardHeader>
      
      {result && (
        <CardContent className="space-y-4">
          {result.error ? (
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Error General</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{result.error}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Configuración */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Configuración</span>
                <div className="flex items-center gap-2">
                  {result.config?.hasUrl && result.config?.hasKey ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <Badge variant="default">OK</Badge>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <Badge variant="destructive">ERROR</Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Autenticación */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Autenticación</span>
                <div className="flex items-center gap-2">
                  {result.auth?.hasSession && !result.auth?.error ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <Badge variant="default">Autenticado</Badge>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <Badge variant="secondary">No autenticado</Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Base de Datos */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Base de Datos</span>
                <div className="flex items-center gap-2">
                  {!result.database?.error ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <Badge variant="default">Conectado</Badge>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <Badge variant="destructive">Error</Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Conteo */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Datos</span>
                <div className="flex items-center gap-2">
                  {!result.count?.error ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <Badge variant="default">{result.count?.total || 0} registros</Badge>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <Badge variant="destructive">Sin datos</Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 mt-4">
            Ejecutado a las {result.timestamp}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
