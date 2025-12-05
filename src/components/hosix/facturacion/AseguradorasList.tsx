import React, { useState } from 'react';
import { useHosixFacturacion } from '@/hooks/useHosixFacturacion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Building2, Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AseguradoraFormState {
  codigo: string;
  nombre: string;
  tipo: string;
  direccion: string;
  telefono: string;
  email: string;
}

export default function AseguradorasList() {
  const {
    aseguradoras,
    isLoadingAseguradoras,
    filtros,
    setFiltros,
    crearAseguradora,
    isCreatingAseguradora,
    actualizarAseguradora,
    isUpdatingAseguradora,
    desactivarAseguradora,
    isDesactivatingAseguradora,
  } = useHosixFacturacion();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AseguradoraFormState>({
    codigo: '',
    nombre: '',
    tipo: '',
    direccion: '',
    telefono: '',
    email: '',
  });

  const handleOpenForm = (aseguradora?: any) => {
    if (aseguradora) {
      setFormData({
        codigo: aseguradora.codigo,
        nombre: aseguradora.nombre,
        tipo: aseguradora.tipo || '',
        direccion: aseguradora.direccion || '',
        telefono: aseguradora.telefono || '',
        email: aseguradora.email || '',
      });
      setEditingId(aseguradora.id);
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        tipo: '',
        direccion: '',
        telefono: '',
        email: '',
      });
      setEditingId(null);
    }
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.codigo.trim() || !formData.nombre.trim()) {
      toast.error('El código y nombre son requeridos');
      return;
    }

    if (editingId) {
      actualizarAseguradora(
        { id: editingId, data: formData },
        {
          onSuccess: () => {
            toast.success('Aseguradora actualizada');
            setShowForm(false);
            setFormData({
              codigo: '',
              nombre: '',
              tipo: '',
              direccion: '',
              telefono: '',
              email: '',
            });
          },
          onError: (error: any) => {
            toast.error(`Error: ${error.message}`);
          },
        }
      );
    } else {
      crearAseguradora(formData, {
        onSuccess: () => {
          toast.success('Aseguradora creada');
          setShowForm(false);
          setFormData({
            codigo: '',
            nombre: '',
            tipo: '',
            direccion: '',
            telefono: '',
            email: '',
          });
        },
        onError: (error: any) => {
          toast.error(`Error: ${error.message}`);
        },
      });
    }
  };

  const handleDesactivar = (id: string) => {
    if (window.confirm('¿Está seguro de que desea desactivar esta aseguradora?')) {
      desactivarAseguradora(id, {
        onSuccess: () => {
          toast.success('Aseguradora desactivada');
        },
        onError: (error: any) => {
          toast.error(`Error: ${error.message}`);
        },
      });
    }
  };

  const filteredAseguradoras = aseguradoras.filter((seg) => {
    if (filtros.tipo && seg.tipo !== filtros.tipo) return false;
    if (filtros.busqueda) {
      const search = filtros.busqueda.toLowerCase();
      return (
        seg.nombre.toLowerCase().includes(search) ||
        seg.codigo.toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Gestión de Aseguradoras</h2>
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Aseguradora
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Buscar por nombre o código..."
              value={filtros.busqueda || ''}
              onChange={(e) => {
                setFiltros({ ...filtros, busqueda: e.target.value });
              }}
              className="flex-1"
            />
            <Select
              value={filtros.tipo || ''}
              onValueChange={(value) => {
                setFiltros({ ...filtros, tipo: value || undefined });
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="publica">Pública</SelectItem>
                <SelectItem value="privada">Privada</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setFiltros({ busqueda: undefined, tipo: undefined });
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de aseguradoras */}
      <Card>
        <CardContent>
          {isLoadingAseguradoras ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">Cargando aseguradoras...</p>
            </div>
          ) : filteredAseguradoras.length === 0 ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">No hay aseguradoras registradas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAseguradoras.map((aseg) => (
                  <TableRow key={aseg.id}>
                    <TableCell className="font-mono text-sm">{aseg.codigo}</TableCell>
                    <TableCell className="font-medium">{aseg.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {aseg.tipo === 'publica' ? 'Pública' : 'Privada'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{aseg.email || '-'}</TableCell>
                    <TableCell className="text-sm">{aseg.telefono || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={aseg.activo ? 'default' : 'secondary'}>
                        {aseg.activo ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenForm(aseg)}
                        disabled={isUpdatingAseguradora}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {aseg.activo && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDesactivar(aseg.id)}
                          disabled={isDesactivatingAseguradora}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Aseguradora' : 'Nueva Aseguradora'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Código *</label>
              <Input
                value={formData.codigo}
                onChange={(e) =>
                  setFormData({ ...formData, codigo: e.target.value })
                }
                placeholder="Ej: IESS"
                disabled={editingId !== null}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <Input
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                placeholder="Nombre completo de la aseguradora"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <Select
                value={formData.tipo}
                onValueChange={(value) =>
                  setFormData({ ...formData, tipo: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="publica">Pública</SelectItem>
                  <SelectItem value="privada">Privada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="email@aseguradora.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <Input
                value={formData.telefono}
                onChange={(e) =>
                  setFormData({ ...formData, telefono: e.target.value })
                }
                placeholder="+240 123 456 789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Dirección</label>
              <Input
                value={formData.direccion}
                onChange={(e) =>
                  setFormData({ ...formData, direccion: e.target.value })
                }
                placeholder="Dirección completa"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isCreatingAseguradora || isUpdatingAseguradora}
              >
                {editingId ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
