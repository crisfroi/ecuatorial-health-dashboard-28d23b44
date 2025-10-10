import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

// --- INTERFACES GENERALES ---

export interface Dispositivo {
  id: string;
  nombre: string;
  ubicacion?: string | null;
  centro_salud_id?: string | null;
  activo: boolean;
  tm_no: number | string | null;
  created_at: string;
  updated_at: string;
}

export interface EmpleadoDispositivoMap {
  id: string;
  id_profesional: string;
  en_no: string;
  id_dispositivo: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceLog {
  id: string;
  id_profesional: string | null;
  id_dispositivo: string;
  en_no: string | null;
  tm_no: number | string | null;
  inout: 'IN' | 'OUT' | null;
  mode: string | null;
  fecha_hora: string; // ISO
  raw_line?: string | null;
  source_file?: string | null;
  created_at: string;
}

export interface ConsolidatedDayEntry {
  id_profesional?: string | null;
  en_no?: string | null;
  fecha: string; // yyyy-mm-dd
  centro_salud_id?: string | null;
  entrada?: string | null; // ISO
  salida?: string | null; // ISO
  total_horas?: number; // hours
}

// Lo que realmente genera el parser antes de la inserción.
type LogPayload = Omit<AttendanceLog, 'id' | 'id_dispositivo' | 'created_at'>;

// ----------------------------------------------------------------------
// 🛠️ USE DISPOSITIVOS FICHAJE (Asegura que tm_no se guarda)
// ----------------------------------------------------------------------

export function useDispositivosFichaje() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const list = async (centroId?: string | null): Promise<Dispositivo[]> => {
    let qb = supabase.from('dispositivos').select('*').order('created_at', { ascending: false });
    if (centroId) qb = qb.eq('centro_salud_id', centroId);
    const { data, error } = await qb;
    if (error) throw new Error(error.message);
    return data || [];
  };

  const create = async (payload: Partial<Dispositivo>) => {
    setLoading(true);
    try {
      // CORREGIDO: tm_no incluido en el payload de inserción
      const { data, error } = await supabase.from('dispositivos').insert({
        nombre: payload.nombre,
        ubicacion: payload.ubicacion || null,
        centro_salud_id: payload.centro_salud_id || null,
        activo: payload.activo ?? true,
        tm_no: payload.tm_no,
      }).select().single();
      if (error) throw error;
      toast({ title: 'Dispositivo creado', description: payload.nombre });
      return data as Dispositivo;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string, patch: Partial<Dispositivo>) => {
    // CORREGIDO: tm_no incluido en el payload de actualización
    const { data, error } = await supabase.from('dispositivos').update({
      nombre: patch.nombre,
      ubicacion: patch.ubicacion,
      centro_salud_id: patch.centro_salud_id,
      activo: patch.activo,
      tm_no: patch.tm_no,
    }).eq('id', id).select().single();
    if (error) throw error;
    toast({ title: 'Dispositivo actualizado' });
    return data as Dispositivo;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('dispositivos').delete().eq('id', id);
    if (error) throw error;
    toast({ title: 'Dispositivo eliminado' });
  };

  const listMappings = async (id_dispositivo: string): Promise<EmpleadoDispositivoMap[]> => {
    const { data, error } = await supabase.from('empleado_dispositivo_map').select('*').eq('id_dispositivo', id_dispositivo);
    if (error) throw error;
    return data || [];
  };

  const upsertMapping = async (id_dispositivo: string, en_no: string, id_profesional: string) => {
    const { data, error } = await supabase.from('empleado_dispositivo_map').upsert({ id_dispositivo, en_no, id_profesional }, { onConflict: 'id_dispositivo,en_no' }).select().single();
    if (error) throw error;
    toast({ title: 'Mapeo guardado', description: `${en_no} → asignado` });
    return data as EmpleadoDispositivoMap;
  };

  return { loading, list, create, update, remove, listMappings, upsertMapping };
}

// ----------------------------------------------------------------------
// 🛠️ USE ASISTENCIA (Optimizado con LogPayload y validación TMNo)
// ----------------------------------------------------------------------

export function useAsistencia() {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);

