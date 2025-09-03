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

async function getGenderStats(supabase: any, filters: Record<string, any> = {}) {
  const f = { ...(filters || {}) } as any;
  if (f && typeof f === 'object' && 'genero' in f) delete f.genero;
  const { data, error } = await applyFilters(
    createClient(SUPABASE_URL, SERVICE_ROLE).from('profesionales_sanitarios').select('genero').not('genero','is', null),
    f
  );
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const r of data || []) {
    const g = String((r as any).genero || '').trim();
    if (!g) continue;
    counts[g] = (counts[g] || 0) + 1;
  }
  const total = Object.values(counts).reduce((s,c)=>s+c,0) || 0;
  return { total, por_genero: counts };
}

async function getSchemaOverview(supabase: any) {
  const sql = `select table_name, column_name, data_type from information_schema.columns where table_schema = 'public' order by table_name, ordinal_position`;
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) {
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

async function getAreaStats(supabase: any, filters: Record<string, any> = {}) {
  const { data, error } = await supabase
    .from('profesionales_sanitarios')
    .select('area_profesional, estado_solicitud')
    .not('area_profesional','is', null);
  if (error) throw error;
  const acc: Record<string, { total: number; aprobados: number; pendientes: number }> = {};
  for (const p of data || []) {
    const area = (p as any).area_profesional as string | null;
    if (!area) continue;
    if (!acc[area]) acc[area] = { total: 0, aprobados: 0, pendientes: 0 };
    acc[area].total++;
    if ((p as any).estado_solicitud === 'Aprobado') acc[area].aprobados++; else acc[area].pendientes++;
  }
  const total = Object.values(acc).reduce((s,v) => s + v.total, 0) || 1;
  return Object.entries(acc)
    .map(([area_profesional, v]) => ({ area_profesional, total: v.total, aprobados: v.aprobados, pendientes: v.pendientes, porcentaje: (v.total/total)*100 }))
    .sort((a,b) => b.total - a.total);
}

async function getDistrictStats(supabase: any) {
  const { data: profData, error: profErr } = await supabase
    .from('profesionales_sanitarios')
    .select('distrito_sanitario, area_profesional')
    .eq('estado_solicitud','Aprobado')
    .not('distrito_sanitario','is', null);
  if (profErr) throw profErr;
  const { data: centerData, error: centerErr } = await supabase
    .from('centros_salud')
    .select('distrito_sanitario')
    .not('distrito_sanitario','is', null);
  if (centerErr) throw centerErr;
  const profCount: Record<string, number> = {};
  for (const p of profData || []) {
    const d = (p as any).distrito_sanitario as string; if (!d) continue;
    profCount[d] = (profCount[d] || 0) + 1;
  }
  const centerCount: Record<string, number> = {};
  for (const c of centerData || []) {
    const d = (c as any).distrito_sanitario as string; if (!d) continue;
    centerCount[d] = (centerCount[d] || 0) + 1;
  }
  const districts = Array.from(new Set([ ...Object.keys(profCount), ...Object.keys(centerCount) ]));
  return districts.map(d => ({ distrito_sanitario: d, total_profesionales: profCount[d] || 0, total_centros: centerCount[d] || 0 }))
    .sort((a,b) => b.total_profesionales - a.total_profesionales);
}

async function getAgeStats(supabase: any) {
  const { data, error } = await supabase
    .from('profesionales_sanitarios')
    .select('edad')
    .eq('estado_solicitud','Aprobado')
    .not('edad','is', null);
  if (error) throw error;
  const buckets: Record<string, number> = {};
  const push = (label: string) => { buckets[label] = (buckets[label] || 0) + 1; };
  for (const r of data || []) {
    const e = (r as any).edad as number; if (e == null) continue;
    if (e < 25) push('< 25 años');
    else if (e < 35) push('25-34 años');
    else if (e < 45) push('35-44 años');
    else if (e < 55) push('45-54 años');
    else if (e < 65) push('55-64 años');
    else push('65+ años');
  }
  const total = Object.values(buckets).reduce((s,c)=>s+c,0) || 1;
  return Object.entries(buckets).map(([rango_edad, cantidad]) => ({ rango_edad, cantidad, porcentaje: (cantidad as number)/total*100 }))
    .sort((a,b) => {
      const order = ['< 25 años','25-34 años','35-44 años','45-54 años','55-64 años','65+ años'];
      return order.indexOf(a.rango_edad) - order.indexOf(b.rango_edad);
    });
}

async function getCountryStats(supabase: any) {
  const { data, error } = await supabase
    .from('profesionales_sanitarios')
    .select('pais_formacion_1, pais_formacion_2')
    .eq('estado_solicitud','Aprobado');
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const r of data || []) {
    const p1 = (r as any).pais_formacion_1; const p2 = (r as any).pais_formacion_2;
    if (p1 && String(p1).trim()) counts[p1] = (counts[p1] || 0) + 1;
    if (p2 && String(p2).trim()) counts[p2] = (counts[p2] || 0) + 1;
  }
  const total = Object.values(counts).reduce((s,c)=>s+c,0) || 1;
  return Object.entries(counts).map(([pais_formacion, cantidad]) => ({ pais_formacion, cantidad, porcentaje: (cantidad/total)*100 }))
    .sort((a,b) => b.cantidad - a.cantidad);
}

