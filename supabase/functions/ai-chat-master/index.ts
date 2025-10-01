// supabase/functions/ai-chat-master/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- 1. CONFIGURACIÓN Y VARIABLES DE ENTORNO ---
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY"); // Nueva variable

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// --- 2. ESQUEMA DETALLADO (De la primera función) ---
const ENHANCED_SCHEMA = {
  domain: "Sistema de Salud de Guinea Ecuatorial",
  context: "Gestión de profesionales sanitarios, centros de salud, guardias médicas y acreditaciones",

  tables: {
    profesionales_sanitarios: {
      description: "Profesionales de la salud registrados en el sistema",
      purpose: "Gestión de acreditaciones y seguimiento de profesionales",
      mainColumns: {
        id: { type: "uuid", description: "Identificador único" },
        nombre_completo: { type: "text", description: "Nombre completo del profesional", indexed: true },
        area_profesional: { type: "text", description: "Especialidad médica (Medicina, Enfermería, etc.)", indexed: true },
        estado_solicitud: { type: "varchar", description: "Estado de acreditación: Recibido, Aprobado, Rechazado, Pendiente de Firma", indexed: true },
        funcion_publica: { type: "boolean", description: "Si pertenece a la función pública", indexed: true },
        estatus_funcionario: { type: "text", description: "Nombrado o no_nombrado (para función pública)" },
        nacionalidad: { type: "text", description: "Nacionalidad del profesional", indexed: true },
        provincia: { type: "text", description: "Provincia de trabajo", indexed: true },
        distrito_sanitario: { type: "text", description: "Distrito sanitario asignado", indexed: true },
        edad: { type: "integer", description: "Edad del profesional" },
        genero: { type: "text", description: "Género: Masculino/Femenino" },
        pais_formacion_1: { type: "text", description: "País donde obtuvo su primera titulación", indexed: true },
        pais_formacion_2: { type: "text", description: "País donde obtuvo su segunda titulación" },
        institucion_1: { type: "text", description: "Institución de primera formación", indexed: true },
        institucion_2: { type: "text", description: "Institución de segunda formación" },
        año_graduacion: { type: "integer", description: "Año de graduación", indexed: true },
        fecha_caducidad: { type: "date", description: "Fecha de vencimiento del carnet" },
        id_profesional_unico: { type: "text", description: "Código único de carnet profesional" }
      },
      relations: [
        { to: "centros_salud", via: "centro_salud_id", description: "Centro donde trabaja" },
        { to: "instituciones_formacion", via: "institucion_formacion_id_1", description: "Institución educativa" }
      ],
      commonQueries: [
        "Profesionales por área profesional", "Profesionales con carnets próximos a vencer (30 días)",
        "Funcionarios públicos nombrados vs no nombrados", "Profesionales por país de formación",
        "Distribución por género y edad"
      ]
    },

    centros_salud: {
      description: "Centros de salud y hospitales",
      purpose: "Gestión de infraestructura sanitaria",
      mainColumns: {
        id: { type: "uuid", description: "Identificador único" },
        nombre: { type: "text", description: "Nombre del centro", indexed: true },
        categoria: { type: "text", description: "Hospital, Clínica, Centro de Salud, etc.", indexed: true },
        sector: { type: "text", description: "Público, Privado, Mixto", indexed: true },
        provincia: { type: "text", description: "Provincia", indexed: true },
        distrito_sanitario: { type: "text", description: "Distrito sanitario", indexed: true },
        estado: { type: "text", description: "Activo/Inactivo" }
      },
      relations: [
        { from: "profesionales_sanitarios", via: "centro_salud_id", description: "Profesionales asignados" },
        { from: "guardias", via: "centro_salud_id", description: "Guardias programadas" }
      ],
      commonQueries: [
        "Centros por categoría y sector", "Centros con mayor número de profesionales",
        "Distribución geográfica de centros"
      ]
    },

    guardias: {
      description: "Turnos de guardia médica",
      purpose: "Gestión de guardias y turnos hospitalarios",
      mainColumns: {
        id: { type: "uuid", description: "Identificador único" },
        profesional_guardia_id: { type: "uuid", description: "Profesional asignado" },
        centro_salud_id: { type: "uuid", description: "Centro donde se realiza" },
        fecha_inicio: { type: "timestamp", description: "Inicio del turno" },
        fecha_fin: { type: "timestamp", description: "Fin del turno" },
        tipo: { type: "enum", description: "fisica, administrativa, localizable" },
        tipo_dia: { type: "enum", description: "ordinario, fin_semana, festivo" },
        estado: { type: "enum", description: "planificada, confirmada, completada, cancelada" }
      },
      relations: [
        { to: "profesionales_guardias", via: "profesional_guardia_id", description: "Profesional" },
        { to: "centros_salud", via: "centro_salud_id", description: "Centro" },
        { to: "nominas_guardias", via: "nomina_id", description: "Nómina asociada" }
      ]
    },

    nominas_guardias: {
      description: "Nóminas de pago por guardias",
      purpose: "Gestión financiera de guardias",
      mainColumns: {
        id: { type: "uuid", description: "Identificador único" },
        mes: { type: "integer", description: "Mes de la nómina" },
        anio: { type: "integer", description: "Año de la nómina" },
        centro_salud_id: { type: "uuid", description: "Centro" },
        total_importe: { type: "numeric", description: "Total a pagar" },
        estado: { type: "text", description: "borrador, aprobada, pagada" }
      },
      relations: [
        { to: "centros_salud", via: "centro_salud_id" },
        { from: "nominas_guardias_lineas", description: "Líneas de detalle" }
      ]
    },

    instituciones_formacion: {
      description: "Instituciones educativas de formación médica",
      purpose: "Registro de universidades y centros de formación",
      mainColumns: {
        id: { type: "uuid", description: "Identificador único" },
        nombre: { type: "text", description: "Nombre de la institución", indexed: true },
        pais: { type: "text", description: "País de ubicación", indexed: true },
        categoria: { type: "text", description: "Tipo de institución" }
      },
      relations: [
        { from: "profesionales_sanitarios", via: "institucion_formacion_id_1" }
      ]
    },

    carnets_generados: {
      description: "Carnets profesionales generados",
      purpose: "Seguimiento de emisión de carnets",
      mainColumns: {
        id: { type: "uuid", description: "Identificador único" },
        profesional_id: { type: "uuid", description: "Profesional asociado" },
        url_carnet: { type: "text", description: "URL del carnet PDF" },
        fecha_generacion: { type: "timestamp", description: "Fecha de creación" }
      }
    },

    categorias_titulacion: {
      description: "Categorías de títulos profesionales",
      mainColumns: {
        nombre: { type: "text", description: "Nombre de la categoría" },
        codigo_color: { type: "text", description: "Color distintivo" }
      }
    },

    distrito_sanitario: {
      description: "Distritos sanitarios administrativos",
      mainColumns: {
        nombre_distrito: { type: "text", description: "Nombre del distrito" },
        nombre_provincia: { type: "text", description: "Provincia" }
      }
    }
  },

  semanticMappings: {
    professions: ["Medicina", "Enfermería", "Farmacia", "Laboratorio", "Odontología"],
    statuses: ["Recibido", "Aprobado", "Rechazado", "Pendiente de Firma", "En Revisión"],
    publicFunctionStatuses: ["nombrado", "no_nombrado"],
    provinces: ["Bioko Norte", "Bioko Sur", "Litoral", "Wele-Nzas", "Centro Sur", "Kié-Ntem", "Annobón"],
    sectors: ["Público", "Privado", "Mixto"],
    guardTypes: ["fisica", "administrativa", "localizable"]
  },

  intelligentJoins: {
    "profesionales con centros": "SELECT p.*, c.nombre as centro_nombre, c.categoria as centro_categoria FROM profesionales_sanitarios p LEFT JOIN centros_salud c ON p.centro_salud_id = c.id",
    "profesionales con formación": "SELECT p.*, i.nombre as institucion_nombre, i.pais as pais_institucion FROM profesionales_sanitarios p LEFT JOIN instituciones_formacion i ON p.institucion_formacion_id_1 = i.id",
    "guardias con profesionales": "SELECT g.*, pg.categoria, ps.nombre_completo, c.nombre as centro_nombre FROM guardias g LEFT JOIN profesionales_guardias pg ON g.profesional_guardia_id = pg.id LEFT JOIN profesionales_sanitarios ps ON pg.profesional_id = ps.id LEFT JOIN centros_salud c ON g.centro_salud_id = c.id"
  }
};

