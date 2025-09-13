import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface CuadranteBio {
  id: string;
  id_profesional: string;
  turno_id: string;
  fecha: string; // YYYY-MM-DD
  centro_salud_id?: string | null;
  created_at: string;
  updated_at: string;
}

export function useCuadrantesBio() {
  const { toast } = useToast();

  const list = async (centerId: string | null, from: string, to: string): Promise<CuadranteBio[]> => {
    let qb = supabase.from('cuadrantes_biometricos').select('*').gte('fecha', from).lte('fecha', to).order('fecha');
    if (centerId) qb = qb.eq('centro_salud_id', centerId);
    const { data, error } = await qb;
    if (error) throw error;
    return data || [];
  };

  const assign = async (rows: Array<Omit<CuadranteBio, 'id' | 'created_at' | 'updated_at'>>): Promise<number> => {
    const { error } = await supabase.from('cuadrantes_biometricos').upsert(rows, { onConflict: 'id_profesional,fecha' });
    if (error) throw error;
    toast({ title: 'Cuadrante actualizado', description: `${rows.length} asignaciones` });
    return rows.length;
  };

  // Export Personal.xls-like TSV: use profesionales_sanitarios
  const exportPersonalXls = async (centerId?: string | null) => {
    let qb = supabase.from('profesionales_sanitarios').select('id, id_profesional_unico, nombre_completo, centro_salud_id, especialidad, genero, telefono, email, estado_solicitud');
    if (centerId) qb = qb.eq('centro_salud_id', centerId);
    const { data, error } = await qb;
    if (error) throw error;
    const headers = ['EmpNo','Name','Gender','Phone','Email','Department','Active'];
    const rows = (data || []).map((p, idx) => [
      p.id_profesional_unico || '',
      p.nombre_completo || '',
      p.genero || '',
      p.telefono || '',
      p.email || '',
      p.especialidad || '',
      p.estado_solicitud === 'Aprobado' ? '1' : '0'
    ]);
    const tsv = [headers, ...rows].map(r => r.join('\t')).join('\r\n');
    const blob = new Blob([tsv], { type: 'application/vnd.ms-excel' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Personal.xls';
    a.click();
  };

  // Export Cuadrantes.xls-like TSV from cuadrantes + turnos
  const exportCuadrantesXls = async (centerId: string | null, from: string, to: string) => {
    const { data: cuad, error: e1 } = await supabase.from('cuadrantes_biometricos').select('id_profesional, turno_id, fecha').gte('fecha', from).lte('fecha', to).order('fecha');
    if (e1) throw e1;
    const { data: turnos, error: e2 } = await supabase.from('turnos_biometricos').select('id, nombre_turno, hora_inicio, hora_fin');
    if (e2) throw e2;
    const turnoMap = new Map(turnos?.map(t => [t.id, t] as const));

    const headers = ['EmpNo','Date','ShiftName','Start','End'];
    const rows = (cuad || []).map(c => {
      const t = turnoMap.get(c.turno_id);
      return [c.id_profesional, c.fecha, t?.nombre_turno || '', (t?.hora_inicio || '').slice(0,5), (t?.hora_fin || '').slice(0,5)];
    });
    const tsv = [headers, ...rows].map(r => r.join('\t')).join('\r\n');
    const blob = new Blob([tsv], { type: 'application/vnd.ms-excel' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Cuadrantes.xls';
    a.click();
  };

  return { list, assign, exportPersonalXls, exportCuadrantesXls };
}
