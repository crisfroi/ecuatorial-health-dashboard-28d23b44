import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import useRoleBasedData from "@/hooks/useRoleBasedData";
import { AVAILABLE_METRICS, ADVANCED_ANALYTICS, COMPLEX_QUERIES } from "@/utils/availableMetrics";
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

interface Message {
  id: string;
  type: "user" | "bot" | "system";
  content: string;
  timestamp: Date;
  metadata?: {
    queryType?: string;
    dataSource?: string;
    resultCount?: number;
    executionTime?: number;
  };
  attachments?: {
    charts?: any[];
    tables?: any[];
    downloadLinks?: string[];
  };
}

interface QueryContext {
  timeRange?: string;
  filters?: Record<string, any>;
  aggregationType?: string;
  compareWith?: string;
}

interface EnhancedAIChatProps {
  onNavigateToTab?: (tab: string, filters?: any) => void;
}

const EnhancedAIChat: React.FC<EnhancedAIChatProps> = ({ onNavigateToTab }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [queryContext, setQueryContext] = useState<QueryContext>({});
  const [selectedMetricCategory, setSelectedMetricCategory] = useState<string>("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { userRole, hasPermission } = useAuth();
  const { getAllowedMetrics, canAccessSensitiveData } = useRoleBasedData();

  // Cargar todas las métricas disponibles
  const { data: estadisticasBasicas } = useEstadisticasAvanzadas();
  const { data: topCenters } = useTopCenters();
  const { data: areaStats } = useAreaProfessionalStats();
  const { data: districtStats } = useDistrictStats();
  const { data: ageRangeStats } = useAgeRangeStats();
  const { data: graduationStats } = useGraduationYearStats();
  const { data: countryStats } = useCountryStats();
  const { data: institutionStats } = useInstitutionStats();
  const { data: centerCategoryStats } = useCenterCategoryStats();
  const { data: titulacionStats } = useTitulacionCategoryStats();

  // Mensaje de bienvenida inicial
  useEffect(() => {
    const welcomeMessage: Message = {
      id: "welcome",
      type: "system",
      content: `¡Hola! Soy tu asistente de IA especializado en análisis de datos del sistema de profesionales sanitarios de Guinea Ecuatorial. 

Como usuario con rol "${userRole}", tienes acceso a ${getAllowedMetrics().length} tipos de métricas y análisis.

**¿Qué puedo hacer por ti?**
• Analizar estadísticas de profesionales sanitarios
• Generar reportes por área profesional, distrito, centro
• Proporcionar tendencias temporales y proyecciones
• Comparar métricas entre regiones o períodos
• Identificar patrones y anomalías en los datos
• Responder consultas específicas sobre el sistema

**Ejemplos de consultas:**
• "¿Cuántos profesionales aprobados hay por área profesional?"
• "Muéstrame las tendencias de registros en los últimos 6 meses"
• "¿Qué distritos necesitan más profesionales de enfermería?"
• "Compara la distribución de profesionales entre Bioko Norte y Litoral"

¡Pregúntame cualquier cosa sobre los datos!`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [userRole, getAllowedMetrics]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Función para procesar consultas y generar respuestas inteligentes
  const processQuery = async (query: string): Promise<string> => {
    const lowercaseQuery = query.toLowerCase();
    
    // Analizar el tipo de consulta
    let response = "";
    let resultCount = 0;
    const startTime = Date.now();

    try {
      // CONSULTAS SOBRE PROFESIONALES POR ÁREA
      if (lowercaseQuery.includes("profesionales") && (lowercaseQuery.includes("área") || lowercaseQuery.includes("area"))) {
        if (areaStats && areaStats.length > 0) {
          const totalProfesionales = areaStats.reduce((sum, area) => sum + area.aprobados, 0);
          const topAreas = areaStats.slice(0, 5);
          
          response = `📊 **Análisis de Profesionales por Área Profesional**

**Total de profesionales aprobados:** ${totalProfesionales}

**Top 5 áreas con más profesionales:**
${topAreas.map((area, index) => 
  `${index + 1}. **${area.area_profesional}**: ${area.aprobados} profesionales (${area.porcentaje.toFixed(1)}%)`
).join('\n')}

**Áreas que necesitan refuerzo:**
${areaStats.sort((a, b) => a.aprobados - b.aprobados).slice(0, 3).map((area, index) => 
  `${index + 1}. **${area.area_profesional}**: solo ${area.aprobados} profesionales`
).join('\n')}`;
          
          resultCount = areaStats.length;
        }
      }

      // CONSULTAS SOBRE CENTROS DE SALUD
      else if (lowercaseQuery.includes("centros") || lowercaseQuery.includes("hospitales")) {
        if (topCenters && topCenters.length > 0) {
          const totalCentros = topCenters.length;
          const centrosConProfesionales = topCenters.filter(c => c.total_profesionales > 0);
          
          response = `🏥 **Análisis de Centros de Salud**

**Total de centros:** ${totalCentros}
**Centros con profesionales asignados:** ${centrosConProfesionales.length}

**Top 5 centros con más profesionales:**
${topCenters.slice(0, 5).map((center, index) => 
  `${index + 1}. **${center.nombre}** (${center.categoria}): ${center.total_profesionales} profesionales`
).join('\n')}

**Distribución por categoría:**
${centerCategoryStats?.map(cat => 
  `• **${cat.categoria}**: ${cat.total_centros} centros, ${cat.total_profesionales} profesionales`
).join('\n') || 'Datos no disponibles'}`;
          
          resultCount = totalCentros;
        }
      }

      // CONSULTAS SOBRE TENDENCIAS Y TIEMPO
      else if (lowercaseQuery.includes("tendencia") || lowercaseQuery.includes("mes") || lowercaseQuery.includes("año")) {
        if (estadisticasBasicas?.tendenciasMensuales) {
          const tendencias = estadisticasBasicas.tendenciasMensuales;
          const ultimosMeses = tendencias.slice(-6);
          const crecimientoPromedio = ultimosMeses.length > 1 ? 
            (ultimosMeses[ultimosMeses.length - 1].registros - ultimosMeses[0].registros) / ultimosMeses.length : 0;

          response = `📈 **Análisis de Tendencias Temporales**

**Últimos 6 meses de registros:**
${ultimosMeses.map(mes => 
  `• **${mes.mes}**: ${mes.registros} nuevos registros`
).join('\n')}

**Crecimiento promedio mensual:** ${crecimientoPromedio.toFixed(1)} registros

**Proyección próximo mes:** ${Math.round(ultimosMeses[ultimosMeses.length - 1].registros + crecimientoPromedio)} registros esperados

**Total acumulado:** ${estadisticasBasicas.total} profesionales registrados`;
          
          resultCount = tendencias.length;
        }
      }

      // CONSULTAS SOBRE DISTRITOS Y GEOGRAFÍA
      else if (lowercaseQuery.includes("distrito") || lowercaseQuery.includes("provincia") || lowercaseQuery.includes("región")) {
        if (districtStats && districtStats.length > 0) {
          const totalDistritos = districtStats.length;
          const topDistritos = districtStats.sort((a, b) => b.total_profesionales - a.total_profesionales).slice(0, 5);
          
          response = `🗺️ **Análisis Geográfico - Distritos Sanitarios**

**Total de distritos:** ${totalDistritos}

**Top 5 distritos por número de profesionales:**
${topDistritos.map((distrito, index) => 
  `${index + 1}. **${distrito.distrito_sanitario}**: ${distrito.total_profesionales} profesionales, ${distrito.total_centros} centros`
).join('\n')}

**Cobertura promedio:** ${(districtStats.reduce((sum, d) => sum + d.total_profesionales, 0) / totalDistritos).toFixed(1)} profesionales por distrito

**Áreas más comunes por distrito:**
${districtStats.slice(0, 3).map(distrito => 
  `• **${distrito.distrito_sanitario}**: ${distrito.areas_mas_comunes.slice(0, 2).join(', ')}`
).join('\n')}`;
          
          resultCount = totalDistritos;
        }
      }

      // CONSULTAS SOBRE EDAD Y DEMOGRAFÍA
      else if (lowercaseQuery.includes("edad") || lowercaseQuery.includes("joven") || lowercaseQuery.includes("mayor")) {
        if (ageRangeStats && ageRangeStats.length > 0) {
          const totalProfesionales = ageRangeStats.reduce((sum, age) => sum + age.cantidad, 0);
          
          response = `👥 **Análisis Demográfico por Edad**

**Distribución por rangos de edad:**
${ageRangeStats.map(age => 
  `• **${age.rango_edad}**: ${age.cantidad} profesionales (${age.porcentaje.toFixed(1)}%)`
).join('\n')}

**Total analizado:** ${totalProfesionales} profesionales

**Perfil demográfico:**
• Grupo más numeroso: **${ageRangeStats.sort((a, b) => b.cantidad - a.cantidad)[0]?.rango_edad}**
• Edad promedio estimada: ${ageRangeStats.reduce((sum, age, index) => {
  const midAge = age.rango_edad.includes('-') ? 
    (parseInt(age.rango_edad.split('-')[0]) + parseInt(age.rango_edad.split('-')[1])) / 2 : 45;
  return sum + (midAge * age.porcentaje / 100);
}, 0).toFixed(1)} años`;
          
          resultCount = ageRangeStats.length;
        }
      }

      // CONSULTAS SOBRE FORMACIÓN ACADÉMICA
      else if (lowercaseQuery.includes("formación") || lowercaseQuery.includes("universidad") || lowercaseQuery.includes("titulación")) {
        if (countryStats && institutionStats) {
          response = `🎓 **Análisis de Formación Académica**

**Países de formación (Top 5):**
${countryStats.slice(0, 5).map((country, index) => 
  `${index + 1}. **${country.pais_formacion}**: ${country.cantidad} profesionales (${country.porcentaje.toFixed(1)}%)`
).join('\n')}

**Instituciones principales:**
${institutionStats.slice(0, 5).map((inst, index) => 
  `${index + 1}. **${inst.institucion}**: ${inst.cantidad} graduados`
).join('\n')}

**Categorías de titulación:**
${titulacionStats?.slice(0, 3).map(cat => 
  `• **${cat.categoria_titulacion}**: ${cat.aprobados} profesionales aprobados`
).join('\n') || 'Datos no disponibles'}`;
          
          resultCount = countryStats.length + institutionStats.length;
        }
      }

      // CONSULTAS SOBRE ESTADÍSTICAS GENERALES
      else if (lowercaseQuery.includes("total") || lowercaseQuery.includes("estadística") || lowercaseQuery.includes("resumen")) {
        if (estadisticasBasicas) {
          response = `📋 **Resumen Estadístico General**

**Estado de profesionales:**
• **Total registrados:** ${estadisticasBasicas.total}
• **Aprobados:** ${estadisticasBasicas.aprobados} (${estadisticasBasicas.tasaAprobacion}%)
• **Pendientes (Recibidos):** ${estadisticasBasicas.recibidos}
• **En revisión:** ${estadisticasBasicas.revisando}
• **Rechazados:** ${estadisticasBasicas.rechazados} (${estadisticasBasicas.tasaRechazo}%)

**Distribución por género:**
• **Masculino:** ${estadisticasBasicas.generoMasculino}
• **Femenino:** ${estadisticasBasicas.generoFemenino}

**Alertas importantes:**
• **Carnets próximos a vencer:** ${estadisticasBasicas.vencimientosProximos}
• **Carnets vencidos:** ${estadisticasBasicas.carnetVencidos}

**Eficiencia del sistema:**
• **Tasa de aprobación:** ${estadisticasBasicas.tasaAprobacion}%
• **Procesamiento mensual promedio:** ${estadisticasBasicas.tendenciasMensuales?.slice(-3).reduce((sum, m) => sum + m.registros, 0) / 3 || 0} solicitudes`;
          
          resultCount = estadisticasBasicas.total;
        }
      }

      // CONSULTA PREDETERMINADA
      else {
        response = `🤔 **Consulta recibida:** "${query}"

No encontré una respuesta específica para tu consulta, pero aquí tienes algunas **sugerencias de análisis**:

**📊 Consultas sobre datos:**
• "Resumen estadístico general"
• "Profesionales por área profesional"
• "Tendencias de registro de los últimos meses"
• "Análisis de centros de salud"

**🔍 Consultas específicas:**
• "¿Qué áreas necesitan más profesionales?"
• "¿Cuál es la distribución por edad?"
• "¿Dónde se forman nuestros profesionales?"
• "¿Cuántos carnets están próximos a vencer?"

**📈 Análisis avanzados:**
• "Compara distritos sanitarios"
• "Proyecciones de crecimiento"
• "Eficiencia del sistema de aprobación"

¿Te gustaría que analice alguno de estos aspectos específicos?`;
      }

      const executionTime = Date.now() - startTime;
      
      // Agregar metadatos a la respuesta
      const botMessage: Message = {
        id: Date.now().toString(),
        type: "bot",
        content: response,
        timestamp: new Date(),
        metadata: {
          queryType: "data_analysis",
          resultCount,
          executionTime
        }
      };

      return response;

    } catch (error) {
      console.error("Error processing query:", error);
      return `❌ **Error al procesar la consulta**

Lo siento, ocurrió un error al analizar tu solicitud. Esto puede deberse a:
• Problemas de conectividad con la base de datos
• Datos no disponibles temporalmente
• Consulta demasiado compleja

Por favor, intenta con una consulta más específica o vuelve a intentarlo en unos momentos.`;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const botResponse = await processQuery(inputMessage);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: botResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar tu mensaje. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span>AI Analytics Assistant</span>
              <Badge variant="outline" className="text-xs">
                {userRole}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={clearChat}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col space-y-4">
          {/* Área de mensajes */}
          <ScrollArea className="flex-1 h-96 pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === "user"
                        ? "bg-blue-600 text-white"
                        : message.type === "system"
                        ? "bg-purple-50 border border-purple-200 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.type === "bot" && <Bot className="w-4 h-4 mt-1 flex-shrink-0" />}
                      {message.type === "user" && <User className="w-4 h-4 mt-1 flex-shrink-0" />}
                      {message.type === "system" && <Database className="w-4 h-4 mt-1 flex-shrink-0" />}
                      <div className="flex-1">
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </div>
                        {message.metadata && (
                          <div className="flex items-center space-x-2 mt-2 text-xs opacity-70">
                            {message.metadata.resultCount && (
                              <span>{message.metadata.resultCount} resultados</span>
                            )}
                            {message.metadata.executionTime && (
                              <span>{message.metadata.executionTime}ms</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-4 h-4" />
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Analizando datos...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Área de entrada */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Select value={selectedMetricCategory} onValueChange={setSelectedMetricCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las métricas</SelectItem>
                  {AVAILABLE_METRICS.map((category) => (
                    <SelectItem key={category.category} value={category.category}>
                      {category.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="outline" className="text-xs">
                {getAllowedMetrics().length} métricas disponibles
              </Badge>
            </div>
            
            <div className="flex space-x-2">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pregúntame sobre estadísticas, tendencias, distribuciones, análisis comparativos..."
                className="flex-1 min-h-[60px] resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="px-6"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedAIChat;
