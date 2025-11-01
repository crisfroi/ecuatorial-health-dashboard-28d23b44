import { useAsistencia, type AttendanceLog, type ConsolidatedDayEntry } from '@/hooks/useAsistencia';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';

export interface ReportFilters {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  centerId?: string | null;
  deviceId?: string | null;
  professionalId?: string | null;
}

interface DeviceMeta {
  id: string;
  nombre: string | null;
  centro_salud_id: string | null;
}

interface ProfessionalMeta {
  id: string;
  nombre_completo: string | null;
  centro_salud_id: string | null;
  nombre_centro: string | null;
  id_profesional_unico: string | null;
}

interface CenterMeta {
  id: string;
  nombre: string | null;
}

export interface AttendanceLogWithMeta extends AttendanceLog {
  deviceName?: string | null;
  centerId?: string | null;
  centerName?: string | null;
  professionalName?: string | null;
  empNo?: string | null;
}

export interface EnrichedDayEntry extends ConsolidatedDayEntry {
  centerId?: string | null;
  centerName?: string | null;
  professionalName?: string | null;
  deviceNames?: string[];
  empNo?: string | null;
}

export interface WeeklySummary {
  weekKey: string;
  label: string;
  dias: number;
  horas: number;
}

export interface MonthlySummary {
  monthKey: string;
  label: string;
  dias: number;
  horas: number;
}

export interface ProfessionalSummary {
  professionalId: string;
  professionalName: string;
  empNo?: string | null;
  dias: number;
  horas: number;
}

export interface CenterSummary {
  centerId: string | null;
  centerName: string;
  dias: number;
  horas: number;
}

const toEndOfDayIso = (date: string) => {
  const iso = new Date(`${date}T23:59:59`).toISOString();
  return iso;
};

const toStartOfDayIso = (date: string) => new Date(`${date}T00:00:00`).toISOString();