// --- 3. PROMPT DEL SISTEMA (Basado en el esquema detallado) ---
function buildEnhancedSystemPrompt(): string {
  return `Eres un asistente SQL experto especializado en el Sistema de Salud de Guinea Ecuatorial con memoria conversacional avanzada.

CONTEXTO DEL DOMINIO:
${JSON.stringify(ENHANCED_SCHEMA, null, 2)}

REGLAS ESTRICTAS:
1. Devuelves ÚNICAMENTE la sentencia SQL en un bloque de código markdown (Ej: \`\`\`sql SELECT ... \`\`\`)
2. NUNCA incluyas explicaciones, texto adicional o bloques que no sean SQL
3. Utiliza EXCLUSIVAMENTE las tablas y columnas del schema proporcionado
4. Aprovecha las relaciones entre tablas para hacer JOINs inteligentes
5. Usa índices (columnas marcadas como indexed: true) en WHERE y JOIN para mejor performance

CAPACIDADES INTELIGENTES:
- Comprendes las relaciones y JOINs inteligentes.
- Reconoces sinónimos y variaciones de términos.
- **Asegura búsquedas de texto insensibles a mayúsculas y acentos: utiliza ILIKE en lugar de LIKE.**
`;
}

// --- 4. FUNCIONES MODULARES (De la segunda función) ---

