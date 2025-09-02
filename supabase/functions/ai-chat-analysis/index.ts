import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, analytics: analyticsInput } = await req.json();
    const question = message;

    if (!openAIApiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY missing' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }

    console.log("ai-chat-analysis | question:", question);

    const supabase = (SUPABASE_URL && SERVICE_ROLE)
      ? createClient(SUPABASE_URL, SERVICE_ROLE)
      : null

    // If frontend did not send analytics, compute a broad snapshot from DB
    let analytics = analyticsInput
    if (!analytics && supabase) {
      console.log('ai-chat-analysis | computing analytics snapshot server-side')
      // Fetch needed columns in one pass to reduce roundtrips
      const [{ data: pros, error: prosErr }, { data: centers, error: centersErr }, { data: incidents, error: incidentsErr }, { data: carnets, error: carnetsErr }, { data: cola, error: colaErr }] = await Promise.all([
        supabase
          .from('profesionales_sanitarios')
          .select('id, estado_solicitud, area_profesional, provincia, distrito_sanitario, nombre_centro, categoria_centro, pais_formacion_1, pais_formacion_2, institucion_1, institucion_2, año_graduacion, fecha_caducidad')
          .limit(20000),
        supabase
          .from('centros_salud')
          .select('id, nombre, categoria, provincia, distrito_sanitario')
          .limit(20000),
        supabase
          .from('incidencias_hospitalarias')
          .select('estado')
          .limit(20000),
        supabase
          .from('carnets_generados')
          .select('*')
          .limit(20000),
        supabase
          .from('cola_generacion_carnets')
          .select('estado')
          .limit(20000)
      ])

      if (prosErr) console.error('analytics snapshot error [pros]:', prosErr)
      if (centersErr) console.error('analytics snapshot error [centers]:', centersErr)
      if (incidentsErr) console.error('analytics snapshot error [incidents]:', incidentsErr)
      if (carnetsErr) console.error('analytics snapshot error [carnets]:', carnetsErr)
      if (colaErr) console.error('analytics snapshot error [cola]:', colaErr)

      const totalProfessionals = pros?.length || 0
      const totalApproved = pros?.filter(p => p.estado_solicitud === 'Aprobado').length || 0

      const countBy = (arr: any[], key: string) => arr?.reduce((acc: any, it: any) => {
        const k = it?.[key]
        if (k) acc[k] = (acc[k] || 0) + 1
        return acc
      }, {}) || {}

      const areaStats = Object.entries(countBy(pros || [], 'area_profesional')).map(([area_profesional, total]) => ({ area_profesional, total }))
      const districtStats = Object.entries(countBy(pros || [], 'distrito_sanitario')).map(([distrito_sanitario, total_profesionales]) => ({ distrito_sanitario, total_profesionales, total_centros: 0 }))
      const countryStatsRaw = countBy((pros || []).flatMap(p => [p.pais_formacion_1, p.pais_formacion_2].filter(Boolean).map((pais: string) => ({ pais_formacion: pais }))), 'pais_formacion')
      const countryStats = Object.entries(countryStatsRaw).map(([pais_formacion, cantidad]) => ({ pais_formacion, cantidad, porcentaje: 0 }))
      const institutionStatsRaw = countBy((pros || []).flatMap(p => [p.institucion_1, p.institucion_2].filter(Boolean).map((i: string) => ({ institucion: i }))), 'institucion')
      const institutionStats = Object.entries(institutionStatsRaw).map(([institucion, cantidad]) => ({ institucion, cantidad }))
      const categoryStats = Object.entries(countBy(pros || [], 'categoria_centro')).map(([categoria, total_centros]) => ({ categoria, total_centros, total_profesionales: 0 }))

      const centerCategoryStats = Object.entries(countBy(centers || [], 'categoria')).map(([categoria, total_centros]) => ({ categoria, total_centros }))
      const incidentsOpen = (incidents || []).filter((i: any) => i.estado === 'Abierta' || i.estado === 'En Progreso').length
      const incidentsTotal = incidents?.length || 0

      const carnetStats = {
        generados: carnets?.length || 0,
        en_cola: (cola || []).length,
        cola_por_estado: Object.entries(countBy(cola || [], 'estado')).map(([estado, total]) => ({ estado, total }))
      }

      analytics = {
        summary: {
          totalProfessionals,
          totalApproved,
          totalCenters: centers?.length || Object.keys(countBy(pros || [], 'nombre_centro')).length,
          totalDistricts: Object.keys(countBy(pros || [], 'distrito_sanitario')).length,
          totalCountries: Object.keys(countryStatsRaw).length,
          totalInstitutions: Object.keys(institutionStatsRaw).length,
          totalIncidents: incidentsTotal,
          incidentsOpen
        },
        topCenters: Object.entries(countBy(pros || [], 'nombre_centro'))
          .sort((a: any, b: any) => b[1] - a[1])
          .slice(0, 10)
          .map(([nombre, total_profesionales]: any) => ({ nombre, categoria: '', total_profesionales })),
        areaStats,
        districtStats,
        ageRangeStats: [],
        countryStats,
        institutionStats,
        categoryStats,
        centerCategoryStats,
        carnetStats,
        titulacionStats: [],
      }
    }

    if (!analytics) {
      console.warn('ai-chat-analysis | no analytics available (frontend and server)')
    }

    // Create comprehensive context for AI
    const dataContext = `
    SISTEMA SANITARIO DE GUINEA ECUATORIAL - DATOS COMPLETOS:

    RESUMEN GENERAL:
    - Total de profesionales: ${analytics.summary?.totalProfessionals || 0}
    - Profesionales aprobados: ${analytics.summary?.totalApproved || 0}
    - Total de centros de salud: ${analytics.summary?.totalCenters || 0}
    - Distritos sanitarios: ${analytics.summary?.totalDistricts || 0}
    - Países de formación: ${analytics.summary?.totalCountries || 0}
    - Instituciones de formación: ${analytics.summary?.totalInstitutions || 0}
    - Incidencias abiertas: ${analytics.summary?.incidentsOpen || 0} de ${analytics.summary?.totalIncidents || 0}
    - Carnets generados: ${analytics.carnetStats?.generados || 0}; en cola: ${analytics.carnetStats?.en_cola || 0}

    TOP CENTROS DE SALUD (por profesionales):
    ${analytics.topCenters
      ?.slice(0, 10)
      .map(
        (center: any) =>
          `- ${center.nombre} (${center.categoria || ''}): ${center.total_profesionales} profesionales`,
      )
      .join("\n")}

    ÁREAS PROFESIONALES:
    ${analytics.areaStats?.map((area: any) => `- ${area.area_profesional}: ${area.total}${area.aprobados !== undefined ? ` total (${area.aprobados} aprobados, ${area.pendientes || 0} pendientes)` : ''}`).join("\n")}

    DISTRITOS SANITARIOS:
    ${analytics.districtStats?.map((district: any) => `- ${district.distrito_sanitario}: ${district.total_profesionales} profesionales, ${district.total_centros || 0} centros`).join("\n")}

    CATEGORÍAS DE CENTROS:
    ${analytics.centerCategoryStats?.map((cat: any) => `- ${cat.categoria}: ${cat.total_centros} centros`).join("\n")}

    DISTRIBUCIÓN POR EDADES:
    ${analytics.ageRangeStats?.map((age: any) => `- ${age.rango_edad}: ${age.cantidad} profesionales${age.porcentaje ? ` (${age.porcentaje.toFixed(1)}%)` : ''}`).join("\n")}

    PAÍSES DE FORMACIÓN:
    ${analytics.countryStats
      ?.slice(0, 10)
      .map(
        (country: any) =>
          `- ${country.pais_formacion}: ${country.cantidad} profesionales${country.porcentaje ? ` (${country.porcentaje.toFixed(1)}%)` : ''}`,
      )
      .join("\n")}

    INSTITUCIONES DE FORMACIÓN:
    ${analytics.institutionStats
      ?.slice(0, 10)
      .map(
        (inst: any) => `- ${inst.institucion}: ${inst.cantidad} profesionales`,
      )
      .join("\n")}

    CATEGORÍAS DE TITULACIÓN:
    ${analytics.titulacionStats?.map((tit: any) => `- ${tit.categoria_titulacion}: ${tit.total} total${tit.aprobados !== undefined ? ` (${tit.aprobados} aprobados)` : ''}`).join("\n")}
    `;

    const systemPrompt = `Eres un asistente especializado en análisis de datos del sistema sanitario de Guinea Ecuatorial. 
    Tienes acceso a datos actualizados del registro nacional de profesionales sanitarios (RENAPROSA).
    
    Tu función es analizar y responder preguntas sobre:
    - Estadísticas de profesionales sanitarios y centros de salud
    - Distribución geográfica de profesionales por distritos sanitarios
    - Estados de solicitudes y procesos de acreditación
    - Tendencias y patrones en los datos
    - Análisis de formación académica e instituciones
    - Distribución por edades y categorías de titulación
    - Recomendaciones basadas en los datos
    
    IMPORTANTE: Cuando sea relevante, puedes sugerir navegación a secciones específicas del dashboard.
    
    Pestañas disponibles para navegación:
    - "professionals": Lista de profesionales con filtros (ej. por área, provincia, estado)
    - "centers": Centros de salud (ej. por categoría, distrito)
    - "analytics": Estadísticas avanzadas detalladas
    - "renewals": Alertas de renovación y carnets próximos a vencer
    
    Ejemplos de filtros:
    - Para profesionales: { area_profesional: "MEDICINA GENERAL", provincia: "Malabo" }
    - Para centros: { categoria: "HOSPITAL" }
    
    Siempre proporciona respuestas precisas basadas en los datos reales que tienes disponibles.
    Usa un tono profesional pero accesible, y estructura tus respuestas de manera clara.
    Incluye datos específicos y cifras cuando sea relevante.
    
    Datos disponibles:
    ${dataContext}`;

    // Optional: extract intent and filters with OpenAI to query DB for exact results
    let structured: any = null
    try {
      const intentPrompt = `Devuelve SOLO JSON con la forma { action: 'count_professionals', filters?: { expira_en_dias?, carnet_vencido?, area_profesional?, provincia?, genero?, distrito_sanitario?, institucion?, pais_formacion?, ano_graduacion? } } interpretando: "${question}".`
      const intentRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', headers: { Authorization: `Bearer ${openAIApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0, messages: [ { role: 'system', content: 'Eres un parser estricto. Responde solo JSON.' }, { role: 'user', content: intentPrompt } ] })
      })
      const intentJson = await intentRes.json()
      const content = intentJson?.choices?.[0]?.message?.content
      try { structured = JSON.parse(content) } catch { structured = null }
    } catch (_) {}

    let dbCount: number | null = null
    if (supabase && structured?.action === 'count_professionals') {
      let qb: any = supabase.from('profesionales_sanitarios').select('id', { count: 'exact', head: true })
      const f = structured.filters || {}
      if (f.area_profesional) qb = qb.eq('area_profesional', f.area_profesional)
      if (f.provincia) qb = qb.eq('provincia', f.provincia)
      if (f.genero) qb = qb.eq('genero', f.genero)
      if (f.distrito_sanitario) qb = qb.eq('distrito_sanitario', f.distrito_sanitario)
      if (f.institucion) qb = qb.or(`institucion_1.ilike.%${f.institucion}%,institucion_2.ilike.%${f.institucion}%`)
      if (f.pais_formacion) qb = qb.or(`pais_formacion_1.ilike.%${f.pais_formacion}%,pais_formacion_2.ilike.%${f.pais_formacion}%`)
      if (typeof f.ano_graduacion === 'number') qb = qb.eq('año_graduacion', f.ano_graduacion)
      if (typeof f.expira_en_dias === 'number' && f.expira_en_dias > 0) {
        const now = new Date(); const limit = new Date(); limit.setDate(now.getDate() + f.expira_en_dias)
        qb = qb.eq('estado_solicitud', 'Aprobado').gte('fecha_caducidad', now.toISOString()).lte('fecha_caducidad', limit.toISOString())
      }
      if (f.carnet_vencido === true) {
        const nowIso = new Date().toISOString()
        qb = qb.eq('estado_solicitud', 'Aprobado').lte('fecha_caducidad', nowIso)
      }
      const { count, error } = await qb
      if (!error) dbCount = count || 0
    }

    console.log("Calling OpenAI API...");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let aiResponse = data.choices[0].message.content;

    // If we computed a DB count, rewrite answer to be precise
    if (dbCount !== null) {
      const precise = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${openAIApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.2,
          messages: [
            { role: "system", content: "Eres un asistente que contesta con cifras exactas de la base de datos, en español, de forma breve y clara." },
            { role: "user", content: `Pregunta: ${question}\nResultado exacto: ${dbCount}\nSi hay filtros detectados: ${JSON.stringify(structured?.filters || {})}\nResponde en una sola o dos frases como máximo.` }
          ]
        })
      })
      if (precise.ok) {
        const pj = await precise.json()
        aiResponse = pj.choices?.[0]?.message?.content || aiResponse
      }
    }

    console.log("AI response generated successfully");

    // Generate navigation suggestions based on the question content
    const navigationSuggestions = [];
    const questionLower = question.toLowerCase();

    if (
      questionLower.includes("centro") ||
      questionLower.includes("hospital") ||
      questionLower.includes("clínica")
    ) {
      navigationSuggestions.push({
        type: "navigate",
        tab: "centers",
        filters: {},
        label: "Ver Centros de Salud",
      });
    }

    if (
      questionLower.includes("área") ||
      questionLower.includes("profesional") ||
      questionLower.includes("médico") ||
      questionLower.includes("enfermería")
    ) {
      navigationSuggestions.push({
        type: "navigate",
        tab: "professionals",
        filters: {},
        label: "Ver Profesionales",
      });
    }

    if (
      questionLower.includes("distrito") ||
      questionLower.includes("provincia") ||
      questionLower.includes("geográf")
    ) {
      navigationSuggestions.push({
        type: "navigate",
        tab: "analytics",
        filters: {},
        label: "Ver Análisis por Distrito",
      });
    }

    if (
      questionLower.includes("edad") ||
      questionLower.includes("joven") ||
      questionLower.includes("mayor")
    ) {
      navigationSuggestions.push({
        type: "navigate",
        tab: "analytics",
        filters: {},
        label: "Ver Análisis Demográfico",
      });
    }

    if (
      questionLower.includes("formación") ||
      questionLower.includes("país") ||
      questionLower.includes("institución") ||
      questionLower.includes("graduación")
    ) {
      navigationSuggestions.push({
        type: "navigate",
        tab: "analytics",
        filters: {},
        label: "Ver Análisis de Formación",
      });
    }

    if (
      questionLower.includes("renovación") ||
      questionLower.includes("vencimiento") ||
      questionLower.includes("carnet")
    ) {
      navigationSuggestions.push({
        type: "navigate",
        tab: "renewals",
        filters: {},
        label: "Ver Alertas de Renovación",
      });
    }

    return new Response(
      JSON.stringify({
        response: aiResponse,
        navigationSuggestions,
        dataContext: analytics ? {
          summary: analytics.summary,
          topAreasCount: analytics.areaStats?.length || 0,
          topCentersCount: analytics.topCenters?.length || 0,
          districtsCount: analytics.districtStats?.length || 0,
        } : null,
        diagnostics: {
          hasServiceRole: !!SERVICE_ROLE,
          hasSupabaseUrl: !!SUPABASE_URL,
          hasOpenAI: !!openAIApiKey,
          usedServerAnalytics: !analyticsInput && !!analytics,
          detectedFilters: structured?.filters || null,
          dbCount
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in ai-chat-analysis function:", error);
    return new Response(
      JSON.stringify({
        error: "Error processing request",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
