
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
  const queryClient = useQueryClient();

  // Query para obtener todos los centros
  const { data: centrosSalud = [], isLoading, error } = useQuery({
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

  // Función para buscar centros por criterios
  const buscarCentros = async (params: BuscarCentrosParams): Promise<CentroSalud[]> => {
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
  };

  // Mutación para crear centro
  const crearCentroMutation = useMutation({
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

  // Mutación para actualizar centro
  const actualizarCentroMutation = useMutation({
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

  return {
    data: centrosSalud,
    isLoading,
    error,
    buscarCentros,
    crearCentroMutation,
    actualizarCentroMutation
  };
};
