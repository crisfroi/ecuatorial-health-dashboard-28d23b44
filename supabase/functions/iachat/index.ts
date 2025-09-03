import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function applyFilters(q: any, f: Record<string, any>) {
  let qb = q;
  if (!f) return qb;
  if (f.area_profesional) qb = qb.eq("area_profesional", f.area_profesional);
  if (f.estado_solicitud) qb = qb.eq("estado_solicitud", f.estado_solicitud);
  if (f.provincia) qb = qb.eq("provincia", f.provincia);
  if (f.genero) qb = qb.eq("genero", f.genero);
  if (f.distrito || f.distrito_sanitario) qb = qb.eq("distrito_sanitario", f.distrito || f.distrito_sanitario);
  if (f.tipo_sector) qb = qb.eq("tipo_sector", f.tipo_sector);
  if (typeof f.anoGraduacion === "number") qb = qb.eq("año_graduacion", f.anoGraduacion);
  if (f.pais_formacion) qb = qb.or(`pais_formacion_1.ilike.%${f.pais_formacion}%,pais_formacion_2.ilike.%${f.pais_formacion}%`);
  if (f.institucion) qb = qb.or(`institucion_1.ilike.%${f.institucion}%,institucion_2.ilike.%${f.institucion}%`);
  if (f.vencimiento_proximo === true) {
    const now = new Date();
    const limit = new Date();
    limit.setDate(now.getDate() + 60);
    qb = qb.eq('estado_solicitud', 'Aprobado').gte('fecha_caducidad', now.toISOString()).lte('fecha_caducidad', limit.toISOString());
  }
  if (f.carnet_vencido === true) {
    const nowIso = new Date().toISOString();
    qb = qb.eq('estado_solicitud', 'Aprobado').lte('fecha_caducidad', nowIso);
  }
  return qb;
}

async function getSummaryStats(supabase: any, filters: Record<string, any> = {}) {
  let qb = applyFilters(supabase.from('profesionales_sanitarios').select('id', { count: 'exact', head: true }), filters);
  const { count: totalProfessionals = 0 } = await qb;
  const { count: totalApproved = 0 } = await applyFilters(supabase.from('profesionales_sanitarios').select('id', { count: 'exact', head: true }).eq('estado_solicitud', 'Aprobado'), filters);
  const { data: centers } = await supabase.from('centros_salud').select('id');
  const { data: incidents } = await supabase.from('incidencias_hospitalarias').select('id, estado');
  const incidentsOpen = (incidents || []).filter((i: any) => i.estado === 'Abierta' || i.estado === 'En Progreso').length;
  return {
    totalProfessionals: totalProfessionals || 0,
    totalApproved: totalApproved || 0,
    totalCenters: centers?.length || 0,
    totalIncidents: incidents?.length || 0,
    incidentsOpen,
  };
}

async function getProfessionalsCount(supabase: any, filters: Record<string, any> = {}) {
  let qb = applyFilters(supabase.from('profesionales_sanitarios').select('id', { count: 'exact', head: true }), filters);
  const { count = 0 } = await qb;
  return { count: count || 0 };
}

async function getProfessionalsByCenter(supabase: any, args: { nombre_centro?: string; centro_salud_id?: string }) {
  const { nombre_centro, centro_salud_id } = args || {} as any;
  let qb = supabase.from('profesionales_sanitarios').select('id', { count: 'exact', head: true }).eq('estado_solicitud', 'Aprobado');
  if (nombre_centro && centro_salud_id) qb = qb.or(`nombre_centro.eq.${nombre_centro},centro_salud_id.eq.${centro_salud_id}`);
  else if (nombre_centro) qb = qb.eq('nombre_centro', nombre_centro);
  else if (centro_salud_id) qb = qb.eq('centro_salud_id', centro_salud_id);
  const { count = 0 } = await qb;
  return { total_profesionales: count || 0 };
}

