import React, { useState } from 'react';
import { useHosixAlmacenes, type Deposito } from '@/hooks/useHosixAlmacenes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DepositosManager() {
  const {
    almacenes,
    depositos,
    createDepositoMutation,
    updateDepositoMutation,
  } = useHosixAlmacenes();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('');
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState<string>('');
  const [formData, setFormData] = useState<Partial<Deposito>>({
    codigo: '',
    nombre: '',
    tipo_deposito: 'estanteria',
    activo: true,
  });

  const depositosFiltrados = depositos.filter((d) => {
    const almacenMatch = !almacenSeleccionado || d.almacen_id === almacenSeleccionado;
    const searchMatch =
      d.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      d.codigo.toLowerCase().includes(filtro.toLowerCase());
    return almacenMatch && searchMatch;
  });

  const handleAbrirFormulario = (deposito?: Deposito) => {
    if (deposito) {
      setEditingId(deposito.id);
      setAlmacenSeleccionado(deposito.almacen_id);
      setFormData(deposito);
    } else {
      setEditingId(null);
      setFormData({
        codigo: '',
        nombre: '',
        tipo_deposito: 'estanteria',
        activo: true,
      });
    }
    setIsOpen(true);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.codigo || !formData.nombre || !almacenSeleccionado) {
      toast.error('Código, nombre y almacén son requeridos');
      return;
    }

    const dataToSave = { ...formData, almacen_id: almacenSeleccionado };

    if (editingId) {
      await updateDepositoMutation.mutateAsync({
        id: editingId,
        updates: dataToSave as Partial<Deposito>,
      });
    } else {
      await createDepositoMutation.mutateAsync(dataToSave as Omit<Deposito, 'id' | 'created_at' | 'updated_at'>);
    }

    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Depósitos</h2>
        <Button onClick={() => handleAbrirFormulario()} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo Depósito
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Buscar por nombre o código..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="max-w-md"
        />
        <Select value={almacenSeleccionado} onValueChange={setAlmacenSeleccionado}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos los almacenes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los almacenes</SelectItem>
            {almacenes.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total de Depósitos: {depositosFiltrados.length}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Almacén</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {depositosFiltrados.map((deposito) => {
                  const almacen = almacenes.find((a) => a.id === deposito.almacen_id);
                  return (
                    <TableRow key={deposito.id}>
                      <TableCell className="font-mono text-sm">{deposito.codigo}</TableCell>
                      <TableCell className="font-medium">{deposito.nombre}</TableCell>
                      <TableCell className="text-sm">{almacen?.nombre || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{deposito.tipo_deposito}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{deposito.ubicacion_relativa || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={deposito.activo ? 'default' : 'destructive'}>
                          {deposito.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAbrirFormulario(deposito)}
                        >
                          <Edit2 className="h-4 w-4" />
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Depósito' : 'Nuevo Depósito'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGuardar} className="space-y-4">
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
            <div>
              <label className="block text-sm font-medium mb-2">Código</label>
              <Input
                value={formData.codigo || ''}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="DEP_001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nombre</label>
              <Input
                value={formData.nombre || ''}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Depósito 1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Depósito</label>
              <Select value={formData.tipo_deposito || 'estanteria'} onValueChange={(value) =>
                setFormData({ ...formData, tipo_deposito: value })
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="estanteria">Estantería</SelectItem>
                  <SelectItem value="refrigerador">Refrigerador</SelectItem>
                  <SelectItem value="congelador">Congelador</SelectItem>
                  <SelectItem value="cajon">Cajón</SelectItem>
                  <SelectItem value="repisa">Repisa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ubicación Relativa</label>
              <Input
                value={formData.ubicacion_relativa || ''}
                onChange={(e) => setFormData({ ...formData, ubicacion_relativa: e.target.value })}
                placeholder="Pasillo A, Nivel 2"
              />
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
