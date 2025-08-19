import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

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
  concepto: string;
  tarifa_base: number;
  multiplicador_nocturno: number;
  multiplicador_festivo: number;
  activo: boolean;
  fuente: 'PROTOCOLO' | 'EXCEL';
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
          // Por ahora, datos mock para pruebas
          const mockGuardias: Guardia[] = [
            {
              id: '1',
              profesional_id: 'prof1',
              centro_id: 'centro1',
              fecha: `${ano}-${mes.toString().padStart(2, '0')}-01`,
              turno: 'MAÑANA',
              tipo_guardia: 'ORDINARIA',
              horas_inicio: '08:00',
              horas_fin: '14:00',
              profesional: {
                id: 'prof1',
                nombre_completo: 'Dr. Juan Pérez',
                especialidad: 'Medicina General'
              },
              centro: {
                id: 'centro1',
                nombre: 'Hospital Regional'
              }
            }
          ];
          set({ guardias: mockGuardias, loading: false });
        } catch (error) {
          console.error('Error fetching guardias:', error);
          set({ error: 'Error al cargar guardias', loading: false });
        }
      },

      createGuardia: async (data) => {
        set({ loading: true });
        try {
          // Mock implementation
          console.log('Creating guardia:', data);
          set({ loading: false });
        } catch (error) {
          console.error('Error creating guardia:', error);
          set({ error: 'Error al crear guardia', loading: false });
        }
      },

      updateGuardia: async (id, data) => {
        set({ loading: true });
        try {
          // Mock implementation
          console.log('Updating guardia:', id, data);
          set({ loading: false });
        } catch (error) {
          console.error('Error updating guardia:', error);
          set({ error: 'Error al actualizar guardia', loading: false });
        }
      },

      deleteGuardia: async (id) => {
        set({ loading: true });
        try {
          // Mock implementation
          console.log('Deleting guardia:', id);
          set({ loading: false });
        } catch (error) {
          console.error('Error deleting guardia:', error);
          set({ error: 'Error al eliminar guardia', loading: false });
        }
      },

      // Operaciones CRUD - Profesionales
      fetchProfesionales: async (centroId) => {
        set({ loading: true });
        try {
          const mockProfesionales: Profesional[] = [
            {
              id: 'prof1',
              nombre_completo: 'Dr. Juan Pérez',
              especialidad: 'Medicina General',
              centro_id: 'centro1',
              activo: true
            },
            {
              id: 'prof2',
              nombre_completo: 'Dra. María González',
              especialidad: 'Cardiología',
              centro_id: 'centro1',
              activo: true
            }
          ];
          set({ profesionales: mockProfesionales, loading: false });
        } catch (error) {
          console.error('Error fetching profesionales:', error);
          set({ error: 'Error al cargar profesionales', loading: false });
        }
      },

      // Operaciones CRUD - Centros
      fetchCentros: async () => {
        set({ loading: true });
        try {
          const mockCentros: Centro[] = [
            {
              id: 'centro1',
              nombre: 'Hospital Regional de Malabo',
              tipo_centro: 'Hospital',
              provincia: 'Bioko Norte'
            },
            {
              id: 'centro2',
              nombre: 'Centro de Salud de Bata',
              tipo_centro: 'Centro de Salud',
              provincia: 'Litoral'
            }
          ];
          set({ centros: mockCentros, loading: false });
        } catch (error) {
          console.error('Error fetching centros:', error);
          set({ error: 'Error al cargar centros', loading: false });
        }
      },

      // Implementaciones mock para todas las demás operaciones
      fetchCuadrantes: async (mes, ano, centroId) => {
        set({ loading: true });
        try {
          set({ cuadrantes: [], loading: false });
        } catch (error) {
          set({ error: 'Error al cargar cuadrantes', loading: false });
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
          set({ validaciones: [], loading: false });
        } catch (error) {
          set({ error: 'Error al cargar validaciones', loading: false });
        }
      },

      createValidacion: async (data) => {
        console.log('Create validacion:', data);
      },

      updateValidacion: async (id, data) => {
        console.log('Update validacion:', id, data);
      },

      aprobarValidacion: async (id, comentarios) => {
        console.log('Aprobar validacion:', id, comentarios);
      },

      rechazarValidacion: async (id, comentarios) => {
        console.log('Rechazar validacion:', id, comentarios);
      },

      fetchNominas: async (mes, ano, centroId) => {
        set({ loading: true });
        try {
          set({ nominas: [], loading: false });
        } catch (error) {
          set({ error: 'Error al cargar nóminas', loading: false });
        }
      },

      fetchNominasLineas: async (nominaId) => {
        set({ loading: true });
        try {
          set({ nominasLineas: [], loading: false });
        } catch (error) {
          set({ error: 'Error al cargar líneas de nómina', loading: false });
        }
      },

      generateNomina: async (data) => {
        console.log('Generate nomina:', data);
      },

      aprobarNomina: async (id) => {
        console.log('Aprobar nomina:', id);
      },

      rechazarNomina: async (id) => {
        console.log('Rechazar nomina:', id);
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
          set({ pagos: [], loading: false });
        } catch (error) {
          set({ error: 'Error al cargar pagos', loading: false });
        }
      },

      createPago: async (data) => {
        console.log('Create pago:', data);
      },

      updatePago: async (id, data) => {
        console.log('Update pago:', id, data);
      },

      aprobarPago: async (id) => {
        console.log('Aprobar pago:', id);
      },

      rechazarPago: async (id) => {
        console.log('Rechazar pago:', id);
      },

      procesarPagoMasivo: async (pagoIds) => {
        console.log('Procesar pago masivo:', pagoIds);
      },

      exportPagos: async (mes, ano, centroId) => {
        console.log('Export pagos:', mes, ano, centroId);
      },

      fetchBaremos: async () => {
        set({ loading: true });
        try {
          const mockBaremos: Baremo[] = [
            {
              id: 'baremo1',
              concepto: 'Guardia Médico General',
              tarifa_base: 50.0,
              multiplicador_nocturno: 1.5,
              multiplicador_festivo: 2.0,
              activo: true,
              fuente: 'PROTOCOLO',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];
          set({ baremos: mockBaremos, loading: false });
        } catch (error) {
          set({ error: 'Error al cargar baremos', loading: false });
        }
      },

      createBaremo: async (data) => {
        console.log('Create baremo:', data);
      },

      updateBaremo: async (id, data) => {
        console.log('Update baremo:', id, data);
      },

      deleteBaremo: async (id) => {
        console.log('Delete baremo:', id);
      },

      fetchDiasFestivos: async () => {
        set({ loading: true });
        try {
          set({ diasFestivos: [], loading: false });
        } catch (error) {
          set({ error: 'Error al cargar días festivos', loading: false });
        }
      },

      createDiaFestivo: async (data) => {
        console.log('Create dia festivo:', data);
      },

      updateDiaFestivo: async (id, data) => {
        console.log('Update dia festivo:', id, data);
      },

      deleteDiaFestivo: async (id) => {
        console.log('Delete dia festivo:', id);
      },

      fetchAjustesBaremos: async (centroId) => {
        set({ loading: true });
        try {
          set({ ajustesBaremos: [], loading: false });
        } catch (error) {
          set({ error: 'Error al cargar ajustes de baremos', loading: false });
        }
      },

      createAjusteBaremo: async (data) => {
        console.log('Create ajuste baremo:', data);
      },

      updateAjusteBaremo: async (id, data) => {
        console.log('Update ajuste baremo:', id, data);
      },

      deleteAjusteBaremo: async (id) => {
        console.log('Delete ajuste baremo:', id);
      },

      fetchBitacora: async (params) => {
        set({ loading: true });
        try {
          set({ bitacora: [], loading: false });
        } catch (error) {
          set({ error: 'Error al cargar bitácora', loading: false });
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
