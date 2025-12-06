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
import { useHosixCompras } from '@/hooks/useHosixCompras';
import { Plus, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface AdjudicacionFormData {
  licitacion_id: string;
  oferta_id: string;
  proveedor_id: string;
  monto_adjudicado: number;
  plazo_entrega: number;
  observaciones: string;
  supervisor_id: string;
  estado: string;
}

export function AdjudicacionesManager() {
  const { useAdjudicacionesQuery, crearAdjudicacionMutation } = useHosixCompras();
  const { data: adjudicaciones = [], isLoading } = useAdjudicacionesQuery();
  const [open, setOpen] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');

  const form = useForm<AdjudicacionFormData>({
    defaultValues: {
      estado: 'vigente',
    },
  });

  const adjudicacionesFiltradas = adjudicaciones.filter((a: any) =>
    !filtroEstado || a.estado === filtroEstado
  );

  const onSubmit = async (data: AdjudicacionFormData) => {
    await crearAdjudicacionMutation.mutateAsync({
      ...data,
      monto_adjudicado: parseFloat(data.monto_adjudicado.toString()),
      plazo_entrega: parseInt(data.plazo_entrega.toString()),
    } as any);
    form.reset();
    setOpen(false);
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'vigente':
        return <Badge className="bg-green-500">Vigente</Badge>;
      case 'en_ejecucion':
        return <Badge className="bg-blue-500">En Ejecución</Badge>;
      case 'completada':
        return <Badge className="bg-purple-500">Completada</Badge>;
      case 'suspendida':
        return <Badge className="bg-yellow-500">Suspendida</Badge>;
      case 'cancelada':
        return <Badge className="bg-red-500">Cancelada</Badge>;
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando adjudicaciones...</div>;
  }

  const estadisticas = {
    vigente: adjudicaciones.filter((a: any) => a.estado === 'vigente').length,
    en_ejecucion: adjudicaciones.filter((a: any) => a.estado === 'en_ejecucion').length,
    completada: adjudicaciones.filter((a: any) => a.estado === 'completada').length,
    cancelada: adjudicaciones.filter((a: any) => a.estado === 'cancelada').length,
  };

  const montoTotalAdjudicado = adjudicaciones.reduce((sum: number, a: any) => sum + (a.monto_adjudicado || 0), 0);
  const montoEjecucion = adjudicaciones
    .filter((a: any) => a.estado === 'en_ejecucion')
    .reduce((sum: number, a: any) => sum + (a.monto_adjudicado || 0), 0);

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Adjudicado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(montoTotalAdjudicado / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-gray-500 mt-1">{adjudicaciones.length} adjudicaciones</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">En Ejecución</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${(montoEjecucion / 1000).toFixed(1)}K</div>
            <p className="text-xs text-gray-500 mt-1">{estadisticas.en_ejecucion} adjudicaciones</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estadisticas.completada}</div>
            <p className="text-xs text-gray-500 mt-1">Procesos finalizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Canceladas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{estadisticas.cancelada}</div>
            <p className="text-xs text-gray-500 mt-1">Procesos cancelados</p>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <Label>Filtrar por estado</Label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border rounded px-3 py-2 w-48"
          >
            <option value="">Todas las adjudicaciones</option>
            <option value="vigente">Vigentes</option>
            <option value="en_ejecucion">En Ejecución</option>
            <option value="completada">Completadas</option>
            <option value="suspendida">Suspendidas</option>
            <option value="cancelada">Canceladas</option>
          </select>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Adjudicación
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-screen overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Adjudicación</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Licitación *</Label>
                  <Input
                    {...form.register('licitacion_id', { required: true })}
                    placeholder="ID de licitación"
                  />
                </div>

                <div>
                  <Label>Oferta *</Label>
                  <Input
                    {...form.register('oferta_id', { required: true })}
                    placeholder="ID de oferta"
                  />
                </div>
              </div>

              <div>
                <Label>Proveedor Ganador *</Label>
                <Input
                  {...form.register('proveedor_id', { required: true })}
                  placeholder="ID o nombre del proveedor"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Monto Adjudicado *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register('monto_adjudicado', { required: true, valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label>Plazo Entrega (días) *</Label>
                  <Input
                    type="number"
                    {...form.register('plazo_entrega', { required: true, valueAsNumber: true })}
                  />
                </div>
              </div>

              <div>
                <Label>Supervisor *</Label>
                <Input
                  {...form.register('supervisor_id', { required: true })}
                  placeholder="ID del supervisor"
                />
              </div>

              <div>
                <Label>Observaciones</Label>
                <Textarea
                  {...form.register('observaciones')}
                  placeholder="Notas sobre la adjudicación..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full">Registrar Adjudicación</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de adjudicaciones */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Licitación</TableHead>
            <TableHead>Proveedor Ganador</TableHead>
            <TableHead className="text-right">Monto Adjudicado</TableHead>
            <TableHead className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Plazo
            </TableHead>
            <TableHead>Supervisor</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {adjudicacionesFiltradas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                No hay adjudicaciones registradas
              </TableCell>
            </TableRow>
          ) : (
            adjudicacionesFiltradas.map((adj: any) => (
              <TableRow key={adj.id} className={adj.estado === 'vigente' ? 'bg-green-50' : ''}>
                <TableCell className="font-medium">{adj.licitacion_id}</TableCell>
                <TableCell>{adj.proveedor_id}</TableCell>
                <TableCell className="text-right font-bold">
                  ${(adj.monto_adjudicado / 1000).toFixed(1)}K
                </TableCell>
                <TableCell>{adj.plazo_entrega} días</TableCell>
                <TableCell>{adj.supervisor_id}</TableCell>
                <TableCell>{getEstadoBadge(adj.estado)}</TableCell>
                <TableCell className="text-right">
                  {adj.estado === 'vigente' && (
                    <Select
                      defaultValue={adj.estado}
                      onValueChange={(newEstado) => {
                        // Actualizar estado
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en_ejecucion">En Ejecución</SelectItem>
                        <SelectItem value="completada">Completada</SelectItem>
                        <SelectItem value="suspendida">Suspender</SelectItem>
                        <SelectItem value="cancelada">Cancelar</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {adj.estado === 'en_ejecucion' && (
                    <Button variant="outline" size="sm" className="gap-1">
                      <CheckCircle className="h-4 w-4" />
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
