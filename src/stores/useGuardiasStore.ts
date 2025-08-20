import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

// Helper function to format Supabase errors properly
const formatSupabaseError = (error: any): string => {
  if (!error) return 'Error desconocido';

  if (typeof error === 'string') return error;

  if (error.message) return error.message;

  if (error.details) return error.details;

  if (error.hint) return error.hint;

  // If it's a PostgreSQL error
  if (error.code) {
    switch (error.code) {
      case '23505':
        return 'Ya existe un registro con estos datos';
      case '23503':
        return 'Referencia a un registro que no existe';
      case '42P01':
        return 'La tabla no existe en la base de datos';
      case '42703':
        return 'Columna no encontrada en la tabla';
      default:
        return `Error de base de datos (${error.code}): ${error.message || 'Error desconocido'}`;
    }
  }

  // Fallback: stringify the error object but make it readable
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return 'Error desconocido al procesar la solicitud';
  }
};

// Tipos básicos
export interface Guardia {
  id: string;
  profesional_id: string;
  centro_id: string;
  fecha: string;
  turno: 'MAÑANA' | 'TARDE' | 'NOCHE';
  tipo_guardia: 'ORDINARIA' | 'FESTIVA' | 'NOCTURNA';
  horas_inicio: string;
  horas_fin: string;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
  // Datos relacionados
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
  estado: 'BORRADOR' | 'GENERADO' | 'APROBADO';
  fecha_generacion: string;
  fecha_aprobacion?: string;
  auto_asignar: boolean;
  considerar_preferencias: boolean;
}

export interface Validacion {
  id: string;
  numero_validacion: string;
  mes: number;
  ano: number;
  centro_id?: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  fecha_solicitud: string;
  fecha_validacion?: string;
  descripcion: string;
  observaciones?: string;
  solicitante?: {
    id: string;
    nombre_completo: string;
  };
  centro?: {
    id: string;
    nombre: string;
  };
}

export interface Nomina {
  id: string;
  mes: number;
  ano: number;
  centro_id?: string;
  estado: 'BORRADOR' | 'GENERADA' | 'REVISADA' | 'APROBADA' | 'RECHAZADA';
  total: number;
  total_lineas: number;
  fecha_generacion: string;
  fecha_aprobacion?: string;
}

export interface NominaLinea {
  id: string;
  nomina_id: string;
  profesional_id: string;
  cantidad_guardias: number;
  total_horas: number;
  total_base: number;
  total_complementos: number;
  total_linea: number;
  profesional?: {
    id: string;
    nombre_completo: string;
  };
}

export interface Pago {
  id: string;
  nomina_id: string;
  profesional_id: string;
  monto: number;
  metodo_pago: 'TRANSFERENCIA' | 'CHEQUE' | 'EFECTIVO';
  estado: 'PENDIENTE' | 'APROBADO' | 'PROCESADO' | 'RECHAZADO';
  referencia_pago?: string;
  observaciones?: string;
  fecha_creacion: string;
  fecha_aprobacion?: string;
  fecha_procesamiento?: string;
  profesional?: {
    id: string;
    nombre_completo: string;
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
  accion: string;
  entidad_tipo: string;
  entidad_id?: string;
  usuario_email: string;
  descripcion: string;
  datos_anteriores?: any;
  datos_nuevos?: any;
  fecha_hora: string;
  ip_address?: string;
  user_agent?: string;
}

interface GuardiasStoreState {
  // Estado
  loading: boolean;
  error: string | null;

  // Datos
  guardias: Guardia[];
  profesionales: Profesional[];
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
        set({ loading: true, error: null });
        try {
          let query = supabase
            .from('guardias')
            .select('*')
            .order('fecha_inicio', { ascending: false });

          // Filtrar por mes y año
          const startDate = new Date(ano, mes - 1, 1);
          const endDate = new Date(ano, mes, 0);
          query = query
            .gte('fecha_inicio', startDate.toISOString())
            .lte('fecha_inicio', endDate.toISOString());

          // Filtrar por centro si se especifica
          if (centroId) {
            query = query.eq('centro_salud_id', centroId);
          }

          const { data, error } = await query;

          if (error) {
            console.error('Error fetching guardias:', error);
            throw error;
          }

          console.log('Guardias fetched:', data?.length || 0);
          set({ guardias: data || [], loading: false });
        } catch (error: any) {
          console.error('Error fetching guardias:', error);
          const errorMessage = formatSupabaseError(error);
          set({ error: 'Error al cargar guardias: ' + errorMessage, loading: false });
        }
      },

