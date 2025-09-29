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
  ArrowRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast'; 

// --- INTERFACES PARA MEMORIA Y NAVEGACIÓN ---

interface NavigationSuggestion {
  type: 'navigate';
  tab: string;
  label: string;
  filters?: Record<string, any>;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sql?: string;
  result?: any[];
  error?: string;
  navigationSuggestions?: NavigationSuggestion[];
}

interface SuperAIChatMasterProps {
  onNavigateToTab?: (tab: string, filters?: any) => void;
}

// ---------------------------------------------

const SuperAIChatMaster: React.FC<SuperAIChatMasterProps> = ({ 
  onNavigateToTab,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '🚀 **¡SISTEMA SQL IA ACTIVADO!**\n\nSoy tu asistente avanzado con **memoria** de consulta. Pregúntame sobre profesionales, centros, o estadísticas y te devolveré la respuesta en **lenguaje natural**, además de la previsualización del SQL ejecutado.\n\n**Ejemplo de memoria:**\n1. *"Número de médicos en Bata."*\n2. *"Ahora, dame sus nombres completos y especialidades."*\n\n¡Comienza tu consulta! 🎯',
      timestamp: new Date().toISOString(),
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [systemReady, setSystemReady] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const currentSuggestions = messages[messages.length - 1]?.navigationSuggestions || [];

  useEffect(() => {
    setSystemReady(true);
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // --- FUNCIÓN DE ENVÍO CON MEMORIA Y LENGUAJE NATURAL ---
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const questionToSend = input.trim();

    const userMessage: ChatMessage = {
      role: 'user',
      content: questionToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Enviar todo el historial para la memoria
      const historyToPass = [...messages, userMessage].slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));
      
      const payload = { messages: historyToPass };

      // Llamada a la Edge Function
      const { data, error } = await supabase.functions.invoke('ai-chat-master', {
        body: payload,
      });

      if (error) {
        throw new Error((error as any)?.message || 'Error en la llamada a la Edge Function.');
      }

      let assistantContent = '';
      let assistantSql = data?.sql;
      let assistantResult = data?.result;
      let assistantError = data?.error;
      const assistantSuggestions: NavigationSuggestion[] = data?.navigationSuggestions || [];
      
      // Capturamos la respuesta en lenguaje natural
      const naturalResponse = data?.natural_language_response;

      if (assistantError) {
        // Manejo de errores de ejecución SQL
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
        
        // CRÍTICO: Usamos la respuesta natural como contenido principal
        assistantContent = naturalResponse || 
        `✅ **Consulta Exitosa.** (La IA no pudo generar una respuesta natural). Se obtuvieron **${rowCount}** filas.`;

        if (assistantSuggestions.length > 0) {
            assistantContent += "\n\n**¡Acciones Sugeridas disponibles debajo!**";
        }

        toast({
          title: "✅ Consulta Ejecutada",
          description: `Se obtuvieron ${rowCount} filas.`,
        });
      }

      // Añadir mensaje del asistente con todos los metadatos
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: assistantContent, 
        timestamp: new Date().toISOString(),
        sql: assistantSql,
        result: assistantResult,
        error: assistantError,
        navigationSuggestions: assistantSuggestions,
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
      query: "De la consulta anterior, ¿cuántos tienen especialidad en Pediatría?", 
    },
  ];

  // Renderiza la previsualización del SQL y los resultados
  const renderResultTable = (data: any[], sql?: string, error?: string) => {
    if (error) {
        return (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-mono whitespace-pre-wrap">
                <AlertTriangle className="w-4 h-4 inline mr-2"/>
                <strong>Error de Ejecución:</strong> {error}
                {sql && <div className='mt-2 text-xs text-red-500'>SQL fallido: <code>{sql}</code></div>}
            </div>
        );
    }

    if (!data || data.length === 0) {
        return <p className="text-sm text-gray-500 italic">La consulta devolvió 0 resultados. SQL ejecutado: <code>{sql}</code></p>;
    }
    
    const columns = Object.keys(data[0]);

    return (
        <div className="overflow-x-auto max-h-64 border rounded-lg mt-2">
            <h4 className="text-sm font-medium flex items-center gap-1 p-2 bg-gray-50 border-b text-gray-700 sticky top-0">
                 <Table2 className="w-4 h-4"/> Previsualización de Datos ({data.length} filas):
            </h4>
            <div className="p-2">
                <h5 className="text-xs font-mono text-gray-500 mb-1 flex items-center gap-1">
                    <Code className="w-3 h-3"/> SQL: <code>{sql}</code>
                </h5>
            </div>
            
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


  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary animate-pulse" />
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <div>
            <CardTitle className="text-xl text-primary">SQL IA CON MEMORIA Y ACCIONES</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Traduce, recuerda el contexto, ejecuta y resume en lenguaje natural
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant={systemReady ? "default" : "secondary"}>
              {systemReady ? "✅ Activo" : "⏳ Cargando"}
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
                        {renderResultTable(message.result || [], message.sql, message.error)}
                    </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Analizando contexto y generando respuesta natural...</span>
              </div>
            )}
            
            <div ref={scrollRef} />
          </div>

          {/* --- Navigation Suggestions (Muestra las sugerencias del último mensaje) --- */}
          {currentSuggestions.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                Acciones Sugeridas
              </h4>
              <div className="flex flex-wrap gap-2">
                {currentSuggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigateToTab?.(suggestion.tab, suggestion.filters)}
                    className="text-xs"
                  >
                    <ArrowRight className="w-3 h-3 mr-1" />
                    {suggestion.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {/* ------------------------------------------- */}

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
                <Sparkles className="w-3 h-3" />
                <span>Respuesta en **Lenguaje Natural**</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAIChatMaster;