async function getInstitutionStats(supabase: any) {
  const { data, error } = await supabase
    .from('profesionales_sanitarios')
    .select('institucion_1, institucion_2, pais_formacion_1, pais_formacion_2')
    .eq('estado_solicitud','Aprobado');
  if (error) throw error;
  const map: Record<string, { cantidad: number; pais: string | null }> = {};
  for (const r of data || []) {
    const pairs = [
      { inst: (r as any).institucion_1, pais: (r as any).pais_formacion_1 },
      { inst: (r as any).institucion_2, pais: (r as any).pais_formacion_2 },
    ];
    for (const { inst, pais } of pairs) {
      if (inst && String(inst).trim()) {
        if (!map[inst]) map[inst] = { cantidad: 0, pais: pais || null };
        map[inst].cantidad++;
      }
    }
  }
  return Object.entries(map).map(([institucion, v]) => ({ institucion, cantidad: v.cantidad, pais: v.pais }))
    .sort((a,b) => b.cantidad - a.cantidad);
}

async function getCenterCategoryStats(supabase: any) {
  const { data: centers, error } = await supabase
    .from('centros_salud')
    .select('categoria, nombre, id');
  if (error) throw error;
  const groups: Record<string, { names: string[]; ids: string[] }> = {};
  for (const c of centers || []) {
    const cat = (c as any).categoria || 'SIN_CATEGORIA';
    if (!groups[cat]) groups[cat] = { names: [], ids: [] };
    groups[cat].names.push((c as any).nombre);
    groups[cat].ids.push((c as any).id);
  }
  const results = [] as { categoria: string; total_centros: number; total_profesionales: number; promedio_profesionales_por_centro: number }[];
  for (const [categoria, g] of Object.entries(groups)) {
    const namesList = g.names.map(n => `"${n}"`).join(',');
    const idsList = g.ids.map(id => `"${id}"`).join(',');
    const { count = 0 } = await supabase
      .from('profesionales_sanitarios')
      .select('id', { count: 'exact', head: true })
      .eq('estado_solicitud','Aprobado')
      .or(`nombre_centro.in.(${namesList}),centro_salud_id.in.(${idsList})`);
    const total_centros = g.names.length;
    results.push({ categoria, total_centros, total_profesionales: count || 0, promedio_profesionales_por_centro: (count || 0)/Math.max(1,total_centros) });
  }
  return results.sort((a,b)=> b.total_profesionales - a.total_profesionales);
}

async function getTitulacionStats(supabase: any) {
  const { data, error } = await supabase
    .from('profesionales_sanitarios')
    .select('categoria_titulacion, estado_solicitud')
    .not('categoria_titulacion','is', null);
  if (error) throw error;
  const map: Record<string, { total: number; aprobados: number; pendientes: number }> = {};
  for (const r of data || []) {
    const cat = (r as any).categoria_titulacion as string | null; if (!cat) continue;
    if (!map[cat]) map[cat] = { total: 0, aprobados: 0, pendientes: 0 };
    map[cat].total++;
    if ((r as any).estado_solicitud === 'Aprobado') map[cat].aprobados++; else map[cat].pendientes++;
  }
  const total = Object.values(map).reduce((s,v)=>s+v.total,0) || 1;
  return Object.entries(map).map(([categoria_titulacion, v]) => ({ categoria_titulacion, total: v.total, aprobados: v.aprobados, pendientes: v.pendientes, porcentaje: (v.total/total)*100 }))
    .sort((a,b) => b.total - a.total);
}

