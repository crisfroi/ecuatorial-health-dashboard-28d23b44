import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { FileUp, Info, Upload } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAsistencia, useDispositivosFichaje, type Dispositivo, type EmpleadoDispositivoMap } from '@/hooks/useAsistencia';
import { supabase } from '@/integrations/supabase/client';

import { FichajesList, type FichajePreviewRow } from './FichajesList';

// --- NUEVAS INTERFACES PARA MANEJAR EL NOMBRE COMPLETO ---

// 1. Tipo para la relación anidada de profesionales sanitarios
interface ProfesionalSanitario {
  nombre_completo: string;
}

// 2. Tipo para el mapeo que incluye el nombre completo (resultado de la JOIN)
type MappedEmployeeWithDetails = EmpleadoDispositivoMap & {
  profesionales_sanitarios: ProfesionalSanitario | null;
};

// 3. Tipo enriquecido para las filas de previsualización que incluye el nombre
type EnrichedFichajePreviewRow = FichajePreviewRow & {
  nombre_completo?: string | null;
};

// ---------------------------------------------------------

interface CentroRow {
  id: string;
  nombre: string;
}

interface CentroOption {
  id: string;
  nombre: string;
}

type FileKind = 'txt' | 'xls';

export function ImportarFichajesPanel() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { list } = useDispositivosFichaje();
  const { importFile, importReporteXls, importing } = useAsistencia();

  const [selectedCenter, setSelectedCenter] = useState<string>('todos');
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [fileKind, setFileKind] = useState<FileKind>('txt');
  const [previewRows, setPreviewRows] = useState<FichajePreviewRow[]>([]);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewName, setPreviewName] = useState<string>('');

  const { data: centers = [] } = useQuery<CentroOption[]>({
    queryKey: ['centros-options'],
    queryFn: async () => {
      const { data, error } = await supabase.from('centros_salud').select('id, nombre').order('nombre').returns<CentroRow[]>();
      if (error) throw error;
      return (data ?? []).map((centro) => ({ id: centro.id, nombre: centro.nombre }));
    },
    staleTime: 5 * 60_000,
  });

  const centerIdFilter = selectedCenter === 'todos' ? null : selectedCenter;

  const { data: devices = [] } = useQuery<Dispositivo[]>({
    queryKey: ['dispositivos', centerIdFilter],
    queryFn: () => list(centerIdFilter),
    staleTime: 0,
    initialData: [],
  });
  console.log(`[Dispositivos Query] Dispositivos: ${devices.length} | Filtro Activo: ${centerIdFilter}`); 

  // --- CONSULTA DIRECTA CON JOIN/RELACIÓN PARA OBTENER EL NOMBRE ---
  const { data: mappings = [] } = useQuery<MappedEmployeeWithDetails[]>({
    queryKey: ['device-mappings', selectedDevice, 'importar', 'with_name'],
    queryFn: async () => {
      if (!selectedDevice) return [];

      // Consulta con select anidado para obtener el nombre completo (JOIN a profesionales_sanitarios)
      const { data, error } = await supabase
        .from('empleado_dispositivo_map')
        .select(`
          id,
          en_no,
          id_profesional,
          id_dispositivo,
          profesionales_sanitarios (
            nombre_completo
          )
        `)
        .eq('id_dispositivo', selectedDevice)
        .returns<MappedEmployeeWithDetails[]>();

      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(selectedDevice),
    staleTime: 60_000,
    initialData: [],
  });

  // El Set se usa para contar cuántos registros tienen mapeo (EnNo). Confirma que las claves son correctas.
  const mappedEmployees = useMemo(
    // NORMALIZACIÓN: Aseguramos que la clave de mapeo esté limpia (.trim())
    () => new Set(mappings.map((mapping) => mapping.en_no?.toString().trim() ?? '')),
    [mappings]
  );
  
  const unmatchedPreview = useMemo(
    // NORMALIZACIÓN: Aseguramos que la clave del registro esté limpia (.trim()) para la verificación
    () => previewRows.filter((row) => row.enNo && !mappedEmployees.has(row.enNo.trim())),
    [previewRows, mappedEmployees]
  );

  // 1. Crear un mapa de EnNo (limpio) a Nombre Completo del profesional
  const enNoToProfNameMap = useMemo(() => {
    const map = new Map<string, string>();
    mappings.forEach((m) => {
      const enNoKey = m.en_no.trim();
      
      // DEFENSA DE TIPO: Nos aseguramos de que el nombre sea siempre una cadena si existe
      // Esto maneja el caso de que la relación sea NULL o que nombre_completo sea NULL.
      const profName = m.profesionales_sanitarios?.nombre_completo ?? '';

      // Solo agregamos la clave al mapa si se encontró un nombre
      if (profName) {
        map.set(enNoKey, profName);
      }
    });
    return map;
  }, [mappings]);

  // 2. Enriquecer los registros de previsualización con el nombre_completo
  const previewRowsWithMapping = useMemo<EnrichedFichajePreviewRow[]>(() => {
    return previewRows.map((row) => ({
      ...row,
      // NORMALIZACIÓN: Usamos row.enNo.trim() para buscar en el mapa de nombres
      nombre_completo: row.enNo ? enNoToProfNameMap.get(row.enNo.trim()) ?? null : null,
    }));
  }, [previewRows, enNoToProfNameMap]);

  // ---------------------------------------------------------------------------------
  // --- PARSERS DE ARCHIVO (SIN CAMBIOS DE LÓGICA DE NEGOCIO, SOLO MANTENIMIENTO) ---
  // ---------------------------------------------------------------------------------

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const parseTxtPreview = async (file: File): Promise<FichajePreviewRow[]> => {
    const text = await file.text();
    const linesRaw = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!linesRaw.length) return [];
    
    // Lógica para detectar y mapear la cabecera
    const lines = [...linesRaw]; // Copia el array para modificarlo
    let headerMap: Record<string, number> | null = null;
    
    // El formato de split intenta manejar tabulaciones, comas o 2+ espacios como delimitadores
    const firstLineParts = lines[0].split(/\t+|,|\s{2,}/).map(s => s.trim());
    const knownHeaders = ['No', 'TMNo', 'EnNo', 'Name', 'INOUT', 'Mode', 'DateTime'];
    
    // Comprueba si la primera línea contiene todas las cabeceras clave
    const isHeader = knownHeaders.every(h => firstLineParts.includes(h));
    
    if (isHeader) {
        // Mapea el nombre de la cabecera a su índice de columna
        headerMap = firstLineParts.reduce((acc, key, idx) => { acc[key] = idx; return acc; }, {} as Record<string, number>);
        lines.shift(); // Elimina la cabecera del array de datos
    }

    const entries: FichajePreviewRow[] = [];
    
    for (const raw of lines.slice(0, 200)) { // Limitar a 200 para previsualización
        const parts = raw.split(/\t+|,|\s{2,}/).map((p) => p.trim()).filter(Boolean);
        if (!parts.length || parts.length < 3) continue;

        let enNo: string | null = null;
        let fechaHora: string = new Date().toISOString();
        let mode: string | null = null;
        let inout: string | null = null;

        if (headerMap) {
            // Usa el mapa de cabeceras para una extracción precisa
            const enNoIdx = headerMap['EnNo'];
            const dtIdx = headerMap['DateTime'];
            const inoutIdx = headerMap['INOUT'];
            const modeIdx = headerMap['Mode'];

            // 1. EnNo (Obligatorio para el mapeo) - Aseguramos .trim()
            enNo = parts[enNoIdx] && /^\d{1,10}$/.test(parts[enNoIdx].trim()) ? String(parts[enNoIdx].trim()) : null;

            // 2. DateTime
            const dtRaw = parts[dtIdx] || '';
            const normalized = dtRaw.replace(/\//g, '-');
            const parsed = new Date(normalized);
            fechaHora = isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();

            // 3. Mode y INOUT
            mode = parts[modeIdx] || null;
            const inoutRaw = parts[inoutIdx] || '';

            if (/^in$/i.test(inoutRaw)) inout = 'IN';
            else if (/^out$/i.test(inoutRaw)) inout = 'OUT';
            // Si es 0/1 (generalmente 0=IN, 1=OUT), déjalo como null para que el proceso de importación
            // en useAsistencia decida o use la heurística.
            else if (/^[01]$/.test(inoutRaw)) inout = null; 
            
        } else {
            // Fallback heurístico si no hay cabecera (menos fiable)
            const joined = raw.replace(/,/g, ' ');
            const dtMatch = joined.match(/(\d{4}[\/-]\d{2}[\/-]\d{2}[ T]\d{2}:\d{2}(:\d{2})?)/);
            fechaHora = dtMatch ? new Date(dtMatch[1].replace(/\//g, '-')).toISOString() : new Date().toISOString();
            
            // Asumiendo que el EnNo es el primer número largo después del primer índice (No) o el segundo índice (TMNo)
            // En este formato, es la tercera parte (índice 2)
            enNo = (parts.length > 2 && /^\d{1,10}$/.test(parts[2].trim())) ? parts[2].trim() : null;

            const inoutToken = parts.find(p => /^I(n)?$|^O(ut)?$/i.test(p));
            inout = inoutToken ? (/^I/i.test(inoutToken) ? 'IN' : 'OUT') : null;
            mode = parts.find(p => /^(M|A|FP|FACE|FINGER|CARD|\d{1,2})$/i.test(p)) || null;
        }

        if (enNo) { // Solo añadir si hay un EnNo válido
            entries.push({
                enNo: enNo,
                fechaHora,
                mode: mode,
                inout: inout,
                source: file.name,
            });
        }
    }
    return entries;
  };

  const parseXlsPreview = async (file: File): Promise<FichajePreviewRow[]> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];
    const sheet = workbook.Sheets[sheetName];
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    return rows.slice(0, 200).map((row) => {
      // Asegurar .trim() en la lectura para consistencia
      const enNo = String(row.EnNo || row.EmpNo || row.ID || row.Id || '').trim() || null;
      const dateValue = row.DateTime || row.Datetime || row.TIME || row.Time || row.Fecha || row.FechaHora || '';
      const normalized = String(dateValue).replace(/\//g, '-');
      const fechaHora = normalized ? new Date(normalized).toISOString() : new Date().toISOString();
      const mode = row.Mode || row.method || row.Method || null;
      const inout = row.INOUT || row.InOut || row.Dir || row.Direction || null;
      return {
        enNo,
        fechaHora,
        mode: mode ? String(mode) : null,
        inout: inout ? String(inout).toUpperCase() : null,
        source: `${file.name}#${sheetName}`,
      } satisfies FichajePreviewRow;
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedDevice) {
      if (!selectedDevice) {
        toast({ title: 'Selecciona un dispositivo', description: 'Elige un dispositivo antes de cargar archivos', variant: 'destructive' });
      }
      return;
    }
    try {
      const rows = fileKind === 'txt' ? await parseTxtPreview(file) : await parseXlsPreview(file);
      setPreviewRows(rows);
      setPreviewFile(file);
      setPreviewName(file.name);
      toast({ title: 'Archivo preparado', description: `${rows.length} registros listos para importar` });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Revisa el formato del archivo';
      toast({ title: 'No se pudo leer el archivo', description: message, variant: 'destructive' });
      setPreviewRows([]);
      setPreviewFile(null);
      setPreviewName('');
    } finally {
      event.target.value = '';
    }
  };

  const handleImport = async () => {
    if (!selectedDevice || !previewFile) {
      toast({ title: 'Sin archivo', description: 'Selecciona un archivo para importar', variant: 'destructive' });
      return;
    }
    try {
      if (fileKind === 'txt') {
        await importFile(selectedDevice, previewFile);
      } else {
        await importReporteXls(selectedDevice, previewFile);
      }
      toast({ title: 'Importación completada', description: `${previewFile.name} procesado con éxito` });
      setPreviewRows([]);
      setPreviewFile(null);
      setPreviewName('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Revisa el archivo y la asignación EnNo';
      toast({ title: 'Error al importar', description: message, variant: 'destructive' });
    }
  };

  // ---------------------------------------------------------------------------------
  // --- RENDERIZADO ---
  // ---------------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Importar fichajes</CardTitle>
          <CardDescription>Carga los registros generados por los dispositivos biométricos y sincronízalos con la base de datos central.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Centro</Label>
              <Select value={selectedCenter} onValueChange={(value) => { setSelectedCenter(value); setSelectedDevice(''); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un centro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los centros</SelectItem>
                  {centers.map((centro) => (
                    <SelectItem key={centro.id} value={centro.id}>
                      {centro.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dispositivo</Label>
              <Select value={selectedDevice} onValueChange={(value) => setSelectedDevice(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un dispositivo" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de archivo</Label>
              <Select value={fileKind} onValueChange={(value: FileKind) => setFileKind(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="txt">GLG / TXT / DAT (texto)</SelectItem>
                  <SelectItem value="xls">Reporte XLS / XLSX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={handleChooseFile} disabled={!selectedDevice || importing}>
              <FileUp className="mr-2 h-4 w-4" /> Elegir archivo
            </Button>
            {previewName ? <Badge variant="secondary">{previewName}</Badge> : null}
            {previewRows.length ? (
              <Badge>{previewRows.length} registros detectados</Badge>
            ) : null}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={fileKind === 'txt' ? '.txt,.dat,.log,.csv' : '.xls,.xlsx'}
            onChange={handleFileChange}
            className="hidden"
            disabled={!selectedDevice}
          />

          {previewRows.length ? (
            <Alert variant={unmatchedPreview.length ? 'destructive' : 'default'}>
              <Info className="h-4 w-4" />
              <AlertTitle>
                {/* Contador de registros sin mapeo */}
                {unmatchedPreview.length
                  ? `${unmatchedPreview.length} registros sin mapeo EnNo`
                  : 'Archivo listo para importar'}
              </AlertTitle>
              <AlertDescription>
                {unmatchedPreview.length
                  ? 'Algunos EnNo no están mapeados al dispositivo. Revísalos antes de confirmar la importación.'
                  : 'El archivo se ajusta a los formatos soportados. Continúa para guardar los fichajes.'}
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Se pasa la lista enriquecida con el nombre_completo */}
          <FichajesList rows={previewRowsWithMapping} compact />
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-xs text-muted-foreground">
            Solo se importarán los registros del archivo seleccionado. Puedes cargar hasta 200 registros por lote.
          </div>
          <Button onClick={handleImport} disabled={!previewRows.length || importing}>
            <Upload className="mr-2 h-4 w-4" /> Importar registros
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
