import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { throwFormattedGuardError } from '@/utils/guardSystemErrorHandler';
import {
  Guardia,
  Validacion,
  Nomina,
  Pago,
  AjusteBaremo,
  ConfiguracionSistema,
  TipoGuardia,
  TipoDia,
  CategoriaProfesional,
  EstadoGuardia,
  EstadoValidacion,
  EtapaValidacion
} from '@/types/guardias';

// Guards/Shifts Management
export const useGuardias = (filters?: {
  centroId?: string;
  profesionalId?: string;
  mes?: number;
  anio?: number;
  estado?: EstadoGuardia;
  validacionEstado?: EstadoValidacion;
}) => {
  return useQuery({
    queryKey: ['guardias', filters],
    queryFn: async () => {
      let query = supabase
        .from('guardias')
        .select(`
          *,
          profesionales_guardias!guardias_profesional_guardia_id_fkey(
            *,
            profesionales_sanitarios!profesionales_guardias_profesional_id_fkey(
              nombre_completo,
              area_profesional
            )
          ),
          centros_salud!guardias_centro_salud_id_fkey(
            nombre,
            categoria,
            distrito_sanitario
          )
        `)
        .order('fecha_inicio', { ascending: false });

      if (filters?.centroId) {
        query = query.eq('centro_salud_id', filters.centroId);
      }
      if (filters?.profesionalId) {
        query = query.eq('profesional_guardia_id', filters.profesionalId);
      }
      if (filters?.estado) {
        query = query.eq('estado', filters.estado);
      }
      if (filters?.validacionEstado) {
        query = query.eq('validacion_estado', filters.validacionEstado);
      }
      if (filters?.mes && filters?.anio) {
        const startDate = new Date(filters.anio, filters.mes - 1, 1);
        const endDate = new Date(filters.anio, filters.mes, 0);
        query = query
          .gte('fecha_inicio', startDate.toISOString())
          .lte('fecha_inicio', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        // Handle case where tables don't exist yet
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.warn('Guard tables not yet created, returning empty data');
          return [];
        }
        throwFormattedGuardError(error, { component: 'useGuardias', action: 'fetching guards' });
      }

      return (data || []).map(guard => ({
        id: guard.id,
        profesionalId: guard.profesional_guardia_id,
        tipo: guard.tipo as TipoGuardia,
        fechaInicio: new Date(guard.fecha_inicio),
        fechaFin: new Date(guard.fecha_fin),
        horas: Number(guard.horas || 0),
        tipoDia: guard.tipo_dia as TipoDia,
        estado: guard.estado as EstadoGuardia,
        validacionEstado: guard.validacion_estado as EstadoValidacion,
        observaciones: guard.observaciones,
        localizableActivada: guard.localizable_activada,
        horaLlamada: guard.hora_llamada ? new Date(guard.hora_llamada) : undefined,
        horaLlegada: guard.hora_llegada ? new Date(guard.hora_llegada) : undefined,
        servicioAtendido: guard.servicio_atendido,
        casoAtendido: guard.caso_atendido,
        profesional: guard.profesionales_guardias?.profesionales_sanitarios ? {
          nombre: guard.profesionales_guardias.profesionales_sanitarios.nombre_completo,
          area: guard.profesionales_guardias.profesionales_sanitarios.area_profesional
        } : undefined,
        centro: guard.centros_salud ? {
          nombre: guard.centros_salud.nombre,
          categoria: guard.centros_salud.categoria
        } : undefined
      })) as Guardia[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateGuardia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (guardiaData: {
      profesionalGuardiaId: string;
      centroSaludId: string;
      tipo: TipoGuardia;
      fechaInicio: Date;
      fechaFin: Date;
      observaciones?: string;
      localizableActivada?: boolean;
      servicioAtendido?: string;
      casoAtendido?: string;
    }) => {
      const { data, error } = await supabase
        .from('guardias')
        .insert({
          profesional_guardia_id: guardiaData.profesionalGuardiaId,
          centro_salud_id: guardiaData.centroSaludId,
          tipo: guardiaData.tipo,
          fecha_inicio: guardiaData.fechaInicio.toISOString(),
          fecha_fin: guardiaData.fechaFin.toISOString(),
          observaciones: guardiaData.observaciones,
          localizable_activada: guardiaData.localizableActivada,
          servicio_atendido: guardiaData.servicioAtendido,
          caso_atendido: guardiaData.casoAtendido
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardias'] });
    },
  });
};

export const useUpdateGuardia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Guardia> }) => {
      const { data, error } = await supabase
        .from('guardias')
        .update({
          estado: updates.estado,
          validacion_estado: updates.validacionEstado,
          observaciones: updates.observaciones,
          localizable_activada: updates.localizableActivada,
          hora_llamada: updates.horaLlamada?.toISOString(),
          hora_llegada: updates.horaLlegada?.toISOString(),
          servicio_atendido: updates.servicioAtendido,
          caso_atendido: updates.casoAtendido
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardias'] });
    },
  });
};

// Validation Management
export const useValidaciones = (guardiaId?: string) => {
  return useQuery({
    queryKey: ['validaciones', guardiaId],
    queryFn: async () => {
      let query = supabase
        .from('validaciones_guardias')
        .select(`
          *,
          guardias!validaciones_guardias_guardia_id_fkey(
            id,
            fecha_inicio,
            fecha_fin
          )
        `)
        .order('fecha', { ascending: false });

      if (guardiaId) {
        query = query.eq('guardia_id', guardiaId);
      }

      const { data, error } = await query;

      if (error) {
        // Handle case where tables don't exist yet
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.warn('Guard tables not yet created, returning empty data');
          return [];
        }
        throwFormattedGuardError(error, { component: 'useValidaciones', action: 'fetching validations' });
      }

      return (data || []).map(validation => ({
        id: validation.id,
        guardiaId: validation.guardia_id,
        etapa: validation.etapa as EtapaValidacion,
        usuarioId: validation.usuario_id,
        fecha: new Date(validation.fecha),
        resultado: validation.resultado as 'aprobada' | 'rechazada',
        comentario: validation.comentario,
        firma: validation.firma
      })) as Validacion[];
    },
    enabled: !!guardiaId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateValidacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (validacionData: {
      guardiaId: string;
      etapa: EtapaValidacion;
      resultado: 'aprobada' | 'rechazada';
      comentario?: string;
      firma?: string;
    }) => {
      // First create the validation
      const { data: validationData, error: validationError } = await supabase
        .from('validaciones_guardias')
        .insert({
          guardia_id: validacionData.guardiaId,
          etapa: validacionData.etapa,
          resultado: validacionData.resultado,
          comentario: validacionData.comentario,
          firma: validacionData.firma,
          usuario_id: 'current_user' // TODO: Get from auth context
        })
        .select()
        .single();

      if (validationError) throw validationError;

      // Then update the guard's validation status
      const { error: guardUpdateError } = await supabase
        .from('guardias')
        .update({
          validacion_estado: validacionData.resultado === 'aprobada' ? 'validada' : 'rechazada'
        })
        .eq('id', validacionData.guardiaId);

      if (guardUpdateError) throw guardUpdateError;

      return validationData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validaciones'] });
      queryClient.invalidateQueries({ queryKey: ['guardias'] });
    },
  });
};

