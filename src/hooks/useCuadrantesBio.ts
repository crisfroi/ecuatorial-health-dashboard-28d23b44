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
    return rows.length;
  };

  // Export Personal.xls-like TSV: use profesionales_sanitarios
  const exportPersonalXls = async (centerId?: string | null, ids?: string[], fecha?: string) => {
    let qb = supabase.from('profesionales_sanitarios').select('id, id_profesional_unico, nombre_completo, centro_salud_id, especialidad, area_profesional, nombre_centro, genero, telefono, email, estado_solicitud, numero_tarjeta_rfid');
    if (ids && ids.length) qb = qb.in('id', ids);
    else if (centerId) qb = qb.eq('centro_salud_id', centerId);
    const { data, error } = await qb.order('nombre_completo');
    if (error) throw error;

    const profs = (data || []);

    // ------------------------------------------------------------------------------------------------
    // CORRECCIÓN CRÍTICA: La exportación debe tener 16 columnas con los encabezados exactos del Personal.xls
    // ------------------------------------------------------------------------------------------------

    const headers = [
      'ID', 'Nombre', 'Depto.', 'Turno', 'Admin.', 'Registro de Huella',
      'Rostro', 'Registrar Contraseña', 'ID o Tarjeta', 'Bloqueo de zona horaria',
      'Grupo', 'Modo Verificar', 'Cumpleaños', 'Inicio:', 'Fin:', 'Perfil'
    ];

    const rows = profs.map((p: any) => {
      // 1. ID (EmpNo): Número de Enrolamiento (CRÍTICO)
      const enNo = p.id_profesional_unico || '';

      // 2. Nombre: Asegurar valor por defecto para evitar errores (CRÍTICO)
      const nombre = p.nombre_completo || 'Sin Nombre';

      // 3. Depto.: Asegurar valor por defecto (CRÍTICO)
      const depto = p.nombre_centro || p.area_profesional || 'General';

      // 4. Turno: El archivo Personal.xls espera un número de turno por defecto (0-8). Usamos '1' como valor base.
      const turnoNumber = '1';

      // 9. ID o Tarjeta: Limpiar el RFID y limitar a 10 dígitos (CRÍTICO)
      const cardNo = typeof p.numero_tarjeta_rfid === 'string'
        ? p.numero_tarjeta_rfid.replace(/\D/g, '').slice(0, 10)
        : '0';

      // 14/15. Inicio:/Fin:: Fechas de validez.
      const fechaInicio = '2024-01-01'; // Default: siempre activo
      const fechaFin = '2099-12-31';   // Default: siempre activo

      return [
        enNo,             // 1. ID
        nombre,           // 2. Nombre
        depto,            // 3. Depto.
        turnoNumber,      // 4. Turno (Default '1')
        '0',              // 5. Admin. (0 = Usuario)
        '0',              // 6. Registro de Huella (0 = No)
        '1',              // 7. Rostro (1 = Sí, como en el archivo de muestra)
        '0',              // 8. Registrar Contraseña (0 = No)
        cardNo,           // 9. ID o Tarjeta (RFID)
        '0',              // 10. Bloqueo de zona horaria (0)
        '0',              // 11. Grupo (0)
        '0',              // 12. Modo Verificar (0)
        '',               // 13. Cumpleaños (MM-DD)
        fechaInicio,      // 14. Inicio:
        fechaFin,         // 15. Fin:
        ''                // 16. Perfil
      ];
    });

    // Usamos tabulación (\t) como delimitador, y \r\n para forzar la compatibilidad de línea (MSDOS)
    const tsv = [headers, ...rows].map(r => r.join('\t')).join('\r\n');
    const blob = new Blob([tsv], { type: 'application/vnd.ms-excel' });
    const a = document.createElement('a');
    const href = URL.createObjectURL(blob);
    a.href = href;
    a.download = 'Personal.xls';
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 0);
    a.remove();
  };

  // Export Cuadrantes.xls-like TSV from cuadrantes + turnos
  const exportCuadrantesXls = async (centerId: string | null, from: string, to: string) => {
    const { data: cuad, error: e1 } = await supabase.from('cuadrantes_biometricos').select('id_profesional, turno_id, fecha').gte('fecha', from).lte('fecha', to).order('fecha');
    if (e1) throw e1;
    const { data: turnos, error: e2 } = await supabase.from('turnos_biometricos').select('id, nombre_turno, hora_inicio, hora_fin');
    if (e2) throw e2;
    const turnoMap = new Map(turnos?.map(t => [t.id, t] as const));

    // Se mantiene el formato original de 5 columnas para Cuadrantes.xls
    const headers = ['EmpNo', 'Date', 'ShiftName', 'Start', 'End'];
    const rows = (cuad || []).map(c => {
      const t = turnoMap.get(c.turno_id);
      return [c.id_profesional, c.fecha, t?.nombre_turno || '', (t?.hora_inicio || '').slice(0, 5), (t?.hora_fin || '').slice(0, 5)];
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