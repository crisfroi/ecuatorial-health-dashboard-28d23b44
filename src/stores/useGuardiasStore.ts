import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Profesional,
  Guardia,
  Validacion,
  Nomina,
  NominaLinea,
  Pago,
  Usuario,
  Bitacora,
  AjusteBaremo,
  EstadisticasGuardias,
  ConfiguracionSistema,
  CategoriaProfesional,
  TipoGuardia,
  TipoDia,
  EtapaValidacion,
  FuenteBaremo
} from '@/types/guardias';
import { supabase } from '@/integrations/supabase/client';

interface GuardiasState {
  // Estado
  profesionales: Profesional[];
  guardias: Guardia[];
  validaciones: Validacion[];
  nominas: Nomina[];
  nominaLineas: NominaLinea[];
  pagos: Pago[];
  usuarios: Usuario[];
  bitacora: Bitacora[];
  baremosConfig: AjusteBaremo[];
  configuracion: ConfiguracionSistema;

  // UI State
  loading: boolean;
  error: string | null;
  selectedMes: number;
  selectedAnio: number;
  selectedHospital: string;

  // Real data from Supabase
  hospitalesPublicos: any[];
  profesionalesReales: any[];
  isConnectedToSupabase: boolean;
  
  // Actions - Profesionales
  addProfesional: (profesional: Omit<Profesional, 'id'>) => void;
  updateProfesional: (id: string, updates: Partial<Profesional>) => void;
  deleteProfesional: (id: string) => void;
  
  // Actions - Guardias
  addGuardia: (guardia: Omit<Guardia, 'id' | 'horas' | 'tipoDia'>) => void;
  updateGuardia: (id: string, updates: Partial<Guardia>) => void;
  deleteGuardia: (id: string) => void;
  
  // Actions - Validaciones
  validarGuardia: (guardiaId: string, etapa: EtapaValidacion, resultado: 'aprobada' | 'rechazada', comentario?: string) => void;
  
  // Actions - Nóminas
  generarNomina: (mes: number, anio: number, hospitalId: string) => void;
  updateNomina: (id: string, updates: Partial<Nomina>) => void;
  
  // Actions - Pagos
  registrarPago: (pago: Omit<Pago, 'id'>) => void;
  updatePago: (id: string, updates: Partial<Pago>) => void;
  
  // Actions - Baremos
  updateBaremo: (id: string, updates: Partial<AjusteBaremo>) => void;
  cambiarFuenteBaremo: (fuente: FuenteBaremo) => void;
  
  // Selectors y utilidades
  getGuardiasByProfesional: (profesionalId: string) => Guardia[];
  getGuardiasByMes: (mes: number, anio: number) => Guardia[];
  getValidacionesByGuardia: (guardiaId: string) => Validacion[];
  calcularBaremo: (categoria: CategoriaProfesional, tipo: TipoGuardia, tipoDia: TipoDia) => number;
  getEstadisticas: () => EstadisticasGuardias;
  
  // Actions - UI
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedMes: (mes: number) => void;
  setSelectedAnio: (anio: number) => void;
  setSelectedHospital: (hospitalId: string) => void;

  // Actions - Real Data
  loadHospitalesPublicos: () => Promise<void>;
  loadProfesionalesReales: (centroId?: string) => Promise<void>;
  checkSupabaseConnection: () => Promise<void>;
}