// Payroll Management
export const useNominas = (filters?: {
  centroId?: string;
  mes?: number;
  anio?: number;
}) => {
  return useQuery({
    queryKey: ['nominas', filters],
    queryFn: async () => {
      let query = supabase
        .from('nominas_guardias')
        .select(`
          *,
          centros_salud!nominas_guardias_centro_salud_id_fkey(
            nombre,
            categoria
          )
        `)
        .order('fecha_creacion', { ascending: false });

      if (filters?.centroId) {
        query = query.eq('centro_salud_id', filters.centroId);
      }
      if (filters?.mes) {
        query = query.eq('mes', filters.mes);
      }
      if (filters?.anio) {
        query = query.eq('anio', filters.anio);
      }

      const { data, error } = await query;

      if (error) {
        // Handle case where tables don't exist yet
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.warn('Guard tables not yet created, returning empty data');
          return [];
        }
        throwFormattedGuardError(error, { component: 'useNominas', action: 'fetching payrolls' });
      }

      return (data || []).map(nomina => ({
        id: nomina.id,
        mes: nomina.mes,
        anio: nomina.anio,
        hospitalId: nomina.centro_salud_id,
        estado: nomina.estado,
        totalesPorCategoria: nomina.totales_por_categoria || {},
        totalesPorTipo: nomina.totales_por_tipo || {},
        totalGeneral: Number(nomina.total_general || 0),
        archivoPdf: nomina.archivo_pdf,
        archivoXlsx: nomina.archivo_xlsx,
        fechaCreacion: new Date(nomina.fecha_creacion),
        centro: nomina.centros_salud ? {
          nombre: nomina.centros_salud.nombre
        } : undefined
      })) as Nomina[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useGenerateNomina = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nominaData: {
      mes: number;
      anio: number;
      centroSaludId: string;
    }) => {
      // Call stored procedure or function to generate payroll
      const { data, error } = await supabase.rpc('generar_nomina_guardias', {
        p_mes: nominaData.mes,
        p_anio: nominaData.anio,
        p_centro_salud_id: nominaData.centroSaludId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nominas'] });
    },
  });
};

// Scale/Baremo Management
export const useBaremos = () => {
  return useQuery({
    queryKey: ['baremos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ajustes_baremo')
        .select('*')
        .eq('activo', true)
        .order('categoria', { ascending: true });

      if (error) {
        // Handle case where tables don't exist yet
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.warn('Guard tables not yet created, returning empty data');
          return [];
        }
        throwFormattedGuardError(error, { component: 'useBaremos', action: 'fetching scale adjustments' });
      }

      return (data || []).map(baremo => ({
        id: baremo.id,
        fuente: baremo.fuente,
        categoria: baremo.categoria as CategoriaProfesional,
        tipoGuardia: baremo.tipo_guardia as TipoGuardia,
        tipoDia: baremo.tipo_dia as TipoDia,
        valor: Number(baremo.valor),
        porcentajeLocalizable: baremo.porcentaje_localizable_condicion ? {
          condicion: baremo.porcentaje_localizable_condicion,
          llamada: baremo.porcentaje_localizable_llamada || 0
        } : undefined,
        vigenteDesde: new Date(baremo.vigente_desde),
        vigenteHasta: baremo.vigente_hasta ? new Date(baremo.vigente_hasta) : undefined,
        activo: baremo.activo
      })) as AjusteBaremo[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateBaremo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AjusteBaremo> }) => {
      const { data, error } = await supabase
        .from('ajustes_baremo')
        .update({
          valor: updates.valor,
          porcentaje_localizable_condicion: updates.porcentajeLocalizable?.condicion,
          porcentaje_localizable_llamada: updates.porcentajeLocalizable?.llamada,
          vigente_hasta: updates.vigenteHasta?.toISOString(),
          activo: updates.activo
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baremos'] });
    },
  });
};

// Configuration Management
export const useConfiguracion = () => {
  return useQuery({
    queryKey: ['configuracion-guardias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracion_guardias')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching configuration:', error);
        // Handle case where tables don't exist yet
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.warn('Guard tables not yet created, returning default configuration');
          return {
            fuenteBaremo: 'protocol' as const,
            limitesGuardias: { minimo: 4, maximo: 6 },
            duracionMinima: 12,
            duracionMaxima: 24,
            notificacionesActivas: true
          };
        }
        throwFormattedGuardError(error, { component: 'useConfiguracion', action: 'fetching configuration' });
      }

      return {
        fuenteBaremo: data.fuente_baremo,
        limitesGuardias: {
          minimo: data.limite_guardias_minimo,
          maximo: data.limite_guardias_maximo
        },
        duracionMinima: data.duracion_minima_horas,
        duracionMaxima: data.duracion_maxima_horas,
        notificacionesActivas: data.notificaciones_activas
      } as ConfiguracionSistema;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useUpdateConfiguracion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<ConfiguracionSistema>) => {
      const { data, error } = await supabase
        .from('configuracion_guardias')
        .update({
          fuente_baremo: config.fuenteBaremo,
          limite_guardias_minimo: config.limitesGuardias?.minimo,
          limite_guardias_maximo: config.limitesGuardias?.maximo,
          duracion_minima_horas: config.duracionMinima,
          duracion_maxima_horas: config.duracionMaxima,
          notificaciones_activas: config.notificacionesActivas
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracion-guardias'] });
    },
  });
};

// Utility function to calculate scale
export const useCalculateBaremo = () => {
  return useMutation({
    mutationFn: async ({
      categoria,
      tipoGuardia,
      tipoDia,
      fuente = 'protocol'
    }: {
      categoria: CategoriaProfesional;
      tipoGuardia: TipoGuardia;
      tipoDia: TipoDia;
      fuente?: string;
    }) => {
      const { data, error } = await supabase.rpc('calcular_baremo', {
        p_categoria: categoria,
        p_tipo_guardia: tipoGuardia,
        p_tipo_dia: tipoDia,
        p_fuente: fuente
      });

      if (error) throw error;
      return Number(data || 0);
    },
  });
};
