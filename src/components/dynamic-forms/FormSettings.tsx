import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Globe, 
  Shield, 
  Palette, 
  Link,
  Copy,
  Eye,
  Users,
  Clock,
  CheckCircle
} from 'lucide-react';
import { FormSettings as FormSettingsType, PublicFormSettings, FormTheme } from '@/types/dynamic-forms';

interface FormSettingsProps {
  settings: FormSettingsType;
  publicSettings: PublicFormSettings;
  onSettingsChange: (settings: FormSettingsType) => void;
  onPublicSettingsChange: (settings: PublicFormSettings) => void;
}

export const FormSettings: React.FC<FormSettingsProps> = ({
  settings,
  publicSettings,
  onSettingsChange,
  onPublicSettingsChange
}) => {
  const updateSettings = (updates: Partial<FormSettingsType>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  const updatePublicSettings = (updates: Partial<PublicFormSettings>) => {
    onPublicSettingsChange({ ...publicSettings, ...updates });
  };

  const updateTheme = (updates: Partial<FormTheme>) => {
    updateSettings({
      theme: { ...settings.theme, ...updates }
    });
  };

  const copyPublicUrl = () => {
    if (publicSettings.publicUrl) {
      navigator.clipboard.writeText(`${window.location.origin}/form/${publicSettings.publicUrl}`);
      // Aquí podrías mostrar un toast de confirmación
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuración general */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuración General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="multipleSubmissions">Permitir múltiples envíos</Label>
              <Switch
                id="multipleSubmissions"
                checked={settings.allowMultipleSubmissions}
                onCheckedChange={(checked) => updateSettings({ allowMultipleSubmissions: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="requireAuth">Requerir autenticación</Label>
              <Switch
                id="requireAuth"
                checked={settings.requireAuthentication}
                onCheckedChange={(checked) => updateSettings({ requireAuthentication: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showProgress">Mostrar barra de progreso</Label>
              <Switch
                id="showProgress"
                checked={settings.showProgressBar}
                onCheckedChange={(checked) => updateSettings({ showProgressBar: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="autoSave">Guardado automático</Label>
              <Switch
                id="autoSave"
                checked={settings.autoSave}
                onCheckedChange={(checked) => updateSettings({ autoSave: checked })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="maxSubmissions">Límite de envíos (opcional)</Label>
            <Input
              id="maxSubmissions"
              type="number"
              value={settings.maxSubmissions || ''}
              onChange={(e) => updateSettings({ 
                maxSubmissions: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              placeholder="Sin límite"
            />
          </div>

          <div>
            <Label htmlFor="confirmationMessage">Mensaje de confirmación</Label>
            <Textarea
              id="confirmationMessage"
              value={settings.confirmationMessage || ''}
              onChange={(e) => updateSettings({ confirmationMessage: e.target.value })}
              placeholder="¡Gracias por completar el formulario!"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="redirectUrl">URL de redirección (opcional)</Label>
            <Input
              id="redirectUrl"
              value={settings.redirectUrl || ''}
              onChange={(e) => updateSettings({ redirectUrl: e.target.value })}
              placeholder="https://ejemplo.com/gracias"
            />
          </div>
        </CardContent>
      </Card>

      {/* Configuración pública */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Configuración Pública
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="isPublic">Formulario público</Label>
            <Switch
              id="isPublic"
              checked={publicSettings.isPublic}
              onCheckedChange={(checked) => updatePublicSettings({ isPublic: checked })}
            />
          </div>

          {publicSettings.isPublic && (
            <>
              <div>
                <Label>URL pública</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={`${window.location.origin}/form/${publicSettings.publicUrl}`}
                    readOnly
                    className="bg-gray-50"
                  />
                  <Button size="sm" variant="outline" onClick={copyPublicUrl}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="allowAnonymous">Permitir anónimo</Label>
                  <Switch
                    id="allowAnonymous"
                    checked={publicSettings.allowAnonymous}
                    onCheckedChange={(checked) => updatePublicSettings({ allowAnonymous: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="collectEmail">Recopilar email</Label>
                  <Switch
                    id="collectEmail"
                    checked={publicSettings.collectEmail}
                    onCheckedChange={(checked) => updatePublicSettings({ collectEmail: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="showInDirectory">Mostrar en directorio</Label>
                  <Switch
                    id="showInDirectory"
                    checked={publicSettings.showInDirectory}
                    onCheckedChange={(checked) => updatePublicSettings({ showInDirectory: checked })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="expirationDate">Fecha de expiración (opcional)</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={publicSettings.expirationDate || ''}
                  onChange={(e) => updatePublicSettings({ expirationDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="password">Contraseña de acceso (opcional)</Label>
                <Input
                  id="password"
                  type="password"
                  value={publicSettings.password || ''}
                  onChange={(e) => updatePublicSettings({ password: e.target.value })}
                  placeholder="Dejar vacío para acceso libre"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Configuración de tema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Apariencia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primaryColor">Color primario</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="primaryColor"
                  type="color"
                  value={settings.theme.primaryColor}
                  onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={settings.theme.primaryColor}
                  onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="secondaryColor">Color secundario</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={settings.theme.secondaryColor}
                  onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={settings.theme.secondaryColor}
                  onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
                  placeholder="#64748b"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="backgroundColor">Color de fondo</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={settings.theme.backgroundColor}
                  onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={settings.theme.backgroundColor}
                  onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                  placeholder="#ffffff"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="textColor">Color de texto</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="textColor"
                  type="color"
                  value={settings.theme.textColor}
                  onChange={(e) => updateTheme({ textColor: e.target.value })}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={settings.theme.textColor}
                  onChange={(e) => updateTheme({ textColor: e.target.value })}
                  placeholder="#1f2937"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="fontFamily">Fuente</Label>
            <Select 
              value={settings.theme.fontFamily} 
              onValueChange={(value) => updateTheme({ fontFamily: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inter">Inter</SelectItem>
                <SelectItem value="Roboto">Roboto</SelectItem>
                <SelectItem value="Open Sans">Open Sans</SelectItem>
                <SelectItem value="Lato">Lato</SelectItem>
                <SelectItem value="Poppins">Poppins</SelectItem>
                <SelectItem value="Montserrat">Montserrat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="borderRadius">Bordes redondeados</Label>
            <Select 
              value={settings.theme.borderRadius} 
              onValueChange={(value) => updateTheme({ borderRadius: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin redondeo</SelectItem>
                <SelectItem value="small">Pequeño</SelectItem>
                <SelectItem value="medium">Mediano</SelectItem>
                <SelectItem value="large">Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vista previa del tema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Vista Previa del Tema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: settings.theme.backgroundColor,
              color: settings.theme.textColor,
              fontFamily: settings.theme.fontFamily,
              borderRadius: settings.theme.borderRadius === 'none' ? '0px' :
                          settings.theme.borderRadius === 'small' ? '4px' :
                          settings.theme.borderRadius === 'medium' ? '8px' : '12px'
            }}
          >
            <div className="space-y-4">
              <div>
                <Label 
                  className="font-medium"
                  style={{ color: settings.theme.textColor }}
                >
                  Ejemplo de campo
                </Label>
                <Input 
                  placeholder="Texto de ejemplo"
                  className="mt-1"
                  style={{
                    borderColor: settings.theme.secondaryColor,
                    borderRadius: settings.theme.borderRadius === 'none' ? '0px' :
                                settings.theme.borderRadius === 'small' ? '4px' :
                                settings.theme.borderRadius === 'medium' ? '8px' : '12px'
                  }}
                />
              </div>
              
              <Button 
                style={{
                  backgroundColor: settings.theme.primaryColor,
                  borderColor: settings.theme.primaryColor
                }}
              >
                Botón de ejemplo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

