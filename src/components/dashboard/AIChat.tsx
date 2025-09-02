import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useEstadisticasAvanzadas } from "@/hooks/useEstadisticasAvanzadas";
import {
  useTopCenters,
  useAreaProfessionalStats,
  useDistrictStats,
  useAgeRangeStats,
  useGraduationYearStats,
  useCountryStats,
  useInstitutionStats,
  useCenterCategoryStats,
  useTitulacionCategoryStats,
} from "@/hooks/useAdvancedAnalytics";
import { supabase } from "@/integrations/supabase/client";

interface NavigationAction {
  type: "navigate";
  tab: string;
  filters?: any;
  label: string;
}

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
  navigationActions?: NavigationAction[];
}

interface AIChatProps {
  onNavigateToTab?: (tab: string, filters?: any) => void;
}

const AIChat: React.FC<AIChatProps> = ({ onNavigateToTab }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content:
        "¡Hola! Soy tu asistente de análisis de datos de RENAPROSA. Puedo ayudarte a analizar estadísticas de profesionales sanitarios, identificar tendencias y responder preguntas sobre los datos. ¿En qué puedo ayudarte?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // All analytics data
  const { data: stats } = useEstadisticasAvanzadas();
  const { data: topCenters = [] } = useTopCenters();
  const { data: areaStats = [] } = useAreaProfessionalStats();
  const { data: districtStats = [] } = useDistrictStats();
  const { data: ageRangeStats = [] } = useAgeRangeStats();
  const { data: graduationStats = [] } = useGraduationYearStats();
  const { data: countryStats = [] } = useCountryStats();
  const { data: institutionStats = [] } = useInstitutionStats();
  const { data: categoryStats = [] } = useCenterCategoryStats();
  const { data: titulacionStats = [] } = useTitulacionCategoryStats();

  const suggestedQuestions = [
    "¿Cuáles son las principales tendencias en las solicitudes de profesionales?",
    "¿Qué centros de salud tienen más profesionales?",
    "¿Cuál es la distribución por género en las diferentes áreas profesionales?",
    "¿Qué distritos sanitarios necesitan más profesionales?",
    "¿Cuáles son las áreas profesionales que necesitan refuerzo?",
    "¿De qué países se forman más los profesionales?",
    "¿Cuál es la distribución por edades de los profesionales?",
    "¿Qué instituciones forman más profesionales?",
    "¿Cuáles son las tendencias de graduación por año?",
    "¿Cómo está distribuida la titulación por categorías?",
    "¿Qué categorías de centros tienen más profesionales?",
    "¿Hay algún patrón en los rechazos de solicitudes?",
  ];

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Comprehensive analytics data
      const comprehensiveData = {
        basicStats: stats,
        topCenters,
        areaStats,
        districtStats,
        ageRangeStats,
        graduationStats,
        countryStats,
        institutionStats,
        categoryStats,
        titulacionStats,
        summary: {
          totalProfessionals: areaStats.reduce(
            (sum, area) => sum + area.total,
            0,
          ),
          totalApproved: areaStats.reduce(
            (sum, area) => sum + area.aprobados,
            0,
          ),
          totalCenters: topCenters.length,
          totalDistricts: districtStats.length,
          totalCountries: countryStats.length,
          totalInstitutions: institutionStats.length,
        },
      };

      // Prefer server-side full access via openai-chat (uses Service Role)
      let data: any | null = null;
      let error: any | null = null;
      try {
        const res = await supabase.functions.invoke("openai-chat", {
          body: {
            messages: [
              { role: "user", content: message }
            ],
          },
        });
        data = res.data;
        error = res.error;
      } catch (e) {
        error = e;
      }

      // Fallback to ai-chat-analysis with client-provided analytics snapshot
      if (error || !data) {
        const res2 = await supabase.functions.invoke("ai-chat-analysis", {
          body: {
            message: message,
            analytics: comprehensiveData,
          },
        });
        data = res2.data;
        error = res2.error;
      }

      if (error) throw error;

      // Parse navigation actions from response (if present)
      let navigationActions: NavigationAction[] = [];
      let content =
        data.response ||
        "Lo siento, no pude procesar tu solicitud en este momento.";

      if (data.navigationSuggestions) {
        navigationActions = data.navigationSuggestions;
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content,
        timestamp: new Date(),
        navigationActions,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error calling AI function:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content:
          "Lo siento, hubo un error al procesar tu solicitud. Por favor, inténtalo de nuevo.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    sendMessage(inputMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Análisis IA</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Principal */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Chat de Análisis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea ref={scrollAreaRef} className="flex-1 px-6">
                <div className="space-y-4 pb-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-start space-x-3 ${
                        msg.type === "user"
                          ? "flex-row-reverse space-x-reverse"
                          : ""
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.type === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {msg.type === "user" ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                      </div>
                      <div
                        className={`max-w-[80%] ${
                          msg.type === "user" ? "text-right" : "text-left"
                        }`}
                      >
                        <div
                          className={`p-3 rounded-lg break-words ${
                            msg.type === "user"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <div className="whitespace-pre-wrap">
                            {msg.content}
                          </div>
                          {msg.navigationActions &&
                            msg.navigationActions.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                                <div className="text-sm font-medium text-gray-700">
                                  Navegar a:
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {msg.navigationActions.map(
                                    (action, index) => (
                                      <Button
                                        key={index}
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          onNavigateToTab?.(
                                            action.tab,
                                            action.filters,
                                          )
                                        }
                                        className="text-xs h-7 px-2"
                                      >
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        {action.label}
                                      </Button>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {msg.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Analizando datos...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu pregunta sobre los datos..."
                    className="flex-1 min-h-[44px] max-h-32 resize-none"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="h-11 px-4"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel de Preguntas Sugeridas */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preguntas Sugeridas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full text-left h-auto py-3 px-4 whitespace-normal"
                  onClick={() => handleSuggestedQuestion(question)}
                  disabled={isLoading}
                >
                  <div className="text-sm">{question}</div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Resumen de Datos */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen de Datos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Total Profesionales:</span>
                    <span className="font-semibold">{stats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Aprobados:</span>
                    <span className="font-semibold text-green-600">
                      {stats.aprobados}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pendientes:</span>
                    <span className="font-semibold text-yellow-600">
                      {stats.pendientes}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tasa de Aprobación:</span>
                    <span className="font-semibold">
                      {stats.tasaAprobacion}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIChat;
