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

interface CentroOption {
  id: string;
  nombre: string;
}

type FileKind = 'txt' | 'xls';

export function ImportarFichajesPanel() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { list, listMappings } = useDispositivosFichaje();
  const { importFile, importReporteXls, importing } = useAsistencia();

  const [selectedCenter, setSelectedCenter] = useState<string>('todos');
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [fileKind, setFileKind] = useState<FileKind>('txt');
  const [previewRows, setPreviewRows] = useState<FichajePreviewRow[]>([]);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewName, setPreviewName] = useState<string>('');

  const { data: centers = [] } = useQuery<CentroOption[]>(
    ['centros-options'],
    async () => {
      const { data, error } = await supabase.from('centros_salud').select('id, nombre').order('nombre');
      if (error) throw error;
      return data || [];
    },
    { staleTime: 5 * 60_000 }
  );

  const centerIdFilter = selectedCenter === 'todos' ? null : selectedCenter;

  const { data: devices = [] } = useQuery<Dispositivo[]>(
    ['dispositivos', centerIdFilter, 'importar'],
    () => list(centerIdFilter),
    { staleTime: 30_000, initialData: [] }
  );

  const { data: mappings = [] } = useQuery<EmpleadoDispositivoMap[]>(
    ['device-mappings', selectedDevice, 'importar'],
    () => listMappings(selectedDevice),
    { enabled: Boolean(selectedDevice), staleTime: 60_000 }
  );

  const mappedEmployees = useMemo(() => new Set((mappings || []).map((m) => m.en_no?.toString() ?? '')), [mappings]);
  const unmatchedPreview = useMemo(
    () => previewRows.filter((row) => row.enNo && !mappedEmployees.has(row.enNo)),
    [previewRows, mappedEmployees]
  );

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const parseTxtPreview = async (file: File): Promise<FichajePreviewRow[]> => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return [];
    const preview: FichajePreviewRow[] = [];
    let headerProcessed = false;
    for (const line of lines) {
      const parts = line.split(/\t+|,|\s{2,}/).map((part) => part.trim()).filter(Boolean);
      if (!parts.length) continue;
      if (!headerProcessed) {
        headerProcessed = /enno/i.test(parts.join('')) || /datetime/i.test(parts.join(''));
        if (headerProcessed) continue;
      }
      const dateMatch = line.match(/(\d{4}[\/-]\d{2}[\/-]\d{2}[ T]\d{2}:\d{2}(:\d{2})?)/);
      const fechaHora = dateMatch ? new Date(dateMatch[1].replace(/\//g, '-')).toISOString() : new Date().toISOString();
      const enNoCandidate = parts.find((value) => /^\d{1,10}$/.test(value)) || null;
      const modeCandidate = parts.find((value) => /^(IN|OUT|0|1|FINGER|CARD|FACE|\d{1,2})$/i.test(value)) || null;
      preview.push({
        enNo: enNoCandidate,
        fechaHora,
        mode: modeCandidate,
        source: file.name,
      });
      if (preview.length >= 200) break;
    }
    return preview;
  };

  const parseXlsPreview = async (file: File): Promise<FichajePreviewRow[]> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];
    const sheet = workbook.Sheets[sheetName];
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    return rows.slice(0, 200).map((row) => {
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
    } catch (error: any) {
      toast({ title: 'No se pudo leer el archivo', description: error?.message || 'Revisa el formato del archivo', variant: 'destructive' });
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
    } catch (error: any) {
      toast({ title: 'Error al importar', description: error?.message || 'Revisa el archivo y la asignación EnNo', variant: 'destructive' });
    }
  };

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

          <FichajesList rows={previewRows} compact />
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
