import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- 1. CONFIGURACIÓN Y VARIABLES DE ENTORNO ---
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

// Asegúrate de que las variables de entorno se carguen correctamente
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  // Esto debería abortar la ejecución en un entorno real si falta configuración vital.
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// --- 2. ESQUEMA DETALLADO (Manteniendo el schema completo) ---
const ENHANCED_SCHEMA = {
  domain: "Sistema de Salud de Guinea Ecuatorial",
  context: "Gestión de profesionales sanitarios, centros de salud, guardias médicas y acreditaciones",
  tables: {
    profesionales_sanitarios: {
      description: "Profesionales de la salud registrados en el sistema",
      purpose: "Gestión de acreditaciones y seguimiento de profesionales",
      mainColumns: {
        id: {
          type: "uuid",
          description: "Identificador único"
        },
        nombre_completo: {
          type: "text",
          description: "Nombre completo del profesional",
          indexed: true
        },
        area_profesional: {
          type: "text",
          description: "Especialidad médica (Medicina, Enfermería, etc.)",
          indexed: true
        },
        estado_solicitud: {
          type: "varchar",
          description: "Estado de acreditación: Recibido, Aprobado, Rechazado, Pendiente de Firma",
          indexed: true
        },
        funcion_publica: {
          type: "boolean",
          description: "Si pertenece a la función pública",
          indexed: true
        },
        estatus_funcionario: {
          type: "text",
          description: "Nombrado o no_nombrado (para función pública)"
        },
        nacionalidad: {
          type: "text",
          description: "Nacionalidad del profesional",
          indexed: true
        },
        provincia: {
          type: "text",
          description: "Provincia de trabajo",
          indexed: true
        },
        distrito_sanitario: {
          type: "text",
          description: "Distrito sanitario asignado",
          indexed: true
        },
        edad: {
          type: "integer",
          description: "Edad del profesional"
        },
        genero: {
          type: "text",
          description: "Género: Masculino/Femenino"
        },
        pais_formacion_1: {
          type: "text",
          description: "País donde obtuvo su primera titulación",
          indexed: true
        },
        pais_formacion_2: {
          type: "text",
          description: "País donde obtuvo su segunda titulación"
        },
        institucion_1: {
          type: "text",
          description: "Institución de primera formación",
          indexed: true
        },
        institucion_2: {
          type: "text",
          description: "Institución de segunda formación"
        },
        año_graduacion: {
          type: "integer",
          description: "Año de graduación",
          indexed: true
        },
        fecha_caducidad: {
          type: "date",
          description: "Fecha de vencimiento del carnet"
        },
        id_profesional_unico: {
          type: "text",
          description: "Código único de carnet profesional"
        }
      },
      relations: [
        {
          to: "centros_salud",
          via: "centro_salud_id",
          description: "Centro donde trabaja"
        },
        {
          to: "instituciones_formacion",
          via: "institucion_formacion_id_1",
          description: "Institución educativa"
        }
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
        id: {
          type: "uuid",
          description: "Identificador único"
        },
        nombre: {
          type: "text",
          description: "Nombre del centro",
          indexed: true
        },
        categoria: {
          type: "text",
          description: "Hospital, Clínica, Centro de Salud, etc.",
          indexed: true
        },
        sector: {
          type: "text",
          description: "Público, Privado, Mixto",
          indexed: true
        },
        provincia: {
          type: "text",
          description: "Provincia",
          indexed: true
        },
        distrito_sanitario: {
          type: "text",
          description: "Distrito sanitario",
          indexed: true
        },
        estado: {
          type: "text",
          description: "Activo/Inactivo"
        }
      },
      relations: [
        {
          from: "profesionales_sanitarios",
          via: "centro_salud_id",
          description: "Profesionales asignados"
        },
        {
          from: "guardias",
          via: "centro_salud_id",
          description: "Guardias programadas"
        }
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
        id: {
          type: "uuid",
          description: "Identificador único"
        },
        profesional_guardia_id: {
          type: "uuid",
          description: "Profesional asignado"
        },
        centro_salud_id: {
          type: "uuid",
          description: "Centro donde se realiza"
        },
        fecha_inicio: {
          type: "timestamp",
          description: "Inicio del turno"
        },
        fecha_fin: {
          type: "timestamp",
          description: "Fin del turno"
        },
        tipo: {
          type: "enum",
          description: "fisica, administrativa, localizable"
        },
        tipo_dia: {
          type: "enum",
          description: "ordinario, fin_semana, festivo"
        },
        estado: {
          type: "enum",
          description: "planificada, confirmada, completada, cancelada"
        }
      },
      relations: [
        {
          to: "profesionales_guardias",
          via: "profesional_guardia_id",
          description: "Profesional"
        },
        {
          to: "centros_salud",
          via: "centro_salud_id",
          description: "Centro"
        },
        {
          to: "nominas_guardias",
          via: "nomina_id",
          description: "Nómina asociada"
        }
      ]
    },
    nominas_guardias: {
      description: "Nóminas de pago por guardias",
      purpose: "Gestión financiera de guardias",
      mainColumns: {
        id: {
          type: "uuid",
          description: "Identificador único"
        },
        mes: {
          type: "integer",
          description: "Mes de la nómina"
        },
        anio: {
          type: "integer",
          description: "Año de la nómina"
        },
        centro_salud_id: {
          type: "uuid",
          description: "Centro"
        },
        total_importe: {
          type: "numeric",
          description: "Total a pagar"
        },
        estado: {
          type: "text",
          description: "borrador, aprobada, pagada"
        }
      },
      relations: [
        {
          to: "centros_salud",
          via: "centro_salud_id"
        },
        {
          from: "nominas_guardias_lineas",
          description: "Líneas de detalle"
        }
      ]
    },
    instituciones_formacion: {
      description: "Instituciones educativas de formación médica",
      purpose: "Registro de universidades y centros de formación",
      mainColumns: {
        id: {
          type: "uuid",
          description: "Identificador único"
        },
        nombre: {
          type: "text",
          description: "Nombre de la institución",
          indexed: true
        },
        pais: {
          type: "text",
          description: "País de ubicación",
          indexed: true
        },
        categoria: {
          type: "text",
          description: "Tipo de institución"
        }
      },
      relations: [
        {
          from: "profesionales_sanitarios",
          via: "institucion_formacion_id_1"
        }
      ]
    },
    carnets_generados: {
      description: "Carnets profesionales generados",
      purpose: "Seguimiento de emisión de carnets",
      mainColumns: {
        id: {
          type: "uuid",
          description: "Identificador único"
        },
        profesional_id: {
          type: "uuid",
          description: "Profesional asociado"
        },
        url_carnet: {
          type: "text",
          description: "URL del carnet PDF"
        },
        fecha_generacion: {
          type: "timestamp",
          description: "Fecha de creación"
        }
      }
    },
    categorias_titulacion: {
      description: "Categorías de títulos profesionales",
      mainColumns: {
        nombre: {
          type: "text",
          description: "Nombre de la categoría"
        },
        codigo_color: {
          type: "text",
          description: "Color distintivo"
        }
      }
    },
    distrito_sanitario: {
      description: "Distritos sanitarios administrativos",
      mainColumns: {
        nombre_distrito: {
          type: "text",
          description: "Nombre del distrito"
        },
        nombre_provincia: {
          type: "text",
          description: "Provincia"
        }
      }
    }
  },
  semanticMappings: {
    professions: [
      "Medicina",
      "Enfermería",
      "Farmacia",
      "Laboratorio",
      "Odontología"
    ],
    statuses: [
      "Recibido",
      "Aprobado",
      "Rechazado",
      "Pendiente de Firma",
      "En Revisión"
    ],
    publicFunctionStatuses: [
      "nombrado",
      "no_nombrado"
    ],
    provinces: [
      "Bioko Norte",
      "Bioko Sur",
      "Litoral",
      "Wele-Nzas",
      "Centro Sur",
      "Kié-Ntem",
      "Annobón"
    ],
    sectors: [
      "Público",
      "Privado",
      "Mixto"
    ],
    guardTypes: [
      "fisica",
      "administrativa",
      "localizable"
    ]
  },
  intelligentJoins: {
    "profesionales con centros": "SELECT p.*, c.nombre as centro_nombre, c.categoria as centro_categoria FROM profesionales_sanitarios p LEFT JOIN centros_salud c ON p.centro_salud_id = c.id",
    "profesionales con formación": "SELECT p.*, i.nombre as institucion_nombre, i.pais as pais_institucion FROM profesionales_sanitarios p LEFT JOIN instituciones_formacion i ON p.institucion_formacion_id_1 = i.id",
    "guardias con profesionales": "SELECT g.*, pg.categoria, ps.nombre_completo, c.nombre as centro_nombre FROM guardias g LEFT JOIN profesionales_guardias pg ON g.profesional_guardia_id = pg.id LEFT JOIN profesionales_sanitarios ps ON pg.profesional_id = ps.id LEFT JOIN centros_salud c ON g.centro_salud_id = c.id"
  }
};

