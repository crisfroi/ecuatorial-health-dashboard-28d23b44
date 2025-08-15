import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Upload, Download, Save, RefreshCw, Edit3 } from 'lucide-react';
import { useConfiguracion, useUpdateConfiguracion } from '@/hooks/useGuardSystem';
import { useToast } from '@/hooks/use-toast';
import BaremoEditor from './BaremoEditor';
import { FuenteBaremo } from '@/types/guardias';

const AjustesGuardias: React.FC = () => {
  const { toast } = useToast();
  const { data: configuracion, isLoading } = useConfiguracion();
  const updateConfiguracion = useUpdateConfiguracion();
  
  const [localConfig, setLocalConfig] = useState({
    validacionAutomatica: false,
    notificacionesEmail: true,
    notificacionesSMS: false,
    exportarPDFAutomatico: true,
    fuenteBaremo: 'protocol' as FuenteBaremo,
    horasMinimas: 12,
    horasMaximas: 24,
    diasValidacion: 7,
    porcentajeFestivo: 50
  });

  // Update local config when data loads
  React.useEffect(() => {
    if (configuracion) {
      setLocalConfig(prev => ({
        ...prev,
        fuenteBaremo: configuracion.fuenteBaremo,
        horasMinimas: configuracion.duracionMinima,
        horasMaximas: configuracion.duracionMaxima,
        validacionAutomatica: configuracion.notificacionesActivas
      }));
    }
  }, [configuracion]);

  const handleSaveConfig = async () => {
    try {
      await updateConfiguracion.mutateAsync({
        fuenteBaremo: localConfig.fuenteBaremo,
        duracionMinima: localConfig.horasMinimas,
        duracionMaxima: localConfig.horasMaximas,
        notificacionesActivas: localConfig.validacionAutomatica
      });
      toast({
        title: "Configuración guardada",
        description: "Los cambios se han aplicado exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración. Intenta nuevamente.",
        variant: "destructive",
      });
    }
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
            <Settings className="h-6 w-6" />
            Configuración del Sistema
          </h2>
          <p className="text-gray-600">
            Personalización de baremos, reglas y preferencias
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            className="flex items-center gap-2"
            onClick={handleSaveConfig}
            disabled={updateConfiguracion.isPending}
          >
            <Save className="h-4 w-4" />
            {updateConfiguracion.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" />
            Restablecer
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Configuración General</TabsTrigger>
          <TabsTrigger value="baremos">Editor de Baremos</TabsTrigger>
          <TabsTrigger value="avanzado">Configuración Avanzada</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración General</CardTitle>
                <CardDescription>
                  Preferencias básicas del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="validacion-automatica">Validación Automática</Label>
                    <p className="text-sm text-gray-600">
                      Validar guardias automáticamente tras 24h
                    </p>
                  </div>
                  <Switch
                    id="validacion-automatica"
                    checked={localConfig.validacionAutomatica}
                    onCheckedChange={(checked) => 
                      setLocalConfig(prev => ({ ...prev, validacionAutomatica: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notificaciones-email">Notificaciones Email</Label>
                    <p className="text-sm text-gray-600">
                      Enviar notificaciones por correo electrónico
                    </p>
                  </div>
                  <Switch
                    id="notificaciones-email"
                    checked={localConfig.notificacionesEmail}
                    onCheckedChange={(checked) => 
                      setLocalConfig(prev => ({ ...prev, notificacionesEmail: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notificaciones-sms">Notificaciones SMS</Label>
                    <p className="text-sm text-gray-600">
                      Enviar notificaciones por mensaje de texto
                    </p>
                  </div>
                  <Switch
                    id="notificaciones-sms"
                    checked={localConfig.notificacionesSMS}
                    onCheckedChange={(checked) => 
                      setLocalConfig(prev => ({ ...prev, notificacionesSMS: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="exportar-pdf">Exportación Automática</Label>
                    <p className="text-sm text-gray-600">
                      Generar PDFs automáticamente al validar
                    </p>
                  </div>
                  <Switch
                    id="exportar-pdf"
                    checked={localConfig.exportarPDFAutomatico}
                    onCheckedChange={(checked) => 
                      setLocalConfig(prev => ({ ...prev, exportarPDFAutomatico: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gestión de Baremos</CardTitle>
                <CardDescription>
                  Configuración de tarifas y baremos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fuente-baremo">Fuente de Baremos</Label>
                  <Select 
                    value={localConfig.fuenteBaremo} 
                    onValueChange={(value) => setLocalConfig(prev => ({ ...prev, fuenteBaremo: value as FuenteBaremo }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="protocol">Protocolo Oficial</SelectItem>
                      <SelectItem value="excel">Hoja Excel Personalizada</SelectItem>
                      <SelectItem value="manual">Configuración Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Cargar Excel
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Descargar Plantilla
                  </Button>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900">Estado Actual</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Fuente: {localConfig.fuenteBaremo === 'protocol' ? 'Protocolo Oficial' : 
                             localConfig.fuenteBaremo === 'excel' ? 'Excel Personalizado' : 'Manual'}
                  </p>
                  <p className="text-sm text-blue-700">
                    Duración: {localConfig.horasMinimas}h - {localConfig.horasMaximas}h
                  </p>
                  <Badge variant="outline" className="text-blue-600 mt-2">
                    Sincronizado con BD
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="baremos">
          <BaremoEditor />
        </TabsContent>

        <TabsContent value="avanzado">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Avanzada</CardTitle>
              <CardDescription>
                Opciones avanzadas del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horas-minimas">Horas Mínimas por Guardia</Label>
                  <Input
                    id="horas-minimas"
                    type="number"
                    value={localConfig.horasMinimas}
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, horasMinimas: parseInt(e.target.value) || 12 }))}
                    min="8"
                    max="24"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="horas-maximas">Horas Máximas por Guardia</Label>
                  <Input
                    id="horas-maximas"
                    type="number"
                    value={localConfig.horasMaximas}
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, horasMaximas: parseInt(e.target.value) || 24 }))}
                    min="12"
                    max="48"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dias-validacion">Días para Validación</Label>
                  <Input
                    id="dias-validacion"
                    type="number"
                    value={localConfig.diasValidacion}
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, diasValidacion: parseInt(e.target.value) || 7 }))}
                    min="1"
                    max="30"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="porcentaje-festivo">% Extra Días Festivos</Label>
                  <Input
                    id="porcentaje-festivo"
                    type="number"
                    value={localConfig.porcentajeFestivo}
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, porcentajeFestivo: parseInt(e.target.value) || 50 }))}
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Información del Sistema</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900">Configuración Activa</div>
                    <div className="text-gray-600">
                      {configuracion ? 'Cargada desde BD' : 'Valores por defecto'}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900">Última Actualización</div>
                    <div className="text-gray-600">
                      {new Date().toLocaleDateString()}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900">Estado Baremos</div>
                    <div className="text-gray-600">
                      Protocolo Oficial
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AjustesGuardias;