  // Parser genérico TXT/DAT
  const parseLines = (text: string): LogPayload[] => {
    const linesRaw = text.split(/\r?\n/);
    const lines = linesRaw.map(l => l.replace(/\uFEFF/g, '').trim()).filter(Boolean);

    const entries: LogPayload[] = [];

    let headerMap: Record<string, number> | null = null;
    if (lines.length) {
      const headerParts = lines[0].split(/\t+|,|\s{2,}/).map(s => s.trim());
      const knownHeaders = ['No', 'TMNo', 'EnNo', 'Name', 'INOUT', 'Mode', 'DateTime'];
      const isHeader = knownHeaders.every(h => headerParts.includes(h));
      if (isHeader) {
        headerMap = headerParts.reduce((acc, key, idx) => { acc[key] = idx; return acc; }, {} as Record<string, number>);
        lines.shift();
      }
    }

    for (const raw of lines) {
      const parts = raw.split(/\t+|,|\s{2,}/).map(p => p.trim());
      if (!parts.length) continue;

      let en_no: string | null = null;
      let tm_no: string | null = null;
      let fecha_hora: string = new Date().toISOString();
      let inout: 'IN' | 'OUT' | null = null;
      let mode: string | null = null;

      if (headerMap) {
        en_no = parts[headerMap['EnNo']] || null;
        tm_no = parts[headerMap['TMNo']] || null;
        const dtRaw = parts[headerMap['DateTime']] || '';
        const normalized = dtRaw.replace(/\//g, '-');
        const parsed = new Date(normalized);
        fecha_hora = isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
        const inoutRaw = parts[headerMap['INOUT']] || '';
        if (/^in$/i.test(inoutRaw)) inout = 'IN';
        else if (/^out$/i.test(inoutRaw)) inout = 'OUT';
        else if (/^[01]$/.test(inoutRaw)) inout = null;
        mode = (parts[headerMap['Mode']] || '') || null;
      } else {
        // Fallback heurístico - tm_no queda en null
        const joined = raw.replace(/,/g, ' ');
        const dtMatch = joined.match(/(\d{4}[/-]\d{2}[/-]\d{2}[ T]\d{2}:\d{2}(:\d{2})?)/);
        fecha_hora = dtMatch ? new Date(dtMatch[1].replace(/\//g, '-')).toISOString() : new Date().toISOString();
        const maybeEn = parts.find(p => /^\d{2,}$/.test(p));
        en_no = maybeEn || null;
        const inoutToken = parts.find(p => /^I(n)?$|^O(ut)?$/i.test(p));
        inout = inoutToken ? (/^I/i.test(inoutToken) ? 'IN' : 'OUT') : null;
        mode = parts.find(p => /^(M|A|FP|FACE|FINGER|CARD|\d{1,2})$/i.test(p)) || null;
      }

      entries.push({
        id_profesional: null,
        en_no,
        tm_no,
        inout,
        mode,
        fecha_hora,
        raw_line: raw,
        source_file: undefined
      });
    }

    return entries;
  };

  const insertLogs = async (deviceId: string, filename: string, logs: LogPayload[]) => {
    if (!logs.length) return 0;

    // 1. OBTENER el TMNo esperado del dispositivo seleccionado
    const { data: device, error: devErr } = await supabase
      .from('dispositivos')
      .select('tm_no')
      .eq('id', deviceId)
      .single();
    if (devErr) throw devErr;
    const expectedTmNo = device?.tm_no ? String(device.tm_no) : null;

    let validLogs = logs;
    let filteredCount = 0;

    // 2. VALIDACIÓN CRÍTICA del TMNo
    if (expectedTmNo) {
      validLogs = logs.filter(log => {
        const logTmNo = log.tm_no ? String(log.tm_no) : null;
        // Si el log NO tiene TMNo, lo aceptamos (posiblemente formato antiguo sin la columna).
        if (!logTmNo) return true;

        // Si tiene TMNo, DEBE coincidir con el esperado del dispositivo.
        return logTmNo === expectedTmNo;
      });

      filteredCount = logs.length - validLogs.length;

      if (filteredCount > 0) {
        console.warn(`[TMNo Mismatch] ${filteredCount} logs filtrados. Esperado: ${expectedTmNo}`);
        toast({
          title: 'Advertencia de Filtro (TMNo)',
          description: `${filteredCount} logs omitidos. No coinciden con el ID de Terminal (${expectedTmNo}) del dispositivo seleccionado.`,
          variant: 'destructive'
        });
      }
    } else {
      console.warn(`Advertencia: El dispositivo seleccionado (ID: ${deviceId}) no tiene un TMNo registrado. Se importarán todos los logs sin validación de terminal.`);
    }

    if (!validLogs.length) {
      return 0;
    }

    // 3. Resolver id_profesional por en_no vía mapeo
    const enNos = Array.from(new Set(validLogs.map(l => l.en_no).filter(Boolean))) as string[];
    let mappings: EmpleadoDispositivoMap[] = [];
    if (enNos.length) {
      const { data: maps, error: mapsErr } = await supabase
        .from('empleado_dispositivo_map')
        .select('id_profesional,en_no')
        .in('en_no', enNos)
        .eq('id_dispositivo', deviceId);
      if (mapsErr) throw mapsErr;
      mappings = maps || [];
    }

    // 4. Inserción de logs válidos
    const rows = validLogs.map(l => {
      const profId = mappings.find(m => m.en_no === l.en_no)?.id_profesional || null;
      return {
        id_profesional: profId,
        id_dispositivo: deviceId, // <-- AÑADIDO AQUÍ
        en_no: l.en_no,
        tm_no: l.tm_no,
        inout: l.inout,
        mode: l.mode,
        fecha_hora: l.fecha_hora,
        raw_line: l.raw_line,
        source_file: filename
      };
    });

    const { error } = await supabase.from('attendance_logs').insert(rows);
    if (error) throw error;
    return rows.length;
  };

  const importFile = async (deviceId: string, file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = parseLines(text);
      const count = await insertLogs(deviceId, file.name, parsed);
      toast({ title: 'Importación completada', description: `${count} fichajes importados` });
      return count;
    } finally {
      setImporting(false);
    }
  };

  // Importar Reporte.xls (multi-hoja)
  const importReporteXls = async (deviceId: string, file: File) => {
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      let total = 0;
      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        if (!ws) continue;
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
        const parsed: LogPayload[] = rows.map((r) => {
          const en = r.EnNo || r.EmpNo || r.EmpID || r.Enno || r.enno || r.enNo || '';
          const dt = r.DateTime || r.Datetime || r.TIME || r.Time || '';
          const io = r.INOUT || r.InOut || r.Dir || r.Direction || '';
          const md = r.Mode || r.method || r.Method || '';
          const tm = r.TMNo || r.TMNO || ''; // <-- Extracción de TMNo de la hoja XLS

          const normalized = String(dt).replace(/\//g, '-');
          const fecha_hora = new Date(normalized).toISOString();
          let inout: 'IN' | 'OUT' | null = null;
          if (/^in$/i.test(io)) inout = 'IN';
          else if (/^out$/i.test(io)) inout = 'OUT';
          else if (/^[01]$/.test(String(io))) inout = null;

          return {
            id_profesional: null,
            en_no: String(en) || null,
            tm_no: String(tm) || null, // <-- Se incluye TMNo
            inout,
            mode: md ? String(md) : null,
            fecha_hora,
            raw_line: JSON.stringify(r),
            source_file: file.name
          };
        }).filter((e: LogPayload) => e.en_no && e.fecha_hora && !isNaN(new Date(e.fecha_hora).getTime()));

        total += await insertLogs(deviceId, `${file.name}#${sheetName}`, parsed);
      }
      toast({ title: 'Reporte importado', description: `${total} registros procesados` });
      return total;
    } finally {
      setImporting(false);
    }
  };

  // Importar Personal.xls para mapear EnNo -> id_profesional del centro
  const importPersonalXls = async (deviceId: string, file: File, centerId?: string | null) => {
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const firstSheetName = wb.SheetNames[0];
      if (!firstSheetName) {
        toast({ title: 'Archivo sin hojas', description: 'El archivo Personal.xls no contiene hojas válidas', variant: 'destructive' });
        return 0;
      }

      const ws = wb.Sheets[firstSheetName];
      if (!ws) {
        toast({ title: 'Hoja inválida', description: 'No se pudo leer el contenido de la hoja seleccionada', variant: 'destructive' });
        return 0;
      }

      const headerRows = XLSX.utils.sheet_to_json<Array<string | number>>(ws, { header: 1, defval: '' });
      const headerRow = headerRows.find((row) => row.some((cell) => String(cell ?? '').trim().length > 0)) || [];
      const normalizedHeaders = headerRow.map((cell) => String(cell || '').trim().toLowerCase());
      const columnChecks = [
        { keys: ['id', 'empno', 'emp no', 'enno', 'en no', 'no'], label: 'ID/EmpNo' },
        { keys: ['name', 'nombre'], label: 'Nombre' },
        { keys: ['turno', 'shift'], label: 'Turno' },
      ];
      const missing = columnChecks
        .filter(({ keys }) => !normalizedHeaders.some((header) => keys.includes(header)))
        .map(({ label }) => label);
      if (missing.length) {
        toast({
          title: 'Formato Personal.xls no válido',
          description: `Faltan columnas requeridas: ${missing.join(', ')}`,
          variant: 'destructive',
        });
        return 0;
      }

      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (!rows.length) {
        toast({ title: 'Archivo vacío', description: 'No se encontraron registros en el archivo Personal.xls', variant: 'destructive' });
        return 0;
      }

      // Consulta para obtener IDs de profesional por EnNo
      let qb = supabase.from('profesionales_sanitarios').select('id, nombre_completo, numero_enrolamiento_enno, centro_salud_id, numero_tarjeta_rfid');
      if (centerId) qb = qb.eq('centro_salud_id', centerId);
      const { data: profs, error: profErr } = await qb;
      if (profErr) throw profErr;

      const byEmpNo = new Map<string, string>();
      const byName = new Map<string, string>();
      (profs || []).forEach((p: any) => {
        const raw = String(p.numero_enrolamiento_enno ?? '').trim();
        if (raw) {
          byEmpNo.set(raw, p.id);
          const numeric = raw.replace(/\D/g, '');
          if (numeric) byEmpNo.set(numeric, p.id);
        }
        const name = String(p.nombre_completo ?? '').trim().toLowerCase();
        if (name) byName.set(name, p.id);
      });

      const mappings: { id_dispositivo: string; en_no: string; id_profesional: string }[] = [];
      const rfidUpdates = new Map<string, string>();
      const unmatched: string[] = [];
      const invalid: number[] = [];

      rows.forEach((r, index) => {
        const rawEmp = String(
          r.EmpNo ?? r.ENNO ?? r.EnNo ?? r.EmpID ?? r.ID ?? r.Id ?? r.id ?? r.No ?? ''
        ).trim();
        const cleanEmp = rawEmp.replace(/\s+/g, '');
        const numericEmp = cleanEmp.replace(/\D/g, '');
        const enNo = cleanEmp || numericEmp;
        if (!enNo) {
          invalid.push(index + 2);
          return;
        }

        const name = String(r.Name ?? r.Nombre ?? r.EmpName ?? '').trim().toLowerCase();
        let profId = byEmpNo.get(enNo) || byEmpNo.get(numericEmp) || byEmpNo.get(rawEmp) || null;
        if (!profId && name) {
          profId = byName.get(name) || null;
        }
        if (!profId) {
          unmatched.push(enNo || name || `fila ${index + 2}`);
          return;
        }

        mappings.push({ id_dispositivo: deviceId, en_no: enNo, id_profesional: profId });

        const cardRaw = String(
          r['ID/Tarjeta'] ?? r['ID / Tarjeta'] ?? r.CardNo ?? r.Card ?? r.Tarjeta ?? ''
        ).trim();
        const cardSanitized = cardRaw.replace(/\D/g, '').slice(0, 10);
        if (cardSanitized) {
          const existing = rfidUpdates.get(profId);
          if (!existing || existing !== cardSanitized) {
            rfidUpdates.set(profId, cardSanitized);
          }
        }
      });

      if (!mappings.length) {
        toast({
          title: 'Sin asignaciones válidas',
          description: unmatched.length
            ? `No se encontraron profesionales para ${unmatched.slice(0, 5).join(', ')}`
            : 'Verifique que el archivo contiene IDs válidos',
          variant: 'destructive',
        });
        return 0;
      }

      const { error: mappingError } = await supabase
        .from('empleado_dispositivo_map')
        .upsert(mappings, { onConflict: 'id_dispositivo,en_no' });
      if (mappingError) throw mappingError;

      if (rfidUpdates.size) {
        const rfidPayload = Array.from(rfidUpdates.entries()).map(([id, numero_tarjeta_rfid]) => ({ id, numero_tarjeta_rfid }));
        const { error: rfidError } = await supabase
          .from('profesionales_sanitarios')
          .upsert(rfidPayload, { onConflict: 'id' });
        if (rfidError) throw rfidError;
      }

      const details: string[] = [];
      if (unmatched.length) details.push(`Sin coincidencia: ${unmatched.slice(0, 3).join(', ')}`);
      if (invalid.length) details.push(`Filas omitidas: ${invalid.length}`);

      toast({
        title: 'Asignaciones guardadas',
        description: `${mappings.length} mapeos creados/actualizados${details.length ? ` · ${details.join(' · ')}` : ''}`,
      });
      return mappings.length;
    } finally {
      setImporting(false);
    }
  };