// --- 3. PROMPT DEL SISTEMA ACTUALIZADO (Con Explicación y Acción de XLSX) ---
function buildEnhancedSystemPrompt() {
  const schemaString = JSON.stringify(ENHANCED_SCHEMA, null, 2);
  const toolDefinition = `
  ACCIÓN DISPONIBLE: GENERAR_REPORTE_XLSX
  
  1. Uso: Si el usuario solicita EXPRESAMENTE un reporte, tabla o listado para descargar en formato Excel (XLSX, XLS).
  2. Respuesta de la IA: Siempre debe constar de DOS PARTES SEPARADAS por la línea \`-- RESULT_SEPARATOR --\`:
    a) **Explicación (Lenguaje Natural):** Una explicación profesional, detallada y amigable de lo que la consulta va a obtener y cómo interpreta los resultados.
    b) **SQL + Acción:** La sentencia SQL (dentro de un bloque \`\`\`sql) para obtener los datos, seguida inmediatamente por el comentario de acción en una nueva línea, si aplica.
    
  Ejemplo de respuesta de la IA para un reporte de Guardias por Centro (si se pide descarga):
  \`\`\`
  El siguiente reporte muestra el total de guardias realizadas por cada centro de salud durante el mes actual. Estos datos le permitirán analizar la distribución de la carga de trabajo de manera detallada.
  -- RESULT_SEPARATOR --
  \`\`\`sql
  SELECT c.nombre AS centro, COUNT(g.id) AS total_guardias_mes 
  FROM guardias g
  LEFT JOIN centros_salud c ON g.centro_salud_id = c.id
  WHERE g.fecha_inicio >= date_trunc('month', NOW())
  GROUP BY 1
  ORDER BY 2 DESC
  -- ACTION: GENERATE_XLSX_URL
  \`\`\`
  \`\`\`
  
  REGLAS ESTRICTAS:
  1. **SIEMPRE incluye una explicación y el separador.**
  2. Si NO se pide un Excel, la IA devuelve el SQL sin el comentario \`-- ACTION: GENERATE_XLSX_URL\`.
  3. Si SÍ se pide una descarga, incluye el comentario de acción \`-- ACTION: GENERATE_XLSX_URL\`.
  4. Utiliza EXCLUSIVAMENTE las tablas y columnas del schema.
  5. Asegura búsquedas de texto insensibles a mayúsculas y acentos: utiliza ILIKE.
  `;
  return `Eres un asistente SQL experto. Tu respuesta debe incluir SIEMPRE una explicación y la consulta SQL. Sigue estrictamente el formato y las reglas:\n\n${toolDefinition}\n\nCONTEXTO DEL DOMINIO:\n${schemaString}`;
}

