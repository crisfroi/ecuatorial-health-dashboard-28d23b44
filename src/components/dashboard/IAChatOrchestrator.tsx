import React, { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Send, Compass, ArrowRight } from "lucide-react";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface NavigationSuggestion {
  type: "navigate";
  tab: string;
  label: string;
  filters?: Record<string, any>;
}

interface IAChatOrchestratorProps {
  onNavigateToTab?: (tab: string, filters?: any) => void;
  filters?: Record<string, any>;
}

const IAChatOrchestrator: React.FC<IAChatOrchestratorProps> = ({ onNavigateToTab, filters }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hola, soy tu asistente de análisis. Pregúntame en lenguaje natural sobre profesionales, centros, renovaciones, distritos, formación o tendencias y te responderé con datos del sistema.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<NavigationSuggestion[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    const nextMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(nextMessages);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("iachat", {
        body: JSON.stringify({ messages: nextMessages, filters: filters || {} }),
        method: "POST",
      });
      if (error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Ocurrió un error al consultar la IA: ${error.message}`,
          },
        ]);
        return;
      }
      const answer = (data as any)?.answer as string;
      const suggestionsResp = ((data as any)?.navigationSuggestions || []) as NavigationSuggestion[];
      const toolResults = (data as any)?.toolResults || null;
      const diagnostics = (data as any)?.diagnostics || null;

      setSuggestions(suggestionsResp || []);

      const append: ChatMessage[] = [
        { role: "assistant", content: answer || "No obtuve respuesta." },
      ];

      if (toolResults) {
        if (toolResults.get_gender_stats && (toolResults.get_gender_stats as any).por_genero) {
          const g = (toolResults.get_gender_stats as any).por_genero;
          const total = (toolResults.get_gender_stats as any).total;
          append.push({ role: "assistant", content: `Distribución por género (total ${total}): ${Object.entries(g).map(([k,v])=>`${k}: ${v}`).join(", ")}` });
        }
        if (toolResults.get_professionals_count && (toolResults.get_professionals_count as any).count !== undefined) {
          append.push({ role: "assistant", content: `Coincidencias exactas: ${(toolResults.get_professionals_count as any).count}` });
        }
        if (toolResults.get_centers_overview && Array.isArray(toolResults.get_centers_overview)) {
          const list = (toolResults.get_centers_overview as any[]).slice(0,3).map(c=>`${c.nombre}: ${c.total_profesionales}`).join("; ");
          append.push({ role: "assistant", content: `Top centros: ${list}` });
        }
      }


      setMessages((prev) => [...prev, ...append]);

      if (suggestions && suggestions.length && onNavigateToTab) {
        // Render quick actions below
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error de red: ${e?.message || e}` },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          <CardTitle>IA Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-72 overflow-y-auto border rounded-md p-3 bg-white">
              {messages.map((m, i) => (
                <div key={i} className="mb-3">
                  <div className={`text-xs font-semibold ${m.role === "user" ? "text-blue-700" : "text-green-700"}`}>
                    {m.role === "user" ? "Tú" : "Asistente"}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && canSend) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Escribe tu pregunta (ej.: ¿Cuántos profesionales aprobados hay por distrito?)"
              />
              <Button onClick={sendMessage} disabled={!canSend}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones rápidas sugeridas por la IA (renderizadas a partir del último mensaje) */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s, idx) => (
            <Button
              key={idx}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => onNavigateToTab && onNavigateToTab(s.tab, s.filters || {})}
            >
              <ArrowRight className="w-4 h-4" /> {s.label}
            </Button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {onNavigateToTab && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateToTab("analytics")}
            className="flex items-center gap-2"
          >
            <Compass className="w-4 h-4" /> Ir a Analíticas
          </Button>
        )}
      </div>
    </div>
  );
};

export default IAChatOrchestrator;
