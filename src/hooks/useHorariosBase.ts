import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// --- INTERFACES DEL MODELO BASE ---

/**
 * Payload para insertar o actualizar una regla de Horario Base.
 */
export interface HorarioBasePayload {
  id_profesional: string;
  turno_id: string; // FK a la tabla turnos_biometricos
  centro_salud_id: string;
  dia_semana: number; // 1=Lunes, 7=Domingo
  vigencia_desde: string; // Formato 'YYYY-MM-DD'
  vigencia_hasta: string | null; // Formato 'YYYY-MM-DD' o null para indefinido
}

/**
 * Estructura completa de una regla de Horario Base.
 */
export interface HorarioBase extends HorarioBasePayload {
  id: string;
  created_at: string;
  updated_at: string;
}

// --- HOOK CORREGIDO ---

export function useHorariosBase() {
  const { toast } = useToast();

  /**
   * Lista todas las reglas de horario base para un profesional dado.
   */
  const listByProfessional = async (professionalId: string): Promise<HorarioBase[]> => {
    if (!professionalId) return [];

    const { data, error } = await supabase
      .from('horarios_base_profesional')
      .select('*')
      .eq('id_profesional', professionalId)
      // Ordena por día de la semana y vigencia (para mostrar las reglas activas primero)
      .order('dia_semana')
      .order('vigencia_desde', { ascending: false });

    if (error) {
      console.error("Error listando horarios base:", error);
      throw error;
    }
    return data || [];
  };

  /**
   * Guarda (crea) una o múltiples reglas de horario base.
   * Acepta un array de payloads para inserción masiva.
   *
   * @param payloads Array de HorarioBasePayload.
   */
  const save = async (payloads: HorarioBasePayload[]) => {
    if (!payloads || payloads.length === 0) return [];

    // Se utiliza insert para la inserción masiva.
    const { data, error } = await supabase
      .from('horarios_base_profesional')
      .insert(payloads)
      // Usamos .select() para obtener los IDs de los registros insertados
      .select();

    if (error) {
      if (error.code === '23505') { // Código de violación de unicidad/exclusión
        toast({
          title: 'Error de Solapamiento/Duplicidad',
          description: `Una o más de las ${payloads.length} reglas intentadas se solapa con reglas existentes para el mismo profesional y día.`,
          variant: 'destructive'
        });
        // Lanzar error para que la mutación de React Query lo maneje
        throw new Error('Solapamiento de reglas detectado. Revise las vigencias.');
      }
      console.error("Error guardando horario base:", error);
      throw error;
    }

    const uniqueProfessionals = new Set(payloads.map(p => p.id_profesional)).size;

    toast({
      title: 'Reglas de Horario Base guardadas',
      description: `${payloads.length} reglas asignadas a ${uniqueProfessionals} profesional(es).`
    });

    return data as HorarioBase[];
  };

  /**
   * Elimina una regla de horario base.
   */
  const remove = async (id: string) => {
    const { error } = await supabase.from('horarios_base_profesional').delete().eq('id', id);

    if (error) {
      console.error("Error eliminando horario base:", error);
      throw error;
    }

    toast({ title: 'Regla de horario eliminada' });
  };

  return { listByProfessional, save, remove };
}