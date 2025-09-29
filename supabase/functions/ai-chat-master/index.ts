import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import {
  Brain,
  Send,
  Loader2,
  Sparkles,
  Database,
  BarChart3,
  AlertTriangle,
  Code, // Nuevo: para mostrar el SQL
  Table2, // Nuevo: para mostrar el resultado
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// --- INTERFACES SIMPLIFICADAS ---

interface QueryResult {
  sql: string;
  result: any[];
}

const SuperAIChatMaster: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [systemReady, setSystemReady] = useState(true); // Asumimos que la clave de OpenAI está configurada
  const [needsOpenAI, setNeedsOpenAI] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const { toast } = useToast();

  // Función de diagnóstico simplificada
  const checkSystemHealth = async () => {
    // Nota: La Edge Function original no tiene un endpoint de 'healthCheck',
    // así que esta lógica se omite o se simplifica para asumir que está activo
    // si las claves de entorno están configuradas.
    // Para simplificar, asumimos que está listo.
    setSystemReady(true);
  };

  useEffect(() => {
    checkSystemHealth();
  }, []);


  // --- FUNCIÓN DE ENVÍO DE MENSAJE ADAPTADA ---
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const questionToSend = input.trim();
    setCurrentQuestion(questionToSend);
    setQueryResult(null);
    setInput('');
    setLoading(true);

    try {
      console.log('🚀 Enviando consulta SQL al motor de IA...');

      // 1. Invocar la Edge Function con el cuerpo simplificado: { question }
      const { data, error } = await supabase.functions.invoke('ai-chat-master', {
        body: {
          question: questionToSend,
        }
      });

      if (error) {
        throw new Error((error as any)?.message || 'Error en la llamada a la Edge Function.');
      }

      // 2. Manejo de error devuelto por la función (ej. error de query)
      if (data?.error) {
        console.error('Error de Query/IA:', data.error, 'SQL:', data.sql);
        throw new Error(`Error SQL: ${data.error.slice(0, 100)}...`);
      }

      // 3. Establecer el resultado exitoso
      const resultData: QueryResult = {
        sql: data?.sql || 'No se generó SQL.',
        result: data?.result || [],
      };

      setQueryResult(resultData);

      toast({
        title: "✅ Consulta Exitosa",
        description: `Se ejecutó un SELECT con ${resultData.result.length} filas devueltas.`,
      });

    } catch (error: any) {
      const friendly = error.message || 'Error del sistema de IA. Revise logs de Edge Function.';

      setQueryResult({
        sql: '',
        result: [{ error: friendly }],
      });
      
      toast({
        title: "Error de Ejecución",
        description: friendly,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  // ----------------------------------------------------

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading && input.trim()) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Consultas Rápidas Simplificadas
  const quickActions = [
    {
      icon: Database,
      label: "Contar Profesionales",
      query: "Dime el número total de profesionales sanitarios registrados",
    },
    {
      icon: BarChart3,
      label: "Por Provincia",
      query: "Distribución de profesionales por provincia de residencia",
    },
    {
      icon: Code,
      label: "SQL Avanzado",
      query: "Escribe un SELECT que traiga nombre, especialidad y centro de trabajo de médicos en hospitales de Bata",
    },
  ];

  // --- Renderización del resultado de la consulta ---
  const renderResultTable = (data: any[]) => {
    if (!data || data.length === 0) {
        return <p className="text-sm text-gray-500">La consulta no devolvió resultados o ocurrió un error.</p>;
    }
    
    // Si hay un error explícito en el resultado (ej. error de query), mostrarlo
    if (data.length === 1 && data[0].error) {
        return (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-mono whitespace-pre-wrap">
                <AlertTriangle className="w-4 h-4 inline mr-2"/>
                <strong>Error de Ejecución:</strong> {data[0].error}
            </div>
        );
    }

    const columns = Object.keys(data[0]);

    return (
        <div className="overflow-x-auto max-h-64 border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col}
                                scope="col"
                                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.slice(0, 100).map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50">
                            {columns.map((col) => (
                                <td key={col} className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                    {String(row[col])}
                                </td>
                            ))}
                        </tr>
                    ))}
                    {data.length > 100 && (
                        <tr>
                            <td colSpan={columns.length} className="px-3 py-2 text-center text-xs text-gray-500 bg-gray-100">
                                ... Mostrando las primeras 100 filas de {data.length}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
  };
  // ----------------------------------------------------


  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary animate-pulse" />
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <div>
            <CardTitle className="text-xl text-primary">SQL IA CON BASE DE DATOS</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Traduce tu pregunta a SQL de PostgreSQL y ejecuta la consulta
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant={systemReady ? "default" : needsOpenAI ? "destructive" : "secondary"}>
              {systemReady ? "✅ Activo" : needsOpenAI ? "⚙️ Config" : "⏳ Cargando"}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          
          {/* Resultado de la Última Consulta */}
          {queryResult && (
            <div className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-700">
                    <Table2 className="w-5 h-5"/> Resultado de la Consulta
                </h3>
                
                {currentQuestion && (
                    <p className="text-sm text-muted-foreground italic border-l-2 pl-2">
                        **Pregunta:** {currentQuestion}
                    </p>
                )}

                {/* SQL Generado */}
                <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-1">
                        <Code className="w-3 h-3 text-blue-600"/> SQL Generado:
                    </h4>
                    <pre className="p-2 text-xs bg-gray-100 rounded-md overflow-x-auto text-gray-700 font-mono">
                        {queryResult.sql || 'No se pudo generar el SQL.'}
                    </pre>
                </div>

                {/* Tabla de Resultados */}
                <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-1">
                        <Table2 className="w-3 h-3 text-green-600"/> Resultado de la Ejecución:
                    </h4>
                    {renderResultTable(queryResult.result)}
                </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              Consultas Rápidas
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setInput(action.query);
                    setTimeout(() => sendMessage(), 100);
                  }}
                  className="justify-start h-auto p-3 text-left"
                  disabled={loading || !systemReady}
                >
                  <action.icon className="w-4 h-4 mr-2 shrink-0" />
                  <span className="text-xs">{action.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={systemReady
                ? "Escribe tu pregunta para generar la consulta SQL..."
                : "Cargando sistema..."
              }
              disabled={loading || !systemReady}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !input.trim() || !systemReady}
              size="icon"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* System Status */}
          {needsOpenAI && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-orange-800">Configuración Requerida</p>
                <p className="text-orange-700 mt-1">
                  Para activar el sistema de IA, configura la API key de OpenAI en la configuración de Supabase Edge Functions.
                </p>
              </div>
            </div>
          )}
          
          {systemReady && (
            <div className="text-xs text-muted-foreground flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                <span>Base de Datos de Supabase</span>
              </div>
              <div className="flex items-center gap-1">
                <Brain className="w-3 h-3" />
                <span>Modelo GPT-4o-mini</span>
              </div>
              <div className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                <span>Ejecución en Tiempo Real</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAIChatMaster;
