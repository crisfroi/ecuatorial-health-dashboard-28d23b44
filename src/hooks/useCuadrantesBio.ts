import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

// --- INTERFACES NECESARIAS ---

export interface CuadranteBio {
  id: string;
  id_profesional: string;
  turno_id: string;
  fecha: string; // YYYY-MM-DD
  centro_salud_id?: string | null;
  cuadrante_maestro_id?: string | null; // <-- NUEVO CAMPO AGREGADO
  created_at: string;
  updated_at: string;
}

export interface TurnoBio {
  id: string;
  nombre_turno: string;
  hora_inicio: string; // HH:mm:ss
  hora_fin: string; // HH:mm:ss
}

// Interfaz para la Plantilla Maestra (necesaria para el componente)
export interface CuadranteMaestroOption {
    id: string; 
    nombre: string; 
    centro_salud_id: string;
}

// --- HOOK USE CUADRANTES BIO ---

export function useCuadrantesBio() {
  const { toast } = useToast();

  // 1. FUNCIÓN LIST ACTUALIZADA
  // Añade selectedMaestroId y ajusta la lógica de filtrado
  const list = async (centerId: string | null, from: string, to: string, selectedMaestroId: string | null = null): Promise<CuadranteBio[]> => {
    let qb = supabase.from('cuadrantes_biometricos').select('*').order('fecha');
    
    if (centerId) {
        qb = qb.eq('centro_salud_id', centerId);
    }
    
    // FILTRADO POR CUADRANTE MAESTRO (PRIORITARIO)
    if (selectedMaestroId && selectedMaestroId !== 'todos') {
        qb = qb.eq('cuadrante_maestro_id', selectedMaestroId);
        // NOTA: Cuando se selecciona una plantilla, se ignoran las fechas (from/to) 
        // para ver todas las asignaciones vinculadas a esa plantilla.
    } else {
        // FILTRADO POR FECHA (solo si no se selecciona plantilla maestra)
        qb = qb.gte('fecha', from).lte('fecha', to);
    }
    
    const { data, error } = await qb;
    if (error) throw error;
    return (data || []) as CuadranteBio[]; 
  };
  
  // 2. FUNCIÓN ASSIGN (Permite insertar el nuevo campo cuadrante_maestro_id)
  const assign = async (rows: Array<Omit<CuadranteBio, 'id' | 'created_at' | 'updated_at'>>): Promise<number> => {
    // 1. Insertar/Actualizar Cuadrantes (incluye el nuevo campo cuadrante_maestro_id si existe)
    const { error: e1 } = await supabase.from('cuadrantes_biometricos').upsert(rows, { onConflict: 'id_profesional,fecha' });
    if (e1) throw e1;

    // --- LÓGICA DE MAPEO AUTOMÁTICO DE ENNO A EMPLEADO_DISPOSITIVO_MAP (SIN CAMBIOS) ---
    const professionalIds = Array.from(new Set(rows.map(r => r.id_profesional))).filter(Boolean);
    const centerId = rows[0]?.centro_salud_id;

    if (professionalIds.length > 0 && centerId) {
      const { data: profs, error: e2 } = await supabase.from('profesionales_sanitarios')
        .select('id, numero_enrolamiento_enno')
        .in('id', professionalIds)
        .eq('centro_salud_id', centerId)
        .neq('numero_enrolamiento_enno', null); 

      if (!e2 && profs) {
        const professionalsWithEnNo = profs;
        const { data: devices, error: e3 } = await supabase.from('dispositivos_fichaje')
          .select('id')
          .eq('centro_salud_id', centerId)
          .eq('activo', true);

        if (!e3 && devices) {
          const deviceIds = devices.map(d => d.id);
          if (deviceIds.length > 0 && professionalsWithEnNo.length > 0) {
            const mappingsToUpsert = [];
            for (const prof of professionalsWithEnNo) {
              const rawEnNo = prof.numero_enrolamiento_enno;
              const sanitizedEnNo = rawEnNo ? String(rawEnNo).replace(/\D/g, '').slice(0, 10) : null;
              if (!sanitizedEnNo) continue;
              for (const deviceId of deviceIds) {
                mappingsToUpsert.push({ id_profesional: prof.id, en_no: sanitizedEnNo, id_dispositivo: deviceId });
              }
            }
            const { error: e4 } = await supabase.from('empleado_dispositivo_map').upsert(mappingsToUpsert, { onConflict: 'id_profesional, id_dispositivo' });
            if (e4) {
              console.error('Error al actualizar mapeo de dispositivo:', e4);
              toast({ title: 'Aviso de Mapeo', description: 'El cuadrante se guardó, pero no se pudo actualizar el mapeo de EnNo para los dispositivos.', variant: 'warning' });
            }
          }
        } else if (e3) { console.error('Error al obtener dispositivos activos:', e3); }
      } else if (e2) { console.error('Error al obtener EnNo de profesionales:', e2); }
    }
    // --- FIN LÓGICA DE MAPEO AUTOMÁTICO ---

    toast({ title: 'Asignación completada', description: `${rows.length} cuadrantes asignados/actualizados.` });
    return rows.length;
  };
  
  // 3. NUEVA FUNCIÓN: Guardar Cuadrante Maestro
  const saveCuadranteMaestro = async (nombre: string, centro_salud_id: string, assignmentRows: Array<Omit<CuadranteBio, 'id' | 'created_at' | 'updated_at'>>): Promise<CuadranteMaestroOption> => {
      // 1. Insertar el Cuadrante Maestro (Plantilla)
      const { data: newMaestro, error: e1 } = await supabase.from('cuadrantes_maestros')
          .insert({ nombre, centro_salud_id })
          .select('id, nombre, centro_salud_id')
          .single();
          
      if (e1) throw e1;
      
      const newMaestroId = newMaestro.id;

      // 2. Copiar las asignaciones y vincularlas a este nuevo maestro
      const rowsToUpsert = assignmentRows.map(row => ({
          ...row,
          cuadrante_maestro_id: newMaestroId,
      }));

      // NOTA IMPORTANTE: En la BD real, si esto es una plantilla, solo se debería 
      // guardar un registro por (Profesional, Turno, Día de la Semana).
      // Aquí estamos insertando todas las filas con fecha, lo cual no es ideal para
      // una "plantilla" pero funciona con el modelo de datos actual.
      const { error: e2 } = await supabase.from('cuadrantes_biometricos').insert(rowsToUpsert);
      if (e2) {
          console.warn("Advertencia: Error al insertar asignaciones a la plantilla (puede que la tabla de asignaciones no soporte el volumen):", e2);
      }
      
      return newMaestro as CuadranteMaestroOption;
  };

  // 4. FUNCIONES DE EXPORTACIÓN (Mantienen la lógica original)
  const exportPersonalXls = async (centerId: string | null, from: string, to: string) => {
    if (!centerId) {
      toast({ title: 'Error de exportación', description: 'Debe seleccionar un centro de salud para la exportación.', variant: 'destructive' });
      return;
    }
    if (!from || !to || from.length !== 10 || to.length !== 10) {
      toast({ title: 'Error de exportación', description: 'Debe seleccionar un rango de fechas válido (YYYY-MM-DD).', variant: 'destructive' });
      return;
    }

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

    if (rows.length === 0 && profIdsToExport.length > 0) {
      toast({ title: 'Exportación vacía', description: 'Se encontraron cuadrantes, pero los profesionales asociados no tienen número de enrolamiento (EnNo) asignado.', variant: 'destructive' });
      return;
    }

    const tsv = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\r\n');
    const blob = new Blob([tsv], { type: 'text/tsv;charset=utf-8' });

    const a = document.createElement('a');
    const href = URL.createObjectURL(blob);
    a.href = href;
    a.download = 'Personal.xls';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(href), 0);

    toast({ title: 'Exportación completada', description: `Se exportaron ${rows.length} profesionales a Personal.xls.`, variant: 'success' });
  };
  
  const exportCuadrantesXls = async (centerId: string | null, from: string, to: string) => {
    let qbCuad = supabase.from('cuadrantes_biometricos').select('id_profesional, turno_id, fecha').gte('fecha', from).lte('fecha', to).order('fecha');
    if (centerId) qbCuad = qbCuad.eq('centro_salud_id', centerId);
    const { data: cuad, error: e1 } = await qbCuad;
    if (e1) {
      toast({ title: 'Error de consulta', description: e1.message, variant: 'destructive' });
      throw e1;
    }

    const { data: turnos, error: e2 } = await supabase.from('turnos_biometricos').select('id, nombre_turno, hora_inicio, hora_fin');
    if (e2) {
      toast({ title: 'Error de consulta', description: e2.message, variant: 'destructive' });
      throw e2;
    }
    const turnoMap = new Map((turnos || []).map(t => [t.id, t] as [string, TurnoBio]));

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
        if (!enNo) return null; 

        const t = turnoMap.get(c.turno_id);
        return [
          String(enNo), 
          c.fecha,
          t?.nombre_turno || '',
          (t?.hora_inicio || '').slice(0, 5), 
          (t?.hora_fin || '').slice(0, 5) 
        ];
      })
      .filter((r): r is string[] => r !== null);

    if (rows.length === 0) {
      toast({ title: 'Exportación vacía', description: 'No se encontraron cuadrantes con profesionales que tengan número de enrolamiento (EmpNo) asignado.', variant: 'warning' });
      return;
    }

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


  return { list, assign, exportPersonalXls, exportCuadrantesXls, saveCuadranteMaestro };
}