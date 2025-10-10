import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CloudUpload, UserPlus } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useDispositivosFichaje, type Dispositivo, type EmpleadoDispositivoMap, useAsistencia } from '@/hooks/useAsistencia';
import { supabase } from '@/integrations/supabase/client';

interface ProfesionalRow {
  id: string;
  nombre_completo: string | null;
  id_profesional_unico: string | null;
  numero_tarjeta_rfid: string | null;
}

interface MapeosProfesionalesDialogProps {
  device: Dispositivo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProfessionalOption {
  id: string;
  nombre: string;
  empNo?: string | null;
  numero_tarjeta_rfid?: string | null;
}

export function MapeosProfesionalesDialog({ device, open, onOpenChange }: MapeosProfesionalesDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { listMappings, upsertMapping } = useDispositivosFichaje();
  const { importPersonalXls, importing } = useAsistencia();

  const [enNo, setEnNo] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setEnNo('');
      setSelectedProfessional('');
    }
  }, [open]);

  const {
    data: mappings = [],
    isLoading: mappingsLoading,
    refetch,
  } = useQuery<EmpleadoDispositivoMap[]>({
    queryKey: ['device-mappings', device?.id],
    queryFn: async () => {
      if (!device) return [];
      return listMappings(device.id);
    },
    enabled: open && !!device,
    staleTime: 60_000,
    initialData: [],
  });

  const { data: professionals = [] } = useQuery<ProfessionalOption[]>({
    queryKey: ['device-professionals', device?.centro_salud_id],
    queryFn: async () => {
      if (!device) return [];
      let query = supabase
        .from('profesionales_sanitarios')
        .select('id, nombre_completo, id_profesional_unico, numero_tarjeta_rfid')
        .order('nombre_completo', { ascending: true })
        .limit(200);
      if (device.centro_salud_id) {
        query = query.eq('centro_salud_id', device.centro_salud_id);
      }
      const { data, error } = await query.returns<ProfesionalRow[]>();
      if (error) throw error;
      return (data ?? []).map((professional) => ({
        id: professional.id,
        nombre: professional.nombre_completo || 'Sin nombre',
        empNo: professional.id_profesional_unico,
        numero_tarjeta_rfid: professional.numero_tarjeta_rfid,
      }));
    },
    enabled: open && !!device,
    staleTime: 120_000,
    initialData: [],
  });

  const professionalById = useMemo(() => {
    const map = new Map<string, ProfessionalOption>();
    (professionals || []).forEach((p) => map.set(p.id, p));
    return map;
  }, [professionals]);

  const handleSave = async () => {
    if (!device) return;
    const sanitizedEn = enNo.replace(/\D/g, '').slice(0, 10);
    if (!sanitizedEn) {
      toast({ title: 'Ingrese el EnNo', description: 'El número de empleado es obligatorio', variant: 'destructive' });
      return;
    }
    if (!selectedProfessional) {
      toast({ title: 'Seleccione un profesional', description: 'Debe elegir un profesional para asociar', variant: 'destructive' });
      return;
    }
    try {
      await upsertMapping(device.id, sanitizedEn, selectedProfessional);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['device-mappings', device.id] });
      toast({ title: 'Mapeo guardado', description: `${sanitizedEn} asignado correctamente` });
      setEnNo('');
      setSelectedProfessional('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Intente nuevamente';
      toast({ title: 'No se pudo guardar', description: message, variant: 'destructive' });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!device) return;
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await importPersonalXls(device.id, file, device.centro_salud_id ?? null);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['device-mappings', device.id] });
      toast({ title: 'Archivo procesado', description: `${file.name} importado correctamente` });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Revise el archivo Personal.xls';
      toast({ title: 'Error al importar', description: message, variant: 'destructive' });
    } finally {
      event.target.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Mapeo de profesionales</DialogTitle>
          <DialogDescription>
            Asigne profesionales al dispositivo biométrico y gestione los EnNo sincronizados con el hardware.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="enno">Número de empleado (EnNo)</Label>
              <Input
                id="enno"
                value={enNo}
                onChange={(event) => setEnNo(event.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                placeholder="Ej. 000123"
              />
            </div>
            <div className="space-y-2">
              <Label>Profesional</Label>
              <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un profesional" />
                </SelectTrigger>
                <SelectContent>
                  {professionals.map((professional) => (
                    <SelectItem key={professional.id} value={professional.id}>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{professional.nombre}</span>
                        <span className="text-xs text-muted-foreground">
                          EmpNo: {professional.empNo || '—'} · RFID: {professional.numero_tarjeta_rfid || '—'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-full flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Puede asignar manualmente un EnNo o importar el archivo Personal.xls exportado del dispositivo.
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleImportClick} disabled={!device || importing}>
                  <CloudUpload className="mr-2 h-4 w-4" /> Importar Personal.xls
                </Button>
                <Button onClick={handleSave} disabled={!device || !enNo || !selectedProfessional}>
                  <UserPlus className="mr-2 h-4 w-4" /> Guardar mapeo
                </Button>
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xls,.xlsx,.csv"
            className="hidden"
            onChange={handleImportFile}
            disabled={importing}
          />

          <div className="rounded-lg border">
            <ScrollArea className="max-h-80">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>EnNo</TableHead>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Tarjeta RFID</TableHead>
                    <TableHead>Actualización</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(mappingsLoading ? [] : mappings).map((mapping) => {
                    const professional = professionalById.get(mapping.id_profesional);
                    return (
                      <TableRow key={mapping.id}>
                        <TableCell className="font-medium">{mapping.en_no}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{professional?.nombre || mapping.id_profesional}</span>
                            <span className="text-xs text-muted-foreground">EmpNo: {professional?.empNo || '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {professional?.numero_tarjeta_rfid ? (
                            <Badge variant="secondary">{professional.numero_tarjeta_rfid}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{mapping.updated_at ? new Date(mapping.updated_at).toLocaleString() : '—'}</TableCell>
                      </TableRow>
                    );
                  })}
                  {!mappingsLoading && mappings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                        No hay profesionales mapeados todavía.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
