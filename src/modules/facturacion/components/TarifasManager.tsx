import React, { useState, useMemo } from 'react';
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
import { Plus, Edit2, Trash2, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRenaprosaConceptos } from '../hooks/useRenaprosaConceptos';
import { useRenaprosaAseguradoras } from '../hooks/useRenaprosaAseguradoras';
import { useRenaperosaTarifas } from '../hooks/useRenaperosaTarifas';

interface Tarifa {
  id: string;
  concepto_id: string;
  aseguradora_id?: string;
  nombre_concepto: string;
  nombre_aseguradora?: string;
  precio: number;
  vigente_desde: string;
  vigente_hasta?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

interface TarifaFormState extends Omit<Tarifa, 'id' | 'created_at' | 'updated_at' | 'nombre_concepto' | 'nombre_aseguradora'> {
  precio: string;
}

export default function TarifasManager() {
  const {
    conceptos,
    isLoading: isLoadingConceptos,
  } = useRenaprosaConceptos();

  const {
    aseguradoras,
    isLoading: isLoadingAseguradoras,
  } = useRenaprosaAseguradoras();

  const {
    tarifas,
    isLoading: isLoadingTarifas,
    error: tarifasError,
    crearTarifa,
    isCreating,
    actualizarTarifa,
    isUpdating,
    eliminarTarifa,
    isDeleting,
  } = useRenaperosaTarifas();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [conceptoFiltro, setConceptoFiltro] = useState<string>('todos');
  const isProcessing = isCreating || isUpdating || isDeleting;

  const [formData, setFormData] = useState<TarifaFormState>({
    concepto_id: '',
    aseguradora_id: '',
    nombre_concepto: '',
    nombre_aseguradora: '',
    precio: '',
    vigente_desde: new Date().toISOString().split('T')[0],
    vigente_hasta: '',
    activo: true,
  });

  const handleOpenForm = (tarifa?: any) => {
    if (tarifa) {
      setFormData({
        concepto_id: tarifa.concepto_id,
        aseguradora_id: tarifa.aseguradora_id || '',
        nombre_concepto: '',
        nombre_aseguradora: '',
        precio: tarifa.precio.toString(),
        vigente_desde: tarifa.vigente_desde,
        vigente_hasta: tarifa.vigente_hasta || '',
        activo: tarifa.activo,
      });
      setEditingId(tarifa.id);
    } else {
      setFormData({
        concepto_id: '',
        aseguradora_id: '',
        nombre_concepto: '',
        nombre_aseguradora: '',
        precio: '',
        vigente_desde: new Date().toISOString().split('T')[0],
        vigente_hasta: '',
        activo: true,
      });
      setEditingId(null);
    }
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.concepto_id || !formData.precio.trim()) {
      toast.error('Complete los campos requeridos');
      return;
    }

    const payload = {
      concepto_id: formData.concepto_id,
      aseguradora_id: formData.aseguradora_id || undefined,
      precio: parseFloat(formData.precio),
      vigente_desde: formData.vigente_desde,
      vigente_hasta: formData.vigente_hasta || undefined,
      activo: formData.activo,
    };

    if (editingId) {
      actualizarTarifa({ id: editingId, ...payload } as any);
    } else {
      crearTarifa(payload as any);
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro?')) {
      eliminarTarifa(id);
    }
  };

  const conceptoMap = useMemo(() => {
    const map: Record<string, string> = {};
    conceptos.forEach(c => {
      map[c.id] = c.descripcion;
    });
    return map;
  }, [conceptos]);

  const aseguradoraMap = useMemo(() => {
    const map: Record<string, string> = {};
    aseguradoras.forEach(a => {
      map[a.id] = a.nombre;
    });
    return map;
  }, [aseguradoras]);

