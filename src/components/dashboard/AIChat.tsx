
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Bot, User, BarChart3, FileText, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: '¡Hola! Soy tu asistente de análisis de datos sanitarios conectado con OpenAI. Tengo acceso en tiempo real a los datos del RENAPROSA y puedo ayudarte con análisis avanzados, estadísticas, tendencias y recomendaciones basadas en datos reales. ¿En qué puedo ayudarte?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const quickQuestions = [
    "¿Cuál es la situación actual de profesionales por provincia?",
    "Analiza las tendencias en las solicitudes pendientes",
    "¿Qué recomendaciones puedes dar para mejorar la distribución de profesionales?",
    "Compara los datos actuales con patrones internacionales",
    "¿Qué áreas profesionales necesitan más atención?"
  ];

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      console.log('Sending question to AI:', inputMessage);
      
      const { data, error } = await supabase.functions.invoke('ai-chat-analysis', {
        body: { question: inputMessage }
      });

      if (error) {
        console.error('Error calling AI function:', error);
        throw error;
      }

      console.log('AI response received:', data);

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.response || 'Lo siento, no pude procesar tu pregunta en este momento.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);

    } catch (error) {
      console.error('Error in AI chat:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Lo siento, hubo un error al procesar tu pregunta. Por favor, inténtalo de nuevo más tarde.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error en el análisis IA",
        description: "No se pudo conectar con el servicio de análisis. Verifica la configuración.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-guinea-teal rounded-lg">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Análisis Inteligente con IA</h2>
            <p className="text-gray-600">Análisis avanzado con datos reales de Supabase y OpenAI</p>
          </div>
        </div>
        <Badge className="bg-green-100 text-green-800 border-green-200">
          🤖 OpenAI Conectado
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="bg-gradient-to-r from-guinea-teal to-guinea-dark-teal">
              <CardTitle className="flex items-center space-x-2 text-white">
                <Bot className="w-5 h-5" />
                <span>Asistente IA - Datos en Tiempo Real</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-guinea-teal text-white'
                            : 'bg-gray-100 text-gray-900 border'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          {message.type === 'ai' && (
                            <Bot className="w-4 h-4 mt-1 text-guinea-teal" />
                          )}
                          {message.type === 'user' && (
                            <User className="w-4 h-4 mt-1" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm whitespace-pre-line">{message.content}</p>
                            <span className="text-xs opacity-70 mt-1 block">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 p-3 rounded-lg border">
                        <div className="flex items-center space-x-2">
                          <Bot className="w-4 h-4 text-guinea-teal" />
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-guinea-teal rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-guinea-teal rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-guinea-teal rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-gray-600">Analizando datos...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 border-t bg-gray-50">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Pregunta sobre los datos sanitarios..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="bg-guinea-teal hover:bg-guinea-dark-teal"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preguntas Sugeridas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full text-left justify-start h-auto p-3 text-sm hover:bg-guinea-light-teal hover:border-guinea-teal"
                  onClick={() => handleQuickQuestion(question)}
                  disabled={isLoading}
                >
                  {question}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Capacidades IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-guinea-teal" />
                <span className="text-sm">Análisis de profesionales</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-guinea-teal" />
                <span className="text-sm">Tendencias y patrones</span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-guinea-teal" />
                <span className="text-sm">Recomendaciones basadas en datos</span>
              </div>
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-guinea-teal" />
                <span className="text-sm">Insights con contexto externo</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
