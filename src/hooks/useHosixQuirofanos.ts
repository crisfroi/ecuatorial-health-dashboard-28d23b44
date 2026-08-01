import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/hosixClient';
import { useToast } from '@/hooks/use-toast';

export interface BloqueLista {
  id: string;
  nombre: string;
  descripcion: string | null;
  numero_salas: number;
  ubicacion: string | null;
  responsable_id: string | null;
  horario_inicio: string;
  horario_fin: string;
  dias_operacion: string;
  activo: boolean;
}

export interface SalaQuirofano {
  id: string;
  bloque_id: string;
  numero_sala: number;
  nombre: string;
  tipo_procedimiento: string | null;
  capacidad_personal: number;
  tiene_anestesia: boolean;
  tiene_monitor_cardiaco: boolean;
  tiene_aspiracion: boolean;
  tiene_rayos_x: boolean;
  tiene_laparoscopia: boolean;
  estado: string;
  ultima_desinfeccion: string | null;
  proxima_mantencion: string | null;
  activo: boolean;
}

export interface Programacion {
  id: string;
  sala_id: string;
  paciente_id: string;
  tipo_procedimiento: string;
  descripcion_procedimiento: string | null;
  diagnostico_principal: string | null;
  cirujano_principal_id: string | null;
  anestesiologo_id: string | null;
  instrumentista_id: string | null;
  circulante_id: string | null;
  fecha_programada: string;
  hora_entrada: string;
  duracion_estimada: number | null;
  estado: string;
  observaciones: string | null;
  prioridad: string;
  created_at: string;
}

export interface DiarioQuirurgico {
  id: string;
  programacion_id: string;
  sala_id: string;
  paciente_id: string;
  hora_inicio_real: string | null;
  hora_fin_real: string | null;
  duracion_real: number | null;
  procedimiento_realizado: string | null;
  hallazgos: string | null;
  complicaciones: string | null;
  evento_adverso: boolean;
  descripcion_evento: string | null;
  muestra_enviada: boolean;
  observaciones_cirugia: string | null;
  firma_cirujano: boolean;
  created_at: string;
}

export function useHosixQuirofanos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener bloques quirúrgicos
  const useBloquesQuery = () => {
    return useQuery({
      queryKey: ['bloques-quirofanos'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('hosix_quirofanos_bloques')
          .select('*')
          .eq('activo', true)
          .order('nombre');
        
        if (error) throw error;
        return (data || []) as BloqueLista[];
      },
    });
  };

  // Obtener salas por bloque
  const useSalasQuery = (bloqueId?: string) => {
    return useQuery({
      queryKey: ['salas-quirofano', bloqueId],
      queryFn: async () => {
        let query = supabase
          .from('hosix_quirofanos_salas')
          .select('*')
          .eq('activo', true);
        
        if (bloqueId) {
          query = query.eq('bloque_id', bloqueId);
        }
        
        const { data, error } = await query.order('numero_sala');
        if (error) throw error;
        return (data || []) as SalaQuirofano[];
      },
      enabled: !bloqueId || bloqueId !== undefined,
    });
  };

  // Obtener programaciones próximas
  const useProgramacionesQuery = (desde?: string, hasta?: string) => {
    return useQuery({
      queryKey: ['programaciones-quirofano', desde, hasta],
      queryFn: async () => {
        let query = supabase
          .from('hosix_quirofanos_programaciones')
          .select(`
            *,
            sala:hosix_quirofanos_salas(nombre, bloque_id),
            paciente:hosix_pacientes(nombre_completo, numero_documento),
            cirujano:profesionales_sanitarios!cirujano_principal_id(nombre_completo)
          `)
          .neq('estado', 'cancelada');
        
        if (desde) {
          query = query.gte('fecha_programada', desde);
        }
        if (hasta) {
          query = query.lte('fecha_programada', hasta);
        }
        
        const { data, error } = await query
          .order('fecha_programada', { ascending: true })
          .order('hora_entrada', { ascending: true });
        
        if (error) throw error;
        return data || [];
      },
    });
  };

  // Obtener diario quirúrgico (procedimientos realizados)
  const useDiarioQuery = (pacienteId?: string, salId?: string) => {
    return useQuery({
      queryKey: ['diario-quirofano', pacienteId, salId],
      queryFn: async () => {
        let query = supabase
          .from('hosix_quirofanos_diario')
          .select(`
            *,
            programacion:hosix_quirofanos_programaciones(tipo_procedimiento),
            sala:hosix_quirofanos_salas(nombre),
            paciente:hosix_pacientes(nombre_completo)
          `);
        
        if (pacienteId) {
          query = query.eq('paciente_id', pacienteId);
        }
        if (salId) {
          query = query.eq('sala_id', salId);
        }
        
        const { data, error } = await query
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return (data || []) as DiarioQuirurgico[];
      },
      enabled: !pacienteId || !salId,
    });
  };

  // Crear bloque quirúrgico
  const crearBloqueMutation = useMutation({
    mutationFn: async (bloque: Omit<BloqueLista, 'id'>) => {
      const { data, error } = await supabase
        .from('hosix_quirofanos_bloques')
        .insert([bloque])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloques-quirofanos'] });
      toast({
        title: '✓ Bloque creado',
        description: 'El bloque quirúrgico se creó correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: '✗ Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Crear programación
  const crearProgramacionMutation = useMutation({
    mutationFn: async (prog: Omit<Programacion, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('hosix_quirofanos_programaciones')
        .insert([prog])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programaciones-quirofano'] });
      toast({
        title: '✓ Programación creada',
        description: 'La cirugía se programó correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: '✗ Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Actualizar estado de programación
  const actualizarEstadoProgramacionMutation = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const { data, error } = await supabase
        .from('hosix_quirofanos_programaciones')
        .update({ estado, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { estado }) => {
      queryClient.invalidateQueries({ queryKey: ['programaciones-quirofano'] });
      toast({
        title: '✓ Estado actualizado',
        description: `Programación marcada como ${estado}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: '✗ Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Registrar diario quirúrgico
  const registrarDiarioMutation = useMutation({
    mutationFn: async (diario: Omit<DiarioQuirurgico, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('hosix_quirofanos_diario')
        .insert([diario])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diario-quirofano'] });
      toast({
        title: '✓ Diario quirúrgico registrado',
        description: 'El procedimiento se registró correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: '✗ Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Actualizar sala (estado, desinfección)
  const actualizarSalaMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('hosix_quirofanos_salas')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salas-quirofano'] });
      toast({
        title: '✓ Sala actualizada',
      });
    },
    onError: (error: any) => {
      toast({
        title: '✗ Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Cancelar programación
  const cancelarProgramacionMutation = useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { data, error } = await supabase
        .from('hosix_quirofanos_programaciones')
        .update({
          estado: 'cancelada',
          motivo_cancelacion: motivo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programaciones-quirofano'] });
      toast({
        title: '✓ Programación cancelada',
      });
    },
    onError: (error: any) => {
      toast({
        title: '✗ Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    // Queries
    useBloquesQuery,
    useSalasQuery,
    useProgramacionesQuery,
    useDiarioQuery,
    
    // Mutations
    crearBloqueMutation,
    crearProgramacionMutation,
    actualizarEstadoProgramacionMutation,
    registrarDiarioMutation,
    actualizarSalaMutation,
    cancelarProgramacionMutation,
  };
}
