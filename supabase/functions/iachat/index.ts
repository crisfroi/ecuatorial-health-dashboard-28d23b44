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
  if (f.area_profesional_like) qb = qb.ilike("area_profesional", `%${f.area_profesional_like}%`);
  if (f.especialidad) qb = qb.eq("especialidad", f.especialidad);
  if (f.especialidad_like) qb = qb.ilike("especialidad", `%${f.especialidad_like}%`);
  if (f.estado_solicitud) qb = qb.eq("estado_solicitud", f.estado_solicitud);
  if (f.estado) qb = qb.eq("estado_solicitud", f.estado);
  if (f.estado_trabajo) qb = qb.eq("estado_trabajo", f.estado_trabajo);
  if (f.funcion_publica !== undefined) qb = qb.eq("funcion_publica", !!f.funcion_publica);
  if (f.provincia) qb = qb.eq("provincia", f.provincia);
  if (f.genero) qb = qb.eq("genero", f.genero);
  if (f.genero_like) qb = qb.ilike("genero", `%${f.genero_like}%`);
  if (f.nacionalidad) qb = qb.eq("nacionalidad", f.nacionalidad);
  if (f.distrito || f.distrito_sanitario) {
    const val = f.distrito || f.distrito_sanitario;
    qb = qb.or(`distrito_sanitario.eq.${val},distrito.eq.${val}`);
  }
  if (f.distrito_like || f.distrito_sanitario_like) {
    const val = f.distrito_like || f.distrito_sanitario_like;
    qb = qb.or(`distrito_sanitario.ilike.%${val}%,distrito.ilike.%${val}%`);
  }
  if (f.tipo_sector) qb = qb.eq("tipo_sector", f.tipo_sector);
  if (f.categoria_centro) qb = qb.eq("categoria_centro", f.categoria_centro);
  if (f.categoria_titulacion) qb = qb.eq("categoria_titulacion", f.categoria_titulacion);
  if (f.centro_salud_id) qb = qb.eq("centro_salud_id", f.centro_salud_id);
  if (f.nombre_centro) qb = qb.eq("nombre_centro", f.nombre_centro);
  if (f.nombre_centro_like) qb = qb.ilike("nombre_centro", `%${f.nombre_centro_like}%`);
  if (f.nombre_completo) qb = qb.ilike("nombre_completo", `%${f.nombre_completo}%`);
  if (typeof f.edad_min === 'number') qb = qb.gte('edad', f.edad_min);
  if (typeof f.edad_max === 'number') qb = qb.lte('edad', f.edad_max);
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
  if (typeof f.limit === 'number') qb = qb.limit(Math.max(1, Math.min(1000, f.limit)));
  if (typeof f.offset === 'number') qb = qb.range(f.offset, (f.offset || 0) + (f.limit || 50) - 1);
  return qb;
}