// Datos iniciales de baremos según protocolo
const BAREMOS_PROTOCOL: Omit<AjusteBaremo, 'id' | 'vigenteDesde' | 'activo'>[] = [
  // Guardias Físicas - Especialistas
  { fuente: 'protocol', categoria: 'especialista', tipoGuardia: 'fisica', tipoDia: 'ordinario', valor: 30000 },
  { fuente: 'protocol', categoria: 'especialista', tipoGuardia: 'fisica', tipoDia: 'fin_semana', valor: 36000 },
  { fuente: 'protocol', categoria: 'especialista', tipoGuardia: 'fisica', tipoDia: 'festivo', valor: 36000 },
  
  // Guardias Físicas - Generales/Licenciados
  { fuente: 'protocol', categoria: 'general_licenciado', tipoGuardia: 'fisica', tipoDia: 'ordinario', valor: 25000 },
  { fuente: 'protocol', categoria: 'general_licenciado', tipoGuardia: 'fisica', tipoDia: 'fin_semana', valor: 30000 },
  { fuente: 'protocol', categoria: 'general_licenciado', tipoGuardia: 'fisica', tipoDia: 'festivo', valor: 30000 },
  
  // Guardias Físicas - Técnicos/Diplomados
  { fuente: 'protocol', categoria: 'tecnico_diplomado', tipoGuardia: 'fisica', tipoDia: 'ordinario', valor: 20000 },
  { fuente: 'protocol', categoria: 'tecnico_diplomado', tipoGuardia: 'fisica', tipoDia: 'fin_semana', valor: 24000 },
  { fuente: 'protocol', categoria: 'tecnico_diplomado', tipoGuardia: 'fisica', tipoDia: 'festivo', valor: 24000 },
  
  // Guardias Físicas - Auxiliares
  { fuente: 'protocol', categoria: 'auxiliar', tipoGuardia: 'fisica', tipoDia: 'ordinario', valor: 15000 },
  { fuente: 'protocol', categoria: 'auxiliar', tipoGuardia: 'fisica', tipoDia: 'fin_semana', valor: 18000 },
  { fuente: 'protocol', categoria: 'auxiliar', tipoGuardia: 'fisica', tipoDia: 'festivo', valor: 18000 },
  
  // Guardias Físicas - Subalternos
  { fuente: 'protocol', categoria: 'subalterno', tipoGuardia: 'fisica', tipoDia: 'ordinario', valor: 10000 },
  { fuente: 'protocol', categoria: 'subalterno', tipoGuardia: 'fisica', tipoDia: 'fin_semana', valor: 12000 },
  { fuente: 'protocol', categoria: 'subalterno', tipoGuardia: 'fisica', tipoDia: 'festivo', valor: 12000 },
  
  // Guardias Administrativas (todas las categorías)
  { fuente: 'protocol', categoria: 'especialista', tipoGuardia: 'administrativa', tipoDia: 'ordinario', valor: 35000 },
  { fuente: 'protocol', categoria: 'especialista', tipoGuardia: 'administrativa', tipoDia: 'fin_semana', valor: 43750 },
  { fuente: 'protocol', categoria: 'especialista', tipoGuardia: 'administrativa', tipoDia: 'festivo', valor: 43750 },
];

// Datos de prueba
const profesionalesMock: Profesional[] = [
  {
    id: '1',
    nombre: 'Dr. García López',
    categoria: 'especialista',
    unidad_servicio: 'Cardiología',
    banco: 'BANGE',
    iban_cuenta: 'GQ2100002001000000000001',
    activo: true,
    telefono: '+240 222 123 456',
    email: 'garcia@hospital.gq'
  },
  {
    id: '2',
    nombre: 'Dra. María Santos',
    categoria: 'general_licenciado',
    unidad_servicio: 'Medicina General',
    activo: true,
    telefono: '+240 222 123 457'
  },
  {
    id: '3',
    nombre: 'Enfermero José Mbomio',
    categoria: 'tecnico_diplomado',
    unidad_servicio: 'UCI',
    activo: true
  }
];

