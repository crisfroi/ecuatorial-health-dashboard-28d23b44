
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Bot, User, Loader2, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEstadisticasReales } from '@/hooks/useEstadisticasReales';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isExternal?: boolean;
}

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hola, soy tu asistente especializado en el sistema RENAPROSA. Puedo ayudarte con información sobre profesionales sanitarios, estadísticas del sistema, procesos administrativos y también consultar información externa cuando sea necesario. ¿En qué puedo ayudarte?',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { data: stats } = useEstadisticasReales();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await generateIntelligentResponse(inputMessage);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        sender: 'ai',
        timestamp: new Date(),
        isExternal: response.isExternal
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error al generar respuesta:', error);
      toast({
        title: "Error en la consulta",
        description: "No pude procesar tu consulta. Inténtalo de nuevo.",
        variant: "destructive",
      });
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Disculpa, hubo un error al procesar tu consulta. Por favor, intenta reformular tu pregunta.',
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateIntelligentResponse = async (question: string): Promise<{content: string, isExternal: boolean}> => {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const lowerQuestion = question.toLowerCase();
    
    // Verificar si necesita información externa
    const needsExternalInfo = lowerQuestion.includes('actualidad') || 
                             lowerQuestion.includes('noticias') || 
                             lowerQuestion.includes('mundial') || 
                             lowerQuestion.includes('internacional') ||
                             lowerQuestion.includes('covid') ||
                             lowerQuestion.includes('pandemia') ||
                             lowerQuestion.includes('oms') ||
                             lowerQuestion.includes('política sanitaria');

    if (needsExternalInfo) {
      return {
        content: generateExternalResponse(question),
        isExternal: true
      };
    }

    // Respuestas basadas en datos del sistema
    if (lowerQuestion.includes('estadística') || lowerQuestion.includes('cuántos') || lowerQuestion.includes('total')) {
      return {
        content: generateStatsResponse(),
        isExternal: false
      };
    }

    if (lowerQuestion.includes('profesional') || lowerQuestion.includes('médico') || lowerQuestion.includes('doctor')) {
      return {
        content: `Actualmente tenemos ${stats?.total || 0} profesionales sanitarios registrados en RENAPROSA. De estos, ${stats?.aprobados || 0} están aprobados y ${stats?.pendientes || 0} están pendientes de revisión.

**Distribución por áreas principales:**
${Object.entries(stats?.porArea || {}).slice(0, 5).map(([area, cantidad]) => `• ${area}: ${cantidad} profesionales`).join('\n')}

¿Te interesa información específica sobre algún área profesional o distrito sanitario?`,
        isExternal: false
      };
    }

    if (lowerQuestion.includes('distrito') || lowerQuestion.includes('provincia') || lowerQuestion.includes('ubicación')) {
      const distritos = Object.entries(stats?.porDistrito || {}).slice(0, 5);
      return {
        content: `**Distribución por distritos sanitarios:**

${distritos.map(([distrito, cantidad]) => `📍 **${distrito}**: ${cantidad} profesionales`).join('\n')}

Los distritos con mayor concentración de profesionales son los centros urbanos principales. ¿Necesitas información específica sobre algún distrito?`,
        isExternal: false
      };
    }

    if (lowerQuestion.includes('estado') || lowerQuestion.includes('solicitud') || lowerQuestion.includes('proceso')) {
      return {
        content: `**Estado actual de las solicitudes en RENAPROSA:**

✅ **Aprobadas**: ${stats?.aprobados || 0} solicitudes
⏳ **Pendientes**: ${stats?.pendientes || 0} solicitudes  
🔄 **En revisión**: ${stats?.revisando || 0} solicitudes
❌ **Rechazadas**: ${stats?.rechazados || 0} solicitudes

La tasa de aprobación actual es del ${stats?.tasaAprobacion || 0}%. ¿Necesitas detalles sobre algún proceso específico?`,
        isExternal: false
      };
    }

    // Respuesta conversacional general
    return {
      content: generateConversationalResponse(question),
      isExternal: false
    };
  };

  const generateStatsResponse = () => {
    return `**Resumen estadístico actual de RENAPROSA:**

📊 **Totales generales:**
• Profesionales registrados: ${stats?.total || 0}
• Solicitudes aprobadas: ${stats?.aprobados || 0}
• Solicitudes pendientes: ${stats?.pendientes || 0}

🏥 **Por sectores:**
${Object.entries(stats?.porTipoSector || {}).map(([sector, cantidad]) => `• ${sector}: ${cantidad} profesionales`).join('\n')}

👨‍⚕️ **Áreas más representadas:**
${Object.entries(stats?.porArea || {}).slice(0, 3).map(([area, cantidad]) => `• ${area}: ${cantidad} profesionales`).join('\n')}

¿Te gustaría profundizar en algún aspecto específico de estas estadísticas?`;
  };

  const generateExternalResponse = (question: string) => {
    return `🌐 **Consulta externa requerida**

Para responder tu pregunta sobre "${question}", necesitaría acceder a información actualizada externa. Actualmente puedo ayudarte mejor con:

• **Datos del sistema RENAPROSA** (estadísticas, profesionales, procesos)
• **Información sanitaria de Guinea Ecuatorial** 
• **Consultas sobre el registro profesional**

Sin embargo, puedo sugerir que para información sanitaria internacional actualizada consultes:
- Organización Mundial de la Salud (WHO/OMS)
- Ministerio de Sanidad nacional
- Fuentes oficiales de salud pública

¿Hay algo específico del sistema RENAPROSA con lo que pueda ayudarte?`;
  };

  const generateConversationalResponse = (question: string) => {
    const responses = [
      `Entiendo tu consulta. En el contexto del sistema RENAPROSA, puedo ayudarte con información sobre nuestros ${stats?.total || 0} profesionales registrados. ¿Hay algo específico que te interese saber?`,
      
      `Es una buena pregunta. Basándome en los datos actuales del sistema, tenemos información detallada sobre profesionales sanitarios, sus especialidades y ubicaciones. ¿Qué aspecto te gustaría explorar?`,
      
      `Te entiendo perfectamente. El sistema RENAPROSA maneja información completa sobre el registro profesional sanitario. ¿Necesitas datos sobre algún área específica o proceso administrativo?`,
      
      `Interesante consulta. Con los datos que tengo del sistema, puedo proporcionarte información actualizada sobre estadísticas, distribuciones geográficas y estados de solicitudes. ¿Qué información sería más útil para ti?`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-6">
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="bg-gradient-to-r from-guinea-teal to-guinea-dark-teal text-white">
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>Asistente Inteligente RENAPROSA</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[85%] ${
                  message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.sender === 'user' 
                      ? 'bg-guinea-teal text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {message.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  
                  <div className={`rounded-lg p-4 ${
                    message.sender === 'user'
                      ? 'bg-guinea-teal text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                    {message.isExternal && (
                      <div className="flex items-center space-x-1 mt-2 text-xs opacity-70">
                        <Globe className="w-3 h-3" />
                        <span>Consulta externa</span>
                      </div>
                    )}
                    <div className={`text-xs mt-2 ${
                      message.sender === 'user' ? 'text-guinea-light-teal' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-gray-100 text-gray-800 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Analizando tu consulta...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Pregúntame sobre RENAPROSA, estadísticas, profesionales..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-guinea-teal hover:bg-guinea-dark-teal"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIChat;
