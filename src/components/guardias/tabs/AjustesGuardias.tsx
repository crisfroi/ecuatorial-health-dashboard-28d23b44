import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useGuardiasStore } from "@/stores/useGuardiasStore";
import { 
  Settings, 
  DollarSign, 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  RotateCcw,
  Database,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Users,
  Shield
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AjustesGuardiasProps {
  selectedMonth: number;
  selectedYear: number;
  selectedCenter: string | null;
  userRole: string;
}

export const AjustesGuardias: React.FC<AjustesGuardiasProps> = ({
  selectedMonth,
  selectedYear,
  selectedCenter,
  userRole
}) => {
  const { toast } = useToast();
  const {
    baremos,
    diasFestivos,
    ajustesBaremos,
    loading,
    fetchBaremos,
    fetchDiasFestivos,
    fetchAjustesBaremos,
    createBaremo,
    updateBaremo,
    deleteBaremo,
    createDiaFestivo,
    updateDiaFestivo,
    deleteDiaFestivo,
    createAjusteBaremo,
    updateAjusteBaremo,
    deleteAjusteBaremo,
    resetConfiguration,
    exportConfiguration,
    importConfiguration
  } = useGuardiasStore();

  const [selectedTab, setSelectedTab] = useState('baremos');
  const [isBaremoDialogOpen, setIsBaremoDialogOpen] = useState(false);
  const [isFestivoDialogOpen, setIsFestivoDialogOpen] = useState(false);
  const [isAjusteDialogOpen, setIsAjusteDialogOpen] = useState(false);
  
  const [editingBaremo, setEditingBaremo] = useState<any>(null);
  const [editingFestivo, setEditingFestivo] = useState<any>(null);
  const [editingAjuste, setEditingAjuste] = useState<any>(null);

  const [baremoForm, setBaremoForm] = useState({
    fuente: 'manual' as 'protocol' | 'excel' | 'manual',
    categoria: 'general_licenciado' as 'especialista' | 'general_licenciado' | 'tecnico_diplomado' | 'auxiliar' | 'subalterno' | 'odepac' | 'secre_asist_pacientes' | 'caja',
    tipo_guardia: 'fisica' as 'fisica' | 'localizable' | 'administrativa',
    tipo_dia: 'ordinario' as 'ordinario' | 'fin_semana' | 'festivo',
    valor: 0,
    porcentaje_localizable: 10,
    porcentaje_llamada: 20,
    vigente_desde: new Date().toISOString().split('T')[0],
    vigente_hasta: '',
    activo: true,
    observaciones: ''
  });

  const [festivoForm, setFestivoForm] = useState({
    nombre: '',
    fecha: '',
    tipo: 'NACIONAL' as 'NACIONAL' | 'REGIONAL' | 'LOCAL',
    recurrente: false,
    activo: true,
    observaciones: ''
  });

  const [ajusteForm, setAjusteForm] = useState({
    baremo_id: '',
    centro_id: selectedCenter || '',
    tipo_ajuste: 'PORCENTAJE' as 'PORCENTAJE' | 'MONTO_FIJO',
    valor_ajuste: 0,
    fecha_inicio: '',
    fecha_fin: '',
    motivo: '',
    activo: true,
    observaciones: ''
  });

  useEffect(() => {
    fetchBaremos();
    fetchDiasFestivos();
    fetchAjustesBaremos(selectedCenter);
  }, [selectedCenter]);

  const handleSubmitBaremo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingBaremo) {
        await updateBaremo(editingBaremo.id, baremoForm);
        toast({
          title: "Baremo actualizado",
          description: "El baremo ha sido actualizado correctamente.",
        });
      } else {
        await createBaremo(baremoForm);
        toast({
          title: "Baremo creado",
          description: "El nuevo baremo ha sido creado correctamente.",
        });
      }
      
      setIsBaremoDialogOpen(false);
      setEditingBaremo(null);
      resetBaremoForm();
      fetchBaremos();
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al procesar la solicitud.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitFestivo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingFestivo) {
        await updateDiaFestivo(editingFestivo.id, festivoForm);
        toast({
          title: "Día festivo actualizado",
          description: "El día festivo ha sido actualizado correctamente.",
        });
      } else {
        await createDiaFestivo(festivoForm);
        toast({
          title: "Día festivo creado",
          description: "El nuevo día festivo ha sido creado correctamente.",
        });
      }
      
      setIsFestivoDialogOpen(false);
      setEditingFestivo(null);
      resetFestivoForm();
      fetchDiasFestivos();
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al procesar la solicitud.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAjuste) {
        await updateAjusteBaremo(editingAjuste.id, ajusteForm);
        toast({
          title: "Ajuste actualizado",
          description: "El ajuste ha sido actualizado correctamente.",
        });
      } else {
        await createAjusteBaremo(ajusteForm);
        toast({
          title: "Ajuste creado",
          description: "El nuevo ajuste ha sido creado correctamente.",
        });
      }
      
      setIsAjusteDialogOpen(false);
      setEditingAjuste(null);
      resetAjusteForm();
      fetchAjustesBaremos(selectedCenter);
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al procesar la solicitud.",
        variant: "destructive",
      });
    }
  };

  const handleEditBaremo = (baremo: any) => {
    setEditingBaremo(baremo);
    setBaremoForm({
      concepto: baremo.concepto,
      tarifa_base: baremo.tarifa_base,
      multiplicador_nocturno: baremo.multiplicador_nocturno,
      multiplicador_festivo: baremo.multiplicador_festivo,
      activo: baremo.activo,
      fuente: baremo.fuente,
      observaciones: baremo.observaciones || ''
    });
    setIsBaremoDialogOpen(true);
  };

  const handleEditFestivo = (festivo: any) => {
    setEditingFestivo(festivo);
    setFestivoForm({
      nombre: festivo.nombre,
      fecha: festivo.fecha,
      tipo: festivo.tipo,
      recurrente: festivo.recurrente,
      activo: festivo.activo,
      observaciones: festivo.observaciones || ''
    });
    setIsFestivoDialogOpen(true);
  };

  const handleEditAjuste = (ajuste: any) => {
    setEditingAjuste(ajuste);
    setAjusteForm({
      baremo_id: ajuste.baremo_id,
      centro_id: ajuste.centro_id,
      tipo_ajuste: ajuste.tipo_ajuste,
      valor_ajuste: ajuste.valor_ajuste,
      fecha_inicio: ajuste.fecha_inicio,
      fecha_fin: ajuste.fecha_fin,
      motivo: ajuste.motivo,
      activo: ajuste.activo,
      observaciones: ajuste.observaciones || ''
    });
    setIsAjusteDialogOpen(true);
  };

  const handleDeleteBaremo = async (baremoId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este baremo?')) {
      try {
        await deleteBaremo(baremoId);
        toast({
          title: "Baremo eliminado",
          description: "El baremo ha sido eliminado correctamente.",
        });
        fetchBaremos();
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar el baremo.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteFestivo = async (festivoId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este día festivo?')) {
      try {
        await deleteDiaFestivo(festivoId);
        toast({
          title: "Día festivo eliminado",
          description: "El día festivo ha sido eliminado correctamente.",
        });
        fetchDiasFestivos();
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar el día festivo.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteAjuste = async (ajusteId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este ajuste?')) {
      try {
        await deleteAjusteBaremo(ajusteId);
        toast({
          title: "Ajuste eliminado",
          description: "El ajuste ha sido eliminado correctamente.",
        });
        fetchAjustesBaremos(selectedCenter);
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar el ajuste.",
          variant: "destructive",
        });
      }
    }
  };

  const resetBaremoForm = () => {
    setBaremoForm({
      concepto: '',
      tarifa_base: 0,
      multiplicador_nocturno: 1.5,
      multiplicador_festivo: 2.0,
      activo: true,
      fuente: 'PROTOCOLO',
      observaciones: ''
    });
  };

  const resetFestivoForm = () => {
    setFestivoForm({
      nombre: '',
      fecha: '',
      tipo: 'NACIONAL',
      recurrente: false,
      activo: true,
      observaciones: ''
    });
  };

  const resetAjusteForm = () => {
    setAjusteForm({
      baremo_id: '',
      centro_id: selectedCenter || '',
      tipo_ajuste: 'PORCENTAJE',
      valor_ajuste: 0,
      fecha_inicio: '',
      fecha_fin: '',
      motivo: '',
      activo: true,
      observaciones: ''
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'XAF'
    }).format(amount);
  };

  const canManageSettings = ['SUPER_ADMINISTRADOR'].includes(userRole);
  const canViewSettings = ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL', 'DIRECTIVO_CENTRO_SANITARIO'].includes(userRole);

  if (!canViewSettings) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Acceso Restringido
          </h3>
          <p className="text-gray-600">
            No tiene permisos para ver la configuración del sistema.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h2>
          <p className="text-gray-600">
            Gestión de baremos, días festivos y ajustes de cálculo
          </p>
        </div>
        
        {canManageSettings && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => exportConfiguration()}
            >
              <FileText className="w-4 h-4 mr-1" />
              Exportar Config
            </Button>
            <Button
              variant="outline"
              onClick={() => document.getElementById('import-config')?.click()}
            >
              <Database className="w-4 h-4 mr-1" />
              Importar Config
            </Button>
            <input
              id="import-config"
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  importConfiguration(file);
                }
              }}
            />
          </div>
        )}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="baremos">Baremos y Tarifas</TabsTrigger>
          <TabsTrigger value="festivos">Días Festivos</TabsTrigger>
          <TabsTrigger value="ajustes">Ajustes por Centro</TabsTrigger>
          <TabsTrigger value="configuracion">Configuración General</TabsTrigger>
        </TabsList>

        <TabsContent value="baremos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Baremos de Cálculo</h3>
            {canManageSettings && (
              <Dialog open={isBaremoDialogOpen} onOpenChange={setIsBaremoDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetBaremoForm(); setEditingBaremo(null); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Baremo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingBaremo ? 'Editar Baremo' : 'Crear Nuevo Baremo'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmitBaremo} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="concepto">Concepto *</Label>
                        <Input
                          id="concepto"
                          value={baremoForm.concepto}
                          onChange={(e) => setBaremoForm(prev => ({ ...prev, concepto: e.target.value }))}
                          placeholder="Ej: Guardia Médico General"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="tarifa_base">Tarifa Base (XAF) *</Label>
                        <Input
                          id="tarifa_base"
                          type="number"
                          step="0.01"
                          value={baremoForm.tarifa_base}
                          onChange={(e) => setBaremoForm(prev => ({ ...prev, tarifa_base: parseFloat(e.target.value) || 0 }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="multiplicador_nocturno">Multiplicador Nocturno</Label>
                        <Input
                          id="multiplicador_nocturno"
                          type="number"
                          step="0.1"
                          value={baremoForm.multiplicador_nocturno}
                          onChange={(e) => setBaremoForm(prev => ({ ...prev, multiplicador_nocturno: parseFloat(e.target.value) || 1 }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="multiplicador_festivo">Multiplicador Festivo</Label>
                        <Input
                          id="multiplicador_festivo"
                          type="number"
                          step="0.1"
                          value={baremoForm.multiplicador_festivo}
                          onChange={(e) => setBaremoForm(prev => ({ ...prev, multiplicador_festivo: parseFloat(e.target.value) || 1 }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fuente">Fuente</Label>
                        <Select
                          value={baremoForm.fuente}
                          onValueChange={(value: 'PROTOCOLO' | 'EXCEL') => 
                            setBaremoForm(prev => ({ ...prev, fuente: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PROTOCOLO">Protocolo Oficial</SelectItem>
                            <SelectItem value="EXCEL">Hoja de Cálculo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2 pt-6">
                        <Switch
                          id="activo"
                          checked={baremoForm.activo}
                          onCheckedChange={(checked) => setBaremoForm(prev => ({ ...prev, activo: checked }))}
                        />
                        <Label htmlFor="activo">Activo</Label>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="observaciones">Observaciones</Label>
                      <Textarea
                        id="observaciones"
                        value={baremoForm.observaciones}
                        onChange={(e) => setBaremoForm(prev => ({ ...prev, observaciones: e.target.value }))}
                        placeholder="Observaciones adicionales..."
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsBaremoDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {editingBaremo ? 'Actualizar' : 'Crear'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="space-y-4">
            {baremos.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay baremos configurados
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Los baremos son necesarios para calcular los montos de las guardias.
                  </p>
                  {canManageSettings && (
                    <Button onClick={() => setIsBaremoDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Primer Baremo
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              baremos.map((baremo) => (
                <Card key={baremo.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg">{baremo.concepto}</h3>
                          <Badge variant={baremo.activo ? "default" : "secondary"}>
                            {baremo.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                          <Badge variant="outline">{baremo.fuente}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-medium">Tarifa Base:</span>
                            <p className="text-lg font-bold text-green-600">{formatCurrency(baremo.tarifa_base)}</p>
                          </div>
                          <div>
                            <span className="font-medium">Multiplicador Nocturno:</span>
                            <p className="text-lg font-bold text-blue-600">{baremo.multiplicador_nocturno}x</p>
                          </div>
                          <div>
                            <span className="font-medium">Multiplicador Festivo:</span>
                            <p className="text-lg font-bold text-orange-600">{baremo.multiplicador_festivo}x</p>
                          </div>
                          <div>
                            <span className="font-medium">Última Actualización:</span>
                            <p className="text-sm">{new Date(baremo.updated_at).toLocaleDateString('es-ES')}</p>
                          </div>
                        </div>

                        {baremo.observaciones && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{baremo.observaciones}</p>
                          </div>
                        )}
                      </div>
                      
                      {canManageSettings && (
                        <div className="flex space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditBaremo(baremo)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteBaremo(baremo.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="festivos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Días Festivos</h3>
            {canManageSettings && (
              <Dialog open={isFestivoDialogOpen} onOpenChange={setIsFestivoDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetFestivoForm(); setEditingFestivo(null); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Día Festivo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingFestivo ? 'Editar Día Festivo' : 'Crear Nuevo Día Festivo'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmitFestivo} className="space-y-4">
                    <div>
                      <Label htmlFor="nombre">Nombre *</Label>
                      <Input
                        id="nombre"
                        value={festivoForm.nombre}
                        onChange={(e) => setFestivoForm(prev => ({ ...prev, nombre: e.target.value }))}
                        placeholder="Ej: Día de la Independencia"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fecha">Fecha *</Label>
                        <Input
                          id="fecha"
                          type="date"
                          value={festivoForm.fecha}
                          onChange={(e) => setFestivoForm(prev => ({ ...prev, fecha: e.target.value }))}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="tipo">Tipo</Label>
                        <Select
                          value={festivoForm.tipo}
                          onValueChange={(value: 'NACIONAL' | 'REGIONAL' | 'LOCAL') => 
                            setFestivoForm(prev => ({ ...prev, tipo: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NACIONAL">Nacional</SelectItem>
                            <SelectItem value="REGIONAL">Regional</SelectItem>
                            <SelectItem value="LOCAL">Local</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="recurrente"
                          checked={festivoForm.recurrente}
                          onCheckedChange={(checked) => setFestivoForm(prev => ({ ...prev, recurrente: checked }))}
                        />
                        <Label htmlFor="recurrente">Recurrente (anual)</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="activo"
                          checked={festivoForm.activo}
                          onCheckedChange={(checked) => setFestivoForm(prev => ({ ...prev, activo: checked }))}
                        />
                        <Label htmlFor="activo">Activo</Label>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="observaciones">Observaciones</Label>
                      <Textarea
                        id="observaciones"
                        value={festivoForm.observaciones}
                        onChange={(e) => setFestivoForm(prev => ({ ...prev, observaciones: e.target.value }))}
                        placeholder="Observaciones adicionales..."
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsFestivoDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {editingFestivo ? 'Actualizar' : 'Crear'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="space-y-4">
            {diasFestivos.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay días festivos configurados
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Los días festivos afectan el cálculo de guardias con multiplicadores especiales.
                  </p>
                  {canManageSettings && (
                    <Button onClick={() => setIsFestivoDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Primer Día Festivo
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              diasFestivos.map((festivo) => (
                <Card key={festivo.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg">{festivo.nombre}</h3>
                          <Badge variant={festivo.activo ? "default" : "secondary"}>
                            {festivo.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                          <Badge variant="outline">{festivo.tipo}</Badge>
                          {festivo.recurrente && (
                            <Badge className="bg-blue-100 text-blue-800">Recurrente</Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(festivo.fecha).toLocaleDateString('es-ES')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>Tipo: {festivo.tipo}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RotateCcw className="w-4 h-4" />
                            <span>{festivo.recurrente ? 'Anual' : 'Fecha única'}</span>
                          </div>
                        </div>

                        {festivo.observaciones && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{festivo.observaciones}</p>
                          </div>
                        )}
                      </div>
                      
                      {canManageSettings && (
                        <div className="flex space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditFestivo(festivo)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteFestivo(festivo.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="ajustes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Ajustes por Centro</h3>
            {canManageSettings && (
              <Dialog open={isAjusteDialogOpen} onOpenChange={setIsAjusteDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetAjusteForm(); setEditingAjuste(null); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Ajuste
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingAjuste ? 'Editar Ajuste' : 'Crear Nuevo Ajuste'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmitAjuste} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="baremo_id">Baremo *</Label>
                        <Select
                          value={ajusteForm.baremo_id}
                          onValueChange={(value) => setAjusteForm(prev => ({ ...prev, baremo_id: value }))}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar baremo" />
                          </SelectTrigger>
                          <SelectContent>
                            {baremos.filter(b => b.activo).map((baremo) => (
                              <SelectItem key={baremo.id} value={baremo.id}>
                                {baremo.concepto}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="tipo_ajuste">Tipo de Ajuste</Label>
                        <Select
                          value={ajusteForm.tipo_ajuste}
                          onValueChange={(value: 'PORCENTAJE' | 'MONTO_FIJO') => 
                            setAjusteForm(prev => ({ ...prev, tipo_ajuste: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PORCENTAJE">Porcentaje (%)</SelectItem>
                            <SelectItem value="MONTO_FIJO">Monto Fijo (XAF)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="valor_ajuste">
                          Valor del Ajuste {ajusteForm.tipo_ajuste === 'PORCENTAJE' ? '(%)' : '(XAF)'}
                        </Label>
                        <Input
                          id="valor_ajuste"
                          type="number"
                          step="0.01"
                          value={ajusteForm.valor_ajuste}
                          onChange={(e) => setAjusteForm(prev => ({ ...prev, valor_ajuste: parseFloat(e.target.value) || 0 }))}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="motivo">Motivo *</Label>
                        <Input
                          id="motivo"
                          value={ajusteForm.motivo}
                          onChange={(e) => setAjusteForm(prev => ({ ...prev, motivo: e.target.value }))}
                          placeholder="Ej: Zona remota, condiciones especiales"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fecha_inicio">Fecha Inicio</Label>
                        <Input
                          id="fecha_inicio"
                          type="date"
                          value={ajusteForm.fecha_inicio}
                          onChange={(e) => setAjusteForm(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="fecha_fin">Fecha Fin</Label>
                        <Input
                          id="fecha_fin"
                          type="date"
                          value={ajusteForm.fecha_fin}
                          onChange={(e) => setAjusteForm(prev => ({ ...prev, fecha_fin: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="observaciones">Observaciones</Label>
                      <Textarea
                        id="observaciones"
                        value={ajusteForm.observaciones}
                        onChange={(e) => setAjusteForm(prev => ({ ...prev, observaciones: e.target.value }))}
                        placeholder="Observaciones adicionales..."
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="activo"
                        checked={ajusteForm.activo}
                        onCheckedChange={(checked) => setAjusteForm(prev => ({ ...prev, activo: checked }))}
                      />
                      <Label htmlFor="activo">Activo</Label>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAjusteDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {editingAjuste ? 'Actualizar' : 'Crear'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="space-y-4">
            {ajustesBaremos.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay ajustes configurados
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Los ajustes permiten modificar los baremos base según condiciones específicas.
                  </p>
                  {canManageSettings && (
                    <Button onClick={() => setIsAjusteDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Primer Ajuste
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              ajustesBaremos.map((ajuste) => (
                <Card key={ajuste.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg">{ajuste.motivo}</h3>
                          <Badge variant={ajuste.activo ? "default" : "secondary"}>
                            {ajuste.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                          <Badge variant="outline">
                            {ajuste.tipo_ajuste === 'PORCENTAJE' ? 
                              `${ajuste.valor_ajuste}%` : 
                              formatCurrency(ajuste.valor_ajuste)
                            }
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Baremo:</span>
                            <p>{ajuste.baremo?.concepto}</p>
                          </div>
                          <div>
                            <span className="font-medium">Vigencia:</span>
                            <p>
                              {ajuste.fecha_inicio ? new Date(ajuste.fecha_inicio).toLocaleDateString('es-ES') : 'Sin inicio'} - 
                              {ajuste.fecha_fin ? new Date(ajuste.fecha_fin).toLocaleDateString('es-ES') : 'Sin fin'}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Centro:</span>
                            <p>{ajuste.centro?.nombre || 'Todos los centros'}</p>
                          </div>
                        </div>

                        {ajuste.observaciones && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{ajuste.observaciones}</p>
                          </div>
                        )}
                      </div>
                      
                      {canManageSettings && (
                        <div className="flex space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAjuste(ajuste)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAjuste(ajuste.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="configuracion" className="space-y-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Gestión de Datos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Exportar Configuración</h4>
                    <p className="text-sm text-gray-600">
                      Descarga un archivo con toda la configuración actual del sistema.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => exportConfiguration()}
                      disabled={!canManageSettings}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Importar Configuración</h4>
                    <p className="text-sm text-gray-600">
                      Carga una configuración desde un archivo previamente exportado.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => document.getElementById('import-config-2')?.click()}
                      disabled={!canManageSettings}
                    >
                      <Database className="w-4 h-4 mr-2" />
                      Importar
                    </Button>
                    <input
                      id="import-config-2"
                      type="file"
                      accept=".json"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          importConfiguration(file);
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {canManageSettings && (
              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-orange-700">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Zona de Peligro</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-medium text-orange-800 mb-2">Resetear Configuración</h4>
                    <p className="text-sm text-orange-700 mb-4">
                      Esta acción eliminará todos los baremos, días festivos y ajustes configurados. 
                      <strong> Esta acción no se puede deshacer.</strong>
                    </p>
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        if (window.confirm('¿Está COMPLETAMENTE seguro de que desea resetear toda la configuración? Esta acción NO SE PUEDE DESHACER.')) {
                          resetConfiguration();
                        }
                      }}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Resetear Todo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
