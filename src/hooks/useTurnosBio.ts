import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

export interface TurnoBio {
  id: string;
  nombre_turno: string;
  hora_inicio: string; // HH:MM:SS
  hora_fin: string; // HH:MM:SS
  tolerancia_minutos: number;
  tipo: 'diurno' | 'nocturno' | 'festivo';
  centro_salud_id?: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export function useTurnosBio(centroId?: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = ['turnos-bio', centroId];

  // 1. QUERY para obtener la lista de turnos (usada en HorariosBasePanel)
  const turnosQuery = useQuery<TurnoBio[]>({
    queryKey: queryKey,
    queryFn: async () => {
      let qb = supabase.from('turnos_biometricos').select('*').order('nombre_turno');
      if (centroId) qb = qb.eq('centro_salud_id', centroId);
      const { data, error } = await qb;
      if (error) throw error;
      return data || [];
    },
    enabled: Boolean(centroId),
    staleTime: 5 * 60 * 1000, // 5 minutos de caché
  });

  // 2. MUTATION para crear un nuevo turno (usada en el modal de HorariosBasePanel)
  const createMutation = useMutation({
    mutationFn: async (payload: Partial<TurnoBio>) => {
      const { data, error } = await supabase.from('turnos_biometricos').insert({
        nombre_turno: payload.nombre_turno,
        hora_inicio: payload.hora_inicio,
        hora_fin: payload.hora_fin,
        tolerancia_minutos: payload.tolerancia_minutos ?? 0,
        tipo: payload.tipo || 'diurno',
        centro_salud_id: payload.centro_salud_id || null,
        activo: payload.activo ?? true,
      }).select().single();
      if (error) throw error;
      return data as TurnoBio;
    },
    onSuccess: (newTurno) => {
      // Invalida la caché para forzar la recarga de la lista de turnos
      queryClient.invalidateQueries({ queryKey: queryKey });
      toast({ title: 'Turno creado', description: newTurno.nombre_turno });
    },
    onError: (error) => {
      toast({ title: 'Error al crear turno', description: error.message, variant: 'destructive' });
    }
  });

  // Funciones de utilidad (se mantienen igual para import/export)

  // Export a Turno.xls-like TSV using known columns order (adjust mapping as needed)
  const exportTurnosXls = (turnos: TurnoBio[]) => {
    // Columns example: TNo\tName\tStart\tEnd\tType\tTolerance
    const headers = ['TNo', 'Name', 'Start', 'End', 'Type', 'Tolerance'];
    const rows = turnos.map((t, idx) => [
      String(idx + 1),
      t.nombre_turno,
      t.hora_inicio.slice(0, 5),
      t.hora_fin.slice(0, 5),
      t.tipo,
      String(t.tolerancia_minutos)
    ]);
    const lines = [headers, ...rows].map(r => r.join('\t')).join('\r\n');
    const blob = new Blob([lines], { type: 'application/vnd.ms-excel' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Turno.xls';
    a.click();
  };

  // Import Turno.xls-like TSV
  const importTurnosXls = async (file: File, centerId?: string | null) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (!lines.length) return 0;
    const header = lines[0].split(/\t|,/).map(s => s.trim());
    const idx = {
      name: header.findIndex(h => /name/i.test(h)),
      start: header.findIndex(h => /start|inicio/i.test(h)),
      end: header.findIndex(h => /end|fin/i.test(h)),
      type: header.findIndex(h => /type|tipo/i.test(h)),
      tol: header.findIndex(h => /toler|tol/i.test(h)),
    };
    let created = 0;
    for (const line of lines.slice(1)) {
      const parts = line.split(/\t|,/).map(s => s.trim());
      const nombre_turno = parts[idx.name] || '';
      if (!nombre_turno) continue;
      const hora_inicio = ((parts[idx.start] || '08:00') + ':00').slice(0, 8);
      const hora_fin = ((parts[idx.end] || '16:00') + ':00').slice(0, 8);
      const tipo = (parts[idx.type] || 'diurno').toLowerCase() as any;
      const tolerancia_minutos = parseInt(parts[idx.tol] || '0', 10);

      // Usamos directamente la función de mutación (asumiendo que tiene un método create interno)
      // O ajustamos a un create directo si no queremos usar el hook de mutación aquí (simplificando):
      await createMutation.mutateAsync({
        nombre_turno,
        hora_inicio,
        hora_fin,
        tipo,
        tolerancia_minutos,
        centro_salud_id: centroId || undefined
      });
      created++;
    }
    return created;
  };

  return {
    turnosQuery,
    createMutation,
    exportTurnosXls,
    importTurnosXls,
    // No devolvemos list, create, update, remove del hook anterior, solo las versiones con TanStack Query
  };
}