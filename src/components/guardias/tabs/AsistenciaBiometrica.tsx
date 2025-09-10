import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAsistencia, useDispositivosFichaje, Dispositivo } from '@/hooks/useAsistencia';
import { useAuth } from '@/contexts/AuthContext';
import { useGuardiasStore } from '@/stores/useGuardiasStore';
import { useToast } from '@/hooks/use-toast';
import { Plus, Upload, Save, RefreshCw } from 'lucide-react';

export const AsistenciaBiometrica: React.FC<{ selectedCenter: string | null }>
= ({ selectedCenter }) => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const { importFile, fetchLogsByRange, consolidateDaily, exportDAT } = useAsistencia();
  const { list, create } = useDispositivosFichaje();
  const { centros } = useGuardiasStore();

  const [devices, setDevices] = useState<Dispositivo[]>([]);
  const [deviceId, setDeviceId] = useState<string>('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceUbicacion, setNewDeviceUbicacion] = useState('');
  const [rangeFrom, setRangeFrom] = useState<string>(() => new Date(Date.now()-7*86400000).toISOString().slice(0,16));
  const [rangeTo, setRangeTo] = useState<string>(() => new Date().toISOString().slice(0,16));
  const [consolidated, setConsolidated] = useState<any[]>([]);
  const [savingDevice, setSavingDevice] = useState(false);
  const [consolidating, setConsolidating] = useState(false);
  const [exporting, setExporting] = useState(false);

  const centerId = selectedCenter || user?.assigned_center_id || null;

  const refreshDevices = async () => {
    const data = await list(centerId || undefined);
    setDevices(data);
    if (!deviceId && data[0]?.id) setDeviceId(data[0].id);
  };

  useEffect(() => { refreshDevices(); }, [centerId]);

  const handleCreateDevice = async () => {
    if (!newDeviceName.trim()) {
      toast({ title: 'Nombre requerido', description: 'Ingrese un nombre para el dispositivo', variant: 'destructive' });
      return;
    }
    setSavingDevice(true);
    try {
      const d = await create({ nombre: newDeviceName.trim(), ubicacion: newDeviceUbicacion.trim(), centro_salud_id: centerId || undefined, activo: true });
      setNewDeviceName(''); setNewDeviceUbicacion('');
      await refreshDevices();
      setDeviceId(d.id);
    } catch (e: any) {
      toast({ title: 'Error al registrar dispositivo', description: e?.message || 'Revise los permisos/tablas en Supabase', variant: 'destructive' });
    } finally {
      setSavingDevice(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files?.length) return;
    if (!deviceId) {
      toast({ title: 'Seleccione un dispositivo', description: 'Elija un dispositivo para asociar los fichajes', variant: 'destructive' });
      return;
    }
    const f = files[0];
    try {
      await importFile(deviceId, f);
      // Permitir re-seleccionar el mismo archivo
      e.currentTarget.value = '';
    } catch (err: any) {
      toast({ title: 'Error al importar', description: err?.message || 'Revise el formato del archivo y el dispositivo', variant: 'destructive' });
    }
  };

  const handleConsolidate = async () => {
    if (!deviceId) {
      toast({ title: 'Seleccione un dispositivo', description: 'Necesita un dispositivo para filtrar los fichajes', variant: 'destructive' });
      return;
    }
    setConsolidating(true);
    try {
      const fromISO = new Date(rangeFrom).toISOString();
      const toISO = new Date(rangeTo).toISOString();
      const logs = await fetchLogsByRange(fromISO, toISO, { deviceId });
      const entries = consolidateDaily(logs);
      setConsolidated(entries);
      if (!entries.length) {
        toast({ title: 'Sin datos', description: 'No se encontraron fichajes en el rango seleccionado' });
      }
    } catch (err: any) {
      toast({ title: 'Error al consolidar', description: err?.message || 'Verifique migraciones/tablas en Supabase', variant: 'destructive' });
    } finally {
      setConsolidating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dispositivos de Fichaje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={deviceId} onValueChange={setDeviceId}>
              <SelectTrigger className="min-w-[240px]">
                <SelectValue placeholder="Seleccionar dispositivo" />
              </SelectTrigger>
              <SelectContent>
                {devices.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.nombre}{d.ubicacion ? ` — ${d.ubicacion}` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={refreshDevices}><RefreshCw className="w-4 h-4 mr-1"/>Actualizar</Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Input placeholder="Nombre del dispositivo" value={newDeviceName} onChange={e => setNewDeviceName(e.target.value)} className="w-60" />
            <Input placeholder="Ubicación (opcional)" value={newDeviceUbicacion} onChange={e => setNewDeviceUbicacion(e.target.value)} className="w-60" />
            <Button onClick={handleCreateDevice}><Plus className="w-4 h-4 mr-1"/>Registrar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Importación de Fichajes (.TXT / .DAT)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Input type="file" accept=".txt,.dat,.csv" onChange={handleImport} className="max-w-sm" />
            <span className="text-sm text-gray-600">Asociaremos cada línea al dispositivo seleccionado.</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-sm">Desde</label>
            <Input type="datetime-local" value={rangeFrom} onChange={e => setRangeFrom(e.target.value)} className="w-56"/>
            <label className="text-sm">Hasta</label>
            <Input type="datetime-local" value={rangeTo} onChange={e => setRangeTo(e.target.value)} className="w-56"/>
            <Button onClick={handleConsolidate}><Upload className="w-4 h-4 mr-1"/>Consolidar</Button>
            <Button variant="outline" onClick={() => exportDAT(consolidated)} disabled={!consolidated.length}><Save className="w-4 h-4 mr-1"/>Exportar .DAT</Button>
          </div>

          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>EN No</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Salida</TableHead>
                  <TableHead>Total (h)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consolidated.map((c, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono">{c.en_no || '-'}</TableCell>
                    <TableCell>{c.fecha}</TableCell>
                    <TableCell>{c.entrada ? new Date(c.entrada).toLocaleTimeString() : '-'}</TableCell>
                    <TableCell>{c.salida ? new Date(c.salida).toLocaleTimeString() : '-'}</TableCell>
                    <TableCell>{typeof c.total_horas === 'number' ? c.total_horas.toFixed(2) : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