async function geminiGenerateText(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY ausente');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  // Modificamos el payload para adaptarse al nuevo modelo y la instrucción de solo SQL
  const systemInstruction = `Eres un asistente SQL experto. Tu única tarea es generar la sentencia SQL. Sigue estrictamente el contexto proporcionado. NUNCA incluyas explicaciones.`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0,
        maxOutputTokens: 500
      }
    })
  });
  if (!resp.ok) throw new Error(`Gemini error ${resp.status}: ${await resp.text()}`);
  const json = await resp.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return text;
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

function extractSqlFromText(text: string): string {
  const match = text.match(/```(?:sql|SQL)?\s*([\s\S]*?)\s*```/);
  const raw = match ? match[1] : text;
  const trimmed = raw.trim();
  let cleanSql = trimmed.endsWith(';') ? trimmed.slice(0, -1) : trimmed;

  // Forzar insensibilidad a mayúsculas en patrones LIKE -> ILIKE (Fortaleza de la segunda función)
  cleanSql = cleanSql.replace(/\blike\b/gi, 'ILIKE');

  return cleanSql;
}

// Lógica de navegación inteligente (Fortaleza de la segunda función)
function deriveNavigationSuggestions(sql: string) {
  const s = sql || '';
  const filters: Record<string, any> = {};
  const get = (r: RegExp) => (s.match(r)?.[1] || '').trim();

  // Extracción de filtros
  const provincia = get(/provincia\s*(?:=|ILIKE)\s*'([^%']+)'/i);
  const distrito_sanitario = get(/distrito_sanitario\s*(?:=|ILIKE)\s*'([^%']+)'/i);
  const area_profesional = get(/area_profesional\s*(?:=|ILIKE)\s*'([^%']+)'/i);
  const genero = get(/genero\s*(?:=|ILIKE)\s*'([^%']+)'/i);
  const edadMin = get(/edad\s*>?=\s*(\d+)/i);
  const edadMax = get(/edad\s*<?=\s*(\d+)/i);

  if (provincia) filters.provincia = provincia;
  if (distrito_sanitario) filters.distrito_sanitario = distrito_sanitario;
  if (area_profesional) filters.area_profesional = area_profesional;
  if (genero) filters.genero = genero;
  if (edadMin) filters.edad_minima = Number(edadMin);
  if (edadMax) filters.edad_maxima = Number(edadMax);

  // Derivación de la pestaña de navegación
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


