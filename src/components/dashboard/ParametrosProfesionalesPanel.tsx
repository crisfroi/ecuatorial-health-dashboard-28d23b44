import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Award } from "lucide-react";
import * as LucideIcons from "lucide-react";

const TIPO_DATO_OPTIONS = [
  { value: 'texto', label: 'Texto' },
  { value: 'numero', label: 'Número' },
  { value: 'fecha', label: 'Fecha' },
  { value: 'boolean', label: 'Sí/No' },
  { value: 'seleccion_unica', label: 'Selección Única' },
  { value: 'seleccion_multiple', label: 'Selección Múltiple' },
  { value: 'archivo', label: 'Archivo' },
  { value: 'moneda', label: 'Moneda' }
];

const CATEGORIA_OPTIONS = [
  { value: 'formacion', label: 'Formación' },
  { value: 'condecoracion', label: 'Condecoración' },
  { value: 'promocion', label: 'Promoción' },
  { value: 'incidencia', label: 'Incidencia' },
  { value: 'evento', label: 'Evento' },
  { value: 'salario', label: 'Salario' },
  { value: 'certificacion', label: 'Certificación' },
  { value: 'evaluacion', label: 'Evaluación' },
  { value: 'disciplinario', label: 'Disciplinario' },
  { value: 'reconocimiento', label: 'Reconocimiento' },
  { value: 'otro', label: 'Otro' }
];

const ICON_OPTIONS = [
  'Award', 'DollarSign', 'ClipboardCheck', 'FileCheck', 'TrendingUp', 
  'Star', 'Trophy', 'Medal', 'Calendar', 'Book', 'GraduationCap', 
  'Briefcase', 'Shield', 'Heart', 'Flag', 'Target'
];

interface ParametroFormData {
  id?: string;
  nombre: string;
  descripcion: string;
  tipo_dato: string;
  categoria: string;
  icono: string;
  color: string;
  opciones_seleccion?: string[];
  unidad?: string;
  es_obligatorio: boolean;
  visible_en_detalles: boolean;
  orden_visualizacion: number;
  activo: boolean;
}

export const ParametrosProfesionalesPanel = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingParametro, setEditingParametro] = useState<ParametroFormData | null>(null);
  const [formData, setFormData] = useState<ParametroFormData>({
    nombre: '',
    descripcion: '',
    tipo_dato: 'texto',
    categoria: 'otro',
    icono: 'Award',
    color: '#3b82f6',
    es_obligatorio: false,
    visible_en_detalles: true,
    orden_visualizacion: 0,
    activo: true
  });

  // Cargar parámetros
  const { data: parametros, isLoading } = useQuery({
    queryKey: ['parametros_profesionales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parametros_profesionales')
        .select('*')
        .order('orden_visualizacion', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  // Crear o actualizar parámetro
  const saveMutation = useMutation({
    mutationFn: async (data: ParametroFormData) => {
      if (data.id) {
        const { error } = await supabase
          .from('parametros_profesionales')
          .update(data)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('parametros_profesionales')
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parametros_profesionales'] });
      toast({
        title: "Éxito",
        description: `Parámetro ${editingParametro ? 'actualizado' : 'creado'} correctamente`
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Eliminar parámetro
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('parametros_profesionales')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parametros_profesionales'] });
      toast({
        title: "Éxito",
        description: "Parámetro eliminado correctamente"
      });
    }
  });

  const handleOpenDialog = (parametro?: any) => {
    if (parametro) {
      setEditingParametro(parametro);
      setFormData(parametro);
    } else {
      setEditingParametro(null);
      setFormData({
        nombre: '',
        descripcion: '',
        tipo_dato: 'texto',
        categoria: 'otro',
        icono: 'Award',
        color: '#3b82f6',
        es_obligatorio: false,
        visible_en_detalles: true,
        orden_visualizacion: (parametros?.length || 0) + 1,
        activo: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingParametro(null);
  };

  const handleSubmit = () => {
    if (!formData.nombre || !formData.descripcion) {
      toast({
        title: "Error",
        description: "Nombre y descripción son obligatorios",
        variant: "destructive"
      });
      return;
    }
    saveMutation.mutate(formData);
  };

  const IconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || Award;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Parámetros Profesionales</CardTitle>
              <CardDescription>
                Gestiona parámetros personalizados para profesionales sanitarios
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Parámetro
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingParametro ? 'Editar' : 'Nuevo'} Parámetro
                  </DialogTitle>
                  <DialogDescription>
                    Define un nuevo campo personalizado para los profesionales
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre *</Label>
                      <Input
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        placeholder="Ej: Condecoraciones"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Categoría *</Label>
                      <Select
                        value={formData.categoria}
                        onValueChange={(value) => setFormData({...formData, categoria: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIA_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descripción *</Label>
                    <Textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                      placeholder="Describe el propósito de este parámetro"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Dato *</Label>
                      <Select
                        value={formData.tipo_dato}
                        onValueChange={(value) => setFormData({...formData, tipo_dato: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPO_DATO_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Icono</Label>
                      <Select
                        value={formData.icono}
                        onValueChange={(value) => setFormData({...formData, icono: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ICON_OPTIONS.map(icon => (
                            <SelectItem key={icon} value={icon}>
                              <div className="flex items-center gap-2">
                                {IconComponent(icon)}
                                {icon}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                      />
                    </div>
                  </div>

                  {(formData.tipo_dato === 'numero' || formData.tipo_dato === 'moneda') && (
                    <div className="space-y-2">
                      <Label>Unidad</Label>
                      <Input
                        value={formData.unidad || ''}
                        onChange={(e) => setFormData({...formData, unidad: e.target.value})}
                        placeholder="Ej: CFA, años, días"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Orden de Visualización</Label>
                      <Input
                        type="number"
                        value={formData.orden_visualizacion}
                        onChange={(e) => setFormData({...formData, orden_visualizacion: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Campo Obligatorio</Label>
                      <Switch
                        checked={formData.es_obligatorio}
                        onCheckedChange={(checked) => setFormData({...formData, es_obligatorio: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Visible en Detalles</Label>
                      <Switch
                        checked={formData.visible_en_detalles}
                        onCheckedChange={(checked) => setFormData({...formData, visible_en_detalles: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Activo</Label>
                      <Switch
                        checked={formData.activo}
                        onCheckedChange={(checked) => setFormData({...formData, activo: checked})}
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseDialog}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Cargando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orden</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parametros?.map((param) => (
                  <TableRow key={param.id}>
                    <TableCell>{param.orden_visualizacion}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div style={{ color: param.color }}>
                          {IconComponent(param.icono)}
                        </div>
                        {param.nombre}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {CATEGORIA_OPTIONS.find(c => c.value === param.categoria)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {TIPO_DATO_OPTIONS.find(t => t.value === param.tipo_dato)?.label}
                    </TableCell>
                    <TableCell>
                      <Badge variant={param.activo ? "default" : "secondary"}>
                        {param.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(param)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(param.id)}
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
};
