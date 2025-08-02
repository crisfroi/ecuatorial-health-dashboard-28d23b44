/**
 * ANÁLISIS COMPLETO DE TODAS LAS MÉTRICAS Y ESTADÍSTICAS DISPONIBLES
 * 
 * Este archivo contiene un análisis exhaustivo de todas las tablas de Supabase
 * y las métricas que se pueden extraer para el AI Chat y análisis avanzados.
 */

export interface MetricCategory {
  category: string;
  description: string;
  tables: string[];
  metrics: string[];
  possibleFilters: string[];
  timeRanges: string[];
}

export const AVAILABLE_METRICS: MetricCategory[] = [
  {
    category: "PROFESIONALES SANITARIOS",
    description: "Datos completos de profesionales sanitarios registrados",
    tables: ["profesionales_sanitarios", "busqueda_profesionales_publica"],
    metrics: [
      // Datos demográficos
      "Total de profesionales registrados",
      "Profesionales por género (masculino/femenino)",
      "Distribución por edad (rangos 20-30, 30-40, 40-50, 50-60, 60+)",
      "Edad promedio de profesionales",
      "Profesionales por nacionalidad",
      "Profesionales extranjeros vs nacionales",
      
      // Estados y solicitudes
      "Profesionales por estado de solicitud (Aprobado, Recibido, Rechazado, En Revisión)",
      "Tasa de aprobación de solicitudes",
      "Tasa de rechazo de solicitudes",
      "Tiempo promedio de procesamiento de solicitudes",
      "Solicitudes pendientes por tiempo de espera",
      "Urgencia de solicitudes",
      
      // Ubicación geográfica
      "Profesionales por provincia",
      "Profesionales por distrito",
      "Profesionales por distrito sanitario",
      "Densidad de profesionales por región",
      
      // Formación académica
      "Profesionales por área profesional",
      "Profesionales por especialidad",
      "Profesionales por categoría de titulación",
      "Profesionales por país de formación",
      "Profesionales por institución de formación",
      "Años de graduación - distribución temporal",
      "Tipos de formación (pregrado, posgrado, especialización)",
      
      // Situación laboral
      "Profesionales por situación laboral (Activo, Desempleado, Jubilado)",
      "Profesionales en paro - estadísticas",
      "Tiempo promedio en desempleo",
      "Profesionales por centro de trabajo",
      "Profesionales por tipo de sector (Público, Privado, Mixto)",
      "Profesionales por categoría de centro",
      
      // Cooperación internacional
      "Profesionales en brigadas médicas",
      "Tipos de cooperación internacional",
      "Cooperantes por país de destino",
      
      // Documentación y validez
      "Profesionales con documentación completa",
      "Carnets próximos a vencer (30 días)",
      "Carnets vencidos",
      "Profesionales con documentos adicionales",
      "Validez de carnets por rango de fechas"
    ],
    possibleFilters: [
      "estado_solicitud", "genero", "edad", "nacionalidad", "provincia", 
      "distrito", "distrito_sanitario", "area_profesional", "especialidad",
      "categoria_titulacion", "pais_formacion_1", "institucion_1", 
      "situacion_laboral", "tipo_sector", "categoria_centro", "año_graduacion"
    ],
    timeRanges: [
      "fecha_solicitud", "fecha_aprobacion", "fecha_nacimiento", 
      "fecha_caducidad", "fecha_validez_carnet", "created_at", "updated_at"
    ]
  },
  
  {
    category: "CENTROS DE SALUD",
    description: "Datos de centros de salud y su infraestructura",
    tables: ["centros_salud", "profesional_centro_asignado"],
    metrics: [
      // Distribución de centros
      "Total de centros de salud",
      "Centros por categoría (Hospital, Clínica, Centro de Salud, Consultorio, Farmacia, Laboratorio)",
      "Centros por provincia",
      "Centros por distrito sanitario",
      "Centros por sector (Público, Privado, Mixto, ONG)",
      
      // Capacidad y cobertura
      "Profesionales por centro",
      "Centros con mayor número de profesionales",
      "Centros sin profesionales asignados",
      "Promedio de profesionales por centro",
      "Cobertura de profesionales por distrito",
      
      // Especialidades y servicios
      "Especialidades disponibles por centro",
      "Centros por tipo de especialidad",
      "Centros con servicios completos vs especializados",
      
      // Gestión y contacto
      "Centros con director asignado",
      "Centros con información de contacto completa",
      "Centros pendientes de validación",
      "Centros validados vs no validados"
    ],
    possibleFilters: [
      "categoria", "provincia", "distrito", "distrito_sanitario", 
      "sector", "estado", "especialidades"
    ],
    timeRanges: ["created_at", "updated_at"]
  },

  {
    category: "INCIDENCIAS",
    description: "Gestión de incidencias hospitalarias y de profesionales",
    tables: ["incidencias_hospitalarias"],
    metrics: [
      // Tipos de incidencias
      "Total de incidencias reportadas",
      "Incidencias por tipo",
      "Incidencias por gravedad (Baja, Media, Alta, Crítica)",
      "Incidencias por estado (Abierta, En Proceso, Resuelta, Cerrada)",
      
      // Tiempos de resolución
      "Tiempo promedio de resolución",
      "Incidencias resueltas vs pendientes",
      "Incidencias por antigüedad",
      "SLA de resolución por gravedad",
      
      // Involucrados
      "Incidencias por profesional reportador",
      "Incidencias por profesional resolutor",
      "Profesionales con más incidencias",
      
      // Tendencias temporales
      "Incidencias por mes/trimestre/año",
      "Picos de incidencias por período",
      "Estacionalidad de incidencias"
    ],
    possibleFilters: [
      "tipo_incidencia", "gravedad", "estado", "id_profesional",
      "reportado_por", "resuelto_por"
    ],
    timeRanges: [
      "fecha_incidencia", "fecha_resolucion", "created_at", "updated_at"
    ]
  },

  {
    category: "GENERACIÓN DE CARNETS",
    description: "Proceso de generación y gestión de carnets profesionales",
    tables: ["carnets_generados", "cola_generacion_carnets"],
    metrics: [
      // Producción de carnets
      "Total de carnets generados",
      "Carnets generados por período",
      "Tasa de generación exitosa vs fallida",
      "Tiempo promedio de generación",
      
      // Cola de procesamiento
      "Carnets en cola de generación",
      "Carnets con errores de generación",
      "Intentos de generación por carnet",
      "Carnets pendientes por tiempo de espera",
      
      // Calidad del proceso
      "Tasa de éxito en primera generación",
      "Errores más comunes en generación",
      "Profesionales sin carnet generado"
    ],
    possibleFilters: ["estado", "profesional_id"],
    timeRanges: ["fecha_generacion", "created_at", "updated_at"]
  },

  {
    category: "DATOS GEOGRÁFICOS",
    description: "Información geográfica y administrativa",
    tables: ["distrito_sanitario", "nacionalidades_mundo", "nacionalidades_gentilicios"],
    metrics: [
      // Distribución geográfica
      "Provincias con mayor concentración de profesionales",
      "Distritos sanitarios y su cobertura",
      "Mapas de calor por concentración profesional",
      
      // Diversidad internacional
      "Nacionalidades representadas",
      "Países de origen de profesionales",
      "Distribución de profesionales extranjeros",
      "Países de formación académica"
    ],
    possibleFilters: [
      "nombre_provincia", "nombre_distrito", "nacionalidad", "pais"
    ],
    timeRanges: []
  },

  {
    category: "CATEGORÍAS Y CLASIFICACIONES",
    description: "Sistemas de clasificación y categorización",
    tables: ["categorias_titulacion"],
    metrics: [
      // Titulaciones
      "Distribución por categoría de titulación",
      "Colores asignados por categoría",
      "Profesionales por nivel académico",
      "Evolución de categorías en el tiempo"
    ],
    possibleFilters: ["nombre", "codigo_color"],
    timeRanges: ["created_at", "updated_at"]
  },

  {
    category: "AUDITORÍA Y LOGS",
    description: "Registro de actividades y auditoría del sistema",
    tables: ["logs_sistema"],
    metrics: [
      // Actividad del sistema
      "Acciones realizadas en el sistema",
      "Errores registrados vs operaciones exitosas",
      "Frecuencia de uso por tipo de acción",
      "Patrones de actividad temporal",
      
      // Calidad del sistema
      "Tasa de errores del sistema",
      "Acciones más frecuentes",
      "Problemas recurrentes"
    ],
    possibleFilters: ["accion", "error"],
    timeRanges: ["fecha"]
  }
];

