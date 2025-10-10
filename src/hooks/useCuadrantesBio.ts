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
  const toast = useToast();

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

  // Export Personal.xls-like TSV
  // Se ha modificado la firma para aceptar from/to para filtrar por asignación
  const exportPersonalXls = async (centerId?: string | null, from?: string, to?: string) => {
    if (!centerId) {
      toast.toast({ title: 'Error de exportación', description: 'Debe seleccionar un centro de salud para la exportación.', variant: 'destructive' });
      return;
    }

    // 1. Obtener los IDs de profesionales con cuadrante asignado en el rango [from, to] y en el centro.
    let profIdsToExport: string[] = [];
    if (from && to) {
      let qbCuadrantes = supabase.from('cuadrantes_biometricos')
        .select('id_profesional')
        .eq('centro_salud_id', centerId)
        .gte('fecha', from)
        .lte('fecha', to);

      const { data: cuadData, error: cuadError } = await qbCuadrantes;
      if (cuadError) throw cuadError;

      // Filtrar IDs únicos
      profIdsToExport = Array.from(new Set((cuadData || []).map((c: any) => c.id_profesional)));

      if (profIdsToExport.length === 0) {
        toast.toast({ title: 'Exportación cancelada', description: 'No se encontraron profesionales con cuadrantes asignados en el rango de fechas seleccionado.', variant: 'destructive' });
        return;
      }
    } else {
      // Si no hay rango de fechas, se asume que se quiere exportar TODO el personal aprobado del centro.
      // Se omite el filtro por cuadrante.
    }

    // 2. Obtener la información completa de los profesionales (filtrando por IDs si se usó el filtro de cuadrantes)
    let qb = supabase.from('profesionales_sanitarios')
      .select('id, id_profesional_unico, nombre_completo, centro_salud_id, especialidad, area_profesional, nombre_centro, genero, telefono, email, estado_solicitud, numero_tarjeta_rfid')
      .eq('centro_salud_id', centerId)
      .eq('estado_solicitud', 'Aprobado'); // Sólo personal aprobado

    if (profIdsToExport.length > 0) {
      qb = qb.in('id', profIdsToExport);
    }

    const { data, error } = await qb.order('nombre_completo');
    if (error) throw error;

    const profs = (data || []);

    if (profs.length === 0) {
      toast.toast({ title: 'Exportación cancelada', description: 'No se encontraron profesionales aprobados en el centro seleccionado.', variant: 'destructive' });
      return;
    }

    // ------------------------------------------------------------------------------------------------
    // ESTRUCTURA FINAL DE EXPORTACIÓN (16 columnas con encabezados exactos)
    // ------------------------------------------------------------------------------------------------

    const headers = [
      'ID', 'Nombre', 'Depto.', 'Turno', 'Admin.', 'Registro de Huella',
      'Rostro', 'Registrar Contraseña', 'ID o Tarjeta', 'Bloqueo de zona horaria',
      'Grupo', 'Modo Verificar', 'Cumpleaños', 'Inicio:', 'Fin:', 'Perfil'
    ];

    const rows = profs
      // Filtrar una última vez por si el EnNo no se generó por algún error de trigger
      .filter((p: any) => p.id_profesional_unico)
      .map((p: any) => {
        // 1. ID (EmpNo): Usa el campo auto-generado (máx 8 dígitos)
        const enNo = String(p.id_profesional_unico || '').replace(/^0+/, '').slice(0, 8); // Quitar ceros a la izquierda y asegurar máx 8

        // 2. Nombre: Asegurar valor para evitar errores de importación
        const nombre = p.nombre_completo || 'Sin Nombre';

        // 3. Depto.: Usar el nombre del centro para el departamento
        const depto = p.nombre_centro || p.area_profesional || 'General';

        // 4. Turno: Se usa '1' como turno por defecto
        const turnoNumber = '1';

        // 9. ID o Tarjeta: Limpiar y limitar a 10 dígitos (según nota)
        const cardNo = typeof p.numero_tarjeta_rfid === 'string'
          ? p.numero_tarjeta_rfid.replace(/\D/g, '').slice(0, 10)
          : '0';

        // 14/15. Inicio:/Fin:: Fechas de validez (formato aaaa-mm-dd)
        const fechaInicio = '2024-01-01';
        const fechaFin = '2099-12-31';

        return [
          enNo,             // 1. ID (EmpNo, 8 digitos max)
          nombre,           // 2. Nombre
          depto,            // 3. Depto.
          turnoNumber,      // 4. Turno (Default '1')
          '0',              // 5. Admin. (0 = Usuario)
          '0',              // 6. Registro de Huella
          '1',              // 7. Rostro
          '0',              // 8. Registrar Contraseña
          cardNo,           // 9. ID o Tarjeta (RFID)
          '0',              // 10. Bloqueo de zona horaria
          '0',              // 11. Grupo
          '0',              // 12. Modo Verificar
          '',               // 13. Cumpleaños
          fechaInicio,      // 14. Inicio:
          fechaFin,         // 15. Fin:
          ''                // 16. Perfil
        ];
      });

    // Usamos tabulación (\t) y \r\n (compatibilidad DOS/MS Excel)
    const tsv = [headers, ...rows].map(r => r.join('\t')).join('\r\n');

    // Creación y descarga del Blob
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