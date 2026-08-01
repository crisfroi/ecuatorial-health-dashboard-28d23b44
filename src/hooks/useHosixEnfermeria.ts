import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/hosixClient';

// ============================================================
// TIPOS E INTERFACES
// ============================================================

export interface WorklistEnfermeria {
  id: string;
  paciente_id: string;
  episodio_id?: string;
  tipo_episodio: string;
  servicio_id?: string;
  enfermera_asignada_id?: string;
  fecha_asignacion?: string;
  estado: string;
  prioridad: string;
  observaciones?: string;
  requiere_atencion_continua: boolean;
  created_at: string;
  updated_at: string;
  paciente?: {
    id: string;
    ppi: string;
    primer_nombre: string;
    primer_apellido: string;
    fecha_nacimiento: string;
  };
  servicio?: {
    id: string;
    nombre: string;
  };
}

export interface ConstantesVitales {
  id: string;
  paciente_id: string;
  episodio_id?: string;
  tipo_episodio?: string;
  worklist_id?: string;
  fecha_registro: string;
  registrado_por?: string;
  presion_arterial_sistolica?: number;
  presion_arterial_diastolica?: number;
  frecuencia_cardiaca?: number;
  frecuencia_respiratoria?: number;
  temperatura_celsius?: number;
  saturacion_oxigeno?: number;
  glucosa_capilar?: number;
  peso_kg?: number;
  talla_cm?: number;
  imc?: number;
  signos_adicionales?: Record<string, any>;
  observaciones?: string;
  alertas?: string[];
}

export interface EvaluacionEnfermeria {
  id: string;
  paciente_id: string;
  episodio_id?: string;
  tipo_episodio?: string;
  worklist_id?: string;
  fecha_evaluacion: string;
  evaluado_por?: string;
  motivo_ingreso?: string;
  alergias?: string[];
  medicamentos_actuales?: any[];
  antecedentes_relevantes?: string;
  nivel_dependencia?: string;
  movilidad?: string;
  estado_nutricional?: string;
  escala_glasgow?: number;
  escala_norton?: number;
  escala_braden?: number;
  observaciones?: string;
  plan_cuidados_inicial?: string;
}

export interface PlanCuidado {
  id: string;
  paciente_id: string;
  episodio_id?: string;
  tipo_episodio?: string;
  worklist_id?: string;
  tipo_plan: string;
  nombre_plan?: string;
  codigo_nanda?: string;
  diagnostico_enfermeria: string;
  factores_relacionados?: string[];
  caracteristicas_definitorias?: string[];
  objetivos?: any[];
  intervenciones?: any[];
  estado: string;
  fecha_inicio: string;
  fecha_fin?: string;
  creado_por?: string;
}

export interface KardexEntry {
  id: string;
  paciente_id: string;
  episodio_id?: string;
  tipo_episodio?: string;
  worklist_id?: string;
  prescripcion_id?: string;
  plan_cuidado_id?: string;
  tipo_registro: string;
  fecha_hora: string;
  registrado_por?: string;
  medicamento_id?: string;
  medicamento_texto?: string;
  dosis?: string;
  via_administracion?: string;
  hora_programada?: string;
  hora_real?: string;
  tipo_cuidado?: string;
  descripcion_cuidado?: string;
  estado: string;
  motivo_omision?: string;
  observaciones?: string;
  respuesta_paciente?: string;
}

export interface BalanceHidrico {
  id: string;
  paciente_id: string;
  episodio_id?: string;
  tipo_episodio?: string;
  worklist_id?: string;
  fecha: string;
  turno?: string;
  ingesta_oral?: number;
  ingesta_sonda?: number;
  ingesta_venosa?: number;
  ingesta_otros?: number;
  total_ingesta?: number;
  eliminacion_orina?: number;
  eliminacion_heces?: number;
  eliminacion_sonda?: number;
  eliminacion_drenajes?: number;
  eliminacion_otros?: number;
  total_eliminacion?: number;
  balance_diario?: number;
  balance_acumulado?: number;
  observaciones?: string;
  registrado_por?: string;
}

export interface DiarioEnfermeria {
  id: string;
  paciente_id: string;
  episodio_id?: string;
  tipo_episodio?: string;
  worklist_id?: string;
  fecha_hora: string;
  registrado_por?: string;
  tipo_anotacion?: string;
  titulo?: string;
  contenido: string;
  modelo_predefinido_id?: string;
  modelo_predefinido_nombre?: string;
  datos_estructurados?: Record<string, any>;
  firmado: boolean;
  fecha_firma?: string;
}

// ============================================================
// HOOK PRINCIPAL
// ============================================================

