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
  Code,
  Table2,
  Users,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// --- INTERFACES ADAPTADAS PARA MEMORIA Y RESULTADOS ---

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  // METADATA para mostrar el SQL y el resultado asociado al mensaje del asistente
  sql?: string; 
  result?: any[];
  error?: string; // Para mostrar errores de query específicos
}

const SuperAIChatMaster: React.FC = () => {
  // --- ESTADO DE MENSAJES (HISTORIAL) ---
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '🚀 **¡SISTEMA SQL IA ACTIVADO!**\n\nSoy tu asistente avanzado con **memoria** de consulta. Pregúntame sobre profesionales, centros, o estadísticas y te devolveré la consulta SQL y el resultado.\n\n**Ejemplo de memoria:**\n1. *"Número de médicos en Bata."*\n2. *"Ahora, dame sus nombres completos y especialidades."*\n\n¡Comienza tu consulta! 🎯',
      timestamp: new Date().toISOString(),
    }
  ]);
  // ----------------------------------------

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [systemReady, setSystemReady] = useState(true);
  const [needsOpenAI, setNeedsOpenAI] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const checkSystemHealth = async () => {
    // Lógica simplificada
    setSystemReady(true);
  };

  useEffect(() => {
    checkSystemHealth();
  }, []);

  // --- FUNCIÓN DE ENVÍO CON MEMORIA ---
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const questionToSend = input.trim();

    const userMessage: ChatMessage = {
      role: 'user',
      content: questionToSend,
      timestamp: new Date().toISOString(),
    };

    // 1. Añadir mensaje del usuario al historial y limpiar input
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      console.log('🚀 Enviando consulta con memoria...');

      // 2. Invocar la Edge Function enviando el historial completo
      const { data, error } = await supabase.functions.invoke('ai-chat-master', {
        body: {
          // Se envía todo el historial (limitado a los últimos 10 mensajes, por ejemplo, para evitar payloads grandes)
          messages: [...messages, userMessage].slice(-10).map(m => ({
            role: m.role,
            // Importante: para la memoria, solo se envía el contenido, no los metadatos (sql/result)
            content: m.content
          })), 
        }
      });

      if (error) {
        throw new Error((error as any)?.message || 'Error en la llamada a la Edge Function.');
      }

      let assistantContent = '';
      let assistantSql = data?.sql;
      let assistantResult = data?.result;
      let assistantError = data?.error;

      // 3. Manejar respuesta
      if (assistantError) {
        console.error('Error de Query/IA:', assistantError, 'SQL:', assistantSql);
        assistantContent = `❌ **Error al ejecutar la consulta:** El motor SQL devolvió un error.
        
**Mensaje de error:** ${assistantError.slice(0, 150)}...
`;
        toast({
            title: "Error SQL",
            description: `El SQL generado no se pudo ejecutar.`,
            variant: "destructive"
        });
      } else {
        const rowCount = assistantResult?.length ?? 0;
        // Se crea el mensaje que se mostrará en el chat
        assistantContent = `✅ **Consulta Exitosa.** La IA generó y ejecutó una consulta SQL basada en el contexto.
        
Se obtuvieron **${rowCount}** filas como resultado.

A continuación se muestra una previsualización.`;

        toast({
          title: "✅ Consulta Ejecutada",
          description: `Se obtuvieron ${rowCount} filas.`,
        });
      }

      // 4. Añadir mensaje del asistente con metadata
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date().toISOString(),
        sql: assistantSql,
        result: assistantResult,
        error: assistantError,
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      const friendly = error.message || 'Error del sistema de IA. Revise logs de Edge Function.';
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `❌ **Error irrecuperable:** ${friendly}`,
        timestamp: new Date().toISOString(),
        error: friendly,
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error de Sistema",
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

  // Consultas Rápidas 
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
      label: "Memoria de Prueba",
      query: "De la consulta anterior, ¿cuántos tienen especialidad en Pediatría?", // Ejemplo de consulta que requiere memoria
    },
  ];

  // --- Renderización del resultado de la consulta (dentro del chat) ---
  const renderResultTable = (data: any[], error?: string) => {
    if (error) {
        return (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-mono whitespace-pre-wrap">
                <AlertTriangle className="w-4 h-4 inline mr-2"/>
                <strong>Error de Ejecución:</strong> {error}
            </div>
        );
    }

    if (!data || data.length === 0) {
        return <p className="text-sm text-gray-500 italic">La consulta devolvió 0 resultados.</p>;
    }
    
    const columns = Object.keys(data[0]);

    return (
        <div className="overflow-x-auto max-h-64 border rounded-lg mt-2">
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
                    {data.slice(0, 10).map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50">
                            {columns.map((col) => (
                                <td key={col} className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                    {String(row[col])}
                                </td>
                            ))}
                        </tr>
                    ))}
                    {data.length > 10 && (
                        <tr>
                            <td colSpan={columns.length} className="px-3 py-2 text-center text-xs text-gray-500 bg-gray-100">
                                ... Mostrando las primeras 10 filas de {data.length}
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
            <CardTitle className="text-xl text-primary">SQL IA CON MEMORIA</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Traduce tu pregunta a SQL de PostgreSQL, recuerda el contexto y ejecuta la consulta
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant={systemReady ? "default" : needsOpenAI ? "destructive" : "secondary"}>
              {systemReady ? "✅ Activo" : needsOpenAI ? "⚙️ Config" : "⏳ Cargando"}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">

          {/* Chat Messages and Results */}
          <div className="h-96 overflow-y-auto border rounded-lg p-4 bg-background/50 backdrop-blur-sm space-y-4">
            {messages.map((message, index) => (
              <div key={index} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {message.role === 'user' ? (
                    <>
                      <Users className="w-3 h-3" />
                      <span className="font-medium">Tú</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-3 h-3 text-primary" />
                      <span className="font-medium text-primary">SQL IA</span>
                    </>
                  )}
                  <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                </div>
                
                <div className={`prose prose-sm max-w-none rounded-lg p-3 ${
                  message.role === 'user' 
                    ? 'bg-primary/10 ml-6' 
                    : (message.error ? 'bg-red-50/10 mr-6 border border-red-300' : 'bg-accent/10 mr-6')
                }`}>
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                </div>

                {/* Mostrar la tabla de resultados solo si es un mensaje de asistente con datos */}
                {message.role === 'assistant' && (message.result || message.error) && (
                    <div className="mt-2 p-2 border rounded-lg bg-white shadow-sm">
                         <h4 className="text-sm font-medium flex items-center gap-1 text-gray-700">
                            <Table2 className="w-4 h-4"/> Previsualización de Datos:
                        </h4>
                        {renderResultTable(message.result || [], message.error)}
                    </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Analizando contexto y generando SQL...</span>
              </div>
            )}
            
            <div ref={scrollRef} />
          </div>

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
                  Para activar la memoria de la IA, configura la API key de OpenAI en la configuración de Supabase Edge Functions.
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
                <span>Modelo GPT-4o-mini con **Memoria**</span>
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
