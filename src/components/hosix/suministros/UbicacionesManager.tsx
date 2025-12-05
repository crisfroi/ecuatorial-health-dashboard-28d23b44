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
import { MapPin, Plus, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

export default function UbicacionesManager() {
  const { ubicaciones, isLoadingUbicaciones } = useHosixSuministros();

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    tipo: 'almacen',
    descripcion: '',
    temperatura_minima: '',
    temperatura_maxima: '',
    humedad_minima: '',
    humedad_maxima: '',
    capacidad_items: '',
  });

  const handleOpenForm = (ubicacion?: any) => {
    if (ubicacion) {
      setFormData({
        codigo: ubicacion.codigo,
        nombre: ubicacion.nombre,
        tipo: ubicacion.tipo || 'almacen',
        descripcion: ubicacion.descripcion || '',
        temperatura_minima: ubicacion.temperatura_minima?.toString() || '',
        temperatura_maxima: ubicacion.temperatura_maxima?.toString() || '',
        humedad_minima: ubicacion.humedad_minima?.toString() || '',
        humedad_maxima: ubicacion.humedad_maxima?.toString() || '',
        capacidad_items: ubicacion.capacidad_items?.toString() || '',
      });
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        tipo: 'almacen',
        descripcion: '',
        temperatura_minima: '',
        temperatura_maxima: '',
        humedad_minima: '',
        humedad_maxima: '',
        capacidad_items: '',
      });
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
    toast.success('Ubicación guardada (función de demo)');
    setShowForm(false);
  };

  const filteredUbicaciones = ubicaciones.filter((ubicacion) => {
    const matchesSearch =
      ubicacion.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ubicacion.nombre.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTipo = filterTipo === 'todos' || ubicacion.tipo === filterTipo;

    return matchesSearch && matchesTipo;
  });

  const tipos = ['almacen', 'deposito', 'planta', 'area'];

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <MapPin className="h-6 w-6 text-red-600" />
          <h2 className="text-2xl font-bold">Ubicaciones de Almacenamiento</h2>
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Ubicación
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
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {tipos.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
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
          <CardTitle className="text-sm">Total de ubicaciones: {ubicaciones.length}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingUbicaciones ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">Cargando ubicaciones...</p>
            </div>
          ) : filteredUbicaciones.length === 0 ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">No hay ubicaciones registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Temperatura</TableHead>
                    <TableHead>Humedad</TableHead>
                    <TableHead>Capacidad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUbicaciones.map((ubicacion) => (
                    <TableRow key={ubicacion.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        {ubicacion.codigo}
                      </TableCell>
                      <TableCell className="font-medium">{ubicacion.nombre}</TableCell>
                      <TableCell className="text-sm capitalize">{ubicacion.tipo}</TableCell>
                      <TableCell className="text-sm">
                        {ubicacion.temperatura_minima && ubicacion.temperatura_maxima
                          ? `${ubicacion.temperatura_minima}°C - ${ubicacion.temperatura_maxima}°C`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {ubicacion.humedad_minima && ubicacion.humedad_maxima
                          ? `${ubicacion.humedad_minima}% - ${ubicacion.humedad_maxima}%`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {ubicacion.capacidad_items ? `${ubicacion.capacidad_items} items` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ubicacion.activo ? 'default' : 'secondary'}>
                          {ubicacion.activo ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenForm(ubicacion)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ubicación de Almacenamiento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Código *</label>
                <Input
                  placeholder="UB_001"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tipos.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <Input
                placeholder="Nombre de la ubicación"
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Temperatura Mínima (°C)</label>
                <Input
                  type="number"
                  placeholder="18"
                  step="0.1"
                  value={formData.temperatura_minima}
                  onChange={(e) => setFormData({ ...formData, temperatura_minima: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Temperatura Máxima (°C)</label>
                <Input
                  type="number"
                  placeholder="25"
                  step="0.1"
                  value={formData.temperatura_maxima}
                  onChange={(e) => setFormData({ ...formData, temperatura_maxima: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Humedad Mínima (%)</label>
                <Input
                  type="number"
                  placeholder="30"
                  step="0.1"
                  value={formData.humedad_minima}
                  onChange={(e) => setFormData({ ...formData, humedad_minima: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Humedad Máxima (%)</label>
                <Input
                  type="number"
                  placeholder="70"
                  step="0.1"
                  value={formData.humedad_maxima}
                  onChange={(e) => setFormData({ ...formData, humedad_maxima: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Capacidad (items)</label>
              <Input
                type="number"
                placeholder="1000"
                value={formData.capacidad_items}
                onChange={(e) => setFormData({ ...formData, capacidad_items: e.target.value })}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>Guardar Ubicación</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