// --- 4. FUNCIONES MODULARES (Gemini y OpenAI sin restricción de solo SQL) ---
async function geminiGenerateText(prompt) {
  if (!GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY ausente. Esto causará un fallo de autenticación.');
    throw new Error('GEMINI_API_KEY ausente');
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 1024
        }
      })
    });
    if (!resp.ok) {
      const errorText = await resp.text();
      console.error(`ERROR GEMINI HTTP: Status ${resp.status}`);
      console.error(`Cuerpo del Error Gemini: ${errorText}`);
      if (resp.status === 400) {
        throw new Error(`Error 400 (Bad Request): Revisa el formato del prompt o modelo (ej. Alternancia de roles). Cuerpo: ${errorText}`);
      } else if (resp.status === 403 || resp.status === 401) {
        throw new Error(`Error 401/403 (Autenticación/Acceso denegado): Revisa la GEMINI_API_KEY. Cuerpo: ${errorText}`);
      } else if (resp.status === 429) {
        throw new Error(`Error 429 (Límite de Tasa/Cuota agotada): Has superado el límite de uso. Cuerpo: ${errorText}`);
      } else {
        throw new Error(`Gemini error ${resp.status}: ${errorText}`);
      }
    }
    const json = await resp.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return text;
  } catch (error) {
    console.error("Fallo de red o error de proceso de Gemini:", error.message);
    throw error;
  }
}

async function openAIChat(messages) {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY ausente');
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0,
      max_tokens: 1024
    })
  });
  if (!resp.ok) throw new Error(`OpenAI error ${resp.status}: ${await resp.text()}`);
  const json = await resp.json();
  return json.choices?.[0]?.message?.content ?? '';
}

