// supabase/functions/ai-chat-master/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Schema/context used to guide the LLMs
const ENHANCED_SCHEMA = {
  domain: "Sistema de Salud de Guinea Ecuatorial",
  context: "Gestión de profesionales sanitarios, centros de salud, guardias médicas y acreditaciones",
  tables: {
    profesionales_sanitarios: {
      description: "Profesionales de la salud registrados en el sistema",
      mainColumns: {
        id: { type: "uuid" },
        nombre_completo: { type: "text", indexed: true },
        area_profesional: { type: "text", indexed: true },
        estado_solicitud: { type: "varchar", indexed: true },
        funcion_publica: { type: "boolean", indexed: true },
        estatus_funcionario: { type: "text" },
        nacionalidad: { type: "text", indexed: true },
        provincia: { type: "text", indexed: true },
        distrito_sanitario: { type: "text", indexed: true },
        edad: { type: "integer" },
        genero: { type: "text" },
        pais_formacion_1: { type: "text", indexed: true },
        pais_formacion_2: { type: "text" },
        institucion_1: { type: "text", indexed: true },
        institucion_2: { type: "text" },
        año_graduacion: { type: "integer", indexed: true },
        fecha_caducidad: { type: "date" },
        id_profesional_unico: { type: "text" }
      }
    },
    centros_salud: {
      description: "Centros de salud y hospitales",
      mainColumns: {
        id: { type: "uuid" },
        nombre: { type: "text", indexed: true },
        categoria: { type: "text", indexed: true },
        sector: { type: "text", indexed: true },
        provincia: { type: "text", indexed: true },
        distrito_sanitario: { type: "text", indexed: true }
      }
    }
  }
};

function buildEnhancedSystemPrompt(): string {
  return `Eres un asistente experto para el Sistema de Salud de Guinea Ecuatorial.\n\nCONTEXTO:\n${JSON.stringify(ENHANCED_SCHEMA, null, 2)}\n\nREGLAS:\n- Devuelve SOLO una sentencia SQL en un bloque markdown etiquetado como sql.\n- No añadas explicaciones ni texto adicional.\n- Usa únicamente tablas/columnas del contexto.\n- Prioriza SELECT y joins válidos.`;
}

async function openAIChat(messages: any[]): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY ausente');
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0, max_tokens: 700 })
  });
  if (!resp.ok) throw new Error(`OpenAI error ${resp.status}: ${await resp.text()}`);
  const json = await resp.json();
  return json.choices?.[0]?.message?.content ?? '';
}

async function geminiGenerateText(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY ausente');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] })
  });
  if (!resp.ok) throw new Error(`Gemini error ${resp.status}: ${await resp.text()}`);
  const json = await resp.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return text;
}

function extractSqlFromText(text: string): string {
  const match = text.match(/```(?:sql|SQL)?\s*([\s\S]*?)\s*```/);
  const raw = match ? match[1] : text;
  const trimmed = raw.trim();
  return trimmed.endsWith(';') ? trimmed.slice(0, -1) : trimmed;
}