      createGuardia: async (data) => {
        set({ loading: true });
        try {
          // Primero, asegurar que existe un registro en profesionales_guardias
          let profesionalGuardiaId = await get().ensureProfesionalGuardia(data.profesional_id);

          // Mapear los datos al esquema correcto de la base de datos
          const guardiaData = {
            profesional_guardia_id: profesionalGuardiaId,
            centro_salud_id: data.centro_id,
            tipo: data.tipo_guardia === 'ORDINARIA' ? 'fisica' :
                  data.tipo_guardia === 'NOCTURNA' ? 'fisica' : 'localizable',
            fecha_inicio: new Date(`${data.fecha} ${data.horas_inicio}`).toISOString(),
            fecha_fin: new Date(`${data.fecha} ${data.horas_fin}`).toISOString(),
            tipo_dia: 'ordinario', // Por defecto, luego se puede calcular basado en la fecha
            observaciones: data.observaciones
          };

          const { error } = await supabase
            .from('guardias')
            .insert(guardiaData);

          if (error) {
            throw error;
          }

          // Refrescar datos
          const currentDate = new Date();
          await get().fetchGuardias(currentDate.getMonth() + 1, currentDate.getFullYear());

          set({ loading: false });
        } catch (error: any) {
          set({ error: 'Error al crear guardia: ' + error.message, loading: false });
        }
      },

      // Nueva función para asegurar que existe un profesional_guardia
      ensureProfesionalGuardia: async (profesionalId: string) => {
        try {
          // Buscar si ya existe un registro en profesionales_guardias
          const { data: existing, error: searchError } = await supabase
            .from('profesionales_guardias')
            .select('id')
            .eq('profesional_id', profesionalId)
            .single();

          if (!searchError && existing) {
            return existing.id;
          }

          // Si no existe, obtener datos del profesional sanitario
          const { data: profesional, error: profError } = await supabase
            .from('profesionales_sanitarios')
            .select('id, nombre_completo, area_profesional')
            .eq('id', profesionalId)
            .single();

          if (profError || !profesional) {
            throw new Error('Profesional no encontrado');
          }

          // Determinar categoría basada en area_profesional
          let categoria: 'especialista' | 'general_licenciado' | 'tecnico_diplomado' | 'auxiliar' | 'subalterno' | 'odepac' | 'secre_asist_pacientes' | 'caja' = 'general_licenciado';

          const areaProfesional = profesional.area_profesional?.toLowerCase() || '';
          if (areaProfesional.includes('especialista') || areaProfesional.includes('especialidad')) {
            categoria = 'especialista';
          } else if (areaProfesional.includes('técnico') || areaProfesional.includes('tecnico')) {
            categoria = 'tecnico_diplomado';
          } else if (areaProfesional.includes('auxiliar')) {
            categoria = 'auxiliar';
          }

          // Crear nuevo registro en profesionales_guardias
          const { data: newRecord, error: insertError } = await supabase
            .from('profesionales_guardias')
            .insert({
              profesional_id: profesionalId,
              categoria: categoria,
              unidad_servicio: profesional.area_profesional || 'Servicio General',
              activo: true
            })
            .select('id')
            .single();

          if (insertError) {
            throw insertError;
          }

          return newRecord.id;
        } catch (error: any) {
          throw new Error(`Error al preparar profesional para guardias: ${error.message}`);
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
          set({ error: 'Error al actualizar guardia: ' + error.message, loading: false });
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
          set({ error: 'Error al eliminar guardia: ' + error.message, loading: false });
        }
      },

