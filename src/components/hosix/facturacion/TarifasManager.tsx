import React, { useState } from 'react';
import { useHosixFacturacion } from '@/hooks/useHosixFacturacion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DollarSign, Plus, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

interface TarifaFormState {
  aseguradora_id: string;
  codigo_concepto: string;
  descripcion: string;
  precio: string;
  vigente_desde: string;
  vigente_hasta: string;
}

export default function TarifasManager() {
  const {
    tarifas,
    isLoadingTarifas,
    aseguradoras,
    isLoadingAseguradoras,
    filtros,
    setFiltros,
    crearTarifa,
    isCreatingTarifa,
    actualizarTarifa,
    isUpdatingTarifa,
  } = useHosixFacturacion();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TarifaFormState>({
    aseguradora_id: '',
    codigo_concepto: '',
    descripcion: '',
    precio: '',
    vigente_desde: new Date().toISOString().split('T')[0],
    vigente_hasta: '',
  });

  const handleOpenForm = (tarifa?: any) => {
    if (tarifa) {
      setFormData({
        aseguradora_id: tarifa.aseguradora_id || '',
        codigo_concepto: tarifa.codigo_concepto,
        descripcion: tarifa.descripcion,
        precio: tarifa.precio.toString(),
        vigente_desde: tarifa.vigente_desde.split('T')[0],
        vigente_hasta: tarifa.vigente_hasta ? tarifa.vigente_hasta.split('T')[0] : '',
      });
      setEditingId(tarifa.id);
    } else {
      setFormData({
        aseguradora_id: '',
        codigo_concepto: '',
        descripcion: '',
        precio: '',
        vigente_desde: new Date().toISOString().split('T')[0],
        vigente_hasta: '',
      });
      setEditingId(null);
    }
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (
      !formData.codigo_concepto.trim() ||
      !formData.descripcion.trim() ||
      !formData.precio.trim() ||
      !formData.vigente_desde
    ) {
      toast.error('Complete los campos requeridos');
      return;
    }

    const tarifaData = {
      aseguradora_id: formData.aseguradora_id === 'general' ? undefined : formData.aseguradora_id || undefined,
      codigo_concepto: formData.codigo_concepto,
      descripcion: formData.descripcion,
      precio: parseFloat(formData.precio),
      vigente_desde: formData.vigente_desde,
      vigente_hasta: formData.vigente_hasta || undefined,
    };

    if (editingId) {
      actualizarTarifa(
        { id: editingId, data: tarifaData },
        {
          onSuccess: () => {
            toast.success('Tarifa actualizada');
            setShowForm(false);
          },
          onError: (error: any) => {
            toast.error(`Error: ${error.message}`);
          },
        }
      );
    } else {
      crearTarifa(tarifaData, {
        onSuccess: () => {
          toast.success('Tarifa creada');
          setShowForm(false);
        },
        onError: (error: any) => {
          toast.error(`Error: ${error.message}`);
        },
      });
    }
  };

  const filteredTarifas = tarifas.filter((tarifa) => {
    if (filtros.aseguradora_id && tarifa.aseguradora_id !== filtros.aseguradora_id) {
      return false;
    }
    if (filtros.busqueda) {
      const search = filtros.busqueda.toLowerCase();
      return (
        tarifa.codigo_concepto.toLowerCase().includes(search) ||
        tarifa.descripcion.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const isVigente = (tarifa: any) => {
    const hoy = new Date();
    const desde = new Date(tarifa.vigente_desde);
    const hasta = tarifa.vigente_hasta ? new Date(tarifa.vigente_hasta) : null;

    return desde <= hoy && (!hasta || hoy <= hasta);
  };

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold">Gestión de Tarifas</h2>
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Tarifa
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
              placeholder="Buscar por código o concepto..."
              value={filtros.busqueda || ''}
              onChange={(e) => {
                setFiltros({ ...filtros, busqueda: e.target.value });
              }}
              className="flex-1"
            />
            <Select
              value={filtros.aseguradora_id || 'todas'}
              onValueChange={(value) => {
                setFiltros({ ...filtros, aseguradora_id: value === 'todas' ? undefined : value });
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Aseguradora" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {aseguradoras.map((seg) => (
                  <SelectItem key={seg.id} value={seg.id}>
                    {seg.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setFiltros({ busqueda: undefined, aseguradora_id: undefined });
              }}
            >
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de tarifas */}
      <Card>
        <CardContent>
          {isLoadingTarifas ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">Cargando tarifas...</p>
            </div>
          ) : filteredTarifas.length === 0 ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">No hay tarifas registradas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Aseguradora</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Vigente Desde</TableHead>
                  <TableHead>Vigente Hasta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTarifas.map((tarifa) => (
                  <TableRow key={tarifa.id}>
                    <TableCell className="font-mono text-sm">{tarifa.codigo_concepto}</TableCell>
                    <TableCell>{tarifa.descripcion}</TableCell>
                    <TableCell className="text-sm">
                      {tarifa.aseguradora_id
                        ? aseguradoras.find((s) => s.id === tarifa.aseguradora_id)?.nombre || '-'
                        : 'General'}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${tarifa.precio.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(tarifa.vigente_desde).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {tarifa.vigente_hasta
                        ? new Date(tarifa.vigente_hasta).toLocaleDateString('es-ES')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isVigente(tarifa) ? 'default' : 'secondary'}>
                        {isVigente(tarifa) ? 'Vigente' : 'Vencida'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenForm(tarifa)}
                        disabled={isUpdatingTarifa}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Tarifa' : 'Nueva Tarifa'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Aseguradora (Opcional)</label>
              <Select
                value={formData.aseguradora_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, aseguradora_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar aseguradora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General (sin aseguradora)</SelectItem>
                  {aseguradoras.map((seg) => (
                    <SelectItem key={seg.id} value={seg.id}>
                      {seg.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Código Concepto *</label>
              <Input
                value={formData.codigo_concepto}
                onChange={(e) =>
                  setFormData({ ...formData, codigo_concepto: e.target.value })
                }
                placeholder="Ej: CONS-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descripción *</label>
              <Input
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                placeholder="Descripción del concepto"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Precio *</label>
              <Input
                type="number"
                step="0.01"
                value={formData.precio}
                onChange={(e) =>
                  setFormData({ ...formData, precio: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Vigente Desde *</label>
              <Input
                type="date"
                value={formData.vigente_desde}
                onChange={(e) =>
                  setFormData({ ...formData, vigente_desde: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Vigente Hasta (Opcional)</label>
              <Input
                type="date"
                value={formData.vigente_hasta}
                onChange={(e) =>
                  setFormData({ ...formData, vigente_hasta: e.target.value })
                }
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
                disabled={isCreatingTarifa || isUpdatingTarifa}
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
