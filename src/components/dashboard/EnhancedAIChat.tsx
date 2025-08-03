
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Database,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdvancedAnalyticsAI, type AdvancedStatsQuery } from "@/hooks/useAdvancedAnalyticsAI";
import AdvancedAnalyticsResults from "./AdvancedAnalyticsResults";

interface Message {
  id: string;
  type: "user" | "bot" | "system" | "results";
  content: string;
  timestamp: Date;
  metadata?: {
    queryType?: string;
    resultData?: any;
    summary?: any;
  };
}

interface EnhancedAIChatProps {
  onNavigateToTab?: (tab: string, filters?: any) => void;
}

const EnhancedAIChat: React.FC<EnhancedAIChatProps> = ({ onNavigateToTab }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [currentResults, setCurrentResults] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const {
    loading,
    results,
    error,
    connectionStatus,
    queryStats,
    clearResults,
    testConnection,
    parseNaturalLanguage,
    getSuggestions,
    categories
  } = useAdvancedAnalyticsAI();

  // Mensaje de bienvenida
  useEffect(() => {
    const welcomeMessage: Message = {
      id: "welcome",
      type: "system",
      content: `🤖 **Asistente de Análisis Avanzado con IA**

¡Hola! Soy tu asistente especializado en análisis de datos del sistema de profesionales sanitarios de Guinea Ecuatorial.

**¿Qué puedo hacer por ti?**
• Analizar estadísticas demográficas
• Revisar áreas profesionales y especialidades  
• Evaluar centros de trabajo y distribución
• Analizar formación y educación de profesionales
• Generar reportes comprehensivos del sistema

**Ejemplos de consultas:**
• "¿Cuántos profesionales hay por área profesional?"
• "Dame la distribución demográfica completa"
• "¿Qué centros tienen más profesionales?"
• "Necesito un análisis comprehensivo del sistema"

**Estado de conexión:** ${connectionStatus === 'connected' ? '🟢 Conectado' : '🟡 Verificando...'}

¡Pregúntame lo que necesites saber!`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [connectionStatus]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Test de conexión inicial
  useEffect(() => {
    testConnection();
  }, [testConnection]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Verificar conexión antes de procesar
    if (connectionStatus !== 'connected') {
      toast({
        title: "Error de Conexión",
        description: "Verificando conexión a la base de datos...",
        variant: "destructive",
      });
      
      const isConnected = await testConnection();
      if (!isConnected) {
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setShowResults(false);

    try {
      // Parsear consulta en lenguaje natural
      const parsedQuery = parseNaturalLanguage(inputMessage);
      
      if (!parsedQuery) {
        throw new Error('No se pudo interpretar la consulta');
      }

      console.log('📝 Consulta parseada:', parsedQuery);

      // Ejecutar consulta
      const result = await queryStats(parsedQuery);

      if (result.success && result.textResponse) {
        // Primero mostrar la respuesta de texto
        const textMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: result.textResponse,
          timestamp: new Date(),
          metadata: {
            queryType: parsedQuery.query,
            summary: result.summary
          }
        };

        setMessages(prev => [...prev, textMessage]);

        // Luego mostrar los resultados visuales si hay datos
        if (result.data && Object.keys(result.data).length > 0) {
          setTimeout(() => {
            const resultsMessage: Message = {
              id: (Date.now() + 2).toString(),
              type: "results",
              content: "📊 **Resultados del Análisis Visual**",
              timestamp: new Date(),
              metadata: {
                queryType: parsedQuery.query,
                resultData: result.data,
                summary: result.summary
              }
            };

            setMessages(prev => [...prev, resultsMessage]);
            setCurrentResults(result.data);
            setShowResults(true);
          }, 1000);
        }

      } else {
        throw new Error(result.error || 'No se obtuvieron resultados válidos');
      }

    } catch (error) {
      console.error("Error procesando mensaje:", error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: `❌ **Error al procesar la consulta**

${error instanceof Error ? error.message : 'Error desconocido'}

**Sugerencias:**
• Verifica tu conexión a internet
• Intenta con una consulta más específica
• Usa uno de los ejemplos sugeridos

**Ejemplos que puedes probar:**
${getSuggestions("análisis").slice(0, 3).map(s => `• "${s}"`).join('\n')}`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "No se pudo procesar tu consulta. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setShowResults(false);
    setCurrentResults(null);
    clearResults();
  };

  const handleRetryConnection = async () => {
    toast({
      title: "Reintentando conexión",
      description: "Verificando conectividad...",
    });
    
    const success = await testConnection();
    if (success) {
      toast({
        title: "Conexión restaurada",
        description: "Ya puedes hacer consultas normalmente.",
      });
    }
  };

  const getConnectionBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle className="w-3 h-3 mr-1" />
          Conectado
        </Badge>;
      case 'connecting':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Conectando...
        </Badge>;
      case 'error':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
          <AlertCircle className="w-3 h-3 mr-1" />
          Error de conexión
        </Badge>;
      default:
        return <Badge variant="outline">
          <Database className="w-3 h-3 mr-1" />
          Verificando...
        </Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Tarjeta principal de chat */}
      <Card className="flex-1 flex flex-col min-h-[600px]">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span>Análisis Avanzado con IA</span>
              {getConnectionBadge()}
            </div>
            <div className="flex items-center space-x-2">
              {connectionStatus === 'error' && (
                <Button variant="outline" size="sm" onClick={handleRetryConnection}>
                  <RefreshCw className="w-4 h-4" />
                  Reconectar
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleClearChat}>
                <RefreshCw className="w-4 h-4" />
                Limpiar
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col space-y-4">
          {/* Mostrar error de conexión si existe */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Área de mensajes */}
          <ScrollArea className="flex-1 min-h-96 pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-4 ${
                      message.type === "user"
                        ? "bg-blue-600 text-white"
                        : message.type === "system"
                        ? "bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 text-gray-800"
                        : message.type === "results"
                        ? "bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 text-gray-800"
                        : "bg-gray-50 border border-gray-200 text-gray-800"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {message.type === "bot" && <Bot className="w-5 h-5 mt-1 flex-shrink-0 text-blue-600" />}
                      {message.type === "user" && <User className="w-5 h-5 mt-1 flex-shrink-0" />}
                      {message.type === "system" && <Database className="w-5 h-5 mt-1 flex-shrink-0 text-purple-600" />}
                      {message.type === "results" && <TrendingUp className="w-5 h-5 mt-1 flex-shrink-0 text-green-600" />}
                      
                      <div className="flex-1">
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </div>
                        
                        {/* Mostrar resumen si está disponible */}
                        {message.metadata?.summary && (
                          <div className="mt-3 p-3 bg-white/50 rounded-lg border border-gray-200">
                            <div className="text-xs font-medium text-gray-600 mb-2">Resumen de datos:</div>
                            <div className="space-y-1">
                              {message.metadata.summary.total_profesionales && (
                                <div className="text-xs">
                                  <span className="font-medium">Total profesionales:</span> {message.metadata.summary.total_profesionales}
                                </div>
                              )}
                              {message.metadata.summary.total_centros && (
                                <div className="text-xs">
                                  <span className="font-medium">Total centros:</span> {message.metadata.summary.total_centros}
                                </div>
                              )}
                              {message.metadata.summary.areas_principales?.length > 0 && (
                                <div className="text-xs">
                                  <span className="font-medium">Áreas principales:</span> {message.metadata.summary.areas_principales.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="text-xs opacity-70 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Indicador de carga */}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-xs">
                    <div className="flex items-center space-x-3">
                      <Bot className="w-5 h-5 text-blue-600" />
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="text-sm text-blue-700">
                          Analizando datos del sistema...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Área de entrada de mensaje */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Escribe tu consulta sobre el sistema sanitario</span>
              <span>{categories.length} categorías de análisis disponibles</span>
            </div>
            
            <div className="flex space-x-2">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ejemplo: ¿Cuántos profesionales hay por área? o Dame un análisis comprehensivo..."
                className="flex-1 min-h-[80px] resize-none"
                disabled={loading || connectionStatus !== 'connected'}
              />
              <Button
                onClick={handleSendMessage}
                disabled={loading || !inputMessage.trim() || connectionStatus !== 'connected'}
                className="px-6 h-20"
                size="lg"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            
            {connectionStatus !== 'connected' && (
              <div className="text-center text-sm text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
                Verificando conexión a la base de datos...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultados visuales */}
      {showResults && currentResults && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span>Resultados del Análisis Visual</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdvancedAnalyticsResults
              results={[{
                success: true,
                data: currentResults,
                query: '',
                timestamp: new Date().toISOString()
              }]}
              onNavigateToTab={onNavigateToTab}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedAIChat;
