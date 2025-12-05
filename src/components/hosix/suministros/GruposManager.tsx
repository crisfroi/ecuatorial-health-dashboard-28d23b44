import React, { useState } from 'react';
import { useHosixSuministros } from '@/hooks/useHosixSuministros';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Layers, Plus, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

export default function GruposManager() {
  const {
    familias,
    grupos,
    isLoadingGrupos,
    filtros,
    setFiltros,
    crearGrupo,
    isCreatingGrupo,
    actualizarGrupo,
    isUpdatingGrupo,
  } = useHosixSuministros();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    familia_id: '',
  });

  const handleOpenForm = (grupo?: any) => {
    if (grupo) {
      setFormData({
        codigo: grupo.codigo,
        nombre: grupo.nombre,
        descripcion: grupo.descripcion || '',
        familia_id: grupo.familia_id,
      });
      setEditingId(grupo.id);
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        familia_id: filtros.familia_id || '',
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
    if (!formData.familia_id) {
      toast.error('Seleccione una familia');
      return;
    }

    if (editingId) {
      actualizarGrupo(
        { id: editingId, data: formData },
        {
          onSuccess: () => {
            setShowForm(false);
          },
        }
      );
    } else {
      crearGrupo(formData, {
        onSuccess: () => {
          setShowForm(false);
        },
      });
    }
  };

  const filteredGrupos = grupos.filter(
    (grupo) =>
      grupo.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grupo.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFamiliaNombre = (familiaId?: string) => {
    if (!familiaId) return '-';
    return familias.find((f) => f.id === familiaId)?.nombre || '-';
  };

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Layers className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold">Grupos de Artículos</h2>
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Grupo
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Buscar por código o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select
              value={filtros.familia_id || 'todos'}
              onValueChange={(value) => {
                setFiltros({
                  ...filtros,
                  familia_id: value === 'todos' ? undefined : value,
                });
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Familia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las familias</SelectItem>
                {familias.map((familia) => (
                  <SelectItem key={familia.id} value={familia.id}>
                    {familia.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Total de grupos: {grupos.length}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingGrupos ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">Cargando grupos...</p>
            </div>
          ) : filteredGrupos.length === 0 ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">No hay grupos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Familia</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGrupos.map((grupo) => (
                    <TableRow key={grupo.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        {grupo.codigo}
                      </TableCell>
                      <TableCell className="font-medium">{grupo.nombre}</TableCell>
                      <TableCell className="text-sm">
                        {getFamiliaNombre(grupo.familia_id)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                        {grupo.descripcion || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={grupo.activo ? 'default' : 'secondary'}>
                          {grupo.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenForm(grupo)}
                          disabled={isUpdatingGrupo}
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
            <DialogTitle>{editingId ? 'Editar Grupo' : 'Nuevo Grupo de Artículos'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Familia *</label>
              <Select value={formData.familia_id} onValueChange={(value) => setFormData({ ...formData, familia_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar familia" />
                </SelectTrigger>
                <SelectContent>
                  {familias.filter((f) => f.activo).map((familia) => (
                    <SelectItem key={familia.id} value={familia.id}>
                      {familia.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Código *</label>
              <Input
                placeholder="GRP_001"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <Input
                placeholder="Nombre del grupo"
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
              <Button onClick={handleSubmit} disabled={isCreatingGrupo || isUpdatingGrupo}>
                {editingId ? 'Actualizar' : 'Crear'} Grupo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
