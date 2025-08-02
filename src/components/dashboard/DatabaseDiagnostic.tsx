import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { QuickConnectivityTest } from './QuickConnectivityTest';

export const DatabaseDiagnostic = () => {
  const [results, setResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const tests = [
    {
      name: 'Configuración Supabase',
      test: async () => {
        const url = supabase.supabaseUrl;
        const key = supabase.supabaseKey;
        return {
          success: !!(url && key),
          details: { url: url?.substring(0, 30) + '...', hasKey: !!key }
        };
      }
    },
    {
      name: 'URL y Configuración',
      test: async () => {
        const url = supabase.supabaseUrl;
        const isValidUrl = url && url.includes('supabase.co');
        return {
          success: isValidUrl,
          details: {
            url: url?.substring(0, 50) + '...',
            isValid: isValidUrl,
            hasHttps: url?.startsWith('https://')
          }
        };
      }
    },
    {
      name: 'Autenticación',
      test: async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          return {
            success: !error && !!session,
            details: { 
              hasSession: !!session,
              user: session?.user?.email || 'No autenticado',
              error: error?.message
            }
          };
        } catch (error: any) {
          return {
            success: false,
            details: { error: error.message }
          };
        }
      }
    },
    {
      name: 'Consulta Simple DB',
      test: async () => {
        try {
          const { data, error } = await supabase
            .from('profesionales_sanitarios')
            .select('count')
            .limit(1);
          
          return {
            success: !error,
            details: { 
              hasData: !!data,
              error: error?.message,
              hint: error?.hint
            }
          };
        } catch (error: any) {
          return {
            success: false,
            details: { error: error.message }
          };
        }
      }
    },
    {
      name: 'RLS (Row Level Security)',
      test: async () => {
        try {
          const { data, error } = await supabase
            .from('busqueda_profesionales_publica')
            .select('*')
            .limit(1);
          
          return {
            success: !error,
            details: { 
              hasData: !!data,
              count: data?.length || 0,
              error: error?.message
            }
          };
        } catch (error: any) {
          return {
            success: false,
            details: { error: error.message }
          };
        }
      }
    }
  ];

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    
    for (const test of tests) {
      try {
        const result = await test.test();
        setResults(prev => [...prev, { 
          name: test.name, 
          ...result,
          timestamp: new Date().toLocaleTimeString()
        }]);
      } catch (error: any) {
        setResults(prev => [...prev, { 
          name: test.name, 
          success: false,
          details: { error: error.message },
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
      
      // Pequeña pausa entre tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunning(false);
  };

  const getStatusIcon = (success: boolean) => {
    if (success) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  return (
    <div className="space-y-6 w-full max-w-4xl">
      {/* Test Rápido */}
      <QuickConnectivityTest />
      
      {/* Diagnóstico Completo */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Diagnóstico Completo de Base de Datos
          </CardTitle>
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            className="w-fit"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Ejecutando...
              </>
            ) : (
              'Ejecutar Diagnóstico Completo'
            )}
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {results.map((result, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.success)}
                  <span className="font-medium">{result.name}</span>
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? "OK" : "ERROR"}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {result.timestamp}
                </span>
              </div>
              
              <div className="bg-muted p-3 rounded text-sm">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </div>
            </div>
          ))}
          
          {isRunning && results.length < tests.length && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Ejecutando test {results.length + 1} de {tests.length}...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