export const useGuardiasStore = create<GuardiasState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      profesionales: profesionalesMock,
      guardias: [],
      validaciones: [],
      nominas: [],
      nominaLineas: [],
      pagos: [],
      usuarios: [],
      bitacora: [],
      baremosConfig: BAREMOS_PROTOCOL.map((baremo, index) => ({
        ...baremo,
        id: `baremo_${index}`,
        vigenteDesde: new Date('2024-01-01'),
        activo: true
      })),
      configuracion: {
        fuenteBaremo: 'protocol',
        limitesGuardias: { minimo: 4, maximo: 6 },
        duracionMinima: 12,
        duracionMaxima: 24,
        notificacionesActivas: true
      },
      
      // UI State
      loading: false,
      error: null,
      selectedMes: new Date().getMonth() + 1,
      selectedAnio: new Date().getFullYear(),
      selectedHospital: '',

      // Real data state
      hospitalesPublicos: [],
      profesionalesReales: [],
      isConnectedToSupabase: false,
      
      // Actions - Profesionales
      addProfesional: (profesional) => {
        const newProfesional: Profesional = {
          ...profesional,
          id: Date.now().toString()
        };
        set((state) => ({
          profesionales: [...state.profesionales, newProfesional]
        }));
      },
      
      updateProfesional: (id, updates) => {
        set((state) => ({
          profesionales: state.profesionales.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          )
        }));
      },
      
      deleteProfesional: (id) => {
        set((state) => ({
          profesionales: state.profesionales.filter((p) => p.id !== id)
        }));
      },
      
      // Actions - Guardias
      addGuardia: (guardiaData) => {
        const fechaInicio = new Date(guardiaData.fechaInicio);
        const fechaFin = new Date(guardiaData.fechaFin);
        const horas = (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60);
        
        // Determinar tipo de día
        const diaSemana = fechaInicio.getDay();
        const esFinde = diaSemana === 0 || diaSemana === 6;
        const tipoDia: TipoDia = esFinde ? 'fin_semana' : 'ordinario';
        
        const newGuardia: Guardia = {
          ...guardiaData,
          id: Date.now().toString(),
          horas,
          tipoDia,
          estado: 'planificada',
          validacionEstado: 'pendiente'
        };
        
        set((state) => ({
          guardias: [...state.guardias, newGuardia]
        }));
      },
      
      updateGuardia: (id, updates) => {
        set((state) => ({
          guardias: state.guardias.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          )
        }));
      },
      
      deleteGuardia: (id) => {
        set((state) => ({
          guardias: state.guardias.filter((g) => g.id !== id)
        }));
      },
      
      // Actions - Validaciones
      validarGuardia: (guardiaId, etapa, resultado, comentario) => {
        const newValidacion: Validacion = {
          id: Date.now().toString(),
          guardiaId,
          etapa,
          usuarioId: 'current_user', // En implementación real vendría del contexto de auth
          fecha: new Date(),
          resultado,
          comentario
        };
        
        set((state) => ({
          validaciones: [...state.validaciones, newValidacion],
          guardias: state.guardias.map((g) =>
            g.id === guardiaId
              ? { ...g, validacionEstado: resultado === 'aprobada' ? 'validada' : 'rechazada' }
              : g
          )
        }));
      },
      
      // Actions - Nóminas
      generarNomina: (mes, anio, hospitalId) => {
        const state = get();
        const guardiasDelMes = state.guardias.filter((g) => {
          const fecha = new Date(g.fechaInicio);
          return fecha.getMonth() + 1 === mes && 
                 fecha.getFullYear() === anio &&
                 g.validacionEstado === 'validada';
        });
        
        // Calcular totales
        const totalesPorCategoria = {} as Record<CategoriaProfesional, number>;
        const totalesPorTipo = {} as Record<TipoGuardia, number>;
        let totalGeneral = 0;
        
        guardiasDelMes.forEach((guardia) => {
          const profesional = state.profesionales.find(p => p.id === guardia.profesionalId);
          if (profesional) {
            const costo = state.calcularBaremo(profesional.categoria, guardia.tipo, guardia.tipoDia);
            totalesPorCategoria[profesional.categoria] = (totalesPorCategoria[profesional.categoria] || 0) + costo;
            totalesPorTipo[guardia.tipo] = (totalesPorTipo[guardia.tipo] || 0) + costo;
            totalGeneral += costo;
          }
        });
        
        const newNomina: Nomina = {
          id: Date.now().toString(),
          mes,
          anio,
          hospitalId,
          estado: 'pendiente',
          totalesPorCategoria,
          totalesPorTipo,
          totalGeneral,
          fechaCreacion: new Date()
        };
        
        set((state) => ({
          nominas: [...state.nominas, newNomina]
        }));
      },
      
      updateNomina: (id, updates) => {
        set((state) => ({
          nominas: state.nominas.map((n) =>
            n.id === id ? { ...n, ...updates } : n
          )
        }));
      },
      
      // Actions - Pagos
      registrarPago: (pago) => {
        const newPago: Pago = {
          ...pago,
          id: Date.now().toString()
        };
        set((state) => ({
          pagos: [...state.pagos, newPago]
        }));
      },
      
      updatePago: (id, updates) => {
        set((state) => ({
          pagos: state.pagos.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          )
        }));
      },
      
      // Actions - Baremos
      updateBaremo: (id, updates) => {
        set((state) => ({
          baremosConfig: state.baremosConfig.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          )
        }));
      },
      
      cambiarFuenteBaremo: (fuente) => {
        set((state) => ({
          configuracion: { ...state.configuracion, fuenteBaremo: fuente }
        }));
      },
      
      // Selectors
      getGuardiasByProfesional: (profesionalId) => {
        return get().guardias.filter(g => g.profesionalId === profesionalId);
      },
      
      getGuardiasByMes: (mes, anio) => {
        return get().guardias.filter(g => {
          const fecha = new Date(g.fechaInicio);
          return fecha.getMonth() + 1 === mes && fecha.getFullYear() === anio;
        });
      },
      
      getValidacionesByGuardia: (guardiaId) => {
        return get().validaciones.filter(v => v.guardiaId === guardiaId);
      },
      
      calcularBaremo: (categoria, tipo, tipoDia) => {
        const state = get();
        const baremo = state.baremosConfig.find(b =>
          b.categoria === categoria &&
          b.tipoGuardia === tipo &&
          b.tipoDia === tipoDia &&
          b.fuente === state.configuracion.fuenteBaremo &&
          b.activo
        );
        return baremo?.valor || 0;
      },
      
      getEstadisticas: () => {
        const state = get();
        const guardias = state.getGuardiasByMes(state.selectedMes, state.selectedAnio);
        
        const totalGuardias = guardias.length;
        const guardiasValidas = guardias.filter(g => g.validacionEstado === 'validada').length;
        const guardiasPendientes = guardias.filter(g => g.validacionEstado === 'pendiente').length;
        
        let costoTotal = 0;
        const porCategoria = {} as Record<CategoriaProfesional, { cantidad: number; costo: number }>;
        const porTipo = {} as Record<TipoGuardia, { cantidad: number; costo: number }>;
        
        guardias.forEach(guardia => {
          const profesional = state.profesionales.find(p => p.id === guardia.profesionalId);
          if (profesional) {
            const costo = state.calcularBaremo(profesional.categoria, guardia.tipo, guardia.tipoDia);
            costoTotal += costo;
            
            if (!porCategoria[profesional.categoria]) {
              porCategoria[profesional.categoria] = { cantidad: 0, costo: 0 };
            }
            porCategoria[profesional.categoria].cantidad++;
            porCategoria[profesional.categoria].costo += costo;
            
            if (!porTipo[guardia.tipo]) {
              porTipo[guardia.tipo] = { cantidad: 0, costo: 0 };
            }
            porTipo[guardia.tipo].cantidad++;
            porTipo[guardia.tipo].costo += costo;
          }
        });
        
        return {
          totalGuardias,
          guardiasValidas,
          guardiasPendientes,
          costoTotal,
          porCategoria,
          porTipo
        };
      },
      
      // UI Actions
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setSelectedMes: (mes) => set({ selectedMes: mes }),
      setSelectedAnio: (anio) => set({ selectedAnio: anio }),
      setSelectedHospital: (hospitalId) => set({ selectedHospital: hospitalId }),

      // Real Data Actions
      loadHospitalesPublicos: async () => {
        try {
          set({ loading: true, error: null });

          const { data, error } = await supabase
            .from('centros_salud')
            .select('*')
            .eq('sector', 'Público')
            .eq('categoria', 'Hospital')
            .order('nombre', { ascending: true });

          if (error) {
            console.error('Error loading public hospitals:', error);
            set({ error: error.message });
            return;
          }

          set({
            hospitalesPublicos: data || [],
            isConnectedToSupabase: true,
            loading: false
          });

          // Auto-select first hospital if none selected
          const state = get();
          if (!state.selectedHospital && data && data.length > 0) {
            set({ selectedHospital: data[0].id });
          }
        } catch (error: any) {
          console.error('Error connecting to Supabase:', error);
          set({
            error: 'Error de conexión con la base de datos',
            loading: false,
            isConnectedToSupabase: false
          });
        }
      },

      loadProfesionalesReales: async (centroId?: string) => {
        try {
          set({ loading: true, error: null });

          let query = supabase
            .from('profesionales_sanitarios')
            .select(`
              *,
              centros_salud!fk_profesionales_centro_salud(*)
            `)
            .eq('estado_solicitud', 'aprobada')
            .not('nombre_completo', 'is', null);

          if (centroId) {
            query = query.eq('centro_salud_id', centroId);
          }

          const { data, error } = await query;

          if (error) {
            console.error('Error loading professionals:', error);
            set({ error: error.message });
            return;
          }

          // Convert to guard system format
          const profesionalesConvertidos = (data || []).map(prof => {
            const mapCategoria = (categoria: string | null): CategoriaProfesional => {
              if (!categoria) return 'auxiliar';
              const cat = categoria.toLowerCase();
              if (cat.includes('especialista') || cat.includes('medico especialista')) return 'especialista';
              if (cat.includes('general') || cat.includes('licenciado') || cat.includes('medico general')) return 'general_licenciado';
              if (cat.includes('tecnico') || cat.includes('diplomado') || cat.includes('enfermero')) return 'tecnico_diplomado';
              if (cat.includes('auxiliar')) return 'auxiliar';
              if (cat.includes('subalterno')) return 'subalterno';
              if (cat.includes('odepac')) return 'odepac';
              if (cat.includes('secretar') || cat.includes('asist')) return 'secre_asist_pacientes';
              if (cat.includes('caja')) return 'caja';
              return 'auxiliar';
            };

            return {
              id: prof.id,
              nombre: prof.nombre_completo,
              categoria: mapCategoria(prof.area_profesional || prof.categoria_titulacion),
              unidad_servicio: prof.area_profesional || prof.especialidad || 'General',
              banco: undefined,
              iban_cuenta: undefined,
              activo: prof.estado_solicitud === 'aprobada',
              telefono: prof.telefono || undefined,
              email: prof.email || undefined,
              centroSaludId: prof.centro_salud_id
            };
          });

          set({
            profesionalesReales: data || [],
            profesionales: profesionalesConvertidos,
            loading: false
          });
        } catch (error: any) {
          console.error('Error loading professionals:', error);
          set({ error: 'Error cargando profesionales', loading: false });
        }
      },

      checkSupabaseConnection: async () => {
        try {
          const { data, error } = await supabase
            .from('centros_salud')
            .select('count')
            .limit(1);

          if (error) {
            set({ isConnectedToSupabase: false, error: error.message });
          } else {
            set({ isConnectedToSupabase: true, error: null });
          }
        } catch (error: any) {
          set({
            isConnectedToSupabase: false,
            error: 'No se pudo conectar con la base de datos'
          });
        }
      }
    }),
    {
      name: 'guardias-storage',
      partialize: (state) => ({
        profesionales: state.profesionales,
        guardias: state.guardias,
        validaciones: state.validaciones,
        nominas: state.nominas,
        nominaLineas: state.nominaLineas,
        pagos: state.pagos,
        baremosConfig: state.baremosConfig,
        configuracion: state.configuracion
      })
    }
  )
);
