import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

// Tipos principales
export type CategoriaGuardia = 'especialista' | 'general_licenciado' | 'tecnico_diplomado' | 'auxiliar' | 'subalterno' | 'odepac' | 'secre_asist_pacientes' | 'caja';
export type TipoGuardia = 'fisica' | 'localizable' | 'administrativa';
export type TipoDia = 'ordinario' | 'fin_semana' | 'festivo';
export type EstadoGuardia = 'borrador' | 'planificada' | 'realizada' | 'no_presentado';
export type EstadoValidacion = 'pendiente' | 'validada' | 'rechazada';
export type EtapaValidacion = 'dir_medica' | 'dir_admin' | 'dir_enfermeria' | 'jefe_rrhh' | 'admin_hospital' | 'dir_gerente' | 'dg_coordinacion';

export interface ProfesionalGuardia {
  id: string;
  profesional_id: string;
  categoria: CategoriaGuardia;
  unidad_servicio: string;
  banco?: string;
  iban_cuenta?: string;
  activo: boolean;
  telefono_guardias?: string;
  email_guardias?: string;
  // Datos del profesional desde profesionales_sanitarios
  nombre_completo?: string;
  area_profesional?: string;
  centro_salud_id?: string;
  nombre_centro?: string;
}

export interface Guardia {
  id: string;
  profesional_guardia_id: string;
  centro_salud_id: string;
  tipo: TipoGuardia;
  fecha_inicio: string;
  fecha_fin: string;
  horas: number;
  tipo_dia: TipoDia;
  estado: EstadoGuardia;
  validacion_estado: EstadoValidacion;
  observaciones?: string;
  localizable_activada?: boolean;
  hora_llamada?: string;
  hora_llegada?: string;
  servicio_atendido?: string;
  caso_atendido?: string;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  // Datos relacionados
  profesional?: ProfesionalGuardia;
  nombre_centro?: string;
}

export interface ValidacionGuardia {
  id: string;
  guardia_id: string;
  etapa: EtapaValidacion;
  usuario_id: string;
  fecha: string;
  resultado: 'aprobada' | 'rechazada';
  comentario?: string;
  firma?: string;
}

export interface NominaGuardia {
  id: string;
  centro_salud_id: string;
  mes: number;
  anio: number;
  estado: 'borrador' | 'enviada' | 'aprobada' | 'rechazada' | 'pagada';
  total_importe: number;
  total_guardias: number;
  total_profesionales: number;
  observaciones?: string;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  nombre_centro?: string;
  lineas?: NominaLinea[];
}

export interface NominaLinea {
  id: string;
  nomina_id: string;
  profesional_guardia_id: string;
  categoria: CategoriaGuardia;
  guardias_ordinarias: number;
  guardias_fines_semana: number;
  guardias_festivos: number;
  localizables_programadas: number;
  localizables_llamadas: number;
  coste_unitario_ordinario: number;
  coste_unitario_fin_semana: number;
  coste_unitario_festivo: number;
  coste_localizable_programada: number;
  coste_localizable_llamada: number;
  total_linea: number;
  // Datos del profesional
  profesional?: ProfesionalGuardia;
}

export interface PagoGuardia {
  id: string;
  nomina_id: string;
  profesional_guardia_id: string;
  forma_pago: 'transfer_trabajador' | 'transfer_hospital' | 'efectivo' | 'cheque';
  fecha_pago: string;
  importe: number;
  comprobante_url?: string;
  observaciones?: string;
  estado: 'pendiente' | 'realizado' | 'confirmado';
  created_by?: string;
  // Datos relacionados
  profesional?: ProfesionalGuardia;
  nomina?: NominaGuardia;
}

export interface AjusteBaremo {
  id: string;
  fuente: 'protocol' | 'excel' | 'manual';
  categoria: CategoriaGuardia;
  tipo_guardia: TipoGuardia;
  tipo_dia: TipoDia;
  valor: number;
  porcentaje_localizable: number;
  porcentaje_llamada: number;
  vigente_desde: string;
  vigente_hasta?: string;
  activo: boolean;
  observaciones?: string;
}

export interface BitacoraGuardia {
  id: string;
  ref_tipo: 'guardia' | 'nomina' | 'pago' | 'validacion' | 'profesional';
  ref_id: string;
  usuario_id: string;
  accion: string;
  detalle: any;
  fecha: string;
  ip_address?: string;
  user_agent?: string;
}

