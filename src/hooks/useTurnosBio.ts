import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface TurnoBio {
  id: string;
  nombre_turno: string;
  hora_inicio: string; // HH:MM:SS
  hora_fin: string; // HH:MM:SS
  tolerancia_minutos: number;
  tipo: 'diurno'|'nocturno'|'festivo';
  centro_salud_id?: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export function useTurnosBio() {
  const { toast } = useToast();

  const list = async (centroId?: string|null): Promise<TurnoBio[]> => {
    let qb = supabase.from('turnos_biometricos').select('*').order('nombre_turno');
    if (centroId) qb = qb.eq('centro_salud_id', centroId);
    const { data, error } = await qb;
    if (error) throw error;
    return data || [];
  };

  const create = async (payload: Partial<TurnoBio>) => {
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
    toast({ title: 'Turno creado', description: payload.nombre_turno });
    return data as TurnoBio;
  };

  const update = async (id: string, patch: Partial<TurnoBio>) => {
    const { data, error } = await supabase.from('turnos_biometricos').update(patch).eq('id', id).select().single();
    if (error) throw error;
    toast({ title: 'Turno actualizado' });
    return data as TurnoBio;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('turnos_biometricos').delete().eq('id', id);
    if (error) throw error;
    toast({ title: 'Turno eliminado' });
  };

  // Export a Turno.xls-like TSV using known columns order (adjust mapping as needed)
  const exportTurnosXls = (turnos: TurnoBio[]) => {
    // Columns example: TNo\tName\tStart\tEnd\tType\tTolerance
    const headers = ['TNo','Name','Start','End','Type','Tolerance'];
    const rows = turnos.map((t, idx) => [
      String(idx + 1),
      t.nombre_turno,
      t.hora_inicio.slice(0,5),
      t.hora_fin.slice(0,5),
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
      const hora_inicio = ((parts[idx.start] || '08:00') + ':00').slice(0,8);
      const hora_fin = ((parts[idx.end] || '16:00') + ':00').slice(0,8);
      const tipo = (parts[idx.type] || 'diurno').toLowerCase() as any;
      const tolerancia_minutos = parseInt(parts[idx.tol] || '0', 10);
      await create({ nombre_turno, hora_inicio, hora_fin, tipo, tolerancia_minutos, centro_salud_id: centerId || undefined });
      created++;
    }
    return created;
  };

  return { list, create, update, remove, exportTurnosXls, importTurnosXls };
}
