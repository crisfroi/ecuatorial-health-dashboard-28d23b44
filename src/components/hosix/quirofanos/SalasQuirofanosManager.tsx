import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useHosixQuirofanos } from '@/hooks/useHosixQuirofanos';
import { Plus, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface SalaFormData {
  bloque_id: string;
  numero_sala: number;
  nombre: string;
  tipo_procedimiento: string;
  capacidad_personal: number;
  tiene_anestesia: boolean;
  tiene_monitor_cardiaco: boolean;
  tiene_aspiracion: boolean;
  tiene_rayos_x: boolean;
  tiene_laparoscopia: boolean;
}

export function SalasQuirofanosManager() {
  const { useBloquesQuery, useSalasQuery, actualizarSalaMutation } = useHosixQuirofanos();
  const { data: bloques = [] } = useBloquesQuery();
  const { data: salas = [], isLoading } = useSalasQuery();
  const [open, setOpen] = useState(false);
  const [filtroBloque, setFiltroBloque] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('');

  const form = useForm<SalaFormData>({
    defaultValues: {
      numero_sala: 1,
      capacidad_personal: 8,
      tiene_anestesia: true,
      tiene_monitor_cardiaco: true,
      tiene_aspiracion: true,
    },
  });

  const salasFiltradas = salas.filter((s) => {
    if (filtroBloque && s.bloque_id !== filtroBloque) return false;
    if (filtroEstado && s.estado !== filtroEstado) return false;
    return true;
  });

  const onSubmit = async (data: SalaFormData) => {
    // Crear nueva sala (requeriría mutación adicional)
    form.reset();
    setOpen(false);
  };

  const handleDesinfeccion = async (salaId: string) => {
    await actualizarSalaMutation.mutateAsync({
      id: salaId,
      ultima_desinfeccion: new Date().toISOString(),
    });
  };

  const handleCambiarEstado = async (salaId: string, nuevoEstado: string) => {
    await actualizarSalaMutation.mutateAsync({
      id: salaId,
      estado: nuevoEstado,
    });
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'operativa':
        return <Badge className="bg-green-500">Operativa</Badge>;
      case 'mantenimiento':
        return <Badge className="bg-yellow-500">Mantenimiento</Badge>;
      case 'fuera_servicio':
        return <Badge className="bg-red-500">Fuera de Servicio</Badge>;
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando salas...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="flex gap-4 flex-1">
          <Select value={filtroBloque} onValueChange={setFiltroBloque}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por bloque..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los bloques</SelectItem>
              {bloques.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por estado..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los estados</SelectItem>
              <SelectItem value="operativa">Operativa</SelectItem>
              <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
              <SelectItem value="fuera_servicio">Fuera de Servicio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Sala
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Sala Quirúrgica</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>Bloque *</Label>
                <Select value={form.watch('bloque_id')} onValueChange={(v) => form.setValue('bloque_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar bloque..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bloques.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Número Sala *</Label>
                  <Input
                    type="number"
                    {...form.register('numero_sala', { required: true, valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label>Nombre Sala</Label>
                  <Input
                    {...form.register('nombre')}
                    placeholder="Ej: Sala 201A"
                  />
                </div>
              </div>

              <div>
                <Label>Tipo Procedimiento</Label>
                <Input
                  {...form.register('tipo_procedimiento')}
                  placeholder="Ej: general, traumatología, cardiovascular"
                />
              </div>

              <div>
                <Label>Capacidad Personal</Label>
                <Input
                  type="number"
                  {...form.register('capacidad_personal', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label>Equipamiento</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="anestesia"
                      {...form.register('tiene_anestesia')}
                    />
                    <Label htmlFor="anestesia">Anestesia</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="monitor"
                      {...form.register('tiene_monitor_cardiaco')}
                    />
                    <Label htmlFor="monitor">Monitor Cardíaco</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="aspiracion"
                      {...form.register('tiene_aspiracion')}
                    />
                    <Label htmlFor="aspiracion">Aspiración</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="rayos_x"
                      {...form.register('tiene_rayos_x')}
                    />
                    <Label htmlFor="rayos_x">Rayos X</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="laparoscopia"
                      {...form.register('tiene_laparoscopia')}
                    />
                    <Label htmlFor="laparoscopia">Laparoscopia</Label>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full">Crear Sala</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Bloque</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Equipamiento</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {salasFiltradas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                No hay salas quirúrgicas registradas
              </TableCell>
            </TableRow>
          ) : (
            salasFiltradas.map((sala) => (
              <TableRow key={sala.id}>
                <TableCell className="font-medium">{sala.nombre}</TableCell>
                <TableCell>{sala.bloque_id}</TableCell>
                <TableCell>{sala.tipo_procedimiento || '-'}</TableCell>
                <TableCell>{getEstadoBadge(sala.estado)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {sala.tiene_anestesia && <Zap className="h-3 w-3 text-blue-500" />}
                    {sala.tiene_monitor_cardiaco && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                    {sala.tiene_laparoscopia && <AlertCircle className="h-3 w-3 text-purple-500" />}
                  </div>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDesinfeccion(sala.id)}
                  >
                    Desinfectar
                  </Button>
                  <Select value={sala.estado} onValueChange={(v) => handleCambiarEstado(sala.id, v)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operativa">Operativa</SelectItem>
                      <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                      <SelectItem value="fuera_servicio">Fuera Servicio</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
