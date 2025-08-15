import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Upload, Download, Save, RefreshCw } from 'lucide-react';

const AjustesGuardias: React.FC = () => {
  const [configuracionGeneral, setConfiguracionGeneral] = useState({
    validacionAutomatica: false,
    notificacionesEmail: true,
    notificacionesSMS: false,
    exportarPDFAutomatico: true
  });

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
          <Button size="sm" className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Guardar Cambios
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Restablecer
          </Button>
        </div>
      </div>

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
                checked={configuracionGeneral.validacionAutomatica}
                onCheckedChange={(checked) => 
                  setConfiguracionGeneral(prev => ({ ...prev, validacionAutomatica: checked }))
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
                checked={configuracionGeneral.notificacionesEmail}
                onCheckedChange={(checked) => 
                  setConfiguracionGeneral(prev => ({ ...prev, notificacionesEmail: checked }))
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
                checked={configuracionGeneral.notificacionesSMS}
                onCheckedChange={(checked) => 
                  setConfiguracionGeneral(prev => ({ ...prev, notificacionesSMS: checked }))
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
                checked={configuracionGeneral.exportarPDFAutomatico}
                onCheckedChange={(checked) => 
                  setConfiguracionGeneral(prev => ({ ...prev, exportarPDFAutomatico: checked }))
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
              <Select defaultValue="protocol">
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
                Usando protocolo oficial con 8 categorías profesionales
              </p>
              <Badge variant="outline" className="text-blue-600 mt-2">
                Activo
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Baremos por Categoría</CardTitle>
          <CardDescription>
            Configuración detallada de tarifas por categoría profesional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">Editor de Baremos</h3>
            <p>Esta funcionalidad se está implementando.</p>
            <p className="text-sm mt-2">
              Permitirá editar tarifas por categoría, tipo de guardia y día.
            </p>
          </div>
        </CardContent>
      </Card>

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
                defaultValue="12"
                min="8"
                max="24"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="horas-maximas">Horas Máximas por Guardia</Label>
              <Input
                id="horas-maximas"
                type="number"
                defaultValue="24"
                min="12"
                max="48"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dias-validacion">Días para Validación</Label>
              <Input
                id="dias-validacion"
                type="number"
                defaultValue="7"
                min="1"
                max="30"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="porcentaje-festivo">% Extra Días Festivos</Label>
              <Input
                id="porcentaje-festivo"
                type="number"
                defaultValue="50"
                min="0"
                max="100"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AjustesGuardias;
