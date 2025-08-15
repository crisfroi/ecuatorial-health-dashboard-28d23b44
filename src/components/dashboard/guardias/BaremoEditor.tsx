import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Save, Plus, Trash2, Download, Upload, AlertTriangle, Calendar, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBaremos, useUpdateBaremo, useCreateBaremo } from '@/hooks/useGuardSystem';
import { AjusteBaremo, CategoriaProfesional, TipoGuardia, TipoDia, FuenteBaremo } from '@/types/guardias';

const categoriaLabels: Record<CategoriaProfesional, string> = {
  'especialista': 'Médico Especialista',
  'general_licenciado': 'Médico General/Licenciado',
  'tecnico_diplomado': 'Técnico Superior/Diplomado',
  'auxiliar': 'Auxiliar de Enfermería',
  'subalterno': 'Personal Subalterno',
  'odepac': 'ODEPAC',
  'secre_asist_pacientes': 'Secretaria/Asistente Pacientes',
  'caja': 'Personal de Caja'
};

const tipoGuardiaLabels: Record<TipoGuardia, string> = {
  'fisica': 'Guardia Física',
  'localizable': 'Guardia Localizable',
  'administrativa': 'Guardia Administrativa'
};

const tipoDiaLabels: Record<TipoDia, string> = {
  'ordinario': 'Día Ordinario',
  'fin_semana': 'Fin de Semana',
  'festivo': 'Día Festivo'
};