// Métricas calculadas y análisis avanzados
export const ADVANCED_ANALYTICS = {
  trends: [
    "Tendencia de registros mensuales/anuales",
    "Crecimiento de profesionales por área",
    "Evolución de la tasa de aprobación",
    "Proyección de renovaciones de carnets",
    "Análisis estacional de solicitudes"
  ],
  comparisons: [
    "Comparación inter-provincial",
    "Benchmarking entre distritos sanitarios", 
    "Análisis comparativo por sectores",
    "Comparación de tiempos de procesamiento",
    "Análisis de eficiencia por revisor"
  ],
  predictions: [
    "Predicción de demanda de carnets",
    "Estimación de necesidades por distrito",
    "Proyección de vencimientos",
    "Previsión de carga de trabajo",
    "Análisis predictivo de incidencias"
  ],
  crossAnalysis: [
    "Correlación edad-especialidad",
    "Relación formación-área de trabajo",
    "Análisis geografía-especialización",
    "Impacto de sector en tiempo de aprobación",
    "Relación nacionalidad-área profesional"
  ]
};

// Consultas complejas disponibles
export const COMPLEX_QUERIES = [
  "Profesionales aprobados por área profesional en un rango de fechas específico",
  "Centros de salud con déficit de profesionales por especialidad",
  "Análisis de cobertura sanitaria por distrito con proyección poblacional",
  "Identificación de áreas profesionales con mayor tiempo de procesamiento",
  "Análisis de movilidad profesional entre centros y provincias",
  "Evaluación de eficiencia del sistema de validación por revisor",
  "Detección de patrones en incidencias por centro y período",
  "Análisis de renovaciones programadas con alertas tempranas",
  "Evaluación de diversidad profesional por institución de formación",
  "Análisis de sostenibilidad del sistema por proyección demográfica"
];

export default AVAILABLE_METRICS;