export interface DiaFestivo {
  id: string;
  fecha: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

// Filtros y configuración
export interface FiltrosGuardias {
  mes?: number;
  anio?: number;
  centro_salud_id?: string;
  categoria?: CategoriaGuardia;
  tipo?: TipoGuardia;
  estado?: EstadoGuardia;
  validacion_estado?: EstadoValidacion;
  profesional_id?: string;
}

export interface ConfiguracionGuardias {
  fuenteBaremo: 'protocol' | 'excel';
  frecuenciaMinima: number;
  frecuenciaMaxima: number;
  horasMinimas: number;
  horasMaximas: number;
}

// Store principal
interface GuardiasStore {
  // Estado
  profesionales: ProfesionalGuardia[];
  guardias: Guardia[];
  validaciones: ValidacionGuardia[];
  nominas: NominaGuardia[];
  pagos: PagoGuardia[];
  baremos: AjusteBaremo[];
  bitacora: BitacoraGuardia[];
  diasFestivos: DiaFestivo[];
  
  // Configuración
  configuracion: ConfiguracionGuardias;
  filtros: FiltrosGuardias;
  
  // Estados de carga
  isLoading: boolean;
  error: string | null;
  
  // Selecciones actuales
  selectedGuardia: Guardia | null;
  selectedNomina: NominaGuardia | null;
  selectedProfesional: ProfesionalGuardia | null;
  
  // Acciones - Profesionales
  fetchProfesionales: (centroId?: string) => Promise<void>;
  createProfesionalGuardia: (data: Partial<ProfesionalGuardia>) => Promise<ProfesionalGuardia>;
  updateProfesionalGuardia: (id: string, data: Partial<ProfesionalGuardia>) => Promise<void>;
  deleteProfesionalGuardia: (id: string) => Promise<void>;
  
  // Acciones - Guardias
  fetchGuardias: (filtros?: FiltrosGuardias) => Promise<void>;
  createGuardia: (data: Partial<Guardia>) => Promise<Guardia>;
  updateGuardia: (id: string, data: Partial<Guardia>) => Promise<void>;
  deleteGuardia: (id: string) => Promise<void>;
  
  // Acciones - Validaciones
  validarGuardia: (guardiaId: string, etapa: EtapaValidacion, resultado: 'aprobada' | 'rechazada', comentario?: string) => Promise<void>;
  fetchValidaciones: (guardiaId: string) => Promise<void>;
  
  // Acciones - Nóminas
  fetchNominas: (centroId?: string) => Promise<void>;
  generarNomina: (centroId: string, mes: number, anio: number) => Promise<NominaGuardia>;
  aprobarNomina: (nominaId: string) => Promise<void>;
  rechazarNomina: (nominaId: string, motivo: string) => Promise<void>;
  
  // Acciones - Pagos
  fetchPagos: (nominaId?: string) => Promise<void>;
  registrarPago: (data: Partial<PagoGuardia>) => Promise<PagoGuardia>;
  confirmarPago: (pagoId: string) => Promise<void>;
  
  // Acciones - Baremos
  fetchBaremos: () => Promise<void>;
  updateBaremo: (id: string, data: Partial<AjusteBaremo>) => Promise<void>;
  cambiarFuenteBaremo: (fuente: 'protocol' | 'excel') => Promise<void>;
  
  // Acciones - Configuración
  updateConfiguracion: (config: Partial<ConfiguracionGuardias>) => void;
  setFiltros: (filtros: Partial<FiltrosGuardias>) => void;
  
  // Acciones - UI
  setSelectedGuardia: (guardia: Guardia | null) => void;
  setSelectedNomina: (nomina: NominaGuardia | null) => void;
  setSelectedProfesional: (profesional: ProfesionalGuardia | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Utilidades
  calcularTipoDia: (fechaInicio: Date, fechaFin: Date) => TipoDia;
  calcularBaremo: (guardia: Guardia, profesional: ProfesionalGuardia) => number;
  validarHorarios: (fechaInicio: Date, fechaFin: Date) => boolean;
  exportarNominaPDF: (nominaId: string) => Promise<void>;
  exportarNominaExcel: (nominaId: string) => Promise<void>;
}

export const useGuardiasStore = create<GuardiasStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      profesionales: [],
      guardias: [],
      validaciones: [],
      nominas: [],
      pagos: [],
      baremos: [],
      bitacora: [],
      diasFestivos: [],
      
