import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProfesionalExportable {
  id: string;
  nombre_completo: string;
  enroll_id: number | null;
  area_profesional: string | null;
  tiene_turno: boolean;
  turno_nombre?: string;
  centro_salud_id: string | null;
}

export interface DispositivoActivo {
  id: string;
  nombre: string;
  device_sn: string;
  centro_salud_id: string;
  activo: boolean;
}

/**
 * Hook para exportar empleados desde Supabase a dispositivos biométricos vía WebSocket.
 * Implementa flujo: Dashboard → Edge Function → Render → Dispositivo
 */
export function useExportarEmpleados(centroId?: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ============================================
  // QUERY: Profesionales exportables del centro
  // ============================================
  const profesionalesQuery = useQuery<ProfesionalExportable[], Error>({
    queryKey: ['profesionales-exportables', centroId],
    queryFn: async () => {
      if (!centroId) return [];

      // Obtener profesionales con ENNO del centro
      const { data: mapeoData, error: mapeoError } = await supabase
        .from('empleado_dispositivo_map')
        .select(`
          enroll_id,
          profesional_id,
          profesionales_sanitarios!inner(
            id,
            nombre_completo,
            area_profesional,
            centro_salud_id
          )
        `)
        .eq('profesionales_sanitarios.centro_salud_id', centroId)
        .not('enroll_id', 'is', null);

      if (mapeoError) throw mapeoError;

      // Obtener turnos asignados
      const profesionalIds = mapeoData?.map((m: any) => m.profesional_id) || [];
      
      let turnosData: any[] = [];
      if (profesionalIds.length > 0) {
        const { data, error } = await supabase
          .from('horarios_base_profesional')
          .select(`
            profesional_id,
            turno:turno_id(nombre_turno)
          `)
          .in('profesional_id', profesionalIds);

        if (!error) turnosData = data || [];
      }

      // Mapear a estructura final
      const result: ProfesionalExportable[] = (mapeoData || []).map((item: any) => {
        const prof = item.profesionales_sanitarios;
        const turnoAsignado = turnosData.find((t: any) => t.profesional_id === item.profesional_id);
        
        return {
          id: prof.id,
          nombre_completo: prof.nombre_completo,
          enroll_id: item.enroll_id,
          area_profesional: prof.area_profesional,
          centro_salud_id: prof.centro_salud_id,
          tiene_turno: !!turnoAsignado,
          turno_nombre: turnoAsignado?.turno?.nombre_turno || undefined,
        };
      });

      return result;
    },
    enabled: !!centroId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // ============================================
  // QUERY: Dispositivos activos del centro
  // ============================================
  const dispositivosQuery = useQuery<DispositivoActivo[], Error>({
    queryKey: ['dispositivos-activos-centro', centroId],
    queryFn: async () => {
      if (!centroId) return [];

      const { data, error } = await supabase
        .from('dispositivos')
        .select('id, nombre, device_sn, centro_salud_id, activo')
        .eq('centro_salud_id', centroId)
        .eq('activo', true)
        .not('device_sn', 'is', null);

      if (error) throw error;
      return (data || []) as DispositivoActivo[];
    },
    enabled: !!centroId,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });

  // ============================================
  // MUTATION: Exportar empleados a dispositivos
  // ============================================
  const exportMutation = useMutation<
    { success: boolean; message: string; comandos_enviados: number },
    Error,
    {
      profesional_ids: string[];
      device_sns?: string[];
      solo_con_turno?: boolean;
    }
  >({
    mutationFn: async (payload) => {
      // Validación previa: verificar que hay profesionales y dispositivos
      if (payload.profesional_ids.length === 0) {
        throw new Error('Debe seleccionar al menos un profesional');
      }

      const dispositivos = dispositivosQuery.data || [];
      const dispositivosTarget = payload.device_sns
        ? dispositivos.filter((d) => payload.device_sns!.includes(d.device_sn))
        : dispositivos;

      if (dispositivosTarget.length === 0) {
        throw new Error('No hay dispositivos activos en el centro');
      }

      // Llamar Edge Function
      const { data, error } = await supabase.functions.invoke('export-employees-to-device', {
        body: {
          profesional_ids: payload.profesional_ids,
          centro_salud_id: centroId,
          device_sns: payload.device_sns || dispositivosTarget.map((d) => d.device_sn),
          solo_con_turno: payload.solo_con_turno ?? false,
        },
      });

      if (error) throw error;
      return data as { success: boolean; message: string; comandos_enviados: number };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['profesionales-exportables'] });
      toast({
        title: 'Exportación iniciada',
        description: `${result.comandos_enviados} comandos enviados a dispositivos. Los empleados se sincronizarán en breve.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error al exportar empleados',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // ============================================
  // UTILIDAD: Validar si profesional es exportable
  // ============================================
  const validarExportable = (profesional: ProfesionalExportable): {
    exportable: boolean;
    razon?: string;
  } => {
    if (!profesional.enroll_id) {
      return { exportable: false, razon: 'Sin ENNO asignado' };
    }

    // Opcional: validar turno
    // if (!profesional.tiene_turno) {
    //   return { exportable: false, razon: 'Sin turno asignado' };
    // }

    return { exportable: true };
  };

  return {
    profesionalesQuery,
    dispositivosQuery,
    exportMutation,
    validarExportable,
  };
}
