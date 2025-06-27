
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Bot, User, Loader2, BarChart3, Filter } from 'lucide-react';
import { useEstadisticasAvanzadas } from '@/hooks/useEstadisticasAvanzadas';
import { supabase } from '@/integrations/supabase/client';
import FilteredDataModal from './FilteredDataModal';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  hasData?: boolean;
  dataFilters?: Record<string, any>;
  chartData?: any[];
  chartType?: 'bar' | 'pie' | 'stats';
}

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: '¡Hola! Soy tu asistente de análisis de datos de RENAPROSA. Puedo ayudarte a analizar estadísticas de profesionales sanitarios, identificar tendencias y responder preguntas sobre los datos. ¿En qué puedo ayudarte?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { data: stats } = useEstadisticasAvanzadas();

  const suggestedQuestions = [
    "¿Cuáles son las principales tendencias en las solicitudes de profesionales?",
    "¿Qué provincias tienen más profesionales aprobados?",
    "¿Cuál es la distribución por género en las diferentes áreas profesionales?",
    "¿Hay algún patrón en los rechazos de solicitudes?",
    "¿Qué recomendaciones tienes para mejorar el proceso de aprobación?",
    "Muestra los datos de profesionales por área profesional",
    "Analiza la distribución geográfica de profesionales",
    "Genera un gráfico de estados de solicitud"
  ];

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const processAIResponse = (response: string, originalMessage: string) => {
    // Detectar si la respuesta contiene datos que pueden ser visualizados
    const hasDataKeywords = /datos|gráfico|estadística|distribución|mostrar|visualizar|tabla/i.test(originalMessage);
    
    if (hasDataKeywords && stats) {
      // Extraer filtros basados en el mensaje
      const filters: Record<string, any> = {};
      let chartData: any[] = [];
      let chartType: 'bar' | 'pie' | 'stats' = 'stats';

      if (/área profesional|áreas|profesional/i.test(originalMessage)) {
        chartData = stats.datosGraficoAreas || [];
        chartType = 'bar';
        filters.tipo = 'área profesional';
      } else if (/provincia|geográfica|distribución geográfica/i.test(originalMessage)) {
        chartData = stats.datosGraficoProvincias || [];
        chartType = 'pie';
        filters.tipo = 'provincia';
      } else if (/estado|solicitud|aprobado|rechazado/i.test(originalMessage)) {
        chartData = stats.datosGraficoEstados || [];
        chartType = 'bar';
        filters.tipo = 'estado de solicitud';
      }

      return {
        hasData: chartData.length > 0,
        dataFilters: filters,
        chartData,
        chartType
      };
    }

    return { hasData: false };
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat-analysis', {
        body: {
          message: message,
          statistics: stats
        }
      });

      if (error) throw error;

      const responseData = processAIResponse(data.response || '', message);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.response || 'Lo siento, no pude procesar tu solicitud en este momento.',
        timestamp: new Date(),
        ...responseData
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error calling AI function:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Lo siento, hubo un error al procesar tu solicitud. Por favor, inténtalo de nuevo.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    sendMessage(inputMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  const handleShowData = (message: Message) => {
    setSelectedData({
      title: `Datos filtrados: ${message.dataFilters?.tipo || 'Análisis'}`,
      data: message.chartData || [],
      chartType: message.chartType || 'stats',
      filters: message.dataFilters || {}
    });
    setShowDataModal(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-guinea-teal to-guinea-dark-teal bg-clip-text text-transparent">
            Análisis IA
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Principal */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4 bg-gradient-to-r from-guinea-teal to-guinea-dark-teal text-white rounded-t-lg">
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
                          msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
                          msg.type === 'user' 
                            ? 'bg-gradient-to-br from-guinea-teal to-guinea-dark-teal text-white' 
                            : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600'
                        }`}>
                          {msg.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className={`max-w-[80%] ${
                          msg.type === 'user' ? 'text-right' : 'text-left'
                        }`}>
                          <div className={`p-3 rounded-lg break-words shadow-md hover:shadow-lg transition-shadow duration-200 ${
                            msg.type === 'user'
                              ? 'bg-gradient-to-br from-guinea-teal to-guinea-dark-teal text-white'
                              : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900'
                          }`}>
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                            {msg.hasData && (
                              <div className="mt-3 pt-3 border-t border-white/20">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleShowData(msg)}
                                  className="text-xs bg-white/20 hover:bg-white/30 text-white transition-colors duration-200"
                                >
                                  <BarChart3 className="w-3 h-3 mr-1" />
                                  Ver Datos
                                </Button>
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
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600 flex items-center justify-center shadow-md">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg shadow-md">
                          <div className="flex items-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin text-guinea-teal" />
                            <span className="text-guinea-teal">Analizando datos...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                
                <div className="border-t p-4 bg-gray-50/50">
                  <div className="flex space-x-2">
                    <Textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Escribe tu pregunta sobre los datos..."
                      className="flex-1 min-h-[44px] max-h-32 resize-none border-guinea-teal/30 focus:border-guinea-teal focus:ring-guinea-teal/30"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isLoading}
                      className="h-11 px-4 bg-gradient-to-r from-guinea-teal to-guinea-dark-teal hover:from-guinea-dark-teal hover:to-guinea-teal transition-all duration-200 shadow-md hover:shadow-lg"
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
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-guinea-light-teal to-guinea-teal text-white rounded-t-lg">
                <CardTitle className="text-lg">Preguntas Sugeridas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full text-left h-auto py-3 px-4 whitespace-normal border-guinea-teal/30 hover:border-guinea-teal hover:bg-guinea-light-teal/10 transition-all duration-200 shadow-sm hover:shadow-md"
                    onClick={() => handleSuggestedQuestion(question)}
                    disabled={isLoading}
                  >
                    <div className="text-sm text-guinea-dark-teal">{question}</div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Resumen de Datos */}
            {stats && (
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-guinea-light-teal to-guinea-teal text-white rounded-t-lg">
                  <CardTitle className="text-lg">Resumen de Datos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between p-2 bg-guinea-light-teal/10 rounded-lg">
                      <span className="text-guinea-dark-teal">Total Profesionales:</span>
                      <span className="font-semibold text-guinea-dark-teal">{stats.total}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-green-50 rounded-lg">
                      <span className="text-guinea-dark-teal">Aprobados:</span>
                      <span className="font-semibold text-green-600">{stats.aprobados}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-yellow-50 rounded-lg">
                      <span className="text-guinea-dark-teal">Pendientes:</span>
                      <span className="font-semibold text-yellow-600">{stats.pendientes}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-blue-50 rounded-lg">
                      <span className="text-guinea-dark-teal">Tasa de Aprobación:</span>
                      <span className="font-semibold text-blue-600">{stats.tasaAprobacion}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modal de datos filtrados */}
      {selectedData && (
        <FilteredDataModal
          isOpen={showDataModal}
          onClose={() => setShowDataModal(false)}
          title={selectedData.title}
          data={selectedData.data}
          chartType={selectedData.chartType}
          filters={selectedData.filters}
        />
      )}
    </>
  );
};

export default AIChat;
