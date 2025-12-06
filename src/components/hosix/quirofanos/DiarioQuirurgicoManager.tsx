import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useHosixQuirofanos } from '@/hooks/useHosixQuirofanos';
import { Plus, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface DiarioFormData {
  programacion_id: string;
  sala_id: string;
  paciente_id: string;
  hora_inicio_real: string;
  hora_fin_real: string;
  procedimiento_realizado: string;
  hallazgos: string;
  complicaciones: string;
  evento_adverso: boolean;
  descripcion_evento: string;
  muestra_enviada: boolean;
  tipo_muestra: string;
  gasas_contadas: number;
  gasas_utilizadas: number;
  instrumentos_contados: number;
  todas_cuentas_ok: boolean;
  observaciones_cirugia: string;
}

export function DiarioQuirurgicoManager() {
  const { useProgramacionesQuery, useDiarioQuery, registrarDiarioMutation } = useHosixQuirofanos();
  const { data: programaciones = [] } = useProgramacionesQuery();
  const { data: diarios = [], isLoading } = useDiarioQuery();
  const [open, setOpen] = useState(false);
  const [filtroEvento, setFiltroEvento] = useState('');

  const form = useForm<DiarioFormData>({
    defaultValues: {
      evento_adverso: false,
      muestra_enviada: false,
      todas_cuentas_ok: true,
      gasas_contadas: 0,
      gasas_utilizadas: 0,
      instrumentos_contados: 0,
    },
  });

  const diariosFiltrados = diarios.filter((d: any) => {
    if (filtroEvento === 'con_evento' && !d.evento_adverso) return false;
    if (filtroEvento === 'sin_evento' && d.evento_adverso) return false;
    return true;
  });

  const onSubmit = async (data: DiarioFormData) => {
    await registrarDiarioMutation.mutateAsync({
      ...data,
      evento_adverso: data.evento_adverso || false,
      muestra_enviada: data.muestra_enviada || false,
      todas_cuentas_ok: data.todas_cuentas_ok || true,
      hora_inicio_real: new Date(`${new Date().toISOString().split('T')[0]}T${data.hora_inicio_real}`).toISOString(),
      hora_fin_real: new Date(`${new Date().toISOString().split('T')[0]}T${data.hora_fin_real}`).toISOString(),
    } as any);
    form.reset();
    setOpen(false);
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando diario quirúrgico...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div>
          <label className="flex items-center gap-2">
            <span className="text-sm font-medium">Filtrar por eventos:</span>
            <select
              value={filtroEvento}
              onChange={(e) => setFiltroEvento(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="">Todos</option>
              <option value="sin_evento">Sin eventos adversos</option>
              <option value="con_evento">Con eventos adversos</option>
            </select>
          </label>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-screen overflow-y-auto max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Procedimiento Quirúrgico</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Datos Básicos */}
              <div className="space-y-4 border-b pb-4">
                <h3 className="font-semibold">Datos Básicos</h3>
                <div>
                  <Label>Programación *</Label>
                  <Input
                    {...form.register('programacion_id', { required: true })}
                    placeholder="ID de programación"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Sala *</Label>
                    <Input
                      {...form.register('sala_id', { required: true })}
                      placeholder="ID de sala"
                    />
                  </div>
                  <div>
                    <Label>Paciente *</Label>
                    <Input
                      {...form.register('paciente_id', { required: true })}
                      placeholder="ID de paciente"
                    />
                  </div>
                </div>
              </div>

              {/* Tiempos */}
              <div className="space-y-4 border-b pb-4">
                <h3 className="font-semibold">Tiempos Quirúrgicos</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Hora Inicio *</Label>
                    <Input
                      type="time"
                      {...form.register('hora_inicio_real', { required: true })}
                    />
                  </div>
                  <div>
                    <Label>Hora Fin *</Label>
                    <Input
                      type="time"
                      {...form.register('hora_fin_real', { required: true })}
                    />
                  </div>
                </div>
              </div>

              {/* Procedimiento */}
              <div className="space-y-4 border-b pb-4">
                <h3 className="font-semibold">Procedimiento Realizado</h3>
                <div>
                  <Label>Procedimiento *</Label>
                  <Textarea
                    {...form.register('procedimiento_realizado', { required: true })}
                    placeholder="Describa el procedimiento realizado..."
                  />
                </div>
                <div>
                  <Label>Hallazgos</Label>
                  <Textarea
                    {...form.register('hallazgos')}
                    placeholder="Hallazgos durante la intervención..."
                  />
                </div>
                <div>
                  <Label>Complicaciones</Label>
                  <Textarea
                    {...form.register('complicaciones')}
                    placeholder="Complicaciones (si las hubo)..."
                  />
                </div>
              </div>

              {/* Eventos Adversos */}
              <div className="space-y-4 border-b pb-4">
                <h3 className="font-semibold">Eventos Adversos</h3>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="evento_adverso"
                    {...form.register('evento_adverso')}
                  />
                  <Label htmlFor="evento_adverso">Ocurrió evento adverso</Label>
                </div>
                {form.watch('evento_adverso') && (
                  <div>
                    <Label>Descripción del evento</Label>
                    <Textarea
                      {...form.register('descripcion_evento')}
                      placeholder="Describe el evento adverso..."
                    />
                  </div>
                )}
              </div>

              {/* Recuento Gasas e Instrumentos */}
              <div className="space-y-4 border-b pb-4">
                <h3 className="font-semibold">Recuento de Gasas e Instrumentos</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Gasas Contadas</Label>
                    <Input
                      type="number"
                      {...form.register('gasas_contadas', { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label>Gasas Utilizadas</Label>
                    <Input
                      type="number"
                      {...form.register('gasas_utilizadas', { valueAsNumber: true })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Instrumentos Contados</Label>
                  <Input
                    type="number"
                    {...form.register('instrumentos_contados', { valueAsNumber: true })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="cuentas_ok"
                    {...form.register('todas_cuentas_ok')}
                  />
                  <Label htmlFor="cuentas_ok">Todas las cuentas correctas</Label>
                </div>
              </div>

              {/* Muestras */}
              <div className="space-y-4 border-b pb-4">
                <h3 className="font-semibold">Muestras</h3>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="muestra_enviada"
                    {...form.register('muestra_enviada')}
                  />
                  <Label htmlFor="muestra_enviada">Se envió muestra a laboratorio</Label>
                </div>
                {form.watch('muestra_enviada') && (
                  <div>
                    <Label>Tipo de muestra</Label>
                    <Input
                      {...form.register('tipo_muestra')}
                      placeholder="Ej: Biopsia, Legrado, Masa..."
                    />
                  </div>
                )}
              </div>

              {/* Observaciones */}
              <div className="space-y-4">
                <h3 className="font-semibold">Observaciones Finales</h3>
                <div>
                  <Label>Observaciones del Cirujano</Label>
                  <Textarea
                    {...form.register('observaciones_cirugia')}
                    placeholder="Observaciones adicionales..."
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">Registrar Procedimiento</Button>
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
            <TableHead>Duración</TableHead>
            <TableHead>Eventos</TableHead>
            <TableHead>Muestras</TableHead>
            <TableHead>Cuentas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {diariosFiltrados.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                No hay registros en el diario quirúrgico
              </TableCell>
            </TableRow>
          ) : (
            diariosFiltrados.map((diario: any) => (
              <TableRow key={diario.id}>
                <TableCell className="font-medium">{diario.paciente?.nombre_completo || 'Paciente'}</TableCell>
                <TableCell>{diario.programacion?.tipo_procedimiento || 'Procedimiento'}</TableCell>
                <TableCell>{new Date(diario.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{diario.duracion_real ? `${diario.duracion_real} min` : '-'}</TableCell>
                <TableCell>
                  {diario.evento_adverso ? (
                    <Badge className="bg-red-500 gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Sí
                    </Badge>
                  ) : (
                    <Badge className="bg-green-500 gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      No
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {diario.muestra_enviada ? (
                    <Badge className="bg-blue-500">Sí - {diario.tipo_muestra}</Badge>
                  ) : (
                    <Badge className="bg-gray-300">No</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {diario.todas_cuentas_ok ? (
                    <Badge className="bg-green-500">OK</Badge>
                  ) : (
                    <Badge className="bg-red-500">Discrepancia</Badge>
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
