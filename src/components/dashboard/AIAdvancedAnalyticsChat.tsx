import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Loader2,
  BarChart3,
  TrendingUp,
  Database,
  Sparkles,
  Filter,
  Download,
  RefreshCw,
  Lightbulb,
  Search,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useAdvancedAnalyticsAI, 
  AdvancedStatsQuery, 
  ANALYTICS_CATEGORIES 
} from "@/hooks/useAdvancedAnalyticsAI";
import { AdvancedAnalyticsResults } from "./AdvancedAnalyticsResults";

interface Message {
  id: string;
  type: "user" | "bot" | "system";
  content: string;
  timestamp: Date;
  query?: AdvancedStatsQuery;
  suggestions?: string[];
}

interface AIAdvancedAnalyticsChatProps {
  onNavigateToTab?: (tab: string, filters?: any) => void;
}

const AIAdvancedAnalyticsChat: React.FC<AIAdvancedAnalyticsChatProps> = ({ onNavigateToTab }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { userRole } = useAuth();
  
  const {
    loading,
    results,
    error,
    queryStats,
    clearResults,
    getSuggestions,
    parseNaturalLanguage,
    categories
  } = useAdvancedAnalyticsAI();

  // Mensaje de bienvenida inicial
  useEffect(() => {
    const welcomeMessage: Message = {
      id: "welcome",
      type: "system",
      content: `¡Hola! Soy tu asistente de IA especializado en análisis avanzado de estadísticas del sistema de profesionales sanitarios de Guinea Ecuatorial. 

Como usuario con rol "${userRole}", tengo acceso completo a todos los datos del sistema para proporcionarte análisis detallados.

**¿Qué puedo analizar por ti?**

📊 **Categorías de Análisis Disponibles:**
${categories.map(cat => `• **${cat.name}**: ${cat.description}`).join('\n')}

**Ejemplos de consultas:**
• "¿Cuántos profesionales hay por género?"
• "¿Cuáles son las áreas profesionales más comunes?"
• "¿En qué países se formaron más profesionales?"
• "¿Qué centros tienen más profesionales?"
• "Dame un análisis completo de todos los datos"

¡Pregúntame cualquier cosa sobre los datos del sistema!`,
      timestamp: new Date()
    };

    setMessages([welcomeMessage]);
  }, [userRole, categories]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Función para generar respuestas inteligentes basadas en los datos
  const generateSmartResponse = (result: any, userQuestion: string) => {
    if (!result.success) {
      return `Lo siento, no pude obtener los datos solicitados. Error: ${result.error}`;
    }

    const data = result.data;
    let response = "";

    // Determinar el tipo de respuesta basado en la consulta
    switch (result.query) {
      case 'demographics':
        response = `📊 **Análisis Demográfico:**\n\n`;

        if (data.total_profesionales) {
          response += `• **Total de profesionales registrados**: ${data.total_profesionales.toLocaleString()}\n`;
        }

        if (data.genero && Object.keys(data.genero).length > 0) {
          const totalGenero = Object.values(data.genero).reduce((a: any, b: any) => a + b, 0);
          response += `• **Distribución por género**:\n`;
          Object.entries(data.genero).forEach(([genero, count]: [string, any]) => {
            const percentage = ((count / totalGenero) * 100).toFixed(1);
            response += `  - ${genero}: ${count} (${percentage}%)\n`;
          });
        }

        if (data.grupos_edad && Object.keys(data.grupos_edad).length > 0) {
          response += `• **Grupos de edad más representados**:\n`;
          const sortedAges = Object.entries(data.grupos_edad)
            .sort(([,a]: any, [,b]: any) => b - a)
            .slice(0, 3);
          sortedAges.forEach(([age, count]: [string, any]) => {
            response += `  - ${age} años: ${count} profesionales\n`;
          });
        }

        if (data.provincias && Object.keys(data.provincias).length > 0) {
          const topProvincias = Object.entries(data.provincias)
            .sort(([,a]: any, [,b]: any) => b - a)
            .slice(0, 3);
          response += `• **Provincias con más profesionales**:\n`;
          topProvincias.forEach(([provincia, count]: [string, any]) => {
            response += `  - ${provincia}: ${count} profesionales\n`;
          });
        }
        break;

      case 'professional_areas':
        response = `👩‍⚕️ **Análisis de Áreas Profesionales:**\n\n`;

        if (data.areas_profesionales) {
          const sortedAreas = Object.entries(data.areas_profesionales)
            .sort(([,a]: any, [,b]: any) => b - a)
            .slice(0, 5);
          response += `• **Áreas profesionales más comunes**:\n`;
          sortedAreas.forEach(([area, count]: [string, any]) => {
            response += `  - ${area}: ${count} profesionales\n`;
          });
        }

        if (data.especialidades && Object.keys(data.especialidades).length > 0) {
          const topEspecialidades = Object.entries(data.especialidades)
            .sort(([,a]: any, [,b]: any) => b - a)
            .slice(0, 3);
          response += `• **Especialidades principales**:\n`;
          topEspecialidades.forEach(([esp, count]: [string, any]) => {
            response += `  - ${esp}: ${count}\n`;
          });
        }
        break;

      case 'work_centers':
        response = `🏥 **Análisis de Centros de Trabajo:**\n\n`;

        if (data.centros_registrados) {
          response += `• **Total de centros registrados**: ${data.centros_registrados}\n`;
        }

        if (data.centros_por_categoria) {
          response += `• **Distribución por categoría**:\n`;
          Object.entries(data.centros_por_categoria).forEach(([cat, count]: [string, any]) => {
            response += `  - ${cat}: ${count} centros\n`;
          });
        }

        if (data.centros_pendientes_validacion > 0) {
          response += `\n⚠️ **Atención**: Hay ${data.centros_pendientes_validacion} centros pendientes de validación.\n`;
        }
        break;

      case 'carnet_generation':
        response = `🆔 **Estado de Generación de Carnets:**\n\n`;

        if (data.carnets_generados) {
          response += `• **Carnets generados**: ${data.carnets_generados}\n`;
        }

        if (data.en_cola_generacion) {
          response += `• **En cola de generación**: ${data.en_cola_generacion}\n`;
        }

        if (data.analisis_vencimientos) {
          const v = data.analisis_vencimientos;
          response += `• **Estado de vigencia**:\n`;
          response += `  - Vigentes: ${v.vigentes || 0}\n`;
          response += `  - Próximos a vencer: ${v.proximos_vencer || 0}\n`;
          response += `  - Vencidos: ${v.vencidos || 0}\n`;

          if ((v.vencidos || 0) > 0 || (v.proximos_vencer || 0) > 0) {
            response += `\n⚠️ **Acción requerida**: ${v.vencidos || 0} carnets vencidos y ${v.proximos_vencer || 0} próximos a vencer.\n`;
          }
        }
        break;

      case 'comprehensive':
        response = `📊 **Resumen Ejecutivo del Sistema:**\n\n`;

        if (data.demograficas?.total_profesionales) {
          response += `🔹 **${data.demograficas.total_profesionales.toLocaleString()}** profesionales registrados\n`;
        }

        if (data.analisis_centros?.total_centros) {
          response += `🔹 **${data.analisis_centros.total_centros}** centros de salud\n`;
        }

        if (data.generacion_carnets?.carnets_generados) {
          response += `🔹 **${data.generacion_carnets.carnets_generados}** carnets generados\n`;
        }

        response += `\n📈 **Principales insights:**\n`;

        // Añadir insights inteligentes basados en los datos
        if (data.demograficas?.genero) {
          const generos = Object.entries(data.demograficas.genero);
          if (generos.length > 0) {
            const predominante = generos.reduce((a: any, b: any) => a[1] > b[1] ? a : b);
            response += `• Predominancia de género: ${predominante[0]} (${predominante[1]} profesionales)\n`;
          }
        }
        break;

      default:
        response = `📊 **Análisis de Datos:**\n\nHe procesado tu consulta y encontré información relevante. Los detalles están disponibles en el panel de resultados a la derecha.`;
    }

    return response;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setShowSuggestions(false);

    // Procesar la consulta
    const parsedQuery = parseNaturalLanguage(inputMessage);
    if (parsedQuery) {
      try {
        const suggestions = getSuggestions(inputMessage);
        
        // Mensaje de procesamiento
        const processingMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: `🔍 **Procesando consulta...**\n\nAnalizando: "${parsedQuery.description}"\nCategoría: ${categories.find(cat => cat.queries.includes(parsedQuery.query))?.name || 'Análisis General'}`,
          timestamp: new Date(),
          query: parsedQuery,
          suggestions
        };

        setMessages(prev => [...prev, processingMessage]);

        // Ejecutar la consulta
        const result = await queryStats(parsedQuery);

        // Mensaje de resultado
        const resultMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: "bot",
          content: result.success 
            ? `✅ **Análisis completado exitosamente**\n\nHe encontrado datos relevantes para tu consulta. Los resultados se muestran a continuación.`
            : `❌ **Error en el análisis**\n\nNo pude procesar tu consulta: ${result.error}`,
          timestamp: new Date(),
          query: parsedQuery
        };

        setMessages(prev => [...prev, resultMessage]);

        if (result.success) {
          toast({
            title: "Análisis completado",
            description: "Los resultados están listos para revisar",
          });
        } else {
          toast({
            title: "Error en el análisis",
            description: result.error || "Error desconocido",
            variant: "destructive"
          });
        }

      } catch (error) {
        const errorMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: "bot",
          content: `❌ **Error inesperado**\n\nOcurrió un error al procesar tu consulta. Por favor, intenta de nuevo.`,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, errorMessage]);
        
        toast({
          title: "Error",
          description: "Error inesperado al procesar la consulta",
          variant: "destructive"
        });
      }
    } else {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: `🤔 **No pude entender tu consulta**\n\nPor favor, reformula tu pregunta o usa una de estas categorías:\n\n${categories.map(cat => `• **${cat.name}**: ${cat.examples[0]}`).join('\n')}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    setShowSuggestions(false);
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      setInputMessage(category.examples[0]);
    }
  };

  const clearChat = () => {
    setMessages([]);
    clearResults();
    toast({
      title: "Chat limpiado",
      description: "Se han eliminado todos los mensajes y resultados",
    });
  };

  const filteredCategories = selectedCategory === "all" 
    ? categories 
    : categories.filter(cat => cat.id === selectedCategory);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">IA Analytics Avanzado</CardTitle>
            <Badge variant="secondary" className="ml-2">
              {userRole}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          </div>
        </div>
      </CardHeader>

      <div className="flex-1 flex gap-4 p-4">
        {/* Panel izquierdo - Chat */}
        <div className="flex-1 flex flex-col">
          {/* Categorías de análisis */}
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Categorías de Análisis
                </CardTitle>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredCategories.map(category => (
                  <Button
                    key={category.id}
                    variant="outline"
                    size="sm"
                    className="justify-start text-left h-auto p-3"
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-sm">{category.name}</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {category.examples[0]}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat */}
          <Card className="flex-1 flex flex-col">
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.type === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.type !== "user" && (
                        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.type === "user"
                            ? "bg-primary text-primary-foreground"
                            : message.type === "system"
                            ? "bg-muted"
                            : "bg-muted/50"
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </div>
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground mb-2">
                              Sugerencias relacionadas:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {message.suggestions.map((suggestion, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-6"
                                  onClick={() => handleSuggestionClick(suggestion)}
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {message.type === "user" && (
                        <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={inputMessage}
                    onChange={(e) => {
                      setInputMessage(e.target.value);
                      setShowSuggestions(e.target.value.length > 0);
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu consulta de análisis..."
                    disabled={loading}
                    className="pr-10"
                  />
                  {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 bg-background border rounded-lg shadow-lg z-10 mt-1">
                      {getSuggestions(inputMessage).map((suggestion, index) => (
                        <button
                          key={index}
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={loading || !inputMessage.trim()}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Panel derecho - Resultados */}
        <div className="w-1/2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Resultados del Análisis
                </CardTitle>
                {results.length > 0 && (
                  <Badge variant="secondary">
                    {results.length} análisis
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="p-4">
                  <AdvancedAnalyticsResults 
                    results={results} 
                    categories={categories} 
                  />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIAdvancedAnalyticsChat;
