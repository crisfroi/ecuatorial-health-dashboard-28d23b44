import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast'; // Asumo que usas este hook para triggerToast
import { useState } from 'react'; // Necesario para un hook que usa estado, aunque no se use en tu lógica de abajo.
import * as XLSX from 'xlsx'; // Importado para consistencia, aunque se usa TSV/CSV-like

// --- INTERFACES NECESARIAS ---

export interface CuadranteBio {
  id: string;
  id_profesional: string;
  turno_id: string;
  fecha: string; // YYYY-MM-DD
  centro_salud_id?: string | null;
  created_at: string;
  updated_at: string;
}

// Interfaz Turno (necesaria para exportCuadrantesXls)
export interface TurnoBio {
  id: string;
  nombre_turno: string;
  hora_inicio: string; // HH:mm:ss
  hora_fin: string; // HH:mm:ss
  // ... otros campos de turno
}

// --- HOOK USE CUADRANTES BIO ---

export function useCuadrantesBio() {
  // Nota: Asumo que useToast y sus tipos están disponibles y se pasan como "triggerToast" en la exportación.
  // Si no quieres pasar useToast, puedes importarlo y usarlo directamente aquí.
  // Para este ejemplo, lo manejaremos con un parámetro como lo definiste, o asumiendo el uso estándar:
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
    toast({ title: 'Asignación completada', description: `${rows.length} cuadrantes asignados/actualizados.` });
    return rows.length;
  };

  const exportPersonalXls = async (centerId: string | null, from: string, to: string) => {
    // Usamos el hook 'toast' importado en lugar del parámetro 'triggerToast' para un hook más limpio.

    // 1. VALIDACIÓN DE ENTRADA
    if (!centerId) {
      toast({ title: 'Error de exportación', description: 'Debe seleccionar un centro de salud para la exportación.', variant: 'destructive' });
      return;
    }
    if (!from || !to || from.length !== 10 || to.length !== 10) {
      toast({ title: 'Error de exportación', description: 'Debe seleccionar un rango de fechas válido (YYYY-MM-DD).', variant: 'destructive' });
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
      toast({ title: 'Error en la consulta de cuadrantes', description: e.message || 'Error desconocido al obtener cuadrantes.', variant: 'destructive' });
      return;
    }

    const profIdsToExport = Array.from(new Set((cuadData || []).map((c: any) => c.id_profesional))).filter(Boolean);

    if (profIdsToExport.length === 0) {
      toast({ title: 'Exportación cancelada', description: 'No se encontraron profesionales con cuadrantes asignados en el rango de fechas seleccionado.', variant: 'destructive' });
      return;
    }

    // 3. OBTENER la información de los profesionales
    let profs;
    try {
      let qb = supabase.from('profesionales_sanitarios')
        .select('id, numero_enrolamiento_enno, nombre_completo, centro_salud_id, area_profesional, nombre_centro, numero_tarjeta_rfid')
        .eq('centro_salud_id', centerId)
        .eq('estado_solicitud', 'Aprobado')
        .in('id', profIdsToExport);

      const { data, error } = await qb.order('nombre_completo');
      if (error) throw error;
      profs = data || [];
    } catch (e: any) {
      toast({ title: 'Error en la consulta de profesionales', description: e.message || 'Error desconocido al obtener profesionales.', variant: 'destructive' });
      return;
    }

    // 4. CONSTRUIR el TSV (16 columnas)
    // Nota: Este formato de 16 columnas es específico del software ZKTeco para importar empleados (Personal.xls)
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
        const turnoNumber = '1'; // Valor estático por defecto
        const cardNo = typeof p.numero_tarjeta_rfid === 'string'
          ? p.numero_tarjeta_rfid.replace(/\D/g, '').slice(0, 10)
          : '0';
        // Fechas grandes para indicar "siempre activo" en el dispositivo
        const fechaInicio = '2024-01-01';
        const fechaFin = '2099-12-31';

        return [
          enNo, nombre, depto, turnoNumber, '0', '0', '1', '0', cardNo, '0', '0', '0', '', fechaInicio, fechaFin, ''
        ];
      });

    // 5. VERIFICACIÓN DE FILAS FINALES
    if (rows.length === 0 && profIdsToExport.length > 0) {
      toast({ title: 'Exportación vacía', description: 'Se encontraron cuadrantes, pero los profesionales asociados no tienen número de enrolamiento (EnNo) asignado.', variant: 'destructive' });
      return;
    }

    // 6. DESCARGA
    // El formato TSV (valores separados por tabulaciones) se descarga como .xls para compatibilidad con ZKTeco.
    const tsv = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\r\n');
    const blob = new Blob([tsv], { type: 'text/tsv;charset=utf-8' }); // Tipo más específico

    const a = document.createElement('a');
    const href = URL.createObjectURL(blob);
    a.href = href;
    a.download = 'Personal.xls';
    document.body.appendChild(a); // Es buena práctica añadirlo al body antes de click
    a.click();
    document.body.removeChild(a); // Y limpiarlo después
    setTimeout(() => URL.revokeObjectURL(href), 0);


    toast({ title: 'Exportación completada', description: `Se exportaron ${rows.length} profesionales a Personal.xls.`, variant: 'success' });
  };

  // Función exportCuadrantesXls (COMPLETADA)
  const exportCuadrantesXls = async (centerId: string | null, from: string, to: string) => {
    // 1. Obtener cuadrantes
    let qbCuad = supabase.from('cuadrantes_biometricos').select('id_profesional, turno_id, fecha').gte('fecha', from).lte('fecha', to).order('fecha');
    if (centerId) qbCuad = qbCuad.eq('centro_salud_id', centerId);
    const { data: cuad, error: e1 } = await qbCuad;
    if (e1) {
      toast({ title: 'Error de consulta', description: e1.message, variant: 'destructive' });
      throw e1;
    }

    // 2. Obtener turnos
    const { data: turnos, error: e2 } = await supabase.from('turnos_biometricos').select('id, nombre_turno, hora_inicio, hora_fin');
    if (e2) {
      toast({ title: 'Error de consulta', description: e2.message, variant: 'destructive' });
      throw e2;
    }
    const turnoMap = new Map((turnos || []).map(t => [t.id, t] as [string, TurnoBio]));

    // 3. Obtener mapeo de profesionales a EnNo (Necesario para el formato de exportación)
    const profIds = Array.from(new Set(cuad?.map(c => c.id_profesional) || []));
    const { data: profs, error: e3 } = await supabase.from('profesionales_sanitarios')
      .select('id, numero_enrolamiento_enno')
      .in('id', profIds);
    if (e3) {
      toast({ title: 'Error de consulta', description: e3.message, variant: 'destructive' });
      throw e3;
    }
    const profEnNoMap = new Map((profs || []).map(p => [p.id, p.numero_enrolamiento_enno] as [string, string | null]));


    const headers = ['EmpNo', 'Date', 'ShiftName', 'Start', 'End'];
    const rows = (cuad || [])
      .map(c => {
        const enNo = profEnNoMap.get(c.id_profesional);
        if (!enNo) return null; // Omitir si no hay EnNo

        const t = turnoMap.get(c.turno_id);
        return [
          String(enNo), // EmpNo (número de enrolamiento)
          c.fecha,
          t?.nombre_turno || '',
          (t?.hora_inicio || '').slice(0, 5), // HH:mm
          (t?.hora_fin || '').slice(0, 5) // HH:mm
        ];
      })
      .filter((r): r is string[] => r !== null);

    if (rows.length === 0) {
      toast({ title: 'Exportación vacía', description: 'No se encontraron cuadrantes con profesionales que tengan número de enrolamiento (EmpNo) asignado.', variant: 'warning' });
      return;
    }

    // 4. Generar y descargar el archivo TSV (simulando XLS)
    const tsv = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\r\n');
    const blob = new Blob([tsv], { type: 'text/tsv;charset=utf-8' });

    const a = document.createElement('a');
    const href = URL.createObjectURL(blob);
    a.href = href;
    a.download = 'Cuadrantes.xls';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(href), 0);

    toast({ title: 'Exportación completada', description: `${rows.length} cuadrantes exportados a Cuadrantes.xls.`, variant: 'success' });
  };

  return { list, assign, exportPersonalXls, exportCuadrantesXls };
}