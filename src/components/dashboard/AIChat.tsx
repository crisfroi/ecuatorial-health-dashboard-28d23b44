import React, { useState, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEstadisticas } from "@/hooks/useEstadisticas";

const AIChat = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; timestamp: string; }[]>([]);
  const [input, setInput] = useState('');
  const { toast } = useToast();
  const { user } = useUser();
  const [isThinking, setIsThinking] = useState(false);
  
  const { data: estadisticas, isLoading: statsLoading } = useEstadisticas();

  const sendMessageMutation = useMutation(
    async (message: string) => {
      setIsThinking(true);
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, context: contextData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await response.json();
      return data.response;
    },
    {
      onSuccess: (response) => {
        setIsThinking(false);
        setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: new Date().toLocaleTimeString() }]);
      },
      onError: (error: any) => {
        setIsThinking(false);
        toast({
          title: "Error",
          description: error.message || "Failed to send message.",
          variant: "destructive",
        });
      },
    }
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSendMessage = useCallback(async () => {
    if (!input.trim()) return;

    const newMessage = { role: 'user', content: input, timestamp: new Date().toLocaleTimeString() };
    setMessages(prev => [...prev, newMessage]);
    setInput('');

    try {
      await sendMessageMutation.mutateAsync(input);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message.",
        variant: "destructive",
      });
    }
  }, [input, sendMessageMutation, toast]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const contextData = useMemo(() => {
    if (!estadisticas) return '';
    
    return `
    Estadísticas actuales del sistema:
    - Total de profesionales: ${estadisticas.total}
    - Aprobados: ${estadisticas.aprobados}
    - Pendientes de Firma: ${estadisticas.pendientes || 0}
    - Recibidos: ${estadisticas.recibidos}
    - Rechazados: ${estadisticas.rechazados}
    - En revisión: ${estadisticas.revisando}
    - Carnets que vencen pronto: ${estadisticas.vencimientosProximos}
    - Carnets vencidos: ${estadisticas.carnetVencidos}
    
    Distribución por área: ${JSON.stringify(estadisticas.porArea)}
    Distribución por provincia: ${JSON.stringify(estadisticas.porProvincia)}
    `;
  }, [estadisticas]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Asistente Virtual</CardTitle>
        <CardDescription>
          Pregunta sobre los datos y el estado del sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full">
          <div className="flex flex-col space-y-4 p-3">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="flex flex-col">
                  <div className={`rounded-lg p-2 max-w-sm ${msg.role === 'user' ? 'bg-blue-100 text-right' : 'bg-gray-100'}`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{msg.timestamp}</div>
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start">
                <div className="flex flex-col">
                  <div className="rounded-lg p-2 max-w-sm bg-gray-100">
                    <p className="text-sm">Pensando...</p>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{new Date().toLocaleTimeString()}</div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <div className="w-full flex items-center space-x-2">
          <Avatar>
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback>{user?.user_metadata?.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <Input
            type="text"
            placeholder="Escribe tu mensaje..."
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isThinking}
          />
          <Button onClick={handleSendMessage} disabled={isThinking}>
            Enviar <Send className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AIChat;
