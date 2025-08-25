import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

// Helper function to detect network connectivity issues
const isNetworkError = (error: any): boolean => {
  if (!error) return false;

  // Check for common network error patterns
  const networkErrorPatterns = [
    'Failed to fetch',
    'TypeError: Failed to fetch',
    'Network request failed',
    'ERR_NETWORK',
    'ERR_INTERNET_DISCONNECTED',
    'Connection timeout',
    'Request timeout'
  ];

  const errorMessage = error.message || error.toString() || '';
  return networkErrorPatterns.some(pattern =>
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );
};

// Helper function to wait for a specified time (for retry logic)
const wait = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Enhanced retry function with exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // If it's not a network error, don't retry
      if (!isNetworkError(error)) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`🔄 Network error detected, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
      await wait(delay);
    }
  }

  throw lastError;
};

// Helper function to format Supabase errors properly
const formatSupabaseError = (error: any): string => {
  console.error('🔍 Debugging error object type:', typeof error, error);
  console.error('🔍 Error object keys:', Object.keys(error || {}));
  console.error('🔍 Error object JSON:', JSON.stringify(error, null, 2));

  if (!error) return 'Error desconocido';

  if (typeof error === 'string') return error;

  // Check for network errors first
  if (isNetworkError(error)) {
    console.log('🌐 Network error detected:', error.message);
    return 'Error de conectividad: No se pudo conectar al servidor. Verifique su conexión a internet y vuelva a intentarlo.';
  }

  // Handle HTTP status errors first
  if (error.status || error.statusCode) {
    const status = error.status || error.statusCode;
    console.log('🌐 HTTP Status found:', status);

    switch (status) {
      case 400:
        const badRequestMsg = error.message || error.details || error.hint || 'Datos de solicitud inválidos';
        return `Error 400: ${badRequestMsg}`;
      case 401:
        return 'Error 401: No autorizado - Verifique sus permisos';
      case 403:
        return 'Error 403: Acceso prohibido - Permisos insuficientes';
      case 404:
        return 'Error 404: Recurso no encontrado';
      case 422:
        const validationMsg = error.message || error.details || 'Error de validación de datos';
        return `Error 422: ${validationMsg}`;
      case 500:
        return 'Error 500: Error interno del servidor';
      default:
        const statusMsg = error.message || error.details || 'Error de servidor';
        return `Error ${status}: ${statusMsg}`;
    }
  }

  // Supabase error structure
  if (error.message) {
    console.log('📝 Error message found:', error.message);
    return error.message;
  }

  if (error.details) {
    console.log('📋 Error details found:', error.details);
    return error.details;
  }

  if (error.hint) {
    console.log('💡 Error hint found:', error.hint);
    return error.hint;
  }

  // PostgreSQL error codes
  if (error.code) {
    console.log('🏷️ Error code found:', error.code);
    switch (error.code) {
      case '23505':
        return 'Ya existe un registro con estos datos (duplicado)';
      case '23503':
        return 'Referencia a un registro que no existe (foreign key)';
      case '23502':
        return 'Campo requerido faltante en la base de datos (not null)';
      case '42P01':
        return 'La tabla no existe en la base de datos';
      case '42703':
        return 'Columna no encontrada en la tabla';
      case '42501':
        return 'Permisos insuficientes para realizar la operación';
      case '23514':
        // Special handling for constraint violations
        if (error.message && error.message.includes('guardias_duracion_check')) {
          return 'Duración de guardia inválida: Las guardias deben durar entre 12 y 24 horas. Verifique las horas de inicio y fin.';
        } else if (error.message && error.message.includes('guardias_fecha_check')) {
          return 'Fechas de guardia inválidas: La fecha de fin debe ser posterior a la fecha de inicio.';
        }
        return 'Violación de restricción de verificación (check constraint)';
      case '22001':
        return 'Dato demasiado largo para el campo';
      case '22007':
        return 'Formato de fecha/hora inválido';
      case '22P02':
        // Special handling for enum errors
        if (error.message && error.message.includes('invalid input value for enum')) {
          const enumMatch = error.message.match(/invalid input value for enum (\w+): "([^"]+)"/);
          if (enumMatch) {
            const [, enumType, invalidValue] = enumMatch;
            return `Valor "${invalidValue}" no válido para el tipo ${enumType}. Valores permitidos: dir_medica, dir_admin, dir_enfermeria, jefe_rrhh, admin_hospital, dir_gerente, dg_coordinacion`;
          }
        }
        return 'Valor inválido para el tipo de dato';
      default:
        const codeMsg = error.message || error.details || 'Error de base de datos';
        return `Error BD (${error.code}): ${codeMsg}`;
    }
  }

  // Try to extract meaningful info from error object
  if (error.error && error.error.message) {
    console.log('🔗 Nested error message found:', error.error.message);
    return error.error.message;
  }

  // If it's an HttpException with nested error
  if (error.name === 'HttpException' && error.message) {
    console.log('🌐 HTTP Exception found:', error.message);
    return error.message;
  }

  // Extract properties manually as last resort
  try {
    const errorProperties = [];
    for (const key in error) {
      if (error.hasOwnProperty(key)) {
        errorProperties.push(`${key}: ${error[key]}`);
      }
    }

    if (errorProperties.length > 0) {
      const errorStr = errorProperties.join(', ');
      console.error('🔍 Extracted error properties:', errorStr);
      return errorStr.length > 200 ?
        'Error de base de datos. Ver consola para detalles.' :
        errorStr;
    }

    // Ultimate fallback
    console.error('🚫 No readable error properties found, using toString');
    return error.toString() || 'Error desconocido';
  } catch {
    return 'Error desconocido al procesar la solicitud';
  }
};

// Tipos básicos
export interface Guardia {
  id: string;
  profesional_guardia_id: string;
  centro_salud_id: string;
  tipo: 'fisica' | 'localizable' | 'administrativa';
  fecha_inicio: string;
  fecha_fin: string;
  horas?: number;
  tipo_dia: 'ordinario' | 'fin_semana' | 'festivo';
  estado?: string;
  validacion_estado?: string;
  observaciones?: string;
  localizable_activada?: boolean;
  hora_llamada?: string;
  hora_llegada?: string;
  servicio_atendido?: string;
  caso_atendido?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  // Datos relacionados (para facilitar el uso en frontend)
  profesional?: {
    id: string;
    nombre_completo: string;
    especialidad: string;
  };
  centro?: {
    id: string;
    nombre: string;
  };
}

export interface Profesional {
  id: string;
  nombre_completo: string;
  especialidad: string;
  centro_id?: string;
  activo: boolean;
}

export interface ProfesionalGuardia {
  id: string;
  profesional_id: string;
  nombre_completo?: string; // Joined from profesionales_sanitarios
  categoria: 'especialista' | 'general_licenciado' | 'tecnico_diplomado' | 'auxiliar' | 'subalterno' | 'odepac' | 'secre_asist_pacientes' | 'caja';
  unidad_servicio: string;
  banco?: string;
  iban_cuenta?: string;
  activo: boolean;
  telefono_guardias?: string;
  email_guardias?: string;
}

export interface Centro {
  id: string;
  nombre: string;
  tipo_centro: string;
  provincia: string;
}

export interface Cuadrante {
  id: string;
  mes: number;
  ano: number;
  centro_id?: string;
  tipo_cuadrante: 'MENSUAL' | 'SEMANAL';
  estado: 'borrador' | 'generado' | 'aprobado' | 'rechazado' | 'enviada' | 'pagada';
  fecha_generacion: string;
  fecha_aprobacion?: string;
  auto_asignar: boolean;
  considerar_preferencias: boolean;
}

// Database enum values for etapa_validacion
export type EtapaValidacion = 'dir_medica' | 'dir_admin' | 'dir_enfermeria' | 'jefe_rrhh' | 'admin_hospital' | 'dir_gerente' | 'dg_coordinacion';

// Frontend workflow stages (for UI)
export type EtapaWorkflow = 'revision_inicial' | 'supervision_tecnica' | 'aprobacion_final';

export interface Validacion {
  id: string;
  guardia_id?: string;
  etapa: EtapaValidacion;
  usuario_id?: string;
  fecha?: string;
  resultado?: string;
  comentario?: string;
  firma?: string;
  created_at?: string;
  // Datos relacionados
  guardia?: {
    id: string;
    profesional_guardia_id: string;
    centro_salud_id: string;
    fecha_inicio: string;
    fecha_fin: string;
    tipo: string;
    tipo_dia: string;
  };
  usuario?: {
    id: string;
    nombre_completo: string;
  };
}

export interface Nomina {
  id: string;
  centro_salud_id: string;
  mes: number;
  anio: number;
  estado?: string;
  total_importe?: number;
  total_guardias?: number;
  total_profesionales?: number;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
  // Datos relacionados
  centro?: {
    id: string;
    nombre: string;
  };
}

export interface NominaLinea {
  id: string;
  nomina_id: string;
  profesional_guardia_id: string;
  categoria: string;
  guardias_ordinarias?: number;
  guardias_fines_semana?: number;
  guardias_festivos?: number;
  localizables_programadas?: number;
  localizables_llamadas?: number;
  coste_unitario_ordinario?: number;
  coste_unitario_fin_semana?: number;
  coste_unitario_festivo?: number;
  coste_localizable_programada?: number;
  coste_localizable_llamada?: number;
  total_linea?: number;
  created_at?: string;
  updated_at?: string;
  // Datos relacionados
  profesional?: {
    id: string;
    nombre_completo: string;
  };
}

export interface Pago {
  id: string;
  nomina_id: string;
  profesional_guardia_id: string;
  forma_pago: string;
  fecha_pago?: string;
  importe: number;
  comprobante_url?: string;
  observaciones?: string;
  estado?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  // Datos relacionados
  profesional?: {
    id: string;
    nombre_completo: string;
  };
  nomina?: {
    id: string;
    mes: number;
    anio: number;
    total_importe?: number;
  };
}

export interface Baremo {
  id: string;
  fuente: 'protocol' | 'excel' | 'manual';
  categoria: 'especialista' | 'general_licenciado' | 'tecnico_diplomado' | 'auxiliar' | 'subalterno' | 'odepac' | 'secre_asist_pacientes' | 'caja';
  tipo_guardia: 'fisica' | 'localizable' | 'administrativa';
  tipo_dia: 'ordinario' | 'fin_semana' | 'festivo';
  valor: number;
  porcentaje_localizable: number;
  porcentaje_llamada: number;
  vigente_desde?: string;
  vigente_hasta?: string;
  activo: boolean;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface DiaFestivo {
  id: string;
  nombre: string;
  fecha: string;
  tipo: 'NACIONAL' | 'REGIONAL' | 'LOCAL';
  recurrente: boolean;
  activo: boolean;
  observaciones?: string;
}

export interface AjusteBaremo {
  id: string;
  baremo_id: string;
  centro_id?: string;
  tipo_ajuste: 'PORCENTAJE' | 'MONTO_FIJO';
  valor_ajuste: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  motivo: string;
  activo: boolean;
  observaciones?: string;
  baremo?: Baremo;
  centro?: Centro;
}

export interface BitacoraEntry {
  id: string;
  ref_tipo: string;
  ref_id: string;
  usuario_id?: string;
  accion: string;
  detalle?: any;
  fecha?: string;
  ip_address?: string;
  user_agent?: string;
  // Datos relacionados
  usuario?: {
    id: string;
    nombre_completo: string;
    email: string;
  };
}

interface GuardiasStoreState {
  // Estado
  loading: boolean;
  error: string | null;

  // Datos
  guardias: Guardia[];
  profesionales: Profesional[];
  profesionalesGuardias: ProfesionalGuardia[];
  centros: Centro[];
  cuadrantes: Cuadrante[];
  validaciones: Validacion[];
  nominas: Nomina[];
  nominasLineas: NominaLinea[];
  pagos: Pago[];
  baremos: Baremo[];
  diasFestivos: DiaFestivo[];
  ajustesBaremos: AjusteBaremo[];
  bitacora: BitacoraEntry[];

  // Acciones básicas
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Operaciones CRUD - Guardias
  fetchGuardias: (mes: number, ano: number, centroId?: string | null) => Promise<void>;
  createGuardia: (data: Partial<Guardia>) => Promise<void>;
  updateGuardia: (id: string, data: Partial<Guardia>) => Promise<void>;
  deleteGuardia: (id: string) => Promise<void>;
  ensureProfesionalGuardia: (profesionalId: string) => Promise<string>;

  // Operaciones CRUD - Profesionales
  fetchProfesionales: (centroId?: string | null) => Promise<void>;
  fetchProfesionalesGuardias: (centroId?: string | null) => Promise<void>;

  // Operaciones CRUD - Centros
  fetchCentros: () => Promise<void>;

  // Operaciones CRUD - Cuadrantes
  fetchCuadrantes: (mes: number, ano: number, centroId?: string | null) => Promise<void>;
  generateCuadrante: (data: Partial<Cuadrante>) => Promise<void>;
  updateCuadrante: (id: string, data: Partial<Cuadrante>) => Promise<void>;
  exportCuadrante: (id: string, formato: 'PDF' | 'EXCEL') => Promise<void>;

  // Operaciones CRUD - Validaciones
  fetchValidaciones: (mes: number, ano: number, centroId?: string | null) => Promise<void>;
  createValidacion: (data: Partial<Validacion>) => Promise<void>;
  updateValidacion: (id: string, data: Partial<Validacion>) => Promise<void>;
  aprobarValidacion: (id: string, comentarios?: string) => Promise<void>;
  rechazarValidacion: (id: string, comentarios: string) => Promise<void>;

  // Operaciones CRUD - Nóminas
  fetchNominas: (mes: number, ano: number, centroId?: string | null) => Promise<void>;
  fetchNominasLineas: (nominaId: string) => Promise<void>;
  generateNomina: (data: { mes: number; ano: number; centro_id?: string | null }) => Promise<void>;
  aprobarNomina: (id: string) => Promise<void>;
  rechazarNomina: (id: string) => Promise<void>;
  exportNomina: (id: string, formato: 'PDF' | 'EXCEL') => Promise<void>;
  calcularMontoGuardia: (guardiaId: string) => Promise<number>;

  // Operaciones CRUD - Pagos
  fetchPagos: (mes: number, ano: number, centroId?: string | null) => Promise<void>;
  createPago: (data: Partial<Pago>) => Promise<void>;
  updatePago: (id: string, data: Partial<Pago>) => Promise<void>;
  aprobarPago: (id: string) => Promise<void>;
  rechazarPago: (id: string) => Promise<void>;
  procesarPagoMasivo: (pagoIds: string[]) => Promise<void>;
  exportPagos: (mes: number, ano: number, centroId?: string | null) => Promise<void>;

  // Operaciones CRUD - Baremos
  fetchBaremos: () => Promise<void>;
  createBaremo: (data: Partial<Baremo>) => Promise<void>;
  updateBaremo: (id: string, data: Partial<Baremo>) => Promise<void>;
  deleteBaremo: (id: string) => Promise<void>;

  // Operaciones CRUD - Días Festivos
  fetchDiasFestivos: () => Promise<void>;
  createDiaFestivo: (data: Partial<DiaFestivo>) => Promise<void>;
  updateDiaFestivo: (id: string, data: Partial<DiaFestivo>) => Promise<void>;
  deleteDiaFestivo: (id: string) => Promise<void>;

  // Operaciones CRUD - Ajustes Baremos
  fetchAjustesBaremos: (centroId?: string | null) => Promise<void>;
  createAjusteBaremo: (data: Partial<AjusteBaremo>) => Promise<void>;
  updateAjusteBaremo: (id: string, data: Partial<AjusteBaremo>) => Promise<void>;
  deleteAjusteBaremo: (id: string) => Promise<void>;

  // Operaciones CRUD - Bitácora
  fetchBitacora: (params: {
    mes: number;
    ano: number;
    centro_id?: string | null;
    fecha_inicio?: string;
    fecha_fin?: string;
  }) => Promise<void>;
  exportAuditLog: (params: any) => Promise<void>;

  // Reportes
  generateReport: (tipo: string, params: any) => Promise<void>;
  exportReport: (tipo: string, params: any) => Promise<void>;

  // Utilidades para días festivos
  isDiaFestivo: (fecha: string) => boolean;
  getTipoDia: (fecha: string) => 'ordinario' | 'fin_semana' | 'festivo';
  calcularMontoConTipoDia: (montoBase: number, tipoDia: string, tipo: string) => number;

  // Configuración
  exportConfiguration: () => Promise<void>;
  importConfiguration: (file: File) => Promise<void>;
  resetConfiguration: () => Promise<void>;
}

export const useGuardiasStore = create<GuardiasStoreState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      loading: false,
      error: null,

      // Datos iniciales
      guardias: [],
      profesionales: [],
      profesionalesGuardias: [],
      centros: [],
      cuadrantes: [],
      validaciones: [],
      nominas: [],
      nominasLineas: [],
      pagos: [],
      baremos: [],
      diasFestivos: [],
      ajustesBaremos: [],
      bitacora: [],

      // Acciones básicas
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // Operaciones CRUD - Guardias
      fetchGuardias: async (mes, ano, centroId) => {
        console.log('🔍 Fetching guardias for:', { mes, ano, centroId });
        set({ loading: true, error: null });

        try {
          await retryWithBackoff(async () => {
            let query = supabase
              .from('guardias')
              .select(`
                id,
                profesional_guardia_id,
                centro_salud_id,
                tipo,
                fecha_inicio,
                fecha_fin,
                horas,
                tipo_dia,
                estado,
                validacion_estado,
                observaciones,
                localizable_activada,
                hora_llamada,
                hora_llegada,
                servicio_atendido,
                caso_atendido,
                created_at,
                updated_at,
                created_by,
                approved_by,
                approved_at
              `)
              .order('fecha_inicio', { ascending: false });

            // Filtrar por mes y año
            const startDate = new Date(ano, mes - 1, 1);
            const endDate = new Date(ano, mes, 0, 23, 59, 59);
            console.log('📅 Date range:', { startDate: startDate.toISOString(), endDate: endDate.toISOString() });

            query = query
              .gte('fecha_inicio', startDate.toISOString())
              .lte('fecha_inicio', endDate.toISOString());

            // Filtrar por centro si se especifica
            if (centroId) {
              console.log('🏥 Filtering by center:', centroId);
              query = query.eq('centro_salud_id', centroId);
            }

            const { data, error } = await query;

            if (error) {
              console.error('❌ Supabase error in fetchGuardias:', error);
              throw error;
            }

            console.log('✅ Guardias fetched successfully:', data?.length || 0, 'records');
            console.log('📊 Sample guardia data:', data?.[0]);
            set({ guardias: data || [], loading: false });
          });
        } catch (error: any) {
          console.error('💥 Exception in fetchGuardias:', error);
          const errorMessage = formatSupabaseError(error);
          set({ error: 'Error al cargar guardias: ' + errorMessage, loading: false });
        }
      },

      createGuardia: async (data) => {
        console.log('🔄 Creating guardia with data:', data);
        set({ loading: true, error: null });
        try {
          // Cargar días festivos si no están cargados
          if (get().diasFestivos.length === 0) {
            await get().fetchDiasFestivos();
          }

          // Si tiene profesional_ids múltiples (multiselección)
          if (data.profesional_ids && Array.isArray(data.profesional_ids)) {
            console.log('👥 Creating multiple guardias for:', data.profesional_ids.length, 'professionals');
            for (const profesionalId of data.profesional_ids) {
              const profesionalGuardiaId = await get().ensureProfesionalGuardia(profesionalId);

              // Calcular tipo_dia automáticamente
              const tipoDiaCalculado = data.tipo_dia || get().getTipoDia(data.fecha_inicio);

              // Validate dates
              const fechaInicio = new Date(data.fecha_inicio);
              const fechaFin = new Date(data.fecha_fin);

              if (isNaN(fechaInicio.getTime())) {
                throw new Error(`Fecha de inicio inv��lida: ${data.fecha_inicio}`);
              }

              if (isNaN(fechaFin.getTime())) {
                throw new Error(`Fecha de fin inválida: ${data.fecha_fin}`);
              }

              if (fechaFin <= fechaInicio) {
                throw new Error(`La fecha de fin (${data.fecha_fin}) debe ser posterior a la fecha de inicio (${data.fecha_inicio})`);
              }

              // Validate duration (must be between 12 and 24 hours)
              const durationHours = (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60);
              console.log('⏱️ Calculated duration:', durationHours, 'hours');

              if (durationHours < 12) {
                throw new Error(`La duración de la guardia debe ser de al menos 12 horas. Duración actual: ${durationHours.toFixed(1)} horas`);
              }

              if (durationHours > 24) {
                throw new Error(`La duración de la guardia no puede exceder 24 horas. Duración actual: ${durationHours.toFixed(1)} horas`);
              }

              // Validate centro_salud_id exists
              if (!data.centro_salud_id) {
                throw new Error('Centro de salud es requerido');
              }

              const { data: centro, error: centroError } = await supabase
                .from('centros_salud')
                .select('id, nombre')
                .eq('id', data.centro_salud_id)
                .single();

              if (centroError || !centro) {
                console.error('❌ Error validating centro_salud:', centroError);
                throw new Error(`Centro de salud no encontrado (ID: ${data.centro_salud_id})`);
              }

              console.log('✅ Validated centro de salud:', centro.nombre);

              const guardiaData = {
                profesional_guardia_id: profesionalGuardiaId,
                centro_salud_id: data.centro_salud_id,
                tipo: data.tipo || 'fisica',
                fecha_inicio: data.fecha_inicio,
                fecha_fin: data.fecha_fin,
                tipo_dia: tipoDiaCalculado,
                observaciones: data.observaciones || null
              };

              console.log('💾 Inserting guardia with calculated tipo_dia:', tipoDiaCalculado);
              console.log('📦 Complete guardiaData payload:', JSON.stringify(guardiaData, null, 2));

              const { data: insertedData, error } = await supabase
                .from('guardias')
                .insert(guardiaData)
                .select();

              if (error) {
                console.error('❌ Error inserting guardia for professional', profesionalId);
                console.error('❌ Error object:', error);
                console.error('❌ Error status:', error.status || error.statusCode);
                console.error('��� Error details:', error.details);
                console.error('❌ Error hint:', error.hint);
                console.error('❌ Data sent:', guardiaData);
                const formattedError = formatSupabaseError(error);
                throw new Error(`Error inserting guardia: ${formattedError}`);
              }

              console.log('✅ Successfully inserted guardia:', insertedData);
            }
          } else {
            // Guardia individual (retrocompatibilidad)
            let profesionalGuardiaId;
            if (data.profesional_id) {
              profesionalGuardiaId = await get().ensureProfesionalGuardia(data.profesional_id);
            } else if (data.profesional_guardia_id) {
              profesionalGuardiaId = data.profesional_guardia_id;
            } else {
              throw new Error('Se requiere profesional_id o profesional_guardia_id');
            }

            // Calcular tipo_dia automáticamente
            const tipoDiaCalculado = data.tipo_dia || get().getTipoDia(data.fecha_inicio);

            // Validate dates
            const fechaInicio = new Date(data.fecha_inicio);
            const fechaFin = new Date(data.fecha_fin);

            if (isNaN(fechaInicio.getTime())) {
              throw new Error(`Fecha de inicio inválida: ${data.fecha_inicio}`);
            }

            if (isNaN(fechaFin.getTime())) {
              throw new Error(`Fecha de fin inválida: ${data.fecha_fin}`);
            }

            if (fechaFin <= fechaInicio) {
              throw new Error(`La fecha de fin (${data.fecha_fin}) debe ser posterior a la fecha de inicio (${data.fecha_inicio})`);
            }

            // Validate duration (must be between 12 and 24 hours)
            const durationHours = (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60);
            console.log('⏱️ Calculated single guardia duration:', durationHours, 'hours');

            if (durationHours < 12) {
              throw new Error(`La duración de la guardia debe ser de al menos 12 horas. Duración actual: ${durationHours.toFixed(1)} horas`);
            }

            if (durationHours > 24) {
              throw new Error(`La duración de la guardia no puede exceder 24 horas. Duración actual: ${durationHours.toFixed(1)} horas`);
            }

            // Validate centro_salud_id exists
            if (!data.centro_salud_id) {
              throw new Error('Centro de salud es requerido');
            }

            const { data: centro, error: centroError } = await supabase
              .from('centros_salud')
              .select('id, nombre')
              .eq('id', data.centro_salud_id)
              .single();

            if (centroError || !centro) {
              console.error('❌ Error validating centro_salud:', centroError);
              throw new Error(`Centro de salud no encontrado (ID: ${data.centro_salud_id})`);
            }

            console.log('✅ Validated centro de salud:', centro.nombre);

            const guardiaData = {
              profesional_guardia_id: profesionalGuardiaId,
              centro_salud_id: data.centro_salud_id,
              tipo: data.tipo || 'fisica',
              fecha_inicio: data.fecha_inicio,
              fecha_fin: data.fecha_fin,
              tipo_dia: tipoDiaCalculado,
              observaciones: data.observaciones || null
            };

            console.log('💾 Inserting single guardia with calculated tipo_dia:', tipoDiaCalculado);
            console.log('📦 Complete single guardiaData payload:', JSON.stringify(guardiaData, null, 2));

            const { data: insertedData, error } = await supabase
              .from('guardias')
              .insert(guardiaData)
              .select();

            if (error) {
              console.error('❌ Error inserting single guardia');
              console.error('❌ Error object:', error);
              console.error('��� Error status:', error.status || error.statusCode);
              console.error('❌ Error details:', error.details);
              console.error('❌ Error hint:', error.hint);
              console.error('❌ Data sent:', guardiaData);
              const formattedError = formatSupabaseError(error);
              throw new Error(`Error inserting single guardia: ${formattedError}`);
            }

            console.log('✅ Successfully inserted single guardia:', insertedData);
          }

          console.log('✅ Guardia(s) created successfully');

          // Refrescar datos
          const currentDate = new Date();
          await get().fetchGuardias(currentDate.getMonth() + 1, currentDate.getFullYear());

          set({ loading: false });
        } catch (error: any) {
          console.error('💥 Exception in createGuardia:', error);
          console.error('💥 Exception type:', typeof error);
          console.error('💥 Exception constructor:', error?.constructor?.name);
          console.error('💥 Exception keys:', Object.keys(error || {}));

          let errorMessage: string;
          if (error instanceof Error) {
            errorMessage = error.message;
          } else {
            errorMessage = formatSupabaseError(error);
          }

          console.error('��� Final formatted error message:', errorMessage);
          set({ error: 'Error al crear guardia: ' + errorMessage, loading: false });
        }
      },

      // Nueva función para asegurar que existe un profesional_guardia
      ensureProfesionalGuardia: async (profesionalId: string) => {
        console.log('🔍 Ensuring profesional_guardia exists for:', profesionalId);
        try {
          // Buscar si ya existe un registro en profesionales_guardias
          const { data: existing, error: searchError } = await supabase
            .from('profesionales_guardias')
            .select('id')
            .eq('profesional_id', profesionalId)
            .single();

          if (!searchError && existing) {
            console.log('✅ Profesional_guardia already exists:', existing.id);
            return existing.id;
          }

          console.log('🔍 Searching error (expected if not found):', searchError);

          // Si no existe, obtener datos del profesional sanitario
          const { data: profesional, error: profError } = await supabase
            .from('profesionales_sanitarios')
            .select('id, nombre_completo, area_profesional, especialidad, funcion_publica, tipo_sector')
            .eq('id', profesionalId)
            .single();

          if (profError) {
            console.error('❌ Error fetching profesional:', profError);
            const errorMsg = formatSupabaseError(profError);
            throw new Error(`Profesional no encontrado: ${errorMsg}`);
          }

          if (!profesional) {
            throw new Error('Profesional no encontrado en la base de datos');
          }

          console.log('👨‍⚕️ Found profesional:', profesional);

          // Determinar categoría basada en area_profesional
          let categoria: 'especialista' | 'general_licenciado' | 'tecnico_diplomado' | 'auxiliar' | 'subalterno' | 'odepac' | 'secre_asist_pacientes' | 'caja' = 'general_licenciado';

          const areaProfesional = (profesional.area_profesional || profesional.especialidad || '').toLowerCase();
          if (areaProfesional.includes('especialista') || areaProfesional.includes('especialidad')) {
            categoria = 'especialista';
          } else if (areaProfesional.includes('técnico') || areaProfesional.includes('tecnico')) {
            categoria = 'tecnico_diplomado';
          } else if (areaProfesional.includes('auxiliar')) {
            categoria = 'auxiliar';
          }

          // Determinar unidad_servicio (requerido)
          const unidadServicio = profesional.area_profesional ||
                                profesional.especialidad ||
                                'Servicio General';

          console.log('📋 Creating profesional_guardia with:', {
            profesional_id: profesionalId,
            categoria,
            unidad_servicio: unidadServicio,
            funcion_publica: profesional.funcion_publica || false
          });

          // Crear nuevo registro en profesionales_guardias
          const { data: newRecord, error: insertError } = await supabase
            .from('profesionales_guardias')
            .insert({
              profesional_id: profesionalId,
              categoria: categoria,
              unidad_servicio: unidadServicio,
              activo: true
            })
            .select('id')
            .single();

          if (insertError) {
            console.error('❌ Error inserting profesional_guardia:', insertError);
            const errorMsg = formatSupabaseError(insertError);
            throw new Error(`Error al crear registro de profesional_guardia: ${errorMsg}`);
          }

          console.log('✅ Created profesional_guardia:', newRecord.id);
          return newRecord.id;
        } catch (error: any) {
          console.error('💥 Exception in ensureProfesionalGuardia:', error);
          const errorMsg = formatSupabaseError(error);
          throw new Error(`Error al preparar profesional para guardias: ${errorMsg}`);
        }
      },

      updateGuardia: async (id, data) => {
        set({ loading: true });
        try {
          const { error } = await supabase
            .from('guardias')
            .update(data)
            .eq('id', id);

          if (error) throw error;

          // Refrescar datos
          const currentDate = new Date();
          await get().fetchGuardias(currentDate.getMonth() + 1, currentDate.getFullYear());
          
          set({ loading: false });
        } catch (error: any) {
          console.error('Error updating guardia:', error);
          const errorMessage = formatSupabaseError(error);
          set({ error: 'Error al actualizar guardia: ' + errorMessage, loading: false });
        }
      },

      deleteGuardia: async (id) => {
        set({ loading: true });
        try {
          const { error } = await supabase
            .from('guardias')
            .delete()
            .eq('id', id);

          if (error) throw error;

          // Refrescar datos
          const currentDate = new Date();
          await get().fetchGuardias(currentDate.getMonth() + 1, currentDate.getFullYear());
          
          set({ loading: false });
        } catch (error: any) {
          console.error('Error deleting guardia:', error);
          const errorMessage = formatSupabaseError(error);
          set({ error: 'Error al eliminar guardia: ' + errorMessage, loading: false });
        }
      },

      // Operaciones CRUD - Profesionales
      fetchProfesionales: async (centroId) => {
        console.log('👨‍⚕️ Fetching profesionales for center:', centroId);
        set({ loading: true, error: null });

        try {
          await retryWithBackoff(async () => {
            let query = supabase
              .from('profesionales_sanitarios')
              .select(`
                id,
                nombre_completo,
                area_profesional,
                especialidad,
                centro_salud_id,
                estado_solicitud
              `)
              .eq('estado_solicitud', 'Aprobado')
              .order('nombre_completo');

            if (centroId) {
              console.log('🏥 Filtering profesionales by center:', centroId);
              query = query.eq('centro_salud_id', centroId);
            }

            const { data, error } = await query;

            if (error) {
              console.error('❌ Supabase error in fetchProfesionales:', error);
              throw error;
            }

            console.log('📊 Raw profesionales data:', data?.length || 0, 'records');

            const profesionales: Profesional[] = (data || []).map(prof => ({
              id: prof.id,
              nombre_completo: prof.nombre_completo,
              especialidad: prof.area_profesional || prof.especialidad || 'No especificado',
              centro_id: prof.centro_salud_id || undefined,
              activo: prof.estado_solicitud === 'Aprobado'
            }));

            console.log('✅ Profesionales processed successfully:', profesionales.length);
            set({ profesionales, loading: false });
          });
        } catch (error: any) {
          console.error('💥 Exception in fetchProfesionales:', error);
          const errorMessage = formatSupabaseError(error);
          set({ error: 'Error al cargar profesionales: ' + errorMessage, loading: false });
        }
      },

      fetchProfesionalesGuardias: async (centroId) => {
        console.log('👨‍⚕️ Fetching profesionales guardias for center:', centroId);
        set({ loading: true, error: null });
        try {
          let query = supabase
            .from('profesionales_guardias')
            .select(`
              id,
              profesional_id,
              categoria,
              unidad_servicio,
              banco,
              iban_cuenta,
              activo,
              telefono_guardias,
              email_guardias,
              profesionales_sanitarios!inner (
                id,
                nombre_completo,
                centro_salud_id
              )
            `)
            .eq('activo', true)
            .order('profesionales_sanitarios(nombre_completo)');

          if (centroId) {
            console.log('🏥 Filtering profesionales guardias by center:', centroId);
            query = query.eq('profesionales_sanitarios.centro_salud_id', centroId);
          }

          const { data, error } = await query;

          if (error) {
            console.error('❌ Supabase error in fetchProfesionalesGuardias:', error);
            throw error;
          }

          console.log('📊 Raw profesionales guardias data:', data?.length || 0, 'records');

          const profesionalesGuardias: ProfesionalGuardia[] = (data || []).map(pg => ({
            id: pg.id,
            profesional_id: pg.profesional_id,
            nombre_completo: pg.profesionales_sanitarios?.nombre_completo || 'Sin nombre',
            categoria: pg.categoria,
            unidad_servicio: pg.unidad_servicio,
            banco: pg.banco,
            iban_cuenta: pg.iban_cuenta,
            activo: pg.activo,
            telefono_guardias: pg.telefono_guardias,
            email_guardias: pg.email_guardias
          }));

          console.log('��� Profesionales guardias processed successfully:', profesionalesGuardias.length);
          set({ profesionalesGuardias, loading: false });
        } catch (error: any) {
          console.error('💥 Exception in fetchProfesionalesGuardias:', error);
          const errorMessage = formatSupabaseError(error);
          set({ error: 'Error al cargar profesionales de guardias: ' + errorMessage, loading: false });
        }
      },

      // Operaciones CRUD - Centros
      fetchCentros: async () => {
        console.log('🏥 Fetching centros de salud...');
        set({ loading: true, error: null });

        try {
          await retryWithBackoff(async () => {
            const { data, error } = await supabase
              .from('centros_salud')
              .select(`
                id,
                nombre,
                categoria,
                provincia,
                estado
              `)
              .eq('estado', 'Activo')
              .order('nombre');

            if (error) {
              console.error('❌ Supabase error in fetchCentros:', error);
              throw error;
            }

            console.log('📊 Raw centros data:', data?.length || 0, 'records');

            const centros: Centro[] = (data || []).map(centro => ({
              id: centro.id,
              nombre: centro.nombre,
              tipo_centro: centro.categoria || 'Centro de Salud',
              provincia: centro.provincia || 'No especificada'
            }));

            console.log('✅ Centros processed successfully:', centros.length);
            set({ centros, loading: false });
          });
        } catch (error: any) {
          console.error('💥 Exception in fetchCentros:', error);
          const errorMessage = formatSupabaseError(error);
          set({ error: 'Error al cargar centros: ' + errorMessage, loading: false });
        }
      },

      // Implementaciones placeholder para las demás operaciones (se pueden implementar gradualmente)
      fetchCuadrantes: async (mes, ano, centroId) => {
        console.log('🗺 Fetching cuadrantes for:', { mes, ano, centroId });
        set({ loading: true, error: null });
        try {
          // Verificar si la tabla cuadrantes_guardias existe
          const { data: tableExists } = await supabase
            .from('cuadrantes_guardias')
            .select('id')
            .limit(1);

          if (tableExists !== null) {
            // La tabla existe, proceder con la consulta normal
            let query = supabase
              .from('cuadrantes_guardias')
              .select('*')
              .eq('mes', mes)
              .eq('anio', ano)
              .order('created_at', { ascending: false });

            if (centroId) {
              query = query.eq('centro_salud_id', centroId);
            }

            const { data, error } = await query;

            if (error) {
              console.error('❌ Supabase error in fetchCuadrantes:', error);
              throw error;
            }

            console.log('✅ Cuadrantes fetched successfully:', data?.length || 0, 'records');
            set({ cuadrantes: data || [], loading: false });
          } else {
            // La tabla no existe, generar cuadrante virtual basado en guardias existentes
            console.log('📋 Table cuadrantes_guardias does not exist, creating virtual cuadrante');

            // Obtener guardias del período para simular un cuadrante
            const startDate = new Date(ano, mes - 1, 1);
            const endDate = new Date(ano, mes, 0, 23, 59, 59);

            let guardiasQuery = supabase
              .from('guardias')
              .select('id, centro_salud_id, fecha_inicio')
              .gte('fecha_inicio', startDate.toISOString())
              .lte('fecha_inicio', endDate.toISOString());

            if (centroId) {
              guardiasQuery = guardiasQuery.eq('centro_salud_id', centroId);
            }

            const { data: guardiasData, error: guardiasError } = await guardiasQuery;

            if (guardiasError) {
              console.error('❌ Error fetching guardias for virtual cuadrante:', guardiasError);
              const errorMessage = formatSupabaseError(guardiasError);
              throw new Error(errorMessage);
            }

            // Crear cuadrante virtual si hay guardias
            const cuadranteVirtual = guardiasData && guardiasData.length > 0 ? [{
              id: `virtual-${mes}-${ano}-${centroId || 'all'}`,
              mes,
              anio: ano,
              centro_salud_id: centroId,
              tipo_cuadrante: 'MENSUAL',
              estado: 'GENERADO',
              fecha_generacion: new Date().toISOString(),
              auto_asignar: false,
              considerar_preferencias: false,
              total_guardias: guardiasData.length
            }] : [];

            console.log('✅ Virtual cuadrante created:', cuadranteVirtual.length, 'records');
            set({ cuadrantes: cuadranteVirtual, loading: false });
          }
        } catch (error: any) {
          console.error('💥 Exception in fetchCuadrantes:', error);
          const errorMessage = formatSupabaseError(error);
          set({ error: 'Error al cargar cuadrantes: ' + errorMessage, loading: false });
        }
      },

      generateCuadrante: async (data) => {
        console.log('🗺 Generating cuadrante with data:', data);
        set({ loading: true, error: null });
        try {
          // Verificar si la tabla cuadrantes_guardias existe antes de proceder
          console.log('🔍 Checking if cuadrantes_guardias table exists...');

          try {
            // Intentar hacer una consulta simple para verificar existencia
            await supabase.from('cuadrantes_guardias').select('id').limit(1);
            console.log('✅ Table cuadrantes_guardias exists');

            // Paso 1: Verificar si ya existe un cuadrante para el período
            const { data: existingCuadrante, error: checkError } = await supabase
              .from('cuadrantes_guardias')
              .select('id')
              .eq('mes', data.mes)
              .eq('anio', data.ano)
              .eq('centro_salud_id', data.centro_id || null)
              .single();

            if (existingCuadrante && !checkError) {
              // Ya existe un cuadrante, preguntar si regenerar
              console.log('📄 Cuadrante already exists, updating...');
              const { error: updateError } = await supabase
                .from('cuadrantes_guardias')
                .update({
                  tipo_cuadrante: data.tipo_cuadrante || 'MENSUAL',
                  auto_asignar: data.auto_asignar || false,
                  considerar_preferencias: data.considerar_preferencias || false,
                  estado: 'REGENERADO',
                  fecha_generacion: new Date().toISOString()
                })
                .eq('id', existingCuadrante.id);

              if (updateError) throw updateError;
            } else {
              // Crear nuevo cuadrante
              console.log('🆕 Creating new cuadrante...');
              const cuadranteData = {
                mes: data.mes,
                anio: data.ano,
                centro_salud_id: data.centro_id,
                tipo_cuadrante: data.tipo_cuadrante || 'MENSUAL',
                estado: 'GENERADO',
                fecha_generacion: new Date().toISOString(),
                auto_asignar: data.auto_asignar || false,
                considerar_preferencias: data.considerar_preferencias || false
              };

              const { error: insertError } = await supabase
                .from('cuadrantes_guardias')
                .insert(cuadranteData);

              if (insertError) throw insertError;
            }
          } catch (tableError: any) {
            console.log('📝 Table cuadrantes_guardias does not exist, proceeding with guardias generation only');
            // La tabla no existe, pero podemos continuar generando guardias
          }

          // Paso 2: Obtener profesionales disponibles
          let profesionalesQuery = supabase
            .from('profesionales_sanitarios')
            .select('id, nombre_completo, area_profesional')
            .eq('estado_solicitud', 'Aprobado');

          if (data.centro_id) {
            profesionalesQuery = profesionalesQuery.eq('centro_salud_id', data.centro_id);
          }

          const { data: profesionalesData, error: profError } = await profesionalesQuery;
          if (profError) throw profError;

          console.log('👥 Found professionals:', profesionalesData?.length || 0);

          if (!profesionalesData || profesionalesData.length === 0) {
            throw new Error('No hay profesionales disponibles para generar el cuadrante');
          }

          // Paso 3: Generar guardias básicas para el mes si auto_asignar está activado
          if (data.auto_asignar) {
            const daysInMonth = new Date(data.ano, data.mes, 0).getDate();
            const guardiasToCreate = [];

            // Asegurar que tenemos días festivos cargados
            if (get().diasFestivos.length === 0) {
              await get().fetchDiasFestivos();
            }

            for (let day = 1; day <= daysInMonth; day++) {
              const fecha = new Date(data.ano, data.mes - 1, day);
              const tipoDia = get().getTipoDia(fecha.toISOString());

              // Seleccionar profesional de forma rotatoria
              const profesionalIndex = (day - 1) % profesionalesData.length;
              const profesional = profesionalesData[profesionalIndex];

              // Asegurar que existe en profesionales_guardias
              const profesionalGuardiaId = await get().ensureProfesionalGuardia(profesional.id);

              // Crear guardias para diferentes turnos (12-24 horas para cumplir constraint)
              const turnos = [
                { inicio: 8, fin: 20, tipo: 'fisica' },  // Diurna: 8AM-8PM (12 horas)
                { inicio: 20, fin: 8, tipo: 'localizable', overnight: true }, // Nocturna: 8PM-8AM (12 horas)
                { inicio: 8, fin: 8, tipo: 'fisica', fullDay: true } // Completa: 8AM-8AM siguiente día (24 horas)
              ];

              for (const turno of turnos) {
                const fechaInicio = new Date(fecha);
                fechaInicio.setHours(turno.inicio, 0, 0, 0);

                const fechaFin = new Date(fecha);
                if (turno.fullDay) {
                  // Guardia completa de 24 horas
                  fechaFin.setDate(fechaFin.getDate() + 1);
                  fechaFin.setHours(turno.fin, 0, 0, 0);
                } else if (turno.overnight || turno.fin < turno.inicio) {
                  // Guardia nocturna que cruza la medianoche
                  fechaFin.setDate(fechaFin.getDate() + 1);
                  fechaFin.setHours(turno.fin, 0, 0, 0);
                } else {
                  // Guardia del mismo día
                  fechaFin.setHours(turno.fin, 0, 0, 0);
                }

                // Validar duración antes de crear la guardia
                const durationHours = (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60);

                if (durationHours < 12 || durationHours > 24) {
                  console.warn(`⚠️ Skipping invalid guardia: ${durationHours.toFixed(1)}h duration. Required: 12-24h`, {
                    turno: turno,
                    fechaInicio: fechaInicio.toISOString(),
                    fechaFin: fechaFin.toISOString()
                  });
                  continue; // Skip this invalid guardia
                }

                console.log(`✅ Creating valid guardia: ${durationHours.toFixed(1)}h duration`, {
                  tipo: turno.tipo,
                  inicio: fechaInicio.toLocaleString(),
                  fin: fechaFin.toLocaleString()
                });

                guardiasToCreate.push({
                  profesional_guardia_id: profesionalGuardiaId,
                  centro_salud_id: data.centro_id,
                  tipo: turno.tipo,
                  fecha_inicio: fechaInicio.toISOString(),
                  fecha_fin: fechaFin.toISOString(),
                  tipo_dia: tipoDia,
                  observaciones: `Generado automáticamente - Cuadrante ${data.tipo_cuadrante}`
                });
              }
            }

            // Validación final antes de inserción en lotes
            console.log('��� Validation summary:', {
              totalGuardias: guardiasToCreate.length,
              avgDuration: guardiasToCreate.length > 0 ?
                (guardiasToCreate.reduce((sum, g) => {
                  const start = new Date(g.fecha_inicio);
                  const end = new Date(g.fecha_fin);
                  return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                }, 0) / guardiasToCreate.length).toFixed(1) + ' hours' : 'N/A'
            });

            if (guardiasToCreate.length === 0) {
              throw new Error('No se generaron guardias válidas. Verifique la configuración de turnos.');
            }

            // Insertar guardias en lotes para mejor rendimiento
            console.log('📅 Creating', guardiasToCreate.length, 'validated guardias...');
            const batchSize = 50;
            for (let i = 0; i < guardiasToCreate.length; i += batchSize) {
              const batch = guardiasToCreate.slice(i, i + batchSize);
              const { error: guardiaError } = await supabase
                .from('guardias')
                .insert(batch);

              if (guardiaError) {
                console.error('❌ Error inserting guardias batch:', guardiaError);
                console.error('❌ Batch details:', {
                  batchNumber: Math.floor(i / batchSize) + 1,
                  batchSize: batch.length,
                  startIndex: i,
                  endIndex: i + batch.length - 1
                });

                // Log some sample guardias for debugging
                if (batch.length > 0) {
                  console.error('❌ Sample batch guardias:', batch.slice(0, 3).map(g => {
                    const start = new Date(g.fecha_inicio);
                    const end = new Date(g.fecha_fin);
                    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                    return {
                      tipo: g.tipo,
                      duration: duration.toFixed(1) + 'h',
                      start: start.toLocaleString(),
                      end: end.toLocaleString()
                    };
                  }));
                }

                const formattedError = formatSupabaseError(guardiaError);
                throw new Error(`Error en lote ${Math.floor(i / batchSize) + 1}: ${formattedError}`);
              }
            }
          }

          console.log('✅ Cuadrante generated successfully');
          set({ loading: false });
        } catch (error: any) {
          console.error('💥 Exception in generateCuadrante:', error);
          const errorMessage = formatSupabaseError(error);
          set({ error: 'Error al generar cuadrante: ' + errorMessage, loading: false });
          throw error;
        }
      },

      updateCuadrante: async (id, data) => {
        console.log('🔄 Updating cuadrante:', id, data);
        try {
          // Verificar si es un cuadrante virtual
          if (id.startsWith('virtual-')) {
            console.log('�� Virtual cuadrante, no database update needed');
            return;
          }

          const { error } = await supabase
            .from('cuadrantes_guardias')
            .update(data)
            .eq('id', id);

          if (error) {
            console.error('❌ Error updating cuadrante:', error);
            const errorMessage = formatSupabaseError(error);
            throw new Error(errorMessage);
          }

          console.log('✅ Cuadrante updated successfully');
        } catch (error: any) {
          console.error('💥 Exception in updateCuadrante:', error);
          const errorMessage = formatSupabaseError(error);
          throw new Error('Error al actualizar cuadrante: ' + errorMessage);
        }
      },

      exportCuadrante: async (id, formato) => {
        console.log('💾 Exporting cuadrante:', id, 'in format:', formato);
        try {
          let cuadrante: any;

          // Verificar si es un cuadrante virtual
          if (id.startsWith('virtual-')) {
            console.log('📋 Exporting virtual cuadrante');
            const parts = id.split('-');
            cuadrante = {
              id,
              mes: parseInt(parts[1]),
              anio: parseInt(parts[2]),
              centro_salud_id: parts[3] === 'all' ? null : parts[3],
              tipo_cuadrante: 'MENSUAL',
              estado: 'VIRTUAL'
            };
          } else {
            // Obtener datos del cuadrante real
            const { data: cuadranteData, error: cuadranteError } = await supabase
              .from('cuadrantes_guardias')
              .select('*')
              .eq('id', id)
              .single();

            if (cuadranteError) {
              const errorMessage = formatSupabaseError(cuadranteError);
              throw new Error(errorMessage);
            }

            cuadrante = cuadranteData;
          }

          // Obtener guardias del período
          const startDate = new Date(cuadrante.anio, cuadrante.mes - 1, 1);
          const endDate = new Date(cuadrante.anio, cuadrante.mes, 0, 23, 59, 59);

          let guardiasQuery = supabase
            .from('guardias')
            .select(`
              id,
              profesional_guardia_id,
              centro_salud_id,
              tipo,
              fecha_inicio,
              fecha_fin,
              tipo_dia,
              observaciones
            `)
            .gte('fecha_inicio', startDate.toISOString())
            .lte('fecha_inicio', endDate.toISOString())
            .order('fecha_inicio');

          if (cuadrante.centro_salud_id) {
            guardiasQuery = guardiasQuery.eq('centro_salud_id', cuadrante.centro_salud_id);
          }

          const { data: guardias, error: guardiasError } = await guardiasQuery;

          if (guardiasError) {
            const errorMessage = formatSupabaseError(guardiasError);
            throw new Error(errorMessage);
          }

          // En una implementación real, aquí se generaría el archivo
          // Por ahora, simular la exportación
          console.log('✅ Cuadrante export data prepared:', {
            cuadrante,
            guardias: guardias?.length || 0,
            formato
          });

          // Simular tiempo de exportación
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error: any) {
          console.error('💥 Exception in exportCuadrante:', error);
          const errorMessage = formatSupabaseError(error);
          throw new Error('Error al exportar cuadrante: ' + errorMessage);
        }
      },

      fetchValidaciones: async (mes, ano, centroId) => {
        console.log('✅ Fetching validaciones for:', { mes, ano, centroId });
        set({ loading: true, error: null });

        try {
          await retryWithBackoff(async () => {
            let query = supabase
              .from('validaciones_guardias')
              .select(`
                id,
                guardia_id,
                etapa,
                usuario_id,
                fecha,
                resultado,
                comentario,
                firma,
                created_at
              `)
              .order('created_at', { ascending: false });

            // Filtrar por centro si se especifica
            if (centroId) {
              // Filtrar por guardias del centro específico para el período
              const startDate = new Date(ano, mes - 1, 1);
              const endDate = new Date(ano, mes, 0, 23, 59, 59);

              const { data: guardiasData, error: guardiasError } = await supabase
                .from('guardias')
                .select('id')
                .eq('centro_salud_id', centroId)
                .gte('fecha_inicio', startDate.toISOString())
                .lte('fecha_inicio', endDate.toISOString());

              if (guardiasError) {
                console.error('❌ Error fetching guardias for centro:', guardiasError);
                throw guardiasError;
              }

              if (guardiasData && guardiasData.length > 0) {
                const guardiaIds = guardiasData.map(g => g.id);
                query = query.in('guardia_id', guardiaIds);
              } else {
                console.log('📄 No guardias found for center in this period');
                set({ validaciones: [], loading: false });
                return;
              }
            } else {
              // Sin filtro de centro, obtener por período general
              const startDate = new Date(ano, mes - 1, 1);
              const endDate = new Date(ano, mes, 0, 23, 59, 59);

              const { data: guardiasData, error: guardiasError } = await supabase
                .from('guardias')
                .select('id')
                .gte('fecha_inicio', startDate.toISOString())
                .lte('fecha_inicio', endDate.toISOString());

              if (guardiasError) {
                console.error('❌ Error fetching guardias for period:', guardiasError);
                throw guardiasError;
              }

              if (guardiasData && guardiasData.length > 0) {
                const guardiaIds = guardiasData.map(g => g.id);
                query = query.in('guardia_id', guardiaIds);
              }
            }

            const { data, error } = await query;

            if (error) {
              console.error('❌ Supabase error in fetchValidaciones:', error);
              throw error;
            }

            console.log('✅ Validaciones fetched successfully:', data?.length || 0, 'records');
            set({ validaciones: data || [], loading: false });
          });
        } catch (error: any) {
          console.error('💥 Exception in fetchValidaciones:', error);
          const errorMessage = formatSupabaseError(error);
          set({ error: 'Error al cargar validaciones: ' + errorMessage, loading: false });
        }
      },

      createValidacion: async (data) => {
        console.log('✅ Creating validacion with data:', data);
        set({ loading: true, error: null });
        try {
          // Import helper functions for enum validation and mapping
          const { mapWorkflowToEtapa, isValidWorkflowStage } = await import('@/utils/validacionHelpers');

          const validEtapas: EtapaValidacion[] = ['dir_medica', 'dir_admin', 'dir_enfermeria', 'jefe_rrhh', 'admin_hospital', 'dir_gerente', 'dg_coordinacion'];

          let etapaToUse: EtapaValidacion;

          // Accept both workflow stages and database enum values
          if (isValidWorkflowStage(data.etapa as string)) {
            etapaToUse = mapWorkflowToEtapa(data.etapa as any);
            console.log('🔄 Mapped workflow stage to database enum:', data.etapa, '→', etapaToUse);
          } else if (validEtapas.includes(data.etapa as EtapaValidacion)) {
            etapaToUse = data.etapa as EtapaValidacion;
            console.log('✅ Using provided database enum:', etapaToUse);
          } else {
            etapaToUse = 'dir_medica';
            console.warn('⚠️ Invalid etapa provided, defaulting to dir_medica. Provided:', data.etapa);
          }

          console.log('💾 Creating validacion with final etapa:', etapaToUse);

          const validacionData = {
            guardia_id: data.guardia_id,
            etapa: etapaToUse,
            usuario_id: data.usuario_id,
            resultado: data.resultado,
            comentario: data.comentario,
            firma: data.firma
          };

          const { error } = await supabase
            .from('validaciones_guardias')
            .insert(validacionData);

          if (error) {
            console.error('❌ Error creating validacion:', error);
            throw error;
          }

          console.log('✅ Validacion created successfully');
          set({ loading: false });
        } catch (error: any) {
          console.error('💥 Exception in createValidacion:', error);
          const errorMessage = formatSupabaseError(error);
          set({ error: 'Error al crear validación: ' + errorMessage, loading: false });
          throw error;
        }
      },

      updateValidacion: async (id, data) => {
        console.log('🔄 Updating validacion:', id, data);
        try {
          const { error } = await supabase
            .from('validaciones_guardias')
            .update(data)
            .eq('id', id);

          if (error) {
            console.error('❌ Error updating validacion:', error);
            throw error;
          }

          console.log('✅ Validacion updated successfully');
        } catch (error: any) {
          console.error('💥 Exception in updateValidacion:', error);
          const errorMessage = formatSupabaseError(error);
          throw new Error('Error al actualizar validación: ' + errorMessage);
        }
      },

      aprobarValidacion: async (id, comentarios) => {
        console.log('✅ Approving validacion:', id);
        try {
          await get().updateValidacion(id, {
            resultado: 'aprobada',
            comentario: comentarios,
            fecha: new Date().toISOString()
          });

          // Refrescar validaciones
          const currentDate = new Date();
          await get().fetchValidaciones(currentDate.getMonth() + 1, currentDate.getFullYear());
        } catch (error: any) {
          console.error('Error approving validacion:', error);
          throw error;
        }
      },

      rechazarValidacion: async (id, comentarios) => {
        console.log('❌ Rejecting validacion:', id);
        try {
          await get().updateValidacion(id, {
            resultado: 'rechazada',
            comentario: comentarios,
            fecha: new Date().toISOString()
          });

          // Refrescar validaciones
          const currentDate = new Date();
          await get().fetchValidaciones(currentDate.getMonth() + 1, currentDate.getFullYear());
        } catch (error: any) {
          console.error('Error rejecting validacion:', error);
          throw error;
        }
      },

      fetchNominas: async (mes, ano, centroId) => {
        console.log('📄 Fetching nominas for:', { mes, ano, centroId });
        set({ loading: true, error: null });
        try {
          let query = supabase
            .from('nominas_guardias')
            .select(`
              id,
              centro_salud_id,
              mes,
              anio,
              estado,
              total_importe,
              total_guardias,
              total_profesionales,
              created_by,
              approved_by,
              approved_at,
              observaciones,
              created_at,
              updated_at
            `)
            .eq('mes', mes)
            .eq('anio', ano)
            .order('created_at', { ascending: false });

          if (centroId) {
            query = query.eq('centro_salud_id', centroId);
          }

          const { data, error } = await query;

          if (error) {
            console.error('❌ Supabase error in fetchNominas:', error);
            throw error;
          }

          console.log('✅ Nominas fetched successfully:', data?.length || 0, 'records');
          set({ nominas: data || [], loading: false });
        } catch (error: any) {
          console.error('💥 Exception in fetchNominas:', error);
          const errorMessage = formatSupabaseError(error);
          set({ error: 'Error al cargar nóminas: ' + errorMessage, loading: false });
        }
      },

      fetchNominasLineas: async (nominaId) => {
        console.log('📄 Fetching nomina lineas for nomina:', nominaId);
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('nominas_guardias_lineas')
            .select(`
              id,
              nomina_id,
              profesional_guardia_id,
              categoria,
              guardias_ordinarias,
              guardias_fines_semana,
              guardias_festivos,
              localizables_programadas,
              localizables_llamadas,
              coste_unitario_ordinario,
              coste_unitario_fin_semana,
              coste_unitario_festivo,
              coste_localizable_programada,
              coste_localizable_llamada,
              total_linea,
              created_at,
              updated_at
            `)
            .eq('nomina_id', nominaId);

          if (error) {
            console.error('❌ Supabase error in fetchNominasLineas:', error);
            throw error;
          }

          console.log('✅ Nomina lineas fetched successfully:', data?.length || 0, 'records');
          set({ nominasLineas: data || [], loading: false });
        } catch (error: any) {
          console.error('💥 Exception in fetchNominasLineas:', error);
          const errorMessage = formatSupabaseError(error);
          set({ error: 'Error al cargar líneas de nómina: ' + errorMessage, loading: false });
        }
      },

      generateNomina: async (data) => {
        console.log('📄 Generating nomina with data:', data);
        set({ loading: true, error: null });
        try {
          // Paso 1: Obtener guardias del mes/año/centro especificado
          let guardiasQuery = supabase
            .from('guardias')
            .select(`
              id,
              profesional_guardia_id,
              centro_salud_id,
              tipo,
              tipo_dia,
              fecha_inicio,
              fecha_fin
            `)
            .gte('fecha_inicio', new Date(data.ano, data.mes - 1, 1).toISOString())
            .lte('fecha_inicio', new Date(data.ano, data.mes, 0, 23, 59, 59).toISOString());

          // Solo filtrar por centro si se proporciona
          if (data.centro_id) {
            guardiasQuery = guardiasQuery.eq('centro_salud_id', data.centro_id);
          }

          const { data: guardiasData, error: guardiasError } = await guardiasQuery;
          if (guardiasError) {
            console.error('❌ Error fetching guardias for nomina:', guardiasError);
            const errorMessage = formatSupabaseError(guardiasError);
            throw new Error(errorMessage);
          }

          console.log('📅 Found guardias for nomina:', guardiasData?.length || 0);

          if (!guardiasData || guardiasData.length === 0) {
            throw new Error('No se encontraron guardias para el período especificado');
          }

          // Paso 2: Agrupar guardias por profesional y calcular totales
          const guardiasGrouped = guardiasData.reduce((acc, guardia) => {
            const key = guardia.profesional_guardia_id;
            if (!acc[key]) {
              acc[key] = {
                profesional_guardia_id: key,
                guardias_ordinarias: 0,
                guardias_fines_semana: 0,
                guardias_festivos: 0,
                localizables_programadas: 0,
                localizables_llamadas: 0
              };
            }

            // Contar por tipo de día
            if (guardia.tipo_dia === 'ordinario') {
              acc[key].guardias_ordinarias++;
            } else if (guardia.tipo_dia === 'fin_semana') {
              acc[key].guardias_fines_semana++;
            } else if (guardia.tipo_dia === 'festivo') {
              acc[key].guardias_festivos++;
            }

            // Contar localizables
            if (guardia.tipo === 'localizable') {
              acc[key].localizables_programadas++;
            }

            return acc;
          }, {} as any);

          const profesionalesConGuardias = Object.values(guardiasGrouped);
          console.log('👥 Professionals with guardias:', profesionalesConGuardias.length);

          // Paso 3: Asegurar que tenemos baremos cargados
          if (get().baremos.length === 0) {
            await get().fetchBaremos();
          }

          // Paso 4: Validar que se proporcione centro_salud_id
          if (!data.centro_id) {
            throw new Error('Debe seleccionar un centro de salud para generar la nómina');
          }

          // Crear la nómina principal
          const nominaData = {
            centro_salud_id: data.centro_id,
            mes: data.mes,
            anio: data.ano,
            estado: 'borrador',
            total_guardias: guardiasData.length,
            total_profesionales: profesionalesConGuardias.length,
            observaciones: `Nómina generada automáticamente para ${data.mes}/${data.ano}`
          };

          const { data: nominaCreated, error: nominaError } = await supabase
            .from('nominas_guardias')
            .insert(nominaData)
            .select()
            .single();

          if (nominaError) {
            console.error('❌ Error creating nomina:', nominaError);
            const errorMessage = formatSupabaseError(nominaError);
            throw new Error(errorMessage);
          }
          console.log('✅ Nomina created:', nominaCreated.id);

          // Paso 5: Crear las líneas de nómina con cálculos
          const baremos = get().baremos;
          let totalImporte = 0;

          for (const profesionalGuardias of profesionalesConGuardias) {
            // Obtener categoria del profesional (simplificado - usar 'general_licenciado' por defecto)
            const categoria = 'general_licenciado';

            // Buscar baremos aplicables
            const baremoOrdinario = baremos.find(b => b.categoria === categoria && b.tipo_dia === 'ordinario' && b.tipo_guardia === 'fisica');
            const baremoFinSemana = baremos.find(b => b.categoria === categoria && b.tipo_dia === 'fin_semana' && b.tipo_guardia === 'fisica');
            const baremoFestivo = baremos.find(b => b.categoria === categoria && b.tipo_dia === 'festivo' && b.tipo_guardia === 'fisica');
            const baremoLocalizable = baremos.find(b => b.categoria === categoria && b.tipo_guardia === 'localizable');

            // Calcular costes
            const costeOrdinario = baremoOrdinario?.valor || 50000; // XAF por defecto
            const costeFinSemana = baremoFinSemana?.valor || 75000;
            const costeFestivo = baremoFestivo?.valor || 100000;
            const costeLocalizable = baremoLocalizable?.valor || 25000;

            const totalLinea =
              (profesionalGuardias.guardias_ordinarias * costeOrdinario) +
              (profesionalGuardias.guardias_fines_semana * costeFinSemana) +
              (profesionalGuardias.guardias_festivos * costeFestivo) +
              (profesionalGuardias.localizables_programadas * costeLocalizable);

            const lineaData = {
              nomina_id: nominaCreated.id,
              profesional_guardia_id: profesionalGuardias.profesional_guardia_id,
              categoria: categoria,
              guardias_ordinarias: profesionalGuardias.guardias_ordinarias,
              guardias_fines_semana: profesionalGuardias.guardias_fines_semana,
              guardias_festivos: profesionalGuardias.guardias_festivos,
              localizables_programadas: profesionalGuardias.localizables_programadas,
              localizables_llamadas: profesionalGuardias.localizables_llamadas,
              coste_unitario_ordinario: costeOrdinario,
              coste_unitario_fin_semana: costeFinSemana,
              coste_unitario_festivo: costeFestivo,
              coste_localizable_programada: costeLocalizable,
              total_linea: totalLinea
            };

            const { error: lineaError } = await supabase
              .from('nominas_guardias_lineas')
              .insert(lineaData);

            if (lineaError) {
              console.error('❌ Error creating nomina line:', lineaError);
              const errorMessage = formatSupabaseError(lineaError);
              throw new Error(`Error al crear línea de nómina: ${errorMessage}`);
            }

            totalImporte += totalLinea;
          }

          // Paso 6: Actualizar nómina con total calculado
          const { error: updateError } = await supabase
            .from('nominas_guardias')
            .update({ total_importe: totalImporte })
            .eq('id', nominaCreated.id);

          if (updateError) {
            console.error('❌ Error updating nomina total:', updateError);
            const errorMessage = formatSupabaseError(updateError);
            throw new Error(errorMessage);
          }

          console.log('✅ Nomina generated successfully with total:', totalImporte);

          // Refrescar datos
          await get().fetchNominas(data.mes, data.ano, data.centro_id);
          set({ loading: false });

          console.log('✅ Nomina generation completed successfully');

        } catch (error: any) {
          console.error('💥 Exception in generateNomina:', error);
          const errorMessage = formatSupabaseError(error);
          set({ error: 'Error al generar nómina: ' + errorMessage, loading: false });
          throw new Error(errorMessage);
        }
      },

      aprobarNomina: async (id) => {
        console.log('�� Approving nomina:', id);
        try {
          const { error } = await supabase
            .from('nominas_guardias')
            .update({
              estado: 'aprobada',
              approved_at: new Date().toISOString()
            })
            .eq('id', id);

          if (error) throw error;

          // Refrescar nóminas
          const currentDate = new Date();
          await get().fetchNominas(currentDate.getMonth() + 1, currentDate.getFullYear());
        } catch (error: any) {
          console.error('Error approving nomina:', error);
          throw error;
        }
      },

      rechazarNomina: async (id) => {
        console.log('��� Rejecting nomina:', id);
        try {
          const { error } = await supabase
            .from('nominas_guardias')
            .update({ estado: 'rechazada' })
            .eq('id', id);

          if (error) throw error;

          // Refrescar nóminas
          const currentDate = new Date();
          await get().fetchNominas(currentDate.getMonth() + 1, currentDate.getFullYear());
        } catch (error: any) {
          console.error('Error rejecting nomina:', error);
          throw error;
        }
      },

      exportNomina: async (id, formato) => {
        console.log('Export nomina:', id, formato);
      },

      calcularMontoGuardia: async (guardiaId) => {
        console.log('💰 Calculating amount for guardia:', guardiaId);
        try {
          // Buscar la guardia
          const guardia = get().guardias.find(g => g.id === guardiaId);
          if (!guardia) {
            console.warn('Guardia not found:', guardiaId);
            return 0;
          }

          // Asegurar que los baremos estén cargados
          if (get().baremos.length === 0) {
            await get().fetchBaremos();
          }

          // Calcular el monto usando la lógica de tipo de día
          const montoCalculado = get().calcularMontoConTipoDia(
            0, // monto base (será reemplazado por el valor del baremo)
            guardia.tipo_dia,
            guardia.tipo
          );

          console.log('✅ Calculated amount:', montoCalculado, 'for guardia:', guardiaId);
          return montoCalculado;
        } catch (error: any) {
          console.error('❌ Error calculating guardia amount:', error);
          return 0;
        }
      },

      fetchPagos: async (mes, ano, centroId) => {
        console.log('💳 Fetching pagos for:', { mes, ano, centroId });
        set({ loading: true, error: null });

        try {
          await retryWithBackoff(async () => {
            // Los pagos están relacionados con nóminas, así que primero obtenemos las nóminas
            let nominasQuery = supabase
              .from('nominas_guardias')
              .select('id, mes, anio, total_importe')
              .eq('mes', mes)
              .eq('anio', ano);

            if (centroId) {
              nominasQuery = nominasQuery.eq('centro_salud_id', centroId);
            }

            const { data: nominasData, error: nominasError } = await nominasQuery;

            if (nominasError) {
              console.error('❌ Supabase error in fetchPagos (nominas):', nominasError);
              throw nominasError;
            }

            if (!nominasData || nominasData.length === 0) {
              console.log('📄 No nominas found for period, no pagos to fetch');
              set({ pagos: [], loading: false });
              return;
            }

            const nominaIds = nominasData.map(n => n.id);
            console.log('📊 Found nominas:', nominaIds.length);

            const { data, error } = await supabase
              .from('pagos_guardias')
              .select(`
                id,
                nomina_id,
                profesional_guardia_id,
                forma_pago,
                fecha_pago,
                importe,
                comprobante_url,
                observaciones,
                estado,
                created_by,
                created_at,
                updated_at
              `)
              .in('nomina_id', nominaIds)
              .order('created_at', { ascending: false });

            if (error) {
              console.error('❌ Supabase error in fetchPagos:', error);
              throw error;
            }

            // Enriquecer con datos de nóminas
            const pagosEnriquecidos = (data || []).map(pago => ({
              ...pago,
              nomina: nominasData.find(n => n.id === pago.nomina_id)
            }));

            console.log('✅ Pagos fetched successfully:', pagosEnriquecidos.length, 'records');
            set({ pagos: pagosEnriquecidos, loading: false });
          });
        } catch (error: any) {
          console.error('💥 Exception in fetchPagos:', error);
          const errorMessage = formatSupabaseError(error);
          set({ error: 'Error al cargar pagos: ' + errorMessage, loading: false });
        }
      },

      createPago: async (data) => {
        console.log('💳 Creating pago with data:', data);
        set({ loading: true, error: null });
        try {
          // Convert empty strings to null for UUID fields and map property names
          const pagoData = {
            nomina_id: data.nomina_id && data.nomina_id.trim() !== '' ? data.nomina_id : null,
            profesional_guardia_id: data.profesional_guardia_id && data.profesional_guardia_id.trim() !== ''
              ? data.profesional_guardia_id
              : (data.profesional_id && data.profesional_id.trim() !== '' ? data.profesional_id : null),
            forma_pago: data.forma_pago || data.metodo_pago || 'transfer_trabajador',
            importe: data.importe || data.monto || 0,
            comprobante_url: data.comprobante_url && data.comprobante_url.trim() !== '' ? data.comprobante_url : null,
            observaciones: data.observaciones && data.observaciones.trim() !== '' ? data.observaciones : null,
            estado: data.estado || 'pendiente'
          };

          console.log('🔍 Processed pago data:', pagoData);

          // Validate required fields
          if (!pagoData.nomina_id) {
            throw new Error('Debe seleccionar una nómina');
          }
          if (!pagoData.profesional_guardia_id) {
            throw new Error('Debe seleccionar un profesional');
          }
          if (!pagoData.importe || pagoData.importe <= 0) {
            throw new Error('El importe debe ser mayor a 0');
          }

          const { error } = await supabase
            .from('pagos_guardias')
            .insert(pagoData);

          if (error) {
            console.error('❌ Error creating pago:', error);
            throw error;
          }

          console.log('✅ Pago created successfully');
          set({ loading: false });
        } catch (error: any) {
          console.error('💥 Exception in createPago:', error);
          const errorMessage = formatSupabaseError(error);
          set({ error: 'Error al crear pago: ' + errorMessage, loading: false });
          throw error;
        }
      },

      updatePago: async (id, data) => {
        console.log('🔄 Updating pago:', id, data);
        try {
          const { error } = await supabase
            .from('pagos_guardias')
            .update(data)
            .eq('id', id);

          if (error) {
            console.error('❌ Error updating pago:', error);
            throw error;
          }

          console.log('✅ Pago updated successfully');
        } catch (error: any) {
          console.error('💥 Exception in updatePago:', error);
          const errorMessage = formatSupabaseError(error);
          throw new Error('Error al actualizar pago: ' + errorMessage);
        }
      },

      aprobarPago: async (id) => {
        console.log('✅ Approving pago:', id);
        try {
          await get().updatePago(id, {
            estado: 'realizado',
            fecha_pago: new Date().toISOString()
          });

          // Refrescar pagos
          const currentDate = new Date();
          await get().fetchPagos(currentDate.getMonth() + 1, currentDate.getFullYear());
        } catch (error: any) {
          console.error('Error approving pago:', error);
          throw error;
        }
      },

      rechazarPago: async (id) => {
        console.log('❌ Rejecting pago:', id);
        try {
          // Since 'rechazado' is not in DB constraints, we'll set it back to 'pendiente' with a note
          await get().updatePago(id, {
            estado: 'pendiente',
            observaciones: 'Pago rechazado - requiere revisión'
          });

          // Refrescar pagos
          const currentDate = new Date();
          await get().fetchPagos(currentDate.getMonth() + 1, currentDate.getFullYear());
        } catch (error: any) {
          console.error('Error rejecting pago:', error);
          throw error;
        }
      },

      procesarPagoMasivo: async (pagoIds) => {
        console.log('🔄 Processing batch payments:', pagoIds.length, 'pagos');
        set({ loading: true, error: null });
        try {
          const { error } = await supabase
            .from('pagos_guardias')
            .update({
              estado: 'confirmado', // ✅ Valid DB constraint value (was 'procesado')
              fecha_pago: new Date().toISOString()
            })
            .in('id', pagoIds);

          if (error) {
            console.error('❌ Error processing batch payments:', error);
            throw error;
          }

          console.log('��� Batch payments processed successfully');

          // Refrescar pagos
          const currentDate = new Date();
          await get().fetchPagos(currentDate.getMonth() + 1, currentDate.getFullYear());
          set({ loading: false });
        } catch (error: any) {
          console.error('💥 Exception in procesarPagoMasivo:', error);
          const errorMessage = formatSupabaseError(error);
          set({ error: 'Error al procesar pagos masivos: ' + errorMessage, loading: false });
          throw error;
        }
      },

      exportPagos: async (mes, ano, centroId) => {
        console.log('Export pagos:', mes, ano, centroId);
      },

      fetchBaremos: async () => {
        set({ loading: true });

        try {
          await retryWithBackoff(async () => {
            const { data, error } = await supabase
              .from('ajustes_baremos')
              .select('*')
              .eq('activo', true)
              .order('created_at', { ascending: false });

            if (error) throw error;

            // Usar los datos directamente del esquema de la BD
            const baremos: Baremo[] = (data || []).map(item => ({
              id: item.id,
              fuente: item.fuente,
              categoria: item.categoria,
              tipo_guardia: item.tipo_guardia,
              tipo_dia: item.tipo_dia,
              valor: Number(item.valor),
              porcentaje_localizable: Number(item.porcentaje_localizable || 10),
              porcentaje_llamada: Number(item.porcentaje_llamada || 20),
              vigente_desde: item.vigente_desde,
              vigente_hasta: item.vigente_hasta,
              activo: item.activo,
              observaciones: item.observaciones,
              created_at: item.created_at,
              updated_at: item.updated_at
            }));

            set({ baremos, loading: false });
          });
        } catch (error: any) {
          set({ error: 'Error al cargar baremos: ' + error.message, loading: false });
        }
      },

      createBaremo: async (data) => {
        try {
          const { error } = await supabase
            .from('ajustes_baremos')
            .insert(data);

          if (error) throw error;

          await get().fetchBaremos();
        } catch (error: any) {
          console.error('Error creating baremo:', error);
          throw error;
        }
      },

      updateBaremo: async (id, data) => {
        try {
          const { error } = await supabase
            .from('ajustes_baremos')
            .update(data)
            .eq('id', id);

          if (error) throw error;

          await get().fetchBaremos();
        } catch (error: any) {
          console.error('Error updating baremo:', error);
          throw error;
        }
      },

      deleteBaremo: async (id) => {
        try {
          const { error } = await supabase
            .from('ajustes_baremos')
            .update({ activo: false })
            .eq('id', id);

          if (error) throw error;

          await get().fetchBaremos();
        } catch (error: any) {
          console.error('Error deleting baremo:', error);
          throw error;
        }
      },

      fetchDiasFestivos: async () => {
        console.log('🎆 Fetching días festivos...');
        set({ loading: true, error: null });

        try {
          await retryWithBackoff(async () => {
            const { data, error } = await supabase
              .from('dias_festivos')
              .select('*')
              .eq('activo', true)
              .order('fecha');

            if (error) {
              console.error('❌ Supabase error in fetchDiasFestivos:', error);
              throw error;
            }

            console.log('📊 Raw dias festivos data:', data?.length || 0, 'records');

            // Convertir al formato esperado
            const diasFestivos: DiaFestivo[] = (data || []).map(item => ({
              id: item.id,
              nombre: item.nombre,
              fecha: item.fecha,
              tipo: 'NACIONAL', // Valor por defecto
              recurrente: false, // Valor por defecto
              activo: item.activo,
              observaciones: item.descripcion
            }));

            console.log('✅ Dias festivos processed successfully:', diasFestivos.length);
            set({ diasFestivos, loading: false });
          });
        } catch (error: any) {
          console.error('💥 Exception in fetchDiasFestivos:', error);
          const errorMessage = formatSupabaseError(error);
          set({ error: 'Error al cargar días festivos: ' + errorMessage, loading: false });
        }
      },

      createDiaFestivo: async (data) => {
        try {
          const festiveData = {
            nombre: data.nombre,
            fecha: data.fecha,
            descripcion: data.observaciones,
            activo: data.activo !== false
          };

          const { error } = await supabase
            .from('dias_festivos')
            .insert(festiveData);

          if (error) throw error;

          await get().fetchDiasFestivos();
        } catch (error: any) {
          console.error('Error creating dia festivo:', error);
          throw error;
        }
      },

      updateDiaFestivo: async (id, data) => {
        try {
          const festiveData = {
            nombre: data.nombre,
            fecha: data.fecha,
            descripcion: data.observaciones,
            activo: data.activo
          };

          const { error } = await supabase
            .from('dias_festivos')
            .update(festiveData)
            .eq('id', id);

          if (error) throw error;

          await get().fetchDiasFestivos();
        } catch (error: any) {
          console.error('Error updating dia festivo:', error);
          throw error;
        }
      },

      deleteDiaFestivo: async (id) => {
        try {
          const { error } = await supabase
            .from('dias_festivos')
            .delete()
            .eq('id', id);

          if (error) throw error;

          await get().fetchDiasFestivos();
        } catch (error: any) {
          console.error('Error deleting dia festivo:', error);
          throw error;
        }
      },

      fetchAjustesBaremos: async (centroId) => {
        set({ loading: true });
        try {
          let query = supabase
            .from('ajustes_baremos')
            .select('*')
            .eq('activo', true);

          if (centroId) {
            // Nota: La tabla ajustes_baremos no tiene centro_id en el esquema actual
            // Se mantiene para compatibilidad futura
          }

          const { data, error } = await query;

          if (error) throw error;

          set({ ajustesBaremos: data || [], loading: false });
        } catch (error: any) {
          set({ error: 'Error al cargar ajustes de baremos: ' + error.message, loading: false });
        }
      },

      createAjusteBaremo: async (data) => {
        try {
          const { error } = await supabase
            .from('ajustes_baremos')
            .insert(data);

          if (error) throw error;

          await get().fetchAjustesBaremos();
        } catch (error: any) {
          console.error('Error creating ajuste baremo:', error);
          throw error;
        }
      },

      updateAjusteBaremo: async (id, data) => {
        try {
          const { error } = await supabase
            .from('ajustes_baremos')
            .update(data)
            .eq('id', id);

          if (error) throw error;

          await get().fetchAjustesBaremos();
        } catch (error: any) {
          console.error('Error updating ajuste baremo:', error);
          throw error;
        }
      },

      deleteAjusteBaremo: async (id) => {
        try {
          const { error } = await supabase
            .from('ajustes_baremos')
            .update({ activo: false })
            .eq('id', id);

          if (error) throw error;

          await get().fetchAjustesBaremos();
        } catch (error: any) {
          console.error('Error deleting ajuste baremo:', error);
          throw error;
        }
      },

      fetchBitacora: async (params) => {
        console.log('📄 Fetching bitacora with params:', params);
        set({ loading: true, error: null });
        try {
          let query = supabase
            .from('bitacora_guardias')
            .select(`
              id,
              ref_tipo,
              ref_id,
              usuario_id,
              accion,
              detalle,
              fecha,
              ip_address,
              user_agent
            `)
            .order('fecha', { ascending: false });

          // Aplicar filtros de fecha si están presentes
          if (params.fecha_inicio) {
            console.log('📅 Applying start date filter:', params.fecha_inicio);
            query = query.gte('fecha', params.fecha_inicio);
          }
          if (params.fecha_fin) {
            console.log('📅 Applying end date filter:', params.fecha_fin);
            query = query.lte('fecha', params.fecha_fin);
          }

          // Filtrar por centro si se especifica (por guardias del centro)
          if (params.centro_id) {
            console.log('🏥 Filtering by center:', params.centro_id);
            // Obtener guardias del centro para filtrar bitacora relacionada
            const { data: guardiasData } = await supabase
              .from('guardias')
              .select('id')
              .eq('centro_salud_id', params.centro_id);

            if (guardiasData && guardiasData.length > 0) {
              const guardiaIds = guardiasData.map(g => g.id);
              query = query.or(`ref_tipo.eq.guardia,ref_tipo.eq.nomina,ref_tipo.eq.pago`)
                           .in('ref_id', guardiaIds);
            }
          }

          // Filtrar por mes y año si se especifica
          if (params.mes && params.ano) {
            const startDate = new Date(params.ano, params.mes - 1, 1);
            const endDate = new Date(params.ano, params.mes, 0, 23, 59, 59);
            query = query.gte('fecha', startDate.toISOString())
                         .lte('fecha', endDate.toISOString());
          }

          const { data, error } = await query.limit(500); // Limitar a 500 registros por rendimiento

          if (error) {
            console.error('❌ Supabase error in fetchBitacora:', error);
            throw error;
          }

          console.log('✅ Bitacora fetched successfully:', data?.length || 0, 'records');

          // Convertir al formato esperado con datos enriquecidos
          const bitacora: BitacoraEntry[] = (data || []).map(item => ({
            id: item.id,
            ref_tipo: item.ref_tipo,
            ref_id: item.ref_id,
            usuario_id: item.usuario_id,
            accion: item.accion,
            detalle: item.detalle,
            fecha: item.fecha,
            ip_address: item.ip_address,
            user_agent: item.user_agent
          }));

          set({ bitacora, loading: false });
        } catch (error: any) {
          console.error('💥 Exception in fetchBitacora:', error);
          const errorMessage = formatSupabaseError(error);
          set({ error: 'Error al cargar bitácora: ' + errorMessage, loading: false });
        }
      },

      exportAuditLog: async (params) => {
        console.log('Export audit log:', params);
      },

      generateReport: async (tipo, params) => {
        console.log('Generate report:', tipo, params);
      },

      exportReport: async (tipo, params) => {
        console.log('Export report:', tipo, params);
      },

      exportConfiguration: async () => {
        console.log('Export configuration');
      },

      importConfiguration: async (file) => {
        console.log('Import configuration:', file);
      },

      // Utilidades para días festivos
      isDiaFestivo: (fecha: string) => {
        const fechaObj = new Date(fecha);
        const fechaStr = fechaObj.toISOString().split('T')[0];
        return get().diasFestivos.some(festivo =>
          festivo.activo && festivo.fecha === fechaStr
        );
      },

      getTipoDia: (fecha: string) => {
        const fechaObj = new Date(fecha);
        const diaSemana = fechaObj.getDay(); // 0 = domingo, 6 = sábado

        // Verificar si es día festivo
        if (get().isDiaFestivo(fecha)) {
          return 'festivo';
        }

        // Verificar si es fin de semana
        if (diaSemana === 0 || diaSemana === 6) {
          return 'fin_semana';
        }

        return 'ordinario';
      },

      calcularMontoConTipoDia: (montoBase: number, tipoDia: string, tipo: string) => {
        const baremos = get().baremos;

        // Buscar baremo correspondiente
        const baremo = baremos.find(b =>
          b.activo &&
          b.tipo_guardia === tipo &&
          b.tipo_dia === tipoDia
        );

        if (!baremo) {
          console.warn(`No se encontró baremo para tipo: ${tipo}, tipo_dia: ${tipoDia}`);
          return montoBase;
        }

        let montoFinal = baremo.valor;

        // Aplicar porcentajes según el tipo
        if (tipo === 'localizable') {
          montoFinal *= (1 + baremo.porcentaje_localizable / 100);
        }

        return Math.round(montoFinal * 100) / 100; // Redondear a 2 decimales
      },

      resetConfiguration: async () => {
        console.log('Reset configuration');
      },
    }),
    {
      name: 'guardias-store',
      partialize: (state) => ({
        // Solo persistir datos que no sean sensibles
      }),
    }
  )
);