const tools = [
  { type: 'function', function: { name: 'get_summary_stats', description: 'Resumen global', parameters: { type: 'object', properties: { filters: { type: 'object' } } } } },
  { type: 'function', function: { name: 'get_professionals_count', description: 'Cuenta profesionales con filtros', parameters: { type: 'object', properties: { filters: { type: 'object' } } } } },
  { type: 'function', function: { name: 'get_professionals_by_center', description: 'Profesionales por centro', parameters: { type: 'object', properties: { nombre_centro: { type: 'string' }, centro_salud_id: { type: 'string' } } } } },
  { type: 'function', function: { name: 'get_centers_overview', description: 'Top centros por profesionales', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'get_timeseries_registrations', description: 'Serie temporal de registros', parameters: { type: 'object', properties: { months: { type: 'number' } } } } },
  { type: 'function', function: { name: 'get_schema_overview', description: 'Esquema de la base de datos', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'get_area_stats', description: 'Estadísticas por área profesional', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'get_district_stats', description: 'Estadísticas por distrito sanitario', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'get_age_stats', description: 'Distribución por rangos de edad', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'get_country_stats', description: 'Países de formación', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'get_institution_stats', description: 'Instituciones de formación', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'get_center_category_stats', description: 'Categorías de centros', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'get_titulacion_stats', description: 'Categorías de titulación', parameters: { type: 'object', properties: {} } } },
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
        case 'get_area_stats':
          return await getAreaStats(supabase);
        case 'get_district_stats':
          return await getDistrictStats(supabase);
        case 'get_age_stats':
          return await getAgeStats(supabase);
        case 'get_country_stats':
          return await getCountryStats(supabase);
        case 'get_institution_stats':
          return await getInstitutionStats(supabase);
        case 'get_center_category_stats':
          return await getCenterCategoryStats(supabase);
        case 'get_titulacion_stats':
          return await getTitulacionStats(supabase);
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
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: loopMessages, tools, tool_choice: 'auto', temperature: 0.2, max_tokens: 1200 })
      });
      const body = await resp.json();
      const choice = body?.choices?.[0]?.message;
      const toolCalls: ToolCall[] = choice?.tool_calls || [];
      if (toolCalls.length === 0) {
        answerText = choice?.content || '';
        break;
      }
      // Append assistant tool call message, then execute tools and append results
      loopMessages = [...loopMessages, { role: 'assistant', content: choice?.content || '', tool_calls: toolCalls } as any];
      for (const call of toolCalls) {
        let parsedArgs: any = {};
        try { parsedArgs = call.function.arguments ? JSON.parse(call.function.arguments) : {}; } catch { parsedArgs = {}; }
        const result = await executeTool(call.function.name, parsedArgs);
        toolResults[call.function.name] = result;
        loopMessages = [...loopMessages, { role: 'tool', tool_call_id: call.id, name: call.function.name, content: JSON.stringify(result) } as any];
      }
    }

    if (!answerText) {
      // Finalize with results included; force a concise Spanish answer using gathered data
      const toolJson = JSON.stringify(toolResults);
      const finalResp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.2,
          messages: [
            { role: 'system', content: 'Eres un asistente que responde en español con cifras exactas, breve y claro.' },
            ...loopMessages,
            { role: 'user', content: `Con base en estos resultados JSON de herramientas, responde en 2-3 frases máximo, con números y contexto: ${toolJson}` }
          ]
        })
      });
      const finalBody = await finalResp.json();
      answerText = (finalBody?.choices?.[0]?.message?.content || '').trim();
      if (!answerText) {
        // Deterministic textual summary from toolResults as last resort
        try {
          const summary = toolResults['get_summary_stats'] as any;
          if (summary && typeof summary === 'object') {
            const t = summary as { totalProfessionals?: number; totalApproved?: number; totalCenters?: number; incidentsOpen?: number; totalIncidents?: number };
            const parts: string[] = [];
            if (typeof t.totalProfessionals === 'number') parts.push(`Profesionales totales: ${t.totalProfessionals}.`);
            if (typeof t.totalApproved === 'number') parts.push(`Aprobados: ${t.totalApproved}.`);
            if (typeof t.totalCenters === 'number') parts.push(`Centros: ${t.totalCenters}.`);
            if (typeof t.totalIncidents === 'number') parts.push(`Incidencias: ${t.incidentsOpen ?? 0}/${t.totalIncidents} abiertas/total.`);
            answerText = parts.length ? parts.join(' ') : 'Resultados obtenidos.';
          } else {
            answerText = 'Resultados obtenidos.';
          }
        } catch (_) {
          answerText = 'Resultados obtenidos.';
        }
      }
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
