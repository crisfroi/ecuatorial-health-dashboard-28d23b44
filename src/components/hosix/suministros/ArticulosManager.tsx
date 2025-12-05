import React, { useState } from 'react';
import { useHosixSuministros } from '@/hooks/useHosixSuministros';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TestTube, Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ArticulosManager() {
  const {
    articulos,
    isLoadingArticulos,
    familias,
    grupos,
    unidadesDosis,
    unidadesCompra,
    unidadesDispensacion,
    ubicaciones,
    filtros,
    setFiltros,
    crearArticulo,
    isCreatingArticulo,
    actualizarArticulo,
    isUpdatingArticulo,
    desactivarArticulo,
    isDesactivatingArticulo,
  } = useHosixSuministros();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    codigo_barras: '',
    nombre: '',
    descripcion: '',
    familia_id: '',
    grupo_id: '',
    es_medicamento: false,
    nombre_comercial: '',
    principio_activo: '',
    concentracion: '',
    forma_farmaceutica: '',
    via_administracion: '',
    unidad_dosis_id: '',
    unidad_compra_id: '',
    unidad_dispensacion_id: '',
    requiere_receta: false,
    controlado: false,
    requiere_refrigeracion: false,
    ubicacion_principal_id: '',
  });

  const handleOpenForm = (articulo?: any) => {
    if (articulo) {
      setFormData({
        codigo: articulo.codigo,
        codigo_barras: articulo.codigo_barras || '',
        nombre: articulo.nombre,
        descripcion: articulo.descripcion || '',
        familia_id: articulo.familia_id || '',
        grupo_id: articulo.grupo_id || '',
        es_medicamento: articulo.es_medicamento || false,
        nombre_comercial: articulo.nombre_comercial || '',
        principio_activo: articulo.principio_activo || '',
        concentracion: articulo.concentracion || '',
        forma_farmaceutica: articulo.forma_farmaceutica || '',
        via_administracion: articulo.via_administracion || '',
        unidad_dosis_id: articulo.unidad_dosis_id || '',
        unidad_compra_id: articulo.unidad_compra_id || '',
        unidad_dispensacion_id: articulo.unidad_dispensacion_id || '',
        requiere_receta: articulo.requiere_receta || false,
        controlado: articulo.controlado || false,
        requiere_refrigeracion: articulo.requiere_refrigeracion || false,
        ubicacion_principal_id: articulo.ubicacion_principal_id || '',
      });
      setEditingId(articulo.id);
    } else {
      setFormData({
        codigo: '',
        codigo_barras: '',
        nombre: '',
        descripcion: '',
        familia_id: '',
        grupo_id: '',
        es_medicamento: false,
        nombre_comercial: '',
        principio_activo: '',
        concentracion: '',
        forma_farmaceutica: '',
        via_administracion: '',
        unidad_dosis_id: '',
        unidad_compra_id: '',
        unidad_dispensacion_id: '',
        requiere_receta: false,
        controlado: false,
        requiere_refrigeracion: false,
        ubicacion_principal_id: '',
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

    const dataToSubmit = {
      ...formData,
      activo: true,
    };

    if (editingId) {
      actualizarArticulo(
        { id: editingId, data: dataToSubmit },
        {
          onSuccess: () => {
            setShowForm(false);
          },
        }
      );
    } else {
      crearArticulo(dataToSubmit, {
        onSuccess: () => {
          setShowForm(false);
        },
      });
    }
  };

  const handleDesactivar = (id: string, nombre: string) => {
    if (window.confirm(`¿Desactivar artículo "${nombre}"?`)) {
      desactivarArticulo(id);
    }
  };

  const filteredArticulos = articulos.filter((articulo) => {
    if (filtros.familia_id && articulo.familia_id !== filtros.familia_id) return false;
    if (filtros.grupo_id && articulo.grupo_id !== filtros.grupo_id) return false;
    if (filtros.es_medicamento !== undefined && articulo.es_medicamento !== filtros.es_medicamento)
      return false;
    if (filtros.busqueda) {
      const search = filtros.busqueda.toLowerCase();
      return (
        articulo.codigo.toLowerCase().includes(search) ||
        articulo.nombre.toLowerCase().includes(search) ||
        (articulo.codigo_barras?.toLowerCase().includes(search) || false)
      );
    }
    return true;
  });

  const getFamiliaNombre = (familiaId?: string) => {
    if (!familiaId) return '-';
    return familias.find((f) => f.id === familiaId)?.nombre || '-';
  };

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <TestTube className="h-6 w-6 text-orange-600" />
          <h2 className="text-2xl font-bold">Artículos y Medicamentos</h2>
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Artículo
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Buscar por código, nombre o código de barras..."
              value={filtros.busqueda || ''}
              onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
              className="flex-1"
            />
            <Select
              value={filtros.familia_id || 'todas'}
              onValueChange={(value) => {
                setFiltros({
                  ...filtros,
                  familia_id: value === 'todas' ? undefined : value,
                });
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Familia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las familias</SelectItem>
                {familias.map((familia) => (
                  <SelectItem key={familia.id} value={familia.id}>
                    {familia.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filtros.es_medicamento !== undefined ? (filtros.es_medicamento ? 'medicamentos' : 'materiales') : 'todos'}
              onValueChange={(value) => {
                if (value === 'todos') {
                  setFiltros({ ...filtros, es_medicamento: undefined });
                } else {
                  setFiltros({ ...filtros, es_medicamento: value === 'medicamentos' });
                }
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="medicamentos">Medicamentos</SelectItem>
                <SelectItem value="materiales">Materiales</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Total de artículos: {articulos.length}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingArticulos ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">Cargando artículos...</p>
            </div>
          ) : filteredArticulos.length === 0 ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">No hay artículos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Familia</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Controles</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArticulos.map((articulo) => (
                    <TableRow key={articulo.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        {articulo.codigo}
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate">
                        {articulo.nombre}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getFamiliaNombre(articulo.familia_id)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={articulo.es_medicamento ? 'default' : 'outline'}>
                          {articulo.es_medicamento ? 'Medicamento' : 'Material'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex gap-1">
                          {articulo.requiere_receta && (
                            <Badge variant="outline" className="text-xs">
                              Receta
                            </Badge>
                          )}
                          {articulo.controlado && (
                            <Badge variant="outline" className="text-xs bg-red-50">
                              Controlado
                            </Badge>
                          )}
                          {articulo.requiere_refrigeracion && (
                            <Badge variant="outline" className="text-xs bg-blue-50">
                              Frío
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={articulo.activo ? 'default' : 'secondary'}>
                          {articulo.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenForm(articulo)}
                          disabled={isUpdatingArticulo}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        {articulo.activo && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDesactivar(articulo.id, articulo.nombre)}
                            disabled={isDesactivatingArticulo}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Artículo' : 'Nuevo Artículo'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Datos Básicos */}
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-3">Datos Básicos</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Código *</label>
                  <Input
                    placeholder="ART_001"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Código de Barras</label>
                  <Input
                    placeholder="1234567890"
                    value={formData.codigo_barras}
                    onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <Input
                  placeholder="Nombre del artículo"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <Input
                  placeholder="Descripción opcional"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>
            </div>

            {/* Clasificación */}
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-3">Clasificación</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Familia</label>
                  <Select value={formData.familia_id} onValueChange={(value) => setFormData({ ...formData, familia_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar familia" />
                    </SelectTrigger>
                    <SelectContent>
                      {familias.map((familia) => (
                        <SelectItem key={familia.id} value={familia.id}>
                          {familia.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Grupo</label>
                  <Select value={formData.grupo_id} onValueChange={(value) => setFormData({ ...formData, grupo_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      {grupos
                        .filter((g) => !formData.familia_id || g.familia_id === formData.familia_id)
                        .map((grupo) => (
                          <SelectItem key={grupo.id} value={grupo.id}>
                            {grupo.nombre}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Checkbox
                  id="es_medicamento"
                  checked={formData.es_medicamento}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, es_medicamento: checked as boolean })
                  }
                />
                <label htmlFor="es_medicamento" className="text-sm font-medium cursor-pointer">
                  Es medicamento
                </label>
              </div>
            </div>

            {/* Información de Medicamento (si aplica) */}
            {formData.es_medicamento && (
              <div className="border-b pb-4 bg-blue-50 p-4 rounded">
                <h3 className="font-semibold mb-3">Información Farmacéutica</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Nombre comercial"
                    value={formData.nombre_comercial}
                    onChange={(e) => setFormData({ ...formData, nombre_comercial: e.target.value })}
                  />
                  <Input
                    placeholder="Principio activo"
                    value={formData.principio_activo}
                    onChange={(e) => setFormData({ ...formData, principio_activo: e.target.value })}
                  />
                  <Input
                    placeholder="Concentración"
                    value={formData.concentracion}
                    onChange={(e) => setFormData({ ...formData, concentracion: e.target.value })}
                  />
                  <Input
                    placeholder="Forma farmacéutica"
                    value={formData.forma_farmaceutica}
                    onChange={(e) => setFormData({ ...formData, forma_farmaceutica: e.target.value })}
                  />
                </div>
                <div className="mt-4">
                  <Input
                    placeholder="Vía de administración"
                    value={formData.via_administracion}
                    onChange={(e) => setFormData({ ...formData, via_administracion: e.target.value })}
                  />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="requiere_receta"
                      checked={formData.requiere_receta}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, requiere_receta: checked as boolean })
                      }
                    />
                    <label htmlFor="requiere_receta" className="text-sm font-medium">
                      Requiere receta médica
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="controlado"
                      checked={formData.controlado}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, controlado: checked as boolean })
                      }
                    />
                    <label htmlFor="controlado" className="text-sm font-medium">
                      Medicamento controlado
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="requiere_refrigeracion"
                      checked={formData.requiere_refrigeracion}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, requiere_refrigeracion: checked as boolean })
                      }
                    />
                    <label htmlFor="requiere_refrigeracion" className="text-sm font-medium">
                      Requiere refrigeración
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Unidades */}
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-3">Unidades de Medida</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Unidad de Dosis</label>
                  <Select value={formData.unidad_dosis_id} onValueChange={(value) => setFormData({ ...formData, unidad_dosis_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidadesDosis.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unidad de Compra</label>
                  <Select value={formData.unidad_compra_id} onValueChange={(value) => setFormData({ ...formData, unidad_compra_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidadesCompra.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unidad de Dispensación</label>
                  <Select value={formData.unidad_dispensacion_id} onValueChange={(value) => setFormData({ ...formData, unidad_dispensacion_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidadesDispensacion.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Almacenamiento */}
            <div className="pb-4">
              <h3 className="font-semibold mb-3">Almacenamiento</h3>
              <div>
                <label className="block text-sm font-medium mb-1">Ubicación Principal</label>
                <Select value={formData.ubicacion_principal_id} onValueChange={(value) => setFormData({ ...formData, ubicacion_principal_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ubicación" />
                  </SelectTrigger>
                  <SelectContent>
                    {ubicaciones.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isCreatingArticulo || isUpdatingArticulo}>
                {editingId ? 'Actualizar' : 'Crear'} Artículo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