export const useHosixEnfermeria = () => {
  const queryClient = useQueryClient();

  // ============================================================
  // WORKLIST
  // ============================================================

  const { data: worklist = [], isLoading: isLoadingWorklist } = useQuery({
    queryKey: ['enfermeria-worklist'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('hosix_enfermeria_worklist' as any)
        .select(`
          *,
          paciente:hosix_pacientes(id, ppi, primer_nombre, primer_apellido, fecha_nacimiento),
          servicio:hosix_servicios(id, nombre)
        `)
        .in('estado', ['pendiente', 'en_atencion'])
        .order('prioridad', { ascending: false })
        .order('created_at', { ascending: true }) as any);

      if (error) throw error;
      return data || [];
    },
  });

  const crearWorklistMutation = useMutation({
    mutationFn: async (data: Partial<WorklistEnfermeria>) => {
      const { data: result, error } = await (supabase
        .from('hosix_enfermeria_worklist' as any)
        .insert([data])
        .select()
        .single() as any);

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enfermeria-worklist'] });
    },
  });

  const actualizarWorklistMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<WorklistEnfermeria> & { id: string }) => {
      const { data: result, error } = await (supabase
        .from('hosix_enfermeria_worklist' as any)
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single() as any);

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enfermeria-worklist'] });
    },
  });

  // ============================================================
  // CONSTANTES VITALES
  // ============================================================

  const obtenerConstantes = (pacienteId: string, episodioId?: string) => {
    return useQuery({
      queryKey: ['enfermeria-constantes', pacienteId, episodioId],
      queryFn: async () => {
        let query = (supabase
          .from('hosix_enfermeria_constantes' as any)
          .select('*')
          .eq('paciente_id', pacienteId)
          .order('fecha_registro', { ascending: false })
          .limit(50) as any);

        if (episodioId) {
          query = query.eq('episodio_id', episodioId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      },
    });
  };

  const registrarConstantesMutation = useMutation({
    mutationFn: async (data: Partial<ConstantesVitales>) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data: result, error } = await (supabase
        .from('hosix_enfermeria_constantes' as any)
        .insert([
          {
            ...data,
            registrado_por: user.user?.id,
            fecha_registro: new Date().toISOString(),
          },
        ])
        .select()
        .single() as any);

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['enfermeria-constantes', variables.paciente_id, variables.episodio_id] 
      });
      queryClient.invalidateQueries({ queryKey: ['enfermeria-worklist'] });
    },
  });

  // ============================================================
  // EVALUACIONES
  // ============================================================

  const obtenerEvaluaciones = (pacienteId: string, episodioId?: string) => {
    return useQuery({
      queryKey: ['enfermeria-evaluaciones', pacienteId, episodioId],
      queryFn: async () => {
        let query = (supabase
          .from('hosix_enfermeria_evaluaciones' as any)
          .select('*')
          .eq('paciente_id', pacienteId)
          .order('fecha_evaluacion', { ascending: false }) as any);

        if (episodioId) {
          query = query.eq('episodio_id', episodioId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      },
    });
  };

  const crearEvaluacionMutation = useMutation({
    mutationFn: async (data: Partial<EvaluacionEnfermeria>) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data: result, error } = await (supabase
        .from('hosix_enfermeria_evaluaciones' as any)
        .insert([
          {
            ...data,
            evaluado_por: user.user?.id,
            fecha_evaluacion: new Date().toISOString(),
          },
        ])
        .select()
        .single() as any);

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['enfermeria-evaluaciones', variables.paciente_id, variables.episodio_id] 
      });
    },
  });

  // ============================================================
  // PLANES DE CUIDADO
  // ============================================================

  const obtenerPlanes = (pacienteId: string, episodioId?: string) => {
    return useQuery({
      queryKey: ['enfermeria-planes', pacienteId, episodioId],
      queryFn: async () => {
        let query = (supabase
          .from('hosix_enfermeria_planes' as any)
          .select('*')
          .eq('paciente_id', pacienteId)
          .in('estado', ['activo', 'suspendido'])
          .order('fecha_inicio', { ascending: false }) as any);

        if (episodioId) {
          query = query.eq('episodio_id', episodioId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      },
    });
  };

  const crearPlanMutation = useMutation({
    mutationFn: async (data: Partial<PlanCuidado>) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data: result, error } = await (supabase
        .from('hosix_enfermeria_planes' as any)
        .insert([
          {
            ...data,
            creado_por: user.user?.id,
            fecha_inicio: new Date().toISOString(),
            estado: 'activo',
          },
        ])
        .select()
        .single() as any);

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['enfermeria-planes', variables.paciente_id, variables.episodio_id] 
      });
    },
  });

  const actualizarPlanMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<PlanCuidado> & { id: string }) => {
      const { data: result, error } = await (supabase
        .from('hosix_enfermeria_planes' as any)
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single() as any);

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['enfermeria-planes', variables.paciente_id, variables.episodio_id] 
      });
    },
  });

  // ============================================================
  // KARDEX
  // ============================================================

  const obtenerKardex = (pacienteId: string, episodioId?: string) => {
    return useQuery({
      queryKey: ['enfermeria-kardex', pacienteId, episodioId],
      queryFn: async () => {
        let query = (supabase
          .from('hosix_enfermeria_kardex' as any)
          .select(`
            *,
            medicamento:hosix_medicamentos(id, nombre_comercial),
            prescripcion:hosix_prescripciones(id, dosis, frecuencia)
          `)
          .eq('paciente_id', pacienteId)
          .order('fecha_hora', { ascending: false })
          .limit(100) as any);

        if (episodioId) {
          query = query.eq('episodio_id', episodioId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      },
    });
  };

  const registrarKardexMutation = useMutation({
    mutationFn: async (data: Partial<KardexEntry>) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data: result, error } = await (supabase
        .from('hosix_enfermeria_kardex' as any)
        .insert([
          {
            ...data,
            registrado_por: user.user?.id,
            fecha_hora: new Date().toISOString(),
            hora_real: new Date().toTimeString().slice(0, 5),
            estado: 'realizado',
          },
        ])
        .select()
        .single() as any);

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['enfermeria-kardex', variables.paciente_id, variables.episodio_id] 
      });
    },
  });

  // ============================================================
  // BALANCE HÍDRICO
  // ============================================================

  const obtenerBalanceHidrico = (pacienteId: string, episodioId?: string, fecha?: string) => {
    return useQuery({
      queryKey: ['enfermeria-balance-hidrico', pacienteId, episodioId, fecha],
      queryFn: async () => {
        let query = (supabase
          .from('hosix_enfermeria_balance_hidrico' as any)
          .select('*')
          .eq('paciente_id', pacienteId)
          .order('fecha', { ascending: false })
          .order('turno', { ascending: true })
          .limit(30) as any);

        if (episodioId) {
          query = query.eq('episodio_id', episodioId);
        }
        if (fecha) {
          query = query.eq('fecha', fecha);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      },
    });
  };

  const registrarBalanceMutation = useMutation({
    mutationFn: async (data: Partial<BalanceHidrico>) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data: result, error } = await (supabase
        .from('hosix_enfermeria_balance_hidrico' as any)
        .insert([
          {
            ...data,
            registrado_por: user.user?.id,
            fecha: data.fecha || new Date().toISOString().split('T')[0],
          },
        ])
        .select()
        .single() as any);

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['enfermeria-balance-hidrico', variables.paciente_id, variables.episodio_id] 
      });
    },
  });

  // ============================================================
  // DIARIO CLÍNICO
  // ============================================================

  const obtenerDiario = (pacienteId: string, episodioId?: string) => {
    return useQuery({
      queryKey: ['enfermeria-diario', pacienteId, episodioId],
      queryFn: async () => {
        let query = (supabase
          .from('hosix_enfermeria_diario' as any)
          .select('*')
          .eq('paciente_id', pacienteId)
          .order('fecha_hora', { ascending: false })
          .limit(50) as any);

        if (episodioId) {
          query = query.eq('episodio_id', episodioId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      },
    });
  };

  const crearAnotacionMutation = useMutation({
    mutationFn: async (data: Partial<DiarioEnfermeria>) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data: result, error } = await (supabase
        .from('hosix_enfermeria_diario' as any)
        .insert([
          {
            ...data,
            registrado_por: user.user?.id,
            fecha_hora: new Date().toISOString(),
            firmado: false,
          },
        ])
        .select()
        .single() as any);

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['enfermeria-diario', variables.paciente_id, variables.episodio_id] 
      });
    },
  });

  // ============================================================
  // RETORNO DEL HOOK
  // ============================================================

  return {
    // Worklist
    worklist,
    isLoadingWorklist,
    crearWorklistMutation,
    actualizarWorklistMutation,
    
    // Constantes vitales
    obtenerConstantes,
    registrarConstantesMutation,
    
    // Evaluaciones
    obtenerEvaluaciones,
    crearEvaluacionMutation,
    
    // Planes de cuidado
    obtenerPlanes,
    crearPlanMutation,
    actualizarPlanMutation,
    
    // Kardex
    obtenerKardex,
    registrarKardexMutation,
    
    // Balance hídrico
    obtenerBalanceHidrico,
    registrarBalanceMutation,
    
    // Diario clínico
    obtenerDiario,
    crearAnotacionMutation,
  };
};