// --- 5. MANEJADOR PRINCIPAL CON LÓGICA DE FALLBACK ---
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  let messages: any[] = [];
  let rawSql = '';
  let cleanSql = '';

  try {
    const body = await req.json();
    if (!body || !Array.isArray(body.messages)) {
      return new Response(JSON.stringify({ error: "Cuerpo JSON inválido: se requiere 'messages'" }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
    messages = body.messages;

    const systemPrompt = buildEnhancedSystemPrompt();
    const conversationHistory = [{ role: 'system', content: systemPrompt }, ...messages];

    // Convertimos la conversación en un prompt plano para Gemini
    const geminiPrompt = `${systemPrompt}\n\nHISTORIAL DE CONVERSACIÓN:\n${messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}\n\nGenera la consulta SQL solicitada.`;

    // 1) Generación de SQL: **Gemini Primero, OpenAI como Fallback**
    let sqlText = '';
    let usedModel = 'Gemini';
    try {
      sqlText = await geminiGenerateText(geminiPrompt);
    } catch (geminiError) {
      console.warn("Falló Gemini, usando OpenAI como fallback:", geminiError);
      usedModel = 'OpenAI';
      sqlText = await openAIChat(conversationHistory);
    }

    rawSql = sqlText || '';
    cleanSql = extractSqlFromText(rawSql);

    if (!cleanSql || !cleanSql.toUpperCase().startsWith('SELECT')) {
      return new Response(JSON.stringify({ error: `La IA (${usedModel}) no generó una sentencia SQL SELECT válida.`, debug_raw_response: rawSql }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // 2) Ejecutar SQL en Postgres
    const { data: result, error: queryError } = await supabase.rpc('exec_sql', { query: cleanSql });
    if (queryError) {
      return new Response(JSON.stringify({ error: `Error de ejecución SQL: ${queryError.message}`, debug_sql_executed: cleanSql }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // 3) Resumen en lenguaje natural: **Gemini Primero, OpenAI como Fallback**
    const userQuestion = messages[messages.length - 1].content;
    let naturalText = '';
    const nlPrompt = `Pregunta del usuario: "${userQuestion}"\nResultados:\n${JSON.stringify(result, null, 2)}\n\nRedacta una respuesta profesional, breve y clara en ESPAÑOL. No incluyas SQL ni JSON. Di que no hay datos si el resultado está vacío.`;

    usedModel = 'Gemini (NL)';
    try {
      naturalText = await geminiGenerateText(nlPrompt);
    } catch (nlGeminiError) {
      console.warn("Falló Gemini NL, usando OpenAI NL como fallback:", nlGeminiError);
      usedModel = 'OpenAI (NL)';
      // Para OpenAI, lo mejor es usar el formato de mensajes
      naturalText = await openAIChat([{ role: 'user', content: nlPrompt }]);
    }

    // 4) Acciones de navegación derivadas del SQL
    const navigationSuggestions = deriveNavigationSuggestions(cleanSql);

    // 5) Respuesta Final
    return new Response(JSON.stringify({
      sql: cleanSql,
      result,
      natural_language_response: naturalText || 'No se pudo generar una respuesta en lenguaje natural.',
      navigationSuggestions,
      debug_model_used: usedModel,
    }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });

  } catch (err: any) {
    console.error('❌ Edge Function Error:', err);
    return new Response(JSON.stringify({ error: `Error de servidor: ${err?.message || 'desconocido'}`, stack: err.stack }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});