const BaremoEditor: React.FC = () => {
  const { toast } = useToast();
  const { data: baremos = [], isLoading } = useBaremos();
  const updateBaremo = useUpdateBaremo();
  const createBaremo = useCreateBaremo();

  const [editingBaremo, setEditingBaremo] = useState<AjusteBaremo | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaProfesional | 'all'>('all');
  const [filtroTipoGuardia, setFiltroTipoGuardia] = useState<TipoGuardia | 'all'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [newBaremo, setNewBaremo] = useState({
    fuente: 'protocol' as FuenteBaremo,
    categoria: 'especialista' as CategoriaProfesional,
    tipoGuardia: 'fisica' as TipoGuardia,
    tipoDia: 'ordinario' as TipoDia,
    valor: 0,
    porcentajeCondicion: 0,
    porcentajeLlamada: 0,
    vigenteDesde: new Date().toISOString().split('T')[0],
    vigenteHasta: ''
  });

  // Group baremos by category for better organization
  const baremosPorCategoria = React.useMemo(() => {
    const filtered = baremos.filter(baremo => {
      const matchCategoria = filtroCategoria === 'all' || baremo.categoria === filtroCategoria;
      const matchTipo = filtroTipoGuardia === 'all' || baremo.tipoGuardia === filtroTipoGuardia;
      return matchCategoria && matchTipo && baremo.activo;
    });

    return filtered.reduce((acc, baremo) => {
      if (!acc[baremo.categoria]) {
        acc[baremo.categoria] = [];
      }
      acc[baremo.categoria].push(baremo);
      return acc;
    }, {} as Record<CategoriaProfesional, AjusteBaremo[]>);
  }, [baremos, filtroCategoria, filtroTipoGuardia]);

  const handleUpdateBaremo = async (baremo: AjusteBaremo, updates: Partial<AjusteBaremo>) => {
    try {
      await updateBaremo.mutateAsync({ id: baremo.id, updates });
      toast({
        title: "Baremo actualizado",
        description: "Los cambios se han guardado exitosamente.",
      });
      setEditingBaremo(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el baremo. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleCreateBaremo = async () => {
    try {
      await createBaremo.mutateAsync({
        fuente: newBaremo.fuente,
        categoria: newBaremo.categoria,
        tipoGuardia: newBaremo.tipoGuardia,
        tipoDia: newBaremo.tipoDia,
        valor: newBaremo.valor,
        porcentajeLocalizable: newBaremo.porcentajeCondicion > 0 || newBaremo.porcentajeLlamada > 0 ? {
          condicion: newBaremo.porcentajeCondicion,
          llamada: newBaremo.porcentajeLlamada
        } : undefined,
        vigenteDesde: new Date(newBaremo.vigenteDesde),
        vigenteHasta: newBaremo.vigenteHasta ? new Date(newBaremo.vigenteHasta) : undefined
      });

      toast({
        title: "Baremo creado",
        description: "El nuevo baremo se ha creado exitosamente.",
      });

      setShowCreateDialog(false);
      setNewBaremo({
        fuente: 'protocol',
        categoria: 'especialista',
        tipoGuardia: 'fisica',
        tipoDia: 'ordinario',
        valor: 0,
        porcentajeCondicion: 0,
        porcentajeLlamada: 0,
        vigenteDesde: new Date().toISOString().split('T')[0],
        vigenteHasta: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el baremo. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'XAF', // Central African CFA franc
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Edit className="h-6 w-6" />
            Editor de Baremos
          </h2>
          <p className="text-gray-600">
            Configuración de tarifas por categoría profesional y tipo de guardia
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Baremo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Baremo</DialogTitle>
                <DialogDescription>
                  Define un nuevo ajuste de baremo para una categoría específica
                </DialogDescription>
              </DialogHeader>
              {/* TODO: Add create form */}
              <div className="text-center text-gray-500 py-4">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>Formulario de creación en desarrollo</p>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Importar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoría Profesional</Label>
              <Select value={filtroCategoria} onValueChange={(value) => setFiltroCategoria(value as CategoriaProfesional | 'all')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {Object.entries(categoriaLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Tipo de Guardia</Label>
              <Select value={filtroTipoGuardia} onValueChange={(value) => setFiltroTipoGuardia(value as TipoGuardia | 'all')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {Object.entries(tipoGuardiaLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Baremo Tables by Category */}
      <Tabs defaultValue={Object.keys(baremosPorCategoria)[0] || 'especialista'} className="w-full">
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
          {Object.keys(categoriaLabels).map((categoria) => (
            <TabsTrigger 
              key={categoria} 
              value={categoria}
              className="text-xs"
              disabled={!baremosPorCategoria[categoria as CategoriaProfesional]?.length}
            >
              {categoriaLabels[categoria as CategoriaProfesional].split(' ')[0]}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(baremosPorCategoria).map(([categoria, baremosCategoria]) => (
          <TabsContent key={categoria} value={categoria} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{categoriaLabels[categoria as CategoriaProfesional]}</span>
                  <Badge variant="outline">
                    {baremosCategoria.length} baremos activos
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Tarifas vigentes para {categoriaLabels[categoria as CategoriaProfesional].toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo de Guardia</TableHead>
                      <TableHead>Día Ordinario</TableHead>
                      <TableHead>Fin de Semana</TableHead>
                      <TableHead>Día Festivo</TableHead>
                      <TableHead>Localizable %</TableHead>
                      <TableHead>Vigencia</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tipoGuardiaLabels && Object.keys(tipoGuardiaLabels).map((tipoGuardia) => {
                      const baremosDelTipo = baremosCategoria.filter(b => b.tipoGuardia === tipoGuardia);
                      
                      if (baremosDelTipo.length === 0) {
                        return (
                          <TableRow key={tipoGuardia}>
                            <TableCell className="font-medium">
                              {tipoGuardiaLabels[tipoGuardia as TipoGuardia]}
                            </TableCell>
                            <TableCell colSpan={6} className="text-center text-gray-500">
                              Sin baremos configurados
                            </TableCell>
                          </TableRow>
                        );
                      }

                      const ordinario = baremosDelTipo.find(b => b.tipoDia === 'ordinario');
                      const finSemana = baremosDelTipo.find(b => b.tipoDia === 'fin_semana');
                      const festivo = baremosDelTipo.find(b => b.tipoDia === 'festivo');

                      return (
                        <TableRow key={tipoGuardia}>
                          <TableCell className="font-medium">
                            {tipoGuardiaLabels[tipoGuardia as TipoGuardia]}
                          </TableCell>
                          <TableCell>
                            {ordinario ? (
                              <div className="flex items-center gap-2">
                                <span className="font-mono">{formatCurrency(ordinario.valor)}</span>
                                {editingBaremo?.id === ordinario.id && (
                                  <Input
                                    type="number"
                                    className="w-24 h-8"
                                    defaultValue={ordinario.valor}
                                    onBlur={(e) => {
                                      const newValue = parseFloat(e.target.value);
                                      if (newValue && newValue !== ordinario.valor) {
                                        handleUpdateBaremo(ordinario, { valor: newValue });
                                      }
                                    }}
                                  />
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {finSemana ? (
                              <span className="font-mono">{formatCurrency(finSemana.valor)}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {festivo ? (
                              <span className="font-mono">{formatCurrency(festivo.valor)}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {ordinario?.porcentajeLocalizable ? (
                              <div className="text-sm">
                                <div>Cond: {ordinario.porcentajeLocalizable.condicion}%</div>
                                <div>Llam: {ordinario.porcentajeLocalizable.llamada}%</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {ordinario && (
                              <div className="text-sm">
                                <div>Desde: {ordinario.vigenteDesde.toLocaleDateString()}</div>
                                {ordinario.vigenteHasta && (
                                  <div>Hasta: {ordinario.vigenteHasta.toLocaleDateString()}</div>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {ordinario && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingBaremo(editingBaremo?.id === ordinario.id ? null : ordinario)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="ghost" className="text-red-600">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                                      Confirmar eliminación
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      ¿Estás seguro de que deseas desactivar este baremo? 
                                      Esta acción afectará futuros cálculos de nómina.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                                      Desactivar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Resumen de Baremos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{baremos.length}</div>
              <div className="text-sm text-gray-600">Total Baremos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {baremos.filter(b => b.activo).length}
              </div>
              <div className="text-sm text-gray-600">Activos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Object.keys(baremosPorCategoria).length}
              </div>
              <div className="text-sm text-gray-600">Categorías</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(
                  baremos
                    .filter(b => b.activo)
                    .reduce((sum, b) => sum + b.valor, 0) / baremos.filter(b => b.activo).length || 0
                )}
              </div>
              <div className="text-sm text-gray-600">Valor Promedio</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BaremoEditor;
