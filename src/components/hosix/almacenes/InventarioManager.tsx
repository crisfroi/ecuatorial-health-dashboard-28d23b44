import React, { useState } from 'react';
import { useHosixAlmacenes, type Inventario } from '@/hooks/useHosixAlmacenes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function InventarioManager() {
  const {
    almacenes,
    inventarios,
    crearInventarioMutation,
    actualizarInventarioMutation,
  } = useHosixAlmacenes();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [formData, setFormData] = useState<Partial<Inventario>>({
    numero_inventario: '',
    estado: 'planificado',
    cantidad_articulos: 0,
    diferencias_encontradas: 0,
  });
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState<string>('');

  const inventariosFiltrados = inventarios.filter((inv) => {
    const estadoMatch = !filtroEstado || inv.estado === filtroEstado;
    return estadoMatch;
  });

  const handleAbrirFormulario = (inventario?: Inventario) => {
    if (inventario) {
      setEditingId(inventario.id);
      setAlmacenSeleccionado(inventario.almacen_id);
      setFormData(inventario);
    } else {
      setEditingId(null);
      setAlmacenSeleccionado('');
      setFormData({
        numero_inventario: '',
        estado: 'planificado',
        cantidad_articulos: 0,
        diferencias_encontradas: 0,
      });
    }
    setIsOpen(true);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.numero_inventario || !almacenSeleccionado) {
      toast.error('Número de inventario y almacén son requeridos');
      return;
    }

    const dataToSave = {
      ...formData,
      almacen_id: almacenSeleccionado,
      ...(editingId ? {} : { usuarios_inventariadores: [] }),
    };

    if (editingId) {
      await actualizarInventarioMutation.mutateAsync({
        id: editingId,
        updates: dataToSave as Partial<Inventario>,
      });
    } else {
      await crearInventarioMutation.mutateAsync(
        dataToSave as Omit<Inventario, 'id' | 'created_at' | 'updated_at'>
      );
    }

    setIsOpen(false);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'planificado':
        return 'outline';
      case 'en_proceso':
        return 'secondary';
      case 'cerrado':
        return 'default';
      case 'regularizado':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Inventarios Físicos</h2>
        <Button onClick={() => handleAbrirFormulario()} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo Inventario
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los estados</SelectItem>
            <SelectItem value="planificado">Planificado</SelectItem>
            <SelectItem value="en_proceso">En Proceso</SelectItem>
            <SelectItem value="cerrado">Cerrado</SelectItem>
            <SelectItem value="regularizado">Regularizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total Inventarios</p>
            <p className="text-3xl font-bold">{inventariosFiltrados.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Planificados</p>
            <p className="text-3xl font-bold">
              {inventariosFiltrados.filter((i) => i.estado === 'planificado').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">En Proceso</p>
            <p className="text-3xl font-bold">
              {inventariosFiltrados.filter((i) => i.estado === 'en_proceso').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Cerrados</p>
            <p className="text-3xl font-bold">
              {inventariosFiltrados.filter((i) => i.estado === 'cerrado').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Inventarios Programados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Almacén</TableHead>
                  <TableHead className="text-right">Artículos</TableHead>
                  <TableHead className="text-right">Diferencias</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Cierre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventariosFiltrados.map((inventario) => {
                  const almacen = almacenes.find((a) => a.id === inventario.almacen_id);
                  return (
                    <TableRow key={inventario.id}>
                      <TableCell className="font-mono font-medium">{inventario.numero_inventario}</TableCell>
                      <TableCell className="text-sm">{almacen?.nombre || '-'}</TableCell>
                      <TableCell className="text-right font-mono">
                        {inventario.cantidad_articulos}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-red-600">
                        {inventario.diferencias_encontradas}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {inventario.fecha_inicio
                          ? new Date(inventario.fecha_inicio).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {inventario.fecha_cierre
                          ? new Date(inventario.fecha_cierre).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getEstadoColor(inventario.estado)}>
                          {inventario.estado.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAbrirFormulario(inventario)}
                        >
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Inventario' : 'Nuevo Inventario'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGuardar} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Número de Inventario</label>
              <Input
                value={formData.numero_inventario || ''}
                onChange={(e) => setFormData({ ...formData, numero_inventario: e.target.value })}
                placeholder="INV-2025-001"
                disabled={!!editingId}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Almacén</label>
              <Select value={almacenSeleccionado} onValueChange={setAlmacenSeleccionado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {almacenes.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Cantidad de Artículos</label>
                <Input
                  type="number"
                  value={formData.cantidad_articulos || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, cantidad_articulos: parseInt(e.target.value) })
                  }
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Diferencias Encontradas</label>
                <Input
                  type="number"
                  value={formData.diferencias_encontradas || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      diferencias_encontradas: parseInt(e.target.value),
                    })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Estado</label>
              <Select value={formData.estado || 'planificado'} onValueChange={(value) =>
                setFormData({ ...formData, estado: value })
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planificado">Planificado</SelectItem>
                  <SelectItem value="en_proceso">En Proceso</SelectItem>
                  <SelectItem value="cerrado">Cerrado</SelectItem>
                  <SelectItem value="regularizado">Regularizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
