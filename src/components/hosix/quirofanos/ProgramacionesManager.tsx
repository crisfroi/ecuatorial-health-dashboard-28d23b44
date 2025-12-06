import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useHosixQuirofanos } from '@/hooks/useHosixQuirofanos';
import { Plus, Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface ProgramacionFormData {
  sala_id: string;
  paciente_id: string;
  tipo_procedimiento: string;
  descripcion_procedimiento: string;
  diagnostico_principal: string;
  cirujano_principal_id: string;
  anestesiologo_id: string;
  fecha_programada: string;
  hora_entrada: string;
  duracion_estimada: number;
  prioridad: string;
  observaciones: string;
}

export function ProgramacionesManager() {
  const { useSalasQuery, useProgramacionesQuery, crearProgramacionMutation, actualizarEstadoProgramacionMutation, cancelarProgramacionMutation } = useHosixQuirofanos();
  const { data: salas = [] } = useSalasQuery();
  const { data: programaciones = [], isLoading } = useProgramacionesQuery();
  const [open, setOpen] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState('');

  const form = useForm<ProgramacionFormData>({
    defaultValues: {
      prioridad: 'normal',
      duracion_estimada: 120,
    },
  });

  const programacionesFiltradas = programaciones.filter((p: any) => {
    if (filtroEstado && p.estado !== filtroEstado) return false;
    if (filtroPrioridad && p.prioridad !== filtroPrioridad) return false;
    return true;
  });

  const onSubmit = async (data: ProgramacionFormData) => {
    await crearProgramacionMutation.mutateAsync({
      ...data,
      estado: 'programada',
      duracion_estimada: parseInt(data.duracion_estimada.toString()),
    } as any);
    form.reset();
    setOpen(false);
  };

  const handleCambiarEstado = async (id: string, estado: string) => {
    await actualizarEstadoProgramacionMutation.mutateAsync({ id, estado });
  };

  const handleCancelar = async (id: string) => {
    const motivo = prompt('Motivo de cancelación:');
    if (motivo) {
      await cancelarProgramacionMutation.mutateAsync({ id, motivo });
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'programada':
        return <Badge className="bg-blue-500">Programada</Badge>;
      case 'en_quirofano':
        return <Badge className="bg-orange-500">En Quirófano</Badge>;
      case 'completada':
        return <Badge className="bg-green-500">Completada</Badge>;
      case 'cancelada':
        return <Badge className="bg-red-500">Cancelada</Badge>;
      case 'suspendida':
        return <Badge className="bg-yellow-500">Suspendida</Badge>;
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'electiva':
        return 'text-blue-600 bg-blue-50';
      case 'urgente':
        return 'text-orange-600 bg-orange-50';
      case 'emergencia':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando programaciones...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="flex gap-4 flex-1">
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por estado..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los estados</SelectItem>
              <SelectItem value="programada">Programada</SelectItem>
              <SelectItem value="en_quirofano">En Quirófano</SelectItem>
              <SelectItem value="completada">Completada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroPrioridad} onValueChange={setFiltroPrioridad}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por prioridad..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              <SelectItem value="electiva">Electiva</SelectItem>
              <SelectItem value="urgente">Urgente</SelectItem>
              <SelectItem value="emergencia">Emergencia</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Programación
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-screen overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Programar Cirugía</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>Sala Quirúrgica *</Label>
                <Select value={form.watch('sala_id')} onValueChange={(v) => form.setValue('sala_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sala..." />
                  </SelectTrigger>
                  <SelectContent>
                    {salas.filter((s: any) => s.estado === 'operativa').map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Paciente *</Label>
                <Input
                  {...form.register('paciente_id', { required: true })}
                  placeholder="ID o documento del paciente"
                />
              </div>

              <div>
                <Label>Tipo Procedimiento *</Label>
                <Input
                  {...form.register('tipo_procedimiento', { required: true })}
                  placeholder="Ej: Apendicectomía"
                />
              </div>

              <div>
                <Label>Descripción Procedimiento</Label>
                <Textarea
                  {...form.register('descripcion_procedimiento')}
                  placeholder="Detalles del procedimiento..."
                />
              </div>

              <div>
                <Label>Diagnóstico Principal</Label>
                <Input
                  {...form.register('diagnostico_principal')}
                  placeholder="Ej: Apendicitis aguda"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cirujano Principal</Label>
                  <Input
                    {...form.register('cirujano_principal_id')}
                    placeholder="ID del cirujano"
                  />
                </div>
                <div>
                  <Label>Anestesiólogo</Label>
                  <Input
                    {...form.register('anestesiologo_id')}
                    placeholder="ID del anestesiólogo"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha Programada *</Label>
                  <Input
                    type="date"
                    {...form.register('fecha_programada', { required: true })}
                  />
                </div>
                <div>
                  <Label>Hora Entrada *</Label>
                  <Input
                    type="time"
                    {...form.register('hora_entrada', { required: true })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Duración Estimada (minutos)</Label>
                  <Input
                    type="number"
                    {...form.register('duracion_estimada', { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label>Prioridad</Label>
                  <Select value={form.watch('prioridad')} onValueChange={(v) => form.setValue('prioridad', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electiva">Electiva</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                      <SelectItem value="emergencia">Emergencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Observaciones</Label>
                <Textarea
                  {...form.register('observaciones')}
                  placeholder="Observaciones especiales..."
                />
              </div>

              <Button type="submit" className="w-full">Programar Cirugía</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Paciente</TableHead>
            <TableHead>Procedimiento</TableHead>
            <TableHead className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Fecha
            </TableHead>
            <TableHead className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Hora
            </TableHead>
            <TableHead>Cirujano</TableHead>
            <TableHead>Prioridad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {programacionesFiltradas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                No hay programaciones quirúrgicas
              </TableCell>
            </TableRow>
          ) : (
            programacionesFiltradas.map((prog: any) => (
              <TableRow key={prog.id}>
                <TableCell className="font-medium">{prog.paciente?.nombre_completo || 'Paciente'}</TableCell>
                <TableCell>{prog.tipo_procedimiento}</TableCell>
                <TableCell>{prog.fecha_programada}</TableCell>
                <TableCell>{prog.hora_entrada}</TableCell>
                <TableCell>{prog.cirujano?.nombre_completo || '-'}</TableCell>
                <TableCell>
                  <Badge className={`${getPrioridadColor(prog.prioridad)}`}>
                    {prog.prioridad}
                  </Badge>
                </TableCell>
                <TableCell>{getEstadoBadge(prog.estado)}</TableCell>
                <TableCell className="text-right space-x-2">
                  {prog.estado === 'programada' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCambiarEstado(prog.id, 'en_quirofano')}
                      >
                        Iniciar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelar(prog.id)}
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                  {prog.estado === 'en_quirofano' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCambiarEstado(prog.id, 'completada')}
                    >
                      Completar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
