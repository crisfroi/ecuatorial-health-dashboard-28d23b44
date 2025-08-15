
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Wifi, WifiOff, Loader2 } from 'lucide-react';

export const QuickConnectivityTest = () => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<any>(null);

  const testQuickConnectivity = async () => {
    setIsTestingConnection(true);
    setConnectionResult(null);

    try {
      const url = SUPABASE_URL;
      const key = SUPABASE_PUBLISHABLE_KEY;
      const hasValidConfig = !!(url && key && url.includes('supabase.co'));

      if (!hasValidConfig) {
        setConnectionResult({
          success: false,
          message: 'Configuración de Supabase inválida',
          details: { url: url?.substring(0, 30) + '...', hasKey: !!key }
        });
        return;
      }

      // Test básico de conectividad
      const startTime = Date.now();
      const { data, error } = await Promise.race([
        supabase.from('centros_salud').select('id').limit(1),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]) as any;
      
      const responseTime = Date.now() - startTime;

      setConnectionResult({
        success: !error,
        message: error ? `Error: ${error.message}` : 'Conexión exitosa',
        details: {
          responseTime: `${responseTime}ms`,
          hasData: !!data,
          error: error?.message
        }
      });

    } catch (error: any) {
      setConnectionResult({
        success: false,
        message: `Error de conectividad: ${error.message}`,
        details: { error: error.message }
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {connectionResult?.success ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : connectionResult?.success === false ? (
            <WifiOff className="h-5 w-5 text-red-500" />
          ) : (
            <Wifi className="h-5 w-5" />
          )}
          Test Rápido de Conectividad
        </CardTitle>
        <Button 
          onClick={testQuickConnectivity} 
          disabled={isTestingConnection}
          className="w-fit"
        >
          {isTestingConnection ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Probando...
            </>
          ) : (
            'Probar Conexión'
          )}
        </Button>
      </CardHeader>
      
      {connectionResult && (
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {connectionResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <Badge variant={connectionResult.success ? "default" : "destructive"}>
                {connectionResult.success ? "CONECTADO" : "ERROR"}
              </Badge>
            </div>
            
            <p className="text-sm">{connectionResult.message}</p>
            
            <div className="bg-muted p-3 rounded text-sm">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(connectionResult.details, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
