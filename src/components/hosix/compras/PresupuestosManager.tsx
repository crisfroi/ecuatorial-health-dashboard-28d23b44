import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useHosixCompras } from '@/hooks/useHosixCompras';
import { Plus, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface PresupuestoFormData {
  numero_presupuesto: string;
  centro_coste_id: string;
  monto_total: number;
  monto_utilizado?: number;
  ano_fiscal: number;
  estado: string;
}

export function PresupuestosManager() {
  const { usePresupuestosQuery, crearPresupuestoMutation } = useHosixCompras();
  const { data: presupuestos = [], isLoading } = usePresupuestosQuery();
  const [open, setOpen] = useState(false);
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear().toString());

  const form = useForm<PresupuestoFormData>({
    defaultValues: {
      ano_fiscal: new Date().getFullYear(),
      estado: 'activo',
      monto_utilizado: 0,
    },
  });

  const presupuestosFiltrados = presupuestos.filter((p: any) =>
    p.ano_fiscal.toString() === filtroAno
  );

  const presupuestoTotal = presupuestosFiltrados.reduce((sum: number, p: any) => sum + (p.monto_total || 0), 0);
  const presupuestoUtilizado = presupuestosFiltrados.reduce((sum: number, p: any) => sum + (p.monto_utilizado || 0), 0);
  const presupuestoDisponible = presupuestoTotal - presupuestoUtilizado;
  const porcentajeUtilizado = presupuestoTotal > 0 ? (presupuestoUtilizado / presupuestoTotal) * 100 : 0;

  const onSubmit = async (data: PresupuestoFormData) => {
    await crearPresupuestoMutation.mutateAsync({
      ...data,
      monto_utilizado: 0,
    } as any);
    form.reset();
    setOpen(false);
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando presupuestos...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Presupuesto Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(presupuestoTotal / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-gray-500 mt-1">Año {filtroAno}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Utilizado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${(presupuestoUtilizado / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-gray-500 mt-1">{porcentajeUtilizado.toFixed(1)}% del total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Disponible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${(presupuestoDisponible / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-gray-500 mt-1">{(100 - porcentajeUtilizado).toFixed(1)}% restante</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Presupuestos Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {presupuestosFiltrados.filter((p: any) => p.estado === 'activo').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">de {presupuestosFiltrados.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de progreso */}
      {presupuestoTotal > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Utilización General de Presupuesto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    porcentajeUtilizado > 90 ? 'bg-red-500' : porcentajeUtilizado > 75 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(porcentajeUtilizado, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">{porcentajeUtilizado.toFixed(1)}% utilizado</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controles */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <Label>Filtrar por Año Fiscal</Label>
          <Select value={filtroAno} onValueChange={setFiltroAno}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Presupuesto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Presupuesto</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>Número Presupuesto *</Label>
                <Input
                  {...form.register('numero_presupuesto', { required: true })}
                  placeholder="Ej: PRESP-2025-001"
                />
              </div>

              <div>
                <Label>Centro de Coste *</Label>
                <Input
                  {...form.register('centro_coste_id', { required: true })}
                  placeholder="ID del centro de coste"
                />
              </div>

              <div>
                <Label>Monto Total *</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register('monto_total', { required: true, valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label>Año Fiscal</Label>
                <Input
                  type="number"
                  {...form.register('ano_fiscal', { valueAsNumber: true })}
                />
              </div>

              <Button type="submit" className="w-full">Crear Presupuesto</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de presupuestos */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Centro de Coste</TableHead>
            <TableHead className="text-right">Monto Total</TableHead>
            <TableHead className="text-right">Utilizado</TableHead>
            <TableHead className="text-right">Disponible</TableHead>
            <TableHead>% Util.</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {presupuestosFiltrados.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                No hay presupuestos para el año {filtroAno}
              </TableCell>
            </TableRow>
          ) : (
            presupuestosFiltrados.map((p: any) => {
              const util = p.monto_total > 0 ? (p.monto_utilizado / p.monto_total) * 100 : 0;
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.numero_presupuesto}</TableCell>
                  <TableCell>{p.centro_coste_id}</TableCell>
                  <TableCell className="text-right">${(p.monto_total / 1000).toFixed(1)}K</TableCell>
                  <TableCell className="text-right">${(p.monto_utilizado / 1000).toFixed(1)}K</TableCell>
                  <TableCell className="text-right">${(p.monto_disponible / 1000).toFixed(1)}K</TableCell>
                  <TableCell>
                    <Badge className={util > 90 ? 'bg-red-500' : util > 75 ? 'bg-yellow-500' : 'bg-green-500'}>
                      {util.toFixed(0)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {p.estado === 'activo' ? (
                      <Badge className="bg-green-500 gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Activo
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-500">Inactivo</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