      // Operaciones CRUD - Profesionales
      fetchProfesionales: async (centroId) => {
        set({ loading: true });
        try {
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
            query = query.eq('centro_salud_id', centroId);
          }

          const { data, error } = await query;

          if (error) {
            console.error('Error fetching profesionales:', error);
            throw error;
          }

          const profesionales: Profesional[] = (data || []).map(prof => ({
            id: prof.id,
            nombre_completo: prof.nombre_completo,
            especialidad: prof.area_profesional || prof.especialidad || 'No especificado',
            centro_id: prof.centro_salud_id || undefined,
            activo: prof.estado_solicitud === 'Aprobado'
          }));

          console.log('Profesionales fetched:', profesionales.length);
          set({ profesionales, loading: false });
        } catch (error: any) {
          console.error('Error fetching profesionales:', error);
          const errorMessage = formatSupabaseError(error);
          set({ error: 'Error al cargar profesionales: ' + errorMessage, loading: false });
        }
      },

      // Operaciones CRUD - Centros
      fetchCentros: async () => {
        set({ loading: true });
        try {
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
            console.error('Error fetching centros:', error);
            throw error;
          }

          const centros: Centro[] = (data || []).map(centro => ({
            id: centro.id,
            nombre: centro.nombre,
            tipo_centro: centro.categoria || 'Centro de Salud',
            provincia: centro.provincia || 'No especificada'
          }));

          console.log('Centros fetched:', centros.length);
          set({ centros, loading: false });
        } catch (error: any) {
          console.error('Error fetching centros:', error);
          const errorMessage = formatSupabaseError(error);
          set({ error: 'Error al cargar centros: ' + errorMessage, loading: false });
        }
      },

      // Implementaciones placeholder para las demás operaciones (se pueden implementar gradualmente)
      fetchCuadrantes: async (mes, ano, centroId) => {
        set({ loading: true });
        try {
          // TODO: Implementar cuando se diseñe la tabla de cuadrantes
          set({ cuadrantes: [], loading: false });
        } catch (error: any) {
          set({ error: 'Error al cargar cuadrantes: ' + error.message, loading: false });
        }
      },

      generateCuadrante: async (data) => {
        console.log('Generate cuadrante:', data);
      },

      updateCuadrante: async (id, data) => {
        console.log('Update cuadrante:', id, data);
      },

      exportCuadrante: async (id, formato) => {
        console.log('Export cuadrante:', id, formato);
      },

      fetchValidaciones: async (mes, ano, centroId) => {
        set({ loading: true });
        try {
          let query = supabase
            .from('validaciones_guardias')
            .select('*')
            .order('fecha', { ascending: false });

          // Filtrar por centro si se especifica
          if (centroId) {
            // Filtrar por guardias del centro específico
            const { data: guardiasData } = await supabase
              .from('guardias')
              .select('id')
              .eq('centro_salud_id', centroId);
            
            if (guardiasData && guardiasData.length > 0) {
              const guardiaIds = guardiasData.map(g => g.id);
              query = query.in('guardia_id', guardiaIds);
            } else {
              // No hay guardias para este centro
              set({ validaciones: [], loading: false });
              return;
            }
          }

          const { data, error } = await query;

          if (error) throw error;

          set({ validaciones: data || [], loading: false });
        } catch (error: any) {
          set({ error: 'Error al cargar validaciones: ' + error.message, loading: false });
        }
      },

      createValidacion: async (data) => {
        try {
          const { error } = await supabase
            .from('validaciones_guardias')
            .insert(data);

          if (error) throw error;
        } catch (error: any) {
          console.error('Error creating validacion:', error);
          throw error;
        }
      },

      updateValidacion: async (id, data) => {
        try {
          const { error } = await supabase
            .from('validaciones_guardias')
            .update(data)
            .eq('id', id);

          if (error) throw error;
        } catch (error: any) {
          console.error('Error updating validacion:', error);
          throw error;
        }
      },

      aprobarValidacion: async (id, comentarios) => {
        await get().updateValidacion(id, { 
          resultado: 'aprobada',
          comentario: comentarios,
          fecha: new Date().toISOString()
        });
      },

      rechazarValidacion: async (id, comentarios) => {
        await get().updateValidacion(id, { 
          resultado: 'rechazada',
          comentario: comentarios,
          fecha: new Date().toISOString()
        });
      },

      fetchNominas: async (mes, ano, centroId) => {
        set({ loading: true });
        try {
          let query = supabase
            .from('nominas_guardias')
            .select('*')
            .eq('mes', mes)
            .eq('anio', ano)
            .order('created_at', { ascending: false });

          if (centroId) {
            query = query.eq('centro_salud_id', centroId);
          }

          const { data, error } = await query;

          if (error) throw error;

          set({ nominas: data || [], loading: false });
        } catch (error: any) {
          set({ error: 'Error al cargar nóminas: ' + error.message, loading: false });
        }
      },

      fetchNominasLineas: async (nominaId) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase
            .from('nominas_guardias_lineas')
            .select(`
              *,
              profesional_guardia_id (
                profesional_id (
                  id,
                  nombre_completo
                )
              )
            `)
            .eq('nomina_id', nominaId);

          if (error) throw error;

          set({ nominasLineas: data || [], loading: false });
        } catch (error: any) {
          set({ error: 'Error al cargar líneas de nómina: ' + error.message, loading: false });
        }
      },

      generateNomina: async (data) => {
        try {
          const { error } = await supabase
            .from('nominas_guardias')
            .insert(data);

          if (error) throw error;
        } catch (error: any) {
          console.error('Error generating nomina:', error);
          throw error;
        }
      },

      aprobarNomina: async (id) => {
        await get().updateValidacion(id, { 
          estado: 'aprobada',
          approved_at: new Date().toISOString()
        });
      },

      rechazarNomina: async (id) => {
        await get().updateValidacion(id, { 
          estado: 'rechazada'
        });
      },

      exportNomina: async (id, formato) => {
        console.log('Export nomina:', id, formato);
      },

      calcularMontoGuardia: async (guardiaId) => {
        console.log('Calcular monto guardia:', guardiaId);
        return 0;
      },

      fetchPagos: async (mes, ano, centroId) => {
        set({ loading: true });
        try {
          // Los pagos están relacionados con nóminas, así que primero obtenemos las nóminas
          let nominasQuery = supabase
            .from('nominas_guardias')
            .select('id')
            .eq('mes', mes)
            .eq('anio', ano);

          if (centroId) {
            nominasQuery = nominasQuery.eq('centro_salud_id', centroId);
          }

          const { data: nominasData, error: nominasError } = await nominasQuery;

          if (nominasError) throw nominasError;

          if (!nominasData || nominasData.length === 0) {
            set({ pagos: [], loading: false });
            return;
          }

          const nominaIds = nominasData.map(n => n.id);

          const { data, error } = await supabase
            .from('pagos_guardias')
            .select(`
              *,
              profesional_guardia_id (
                profesional_id (
                  id,
                  nombre_completo
                )
              )
            `)
            .in('nomina_id', nominaIds)
            .order('created_at', { ascending: false });

          if (error) throw error;

          set({ pagos: data || [], loading: false });
        } catch (error: any) {
          set({ error: 'Error al cargar pagos: ' + error.message, loading: false });
        }
      },

      createPago: async (data) => {
        try {
          const { error } = await supabase
            .from('pagos_guardias')
            .insert(data);

          if (error) throw error;
        } catch (error: any) {
          console.error('Error creating pago:', error);
          throw error;
        }
      },

      updatePago: async (id, data) => {
        try {
          const { error } = await supabase
            .from('pagos_guardias')
            .update(data)
            .eq('id', id);

          if (error) throw error;
        } catch (error: any) {
          console.error('Error updating pago:', error);
          throw error;
        }
      },

      aprobarPago: async (id) => {
        await get().updatePago(id, { estado: 'realizado' });
      },

      rechazarPago: async (id) => {
        await get().updatePago(id, { estado: 'pendiente' });
      },

      procesarPagoMasivo: async (pagoIds) => {
        try {
          const { error } = await supabase
            .from('pagos_guardias')
            .update({ estado: 'realizado' })
            .in('id', pagoIds);

          if (error) throw error;
        } catch (error: any) {
          console.error('Error processing batch payments:', error);
          throw error;
        }
      },

      exportPagos: async (mes, ano, centroId) => {
        console.log('Export pagos:', mes, ano, centroId);
      },

      fetchBaremos: async () => {
        set({ loading: true });
        try {
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
        set({ loading: true });
        try {
          const { data, error } = await supabase
            .from('dias_festivos')
            .select('*')
            .eq('activo', true)
            .order('fecha');

          if (error) throw error;

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

          set({ diasFestivos, loading: false });
        } catch (error: any) {
          set({ error: 'Error al cargar días festivos: ' + error.message, loading: false });
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
        set({ loading: true });
        try {
          let query = supabase
            .from('bitacora_guardias')
            .select('*')
            .order('fecha', { ascending: false });

          // Aplicar filtros de fecha si están presentes
          if (params.fecha_inicio) {
            query = query.gte('fecha', params.fecha_inicio);
          }
          if (params.fecha_fin) {
            query = query.lte('fecha', params.fecha_fin);
          }

          const { data, error } = await query;

          if (error) throw error;

          // Convertir al formato esperado
          const bitacora: BitacoraEntry[] = (data || []).map(item => ({
            id: item.id,
            accion: item.accion,
            entidad_tipo: item.ref_tipo,
            entidad_id: item.ref_id,
            usuario_email: 'Sistema', // TODO: obtener del usuario real
            descripcion: item.accion,
            datos_anteriores: item.detalle?.datos_anteriores,
            datos_nuevos: item.detalle?.datos_nuevos,
            fecha_hora: item.fecha,
            ip_address: item.ip_address,
            user_agent: item.user_agent
          }));

          set({ bitacora, loading: false });
        } catch (error: any) {
          set({ error: 'Error al cargar bitácora: ' + error.message, loading: false });
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
