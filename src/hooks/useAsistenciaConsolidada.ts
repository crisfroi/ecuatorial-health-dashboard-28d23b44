import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AsistenciaConsolidada {
  id: string;
  profesional_id: string | null;
  centro_salud_id: string | null;
  numero_enno: string;
  fecha_hora: string;
  inout: 'IN' | 'OUT' | null;
  mode: string | null;
  event: string | null;
  raw_line: string | null;
  temperature: number | null;
  image_url: string | null;
  source_type: 'biometrico' | 'manual';
  dispositivo_sn: string | null;
  created_at: string;
}

export interface FiltrosAsistencia {
  centroId?: string;
  profesionalId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  sourceType?: 'biometrico' | 'manual' | null;
  enNo?: string;
  limit?: number;
  offset?: number;
}

/**
 * Hook para obtener datos de asistencia consolidados (manual + biométrico)
 * Utiliza la vista unificada asistencia_consolidada
 *
 * @param filtros - Filtros opcionales para la búsqueda
 * @returns Query result con datos de asistencia
 */
export function useAsistenciaConsolidada(
  filtros?: FiltrosAsistencia
): UseQueryResult<AsistenciaConsolidada[], Error> {
  return useQuery<AsistenciaConsolidada[], Error>({
    queryKey: ['asistencia-consolidada', filtros],
    queryFn: async () => {
      let query = supabase
        .from('asistencia_consolidada')
        .select('*');

      // Aplicar filtros si se proporcionan
      if (filtros?.centroId) {
        query = query.eq('centro_salud_id', filtros.centroId);
      }

      if (filtros?.profesionalId) {
        query = query.eq('profesional_id', filtros.profesionalId);
      }

      if (filtros?.sourceType) {
        query = query.eq('source_type', filtros.sourceType);
      }

      if (filtros?.enNo) {
        query = query.eq('numero_enno', filtros.enNo);
      }

      // Rango de fechas
      if (filtros?.fechaDesde && filtros?.fechaHasta) {
        query = query
          .gte('fecha_hora', filtros.fechaDesde)
          .lte('fecha_hora', filtros.fechaHasta);
      } else if (filtros?.fechaDesde) {
        query = query.gte('fecha_hora', filtros.fechaDesde);
      } else if (filtros?.fechaHasta) {
        query = query.lte('fecha_hora', filtros.fechaHasta);
      }

      // Ordenar por fecha descendente (más reciente primero)
      query = query.order('fecha_hora', { ascending: false });

      // Pagination
      const limit = filtros?.limit || 100;
      const offset = filtros?.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching asistencia consolidada:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000,    // 5 minutos
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook para obtener estadísticas de asistencia por fuente
 */
export function useAsistenciaEstadisticas(
  filtros?: FiltrosAsistencia
): UseQueryResult<{
  total: number;
  biometrico: number;
  manual: number;
}, Error> {
  return useQuery({
    queryKey: ['asistencia-estadisticas', filtros],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asistencia_consolidada')
        .select('source_type', { count: 'exact' });

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        biometrico: (data?.filter((d) => d.source_type === 'biometrico') || []).length,
        manual: (data?.filter((d) => d.source_type === 'manual') || []).length,
      };

      return stats;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    retry: 2,
  });
}

/**
 * Hook para obtener asistencia diaria por profesional
 */
export function useAsistenciaDiaria(
  profesionalId: string | undefined,
  fecha?: string
): UseQueryResult<AsistenciaConsolidada[], Error> {
  const fechaHoy = fecha || new Date().toISOString().split('T')[0];
  const fechaInicio = `${fechaHoy}T00:00:00Z`;
  const fechaFin = `${fechaHoy}T23:59:59Z`;

  return useAsistenciaConsolidada({
    profesionalId,
    fechaDesde: fechaInicio,
    fechaHasta: fechaFin,
  });
}

/**
 * Hook para obtener asistencia mensual
 */
export function useAsistenciaMensual(
  centroId?: string,
  mes?: number,
  anio?: number
): UseQueryResult<AsistenciaConsolidada[], Error> {
  const ahora = new Date();
  const mesActual = mes || ahora.getMonth() + 1;
  const anioActual = anio || ahora.getFullYear();

  const fechaInicio = new Date(anioActual, mesActual - 1, 1).toISOString();
  const fechaFin = new Date(anioActual, mesActual, 0, 23, 59, 59).toISOString();

  return useAsistenciaConsolidada({
    centroId,
    fechaDesde: fechaInicio,
    fechaHasta: fechaFin,
  });
}