      configuracion: {
        fuenteBaremo: 'protocol',
        frecuenciaMinima: 4,
        frecuenciaMaxima: 6,
        horasMinimas: 12,
        horasMaximas: 24,
      },
      
      filtros: {},
      isLoading: false,
      error: null,
      selectedGuardia: null,
      selectedNomina: null,
      selectedProfesional: null,
      
      // Implementación de acciones
      fetchProfesionales: async (centroId?: string) => {
        set({ isLoading: true, error: null });
        try {
          let query = supabase
            .from('profesionales_guardias')
            .select(`
              *,
              profesionales_sanitarios!profesional_id (
                nombre_completo,
                area_profesional,
                centro_salud_id,
                nombre_centro
              )
            `)
            .eq('activo', true);
            
          if (centroId) {
            query = query.eq('profesionales_sanitarios.centro_salud_id', centroId);
          }
          
          const { data, error } = await query;
          
          if (error) throw error;
          
          const profesionales = data?.map(p => ({
            ...p,
            nombre_completo: p.profesionales_sanitarios?.nombre_completo,
            area_profesional: p.profesionales_sanitarios?.area_profesional,
            centro_salud_id: p.profesionales_sanitarios?.centro_salud_id,
            nombre_centro: p.profesionales_sanitarios?.nombre_centro,
          })) || [];
          
          set({ profesionales, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },
      
      createProfesionalGuardia: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const { data: newProfesional, error } = await supabase
            .from('profesionales_guardias')
            .insert([data])
            .select()
            .single();
            
          if (error) throw error;
          
          set(state => ({
            profesionales: [...state.profesionales, newProfesional],
            isLoading: false
          }));
          
          return newProfesional;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },
      
      updateProfesionalGuardia: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase
            .from('profesionales_guardias')
            .update(data)
            .eq('id', id);
            
          if (error) throw error;
          
          set(state => ({
            profesionales: state.profesionales.map(p => 
              p.id === id ? { ...p, ...data } : p
            ),
            isLoading: false
          }));
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },
      
      deleteProfesionalGuardia: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase
            .from('profesionales_guardias')
            .update({ activo: false })
            .eq('id', id);
            
          if (error) throw error;
          
          set(state => ({
            profesionales: state.profesionales.filter(p => p.id !== id),
            isLoading: false
          }));
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },
      
