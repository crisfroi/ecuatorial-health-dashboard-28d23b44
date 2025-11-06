import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { CloudUpload, UserPlus, Trash2, Check } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
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
  selected?: boolean;
}

export function MapeosProfesionalesMultiple({ device, open, onOpenChange }: MapeosProfesionalesDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { listMappings, upsertMapping } = useDispositivosFichaje();
  const { importPersonalXls, importing } = useAsistencia();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfessionals, setSelectedProfessionals] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setSelectedProfessionals(new Set());
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

  const filteredProfessionals = useMemo(() => {
    if (!searchTerm) return professionals;
    const term = searchTerm.toLowerCase();
    return professionals.filter(
      (p) =>
        p.nombre.toLowerCase().includes(term) ||
        p.empNo?.toLowerCase().includes(term) ||
        p.numero_tarjeta_rfid?.toLowerCase().includes(term)
    );
  }, [professionals, searchTerm]);

  const toggleSelection = (professionalId: string) => {
    setSelectedProfessionals((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(professionalId)) {
        newSet.delete(professionalId);
      } else {
        newSet.add(professionalId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedProfessionals(new Set(filteredProfessionals.map((p) => p.id)));
  };

  const deselectAll = () => {
    setSelectedProfessionals(new Set());
  };

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!device || selectedProfessionals.size === 0) {
        throw new Error('Seleccione al menos un profesional');
      }

      // Obtener el próximo enroll_id disponible
      const lastMapping = mappings.reduce((max, m) => {
        const enrollId = parseInt(m.en_no || '0', 10);
        return enrollId > max ? enrollId : max;
      }, 0);

      let nextEnrollId = lastMapping + 1;
      const results = [];

      for (const professionalId of Array.from(selectedProfessionals)) {
        const enNo = String(nextEnrollId).padStart(6, '0');
        await upsertMapping(device.id, enNo, professionalId);
        results.push({ enNo, professionalId });
        nextEnrollId++;
      }

      return results;
    },
    onSuccess: async (results) => {
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['device-mappings', device?.id] });
      toast({
        title: 'Profesionales asignados',
        description: `${results.length} profesionales asignados correctamente`,
      });
      setSelectedProfessionals(new Set());
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Intente nuevamente';
      toast({ title: 'Error al asignar', description: message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (mappingId: string) => {
      const { error } = await supabase
        .from('empleado_dispositivo_map')
        .delete()
        .eq('id', mappingId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['device-mappings', device?.id] });
      toast({ title: 'Mapeo eliminado' });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Error al eliminar';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ['device-mappings', device?.id] });
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Mapeo de profesionales</DialogTitle>
          <DialogDescription>
            Seleccione profesionales y asígnelos al dispositivo biométrico de forma masiva
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto">
          {/* Sección de selección */}
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <Label>Seleccionar profesionales</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll} disabled={filteredProfessionals.length === 0}>
                  Seleccionar todos
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll} disabled={selectedProfessionals.size === 0}>
                  Deseleccionar todos
                </Button>
              </div>
            </div>

            <Input
              placeholder="Buscar por nombre, EmpNo o RFID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <ScrollArea className="h-64 rounded-md border">
              <div className="p-4 space-y-2">
                {filteredProfessionals.map((professional) => (
                  <div
                    key={professional.id}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => toggleSelection(professional.id)}
                  >
                    <Checkbox
                      checked={selectedProfessionals.has(professional.id)}
                      onCheckedChange={() => toggleSelection(professional.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{professional.nombre}</div>
                      <div className="text-xs text-muted-foreground">
                        EmpNo: {professional.empNo || '—'} · RFID: {professional.numero_tarjeta_rfid || '—'}
                      </div>
                    </div>
                    {selectedProfessionals.has(professional.id) && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                ))}

                {filteredProfessionals.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    No se encontraron profesionales
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {selectedProfessionals.size} profesional{selectedProfessionals.size !== 1 ? 'es' : ''} seleccionado{selectedProfessionals.size !== 1 ? 's' : ''}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleImportClick} disabled={!device || importing}>
                  <CloudUpload className="mr-2 h-4 w-4" /> Importar Personal.xls
                </Button>
                <Button
                  onClick={() => assignMutation.mutate()}
                  disabled={!device || selectedProfessionals.size === 0 || assignMutation.isPending}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Asignar {selectedProfessionals.size > 0 ? `(${selectedProfessionals.size})` : ''}
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

          {/* Tabla de mapeos existentes */}
          <div className="rounded-lg border">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Profesionales asignados ({mappings.length})</h3>
            </div>
            <ScrollArea className="max-h-80">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>EnNo</TableHead>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Tarjeta RFID</TableHead>
                    <TableHead>Actualización</TableHead>
                    <TableHead className="w-[80px]">Acciones</TableHead>
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
                        <TableCell className="text-xs text-muted-foreground">
                          {mapping.updated_at ? new Date(mapping.updated_at).toLocaleString() : '—'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(mapping.id)}
                            disabled={deleteMutation.isPending}
                            title="Eliminar mapeo"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!mappingsLoading && mappings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
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
