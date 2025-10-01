// supabase/functions/ai-chat-master/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Sistema de Schema Mejorado con Relaciones e Índices de Comprensión
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
        "Profesionales por área profesional",
        "Profesionales con carnets próximos a vencer (30 días)",
        "Funcionarios públicos nombrados vs no nombrados",
        "Profesionales por país de formación",
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
        "Centros por categoría y sector",
        "Centros con mayor número de profesionales",
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
    "profesionales con centros": `
      SELECT p.*, c.nombre as centro_nombre, c.categoria as centro_categoria
      FROM profesionales_sanitarios p
      LEFT JOIN centros_salud c ON p.centro_salud_id = c.id
    `,
    "profesionales con formación": `
      SELECT p.*, i.nombre as institucion_nombre, i.pais as pais_institucion
      FROM profesionales_sanitarios p
      LEFT JOIN instituciones_formacion i ON p.institucion_formacion_id_1 = i.id
    `,
    "guardias con profesionales": `
      SELECT g.*, pg.categoria, ps.nombre_completo, c.nombre as centro_nombre
      FROM guardias g
      LEFT JOIN profesionales_guardias pg ON g.profesional_guardia_id = pg.id
      LEFT JOIN profesionales_sanitarios ps ON pg.profesional_id = ps.id
      LEFT JOIN centros_salud c ON g.centro_salud_id = c.id
    `
  }
};

// Sistema de prompt mejorado con comprensión contextual
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
- Comprendes relaciones entre tablas automáticamente
- Identificas patrones comunes de consulta
- Reconoces sinónimos y variaciones de términos médicos/administrativos
- Aplicas filtros geográficos según contexto de Guinea Ecuatorial
- Entiendes jerarquías: Ministerio > Centros > Profesionales

EJEMPLOS DE CONSULTAS INTELIGENTES:

Ejemplo 1 - Función Pública:
Usuario: "Cuántos funcionarios nombrados hay"
SQL:
\`\`\`sql
SELECT COUNT(*) as total_nombrados
FROM profesionales_sanitarios
WHERE funcion_publica = true AND estatus_funcionario = 'nombrado'
\`\`\`

Ejemplo 2 - Formación Internacional:
Usuario: "Profesionales formados en España"
SQL:
\`\`\`sql
SELECT nombre_completo, area_profesional, institucion_1
FROM profesionales_sanitarios
WHERE pais_formacion_1 = 'España' OR pais_formacion_2 = 'España'
\`\`\`

Ejemplo 3 - Análisis de Centros:
Usuario: "Centros públicos con más médicos"
SQL:
\`\`\`sql
SELECT c.nombre, c.provincia, COUNT(p.id) as total_profesionales
FROM centros_salud c
LEFT JOIN profesionales_sanitarios p ON c.id = p.centro_salud_id
WHERE c.sector = 'Público' AND p.area_profesional = 'Medicina'
GROUP BY c.id, c.nombre, c.provincia
ORDER BY total_profesionales DESC
LIMIT 10
\`\`\`

Asegúrate de usar contexto conversacional previo para refinar consultas.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let messages: any[] = [];
  let sql = "";
  let rawSql = "";

  try {
    const body = await req.json();
    if (!body || !Array.isArray(body.messages)) {
      throw new Error("Cuerpo de la petición JSON no válido o campo 'messages' ausente.");
    }
    messages = body.messages;

    if (messages.length === 0) {
      return new Response(JSON.stringify({
        error: "Error 400: El array 'messages' no debe estar vacío."
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Sistema de prompt mejorado
    const systemPrompt = buildEnhancedSystemPrompt();
    const conversationHistory = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    // Llamar a OpenAI con modelo actualizado
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Usando modelo estable
        messages: conversationHistory,
        temperature: 0,
        max_tokens: 500
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      throw new Error(`OpenAI API error: ${openAIResponse.status} - ${errorText}`);
    }

    const completion = await openAIResponse.json();
    rawSql = completion.choices[0].message?.content ?? "";
    
    // Extraer SQL del bloque markdown
    const sqlMatch = rawSql.match(/```(?:sql|SQL)?\s*([\s\S]*?)\s*```/);
    sql = sqlMatch ? sqlMatch[1].trim() : rawSql.trim();

    // Validación mejorada
    if (!sql || !sql.toUpperCase().trim().startsWith("SELECT")) {
      return new Response(JSON.stringify({
        error: "La IA no generó una sentencia SQL SELECT válida.",
        debug_sql_extracted: sql,
        debug_ai_raw_response: rawSql,
        message: "Revisa la respuesta cruda de la IA para ver si incluyó explicaciones o no generó un bloque SQL."
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Limpiar SQL
    const cleanSql = sql.trim().endsWith(';') ? sql.trim().slice(0, -1) : sql;

    // Ejecutar con manejo de errores mejorado
    const { data: result, error: queryError } = await supabase.rpc("exec_sql", {
      query: cleanSql
    });

    if (queryError) {
      return new Response(JSON.stringify({
        error: `Error de ejecución SQL: ${queryError.message}`,
        debug_sql_executed: cleanSql,
        message: "La sentencia SQL fue válida pero falló al ejecutarse contra la BD.",
        hint: "Verifica nombres de tablas y columnas en el schema"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Post-procesamiento: Generar respuesta en lenguaje natural
    const userQuestion = messages[messages.length - 1].content;
    const naturalLanguagePrompt = `
La consulta del usuario fue: "${userQuestion}"
El resultado de la base de datos es:
${JSON.stringify(result, null, 2)}

Resume este resultado en una respuesta profesional, concisa y clara en ESPAÑOL. 
NO incluyas el código SQL ni el JSON. 
Si el resultado está vacío, indica que no se encontraron datos.
Contexto: Sistema de Salud de Guinea Ecuatorial - Gestión de profesionales sanitarios.
`;

    const finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: naturalLanguagePrompt }],
        temperature: 0.2,
        max_tokens: 300
      }),
    });

    if (!finalResponse.ok) {
      throw new Error("Error generando respuesta en lenguaje natural");
    }

    const finalCompletion = await finalResponse.json();
    const naturalLanguageResponse = finalCompletion.choices[0].message?.content ?? 
      "No se pudo generar una respuesta en lenguaje natural.";

    return new Response(JSON.stringify({
      sql: cleanSql,
      result,
      natural_language_response: naturalLanguageResponse
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (err: any) {
    console.error("❌ Error:", err);
    return new Response(JSON.stringify({
      error: `Error de servidor: ${err.message}`,
      debug_ai_raw_response: rawSql,
      stack: err.stack
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});