      fetchGuardias: async (filtros = {}) => {
        set({ isLoading: true, error: null });
        try {
          let query = supabase
            .from('guardias')
            .select(`
              *,
              profesionales_guardias!profesional_guardia_id (*),
              centros_salud!centro_salud_id (nombre)
            `)
            .order('fecha_inicio', { ascending: false });
            
          // Aplicar filtros
          if (filtros.centro_salud_id) {
            query = query.eq('centro_salud_id', filtros.centro_salud_id);
          }
          if (filtros.tipo) {
            query = query.eq('tipo', filtros.tipo);
          }
          if (filtros.estado) {
            query = query.eq('estado', filtros.estado);
          }
          if (filtros.mes && filtros.anio) {
            const fechaInicio = new Date(filtros.anio, filtros.mes - 1, 1);
            const fechaFin = new Date(filtros.anio, filtros.mes, 0);
            query = query.gte('fecha_inicio', fechaInicio.toISOString())
                         .lte('fecha_inicio', fechaFin.toISOString());
          }
          
          const { data, error } = await query;
          
          if (error) throw error;
          
          const guardias = data?.map(g => ({
            ...g,
            profesional: g.profesionales_guardias,
            nombre_centro: g.centros_salud?.nombre,
          })) || [];
          
          set({ guardias, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },
      
      createGuardia: async (data) => {
        set({ isLoading: true, error: null });
        try {
          // Calcular horas automáticamente
          if (data.fecha_inicio && data.fecha_fin) {
            const inicio = new Date(data.fecha_inicio);
            const fin = new Date(data.fecha_fin);
            const horas = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60);
            data.horas = horas;
            
            // Calcular tipo de día
            data.tipo_dia = get().calcularTipoDia(inicio, fin);
          }
          
          const { data: newGuardia, error } = await supabase
            .from('guardias')
            .insert([data])
            .select()
            .single();
            
          if (error) throw error;
          
          set(state => ({
            guardias: [newGuardia, ...state.guardias],
            isLoading: false
          }));
          
          return newGuardia;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },
      
      updateGuardia: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase
            .from('guardias')
            .update(data)
            .eq('id', id);
            
          if (error) throw error;
          
          set(state => ({
            guardias: state.guardias.map(g => 
              g.id === id ? { ...g, ...data } : g
            ),
            isLoading: false
          }));
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },
      
      deleteGuardia: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase
            .from('guardias')
            .delete()
            .eq('id', id);
            
          if (error) throw error;
          
          set(state => ({
            guardias: state.guardias.filter(g => g.id !== id),
            isLoading: false
          }));
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },
      
      validarGuardia: async (guardiaId, etapa, resultado, comentario) => {
        set({ isLoading: true, error: null });
        try {
          // Crear validación
          const { error: validacionError } = await supabase
            .from('validaciones_guardias')
            .insert([{
              guardia_id: guardiaId,
              etapa,
              resultado,
              comentario,
              usuario_id: (await supabase.auth.getUser()).data.user?.id
            }]);
            
          if (validacionError) throw validacionError;
          
          // Actualizar estado de la guardia
          const nuevoEstado = resultado === 'aprobada' ? 'validada' : 'rechazada';
          const { error: guardiaError } = await supabase
            .from('guardias')
            .update({ validacion_estado: nuevoEstado })
            .eq('id', guardiaId);
            
          if (guardiaError) throw guardiaError;
          
          // Refrescar datos
          await get().fetchGuardias(get().filtros);
          set({ isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },
      
      fetchValidaciones: async (guardiaId) => {
        try {
          const { data, error } = await supabase
            .from('validaciones_guardias')
            .select('*')
            .eq('guardia_id', guardiaId)
            .order('fecha', { ascending: true });
            
          if (error) throw error;
          
          set({ validaciones: data || [] });
        } catch (error: any) {
          set({ error: error.message });
        }
      },
      
      fetchNominas: async (centroId) => {
        set({ isLoading: true, error: null });
        try {
          let query = supabase
            .from('nominas_guardias')
            .select(`
              *,
              centros_salud!centro_salud_id (nombre)
            `)
            .order('anio', { ascending: false })
            .order('mes', { ascending: false });
            
          if (centroId) {
            query = query.eq('centro_salud_id', centroId);
          }
          
          const { data, error } = await query;
          
          if (error) throw error;
          
          const nominas = data?.map(n => ({
            ...n,
            nombre_centro: n.centros_salud?.nombre,
          })) || [];
          
          set({ nominas, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },
      
      generarNomina: async (centroId, mes, anio) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Implementar lógica de generación de nómina
          // Por ahora, crear nómina básica
          const { data: newNomina, error } = await supabase
            .from('nominas_guardias')
            .insert([{
              centro_salud_id: centroId,
              mes,
              anio,
              estado: 'borrador',
              created_by: (await supabase.auth.getUser()).data.user?.id
            }])
            .select()
            .single();
            
          if (error) throw error;
          
          set(state => ({
            nominas: [newNomina, ...state.nominas],
            isLoading: false
          }));
          
          return newNomina;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },
      
      aprobarNomina: async (nominaId) => {
        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase
            .from('nominas_guardias')
            .update({ 
              estado: 'aprobada',
              approved_by: (await supabase.auth.getUser()).data.user?.id,
              approved_at: new Date().toISOString()
            })
            .eq('id', nominaId);
            
          if (error) throw error;
          
          await get().fetchNominas();
          set({ isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },
      
      rechazarNomina: async (nominaId, motivo) => {
        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase
            .from('nominas_guardias')
            .update({ 
              estado: 'rechazada',
              observaciones: motivo
            })
            .eq('id', nominaId);
            
          if (error) throw error;
          
          await get().fetchNominas();
          set({ isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },
      
      fetchPagos: async (nominaId) => {
        set({ isLoading: true, error: null });
        try {
          let query = supabase
            .from('pagos_guardias')
            .select(`
              *,
              profesionales_guardias!profesional_guardia_id (*),
              nominas_guardias!nomina_id (*)
            `)
            .order('fecha_pago', { ascending: false });
            
          if (nominaId) {
            query = query.eq('nomina_id', nominaId);
          }
          
          const { data, error } = await query;
          
          if (error) throw error;
          
          const pagos = data?.map(p => ({
            ...p,
            profesional: p.profesionales_guardias,
            nomina: p.nominas_guardias,
          })) || [];
          
          set({ pagos, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },
      
      registrarPago: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const { data: newPago, error } = await supabase
            .from('pagos_guardias')
            .insert([{
              ...data,
              created_by: (await supabase.auth.getUser()).data.user?.id
            }])
            .select()
            .single();
            
          if (error) throw error;
          
          set(state => ({
            pagos: [newPago, ...state.pagos],
            isLoading: false
          }));
          
          return newPago;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },
      
      confirmarPago: async (pagoId) => {
        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase
            .from('pagos_guardias')
            .update({ estado: 'confirmado' })
            .eq('id', pagoId);
            
          if (error) throw error;
          
          await get().fetchPagos();
          set({ isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },
      
      fetchBaremos: async () => {
        try {
          const { data, error } = await supabase
            .from('ajustes_baremos')
            .select('*')
            .eq('activo', true)
            .order('categoria', { ascending: true })
            .order('tipo_guardia', { ascending: true });
            
          if (error) throw error;
          
          set({ baremos: data || [] });
        } catch (error: any) {
          set({ error: error.message });
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
          set({ error: error.message });
        }
      },
      
      cambiarFuenteBaremo: async (fuente) => {
        set(state => ({
          configuracion: { ...state.configuracion, fuenteBaremo: fuente }
        }));
        await get().fetchBaremos();
      },
      
      updateConfiguracion: (config) => {
        set(state => ({
          configuracion: { ...state.configuracion, ...config }
        }));
      },
      
      setFiltros: (filtros) => {
        set(state => ({
          filtros: { ...state.filtros, ...filtros }
        }));
      },
      
      setSelectedGuardia: (guardia) => set({ selectedGuardia: guardia }),
      setSelectedNomina: (nomina) => set({ selectedNomina: nomina }),
      setSelectedProfesional: (profesional) => set({ selectedProfesional: profesional }),
      setError: (error) => set({ error }),
      setLoading: (isLoading) => set({ isLoading }),
      
      // Utilidades
      calcularTipoDia: (fechaInicio, fechaFin) => {
        const diaSemana = fechaInicio.getDay(); // 0=domingo, 6=sábado
        
        // Verificar si es día festivo (simplificado)
        const { diasFestivos } = get();
        const fechaStr = fechaInicio.toISOString().split('T')[0];
        const esFestivo = diasFestivos.some(f => f.fecha === fechaStr && f.activo);
        
        if (esFestivo) return 'festivo';
        if (diaSemana === 0 || diaSemana === 6) return 'fin_semana';
        return 'ordinario';
      },
      
      calcularBaremo: (guardia, profesional) => {
        const { baremos, configuracion } = get();
        
        // Buscar baremo aplicable
        const baremo = baremos.find(b => 
          b.categoria === profesional.categoria &&
          b.tipo_guardia === guardia.tipo &&
          b.tipo_dia === guardia.tipo_dia &&
          b.fuente === configuracion.fuenteBaremo &&
          b.activo
        );
        
        if (!baremo) return 0;
        
        if (guardia.tipo === 'localizable') {
          let total = 0;
          // 10% por estar localizable
          total += baremo.valor * (baremo.porcentaje_localizable / 100);
          // 20% adicional si fue llamada asistida
          if (guardia.localizable_activada) {
            total += baremo.valor * (baremo.porcentaje_llamada / 100);
          }
          return total;
        }
        
        return baremo.valor;
      },
      
      validarHorarios: (fechaInicio, fechaFin) => {
        const { configuracion } = get();
        const horas = (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60);
        return horas >= configuracion.horasMinimas && horas <= configuracion.horasMaximas;
      },
      
      exportarNominaPDF: async (nominaId) => {
        // TODO: Implementar exportación PDF
        console.log('Exportar nómina PDF:', nominaId);
      },
      
      exportarNominaExcel: async (nominaId) => {
        // TODO: Implementar exportación Excel
        console.log('Exportar nómina Excel:', nominaId);
      },
    }),
    {
      name: 'guardias-store',
      // Solo persistir configuración y filtros
      partialize: (state) => ({
        configuracion: state.configuracion,
        filtros: state.filtros,
      }),
    }
  )
);

export default useGuardiasStore;