  const fetchLogsByRange = async (fromISO: string, toISO: string, options: { centerId?: string | null, deviceId?: string | null } = {}) => {
    let qb = supabase.from('attendance_logs').select('*').gte('fecha_hora', fromISO).lte('fecha_hora', toISO);
    if (options.deviceId) qb = qb.eq('id_dispositivo', options.deviceId);
    const { data, error } = await qb.order('fecha_hora', { ascending: true });
    if (error) throw error;
    return (data || []) as AttendanceLog[];
  };

  const consolidateDaily = (logs: AttendanceLog[]): ConsolidatedDayEntry[] => {
    const byKey: Record<string, ConsolidatedDayEntry> = {};
    for (const l of logs) {
      const day = l.fecha_hora.slice(0, 10);
      const key = `${l.id_profesional || l.en_no || 'unknown'}_${day}`;
      const entry = byKey[key] || { id_profesional: l.id_profesional, en_no: l.en_no, fecha: day } as ConsolidatedDayEntry;

      // Derivar entrada/salida por min/max si INOUT no viene indicado
      if (!entry.entrada || l.fecha_hora < entry.entrada) entry.entrada = l.fecha_hora;
      if (!entry.salida || l.fecha_hora > entry.salida) entry.salida = l.fecha_hora;

      // Si viene marcado IN/OUT, refinar
      if (l.inout === 'IN') {
        if (!entry.entrada || l.fecha_hora < entry.entrada) entry.entrada = l.fecha_hora;
      } else if (l.inout === 'OUT') {
        if (!entry.salida || l.fecha_hora > entry.salida) entry.salida = l.fecha_hora;
      }

      byKey[key] = entry;
    }
    return Object.values(byKey).map(e => ({
      ...e,
      total_horas: e.entrada && e.salida ? (new Date(e.salida).getTime() - new Date(e.entrada).getTime()) / 3600000 : undefined
    }));
  };

