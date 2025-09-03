import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageSquare, 
  Send, 
  Brain, 
  ArrowRight, 
  Loader2, 
  Sparkles,
  Database,
  Users,
  Building,
  Calendar,
  GraduationCap,
  IdCard,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface NavigationSuggestion {
  type: 'navigate';
  tab: string;
  label: string;
  filters?: Record<string, any>;
}

interface SuperAIChatMasterProps {
  onNavigateToTab?: (tab: string, filters?: any) => void;
  filters?: Record<string, any>;
}

const SuperAIChatMaster: React.FC<SuperAIChatMasterProps> = ({ 
  onNavigateToTab, 
  filters 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '🚀 **¡SISTEMA DE IA SUPERINTELIGENTE ACTIVADO!** \n\nSoy tu asistente avanzado con acceso completo a toda la base de datos del Sistema de Salud de Guinea Ecuatorial.\n\n**Mis súper capacidades incluyen:**\n\n✅ **26 tablas** con datos completos\n✅ **Análisis cross-table** con relaciones complejas\n��� **Estadísticas demográficas, geográficas y temporales**\n✅ **Filtros relacionales múltiples**\n✅ **Respuestas con datos precisos en tiempo real**\n\n**Pregúntame cualquier cosa sobre:**\n- 👥 Profesionales sanitarios por cualquier criterio\n- 🏥 Centros de salud y distribución\n- 📊 Estadísticas demográficas avanzadas\n- 🌍 Análisis geográficos por distrito/provincia\n- 🎓 Formación académica y países de origen\n- 🆔 Estado de carnets y vencimientos\n- ⏰ Análisis temporales y tendencias\n- 🔗 Correlaciones entre variables\n\n**Ejemplos de consultas avanzadas:**\n- *"Profesionales de UNGE graduados entre 2015-2020 que trabajan en hospitales públicos de Bata"*\n- *"Distribución por género de enfermeros en centros rurales del distrito Litoral"*\n- *"¿Cuántos carnets van a vencer en 30 días por provincia y área profesional?"*\n- *"Análisis temporal de solicitudes aprobadas por distrito sanitario"*\n\n¡Pregúntame lo que necesites saber! 🎯',
      timestamp: new Date().toISOString()
    }
  ]);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<NavigationSuggestion[]>([]);
  const [systemReady, setSystemReady] = useState(false);
  const [needsOpenAI, setNeedsOpenAI] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Verificar que el sistema esté listo
    checkSystemHealth();
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const checkSystemHealth = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat-master', {
        body: {
          messages: [{ role: 'user', content: 'test' }],
          healthCheck: true
        }
      });

      if (error) {
        console.error('Health check error:', error);
      }

      if (data?.needsOpenAI) {
        setNeedsOpenAI(true);
        setSystemReady(false);
        toast({
          title: "⚙️ Configuración Requerida",
          description: "Se necesita configurar la API key de OpenAI para activar la IA",
          variant: "destructive"
        });
      } else {
        setNeedsOpenAI(false);
        setSystemReady(true);
        toast({
          title: "🚀 Sistema IA Activado",
          description: "Superinteligencia lista para consultas avanzadas"
        });
      }
    } catch (error) {
      console.error('Error verificando sistema:', error);
      setNeedsOpenAI(true);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setSuggestions([]);

    try {
      console.log('🚀 Enviando consulta al sistema superinteligente...');
      
      const { data, error } = await supabase.functions.invoke('ai-chat-master', {
        body: {
          messages: [...messages, userMessage].slice(-10),
          filters: filters || {}
        }
      });

      if (data?.needsOpenAI) {
        setNeedsOpenAI(true);
        throw new Error('Se requiere configurar la API key de OpenAI');
      }

      if (error || data?.error) {
        console.error('Error de la IA:', error || data?.error);
        throw new Error((error as any)?.message || data?.error || 'Error del sistema de IA');
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data?.answer || 'No se pudo generar una respuesta.',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Procesar sugerencias de navegación
      if (data.navigationSuggestions && data.navigationSuggestions.length > 0) {
        setSuggestions(data.navigationSuggestions);
      }

      // Mostrar diagnósticos en consola
      if (data.diagnostics) {
        console.log('📊 Diagnósticos de IA:', data.diagnostics);
        
        if (data.diagnostics.toolsUsed?.length > 0) {
          toast({
            title: "🛠️ Herramientas Utilizadas",
            description: `Se ejecutaron ${data.diagnostics.toolsUsed.length} análisis especializados: ${data.diagnostics.toolsUsed.join(', ')}`
          });
        }
      }

    } catch (error: any) {
      console.error('Error completo:', error);
      
      const errorMessage: ChatMessage = {
        role: 'assistant', 
        content: `❌ **Error:** ${error.message}\n\n${needsOpenAI ? 
          '⚙️ **Acción requerida:** Configura la API key de OpenAI en la configuración de Supabase Edge Functions.' : 
          '🔄 Por favor intenta de nuevo o reformula tu pregunta.'}`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error del Sistema IA",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading && input.trim()) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    {
      icon: Users,
      label: "Análisis Demográfico",
      query: "Dame un análisis demográfico completo de todos los profesionales por género, edad y nacionalidad"
    },
    {
      icon: Building,
      label: "Centros de Salud",
      query: "Muéstrame la distribución de centros de salud por provincia y categoría, incluyendo profesionales por centro"
    },
    {
      icon: IdCard, 
      label: "Estado Carnets",
      query: "¿Cuántos carnets van a vencer en los próximos 30 días? Agrupa por provincia y área profesional"
    },
    {
      icon: GraduationCap,
      label: "Formación Académica", 
      query: "Analiza la formación académica: países de formación, instituciones más frecuentes y años de graduación"
    },
    {
      icon: BarChart3,
      label: "Análisis Temporal",
      query: "Muestra las tendencias temporales de solicitudes y aprobaciones en los últimos 6 meses"
    },
    {
      icon: Database,
      label: "Vista General",
      query: "Dame un resumen ejecutivo completo con las estadísticas más importantes del sistema"
    }
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
            <CardTitle className="text-xl text-primary">IA SUPERINTELIGENTE</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Acceso completo a 26 tablas • Análisis cross-relacional • Respuestas precisas
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant={systemReady ? "default" : needsOpenAI ? "destructive" : "secondary"}>
              {systemReady ? "✅ Activo" : needsOpenAI ? "⚙️ Config" : "⏳ Cargando"}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Chat Messages */}
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
                      <span className="font-medium text-primary">IA Superinteligente</span>
                    </>
                  )}
                  <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                </div>
                
                <div className={`prose prose-sm max-w-none rounded-lg p-3 ${
                  message.role === 'user' 
                    ? 'bg-primary/10 ml-6' 
                    : 'bg-accent/10 mr-6'
                }`}>
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Analizando datos con IA superinteligente...</span>
              </div>
            )}
            
            <div ref={scrollRef} />
          </div>

          {/* Navigation Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                Acciones Sugeridas
              </h4>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
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

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                Consultas Rápidas
              </h4>
              <div className="grid grid-cols-2 gap-2">
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
          )}

          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={systemReady 
                ? "Pregunta cualquier cosa sobre profesionales, centros, carnets, guardias..." 
                : needsOpenAI 
                ? "Configura OpenAI API key para activar la IA..." 
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
                  Para activar el sistema de IA superinteligente, configura la API key de OpenAI 
                  en la configuración de Supabase Edge Functions.
                </p>
              </div>
            </div>
          )}
          
          {systemReady && (
            <div className="text-xs text-muted-foreground flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                <span>26 Tablas Disponibles</span>
              </div>
              <div className="flex items-center gap-1">
                <Brain className="w-3 h-3" />
                <span>8 Herramientas Especializadas</span>
              </div>
              <div className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                <span>Análisis en Tiempo Real</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAIChatMaster;
