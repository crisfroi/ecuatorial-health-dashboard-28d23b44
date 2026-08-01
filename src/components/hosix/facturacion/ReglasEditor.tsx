import React, { useState } from 'react';
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
import { Plus, Edit2, Trash2, Search, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ReglaTarifacion {
  id?: string;
  concepto_id: string;
  nombre: string;
  tipo_regla: string;
  condicion_json: Record<string, any>;
  tipo_aplicacion: string;
  valor_aplicacion: number;
  orden_aplicacion: number;
  permitir_acumulacion: boolean;
  es_descuento: boolean;
  precio_minimo?: number;
  precio_maximo?: number;
  requiere_aprobacion: boolean;
  activo: boolean;
  nota?: string;
  created_at?: string;
  updated_at?: string;
}

interface ReglaFormState extends Omit<ReglaTarifacion, 'id' | 'created_at' | 'updated_at'> {
  valor_aplicacion: string;
  precio_minimo: string;
  precio_maximo: string;
}

const TIPOS_REGLA = [
  { value: 'edad', label: 'Por Edad' },
  { value: 'embarazo', label: 'Por Embarazo' },
  { value: 'beneficio', label: 'Por Tipo de Beneficio' },
  { value: 'urgencia', label: 'Por Urgencia' },
  { value: 'horario', label: 'Por Horario' },
  { value: 'complejidad', label: 'Por Complejidad' },
  { value: 'aseguradora', label: 'Por Aseguradora' },
  { value: 'temporal', label: 'Temporal' },
  { value: 'otra', label: 'Otra Condición' },
];

const TIPOS_APLICACION = [
  { value: 'porcentaje', label: 'Porcentaje' },
  { value: 'monto_fijo', label: 'Monto Fijo' },
  { value: 'multiplicador', label: 'Multiplicador' },
  { value: 'precio_directo', label: 'Precio Directo' },
];

const mockConceptos = [
  { id: '1', nombre: 'Consulta Médica' },
  { id: '2', nombre: 'Cirugía Mayor' },
];

const mockReglas: ReglaTarifacion[] = [
  {
    id: '1',
    concepto_id: '1',
    nombre: 'Descuento Menores de 5 años',
    tipo_regla: 'edad',
    condicion_json: { edad_minima: 0, edad_maxima: 5 },
    tipo_aplicacion: 'porcentaje',
    valor_aplicacion: -20,
    orden_aplicacion: 1,
    permitir_acumulacion: true,
    es_descuento: true,
    requiere_aprobacion: false,
    activo: true,
  },
];

export default function ReglasEditor() {
  const [reglas, setReglas] = useState<ReglaTarifacion[]>(mockReglas);
  const [conceptos] = useState(mockConceptos);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [conceptoFiltro, setConceptoFiltro] = useState<string>('todos');
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<ReglaFormState>({
    concepto_id: '',
    nombre: '',
    tipo_regla: 'edad',
    condicion_json: {},
    tipo_aplicacion: 'porcentaje',
    valor_aplicacion: '',
    orden_aplicacion: 1,
    permitir_acumulacion: true,
    es_descuento: false,
    precio_minimo: '',
    precio_maximo: '',
    requiere_aprobacion: false,
    activo: true,
    nota: '',
  });

  const handleOpenForm = (regla?: ReglaTarifacion) => {
    if (regla) {
      setFormData({
        concepto_id: regla.concepto_id,
        nombre: regla.nombre,
        tipo_regla: regla.tipo_regla,
        condicion_json: regla.condicion_json,
        tipo_aplicacion: regla.tipo_aplicacion,
        valor_aplicacion: regla.valor_aplicacion.toString(),
        orden_aplicacion: regla.orden_aplicacion,
        permitir_acumulacion: regla.permitir_acumulacion,
        es_descuento: regla.es_descuento,
        precio_minimo: regla.precio_minimo?.toString() || '',
        precio_maximo: regla.precio_maximo?.toString() || '',
        requiere_aprobacion: regla.requiere_aprobacion,
        activo: regla.activo,
        nota: regla.nota || '',
      });
      setEditingId(regla.id || null);
    } else {
      setFormData({
        concepto_id: '',
        nombre: '',
        tipo_regla: 'edad',
        condicion_json: {},
        tipo_aplicacion: 'porcentaje',
        valor_aplicacion: '',
        orden_aplicacion: 1,
        permitir_acumulacion: true,
        es_descuento: false,
        precio_minimo: '',
        precio_maximo: '',
        requiere_aprobacion: false,
        activo: true,
        nota: '',
      });
      setEditingId(null);
    }
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.concepto_id || !formData.nombre.trim() || !formData.valor_aplicacion) {
      toast.error('Complete los campos requeridos');
      return;
    }

    setIsLoading(true);
    try {
      const regla: ReglaTarifacion = {
        ...(editingId && { id: editingId }),
        concepto_id: formData.concepto_id,
        nombre: formData.nombre,
        tipo_regla: formData.tipo_regla,
        condicion_json: formData.condicion_json,
        tipo_aplicacion: formData.tipo_aplicacion,
        valor_aplicacion: parseFloat(formData.valor_aplicacion),
        orden_aplicacion: formData.orden_aplicacion,
        permitir_acumulacion: formData.permitir_acumulacion,
        es_descuento: formData.es_descuento,
        precio_minimo: formData.precio_minimo ? parseFloat(formData.precio_minimo) : undefined,
        precio_maximo: formData.precio_maximo ? parseFloat(formData.precio_maximo) : undefined,
        requiere_aprobacion: formData.requiere_aprobacion,
        activo: formData.activo,
        nota: formData.nota || undefined,
      };

      if (editingId) {
        setReglas(reglas.map(r => r.id === editingId ? { ...r, ...regla } : r));
        toast.success('Regla actualizada');
      } else {
        const newRegla = { ...regla, id: Date.now().toString() };
        setReglas([...reglas, newRegla]);
        toast.success('Regla creada');
      }

      setShowForm(false);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta regla?')) {
      setReglas(reglas.filter(r => r.id !== id));
      toast.success('Regla eliminada');
    }
  };

  const filteredReglas = reglas.filter(regla => {
    const matchSearch = regla.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchConcepto = conceptoFiltro === 'todos' || regla.concepto_id === conceptoFiltro;
    return matchSearch && matchConcepto;
  });

  const getConceptoNombre = (conceptoId: string) => {
    return conceptos.find(c => c.id === conceptoId)?.nombre || '-';
  };

  const getAplicacionText = (tipo: string, valor: number) => {
    switch (tipo) {
      case 'porcentaje':
        return `${valor > 0 ? '+' : ''}${valor}%`;
      case 'monto_fijo':
        return `${valor > 0 ? '+' : ''}$${valor.toFixed(2)}`;
      case 'multiplicador':
        return `x${valor.toFixed(2)}`;
      case 'precio_directo':
        return `$${valor.toFixed(2)}`;
      default:
        return valor;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Reglas de Tarifación</h2>
          <p className="text-gray-600 text-sm mt-1">
            Configuración dinámica de cálculo de precios según múltiples parámetros
          </p>
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Regla
        </Button>
      </div>

      {/* Alert Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Acerca de las Reglas de Tarifación</p>
              <p>
                Las reglas permiten calcular dinámicamente el precio de un concepto basado en condiciones como edad del paciente, 
                tipo de beneficio, urgencia, aseguradora, etc. Se aplican en orden y pueden acumularse para obtener el precio final.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
                placeholder="Buscar por nombre de regla..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={conceptoFiltro} onValueChange={setConceptoFiltro}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filtrar por concepto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los conceptos</SelectItem>
                {conceptos.map(concepto => (
                  <SelectItem key={concepto.id} value={concepto.id}>
                    {concepto.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

      {/* Tabla de reglas */}
      <Card>
        <CardContent className="pt-6">
          {filteredReglas.length === 0 ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">
                {reglas.length === 0 ? 'No hay reglas registradas' : 'No hay resultados para tu búsqueda'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Nombre de Regla</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Aplicación</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead>Acum.</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReglas.map(regla => (
                  <TableRow key={regla.id}>
                    <TableCell className="font-medium">{regla.nombre}</TableCell>
                    <TableCell className="text-sm">{getConceptoNombre(regla.concepto_id)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TIPOS_REGLA.find(t => t.value === regla.tipo_regla)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {TIPOS_APLICACION.find(t => t.value === regla.tipo_aplicacion)?.label}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {getAplicacionText(regla.tipo_aplicacion, regla.valor_aplicacion)}
                    </TableCell>
                    <TableCell className="text-center">{regla.orden_aplicacion}</TableCell>
                    <TableCell>
                      <Badge variant={regla.permitir_acumulacion ? 'default' : 'secondary'}>
                        {regla.permitir_acumulacion ? 'Sí' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={regla.activo ? 'default' : 'destructive'}>
                        {regla.activo ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenForm(regla)}
                          disabled={isLoading}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => regla.id && handleDelete(regla.id)}
                          disabled={isLoading}
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

      {/* Dialog Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Regla de Tarifación' : 'Nueva Regla de Tarifación'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium mb-2">Concepto *</label>
              <Select
                value={formData.concepto_id}
                onValueChange={(value) => setFormData({ ...formData, concepto_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar concepto" />
                </SelectTrigger>
                <SelectContent>
                  {conceptos.map(concepto => (
                    <SelectItem key={concepto.id} value={concepto.id}>
                      {concepto.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium mb-2">Tipo de Regla *</label>
              <Select
                value={formData.tipo_regla}
                onValueChange={(value) => setFormData({ ...formData, tipo_regla: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_REGLA.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Nombre de la Regla *</label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Descuento por Edad"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium mb-2">Tipo de Aplicación *</label>
              <Select
                value={formData.tipo_aplicacion}
                onValueChange={(value) => setFormData({ ...formData, tipo_aplicacion: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_APLICACION.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium mb-2">Valor *</label>
              <Input
                type="number"
                step="0.01"
                value={formData.valor_aplicacion}
                onChange={(e) => setFormData({ ...formData, valor_aplicacion: e.target.value })}
                placeholder="Ej: -20 para descuento, 1.5 para multiplicador"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium mb-2">Precio Mínimo (Opcional)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.precio_minimo}
                onChange={(e) => setFormData({ ...formData, precio_minimo: e.target.value })}
                placeholder="Ej: 10.00"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium mb-2">Precio Máximo (Opcional)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.precio_maximo}
                onChange={(e) => setFormData({ ...formData, precio_maximo: e.target.value })}
                placeholder="Ej: 1000.00"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium mb-2">Orden de Aplicación *</label>
              <Input
                type="number"
                value={formData.orden_aplicacion}
                onChange={(e) => setFormData({ ...formData, orden_aplicacion: parseInt(e.target.value) || 1 })}
                min="1"
              />
              <p className="text-xs text-gray-500 mt-1">Orden en que se aplican múltiples reglas</p>
            </div>

            <div className="col-span-2 space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.es_descuento}
                  onChange={(e) => setFormData({ ...formData, es_descuento: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium">Esta es una regla de descuento</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.permitir_acumulacion}
                  onChange={(e) => setFormData({ ...formData, permitir_acumulacion: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium">Permitir acumulación con otras reglas</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requiere_aprobacion}
                  onChange={(e) => setFormData({ ...formData, requiere_aprobacion: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium">Requiere aprobación antes de aplicar</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium">Regla activa</span>
              </label>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Notas (Opcional)</label>
              <Input
                value={formData.nota}
                onChange={(e) => setFormData({ ...formData, nota: e.target.value })}
                placeholder="Notas adicionales sobre esta regla"
              />
            </div>

            <div className="col-span-2 flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
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