  const generateAttendanceStats = (entries: ConsolidatedDayEntry[]) => {
    const totals = {
      dias: entries.length,
      horasTotales: entries.reduce((s, e) => s + (e.total_horas || 0), 0),
    };
    const byProf: Record<string, { dias: number; horas: number }> = {};
    for (const e of entries) {
      const k = e.id_profesional || e.en_no || 'unknown';
      byProf[k] = byProf[k] || { dias: 0, horas: 0 };
      byProf[k].dias += 1;
      byProf[k].horas += e.total_horas || 0;
    }
    return { totals, byProf };
  };

  const exportDAT = (entries: ConsolidatedDayEntry[]) => {
    // DAT sencillo: ENNO,YYYYMMDD,HHMM,IN/OUT
    const lines: string[] = [];
    for (const e of entries) {
      const en = e.en_no || '';
      if (!en) continue;
      const ymd = e.fecha.replace(/-/g, '');
      if (e.entrada) {
        const t = new Date(e.entrada); const hh = String(t.getHours()).padStart(2, '0'); const mm = String(t.getMinutes()).padStart(2, '0');
        lines.push([en, ymd, `${hh}${mm}`, 'IN'].join(','));
      }
      if (e.salida) {
        const t = new Date(e.salida); const hh = String(t.getHours()).padStart(2, '0'); const mm = String(t.getMinutes()).padStart(2, '0');
        lines.push([en, ymd, `${hh}${mm}`, 'OUT'].join(','));
      }
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `asistencia_${new Date().toISOString().slice(0, 10)}.dat`;
    a.click();
  };

  return { importing, importFile, importReporteXls, importPersonalXls, fetchLogsByRange, consolidateDaily, generateAttendanceStats, exportDAT };
}