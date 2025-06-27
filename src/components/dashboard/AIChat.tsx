
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Bot, User, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '¡Hola! Soy tu asistente de IA especializado en el sistema RENAPROSA. Puedo ayudarte con consultas sobre profesionales sanitarios, estadísticas, procesos administrativos y más. ¿En qué puedo ayudarte hoy?',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
      // Simulamos una respuesta de IA inteligente basada en el contexto
      const response = await generateAIResponse(inputMessage);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error al generar respuesta:', error);
      toast({
        title: "Error en la IA",
        description: "No pude procesar tu consulta. Inténtalo de nuevo.",
        variant: "destructive",
      });
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Disculpa, hubo un error al procesar tu consulta. Por favor, intenta reformular tu pregunta o inténtalo más tarde.',
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = async (question: string): Promise<string> => {
    // Simulamos un delay de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const lowerQuestion = question.toLowerCase();
    
    // Respuestas contextuales basadas en palabras clave
    if (lowerQuestion.includes('estadística') || lowerQuestion.includes('estadisticas')) {
      return `Sobre estadísticas del sistema RENAPROSA:

📊 **Datos principales:**
- Total de profesionales registrados
- Distribución por áreas profesionales
- Estados de solicitudes (Pendiente, Aprobado, Rechazado, Revisando)
- Distribución geográfica por provincias y distritos

🔍 **Puedes consultar:**
- Tendencias de registro mensual
- Tasas de aprobación por área
- Vencimientos de carnets próximos
- Comparativas entre sectores público/privado

¿Qué aspecto específico te interesa analizar?`;
    }

    if (lowerQuestion.includes('profesional') || lowerQuestion.includes('médico') || lowerQuestion.includes('enfermero')) {
      return `Sobre gestión de profesionales sanitarios:

👨‍⚕️ **Información disponible:**
- Registro completo de profesionales
- Áreas: Medicina General, Enfermería, Farmacia, Laboratorio, etc.
- Estados de solicitudes y procesos de aprobación
- Información de centros de trabajo y ubicaciones

📋 **Procesos:**
- Solicitud de registro
- Revisión y aprobación
- Emisión de carnets profesionales
- Renovaciones y actualizaciones

¿Necesitas información sobre algún profesional específico o proceso en particular?`;
    }

    if (lowerQuestion.includes('centro') || lowerQuestion.includes('hospital') || lowerQuestion.includes('clínica')) {
      return `Sobre centros de salud en el sistema:

🏥 **Tipos de centros:**
- Hospitales públicos y privados
- Centros de salud primaria
- Clínicas especializadas
- Laboratorios y centros diagnósticos

📍 **Información disponible:**
- Ubicación por distritos sanitarios
- Personal asignado por centro
- Categorización de servicios
- Distribución geográfica

¿Buscas información sobre algún centro específico o zona geográfica?`;
    }

    if (lowerQuestion.includes('carnet') || lowerQuestion.includes('renovar') || lowerQuestion.includes('vencimiento')) {
      return `Sobre carnets profesionales:

🆔 **Gestión de carnets:**
- Emisión para profesionales aprobados
- Fechas de validez y vencimientos
- Procesos de renovación
- Seguimiento de estados

⚠️ **Alertas importantes:**
- Carnets próximos a vencer (30 días)
- Carnets vencidos que requieren renovación
- Notificaciones automáticas

¿Necesitas verificar el estado de algún carnet específico?`;
    }

    if (lowerQuestion.includes('ayuda') || lowerQuestion.includes('help')) {
      return `¡Estoy aquí para ayudarte! Puedo asistirte con:

🔍 **Consultas sobre:**
- Estadísticas y reportes del sistema
- Información de profesionales sanitarios
- Estados de solicitudes y procesos
- Centros de salud y ubicaciones
- Carnets profesionales y vencimientos

📊 **Análisis de datos:**
- Tendencias de registro
- Distribuciones geográficas
- Comparativas por áreas profesionales
- Alertas y notificaciones

💡 **Ejemplos de consultas:**
- "¿Cuántos médicos están registrados?"
- "Muéstrame las estadísticas por provincia"
- "¿Qué carnets vencen próximamente?"

¿Qué te gustaría saber específicamente?`;
    }

    // Respuesta genérica inteligente
    return `Entiendo tu consulta sobre "${question}". 

En el sistema RENAPROSA puedo ayudarte con información sobre:
- Profesionales sanitarios y sus datos
- Estadísticas y análisis de datos  
- Procesos administrativos y estados
- Centros de salud y ubicaciones
- Carnets profesionales y vencimientos

¿Podrías ser más específico sobre qué información necesitas? Por ejemplo:
- ¿Buscas datos estadísticos?
- ¿Información sobre un profesional específico?
- ¿Detalles sobre procesos administrativos?

Así podré darte una respuesta más precisa y útil.`;
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
            <span>IA Asistente RENAPROSA</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Área de mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[80%] ${
                  message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.sender === 'user' 
                      ? 'bg-guinea-teal text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {message.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  
                  <div className={`rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-guinea-teal text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                    <div className={`text-xs mt-1 ${
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
                  <div className="bg-gray-100 text-gray-800 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Pensando...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Área de entrada */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Escribe tu consulta sobre RENAPROSA..."
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