function deriveNavigationSuggestions(sql: string) {
  const s = sql || '';
  const filters: Record<string, any> = {};
  const get = (r: RegExp) => (s.match(r)?.[1] || '').trim();

  const provincia = get(/provincia\s*=\s*'([^']+)'/i);
  const distrito_sanitario = get(/distrito_sanitario\s*=\s*'([^']+)'/i);
  const distrito = get(/\bdistrito\s*=\s*'([^']+)'/i);
  const area_profesional = get(/area_profesional\s*=\s*'([^']+)'/i);
  const genero = get(/genero\s*=\s*'([^']+)'/i);
  const tipo_sector = get(/tipo_sector\s*=\s*'([^']+)'/i);
  const edadMin = get(/edad\s*>?=\s*(\d+)/i);
  const edadMax = get(/edad\s*<?=\s*(\d+)/i);

  if (provincia) filters.provincia = provincia;
  if (distrito_sanitario) filters.distrito_sanitario = distrito_sanitario;
  if (distrito) filters.distrito = distrito;
  if (area_profesional) filters.area_profesional = area_profesional;
  if (genero) filters.genero = genero;
  if (tipo_sector) filters.tipo_sector = tipo_sector;
  if (edadMin) filters.edad_minima = Number(edadMin);
  if (edadMax) filters.edad_maxima = Number(edadMax);

  let tab = 'analytics';
  if (/from\s+profesionales_sanitarios/i.test(s)) tab = 'professionals';
  else if (/from\s+centros_salud/i.test(s)) tab = 'health-centers';
  else if (/from\s+guardias/i.test(s) || /nominas_guardias/i.test(s)) tab = 'guardias';

  const labelMap: Record<string, string> = {
    'professionals': 'Ver en Profesionales',
    'health-centers': 'Ver en Centros de Salud',
    'guardias': 'Ver en Guardias',
    'analytics': 'Ver en Analíticas'
  };

  return [
    { type: 'navigate', tab, label: labelMap[tab] || 'Ver detalle', filters }
  ];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  let messages: any[] = [];
  let rawSql = '';

  try {
    const body = await req.json();
    if (!body || !Array.isArray(body.messages)) {
      return new Response(JSON.stringify({ error: "Cuerpo JSON inválido: se requiere 'messages'" }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
    messages = body.messages;
    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "El array 'messages' no debe estar vacío." }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const systemPrompt = buildEnhancedSystemPrompt();
    const conversationHistory = [{ role: 'system', content: systemPrompt }, ...messages];

    // 1) Generación de SQL con fallback
    let sqlText = '';
    try {
      sqlText = await openAIChat(conversationHistory);
    } catch (_) {
      const flatPrompt = `${systemPrompt}\n\nHISTORIAL:\n${messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}\n\nDevuelve SOLO una consulta SQL SELECT dentro de un bloque markdown etiquetado como sql. No añadas texto.`;
      sqlText = await geminiGenerateText(flatPrompt);
    }

    rawSql = sqlText || '';
    const cleanSql = extractSqlFromText(rawSql);

    if (!cleanSql || !cleanSql.toUpperCase().startsWith('SELECT')) {
      return new Response(JSON.stringify({ error: 'La IA no generó una sentencia SQL SELECT válida.' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // 2) Ejecutar SQL en Postgres
    const { data: result, error: queryError } = await supabase.rpc('exec_sql', { query: cleanSql });
    if (queryError) {
      return new Response(JSON.stringify({ error: `Error de ejecución SQL: ${queryError.message}` }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // 3) Resumen en lenguaje natural con fallback
    const userQuestion = messages[messages.length - 1].content;
    let naturalText = '';
    const nlPrompt = `Pregunta del usuario: "${userQuestion}"\nResultados:\n${JSON.stringify(result, null, 2)}\n\nRedacta una respuesta profesional, breve y clara en ESPAÑOL. No incluyas SQL ni JSON. Di que no hay datos si el resultado está vacío.`;
    try {
      naturalText = await openAIChat([{ role: 'user', content: nlPrompt }]);
    } catch (_) {
      naturalText = await geminiGenerateText(nlPrompt);
    }

    // 4) Acciones de navegación derivadas del SQL
    const navigationSuggestions = deriveNavigationSuggestions(cleanSql);

    // 5) Respuesta: incluimos SQL en la respuesta (el frontend decide si mostrarlo)
    return new Response(JSON.stringify({
      sql: cleanSql,
      result,
      natural_language_response: naturalText || 'No se pudo generar una respuesta en lenguaje natural.',
      navigationSuggestions
    }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });

  } catch (err: any) {
    console.error('AI Chat Master error:', err);
    return new Response(JSON.stringify({ error: `Error de servidor: ${err?.message || 'desconocido'}` }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});