// Función para extraer el SQL limpio y el comando de acción
function extractSqlFromText(text) {
  // 1. Separar la explicación del SQL/Acción
  const parts = text.split('-- RESULT_SEPARATOR --');
  if (parts.length < 2) {
    return {
      explanation: text,
      sql: null,
      action: null
    };
  }

  const explanationPart = parts[0].trim();
  const sqlActionPart = parts[1];

  // 2. Extraer el bloque de código SQL
  const sqlMatch = sqlActionPart.match(/```sql\s*([\s\S]*?)```/);
  let sql = sqlMatch && sqlMatch[1] ? sqlMatch[1].trim() : null;

  // 3. CORRECCIÓN: Limpiar el SQL eliminando todos los puntos y coma
  if (sql) {
    // Eliminar todos los puntos y coma
    sql = sql.replace(/;/g, '');
    // Eliminar comentarios de acción dentro del SQL
    sql = sql.replace(/--\s*ACTION:.*$/gm, '');
    // Limpiar espacios
    sql = sql.trim();
  }

  // 4. Extraer el comentario de acción
  const actionMatch = sqlActionPart.match(/-- ACTION:\s*(GENERATE_XLSX_URL)/);
  const action = actionMatch ? actionMatch[1] : null;

  return {
    explanation: explanationPart,
    sql,
    action
  };
}

// NUEVA FUNCIÓN: Genera sugerencias de navegación
function getNavigationSuggestions(query) {
  const lowerCaseQuery = query.toLowerCase();
  const suggestions = [];

  // Sugerencia 1: Profesionales
  if (lowerCaseQuery.includes("profesional") || lowerCaseQuery.includes("medico") || lowerCaseQuery.includes("enfermero")) {
    suggestions.push({
      type: "navigate",
      tab: "professionals",
      label: "Ver Listado de Profesionales",
      filters: {}
    });
  }

  // Sugerencia 2: Centros de Salud
  if (lowerCaseQuery.includes("centro") || lowerCaseQuery.includes("hospital") || lowerCaseQuery.includes("clinica")) {
    suggestions.push({
      type: "navigate",
      tab: "health-centers",
      label: "Ver Centros de Salud",
      filters: {}
    });
  }

  // Sugerencia 3: Guardias
  if (lowerCaseQuery.includes("guardia") || lowerCaseQuery.includes("turno")) {
    suggestions.push({
      type: "navigate",
      tab: "guardias",
      label: "Ver Planificación de Guardias",
      filters: {}
    });
  }

  return suggestions;
}

// Función principal de manejo de la función
serve(async (req) => {
  // Manejo de CORS (Preflight request)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const { messages } = await req.json();

    // 1. Obtener el prompt del sistema y el último mensaje del usuario
    const systemPrompt = buildEnhancedSystemPrompt();
    const latestUserMessage = messages[messages.length - 1].content;

    // 2. Crear el prompt completo para Gemini
    const fullGeminiPrompt = `${systemPrompt}\n\nUSER QUERY:\n${latestUserMessage}`;

    // 3. Generar la respuesta de Gemini
    const geminiResponseText = await geminiGenerateText(fullGeminiPrompt);

    // 4. Extraer la explicación, el SQL y la acción
    const { explanation, sql, action } = extractSqlFromText(geminiResponseText);

    // 5. Generar sugerencias de navegación
    const navigationSuggestions = getNavigationSuggestions(latestUserMessage);

    let finalResponse;

    if (sql) {
      // 6. Si se genera SQL, ejecutarlo
      // El RPC 'exec_sql' debe ser capaz de ejecutar cualquier consulta SELECT
      const { data: dbData, error: dbError } = await supabase.rpc('exec_sql', {
        query: sql
      });

      if (dbError) {
        console.error('Error ejecutando SQL en DB:', dbError);
        // OBJETO DE RESPUESTA PARA ERROR DE DB (claves alineadas)
        finalResponse = {
          natural_language_response: `❌ Error de Base de Datos: La consulta SQL falló (${dbError.code}). Por favor, reformula tu pregunta.`,
          sql: sql,
          action: null,
          error: dbError.message,
          result: null,
          navigationSuggestions: navigationSuggestions
        };
      } else {
        // OBJETO DE RESPUESTA PARA ÉXITO (claves alineadas)
        finalResponse = {
          natural_language_response: explanation,
          sql: sql,
          action: action,
          result: dbData,
          error: null,
          navigationSuggestions: navigationSuggestions
        };
      }
    } else {
      // OBJETO DE RESPUESTA SI NO HAY SQL (claves alineadas)
      finalResponse = {
        natural_language_response: explanation,
        sql: null,
        action: null,
        result: null,
        error: null,
        navigationSuggestions: navigationSuggestions
      };
    }

    // Devolver la respuesta al cliente
    return new Response(JSON.stringify(finalResponse), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    // Manejo de errores de la función
    const errorBody = {
      message: "Error interno del servidor",
      detail: error.message,
      stack: error.stack
    };
    console.error("Error en el Edge Function:", error.message);
    return new Response(JSON.stringify(errorBody), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});