async function getCentersOverview(supabase: any) {
  const { data: centers, error } = await supabase
    .from('centros_salud')
    .select('id, nombre, categoria, provincia, distrito_sanitario, sector')
    .order('nombre');
  if (error) throw error;
  const counts = await Promise.all((centers || []).map(async (c: any) => {
    const { count = 0 } = await supabase
      .from('profesionales_sanitarios')
      .select('id', { count: 'exact', head: true })
      .eq('estado_solicitud', 'Aprobado')
      .or(`nombre_centro.eq.${c.nombre},centro_salud_id.eq.${c.id}`);
    return { ...c, total_profesionales: count || 0 };
  }));
  return counts.sort((a, b) => b.total_profesionales - a.total_profesionales).slice(0, 20);
}

async function getTimeseriesRegistrations(supabase: any, args: { months?: number } = {}) {
  const months = args.months && args.months > 0 ? args.months : 12;
  const since = new Date(); since.setMonth(since.getMonth() - months);
  const { data, error } = await supabase
    .from('profesionales_sanitarios')
    .select('fecha_solicitud')
    .gte('fecha_solicitud', since.toISOString());
  if (error) throw error;
  const buckets: Record<string, number> = {};
  for (const row of data || []) {
    const d = row.fecha_solicitud ? new Date(row.fecha_solicitud) : null;
    if (!d) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    buckets[key] = (buckets[key] || 0) + 1;
  }
  return Object.entries(buckets).sort(([a],[b]) => a.localeCompare(b)).map(([period, cantidad]) => ({ period, cantidad }));
}

async function getSchemaOverview(supabase: any) {
  const sql = `select table_name, column_name, data_type from information_schema.columns where table_schema = 'public' order by table_name, ordinal_position`;
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) {
    // Fallback: fetch known tables with client selects if rpc not available
    const tables = ['profesionales_sanitarios','centros_salud','incidencias_hospitalarias','carnets_generados'];
    const schema: Record<string, string[]> = {};
    for (const t of tables) {
      const { data: rows } = await supabase.from(t).select('*').limit(1);
      schema[t] = rows && rows.length ? Object.keys(rows[0]) : [];
    }
    return { schema, note: 'RPC exec_sql no disponible; esquema parcial por introspección' };
  }
  const grouped: Record<string, { table: string; columns: { name: string; type: string }[] }> = {} as any;
  for (const r of data || []) {
    if (!grouped[r.table_name]) grouped[r.table_name] = { table: r.table_name, columns: [] };
    grouped[r.table_name].columns.push({ name: r.column_name, type: r.data_type });
  }
  return { schema: Object.values(grouped) };
}

