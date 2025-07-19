import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

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
    const { message, analytics } = await req.json();
    const question = message;

    console.log("Received question:", question);
    console.log("Received analytics data:", analytics ? "Yes" : "No");

    if (!analytics) {
      throw new Error("No analytics data provided");
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
    
    TOP CENTROS DE SALUD (por profesionales):
    ${analytics.topCenters
      ?.slice(0, 10)
      .map(
        (center: any) =>
          `- ${center.nombre} (${center.categoria}): ${center.total_profesionales} profesionales`,
      )
      .join("\n")}
    
    ÁREAS PROFESIONALES:
    ${analytics.areaStats?.map((area: any) => `- ${area.area_profesional}: ${area.total} total (${area.aprobados} aprobados, ${area.pendientes} pendientes)`).join("\n")}
    
    DISTRITOS SANITARIOS:
    ${analytics.districtStats?.map((district: any) => `- ${district.distrito_sanitario}: ${district.total_profesionales} profesionales, ${district.total_centros} centros`).join("\n")}
    
    DISTRIBUCIÓN POR EDADES:
    ${analytics.ageRangeStats?.map((age: any) => `- ${age.rango_edad}: ${age.cantidad} profesionales (${age.porcentaje.toFixed(1)}%)`).join("\n")}
    
    PAÍSES DE FORMACIÓN:
    ${analytics.countryStats
      ?.slice(0, 10)
      .map(
        (country: any) =>
          `- ${country.pais_formacion}: ${country.cantidad} profesionales (${country.porcentaje.toFixed(1)}%)`,
      )
      .join("\n")}
    
    INSTITUCIONES DE FORMACIÓN:
    ${analytics.institutionStats
      ?.slice(0, 10)
      .map(
        (inst: any) => `- ${inst.institucion}: ${inst.cantidad} profesionales`,
      )
      .join("\n")}
    
    CATEGORÍAS DE CENTROS:
    ${analytics.categoryStats?.map((cat: any) => `- ${cat.categoria}: ${cat.total_centros} centros, ${cat.total_profesionales} profesionales`).join("\n")}
    
    CATEGORÍAS DE TITULACIÓN:
    ${analytics.titulacionStats?.map((tit: any) => `- ${tit.categoria_titulacion}: ${tit.total} total (${tit.aprobados} aprobados)`).join("\n")}
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
    const aiResponse = data.choices[0].message.content;

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
        dataContext: {
          summary: analytics.summary,
          topAreasCount: analytics.areaStats?.length || 0,
          topCentersCount: analytics.topCenters?.length || 0,
          districtsCount: analytics.districtStats?.length || 0,
        },
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
