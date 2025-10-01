import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Clock,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// --- CONSTANTES DE CACHÉ ---
const CACHE_KEY = 'renaprosa_chat_history';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas

// --- INTERFACES PARA MEMORIA Y NAVEGACIÓN ---
interface NavigationSuggestion {
  type: 'navigate';
  tab: string; // Nombre de la pestaña (ej: 'professionals', 'health-centers')
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

interface SavedHistory {
  messages: ChatMessage[];
  timestamp: number;
}

interface SuperAIChatMasterProps {
  onNavigateToTab?: (tab: string, filters?: any) => void;
}

// --- HELPERS VISUALES ---
const getNavigationIcon = (tab: string) => {
  switch (tab) {
    case 'professionals':
      return Users;
    case 'health-centers':
      return Database;
    case 'guardias':
      return Clock;
    case 'analytics':
      return BarChart3;
    default:
      return ArrowRight;
  }
};

// ---------------------------------------------

const SuperAIChatMaster: React.FC<SuperAIChatMasterProps> = ({
  onNavigateToTab,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [systemReady, setSystemReady] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const { toast } = useToast();

  // --- 1. LÓGICA DE PERSISTENCIA Y CACHE ---

  const initialAssistantMessage: ChatMessage = {
    role: 'assistant',
    content: 'Bienvenido/a. Soy RENAPROSA, tu asistente para consultas sobre profesionales, centros y estadísticas. Responderé en lenguaje claro y te ofreceré accesos directos cuando aplique.',
    timestamp: new Date().toISOString(),
  };

  // 1a. Función para guardar el historial
  const saveHistory = useCallback((currentMessages: ChatMessage[]) => {
    if (currentMessages.length > 1) { // No guardar solo el mensaje inicial
      const historyToSave: SavedHistory = {
        messages: currentMessages,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(historyToSave));
    } else {
      localStorage.removeItem(CACHE_KEY);
    }
  }, []);

  // 1b. Función para cargar el historial (con política de 24h)
  const loadHistory = useCallback(() => {
    const cachedHistory = localStorage.getItem(CACHE_KEY);
    if (cachedHistory) {
      try {
        const parsed: SavedHistory = JSON.parse(cachedHistory);
        const age = Date.now() - parsed.timestamp;

        if (age < CACHE_DURATION_MS) {
          // Historial reciente y válido
          setMessages(parsed.messages);
          toast({
            title: "Historial Recuperado",
            description: "Se cargó la conversación anterior. Se borrará automáticamente tras 24h de inactividad.",
            variant: "default",
          });
          return;
        } else {
          // Historial caducado
          localStorage.removeItem(CACHE_KEY);
        }
      } catch (e) {
        console.error("Error al parsear el historial de chat:", e);
        localStorage.removeItem(CACHE_KEY);
      }
    }
    // Si no hay caché o está caducada, usar mensaje inicial
    setMessages([initialAssistantMessage]);
  }, []);

  // 1c. useEffect para cargar y guardar
  useEffect(() => {
    loadHistory();
    setSystemReady(true);
    isInitialLoad.current = false;
  }, [loadHistory]);

  useEffect(() => {
    // Guardar el historial en localStorage cada vez que los mensajes cambian
    if (!isInitialLoad.current) {
      saveHistory(messages);
    }
    scrollToBottom();
  }, [messages, saveHistory]);

  // -------------------------------------------

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // --- 2. LÓGICA DE NAVEGACIÓN CON ADVERTENCIA ---

  const handleNavigation = (suggestion: NavigationSuggestion) => {
    if (!onNavigateToTab) return;

    // Si el historial es solo el mensaje inicial, navegar directamente
    if (messages.length <= 1) {
      onNavigateToTab(suggestion.tab, suggestion.filters);
      return;
    }

    // Mostrar advertencia si hay historial
    toast({
      title: <div className='flex items-center gap-2'><AlertTriangle className='w-5 h-5 text-yellow-500' /> Advertencia de Navegación</div>,
      description: `¿Estás seguro de que quieres salir de la pestaña? El historial de chat (últimas ${messages.length - 1} entradas) se perderá si no lo guardas o si pasa el límite de 24h.`,
      variant: "default",
      action: (
        <div className="flex flex-col gap-2 p-1">
          <Button
            variant="default"
            onClick={() => {
              // Simular "Guardar" y luego navegar
              saveHistory(messages);
              onNavigateToTab(suggestion.tab, suggestion.filters);
              // No mostrar un toast de éxito, ya que el toast actual se cerrará.
            }}
            className="w-full justify-start"
          >
            <Save className="w-4 h-4 mr-2" /> Guardar y Continuar
          </Button>
          <Button
            variant="secondary"
            onClick={() => onNavigateToTab(suggestion.tab, suggestion.filters)}
            className="w-full justify-start"
          >
            Continuar (sin guardar)
          </Button>
        </div>
      ),
      duration: 9000
    });
  };

  // --- 3. FUNCIÓN DE ENVÍO Y COMUNICACIÓN CON BACKEND ---

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const questionToSend = input.trim();

    const userMessage: ChatMessage = {
      role: 'user',
      content: questionToSend,
      timestamp: new Date().toISOString(),
    };
    
    // --- CORRECCIÓN CRÍTICA: Construir el historial para el payload ANTES de actualizar el estado ---
    // Usamos el estado 'messages' actual (previo) y el nuevo 'userMessage'.
    const fullHistory = [...messages, userMessage];

    const historyToPass = fullHistory.slice(-10).map(m => ({
      role: m.role,
      content: m.content
    }));

    const payload = { messages: historyToPass };
    // ------------------------------------------------------------------------------------------------

    // 1. Actualizar la UI inmediatamente con el mensaje del usuario
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Llamada a la Edge Function (Backend con Gemini/OpenAI Fallback)
      // La variable 'supabase' se mantiene de la importación original.
      const { data, error } = await supabase.functions.invoke('ai-chat-master', {
        body: payload, 
      });

      if (error) {
        throw new Error((error as any)?.message || 'Error en la llamada a la Edge Function.');
      }

      let assistantContent = '';
      let assistantResult = data?.result;
      let assistantError = data?.error;
      let assistantSQL = data?.sql; // CAPTURA DEL SQL
      const assistantSuggestions: NavigationSuggestion[] = data?.navigationSuggestions || [];
      const naturalResponse = data?.natural_language_response;

      let toastTitle = "✅ Consulta Exitosa";

      if (assistantError) {
        toastTitle = "❌ Error SQL";
        assistantContent = `❌ **Error al ejecutar la consulta:** El motor SQL devolvió un error.
        
**Mensaje de error:** ${assistantError.slice(0, 150)}...
`;
        toast({
          title: toastTitle,
          description: `El SQL generado no se pudo ejecutar.`,
          variant: "destructive"
        });
      } else {
        const rowCount = assistantResult?.length ?? 0;

        // CRÍTICO: Usamos la respuesta natural como contenido principal
        assistantContent = naturalResponse ||
          `✅ **Consulta Exitosa.** (La IA no pudo generar una respuesta natural). Se obtuvieron **${rowCount}** filas.`;

        // Añadimos una nota en el contenido si hay sugerencias 
        if (assistantSuggestions.length > 0) {
          assistantContent += "\n\n**¡Acciones Sugeridas disponibles debajo!**";
        }

        toast({
          title: toastTitle,
          description: `Se obtuvieron ${rowCount} filas.`,
        });
      }

      // Añadir mensaje del asistente con todos los metadatos
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date().toISOString(),
        sql: assistantSQL, // GUARDADO DEL SQL
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

                <div className={`prose prose-sm max-w-none rounded-lg p-3 ${message.role === 'user'
                    ? 'bg-primary/10 ml-6'
                    : (message.error ? 'bg-red-50/10 mr-6 border border-red-300' : 'bg-accent/10 mr-6')
                  }`}>
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                </div>

                {/* --- Bloque de Sugerencias de Navegación (Mejora: Iconos Dinámicos) --- */}
                {message.role === 'assistant' && message.navigationSuggestions && message.navigationSuggestions.length > 0 && (
                  <div className="space-y-2 p-3 mt-1 rounded-md bg-accent/5 border border-dashed border-accent/30">
                    <h4 className="text-xs font-semibold flex items-center gap-2 text-accent-foreground">
                      <ArrowRight className="w-3 h-3 text-accent" />
                      Acciones Rápidas
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {message.navigationSuggestions.map((suggestion, suggestionIndex) => {
                        const NavIcon = getNavigationIcon(suggestion.tab); // USANDO HELPER
                        return (
                          <Button
                            key={suggestionIndex}
                            variant="outline"
                            size="sm"
                            onClick={() => handleNavigation(suggestion)} // USANDO HANDLER CON ADVERTENCIA
                            className="text-xs h-8"
                          >
                            <NavIcon className="w-4 h-4 mr-1 shrink-0" />
                            {suggestion.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* ------------------------------------------- */}

                {/* --- Bloque de Visualización de SQL (Mejora: Debug) --- */}
                {message.role === 'assistant' && message.sql && (
                  <details className="mt-1 text-xs text-muted-foreground cursor-pointer ml-auto">
                    <summary className="font-medium p-1 flex items-center gap-1 hover:bg-background/80 rounded">
                      <Code className="w-3 h-3" />
                      Ver SQL Ejecutado
                    </summary>
                    <pre className="bg-gray-50 dark:bg-gray-800 p-2 rounded mt-1 overflow-x-auto text-[10px]">
                      <code>{message.sql}</code>
                    </pre>
                  </details>
                )}
                {/* ------------------------------------------------ */}

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
              disabled={loading || !systemReady} // Input is disabled if not ready or loading
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
            <div className="text-xs text-muted-foreground flex items-center gap-4 flex-wrap">
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
              <div className="flex items-center gap-1">
                <Save className="w-3 h-3" />
                <span>Historial: Guardado y Reinicio cada 24h</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAIChatMaster;
