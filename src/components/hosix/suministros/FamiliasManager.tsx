import React, { useState } from 'react';
import { useHosixSuministros } from '@/hooks/useHosixSuministros';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Folder, Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function FamiliasManager() {
  const {
    familias,
    isLoadingFamilias,
    crearFamilia,
    isCreatingFamilia,
    actualizarFamilia,
    isUpdatingFamilia,
  } = useHosixSuministros();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
  });

  const handleOpenForm = (familia?: any) => {
    if (familia) {
      setFormData({
        codigo: familia.codigo,
        nombre: familia.nombre,
        descripcion: familia.descripcion || '',
      });
      setEditingId(familia.id);
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
      });
      setEditingId(null);
    }
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.codigo.trim()) {
      toast.error('El código es requerido');
      return;
    }
    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    if (editingId) {
      actualizarFamilia(
        { id: editingId, data: formData },
        {
          onSuccess: () => {
            setShowForm(false);
          },
        }
      );
    } else {
      crearFamilia(formData, {
        onSuccess: () => {
          setShowForm(false);
        },
      });
    }
  };

  const filteredFamilias = familias.filter(
    (familia) =>
      familia.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      familia.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Folder className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Familias de Artículos</h2>
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Familia
        </Button>
      </div>

      {/* Búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="Buscar por código o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Total de familias: {familias.length}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingFamilias ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">Cargando familias...</p>
            </div>
          ) : filteredFamilias.length === 0 ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">No hay familias registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFamilias.map((familia) => (
                    <TableRow key={familia.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        {familia.codigo}
                      </TableCell>
                      <TableCell className="font-medium">{familia.nombre}</TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                        {familia.descripcion || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={familia.activo ? 'default' : 'secondary'}>
                          {familia.activo ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenForm(familia)}
                          disabled={isUpdatingFamilia}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Familia' : 'Nueva Familia de Artículos'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Código *</label>
              <Input
                placeholder="FAM_001"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <Input
                placeholder="Nombre de la familia"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <Input
                placeholder="Descripción opcional"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isCreatingFamilia || isUpdatingFamilia}
              >
                {editingId ? 'Actualizar' : 'Crear'} Familia
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
