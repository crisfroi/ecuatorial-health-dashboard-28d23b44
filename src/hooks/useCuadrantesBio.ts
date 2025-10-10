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

  // CORRECCIÓN: 'triggerToast' es la función que se llama para mostrar mensajes.
  const exportPersonalXls = async (centerId: string | null, from: string, to: string, triggerToast: any) => {

    // 1. VALIDACIÓN DE ENTRADA
    if (!centerId) {
      triggerToast({ title: 'Error de exportación', description: 'Debe seleccionar un centro de salud para la exportación.', variant: 'destructive' });
      return;
    }
    if (!from || !to || from.length !== 10 || to.length !== 10) {
      triggerToast({ title: 'Error de exportación', description: 'Debe seleccionar un rango de fechas válido (YYYY-MM-DD).', variant: 'destructive' });
      return;
    }

    // 2. OBTENER IDs de profesionales CON cuadrante
    let cuadData;
    try {
      const qbCuadrantes = supabase.from('cuadrantes_biometricos')
        .select('id_profesional')
        .eq('centro_salud_id', centerId)
        .gte('fecha', from)
        .lte('fecha', to);

      const { data, error } = await qbCuadrantes;
      if (error) throw error;
      cuadData = data;
    } catch (e: any) {
      triggerToast({ title: 'Error en la consulta de cuadrantes', description: e.message || 'Error desconocido al obtener cuadrantes.', variant: 'destructive' });
      return;
    }

    const profIdsToExport = Array.from(new Set((cuadData || []).map((c: any) => c.id_profesional))).filter(Boolean);

    if (profIdsToExport.length === 0) {
      triggerToast({ title: 'Exportación cancelada', description: 'No se encontraron profesionales con cuadrantes asignados en el rango de fechas seleccionado.', variant: 'destructive' });
      return;
    }

    // 3. OBTENER la información de los profesionales
    let profs;
    try {
      let qb = supabase.from('profesionales_sanitarios')
        .select('id, numero_enrolamiento_enno, nombre_completo, centro_salud_id, especialidad, area_profesional, nombre_centro, genero, telefono, email, estado_solicitud, numero_tarjeta_rfid')
        .eq('centro_salud_id', centerId)
        .eq('estado_solicitud', 'Aprobado')
        .in('id', profIdsToExport);

      const { data, error } = await qb.order('nombre_completo');
      if (error) throw error;
      profs = data || [];
    } catch (e: any) {
      triggerToast({ title: 'Error en la consulta de profesionales', description: e.message || 'Error desconocido al obtener profesionales.', variant: 'destructive' });
      return;
    }

    // 4. CONSTRUIR el TSV (16 columnas)
    const headers = [
      'ID', 'Nombre', 'Depto.', 'Turno', 'Admin.', 'Registro de Huella',
      'Rostro', 'Registrar Contraseña', 'ID o Tarjeta', 'Bloqueo de zona horaria',
      'Grupo', 'Modo Verificar', 'Cumpleaños', 'Inicio:', 'Fin:', 'Perfil'
    ];

    const rows = profs
      .filter((p: any) => p.numero_enrolamiento_enno !== null)
      .map((p: any) => {
        const enNo = String(p.numero_enrolamiento_enno).slice(0, 8);
        const nombre = p.nombre_completo || 'Sin Nombre';
        const depto = p.nombre_centro || p.area_profesional || 'General';
        const turnoNumber = '1';
        const cardNo = typeof p.numero_tarjeta_rfid === 'string'
          ? p.numero_tarjeta_rfid.replace(/\D/g, '').slice(0, 10)
          : '0';
        const fechaInicio = '2024-01-01';
        const fechaFin = '2099-12-31';

        return [
          enNo, nombre, depto, turnoNumber, '0', '0', '1', '0', cardNo, '0', '0', '0', '', fechaInicio, fechaFin, ''
        ];
      });

    // 5. VERIFICACIÓN DE FILAS FINALES
    if (rows.length === 0 && profIdsToExport.length > 0) {
      triggerToast({ title: 'Exportación vacía', description: 'Se encontraron cuadrantes, pero los profesionales asociados no tienen número de enrolamiento (EnNo) asignado.', variant: 'destructive' });
      return;
    }

    // 6. DESCARGA
    const tsv = [headers, ...rows].map(r => r.join('\t')).join('\r\n');
    const blob = new Blob([tsv], { type: 'application/vnd.ms-excel' });
    const a = document.createElement('a');
    const href = URL.createObjectURL(blob);
    a.href = href;
    a.download = 'Personal.xls';
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 0);
    a.remove();

    triggerToast({ title: 'Exportación completada', description: `Se exportaron ${rows.length} profesionales.`, variant: 'success' });
  };

  // Función exportCuadrantesXls (Corregida la sintaxis al final)
  const exportCuadrantesXls = async (centerId: string | null, from: string, to: string) => {
    const { data: cuad, error: e1 } = await supabase.from('cuadrantes_biometricos').select('id_profesional, turno_id, fecha').gte('fecha', from).lte('fecha', to).order('fecha');
    if (e1) throw e1;
    const { data: turnos, error: e2 } = await supabase.from('turnos_biometricos').select('id, nombre_turno, hora_inicio, hora_fin');
    if (e2) throw e2;
    const turnoMap = new Map(turnos?.map(t => [t.id, t] as const));

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