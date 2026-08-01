import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/hosixClient';
import { useToast } from '@/components/ui/use-toast';

export interface Paciente {
  id: string;
  ppi: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  fecha_nacimiento: string;
  sexo: string;
  numero_documento: string;
  email?: string;
  activo: boolean;
}

export const useHosixMPI = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Generar PPI único
  const generarPPI = async (): Promise<string> => {
    const { data } = await supabase
      .from('hosix_pacientes')
      .select('ppi')
      .order('ppi', { ascending: false })
      .limit(1);

    if (!data || data.length === 0) {
      return 'PPI-0001';
    }

    const ultimoPPI = data[0].ppi;
    const numero = parseInt(ultimoPPI.split('-')[1]) + 1;
    return `PPI-${String(numero).padStart(4, '0')}`;
  };

  // Buscar posibles duplicados
  const { data: posiblesDuplicados = [], isLoading: loadingDuplicados } = useQuery({
    queryKey: ['mpi_duplicados'],
    queryFn: async () => {
      // Buscar pacientes con mismo nombre y fecha nacimiento
      const { data, error } = await supabase
        .from('hosix_pacientes')
        .select('id, ppi, primer_nombre, primer_apellido, fecha_nacimiento, numero_documento')
        .eq('activo', true);

      if (error) {
        console.error('Error fetching duplicates:', error);
        return [];
      }

      // Detectar duplicados simples (mismo nombre + fecha)
      const duplicados: any[] = [];
      const vistos = new Map<string, Paciente[]>();

      data?.forEach(p => {
        const clave = `${p.primer_nombre.toLowerCase()}_${p.primer_apellido.toLowerCase()}_${p.fecha_nacimiento}`;
        if (!vistos.has(clave)) {
          vistos.set(clave, []);
        }
        vistos.get(clave)?.push(p);
      });

      // Retornar grupos con más de 1 paciente
      vistos.forEach((grupo, clave) => {
        if (grupo.length > 1) {
          duplicados.push({
            clave,
            pacientes: grupo,
            cantidad: grupo.length,
          });
        }
      });

      return duplicados;
    },
  });

  // Obtener historial centralizado de un paciente
  const { data: historiaCentralizada = null, isLoading: loadingHistoria } = useQuery({
    queryKey: ['mpi_historia_centralizada'],
    queryFn: async () => {
      const { data: pacientes, error: errorPacientes } = await supabase
        .from('hosix_pacientes')
        .select('*')
        .eq('activo', true);

      if (errorPacientes) {
        console.error('Error fetching patients:', errorPacientes);
        return null;
      }

      const { data: historia, error: errorHistoria } = await supabase
        .from('hosix_historia_clinica')
        .select('*')
        .order('fecha_entrada', { ascending: false });

      if (errorHistoria) {
        console.error('Error fetching history:', errorHistoria);
        return null;
      }

      return {
        totalPacientes: pacientes?.length || 0,
        totalEntradas: historia?.length || 0,
        pacientesActivos: pacientes?.filter(p => p.activo).length || 0,
      };
    },
  });

  // Fusionar historias clínicas
  const fusionarHistorias = useMutation({
    mutationFn: async ({
      pacienteOriginal,
      pacienteDuplicado,
    }: {
      pacienteOriginal: string;
      pacienteDuplicado: string;
    }) => {
      try {
        // 1. Copiar todas las entradas de historia del duplicado al original
        const { data: historias, error: errorHistoria } = await supabase
          .from('hosix_historia_clinica')
          .select('*')
          .eq('paciente_id', pacienteDuplicado);

        if (errorHistoria) throw errorHistoria;

        if (historias && historias.length > 0) {
          const historiasParaActualizar = historias.map(h => ({
            ...h,
            paciente_id: pacienteOriginal,
          }));

          const { error: updateError } = await supabase
            .from('hosix_historia_clinica')
            .upsert(historiasParaActualizar);

          if (updateError) throw updateError;
        }

        // 2. Desactivar paciente duplicado
        const { error: deactivateError } = await supabase
          .from('hosix_pacientes')
          .update({ activo: false })
          .eq('id', pacienteDuplicado);

        if (deactivateError) throw deactivateError;

        return {
          success: true,
          mensaje: 'Historias fusionadas correctamente',
        };
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mpi_duplicados'] });
      toast({
        title: 'Éxito',
        description: 'Historias fusionadas correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    generarPPI,
    posiblesDuplicados,
    loadingDuplicados,
    historiaCentralizada,
    loadingHistoria,
    fusionarHistorias,
  };
};
