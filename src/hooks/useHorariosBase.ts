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

// --- HOOK ---

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
   * Guarda (crea o actualiza) una regla de horario base.
   */
  const save = async (payload: HorarioBasePayload, existingId?: string) => {
    let qb = supabase.from('horarios_base_profesional');

    if (existingId) {
      // Actualización: si se proporciona un ID existente
      qb = qb.update(payload).eq('id', existingId).select().single();
    } else {
      // Creación: nuevo registro
      qb = qb.insert(payload).select().single();
    }

    const { data, error } = await qb;

    if (error) {
      if (error.code === '23505') { // Código de violación de unicidad (si se solapa una regla)
        toast({
          title: 'Error de Solapamiento',
          description: 'Ya existe una regla de horario que se solapa con el profesional y el día seleccionados en ese período de vigencia.',
          variant: 'destructive'
        });
        throw new Error('Regla solapada: Ya existe una regla activa para ese día.');
      }
      console.error("Error guardando horario base:", error);
      throw error;
    }

    toast({ title: 'Horario Base guardado', description: `Regla guardada para el día ${payload.dia_semana}` });
    return data as HorarioBase;
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