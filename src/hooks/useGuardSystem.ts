
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedErrorHandler } from './useEnhancedErrorHandler';

export interface Guardia {
  id: string;
  centro_salud_id: string;
  profesional_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo: string;
  estado: string;
  horas: number;
  validacion_estado: string;
  created_at: string;
  updated_at: string;
  
  // Relaciones
  centro?: {
    id: string;
    nombre: string;
    categoria: string;
  };
  profesional?: {
    id: string;
    nombre: string;
    area: string;
  };
  
  // Campos calculados
  fechaInicio: Date;
  fechaFin: Date;
}

interface UseGuardiasParams {
  mes?: number;
  anio?: number;
  centroId?: string;
  estado?: string;
  profesionalId?: string;
}

export const useGuardias = (params: UseGuardiasParams = {}) => {
  const { handleQueryError } = useEnhancedErrorHandler('Guardias');

  return useQuery({
    queryKey: ['guardias', params],
    queryFn: async (): Promise<Guardia[]> => {
      console.log('🛡️ Cargando guardias con parámetros:', params);
      
      let query = supabase
        .from('guardias')
        .select(`
          *,
          centro:centros_salud(id, nombre, categoria),
          profesional:profesionales_sanitarios(id, nombre, area_profesional)
        `);

      // Aplicar filtros
      if (params.centroId) {
        query = query.eq('centro_salud_id', params.centroId);
      }
      
      if (params.estado) {
        query = query.eq('estado', params.estado);
      }
      
      if (params.profesionalId) {
        query = query.eq('profesional_id', params.profesionalId);
      }

      // Filtros de fecha
      if (params.mes && params.anio) {
        const startDate = new Date(params.anio, params.mes - 1, 1).toISOString();
        const endDate = new Date(params.anio, params.mes, 0, 23, 59, 59).toISOString();
        query = query.gte('fecha_inicio', startDate).lte('fecha_inicio', endDate);
      }

      const { data, error } = await query.order('fecha_inicio', { ascending: false });

      if (error) {
        handleQueryError(error);
        throw error;
      }

      // Transformar datos
      return (data || []).map(guardia => ({
        ...guardia,
        fechaInicio: new Date(guardia.fecha_inicio),
        fechaFin: new Date(guardia.fecha_fin),
        centro: guardia.centro ? {
          id: guardia.centro.id,
          nombre: guardia.centro.nombre,
          categoria: guardia.centro.categoria
        } : undefined,
        profesional: guardia.profesional ? {
          id: guardia.profesional.id,
          nombre: guardia.profesional.nombre,
          area: guardia.profesional.area_profesional
        } : undefined
      }));
    },
    enabled: true,
    staleTime: 2 * 60 * 1000, // 2 minutos
    retry: 2
  });
};

export const useCreateGuardia = () => {
  const queryClient = useQueryClient();
  const { handleMutationError } = useEnhancedErrorHandler('CrearGuardia');

  return useMutation({
    mutationFn: async (nuevaGuardia: Omit<Guardia, 'id' | 'created_at' | 'updated_at' | 'fechaInicio' | 'fechaFin'>) => {
      const { data, error } = await supabase
        .from('guardias')
        .insert(nuevaGuardia)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardias'] });
    },
    onError: handleMutationError
  });
};

export const useUpdateGuardia = () => {
  const queryClient = useQueryClient();
  const { handleMutationError } = useEnhancedErrorHandler('ActualizarGuardia');

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Guardia> & { id: string }) => {
      const { data, error } = await supabase
        .from('guardias')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardias'] });
    },
    onError: handleMutationError
  });
};
