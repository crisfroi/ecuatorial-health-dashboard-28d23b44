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
      content: `¡Hola! Soy tu asistente de IA para consultas del sistema RENAPROSA.

Escríbeme en lenguaje natural y te daré respuestas exactas basadas en la base de datos.
Ejemplos:
• ¿Cuántos profesionales tendrán el carnet vencido en menos de 90 días?
• ¿Cuántos graduados en la UNGE trabajan en el distrito sanitario de Litoral?
• ¿Cuántos profesionales aprobados hay en Bioko Norte?`,
      timestamp: new Date()
    };

    setMessages([welcomeMessage]);
  }, [userRole]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    // Responder saludos sin ejecutar análisis
    const isGreeting = /^(hola|buenas|buenos dias|buenas tardes|buenas noches|hello|hi|saludos)[.!\s]*$/i.test(userMessage.content.trim());
    if (isGreeting) {
      const greetingReply: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: "¡Hola! Dime qué necesitas saber y lo buscaré en la base de datos. Ejemplos: ‘¿vencen carnets en menos de 90 días?’ o ‘graduados UNGE en Litoral’.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, greetingReply]);
      return;
    }

    try {
      const suggestions = getSuggestions(userMessage.content);
      const processingMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: `🔍 Procesando consulta en el servidor...`,
        timestamp: new Date(),
        suggestions
      };
      setMessages(prev => [...prev, processingMessage]);

      // Enviar siempre el texto al backend para parseo NL y conteo
      const result = await queryStats({
        query: 'query_professionals',
        filters: {},
        description: userMessage.content
      });

      const resultMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: "bot",
        content: result.success
          ? `✅ Consulta completada. Revisa los resultados a la derecha.`
          : `❌ Error: ${result.error}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, resultMessage]);

      if (result.success) {
        toast({ title: "Análisis completado", description: "Resultados listos." });
      } else {
        toast({ title: "Error en el análisis", description: result.error || "Error desconocido", variant: "destructive" });
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: "bot",
        content: `❌ Error inesperado. Intenta de nuevo.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast({ title: "Error", description: "Fallo al procesar la consulta", variant: "destructive" });
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
              <ScrollArea className="h-[520px] p-4">
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
