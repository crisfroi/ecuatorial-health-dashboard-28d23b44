import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useHosixCompras } from '@/hooks/useHosixCompras';
import { Plus, Star, TrendingDown, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface OfertaFormData {
  licitacion_id: string;
  proveedor_id: string;
  monto_ofertado: number;
  plazo_entrega: number;
  condiciones_pago: string;
  puntuacion_tecnica?: number;
  puntuacion_precio?: number;
  estado: string;
}

export function OfertasManager() {
  const { useOfertasQuery, crearOfertaMutation } = useHosixCompras();
  const { data: ofertas = [], isLoading } = useOfertasQuery();
  const [open, setOpen] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');

  const form = useForm<OfertaFormData>({
    defaultValues: {
      estado: 'recibida',
      plazo_entrega: 30,
    },
  });

  const ofertasFiltradas = ofertas.filter((o: any) =>
    !filtroEstado || o.estado === filtroEstado
  );

  const onSubmit = async (data: OfertaFormData) => {
    await crearOfertaMutation.mutateAsync({
      ...data,
      monto_ofertado: parseFloat(data.monto_ofertado.toString()),
      puntuacion_tecnica: data.puntuacion_tecnica || 0,
      puntuacion_precio: data.puntuacion_precio || 0,
    } as any);
    form.reset();
    setOpen(false);
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'recibida':
        return <Badge className="bg-blue-500">Recibida</Badge>;
      case 'evaluada':
        return <Badge className="bg-yellow-500">Evaluada</Badge>;
      case 'seleccionada':
        return <Badge className="bg-green-500">Seleccionada</Badge>;
      case 'rechazada':
        return <Badge className="bg-red-500">Rechazada</Badge>;
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  const calcularPuntuacionTotal = (tecnica: number, precio: number) => {
    return (tecnica * 0.6 + precio * 0.4).toFixed(2);
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando ofertas...</div>;
  }

  const estadisticas = {
    recibida: ofertas.filter((o: any) => o.estado === 'recibida').length,
    evaluada: ofertas.filter((o: any) => o.estado === 'evaluada').length,
    seleccionada: ofertas.filter((o: any) => o.estado === 'seleccionada').length,
    rechazada: ofertas.filter((o: any) => o.estado === 'rechazada').length,
  };

  const montoTotal = ofertas.reduce((sum: number, o: any) => sum + (o.monto_ofertado || 0), 0);
  const montoPromedio = ofertas.length > 0 ? montoTotal / ofertas.length : 0;
  const ofertaMasEconomica = ofertas.length > 0 ? Math.min(...ofertas.map((o: any) => o.monto_ofertado || 0)) : 0;

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Ofertas Recibidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{estadisticas.recibida}</div>
            <p className="text-xs text-gray-500 mt-1">En revisión</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Monto Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(montoPromedio / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-gray-500 mt-1">De {ofertas.length} ofertas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Más Económica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${(ofertaMasEconomica / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-gray-500 mt-1">Menor precio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Seleccionadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{estadisticas.seleccionada}</div>
            <p className="text-xs text-gray-500 mt-1">Ganador</p>
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
            <option value="">Todas las ofertas</option>
            <option value="recibida">Recibidas</option>
            <option value="evaluada">Evaluadas</option>
            <option value="seleccionada">Seleccionadas</option>
            <option value="rechazada">Rechazadas</option>
          </select>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Registrar Oferta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nueva Oferta</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>Licitación *</Label>
                <Input
                  {...form.register('licitacion_id', { required: true })}
                  placeholder="ID de la licitación"
                />
              </div>

              <div>
                <Label>Proveedor *</Label>
                <Input
                  {...form.register('proveedor_id', { required: true })}
                  placeholder="ID o nombre del proveedor"
                />
              </div>

              <div>
                <Label>Monto Ofertado *</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register('monto_ofertado', { required: true, valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label>Plazo Entrega (días)</Label>
                <Input
                  type="number"
                  {...form.register('plazo_entrega', { valueAsNumber: true })}
                />
              </div>

              <div>
                <Label>Condiciones de Pago</Label>
                <Textarea
                  {...form.register('condiciones_pago')}
                  placeholder="Ej: 50% adelanto, 50% contra entrega"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Puntuación Técnica (0-100)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    {...form.register('puntuacion_tecnica', { valueAsNumber: true })}
                  />
                </div>

                <div>
                  <Label>Puntuación Precio (0-100)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    {...form.register('puntuacion_precio', { valueAsNumber: true })}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">Registrar Oferta</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de ofertas */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Proveedor</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead>Plazo (días)</TableHead>
            <TableHead>Puntuación Técnica</TableHead>
            <TableHead>Puntuación Precio</TableHead>
            <TableHead>Puntuación Total</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ofertasFiltradas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                No hay ofertas registradas
              </TableCell>
            </TableRow>
          ) : (
            ofertasFiltradas
              .sort((a: any, b: any) => {
                const puntuacionA = calcularPuntuacionTotal(a.puntuacion_tecnica || 0, a.puntuacion_precio || 0);
                const puntuacionB = calcularPuntuacionTotal(b.puntuacion_tecnica || 0, b.puntuacion_precio || 0);
                return parseFloat(puntuacionB) - parseFloat(puntuacionA);
              })
              .map((oferta: any, idx: number) => {
                const puntuacionTotal = calcularPuntuacionTotal(oferta.puntuacion_tecnica || 0, oferta.puntuacion_precio || 0);
                return (
                  <TableRow key={oferta.id} className={idx === 0 && oferta.estado === 'seleccionada' ? 'bg-green-50' : ''}>
                    <TableCell className="font-medium">{oferta.proveedor_id}</TableCell>
                    <TableCell className="text-right font-semibold">
                      ${(oferta.monto_ofertado / 1000).toFixed(1)}K
                    </TableCell>
                    <TableCell>{oferta.plazo_entrega}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                        {oferta.puntuacion_tecnica || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TrendingDown className="h-4 w-4 text-blue-500" />
                        {oferta.puntuacion_precio || 0}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-purple-600">{puntuacionTotal}</TableCell>
                    <TableCell>{getEstadoBadge(oferta.estado)}</TableCell>
                  </TableRow>
                );
              })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
