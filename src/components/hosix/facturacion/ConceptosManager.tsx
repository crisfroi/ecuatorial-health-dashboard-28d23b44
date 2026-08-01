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
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface ConceptoMaestro {
  id?: string;
  codigo: string;
  descripcion: string;
  tipo_concepto: string;
  precio_base: number;
  usa_tarifacion_dinamica: boolean;
  visible_aseguradoras: boolean;
  activo: boolean;
  snomed_code?: string;
  nota?: string;
  created_at?: string;
  updated_at?: string;
}

interface ConceptoFormState extends Omit<ConceptoMaestro, 'id' | 'created_at' | 'updated_at'> {
  precio_base: string;
}

const TIPOS_CONCEPTO = [
  { value: 'servicio', label: 'Servicio' },
  { value: 'procedimiento', label: 'Procedimiento' },
  { value: 'medicamento', label: 'Medicamento' },
  { value: 'material', label: 'Material' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'otro', label: 'Otro' },
];

const mockConceptos: ConceptoMaestro[] = [
  {
    id: '1',
    codigo: 'CONS-MED',
    descripcion: 'Consulta Médica',
    tipo_concepto: 'servicio',
    precio_base: 50.00,
    usa_tarifacion_dinamica: false,
    visible_aseguradoras: true,
    activo: true,
  },
  {
    id: '2',
    codigo: 'CIRUGIA-MAY',
    descripcion: 'Cirugía Mayor',
    tipo_concepto: 'procedimiento',
    precio_base: 500.00,
    usa_tarifacion_dinamica: true,
    visible_aseguradoras: true,
    activo: true,
  },
];

export default function ConceptosManager() {
  const [conceptos, setConceptos] = useState<ConceptoMaestro[]>(mockConceptos);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<ConceptoFormState>({
    codigo: '',
    descripcion: '',
    tipo_concepto: 'servicio',
    precio_base: '',
    usa_tarifacion_dinamica: false,
    visible_aseguradoras: true,
    activo: true,
    snomed_code: '',
    nota: '',
  });

  const handleOpenForm = (concepto?: ConceptoMaestro) => {
    if (concepto) {
      setFormData({
        codigo: concepto.codigo,
        descripcion: concepto.descripcion,
        tipo_concepto: concepto.tipo_concepto,
        precio_base: concepto.precio_base.toString(),
        usa_tarifacion_dinamica: concepto.usa_tarifacion_dinamica,
        visible_aseguradoras: concepto.visible_aseguradoras,
        activo: concepto.activo,
        snomed_code: concepto.snomed_code || '',
        nota: concepto.nota || '',
      });
      setEditingId(concepto.id || null);
    } else {
      setFormData({
        codigo: '',
        descripcion: '',
        tipo_concepto: 'servicio',
        precio_base: '',
        usa_tarifacion_dinamica: false,
        visible_aseguradoras: true,
        activo: true,
        snomed_code: '',
        nota: '',
      });
      setEditingId(null);
    }
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.codigo.trim() || !formData.descripcion.trim() || !formData.precio_base.trim()) {
      toast.error('Complete los campos requeridos');
      return;
    }

    setIsLoading(true);
    try {
      const concepto: ConceptoMaestro = {
        ...(editingId && { id: editingId }),
        codigo: formData.codigo.toUpperCase(),
        descripcion: formData.descripcion,
        tipo_concepto: formData.tipo_concepto,
        precio_base: parseFloat(formData.precio_base),
        usa_tarifacion_dinamica: formData.usa_tarifacion_dinamica,
        visible_aseguradoras: formData.visible_aseguradoras,
        activo: formData.activo,
        snomed_code: formData.snomed_code || undefined,
        nota: formData.nota || undefined,
      };

      if (editingId) {
        setConceptos(conceptos.map(c => c.id === editingId ? { ...c, ...concepto } : c));
        toast.success('Concepto actualizado');
      } else {
        const newConcepto = { ...concepto, id: Date.now().toString() };
        setConceptos([...conceptos, newConcepto]);
        toast.success('Concepto creado');
      }

      setShowForm(false);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este concepto?')) {
      setConceptos(conceptos.filter(c => c.id !== id));
      toast.success('Concepto eliminado');
    }
  };

  const filteredConceptos = conceptos.filter(concepto => {
    const matchSearch = 
      concepto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      concepto.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchTipo = tipoFiltro === 'todos' || concepto.tipo_concepto === tipoFiltro;
    
    return matchSearch && matchTipo;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Conceptos Maestros</h2>
          <p className="text-gray-600 text-sm mt-1">
            Gestión centralizada de servicios y procedimientos facturables
          </p>
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Concepto
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
                placeholder="Buscar por código o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo de concepto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {TIPOS_CONCEPTO.map(tipo => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setTipoFiltro('todos');
              }}
            >
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de conceptos */}
      <Card>
        <CardContent className="pt-6">
          {filteredConceptos.length === 0 ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">
                {conceptos.length === 0 ? 'No hay conceptos registrados' : 'No hay resultados para tu búsqueda'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Precio Base</TableHead>
                  <TableHead>Tarifación Dinámica</TableHead>
                  <TableHead>Visible Aseguradoras</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConceptos.map(concepto => (
                  <TableRow key={concepto.id}>
                    <TableCell className="font-mono font-semibold">{concepto.codigo}</TableCell>
                    <TableCell>{concepto.descripcion}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TIPOS_CONCEPTO.find(t => t.value === concepto.tipo_concepto)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">${concepto.precio_base.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={concepto.usa_tarifacion_dinamica ? 'default' : 'secondary'}>
                        {concepto.usa_tarifacion_dinamica ? 'Sí' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={concepto.visible_aseguradoras ? 'default' : 'secondary'}>
                        {concepto.visible_aseguradoras ? 'Sí' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={concepto.activo ? 'default' : 'destructive'}>
                        {concepto.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenForm(concepto)}
                          disabled={isLoading}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => concepto.id && handleDelete(concepto.id)}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Concepto' : 'Nuevo Concepto Maestro'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium mb-2">Código *</label>
              <Input
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Ej: CONS-001"
                disabled={!!editingId}
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium mb-2">Tipo de Concepto *</label>
              <Select
                value={formData.tipo_concepto}
                onValueChange={(value) => setFormData({ ...formData, tipo_concepto: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_CONCEPTO.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Descripción *</label>
              <Input
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción detallada del concepto"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium mb-2">Precio Base *</label>
              <Input
                type="number"
                step="0.01"
                value={formData.precio_base}
                onChange={(e) => setFormData({ ...formData, precio_base: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium mb-2">Código SNOMED (Opcional)</label>
              <Input
                value={formData.snomed_code}
                onChange={(e) => setFormData({ ...formData, snomed_code: e.target.value })}
                placeholder="Ej: 58181000"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Notas (Opcional)</label>
              <Input
                value={formData.nota}
                onChange={(e) => setFormData({ ...formData, nota: e.target.value })}
                placeholder="Notas adicionales sobre este concepto"
              />
            </div>

            <div className="col-span-1">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={formData.usa_tarifacion_dinamica}
                  onChange={(e) => setFormData({ ...formData, usa_tarifacion_dinamica: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Tarifación Dinámica
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Permite aplicar reglas de cálculo dinámico
              </p>
            </div>

            <div className="col-span-1">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={formData.visible_aseguradoras}
                  onChange={(e) => setFormData({ ...formData, visible_aseguradoras: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Visible en Aseguradoras
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Mostrar en portal de aseguradoras
              </p>
            </div>

            <div className="col-span-1">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Concepto Activo
              </label>
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
