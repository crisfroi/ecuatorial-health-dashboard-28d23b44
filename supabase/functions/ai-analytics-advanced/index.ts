
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Inicializar cliente de Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Manejar preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 AI Analytics Advanced: Iniciando análisis');
    const startTime = Date.now();
    
    const { query, filters = {}, description } = await req.json();
    console.log('📝 Consulta recibida:', { query, filters, description });

    // Verificar conexión a la base de datos
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profesionales_sanitarios')
      .select('id')
      .limit(1);

    if (connectionError) {
      console.error('❌ Error de conexión:', connectionError);
      throw new Error(`Error de conexión a la base de datos: ${connectionError.message}`);
    }

    console.log('✅ Conexión a BD establecida correctamente');

    let analysisData = {};

    switch (query) {
      case 'demographics':
        analysisData = await getDemographicsAnalysis();
        break;
      case 'professional_areas':
        analysisData = await getProfessionalAreasAnalysis();
        break;
      case 'education':
        analysisData = await getEducationAnalysis();
        break;
      case 'work_centers':
        analysisData = await getWorkCentersAnalysis();
        break;
      case 'application_status':
        analysisData = await getApplicationStatusAnalysis();
        break;
      case 'comprehensive':
        analysisData = await getComprehensiveAnalysis();
        break;
      default:
        analysisData = await getComprehensiveAnalysis();
    }

    const executionTime = Date.now() - startTime;
    console.log(`⚡ Análisis completado en ${executionTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      data: analysisData,
      query,
      executionTime,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error en ai-analytics-advanced:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error interno del servidor',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Funciones de análisis optimizadas
async function getDemographicsAnalysis() {
  console.log('👥 Ejecutando análisis demográfico...');
  
  try {
    // Consulta optimizada para demografía
    const { data: demographics, error } = await supabase
      .from('profesionales_sanitarios')
      .select(`
        genero,
        provincia_residencia,
        nacionalidad,
        fecha_graduacion
      `);

    if (error) throw error;

    const total_profesionales = demographics.length;

    // Distribución por género
    const distribucion_genero = demographics.reduce((acc: any, prof: any) => {
      const genero = prof.genero || 'No especificado';
      acc[genero] = (acc[genero] || 0) + 1;
      return acc;
    }, {});

    // Distribución por provincia
    const distribucion_provincia = demographics.reduce((acc: any, prof: any) => {
      const provincia = prof.provincia_residencia || 'No especificada';
      acc[provincia] = (acc[provincia] || 0) + 1;
      return acc;
    }, {});

    // Distribución por nacionalidad
    const distribucion_nacionalidad = demographics.reduce((acc: any, prof: any) => {
      const nacionalidad = prof.nacionalidad || 'No especificada';
      acc[nacionalidad] = (acc[nacionalidad] || 0) + 1;
      return acc;
    }, {});

    // Distribución por edad (calculada desde fecha_graduacion)
    const distribucion_edad: any = {
      "20-30 años": 0,
      "31-40 años": 0,
      "41-50 años": 0,
      "51-60 años": 0,
      "60+ años": 0,
      "No especificado": 0
    };

    demographics.forEach((prof: any) => {
      if (prof.fecha_graduacion) {
        const anoGraduacion = new Date(prof.fecha_graduacion).getFullYear();
        const edadAproximada = new Date().getFullYear() - anoGraduacion + 23; // Asumiendo graduación a los 23
        
        if (edadAproximada <= 30) distribucion_edad["20-30 años"]++;
        else if (edadAproximada <= 40) distribucion_edad["31-40 años"]++;
        else if (edadAproximada <= 50) distribucion_edad["41-50 años"]++;
        else if (edadAproximada <= 60) distribucion_edad["51-60 años"]++;
        else distribucion_edad["60+ años"]++;
      } else {
        distribucion_edad["No especificado"]++;
      }
    });

    console.log('✅ Análisis demográfico completado');
    
    return {
      total_profesionales,
      distribucion_genero,
      distribucion_provincia,
      distribucion_nacionalidad,
      distribucion_edad
    };

  } catch (error) {
    console.error('❌ Error en análisis demográfico:', error);
    throw error;
  }
}

async function getProfessionalAreasAnalysis() {
  console.log('🏥 Ejecutando análisis de áreas profesionales...');
  
  try {
    const { data: professionals, error } = await supabase
      .from('profesionales_sanitarios')
      .select('area_profesional, estado_solicitud');

    if (error) throw error;

    const total_profesionales = professionals.length;

    // Análisis por áreas profesionales
    const areasCount = professionals.reduce((acc: any, prof: any) => {
      const area = prof.area_profesional || 'Sin especificar';
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {});

    const areas_profesionales = Object.entries(areasCount)
      .map(([area, cantidad]: [string, any]) => ({
        area,
        cantidad,
        porcentaje: ((cantidad / total_profesionales) * 100).toFixed(1)
      }))
      .sort((a, b) => b.cantidad - a.cantidad);

    console.log('✅ Análisis de áreas profesionales completado');
    
    return {
      total_profesionales,
      areas_profesionales
    };

  } catch (error) {
    console.error('❌ Error en análisis de áreas profesionales:', error);
    throw error;
  }
}

async function getEducationAnalysis() {
  console.log('🎓 Ejecutando análisis de educación...');
  
  try {
    const { data: education, error } = await supabase
      .from('profesionales_sanitarios')
      .select(`
        pais_formacion,
        institucion_formacion,
        fecha_graduacion,
        categoria_titulacion
      `);

    if (error) throw error;

    const total_profesionales = education.length;

    // Análisis por países de formación
    const paisesCount = education.reduce((acc: any, prof: any) => {
      const pais = prof.pais_formacion || 'No especificado';
      acc[pais] = (acc[pais] || 0) + 1;
      return acc;
    }, {});

    const paises_formacion = Object.entries(paisesCount)
      .map(([pais, cantidad]: [string, any]) => ({
        pais,
        cantidad,
        porcentaje: ((cantidad / total_profesionales) * 100).toFixed(1)
      }))
      .sort((a, b) => b.cantidad - a.cantidad);

    // Análisis por instituciones
    const institucionesCount = education.reduce((acc: any, prof: any) => {
      const institucion = prof.institucion_formacion || 'No especificada';
      acc[institucion] = (acc[institucion] || 0) + 1;
      return acc;
    }, {});

    const instituciones_formacion = Object.entries(institucionesCount)
      .map(([institucion, cantidad]: [string, any]) => ({
        institucion,
        cantidad
      }))
      .sort((a, b) => b.cantidad - a.cantidad);

    console.log('✅ Análisis de educación completado');
    
    return {
      total_profesionales,
      paises_formacion,
      instituciones_formacion
    };

  } catch (error) {
    console.error('❌ Error en análisis de educación:', error);
    throw error;
  }
}

async function getWorkCentersAnalysis() {
  console.log('🏢 Ejecutando análisis de centros de trabajo...');
  
  try {
    const { data: centers, error } = await supabase
      .from('profesionales_sanitarios')
      .select(`
        centro_trabajo,
        distrito_sanitario,
        sector_trabajo
      `);

    if (error) throw error;

    // Obtener datos de centros de salud
    const { data: healthCenters, error: centersError } = await supabase
      .from('centros_salud')
      .select('nombre, categoria, distrito_sanitario');

    if (centersError) console.warn('⚠️ No se pudieron obtener datos de centros de salud:', centersError);

    const total_profesionales = centers.length;
    const total_centros = healthCenters?.length || 0;

    // Top centros por cantidad de profesionales
    const centrosCount = centers.reduce((acc: any, prof: any) => {
      const centro = prof.centro_trabajo || 'Sin especificar';
      acc[centro] = (acc[centro] || 0) + 1;
      return acc;
    }, {});

    const top_centros = Object.entries(centrosCount)
      .map(([nombre, profesionales]: [string, any]) => ({
        nombre,
        profesionales,
        categoria: 'Centro de Salud' // Default
      }))
      .sort((a, b) => b.profesionales - a.profesionales);

    // Análisis por distritos sanitarios
    const distritosCount = centers.reduce((acc: any, prof: any) => {
      const distrito = prof.distrito_sanitario || 'Sin especificar';
      acc[distrito] = (acc[distrito] || 0) + 1;
      return acc;
    }, {});

    const distritos_sanitarios = Object.entries(distritosCount)
      .map(([distrito, profesionales]: [string, any]) => ({
        distrito,
        profesionales
      }))
      .sort((a, b) => b.profesionales - a.profesionales);

    console.log('✅ Análisis de centros de trabajo completado');
    
    return {
      total_profesionales,
      total_centros,
      top_centros,
      distritos_sanitarios
    };

  } catch (error) {
    console.error('❌ Error en análisis de centros de trabajo:', error);
    throw error;
  }
}

async function getApplicationStatusAnalysis() {
  console.log('📋 Ejecutando análisis de estados de solicitud...');
  
  try {
    const { data: applications, error } = await supabase
      .from('profesionales_sanitarios')
      .select('estado_solicitud, fecha_solicitud, motivo_rechazo');

    if (error) throw error;

    const total_solicitudes = applications.length;

    // Distribución por estados
    const estados_solicitud = applications.reduce((acc: any, app: any) => {
      const estado = app.estado_solicitud || 'Sin especificar';
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {});

    console.log('✅ Análisis de estados de solicitud completado');
    
    return {
      total_solicitudes,
      estados_solicitud
    };

  } catch (error) {
    console.error('❌ Error en análisis de estados de solicitud:', error);
    throw error;
  }
}

async function getComprehensiveAnalysis() {
  console.log('📊 Ejecutando análisis comprehensivo...');
  
  try {
    // Ejecutar análisis básicos en paralelo para mejor performance
    const [
      demographics,
      professionalAreas,
      education,
      workCenters,
      applicationStatus
    ] = await Promise.all([
      getDemographicsAnalysis().catch(e => ({ error: e.message })),
      getProfessionalAreasAnalysis().catch(e => ({ error: e.message })),
      getEducationAnalysis().catch(e => ({ error: e.message })),
      getWorkCentersAnalysis().catch(e => ({ error: e.message })),
      getApplicationStatusAnalysis().catch(e => ({ error: e.message }))
    ]);

    // Obtener resumen general
    const { data: totalCount, error: countError } = await supabase
      .from('profesionales_sanitarios')
      .select('id', { count: 'exact', head: true });

    const { data: centersCount, error: centersCountError } = await supabase
      .from('centros_salud')
      .select('id', { count: 'exact', head: true });

    const total_profesionales = totalCount?.length || 0;
    const total_centros = centersCount?.length || 0;

    // Calcular distritos únicos
    const { data: districts } = await supabase
      .from('profesionales_sanitarios')
      .select('distrito_sanitario')
      .not('distrito_sanitario', 'is', null);

    const uniqueDistricts = [...new Set(districts?.map(d => d.distrito_sanitario))];
    const total_distritos = uniqueDistricts.length;

    // Calcular países únicos
    const { data: countries } = await supabase
      .from('profesionales_sanitarios')
      .select('pais_formacion')
      .not('pais_formacion', 'is', null);

    const uniqueCountries = [...new Set(countries?.map(c => c.pais_formacion))];
    const total_paises = uniqueCountries.length;

    console.log('✅ Análisis comprehensivo completado');

    return {
      resumen_general: {
        total_profesionales,
        total_centros,
        total_distritos,
        total_paises
      },
      // Incluir datos de otros análisis si están disponibles
      ...(demographics.error ? {} : demographics),
      ...(professionalAreas.error ? {} : professionalAreas),
      ...(education.error ? {} : education),
      ...(workCenters.error ? {} : workCenters),
      ...(applicationStatus.error ? {} : applicationStatus)
    };

  } catch (error) {
    console.error('❌ Error en análisis comprehensivo:', error);
    throw error;
  }
}
