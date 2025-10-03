import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// --- 1. CONFIGURACIÓN Y VARIABLES DE ENTORNO ---
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY"); // Mantenido por compatibilidad si es necesario
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// --- 2. ESQUEMA DETALLADO ---
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
// --- 3. PROMPT DEL SISTEMA (FASE 1: SQL + BORRADOR + CANONICAL FILTERS) ---
function buildEnhancedSystemPrompt() {
  const schemaString = JSON.stringify(ENHANCED_SCHEMA, null, 2);
  const toolDefinition = `
  ACCIÓN DISPONIBLE: GENERAR_REPORTE_XLSX
  
  1. Uso: Si el usuario solicita EXPRESAMENTE un reporte, tabla o listado para descargar en formato Excel (XLSX, XLS).
  2. Respuesta de la IA: Siempre debe constar de TRES PARTES SEPARADAS:
    a) **Explicación (BORRADOR de Lenguaje Natural):** Una explicación muy breve de lo que la consulta va a obtener. Esta explicación debe ir seguida de la línea: \`-- RESULT_SEPARATOR --\`
    b) **SQL + Acción:** La sentencia SQL (dentro de un bloque \`\`\`sql) para obtener los datos, seguida inmediatamente por el comentario de acción en una nueva línea, si aplica. Esta parte debe ir seguida de la línea: \`-- CANONICAL_FILTERS_SEPARATOR --\`
    c) **Filtros Canónicos (JSON):** Un objeto JSON con los valores CANÓNICOS y en MAYÚSCULAS para los filtros de navegación, si aplican. Los campos que DEBEN ser revisados y corregidos (si hay errores tipográficos) son: **center_name_filter, institucion, distrito_sanitario, pais_formacion, categoria_titulacion**. Estos valores deben ser la versión más probable y **libre de errores tipográficos** de la base de datos para garantizar que la navegación funcione. Si un filtro no es textual (ej: edad, booleano), no lo incluyas aquí.

  REGLAS ESTRICTAS:
  1. **SIEMPRE incluye las tres partes y los dos separadores.**
  2. Si NO se pide un Excel, la IA devuelve el SQL sin el comentario \`-- ACTION: GENERATE_XLSX_URL\`.
  3. Utiliza EXCLUSIVAMENTE las tablas y columnas del schema.
  4. **REGLA FUZZY ILIKE MODIFICADA:** Para búsquedas de texto (nombres, centros, instituciones, distritos) utiliza la sintaxis de búsqueda **FUZZY ILIKE** que incluya insensibilidad a mayúsculas, acentos y errores tipográficos. En PostgreSQL, esto se implementa con **ILIKE** para insensibilidad O el operador de similitud **%** (si se busca por nombre completo o parte del nombre). Por defecto, usa **ILIKE** para coincidencia parcial (\`ILIKE '%palabra%'\`) y considera el uso del operador **%** (Ej: \`nombre_completo % 'nombre'\`) para la máxima tolerancia a errores en la base de datos.
  
  **IMPORTANTE: Analiza la conversación completa para mantener el contexto. Si una consulta es ambigua (ej: 'dame los nombres') pero las consultas previas establecieron filtros (ej: mujeres > 25, Hospital X), MANTÉN esos filtros en el SQL generado.**
  `;
  return `Eres un asistente SQL experto. Tu respuesta debe incluir SIEMPRE las tres partes. Sigue estrictamente el formato y las reglas:\n\nCONTEXTO DEL DOMINIO:\n${schemaString}\n\nREGLAS DE TRABAJO (IGNORAR SI YA ESTÁN EN EL PROMPT):\n${toolDefinition}`;
}
// --- 4. FUNCIONES MODULARES (Gemini) ---
// FUNCIÓN ACTUALIZADA PARA ACEPTAR EL HISTORIAL DE CHAT
async function geminiGenerateText(systemPrompt, chatHistory) {
  if (!GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY ausente. Esto causará un fallo de autenticación.');
    throw new Error('GEMINI_API_KEY ausente');
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  // 1. Convertir el historial en el formato de la API de Gemini
  const formattedContents = chatHistory.map((msg) => ({
    // Mapear 'assistant' a 'model'
    role: msg.role === 'assistant' ? 'model' : 'user',
    // Usar 'content' del mensaje
    parts: [
      {
        text: msg.content
      }
    ]
  }));
  // 2. Prependizar el prompt del sistema (esquema y reglas) como el primer turno del usuario.
  const finalContents = [
    {
      role: 'user',
      parts: [
        {
          text: systemPrompt
        }
      ]
    },
    ...formattedContents
  ];

  // LOG: Registra la llamada a la API de Gemini para la generación de SQL (Fase 1)
  console.log(`LOG: Llamando a Gemini (Fase 1 - SQL) con ${finalContents.length} mensajes. System Prompt Length: ${systemPrompt.length}`);

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: finalContents,
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 1024
        }
      })
    });
    if (!resp.ok) {
      const errorText = await resp.text();
      console.error(`ERROR GEMINI HTTP: Status ${resp.status}`);
      throw new Error(`Gemini error ${resp.status}: ${errorText}`);
    }
    const json = await resp.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    // LOG: Registra la respuesta RAW recibida de Gemini (Fase 1)
    console.log(`LOG: Respuesta RAW de Gemini (Fase 1): ${text.substring(0, 500)}...`);
    return text;
  } catch (error) {
    console.error("Fallo de red o error de proceso de Gemini:", error.message);
    throw error;
  }
}
// Función para extraer el SQL, el comando de acción y los filtros canónicos
function extractDualOutputFromText(text) {
  const [explanationAndSQLPart, canonicalFiltersPart] = text.split('-- CANONICAL_FILTERS_SEPARATOR --');
  // 1. Separar la explicación del SQL/Acción
  const parts = explanationAndSQLPart.split('-- RESULT_SEPARATOR --');
  const explanationPart = parts.length > 0 ? parts[0].trim() : text;
  const sqlActionPart = parts.length > 1 ? parts[1] : '';
  // 2. Extraer el bloque de código SQL
  const sqlMatch = sqlActionPart.match(/```sql\s*([\s\S]*?)```/);
  let sql = sqlMatch && sqlMatch[1] ? sqlMatch[1].trim() : null;
  // 3. Limpiar el SQL
  if (sql) {
    sql = sql.replace(/;/g, '');
    sql = sql.replace(/--\s*ACTION:.*$/gm, '');
    sql = sql.trim();
  }
  // 4. Extraer el comentario de acción
  const actionMatch = sqlActionPart.match(/-- ACTION:\s*(GENERATE_XLSX_URL)/);
  const action = actionMatch ? actionMatch[1] : null;
  // 5. Extraer y parsear los Filtros Canónicos
  let canonicalFilters = {};
  if (canonicalFiltersPart) {
    try {
      // Intenta encontrar un bloque JSON y parsearlo
      const jsonMatch = canonicalFiltersPart.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        canonicalFilters = JSON.parse(jsonMatch[0].trim());
        // LOG: Registra los filtros canónicos extraídos y corregidos por la IA
        console.log("LOG: Filtros Canónicos extraídos:", JSON.stringify(canonicalFilters));
      }
    } catch (e) {
      console.error("Error parsing canonical filters JSON:", e.message);
      // En caso de error, devuelve un objeto vacío, no bloqueamos la ejecución.
    }
  }
  return {
    explanation: explanationPart,
    sql,
    action,
    canonicalFilters
  };
}
// --- FASE 2: Generación de respuesta fluida con el resultado (SIN NEGRITAS) ---
async function generateFinalNaturalResponse(originalQuery, sqlResult, navigationSuggestions) {
  const resultJson = JSON.stringify(sqlResult, null, 2);
  const finalPrompt = `
    Eres un experto en comunicación que traduce datos SQL a lenguaje natural y profesional.

    ---
    Consulta del Usuario: "${originalQuery}"
    Resultado de la Base de Datos (JSON, hasta 5 registros para contexto):
    ${resultJson.slice(0, 1000)} 
    ---
    
    Tarea: Genera una **respuesta final y natural** para el usuario.
    
    Reglas de la respuesta:
    1. La respuesta debe ser **fluida, profesional y amigable** (Ej: "El número total de... es de 5.").
    2. Debe **incluir explícitamente el resultado numérico** o un resumen claro del JSON.
    3. NO uses frases como "La siguiente consulta le mostrará" o "Basado en los datos...".
    4. El resultado final debe estar integrado de forma natural, **SIN NEGRITAS ni ningún otro tipo de formato.**
    5. Termina la respuesta con la frase: "**¡Acciones Sugeridas disponibles debajo!**" si hay sugerencias de navegación. Si no hay sugerencias, omite esa frase.
  `;

  // LOG: Registra la llamada a Gemini para la explicación final (Fase 2)
  console.log(`LOG: Llamando a Gemini (Fase 2 - N.L.) con prompt de ${finalPrompt.length} caracteres y ${sqlResult ? sqlResult.length : 0} resultados de DB.`);

  return await geminiGenerateText(finalPrompt, [
    {
      role: 'user',
      content: finalPrompt
    }
  ]); // Se usa la función anterior, pero como no hay historial para esta fase, se simula un turno único.
}
// Helpers de extracción de filtros locales (solo para campos NO textuales)
function normalizeText(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
const KNOWN_PROVINCES = [
  'Annobon',
  'Annobón',
  'Bioko Norte',
  'Bioko Sur',
  'Centro Sur',
  'Kie-Ntem',
  'Kié-Ntem',
  'Litoral',
  'Wele-Nzas',
  'Welé-Nzas'
];
// Esta función ya no tiene que preocuparse por la mayúscula/minúscula de los textos
// solo extrae los campos que la IA podría pasar por alto (edades, booleanos)
function extractSimpleFiltersFromQuery(query) {
  const text = query || '';
  const norm = normalizeText(text);
  const filters = {};
  // Provincia
  for (const prov of KNOWN_PROVINCES) {
    const provNorm = normalizeText(prov);
    if (norm.includes(provNorm)) {
      const mapClean = {
        'annobon': 'Annobon',
        'bioko norte': 'Bioko Norte',
        'bioko sur': 'Bioko Sur',
        'centro sur': 'Centro Sur',
        'kie-ntem': 'Kie-Ntem',
        'kie ntem': 'Kie-Ntem',
        'litoral': 'Litoral',
        'wele-nzas': 'Wele-Nzas',
        'wele nzas': 'Wele-Nzas'
      };
      // Aquí se mantiene la capitalización legible, ya que es la menos problemática.
      filters.provincia = mapClean[provNorm] || prov.replace('Kié', 'Kie').replace('Welé', 'Wele');
      break;
    }
  }
  // Edad: mayores de X, menores de X, entre X y Y
  const mMayores = norm.match(/mayor(?:es)?\s+de\s+(\d{1,3})/);
  if (mMayores) {
    const v = parseInt(mMayores[1], 10);
    if (!isNaN(v)) filters.edad_minima = Math.max(0, v + 1);
  }
  const mMenores = norm.match(/menor(?:es)?\s+de\s+(\d{1,3})/);
  if (mMenores) {
    const v = parseInt(mMenores[1], 10);
    if (!isNaN(v)) filters.edad_maxima = Math.max(0, v - 1);
  }
  const mEntre = norm.match(/entre\s+(\d{1,3})\s*(?:y|e|-)\s*(\d{1,3})/);
  if (mEntre) {
    const a = parseInt(mEntre[1], 10);
    const b = parseInt(mEntre[2], 10);
    if (!isNaN(a) && !isNaN(b)) {
      filters.edad_minima = Math.min(a, b);
      filters.edad_maxima = Math.max(a, b);
    }
  }
  // GÉNERO
  if (/\b(mujer(?:es)?|femenin(?:o|a)?)\b/.test(norm)) filters.genero = 'Femenino';
  if (/\b(hombre|varon|masculin(?:o)?)\b/.test(norm)) filters.genero = 'Masculino';
  // Sector / función pública (Booleanos/Enums)
  if (/(funcion\s*publica|funcionarios?)/.test(norm)) filters.funcion_publica = true;
  if (/(\bsector\s+publico\b|\bpublico\b)/.test(norm)) filters.tipo_sector = 'Público';
  if (/(\bsector\s+privado\b|\bprivado\b)/.test(norm)) filters.tipo_sector = 'Privado';
  // Estatus funcionario
  if (/(\bnombrado\b)/.test(norm)) filters.estatus_funcionario = 'nombrado';
  if (/(no\s*nombrado)/.test(norm)) filters.estatus_funcionario = 'no_nombrado';
  // Resto de filtros (no textuales ni nombres propios)
  const mYear = norm.match(/(a(n|ñ)o\s+de\s+graduaci(o|ó)n|graduad[oa]s?\s+en)\s+(\d{4})/);
  if (mYear) filters.año_graduacion = parseInt(mYear[4], 10);
  if (/vencid[oa]s?/.test(norm)) filters.carnet_vencido = true;
  if (/(proxim[oa]s?\s+a\s+vencer|vence\s+pronto)/.test(norm)) filters.vencimiento_proximo = true;
  const mPrio = norm.match(/prioridad\s+(alta|media|baja)/);
  if (mPrio) filters.prioridad_renovacion = mPrio[1];
  // Filtros de cálculo de edad/servicio (numéricos)
  const mEdadLabMin = norm.match(/edad\s+laboral\s+(?:mayor|superior)\s+a?\s*(\d{1,2})/);
  if (mEdadLabMin) filters.edad_laboral_min = parseInt(mEdadLabMin[1], 10);
  const mEdadLabMax = norm.match(/edad\s+laboral\s+(?:menor|inferior)\s+a?\s*(\d{1,2})/);
  if (mEdadLabMax) filters.edad_laboral_max = parseInt(mEdadLabMax[1], 10);
  const mServMin = norm.match(/a(n|ñ)os?\s+de\s+servicio\s+(?:mayor|superior)\s+a?\s*(\d{1,2})/);
  if (mServMin) filters.años_servicio_min = parseInt(mServMin[2] || mServMin[1], 10) || parseInt(mServMin[1], 10);
  const mServMax = norm.match(/a(n|ñ)os?\s+de\s+servicio\s+(?:menor|inferior)\s+a?\s*(\d{1,2})/);
  if (mServMax) filters.años_servicio_max = parseInt(mServMax[2] || mServMax[1], 10) || parseInt(mServMax[1], 10);
  const mRestMin = norm.match(/(años|anos)\s+restantes\s+(?:hasta\s+)?jubilaci(o|ó)n\s+(?:menor|inferior)\s+a?\s*(\d{1,2})/);
  if (mRestMin) filters.años_restantes_jubilacion_max = parseInt(mRestMin[3], 10);
  const mRestMax = norm.match(/(años|anos)\s+restantes\s+(?:hasta\s+)?jubilaci(o|ó)n\s+(?:mayor|superior)\s+a?\s*(\d{1,2})/);
  if (mRestMax) filters.años_restantes_jubilacion_min = parseInt(mRestMax[3], 10);
  return filters;
}
// --- FUNCIÓN PARA SUGERENCIAS DE NAVEGACIÓN (AHORA USA FILTROS CANÓNICOS) ---
function getNavigationSuggestions(query, canonicalFilters) {
  const lowerCaseQuery = (query || '').toLowerCase();
  // 1. Extraer filtros simples (numéricos, booleanos, enums simples)
  const simpleFilters = extractSimpleFiltersFromQuery(query);
  // 2. Combinar filtros simples con los filtros canónicos corregidos por la IA (sobrescriben los de texto)
  const parsedFilters = {
    ...simpleFilters,
    ...canonicalFilters
  };
  const suggestions = [];
  // Se asume que si la IA ha devuelto filtros canónicos, o si la query incluye palabras clave,
  // la intención es consultar profesionales.
  const isProfessionalQuery = lowerCaseQuery.includes('profesional') || lowerCaseQuery.includes('medico') || lowerCaseQuery.includes('médico') || lowerCaseQuery.includes('enfermero') || parsedFilters.area_profesional || Object.keys(parsedFilters).length > 0;
  const isCenterQuery = lowerCaseQuery.includes('centro') || lowerCaseQuery.includes('hospital') || lowerCaseQuery.includes('clinica') || lowerCaseQuery.includes('clínica') || parsedFilters.center_name_filter;
  // 1. Profesionales (con todos los filtros relevantes)
  if (isProfessionalQuery || Object.keys(parsedFilters).length > 0) {
    suggestions.push({
      type: 'navigate',
      tab: 'professionals',
      label: 'Ver Profesionales (con filtros)',
      filters: {
        ...parsedFilters,
        // Eliminamos filtros que no aplican directamente al listado de profesionales
        distrito: undefined,
        tipo_sector: undefined,
        categoria_centro: undefined
      }
    });
  }
  // 2. Centros de Salud (Supresión de redundancia cuando la consulta es muy específica de profesionales)
  const hasSpecificCenterFilter = parsedFilters.center_name_filter || parsedFilters.distrito_sanitario;
  if (isCenterQuery && !(isProfessionalQuery && hasSpecificCenterFilter)) {
    const centerFilters = {};
    if (parsedFilters.provincia) centerFilters.provincia = parsedFilters.provincia;
    if (parsedFilters.distrito) centerFilters.distrito = parsedFilters.distrito;
    if (parsedFilters.distrito_sanitario) centerFilters.distrito_sanitario = parsedFilters.distrito_sanitario;
    if (parsedFilters.tipo_sector) centerFilters.tipo_sector = parsedFilters.tipo_sector;
    if (parsedFilters.categoria_centro) centerFilters.categoria_centro = parsedFilters.categoria_centro;
    if (parsedFilters.center_name_filter) centerFilters.center_name_filter = parsedFilters.center_name_filter;
    suggestions.push({
      type: 'navigate',
      tab: 'health-centers',
      label: 'Ver Centros de Salud (con filtros)',
      filters: centerFilters
    });
  }
  // 3. Guardias
  if (lowerCaseQuery.includes('guardia') || lowerCaseQuery.includes('turno')) {
    suggestions.push({
      type: 'navigate',
      tab: 'guardias',
      label: 'Ver Planificación de Guardias',
      filters: {}
    });
  }
  // Deduplicar sugerencias
  return suggestions.filter((s, i, arr) => arr.findIndex((t) => t.tab === s.tab) === i);
}
// --- FUNCIÓN PRINCIPAL DE MANEJO DE LA FUNCIÓN ---
serve(async (req) => {
  // Manejo de CORS (Preflight request)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // LOG: Registra el inicio del proceso para cada solicitud.
  console.log(`\n--- LOG INICIO DE SOLICITUD (${new Date().toISOString()}) ---`);

  try {
    // EL OBJETO 'messages' AHORA CONTIENE TODO EL HISTORIAL DE CHAT
    const { messages } = await req.json();
    // 1. Obtener el prompt del sistema y el último mensaje del usuario
    const systemPrompt = buildEnhancedSystemPrompt();
    const latestUserMessage = messages[messages.length - 1].content; // Necesario para la extracción local de filtros

    // LOG: Registra la última consulta del usuario.
    console.log(`LOG: Última Consulta del Usuario: "${latestUserMessage}"`);
    console.log(`LOG: Historial de mensajes (incluido): ${messages.length}`);

    // **FASE 1: GENERACIÓN DE SQL + BORRADOR DE EXPLICACIÓN + FILTROS CANÓNICOS**
    // LLAMADA CLAVE: Se pasa el systemPrompt y TODO el historial de 'messages' para darle memoria a la IA.
    const geminiResponseText = await geminiGenerateText(systemPrompt, messages);
    const { explanation, sql, action, canonicalFilters } = extractDualOutputFromText(geminiResponseText); // <-- Obtener filtros canónicos aquí

    // LOG: Registra los resultados clave de la Fase 1.
    console.log(`LOG: SQL extraído (Fase 1): ${sql ? sql.substring(0, 100) + '...' : 'NULL'}`);
    console.log(`LOG: Acción solicitada (Fase 1): ${action}`);

    // 2. Generar sugerencias de navegación usando los filtros canónicos corregidos por la IA
    const navigationSuggestions = getNavigationSuggestions(latestUserMessage, canonicalFilters); // <-- Pasando filtros canónicos
    let finalResponse;

    if (sql) {
      // 3. Ejecutar SQL en la DB
      // LOG: Registra la ejecución de SQL en Supabase
      console.log(`LOG: Ejecutando SQL en DB...`);

      // NOTA: 'exec_sql' es una función RPC de Supabase que encapsula la ejecución de SQL.
      const { data: dbData, error: dbError } = await supabase.rpc('exec_sql', {
        query: sql
      });

      if (dbError) {
        // LOG: Registra el error de ejecución de SQL.
        console.error('ERROR DB: Error ejecutando SQL en DB:', dbError.message);

        // OBJETO DE RESPUESTA PARA ERROR DE DB
        finalResponse = {
          natural_language_response: `❌ Error de Base de Datos: La consulta SQL falló (${dbError.code}). Por favor, reformula tu pregunta.`,
          sql: sql,
          action: null,
          error: dbError.message,
          result: null,
          navigationSuggestions: navigationSuggestions
        };
      } else {
        // LOG: Registra el éxito de la consulta SQL y el número de resultados.
        console.log(`LOG: SQL Exitoso. Filas retornadas: ${dbData ? dbData.length : 0}`);

        // **FASE 2: GENERAR RESPUESTA NATURAL FLUÍDA CON RESULTADO**
        let finalExplanation;
        if (dbData && dbData.length > 0) {
          // LLAMADA A LA IA CON EL RESULTADO
          // Nota: Para la respuesta final, la IA no necesita el historial, solo la última consulta y el resultado.
          const fluentResponse = await generateFinalNaturalResponse(latestUserMessage, dbData, navigationSuggestions);
          finalExplanation = fluentResponse.trim();
        } else {
          // Si no hay datos, usamos la explicación original (borrador) con un mensaje de no resultados.
          finalExplanation = `✅ Consulta Exitosa. No se encontraron registros que coincidan con la búsqueda.`;
          if (navigationSuggestions.length > 0) {
            finalExplanation += "\n\n**¡Acciones Sugeridas disponibles debajo!**";
          }
        }
        // OBJETO DE RESPUESTA PARA ÉXITO
        finalResponse = {
          natural_language_response: finalExplanation,
          sql: sql,
          action: action,
          result: dbData,
          error: null,
          navigationSuggestions: navigationSuggestions
        };
      }
    } else {
      // LOG: Registra si no se pudo generar SQL.
      console.log('LOG: No se generó SQL (posiblemente la pregunta no lo requería).');

      // OBJETO DE RESPUESTA SI NO HAY SQL
      finalResponse = {
        natural_language_response: explanation,
        sql: null,
        action: null,
        result: null,
        error: null,
        navigationSuggestions: navigationSuggestions
      };
    }

    // LOG: Registra el objeto de respuesta final antes de enviarlo.
    console.log(`LOG: Respuesta Final Enviada. N.L. Response Length: ${finalResponse.natural_language_response.length}`);
    console.log(`--- LOG FIN DE SOLICITUD ---`);

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
    // LOG: Registra el error fatal de la función.
    console.error("FATAL ERROR en el Edge Function:", error.message, error.stack);
    console.log(`--- LOG FIN DE SOLICITUD CON ERROR 500 ---`);

    return new Response(JSON.stringify(errorBody), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
