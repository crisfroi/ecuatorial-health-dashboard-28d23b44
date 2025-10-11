import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Settings2, Trash2 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useDispositivosFichaje, type Dispositivo } from '@/hooks/useAsistencia'; // Asegúrate de que esta ruta es correcta
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

import { DispositivoForm, type DispositivoFormValues } from './DispositivoForm';
import { MapeosProfesionalesDialog } from './MapeosProfesionalesDialog';

interface CentroOption {
  id: string;
  nombre: string;
}

export function DispositivosPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { list, create, update, remove } = useDispositivosFichaje();

  const [selectedCenter, setSelectedCenter] = useState<string>('todos');
  const [formOpen, setFormOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Dispositivo | null>(null);
  const [deviceToDelete, setDeviceToDelete] = useState<Dispositivo | null>(null);
  const [mappingDevice, setMappingDevice] = useState<Dispositivo | null>(null);

  // QUERY 1: Centros de salud
  const { data: centers = [], isLoading: centersLoading } = useQuery<CentroOption[]>({
    queryKey: ['centros-options'],
    queryFn: async () => {
      const { data, error } = await supabase.from('centros_salud').select('id, nombre').order('nombre');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000, // Los centros no cambian a menudo.
  });

  const centerIdFilter = selectedCenter === 'todos' ? null : selectedCenter;

  // QUERY 2: Dispositivos de fichaje (Principal)
  // **CAMBIO CLAVE: Se eliminó initialData: [] para forzar isLoading: true al inicio**
  const { data: devices, isLoading: devicesLoading } = useQuery<Dispositivo[]>({
    queryKey: ['dispositivos', centerIdFilter],
    queryFn: () => list(centerIdFilter),
    // OPTIMIZACIÓN: Reducir staleTime para que la lista se sienta más "fresca"
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });

  const sortedDevices = useMemo(
    // **AJUSTE CLAVE: Se utiliza 'devices ?? []' para asegurar que el array sea iterable**
    () => (devices ?? []).slice().sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [devices]
  );

  // MUTACIÓN DE CREACIÓN
  const createMutation = useMutation({
    // Recibe el payload pre-procesado del formulario (incluye tm_no como number | string | null)
    mutationFn: (values: DispositivoFormValues) => create(values), // ✅ CORREGIDO: Pasar 'values' completo
    onSuccess: () => {
      // OPTIMIZACIÓN: El invalidate es CRÍTICO para que el usuario vea su cambio de inmediato
      queryClient.invalidateQueries({ queryKey: ['dispositivos'] });
      toast({ title: 'Dispositivo creado' });
      setFormOpen(false);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Revise los datos ingresados';
      toast({ title: 'No se pudo crear', description: message, variant: 'destructive' });
    },
  });

  // MUTACIÓN DE ACTUALIZACIÓN
  const updateMutation = useMutation({
    // Recibe el payload pre-procesado del formulario (incluye tm_no como number | string | null)
    mutationFn: (payload: { id: string; values: DispositivoFormValues }) => update(payload.id, payload.values), // ✅ CORREGIDO: Pasar 'values' completo
    onSuccess: () => {
      // OPTIMIZACIÓN: El invalidate es CRÍTICO para que el usuario vea su cambio de inmediato
      queryClient.invalidateQueries({ queryKey: ['dispositivos'] });
      toast({ title: 'Dispositivo actualizado' });
      setFormOpen(false);
      setEditingDevice(null);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Intente nuevamente';
      toast({ title: 'No se pudo actualizar', description: message, variant: 'destructive' });
    },
  });

  // MUTACIÓN DE ELIMINACIÓN
  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispositivos'] });
      toast({ title: 'Dispositivo eliminado' });
      setDeviceToDelete(null);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Intente nuevamente';
      toast({ title: 'No se pudo eliminar', description: message, variant: 'destructive' });
    },
  });

  const centersOptions = useMemo(() => [{ id: 'todos', nombre: 'Todos los centros' }, ...centers], [centers]);

  const handleOpenForm = (device?: Dispositivo) => {
    setEditingDevice(device ?? null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: DispositivoFormValues) => {
    if (editingDevice) {
      // Nota: El payload que llega aquí ya fue transformado en DispositivoForm
      await updateMutation.mutateAsync({ id: editingDevice.id, values });
    } else {
      // Nota: El payload que llega aquí ya fue transformado en DispositivoForm
      await createMutation.mutateAsync(values);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Dispositivos biométricos</CardTitle>
              <CardDescription>Gestiona los dispositivos instalados por centro de salud.</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedCenter} onValueChange={setSelectedCenter}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Filtrar por centro" />
                </SelectTrigger>
                <SelectContent>
                  {centersOptions.map((centro) => (
                    <SelectItem key={centro.id} value={centro.id}>
                      {centro.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => handleOpenForm()}>
                <Plus className="mr-2 h-4 w-4" /> Nuevo dispositivo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {devicesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>TM No.</TableHead>
                    <TableHead>Centro</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[160px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDevices.length ? (
                    sortedDevices.map((device) => (
                      <TableRow key={device.id}>
                        <TableCell className="font-medium">{device.nombre}</TableCell>
                        <TableCell>{device.tm_no || 'N/A'}</TableCell>
                        <TableCell>{device.centro_salud_id ? centers.find((c) => c.id === device.centro_salud_id)?.nombre || '—' : 'Sin asignar'}</TableCell>
                        <TableCell>{device.ubicacion || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={device.activo ? 'default' : 'secondary'}>{device.activo ? 'Activo' : 'Inactivo'}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setMappingDevice(device)} title="Mapeos">
                              <Settings2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleOpenForm(device)} title="Editar">
                              <Settings2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeviceToDelete(device)} title="Eliminar" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                        No se encontraron dispositivos para este centro.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          {centersLoading
            ? 'Cargando centros...'
            : `${sortedDevices.length} dispositivo${sortedDevices.length === 1 ? '' : 's'} encontrados`}
        </CardFooter>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDevice ? 'Editar dispositivo' : 'Nuevo dispositivo'}</DialogTitle>
          </DialogHeader>
          <DispositivoForm
            initialValues={editingDevice || undefined}
            centers={centers}
            onSubmit={handleSubmit}
            onCancel={() => {
              setFormOpen(false);
              setEditingDevice(null);
            }}
            loading={createMutation.isLoading || updateMutation.isLoading}
            submitLabel={editingDevice ? 'Actualizar' : 'Crear'}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deviceToDelete} onOpenChange={(open) => !open && setDeviceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar dispositivo</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el dispositivo y sus mapeos asociados. ¿Desea continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deviceToDelete && deleteMutation.mutate(deviceToDelete.id)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MapeosProfesionalesDialog
        device={mappingDevice}
        open={!!mappingDevice}
        onOpenChange={(open) => {
          if (!open) setMappingDevice(null);
        }}
      />
    </div>
  );
}
