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
  Code,
  Users,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast'; 

// --- INTERFACES PARA MEMORIA Y NAVEGACIÓN ---

// La IA debe devolver un array con este formato si genera sugerencias
interface NavigationSuggestion {
  type: 'navigate';
  tab: string; // Nombre de la pestaña (ej: 'profesionales', 'centros-salud')
  label: string; // Texto del botón (ej: 'Ver profesionales en la tabla')
  filters?: Record<string, any>; // Filtros opcionales para aplicar a la nueva vista
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sql?: string; 
  result?: any[];
  error?: string;
  // Campo que trae las sugerencias de la Edge Function
  navigationSuggestions?: NavigationSuggestion[];
}

interface SuperAIChatMasterProps {
  // Función para manejar la navegación o el cambio de pestaña
  onNavigateToTab?: (tab: string, filters?: any) => void;
}

// ---------------------------------------------

const SuperAIChatMaster: React.FC<SuperAIChatMasterProps> = ({ 
  onNavigateToTab,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Bienvenido/a. Soy RENAPROSA, tu asistente para consultas sobre profesionales, centros y estadísticas. Responderé en lenguaje claro y te ofreceré accesos directos cuando aplique.',
      timestamp: new Date().toISOString(),
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [systemReady, setSystemReady] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Obtiene las sugerencias del último mensaje del asistente
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
      // Pasamos los últimos 10 mensajes para mantener la memoria
      const historyToPass = [...messages, userMessage].slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));
      
      const payload = { messages: historyToPass };

      // Llamada a la Edge Function (Edge Function maneja OpenAI/Gemini)
      const { data, error } = await supabase.functions.invoke('ai-chat-master', {
        body: payload,
      });

      if (error) {
        throw new Error((error as any)?.message || 'Error en la llamada a la Edge Function.');
      }

      let assistantContent = '';
      // Oculto: no almacenamos SQL en el cliente
      let assistantResult = data?.result;
      let assistantError = data?.error;
      // Capturamos las sugerencias de navegación devueltas por el backend
      const assistantSuggestions: NavigationSuggestion[] = data?.navigationSuggestions || [];
      
      const naturalResponse = data?.natural_language_response;

      if (assistantError) {
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

        // Añadimos una nota en el contenido si hay sugerencias (se renderizan abajo)
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

  // Consultas rápidas
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

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary animate-pulse" />
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <div>
            <CardTitle className="text-xl text-primary">RENAPROSA · Asistente Inteligente</CardTitle>
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
                      <span className="font-medium text-primary">RENAPROSA</span>
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

                {/* --- Bloque de Sugerencias de Navegación --- */}
                {message.role === 'assistant' && message.navigationSuggestions && message.navigationSuggestions.length > 0 && (
                    <div className="space-y-2 p-3 mt-1 rounded-md bg-accent/5 border border-dashed border-accent/30">
                        <h4 className="text-xs font-semibold flex items-center gap-2 text-accent-foreground">
                            <ArrowRight className="w-3 h-3 text-accent" />
                            Acciones Rápidas
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {message.navigationSuggestions.map((suggestion, suggestionIndex) => (
                                <Button
                                    key={suggestionIndex}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onNavigateToTab?.(suggestion.tab, suggestion.filters)}
                                    className="text-xs h-8"
                                >
                                    {suggestion.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
                {/* ------------------------------------------- */}


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
                ? "Escribe tu pregunta..."
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
                <span>Asistente impulsado por IA con respaldo automático</span>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Respuestas en lenguaje natural</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAIChatMaster;
