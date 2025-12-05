import React, { useState } from 'react';
import { useHosixAlmacenes } from '@/hooks/useHosixAlmacenes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { Movimiento } from '@/hooks/useHosixAlmacenes';

const TIPOS_MOVIMIENTO = [
  { value: 'entrada_compra', label: 'Entrada por Compra' },
  { value: 'entrada_devolucion', label: 'Entrada por Devolución' },
  { value: 'salida_compra', label: 'Salida a Compra' },
  { value: 'salida_paciente', label: 'Salida a Paciente' },
  { value: 'salida_consume', label: 'Salida por Consumo' },
  { value: 'transferencia', label: 'Transferencia entre Almacenes' },
  { value: 'ajuste', label: 'Ajuste de Inventario' },
  { value: 'devolucion_proveedor', label: 'Devolución a Proveedor' },
];

export default function MovimientosManager() {
  const { movimientos, crearMovimientoMutation, almacenes } = useHosixAlmacenes();

  const [isOpen, setIsOpen] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [formData, setFormData] = useState<Partial<Movimiento>>({
    tipo_movimiento: '',
    cantidad: 0,
    estado: 'registrado',
  });

  const movimientosFiltrados = movimientos.filter((m) =>
    !filtroTipo || m.tipo_movimiento === filtroTipo
  );

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tipo_movimiento || !formData.articulo_id || !formData.cantidad) {
      toast.error('Tipo de movimiento, artículo y cantidad son requeridos');
      return;
    }

    await crearMovimientoMutation.mutateAsync(formData as Omit<Movimiento, 'id' | 'created_at' | 'updated_at'>);
    setIsOpen(false);
    setFormData({ tipo_movimiento: '', cantidad: 0, estado: 'registrado' });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'registrado':
        return 'outline';
      case 'aprobado':
        return 'default';
      case 'rechazado':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Movimientos de Inventario</h2>
        <Button onClick={() => setIsOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo Movimiento
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los tipos</SelectItem>
            {TIPOS_MOVIMIENTO.map((tipo) => (
              <SelectItem key={tipo.value} value={tipo.value}>
                {tipo.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total Movimientos</p>
            <p className="text-3xl font-bold">{movimientosFiltrados.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Pendientes de Aprobación</p>
            <p className="text-3xl font-bold">
              {movimientosFiltrados.filter((m) => m.estado === 'registrado').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Aprobados</p>
            <p className="text-3xl font-bold">
              {movimientosFiltrados.filter((m) => m.estado === 'aprobado').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientosFiltrados.slice(0, 50).map((movimiento) => (
                  <TableRow key={movimiento.id}>
                    <TableCell className="font-medium text-sm">
                      {TIPOS_MOVIMIENTO.find((t) => t.value === movimiento.tipo_movimiento)?.label ||
                        movimiento.tipo_movimiento}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {movimiento.cantidad.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {movimiento.documento_referencia || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{movimiento.motivo || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getEstadoColor(movimiento.estado)}>
                        {movimiento.estado.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(movimiento.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Movimiento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGuardar} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Movimiento</label>
              <Select
                value={formData.tipo_movimiento || ''}
                onValueChange={(value) => setFormData({ ...formData, tipo_movimiento: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_MOVIMIENTO.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Cantidad</label>
              <Input
                type="number"
                step="0.01"
                value={formData.cantidad || ''}
                onChange={(e) => setFormData({ ...formData, cantidad: parseFloat(e.target.value) })}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Documento Referencia</label>
              <Input
                value={formData.documento_referencia || ''}
                onChange={(e) =>
                  setFormData({ ...formData, documento_referencia: e.target.value })
                }
                placeholder="OC-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Motivo</label>
              <Input
                value={formData.motivo || ''}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                placeholder="Motivo del movimiento"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Registrar Movimiento</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