const tools = [
  {
    type: 'function',
    function: {
      name: 'get_summary_stats',
      description: 'Devuelve resumen global: totales de profesionales, aprobados, centros e incidencias',
      parameters: { type: 'object', properties: { filters: { type: 'object' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_professionals_count',
      description: 'Cuenta profesionales con filtros (área, provincia, género, estado, etc.)',
      parameters: { type: 'object', properties: { filters: { type: 'object' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_professionals_by_center',
      description: 'Cuenta profesionales por centro indicado por nombre o id',
      parameters: { type: 'object', properties: { nombre_centro: { type: 'string' }, centro_salud_id: { type: 'string' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_centers_overview',
      description: 'Lista top centros con total de profesionales asignados',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_timeseries_registrations',
      description: 'Registros por mes en los últimos N meses',
      parameters: { type: 'object', properties: { months: { type: 'number' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_schema_overview',
      description: 'Obtiene descripción de tablas y columnas del esquema público',
      parameters: { type: 'object', properties: {} },
    },
  },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY no configurada');
    if (!SUPABASE_URL || !SERVICE_ROLE) throw new Error('SUPABASE_URL o SERVICE_ROLE faltante');

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { messages = [], filters = {} } = await req.json();

    const systemPrompt = `Eres un asistente de IA para el Ministerio de Sanidad de Guinea Ecuatorial.
Dispones de funciones para consultar la base de datos (con acceso completo) y debes usarlas antes de responder.
Responde SIEMPRE en español, de forma breve, clara y con cifras exactas cuando sea posible.
Cuando uses datos, aclara cómo se filtraron si es relevante.`;

    type ToolCall = { id: string; function: { name: string; arguments: string } };

    const executeTool = async (name: string, args: any) => {
      switch (name) {
        case 'get_summary_stats':
          return await getSummaryStats(supabase, args?.filters || {});
        case 'get_professionals_count':
          return await getProfessionalsCount(supabase, args?.filters || {});
        case 'get_professionals_by_center':
          return await getProfessionalsByCenter(supabase, args || {});
        case 'get_centers_overview':
          return await getCentersOverview(supabase);
        case 'get_timeseries_registrations':
          return await getTimeseriesRegistrations(supabase, args || {});
        case 'get_schema_overview':
          return await getSchemaOverview(supabase);
        default:
          return { error: `Herramienta desconocida: ${name}` };
      }
    };

    // Start tool-use loop
    const baseMessages = [{ role: 'system', content: systemPrompt }, ...messages, { role: 'user', content: `Filtros activos: ${JSON.stringify(filters)}` }];

    let loopMessages = baseMessages;
    let answerText = '';
    let toolResults: Record<string, unknown> = {};

    for (let step = 0; step < 4; step++) {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: loopMessages, tools, temperature: 0.2, max_tokens: 1200 })
      });
      const body = await resp.json();
      const choice = body?.choices?.[0]?.message;
      const toolCalls: ToolCall[] = choice?.tool_calls || [];
      if (toolCalls.length === 0) {
        answerText = choice?.content || '';
        break;
      }
      // Execute all tool calls and append
      for (const call of toolCalls) {
        let parsedArgs: any = {};
        try { parsedArgs = call.function.arguments ? JSON.parse(call.function.arguments) : {}; } catch { parsedArgs = {}; }
        const result = await executeTool(call.function.name, parsedArgs);
        toolResults[call.function.name] = result;
        loopMessages = [...loopMessages, { role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) } as any];
      }
    }

    if (!answerText) {
      // Finalize with results included
      const finalResp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0.2, messages: [...loopMessages, { role: 'user', content: 'Resume los resultados anteriores de forma breve, concreta y con números.' }] })
      });
      const finalBody = await finalResp.json();
      answerText = finalBody?.choices?.[0]?.message?.content || 'He obtenido los datos solicitados.';
    }

    // Basic navigation suggestions by intent keywords
    const lastUser = messages.filter((m: any) => m.role === 'user').slice(-1)[0]?.content?.toLowerCase() || '';
    const navigationSuggestions: { type: 'navigate'; tab: string; label: string; filters?: Record<string, any> }[] = [];
    if (lastUser.includes('centro') || lastUser.includes('hospital')) navigationSuggestions.push({ type: 'navigate', tab: 'health-centers', label: 'Ver Centros' });
    if (lastUser.includes('profesional') || lastUser.includes('área') || lastUser.includes('enfermer') || lastUser.includes('médic')) navigationSuggestions.push({ type: 'navigate', tab: 'professionals', label: 'Ver Profesionales', filters });
    if (lastUser.includes('renov') || lastUser.includes('vencim') || lastUser.includes('carnet')) navigationSuggestions.push({ type: 'navigate', tab: 'renewals', label: 'Ver Renovaciones' });
    if (lastUser.includes('distrito') || lastUser.includes('tendenc') || lastUser.includes('serie')) navigationSuggestions.push({ type: 'navigate', tab: 'analytics', label: 'Ver Analíticas' });

    const diagnostics = { hasServiceRole: !!SERVICE_ROLE, hasOpenAI: !!OPENAI_API_KEY, notes: 'Orquestador con tool-calling activo' };

    return new Response(JSON.stringify({ answer: answerText, toolResults, navigationSuggestions, diagnostics }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
