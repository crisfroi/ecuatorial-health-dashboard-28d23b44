import React, { useState } from 'react';
import { useHosixAlmacenes, type Almacen } from '@/hooks/useHosixAlmacenes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AlmacenesManager() {
  const {
    almacenes,
    isLoadingAlmacenes,
    createAlmacenMutation,
    updateAlmacenMutation,
  } = useHosixAlmacenes();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('');
  const [formData, setFormData] = useState<Partial<Almacen>>({
    codigo: '',
    nombre: '',
    descripcion: '',
    ubicacion_fisica: '',
    area_m2: undefined,
    requiere_refrigeracion: false,
    activo: true,
  });

  const almacenesFiltrados = almacenes.filter(
    (a) =>
      a.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      a.codigo.toLowerCase().includes(filtro.toLowerCase())
  );

  const handleAbrirFormulario = (almacen?: Almacen) => {
    if (almacen) {
      setEditingId(almacen.id);
      setFormData(almacen);
    } else {
      setEditingId(null);
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        ubicacion_fisica: '',
        requiere_refrigeracion: false,
        activo: true,
      });
    }
    setIsOpen(true);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.codigo || !formData.nombre) {
      toast.error('Código y nombre son requeridos');
      return;
    }

    if (editingId) {
      await updateAlmacenMutation.mutateAsync({
        id: editingId,
        updates: formData as Partial<Almacen>,
      });
    } else {
      await createAlmacenMutation.mutateAsync(formData as Omit<Almacen, 'id' | 'created_at' | 'updated_at'>);
    }

    setIsOpen(false);
  };

  if (isLoadingAlmacenes) {
    return <div className="text-center py-8">Cargando almacenes...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Almacenes</h2>
        <Button onClick={() => handleAbrirFormulario()} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo Almacén
        </Button>
      </div>

      {/* Búsqueda */}
      <Input
        placeholder="Buscar por nombre o código..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="max-w-md"
      />

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Total de Almacenes: {almacenesFiltrados.length}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Área (m²)</TableHead>
                  <TableHead>Refrigeración</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {almacenesFiltrados.map((almacen) => (
                  <TableRow key={almacen.id}>
                    <TableCell className="font-mono text-sm">{almacen.codigo}</TableCell>
                    <TableCell className="font-medium">{almacen.nombre}</TableCell>
                    <TableCell className="text-sm text-gray-600">{almacen.ubicacion_fisica || '-'}</TableCell>
                    <TableCell className="text-right">{almacen.area_m2?.toFixed(2) || '-'}</TableCell>
                    <TableCell>
                      {almacen.requiere_refrigeracion ? (
                        <Badge variant="secondary">Sí ({almacen.temperatura_minima}°-{almacen.temperatura_maxima}°C)</Badge>
                      ) : (
                        <span className="text-sm text-gray-600">No</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={almacen.activo ? 'default' : 'destructive'}>
                        {almacen.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right gap-2 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAbrirFormulario(almacen)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
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
            <DialogTitle>{editingId ? 'Editar Almacén' : 'Nuevo Almacén'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGuardar} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Código</label>
              <Input
                value={formData.codigo || ''}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="ALM_001"
                disabled={!!editingId}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nombre</label>
              <Input
                value={formData.nombre || ''}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Almacén Principal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Descripción</label>
              <Input
                value={formData.descripcion || ''}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción del almacén"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ubicación Física</label>
              <Input
                value={formData.ubicacion_fisica || ''}
                onChange={(e) => setFormData({ ...formData, ubicacion_fisica: e.target.value })}
                placeholder="Edificio A, Planta 2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Área (m²)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.area_m2 || ''}
                onChange={(e) => setFormData({ ...formData, area_m2: parseFloat(e.target.value) })}
                placeholder="500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.requiere_refrigeracion || false}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requiere_refrigeracion: !!checked })
                }
              />
              <label className="text-sm font-medium">Requiere Refrigeración</label>
            </div>
            {formData.requiere_refrigeracion && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Temp. Mínima (°C)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.temperatura_minima || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, temperatura_minima: parseFloat(e.target.value) })
                      }
                      placeholder="15"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Temp. Máxima (°C)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.temperatura_maxima || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, temperatura_maxima: parseFloat(e.target.value) })
                      }
                      placeholder="25"
                    />
                  </div>
                </div>
              </>
            )}
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.activo ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: !!checked })}
              />
              <label className="text-sm font-medium">Activo</label>
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
