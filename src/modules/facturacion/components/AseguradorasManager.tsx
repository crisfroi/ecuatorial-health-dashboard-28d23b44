import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRenaprosaAseguradoras } from '../hooks/useRenaprosaAseguradoras';

interface Aseguradora {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  contacto?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

interface AseguradoraFormState extends Omit<Aseguradora, 'id' | 'created_at' | 'updated_at'> {}

const TIPOS_ASEGURADORA = [
  { value: 'publica', label: 'Pública' },
  { value: 'privada', label: 'Privada' },
  { value: 'mutual', label: 'Mutual' },
  { value: 'otra', label: 'Otra' },
];

export default function AseguradorasManager() {
  const {
    aseguradoras,
    isLoading,
    error,
    crearAseguradora,
    isCreating,
    actualizarAseguradora,
    isUpdating,
    eliminarAseguradora,
    isDeleting,
  } = useRenaprosaAseguradoras();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const isProcessing = isCreating || isUpdating || isDeleting;

  const [formData, setFormData] = useState<AseguradoraFormState>({
    codigo: '',
    nombre: '',
    tipo: 'privada',
    direccion: '',
    telefono: '',
    email: '',
    contacto: '',
    activo: true,
  });

  const handleOpenForm = (aseguradora?: Aseguradora) => {
    if (aseguradora) {
      setFormData({
        codigo: aseguradora.codigo,
        nombre: aseguradora.nombre,
        tipo: aseguradora.tipo,
        direccion: aseguradora.direccion || '',
        telefono: aseguradora.telefono || '',
        email: aseguradora.email || '',
        contacto: aseguradora.contacto || '',
        activo: aseguradora.activo,
      });
      setEditingId(aseguradora.id);
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        tipo: 'privada',
        direccion: '',
        telefono: '',
        email: '',
        contacto: '',
        activo: true,
      });
      setEditingId(null);
    }
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.codigo.trim() || !formData.nombre.trim()) {
      toast.error('Complete los campos requeridos');
      return;
    }

    if (editingId) {
      actualizarAseguradora({ id: editingId, ...formData } as any);
    } else {
      crearAseguradora(formData as any);
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro?')) {
      eliminarAseguradora(id);
    }
  };

  const filteredAseguradoras = aseguradoras.filter(a =>
    a.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Aseguradoras</h2>
          <p className="text-gray-600 text-sm mt-1">
            Gestión centralizada de aseguradoras (fuente única de verdad)
          </p>
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Aseguradora
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por código o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setSearchTerm('')}
            >
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="pt-6">
          {filteredAseguradoras.length === 0 ? (
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
                  <TableHead>Contacto</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAseguradoras.map(aseguradora => (
                  <TableRow key={aseguradora.id}>
                    <TableCell className="font-mono font-semibold">{aseguradora.codigo}</TableCell>
                    <TableCell className="font-medium">{aseguradora.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TIPOS_ASEGURADORA.find(t => t.value === aseguradora.tipo)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{aseguradora.contacto || '-'}</TableCell>
                    <TableCell className="text-sm">{aseguradora.telefono || '-'}</TableCell>
                    <TableCell className="text-sm">{aseguradora.email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={aseguradora.activo ? 'default' : 'destructive'}>
                        {aseguradora.activo ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenForm(aseguradora)}
                        disabled={isProcessing}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(aseguradora.id)}
                        disabled={isProcessing}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Aseguradora' : 'Nueva Aseguradora'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium mb-2">Código *</label>
              <Input
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Ej: SEG-001"
                disabled={!!editingId}
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium mb-2">Tipo *</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {TIPOS_ASEGURADORA.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Nombre *</label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre de la aseguradora"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Dirección</label>
              <Input
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Dirección"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium mb-2">Teléfono</label>
              <Input
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+593-2-123456"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contacto@aseguradora.com"
                type="email"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Contacto</label>
              <Input
                value={formData.contacto}
                onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                placeholder="Nombre del contacto"
              />
            </div>

            <div className="col-span-1">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Activa
              </label>
            </div>

            <div className="col-span-2 flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingId ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
