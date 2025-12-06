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
import { Plus, FileText, Clock, DollarSign } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface LicitacionFormData {
  numero_licitacion: string;
  titulo: string;
  descripcion: string;
  presupuesto_aproximado: number;
  fecha_apertura: string;
  fecha_cierre: string;
  tipo_licitacion: string;
  estado: string;
}

export function LicitacionesManager() {
  const { useLicitacionesQuery, crearLicitacionMutation } = useHosixCompras();
  const { data: licitaciones = [], isLoading } = useLicitacionesQuery();
  const [open, setOpen] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');

  const form = useForm<LicitacionFormData>({
    defaultValues: {
      tipo_licitacion: 'abierta',
      estado: 'borrador',
    },
  });

  const licitacionesFiltradas = licitaciones.filter((l: any) =>
    !filtroEstado || l.estado === filtroEstado
  );

  const onSubmit = async (data: LicitacionFormData) => {
    await crearLicitacionMutation.mutateAsync({
      ...data,
      presupuesto_aproximado: parseFloat(data.presupuesto_aproximado.toString()),
    } as any);
    form.reset();
    setOpen(false);
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'borrador':
        return <Badge className="bg-gray-500">Borrador</Badge>;
      case 'publicada':
        return <Badge className="bg-blue-500">Publicada</Badge>;
      case 'evaluacion':
        return <Badge className="bg-yellow-500">Evaluación</Badge>;
      case 'adjudicada':
        return <Badge className="bg-green-500">Adjudicada</Badge>;
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando licitaciones...</div>;
  }

  const estadisticas = {
    borrador: licitaciones.filter((l: any) => l.estado === 'borrador').length,
    publicada: licitaciones.filter((l: any) => l.estado === 'publicada').length,
    evaluacion: licitaciones.filter((l: any) => l.estado === 'evaluacion').length,
    adjudicada: licitaciones.filter((l: any) => l.estado === 'adjudicada').length,
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas por estado */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Borrador</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{estadisticas.borrador}</div>
            <p className="text-xs text-gray-500 mt-1">En preparación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Publicadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{estadisticas.publicada}</div>
            <p className="text-xs text-gray-500 mt-1">Abiertas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Evaluación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{estadisticas.evaluacion}</div>
            <p className="text-xs text-gray-500 mt-1">En análisis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Adjudicadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estadisticas.adjudicada}</div>
            <p className="text-xs text-gray-500 mt-1">Cerradas</p>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <div className="flex justify-between items-center gap-4">
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por estado..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los estados</SelectItem>
            <SelectItem value="borrador">Borrador</SelectItem>
            <SelectItem value="publicada">Publicada</SelectItem>
            <SelectItem value="evaluacion">Evaluación</SelectItem>
            <SelectItem value="adjudicada">Adjudicada</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Licitación
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-screen overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Licitación</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>Número Licitación *</Label>
                <Input
                  {...form.register('numero_licitacion', { required: true })}
                  placeholder="Ej: LICI-2025-001"
                />
              </div>

              <div>
                <Label>Título *</Label>
                <Input
                  {...form.register('titulo', { required: true })}
                  placeholder="Nombre de la licitación"
                />
              </div>

              <div>
                <Label>Descripción *</Label>
                <Textarea
                  {...form.register('descripcion', { required: true })}
                  placeholder="Descripción de la licitación..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Presupuesto Aproximado *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register('presupuesto_aproximado', { required: true, valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label>Tipo de Licitación</Label>
                  <Select value={form.watch('tipo_licitacion')} onValueChange={(v) => form.setValue('tipo_licitacion', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="abierta">Abierta</SelectItem>
                      <SelectItem value="restringida">Restringida</SelectItem>
                      <SelectItem value="directa">Negociación Directa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha Apertura *</Label>
                  <Input
                    type="date"
                    {...form.register('fecha_apertura', { required: true })}
                  />
                </div>

                <div>
                  <Label>Fecha Cierre *</Label>
                  <Input
                    type="date"
                    {...form.register('fecha_cierre', { required: true })}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">Crear Licitación</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de licitaciones */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Título</TableHead>
            <TableHead className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              Presupuesto
            </TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Cierre
            </TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {licitacionesFiltradas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                No hay licitaciones registradas
              </TableCell>
            </TableRow>
          ) : (
            licitacionesFiltradas.map((lic: any) => (
              <TableRow key={lic.id}>
                <TableCell className="font-medium">{lic.numero_licitacion}</TableCell>
                <TableCell>{lic.titulo}</TableCell>
                <TableCell>${(lic.presupuesto_aproximado / 1000).toFixed(1)}K</TableCell>
                <TableCell>
                  <Badge variant="outline">{lic.tipo_licitacion}</Badge>
                </TableCell>
                <TableCell>{new Date(lic.fecha_cierre).toLocaleDateString()}</TableCell>
                <TableCell>{getEstadoBadge(lic.estado)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    <FileText className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