export function useReportesAsistencia() {
  const { fetchLogsByRange, consolidateDaily, generateAttendanceStats } = useAsistencia();

  const fetchLogsWithMeta = async (filters: ReportFilters): Promise<AttendanceLogWithMeta[]> => {
    const fromISO = toStartOfDayIso(filters.from);
    const toISO = toEndOfDayIso(filters.to);

    const logs = await fetchLogsByRange(fromISO, toISO, {
      deviceId: filters.deviceId || null,
    });

    if (!logs.length) return [];

    const deviceIds = Array.from(new Set(logs.map((log) => log.id_dispositivo).filter(Boolean))) as string[];
    const professionalIds = Array.from(new Set(logs.map((log) => log.id_profesional).filter(Boolean))) as string[];

    const [deviceRes, professionalRes] = await Promise.all([
      deviceIds.length
        ? supabase
            .from('dispositivos')
            .select('id, nombre, centro_salud_id')
            .in('id', deviceIds)
        : Promise.resolve({ data: [] as DeviceMeta[] }),
      professionalIds.length
        ? supabase
            .from('profesionales_sanitarios')
            .select('id, nombre_completo, centro_salud_id, nombre_centro, id_profesional_unico')
            .in('id', professionalIds)
        : Promise.resolve({ data: [] as ProfessionalMeta[] }),
    ]);

    const deviceMap = new Map<string, DeviceMeta>();
    (deviceRes.data || []).forEach((device: any) => {
      if (device?.id) {
        deviceMap.set(device.id, {
          id: device.id,
          nombre: device.nombre ?? null,
          centro_salud_id: device.centro_salud_id ?? null,
        });
      }
    });

    const professionalMap = new Map<string, ProfessionalMeta>();
    (professionalRes.data || []).forEach((professional: any) => {
      if (professional?.id) {
        professionalMap.set(professional.id, {
          id: professional.id,
          nombre_completo: professional.nombre_completo ?? null,
          centro_salud_id: professional.centro_salud_id ?? null,
          nombre_centro: professional.nombre_centro ?? null,
          id_profesional_unico: professional.id_profesional_unico ?? null,
        });
      }
    });

    const centerIds = Array.from(
      new Set(
        [
          ...(deviceRes.data || []).map((device: any) => device?.centro_salud_id).filter(Boolean),
          ...(professionalRes.data || []).map((professional: any) => professional?.centro_salud_id).filter(Boolean),
        ]
      )
    ) as string[];

    const centersMap = new Map<string, CenterMeta>();
    if (centerIds.length) {
      const { data: centersData } = await supabase
        .from('centros_salud')
        .select('id, nombre')
        .in('id', centerIds);
      (centersData || []).forEach((center: any) => {
        centersMap.set(center.id, { id: center.id, nombre: center.nombre ?? null });
      });
    }

    return logs
      .filter((log) => {
        if (filters.professionalId && log.id_profesional !== filters.professionalId) return false;
        if (filters.centerId) {
          const deviceCenter = log.id_dispositivo ? deviceMap.get(log.id_dispositivo)?.centro_salud_id : null;
          const professionalCenter = log.id_profesional ? professionalMap.get(log.id_profesional)?.centro_salud_id : null;
          if (deviceCenter === filters.centerId || professionalCenter === filters.centerId) return true;
          return false;
        }
        return true;
      })
      .map((log) => {
        const device = log.id_dispositivo ? deviceMap.get(log.id_dispositivo) : undefined;
        const professional = log.id_profesional ? professionalMap.get(log.id_profesional) : undefined;
        const centerId = device?.centro_salud_id || professional?.centro_salud_id || null;
        const centerName = (centerId && centersMap.get(centerId)?.nombre) || professional?.nombre_centro || null;
        return {
          ...log,
          deviceName: device?.nombre ?? null,
          centerId,
          centerName,
          professionalName: professional?.nombre_completo ?? null,
          empNo: professional?.id_profesional_unico ?? log.en_no ?? null,
        } as AttendanceLogWithMeta;
      });
  };

  const buildEnrichedDailyEntries = (logs: AttendanceLogWithMeta[]): EnrichedDayEntry[] => {
    const byKey = new Map<string, EnrichedDayEntry & { deviceSet: Set<string> }>();
    logs.forEach((log) => {
      const day = log.fecha_hora.slice(0, 10);
      const key = `${log.id_profesional || log.en_no || 'unknown'}_${day}`;
      const entry = byKey.get(key) || {
        id_profesional: log.id_profesional,
        en_no: log.en_no,
        fecha: day,
        entrada: undefined,
        salida: undefined,
        total_horas: undefined,
        centerId: log.centerId,
        centerName: log.centerName ?? undefined,
        professionalName: log.professionalName ?? undefined,
        empNo: log.empNo ?? undefined,
        deviceNames: [],
        deviceSet: new Set<string>(),
      };

      if (!entry.entrada || log.fecha_hora < entry.entrada) entry.entrada = log.fecha_hora;
      if (!entry.salida || log.fecha_hora > entry.salida) entry.salida = log.fecha_hora;

      if (log.inout === 'IN') {
        if (!entry.entrada || log.fecha_hora < entry.entrada) entry.entrada = log.fecha_hora;
      } else if (log.inout === 'OUT') {
        if (!entry.salida || log.fecha_hora > entry.salida) entry.salida = log.fecha_hora;
      }

      if (log.id_dispositivo) {
        entry.deviceSet.add(log.id_dispositivo);
      }

      byKey.set(key, entry);
    });

    return Array.from(byKey.values()).map((entry) => {
      const enriched: EnrichedDayEntry = {
        id_profesional: entry.id_profesional,
        en_no: entry.en_no,
        fecha: entry.fecha,
        entrada: entry.entrada,
        salida: entry.salida,
        total_horas:
          entry.entrada && entry.salida ? (new Date(entry.salida).getTime() - new Date(entry.entrada).getTime()) / 3_600_000 : undefined,
        centerId: entry.centerId,
        centerName: entry.centerName,
        professionalName: entry.professionalName,
        deviceNames: Array.from(entry.deviceSet),
        empNo: entry.empNo,
      };
      return enriched;
    });
  };

  const buildWeeklySummary = (entries: EnrichedDayEntry[]): WeeklySummary[] => {
    const grouped = new Map<string, WeeklySummary>();
    entries.forEach((entry) => {
      const date = parseISO(`${entry.fecha}T00:00:00`);
      const key = format(date, 'yyyy-ww');
      const label = format(date, "'Semana' ww '·' MMM", { awareOfUnicodeTokens: true });
      const current = grouped.get(key) || { weekKey: key, label, dias: 0, horas: 0 };
      current.dias += 1;
      current.horas += entry.total_horas || 0;
      grouped.set(key, current);
    });
    return Array.from(grouped.values()).sort((a, b) => a.weekKey.localeCompare(b.weekKey));
  };

  const buildMonthlySummary = (entries: EnrichedDayEntry[]): MonthlySummary[] => {
    const grouped = new Map<string, MonthlySummary>();
    entries.forEach((entry) => {
      const date = parseISO(`${entry.fecha}T00:00:00`);
      const key = format(date, 'yyyy-MM');
      const label = format(date, "LLLL yyyy");
      const current = grouped.get(key) || { monthKey: key, label, dias: 0, horas: 0 };
      current.dias += 1;
      current.horas += entry.total_horas || 0;
      grouped.set(key, current);
    });
    return Array.from(grouped.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  };

  const buildProfessionalSummary = (entries: EnrichedDayEntry[]): ProfessionalSummary[] => {
    const grouped = new Map<string, ProfessionalSummary>();
    entries.forEach((entry) => {
      const id = entry.id_profesional || entry.en_no || 'sin-id';
      if (!grouped.has(id)) {
        grouped.set(id, {
          professionalId: entry.id_profesional || entry.en_no || 'sin-id',
          professionalName: entry.professionalName || entry.en_no || 'Profesional',
          empNo: entry.empNo,
          dias: 0,
          horas: 0,
        });
      }
      const summary = grouped.get(id)!;
      summary.dias += 1;
      summary.horas += entry.total_horas || 0;
    });
    return Array.from(grouped.values()).sort((a, b) => b.horas - a.horas);
  };

  const buildCenterSummary = (entries: EnrichedDayEntry[]): CenterSummary[] => {
    const grouped = new Map<string | null, CenterSummary>();
    entries.forEach((entry) => {
      const key = entry.centerId || null;
      if (!grouped.has(key)) {
        grouped.set(key, {
          centerId: key,
          centerName: entry.centerName || 'Sin centro',
          dias: 0,
          horas: 0,
        });
      }
      const summary = grouped.get(key)!;
      summary.dias += 1;
      summary.horas += entry.total_horas || 0;
    });
    return Array.from(grouped.values()).sort((a, b) => b.horas - a.horas);
  };

  return {
    fetchLogsWithMeta,
    buildEnrichedDailyEntries,
    buildWeeklySummary,
    buildMonthlySummary,
    buildProfessionalSummary,
    buildCenterSummary,
    generateAttendanceStats,
    consolidateDaily,
  };
}
