
// Tipos unificados para todas las estadísticas del sistema
export interface EstadisticasData {
  total: number;
  aprobados: number;
  pendientes: number;  // Pendiente de Firma
  recibidos: number;
  rechazados: number;
  revisando: number;
  vencimientosProximos: number;
  carnetVencidos: number;
  porArea: Record<string, number>;
  porProvincia: Record<string, number>;
  generoMasculino: number;
  generoFemenino: number;
  totalPorGenero: Record<string, number>;
  totalPorDistrito: Record<string, number>;
  totalPorTipoSector: Record<string, number>;
  totalPorNacionalidad: Record<string, number>;
  totalPorAreaProfesional: Record<string, number>;
  totalPorEstadoSolicitud: Record<string, number>;
  totalPorDistritoSanitario: Record<string, number>;
  datosGraficoProvincias: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  datosGraficoAreas: Array<{
    area: string;
    cantidad: number;
  }>;
  datosGraficoEstados: Array<{
    estado: string;
    cantidad: number;
    color: string;
  }>;
  tendenciasMensuales: Array<{
    mes: string;
    registros: number;
  }>;
  tasaAprobacion: string;
  tasaRechazo: string;
  porGenero?: Record<string, number>;
  porTipoSector?: Record<string, number>;
  porDistrito?: Record<string, number>;
  porAnoGraduacion?: Record<string, number>;
  sampleData?: Array<{
    id: string;
    estado_solicitud: string;
  }>;
}

export interface Professional {
  id: string;
  nombre_completo: string;
  area_profesional: string;
  estado_solicitud: string;
  telefono?: string;
  fecha_alta?: string;
  documento_identidad: string;
  lugar_trabajo: string;
  [key: string]: any; // Para propiedades adicionales
}