  const filteredTarifas = useMemo(() => {
    return tarifas.filter(t => {
      const nombreConcepto = conceptoMap[t.concepto_id] || '';
      const nombreAseguradora = t.aseguradora_id ? aseguradoraMap[t.aseguradora_id] : '';
      const matchSearch =
        nombreConcepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nombreAseguradora.toLowerCase().includes(searchTerm.toLowerCase());
      const matchConcepto = conceptoFiltro === 'todos' || t.concepto_id === conceptoFiltro;
      return matchSearch && matchConcepto;
    });
  }, [tarifas, searchTerm, conceptoFiltro, conceptoMap, aseguradoraMap]);

  const isVigente = (tarifa: Tarifa) => {
    const hoy = new Date();
    const desde = new Date(tarifa.vigente_desde);
    const hasta = tarifa.vigente_hasta ? new Date(tarifa.vigente_hasta) : null;
    return desde <= hoy && (!hasta || hoy <= hasta);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tarifas Maestras</h2>
          <p className="text-gray-600 text-sm mt-1">
            Gestión centralizada de tarifas por concepto y aseguradora
          </p>
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Tarifa
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Búsqueda y Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por concepto o aseguradora..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={conceptoFiltro}
              onChange={(e) => setConceptoFiltro(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="todos">Todos los conceptos</option>
              {conceptos.map(c => (
                <option key={c.id} value={c.id}>{c.descripcion}</option>
              ))}
            </select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setConceptoFiltro('todos');
              }}
            >
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="pt-6">
          {filteredTarifas.length === 0 ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">No hay tarifas registradas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Concepto</TableHead>
                  <TableHead>Aseguradora</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Vigente Desde</TableHead>
                  <TableHead>Vigente Hasta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTarifas.map(tarifa => (
                  <TableRow key={tarifa.id}>
                    <TableCell className="font-medium">{conceptoMap[tarifa.concepto_id] || 'N/A'}</TableCell>
                    <TableCell className="text-sm">{tarifa.aseguradora_id ? aseguradoraMap[tarifa.aseguradora_id] : 'General'}</TableCell>
                    <TableCell className="font-bold">${tarifa.precio.toFixed(2)}</TableCell>
                    <TableCell className="text-sm">{new Date(tarifa.vigente_desde).toLocaleDateString('es-ES')}</TableCell>
                    <TableCell className="text-sm">
                      {tarifa.vigente_hasta ? new Date(tarifa.vigente_hasta).toLocaleDateString('es-ES') : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isVigente(tarifa) && tarifa.activo ? 'default' : 'destructive'}>
                        {isVigente(tarifa) && tarifa.activo ? 'Vigente' : 'Inactiva'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenForm(tarifa)}
                          disabled={isProcessing}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(tarifa.id)}
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

      {/* Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Tarifa' : 'Nueva Tarifa'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium mb-2">Concepto *</label>
              <select
                value={formData.concepto_id}
                onChange={(e) => setFormData({ ...formData, concepto_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isLoadingConceptos}
              >
                <option value="">Seleccionar concepto</option>
                {conceptos.map(c => (
                  <option key={c.id} value={c.id}>{c.descripcion}</option>
                ))}
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium mb-2">Aseguradora (Opcional)</label>
              <select
                value={formData.aseguradora_id}
                onChange={(e) => setFormData({ ...formData, aseguradora_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isLoadingAseguradoras}
              >
                <option value="">General (sin aseguradora)</option>
                {aseguradoras.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Precio *</label>
              <Input
                type="number"
                step="0.01"
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium mb-2">Vigente Desde *</label>
              <Input
                type="date"
                value={formData.vigente_desde}
                onChange={(e) => setFormData({ ...formData, vigente_desde: e.target.value })}
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium mb-2">Vigente Hasta (Opcional)</label>
              <Input
                type="date"
                value={formData.vigente_hasta}
                onChange={(e) => setFormData({ ...formData, vigente_hasta: e.target.value })}
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
              <Button variant="outline" onClick={() => setShowForm(false)} disabled={isProcessing}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingId ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
