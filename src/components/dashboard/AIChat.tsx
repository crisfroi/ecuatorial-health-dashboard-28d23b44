
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Bot, User, BarChart3, FileText, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
      content: '¡Hola! Soy tu asistente de análisis de datos sanitarios. Puedes preguntarme sobre estadísticas de profesionales, solicitudes, distribución geográfica, y más. ¿En qué puedo ayudarte?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const quickQuestions = [
    "¿Cuántos médicos hay registrados?",
    "¿Cuál es la distribución por provincia?",
    "¿Cuántas solicitudes están pendientes?",
    "Muéstrame estadísticas de género",
    "¿Qué hospitales tienen más profesionales?"
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

    // Simulación de respuesta de IA
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateAIResponse(inputMessage),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const generateAIResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('médicos') || lowerQuestion.includes('doctores')) {
      return "Según los datos actuales, hay 156 médicos registrados en el sistema. De estos, 112 están en el sector público y 44 en el sector privado. La mayor concentración está en Malabo (68 médicos) y Bata (45 médicos).";
    }
    
    if (lowerQuestion.includes('provincia') || lowerQuestion.includes('distribución')) {
      return "La distribución por provincias es:\n• Malabo: 245 profesionales (33.8%)\n• Bata: 198 profesionales (27.3%)\n• Ebebiyín: 87 profesionales (12.0%)\n• Mongomo: 56 profesionales (7.7%)\n• Evinayong: 78 profesionales (10.8%)";
    }
    
    if (lowerQuestion.includes('pendientes') || lowerQuestion.includes('solicitudes')) {
      return "Actualmente hay 23 solicitudes pendientes de revisión, 8 en proceso de firma ministerial y 156 solicitudes aprobadas este mes. El tiempo promedio de procesamiento es de 15 días.";
    }
    
    if (lowerQuestion.includes('género') || lowerQuestion.includes('mujeres') || lowerQuestion.includes('hombres')) {
      return "La distribución por género muestra:\n• Mujeres: 58.3% (422 profesionales)\n• Hombres: 41.7% (302 profesionales)\n\nEsto refleja una mayor participación femenina en el sector sanitario del país.";
    }
    
    return "Basándome en los datos disponibles, puedo ayudarte con estadísticas específicas. ¿Podrías ser más específico sobre qué información necesitas? Por ejemplo: número de profesionales por área, estado de solicitudes, o distribución geográfica.";
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
            <h2 className="text-2xl font-bold text-gray-900">Análisis Inteligente</h2>
            <p className="text-gray-600">Consulta datos en lenguaje natural</p>
          </div>
        </div>
        <Badge className="bg-guinea-light-teal text-guinea-dark-teal">
          IA Activa
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="bg-guinea-light-teal">
              <CardTitle className="flex items-center space-x-2 text-guinea-dark-teal">
                <Bot className="w-5 h-5" />
                <span>Asistente de Análisis</span>
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
                            : 'bg-gray-100 text-gray-900'
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
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Bot className="w-4 h-4 text-guinea-teal" />
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-guinea-teal rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-guinea-teal rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-guinea-teal rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Pregunta sobre los datos sanitarios..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={isLoading}
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
              <CardTitle className="text-lg">Preguntas Frecuentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full text-left justify-start h-auto p-3 text-sm hover:bg-guinea-light-teal hover:border-guinea-teal"
                  onClick={() => handleQuickQuestion(question)}
                >
                  {question}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Datos Disponibles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-guinea-teal" />
                <span className="text-sm">Profesionales Registrados</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-guinea-teal" />
                <span className="text-sm">Solicitudes y Estados</span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-guinea-teal" />
                <span className="text-sm">Análisis Estadísticos</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