function applyCenterFilters(q: any, f: Record<string, any>) {
  let qb = q;
  if (!f) return qb;
  if (f.nombre) qb = qb.ilike('nombre', `%${f.nombre}%`);
  if (f.categoria) qb = qb.eq('categoria', f.categoria);
  if (f.provincia) qb = qb.eq('provincia', f.provincia);
  if (f.distrito_sanitario || f.distrito) qb = qb.eq('distrito_sanitario', f.distrito_sanitario || f.distrito);
  if (f.distrito_like || f.distrito_sanitario_like) qb = qb.ilike('distrito_sanitario', `%${f.distrito_like || f.distrito_sanitario_like}%`);
  if (f.sector || f.tipo_sector) qb = qb.eq('sector', f.sector || f.tipo_sector);
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

async function getProfessionalsList(supabase: any, args: { filters?: Record<string, any>; limit?: number; aprobadosOnly?: boolean }) {
  const { filters = {}, limit = 50, aprobadosOnly = false } = args || {} as any;
  let qb = supabase
    .from('profesionales_sanitarios')
    .select('id, nombre_completo, area_profesional, especialidad, estado_solicitud, nombre_centro, centro_salud_id')
    .order('nombre_completo');
  if (aprobadosOnly) {
    qb = qb.eq('estado_solicitud', 'Aprobado');
  }
  qb = applyFilters(qb, { ...filters, limit });
  const { data, error } = await qb;
  if (error) throw error;
  return { total: data?.length || 0, profesionales: data || [] };
}

async function getCentersCount(supabase: any, filters: Record<string, any> = {}) {
  let qb = applyCenterFilters(supabase.from('centros_salud').select('id', { count: 'exact', head: true }), filters);
  const { count = 0 } = await qb;
  return { count: count || 0 };
}

async function getCentersList(supabase: any, args: { filters?: Record<string, any>; limit?: number }) {
  const { filters = {}, limit = 50 } = args || {} as any;
  let qb = applyCenterFilters(
    supabase.from('centros_salud').select('id, nombre, categoria, provincia, distrito_sanitario, sector').order('nombre'),
    filters
  );
  qb = qb.limit(Math.max(1, Math.min(200, limit)));
  const { data, error } = await qb;
  if (error) throw error;
  return { total: data?.length || 0, centros: data || [] };
}

async function getCentersOverview(supabase: any, filters: Record<string, any> = {}) {
  let centersQb = supabase
    .from('centros_salud')
    .select('id, nombre, categoria, provincia, distrito_sanitario, sector')
    .order('nombre');
  centersQb = applyCenterFilters(centersQb, filters || {});
  const { data: centers, error } = await centersQb;
  if (error) throw error;
  const counts = await Promise.all((centers || []).map(async (c: any) => {
    let profQb = supabase
      .from('profesionales_sanitarios')
      .select('id', { count: 'exact', head: true });
    profQb = applyFilters(profQb, filters || {});
    if (!('estado_solicitud' in (filters || {}))) {
      profQb = profQb.eq('estado_solicitud', 'Aprobado');
    }
    profQb = profQb.or(`nombre_centro.eq.${c.nombre},centro_salud_id.eq.${c.id}`);
    const { count = 0 } = await profQb;
    return { ...c, total_profesionales: count || 0 };
  }));
  return counts.sort((a, b) => b.total_profesionales - a.total_profesionales).slice(0, 20);
}

async function getTimeseriesRegistrations(supabase: any, args: { months?: number; filters?: Record<string, any> } = {}) {
  const months = args.months && args.months > 0 ? args.months : 12;
  const since = new Date(); since.setMonth(since.getMonth() - months);
  let qb = supabase
    .from('profesionales_sanitarios')
    .select('fecha_solicitud')
    .gte('fecha_solicitud', since.toISOString());
  if (args?.filters) qb = applyFilters(qb, args.filters);
  const { data, error } = await qb;
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
  let qb = supabase.from('profesionales_sanitarios');
  qb = applyFilters(qb, f);
  qb = qb.select('genero').not('genero','is', null);
  const { data, error } = await qb;
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
  let qb = supabase
    .from('profesionales_sanitarios')
    .select('area_profesional, estado_solicitud');
  qb = applyFilters(qb, filters || {});
  qb = qb.not('area_profesional','is', null);
  const { data, error } = await qb;
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

async function getDistrictStats(supabase: any, filters: Record<string, any> = {}) {
  let profQb = supabase
    .from('profesionales_sanitarios')
    .select('distrito_sanitario, area_profesional');
  profQb = applyFilters(profQb, filters || {});
  if (!('estado_solicitud' in (filters || {}))) {
    profQb = profQb.eq('estado_solicitud','Aprobado');
  }
  profQb = profQb.not('distrito_sanitario','is', null);
  const { data: profData, error: profErr } = await profQb;
  if (profErr) throw profErr;
  let centerQb = supabase
    .from('centros_salud')
    .select('distrito_sanitario');
  centerQb = applyCenterFilters(centerQb, filters || {});
  centerQb = centerQb.not('distrito_sanitario','is', null);
  const { data: centerData, error: centerErr } = await centerQb;
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

async function getAgeStats(supabase: any, filters: Record<string, any> = {}) {
  let qb = supabase
    .from('profesionales_sanitarios')
    .select('edad');
  qb = applyFilters(qb, filters || {});
  if (!('estado_solicitud' in (filters || {}))) {
    qb = qb.eq('estado_solicitud','Aprobado');
  }
  qb = qb.not('edad','is', null);
  const { data, error } = await qb;
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

async function getCountryStats(supabase: any, filters: Record<string, any> = {}) {
  let qb = supabase
    .from('profesionales_sanitarios')
    .select('pais_formacion_1, pais_formacion_2');
  qb = applyFilters(qb, filters || {});
  if (!('estado_solicitud' in (filters || {}))) {
    qb = qb.eq('estado_solicitud','Aprobado');
  }
  const { data, error } = await qb;
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

async function getInstitutionStats(supabase: any, filters: Record<string, any> = {}) {
  let qb = supabase
    .from('profesionales_sanitarios')
    .select('institucion_1, institucion_2, pais_formacion_1, pais_formacion_2');
  qb = applyFilters(qb, filters || {});
  if (!('estado_solicitud' in (filters || {}))) {
    qb = qb.eq('estado_solicitud','Aprobado');
  }
  const { data, error } = await qb;
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

async function getCenterCategoryStats(supabase: any, filters: Record<string, any> = {}) {
  let centersQb = supabase
    .from('centros_salud')
    .select('categoria, nombre, id');
  centersQb = applyCenterFilters(centersQb, filters || {});
  const { data: centers, error } = await centersQb;
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
    let profQb = supabase
      .from('profesionales_sanitarios')
      .select('id', { count: 'exact', head: true });
    profQb = applyFilters(profQb, filters || {});
    if (!('estado_solicitud' in (filters || {}))) {
      profQb = profQb.eq('estado_solicitud','Aprobado');
    }
    profQb = profQb.or(`nombre_centro.in.(${namesList}),centro_salud_id.in.(${idsList})`);
    const { count = 0 } = await profQb;
    const total_centros = g.names.length;
    results.push({ categoria, total_centros, total_profesionales: count || 0, promedio_profesionales_por_centro: (count || 0)/Math.max(1,total_centros) });
  }
  return results.sort((a,b)=> b.total_profesionales - a.total_profesionales);
}

async function getTitulacionStats(supabase: any, filters: Record<string, any> = {}) {
  let qb = supabase
    .from('profesionales_sanitarios')
    .select('categoria_titulacion, estado_solicitud');
  qb = applyFilters(qb, filters || {});
  qb = qb.not('categoria_titulacion','is', null);
  const { data, error } = await qb;
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
  { type: 'function', function: { name: 'get_gender_stats', description: 'Distribución por género (aplica filtros excepto género)', parameters: { type: 'object', properties: { filters: { type: 'object' } } } } },
  { type: 'function', function: { name: 'get_professionals_count', description: 'Cuenta profesionales con filtros', parameters: { type: 'object', properties: { filters: { type: 'object' } } } } },
  { type: 'function', function: { name: 'get_professionals_list', description: 'Lista de profesionales (nombre, especialidad, área, centro)', parameters: { type: 'object', properties: { filters: { type: 'object' }, limit: { type: 'number' }, aprobadosOnly: { type: 'boolean' } } } } },
  { type: 'function', function: { name: 'get_professionals_by_center', description: 'Profesionales por centro (conteo)', parameters: { type: 'object', properties: { nombre_centro: { type: 'string' }, centro_salud_id: { type: 'string' } } } } },
  { type: 'function', function: { name: 'get_centers_overview', description: 'Top centros por profesionales (acepta filtros)', parameters: { type: 'object', properties: { filters: { type: 'object' } } } } },
  { type: 'function', function: { name: 'get_centers_count', description: 'Cuenta centros por filtros', parameters: { type: 'object', properties: { filters: { type: 'object' } } } } },
  { type: 'function', function: { name: 'get_centers_list', description: 'Lista de centros con filtros', parameters: { type: 'object', properties: { filters: { type: 'object' }, limit: { type: 'number' } } } } },
  { type: 'function', function: { name: 'get_timeseries_registrations', description: 'Serie temporal de registros (acepta filtros)', parameters: { type: 'object', properties: { months: { type: 'number' }, filters: { type: 'object' } } } } },
  { type: 'function', function: { name: 'get_schema_overview', description: 'Esquema de la base de datos', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'get_area_stats', description: 'Estadísticas por área profesional (acepta filtros)', parameters: { type: 'object', properties: { filters: { type: 'object' } } } } },
  { type: 'function', function: { name: 'get_district_stats', description: 'Estadísticas por distrito sanitario (acepta filtros)', parameters: { type: 'object', properties: { filters: { type: 'object' } } } } },
  { type: 'function', function: { name: 'get_age_stats', description: 'Distribución por rangos de edad (acepta filtros)', parameters: { type: 'object', properties: { filters: { type: 'object' } } } } },
  { type: 'function', function: { name: 'get_country_stats', description: 'Países de formación (acepta filtros)', parameters: { type: 'object', properties: { filters: { type: 'object' } } } } },
  { type: 'function', function: { name: 'get_institution_stats', description: 'Instituciones de formación (acepta filtros)', parameters: { type: 'object', properties: { filters: { type: 'object' } } } } },
  { type: 'function', function: { name: 'get_center_category_stats', description: 'Categorías de centros (acepta filtros)', parameters: { type: 'object', properties: { filters: { type: 'object' } } } } },
  { type: 'function', function: { name: 'get_titulacion_stats', description: 'Categorías de titulación (acepta filtros)', parameters: { type: 'object', properties: { filters: { type: 'object' } } } } },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY no configurada');
    if (!SUPABASE_URL || !SERVICE_ROLE) throw new Error('SUPABASE_URL o SERVICE_ROLE faltante');

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { messages = [], filters = {} } = await req.json();

    const systemPrompt = `Eres un asistente de IA para el Ministerio de Sanidad de Guinea Ecuatorial.
Debes INVOCAR al menos una herramienta de datos antes de responder. Elige la herramienta adecuada según la consulta:
- Conteos exactos de profesionales -> get_professionals_count (aplica múltiples filtros combinados: area_profesional/especialidad, provincia, distrito_sanitario (o distrito), genero/genero_like, centro_salud_id/nombre_centro, funcion_publica, etc.)
- Listado de profesionales (nombres y especialidades) -> get_professionals_list (combina todos los filtros relevantes; usa aprobadosOnly si lo piden explícitamente)
- Centros (conteo/listado con filtros: nombre, categoria, provincia, distrito_sanitario, sector) -> get_centers_count / get_centers_list
- Género -> get_gender_stats; Áreas -> get_area_stats; Distritos -> get_district_stats; Centros destacados -> get_centers_overview; Serie temporal -> get_timeseries_registrations; Instituciones -> get_institution_stats; Países -> get_country_stats; Categorías de centro -> get_center_category_stats; Titulación -> get_titulacion_stats.
Reglas de extracción de filtros:
- Si se menciona un centro ("hospital", "clínica", "centro"), usa nombre_centro o nombre_centro_like.
- Si se menciona "enfermería/enfermeros", usa area_profesional o area_profesional_like.
- Si se menciona un distrito ("distrito sanitario de X"), usa distrito_sanitario o distrito_sanitario_like.
- Si se mencionan edades: "menores de N" -> edad_max = N-1; "mayores de N" -> edad_min = N+1; "entre X e Y" -> edad_min = X y edad_max = Y.
- En preguntas de seguimiento como "¿quiénes son?" o "¿cuáles son?":
  • Si el tema previo fue profesionales -> get_professionals_list.
  • Si fue centros -> get_centers_list.
  • Si fue distritos -> get_district_stats y devuelve los nombres de distritos.
  • Si fue instituciones -> get_institution_stats y lista instituciones.
  • Si fue países -> get_country_stats y lista países.
  • Si fue áreas -> get_area_stats y lista áreas.
  • Si fue categorías de centro/titulación -> get_center_category_stats/get_titulacion_stats y lista categorías.
  Siempre REUTILIZA TODOS los filtros del turno previo y añade los nuevos (edad, género, etc.) si aplican.
Responde SIEMPRE en español, breve, claro y con cifras exactas.
Indica filtros aplicados si es relevante y respeta los filtros recibidos en 'filters'. Si no hay datos, dilo explícitamente y sugiere una consulta alternativa.`;

    type ToolCall = { id: string; function: { name: string; arguments: string } };

    const executeTool = async (name: string, args: any) => {
      switch (name) {
        case 'get_summary_stats':
          return await getSummaryStats(supabase, args?.filters || {});
        case 'get_professionals_count':
          return await getProfessionalsCount(supabase, args?.filters || {});
        case 'get_gender_stats':
          return await getGenderStats(supabase, args?.filters || {});
        case 'get_professionals_by_center':
          return await getProfessionalsByCenter(supabase, args || {});
        case 'get_professionals_list':
          return await getProfessionalsList(supabase, args || {});
        case 'get_centers_count':
          return await getCentersCount(supabase, args?.filters || {});
        case 'get_centers_list':
          return await getCentersList(supabase, args || {});
        case 'get_centers_overview':
          return await getCentersOverview(supabase, args?.filters || {});
        case 'get_timeseries_registrations':
          return await getTimeseriesRegistrations(supabase, args || {});
        case 'get_schema_overview':
          return await getSchemaOverview(supabase);
        case 'get_area_stats':
          return await getAreaStats(supabase, args?.filters || {});
        case 'get_district_stats':
          return await getDistrictStats(supabase, args?.filters || {});
        case 'get_age_stats':
          return await getAgeStats(supabase, args?.filters || {});
        case 'get_country_stats':
          return await getCountryStats(supabase, args?.filters || {});
        case 'get_institution_stats':
          return await getInstitutionStats(supabase, args?.filters || {});
        case 'get_center_category_stats':
          return await getCenterCategoryStats(supabase, args?.filters || {});
        case 'get_titulacion_stats':
          return await getTitulacionStats(supabase, args?.filters || {});
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
            answerText = parts.length ? parts.join(' ') : 'No se encontraron datos para esa consulta específica.';
          } else {
            answerText = 'No se encontraron datos para esa consulta específica.';
          }
        } catch (_) {
          answerText = 'No se encontraron datos para esa consulta específica.';
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

    const diagnostics = { hasServiceRole: !!SERVICE_ROLE, hasOpenAI: !!OPENAI_API_KEY };

    return new Response(JSON.stringify({ answer: answerText, toolResults, navigationSuggestions, diagnostics }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
