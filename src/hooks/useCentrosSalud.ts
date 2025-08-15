
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CentroSalud {
  id: string;
  nombre: string;
  categoria: string;
  distrito_sanitario: string;
  sector: string;
  provincia: string;
  distrito: string;
  director?: string;
  telefono?: string;
  especialidades?: string[];
  estado: string;
  created_at: string;
  updated_at: string;
  profesionales_aprobados_count?: number;
}

export interface BuscarCentrosParams {
  nombre_parcial?: string;
  categoria?: string;
  distrito_sanitario?: string;
}

export const useCentrosSalud = () => {
  return useQuery({
    queryKey: ['centros-salud'],
    queryFn: async (): Promise<CentroSalud[]> => {
      console.log('🏥 Cargando centros de salud...');
      
      const { data, error } = await supabase
        .from('centros_salud')
        .select('*')
        .order('nombre');

      if (error) {
        console.error('Error loading centros:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useBuscarCentros = () => {
  return useMutation({
    mutationFn: async (params: BuscarCentrosParams): Promise<CentroSalud[]> => {
      const { data, error } = await supabase
        .rpc('buscar_centros_por_criterios', {
          p_nombre_parcial: params.nombre_parcial || null,
          p_categoria: params.categoria || null,
          p_distrito_sanitario: params.distrito_sanitario || null
        });

      if (error) {
        console.error('Error searching centros:', error);
        throw error;
      }

      return data || [];
    }
  });
};

export const useProfesionalesPorCentro = (centroId: string) => {
  return useQuery({
    queryKey: ['profesionales-por-centro', centroId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profesionales_sanitarios')
        .select('*')
        .eq('centro_salud_id', centroId)
        .eq('estado_solicitud', 'aprobada');

      if (error) throw error;
      return data || [];
    },
    enabled: !!centroId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCrearCentro = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nuevoCentro: Omit<CentroSalud, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('centros_salud')
        .insert(nuevoCentro)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centros-salud'] });
      toast.success('Centro creado exitosamente');
    },
    onError: (error: any) => {
      toast.error('Error al crear centro: ' + error.message);
    }
  });
};

export const useActualizarCentro = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CentroSalud> & { id: string }) => {
      const { data, error } = await supabase
        .from('centros_salud')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centros-salud'] });
      toast.success('Centro actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error('Error al actualizar centro: ' + error.message);
    }
  });
};
