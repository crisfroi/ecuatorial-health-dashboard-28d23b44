import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Trash2, 
  Settings, 
  Eye,
  Hash,
  Calendar,
  Type,
  CheckSquare,
  Star,
  Upload,
  MapPin,
  PenTool
} from 'lucide-react';
import { FormFieldConfig, FormFieldType, IndicatorCategory } from '@/types/dynamic-forms';

interface FieldEditorProps {
  field: FormFieldConfig;
  onUpdate: (fieldId: string, updates: Partial<FormFieldConfig>) => void;
}

export const FieldEditor: React.FC<FieldEditorProps> = ({ field, onUpdate }) => {
  const updateField = (updates: Partial<FormFieldConfig>) => {
    onUpdate(field.id, updates);
  };

  const addOption = () => {
    const newOption = {
      id: `option_${Date.now()}`,
      label: `Opción ${(field.options?.length || 0) + 1}`,
      value: `opcion${(field.options?.length || 0) + 1}`
    };
    
    updateField({
      options: [...(field.options || []), newOption]
    });
  };

  const updateOption = (optionId: string, updates: Partial<{ label: string; value: string }>) => {
    updateField({
      options: field.options?.map(option => 
        option.id === optionId ? { ...option, ...updates } : option
      )
    });
  };

  const removeOption = (optionId: string) => {
    updateField({
      options: field.options?.filter(option => option.id !== optionId)
    });
  };

  const getFieldIcon = (type: FormFieldType) => {
    switch (type) {
      case 'text':
      case 'textarea':
      case 'email':
      case 'phone':
        return Type;
      case 'number':
        return Hash;
      case 'date':
      case 'datetime':
        return Calendar;
      case 'select':
      case 'checkbox':
      case 'radio':
        return CheckSquare;
      case 'rating':
      case 'scale':
        return Star;
      case 'file':
      case 'image':
        return Upload;
      case 'location':
        return MapPin;
      case 'signature':
        return PenTool;
      default:
        return Settings;
    }
  };

  const Icon = getFieldIcon(field.type);

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className="w-5 h-5" />
            Propiedades del Campo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Información básica */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="label">Etiqueta</Label>
              <Input
                id="label"
                value={field.label}
                onChange={(e) => updateField({ label: e.target.value })}
                placeholder="Etiqueta del campo"
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                value={field.description || ''}
                onChange={(e) => updateField({ description: e.target.value })}
                placeholder="Descripción que aparecerá debajo del campo"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="placeholder">Texto de ayuda</Label>
              <Input
                id="placeholder"
                value={field.placeholder || ''}
                onChange={(e) => updateField({ placeholder: e.target.value })}
                placeholder="Texto que aparece dentro del campo"
              />
            </div>
          </div>

          <Separator />

          {/* Configuraciones */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="required">Campo requerido</Label>
              <Switch
                id="required"
                checked={field.required}
                onCheckedChange={(checked) => updateField({ required: checked })}
              />
            </div>

            {/* Categoría para indicadores */}
            <div>
              <Label htmlFor="category">Categoría (para indicadores)</Label>
              <Select
                value={field.category || ''}
                onValueChange={(value) => updateField({ category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="profesional">Profesional</SelectItem>
                  <SelectItem value="academico">Académico</SelectItem>
                  <SelectItem value="laboral">Laboral</SelectItem>
                  <SelectItem value="certificaciones">Certificaciones</SelectItem>
                  <SelectItem value="sanciones">Sanciones</SelectItem>
                  <SelectItem value="reconocimientos">Reconocimientos</SelectItem>
                  <SelectItem value="experiencia">Experiencia</SelectItem>
                  <SelectItem value="idiomas">Idiomas</SelectItem>
                  <SelectItem value="publicaciones">Publicaciones</SelectItem>
                  <SelectItem value="proyectos">Proyectos</SelectItem>
                  <SelectItem value="otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Validaciones específicas por tipo */}
          {['text', 'textarea', 'email'].includes(field.type) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium">Validaciones</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="minLength">Longitud mínima</Label>
                    <Input
                      id="minLength"
                      type="number"
                      value={field.validation?.minLength || ''}
                      onChange={(e) => updateField({ 
                        validation: { 
                          ...field.validation, 
                          minLength: e.target.value ? parseInt(e.target.value) : undefined 
                        } 
                      })}
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="maxLength">Longitud máxima</Label>
                    <Input
                      id="maxLength"
                      type="number"
                      value={field.validation?.maxLength || ''}
                      onChange={(e) => updateField({ 
                        validation: { 
                          ...field.validation, 
                          maxLength: e.target.value ? parseInt(e.target.value) : undefined 
                        } 
                      })}
                      placeholder="Sin límite"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Validaciones para números */}
          {field.type === 'number' && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium">Límites numéricos</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="min">Valor mínimo</Label>
                    <Input
                      id="min"
                      type="number"
                      value={field.validation?.min || ''}
                      onChange={(e) => updateField({ 
                        validation: { 
                          ...field.validation, 
                          min: e.target.value ? parseFloat(e.target.value) : undefined 
                        } 
                      })}
                      placeholder="Sin límite"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="max">Valor máximo</Label>
                    <Input
                      id="max"
                      type="number"
                      value={field.validation?.max || ''}
                      onChange={(e) => updateField({ 
                        validation: { 
                          ...field.validation, 
                          max: e.target.value ? parseFloat(e.target.value) : undefined 
                        } 
                      })}
                      placeholder="Sin límite"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Validaciones para archivos */}
          {['file', 'image'].includes(field.type) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium">Configuración de archivos</h4>
                
                <div>
                  <Label htmlFor="fileTypes">Tipos de archivo permitidos</Label>
                  <Input
                    id="fileTypes"
                    value={field.validation?.fileTypes?.join(', ') || ''}
                    onChange={(e) => updateField({ 
                      validation: { 
                        ...field.validation, 
                        fileTypes: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                      } 
                    })}
                    placeholder="pdf, jpg, png, doc"
                  />
                </div>
                
                <div>
                  <Label htmlFor="fileSize">Tamaño máximo (MB)</Label>
                  <Input
                    id="fileSize"
                    type="number"
                    value={field.validation?.fileSize || ''}
                    onChange={(e) => updateField({ 
                      validation: { 
                        ...field.validation, 
                        fileSize: e.target.value ? parseFloat(e.target.value) : undefined 
                      } 
                    })}
                    placeholder="5"
                  />
                </div>
              </div>
            </>
          )}

          {/* Opciones para select, checkbox, radio */}
          {['select', 'checkbox', 'radio'].includes(field.type) && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Opciones</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addOption}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar opción
                  </Button>
                </div>

                <div className="space-y-2">
                  {field.options?.map((option, index) => (
                    <div key={option.id} className="flex items-center gap-2 p-2 border rounded">
                      <Badge variant="outline" className="text-xs">
                        {index + 1}
                      </Badge>
                      
                      <Input
                        value={option.label}
                        onChange={(e) => updateOption(option.id, { label: e.target.value })}
                        placeholder="Etiqueta"
                        className="flex-1"
                      />
                      
                      <Input
                        value={option.value}
                        onChange={(e) => updateOption(option.id, { value: e.target.value })}
                        placeholder="Valor"
                        className="flex-1"
                      />
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeOption(option.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Configuración para rating */}
          {field.type === 'rating' && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium">Configuración de calificación</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="min">Puntuación mínima</Label>
                    <Input
                      id="min"
                      type="number"
                      value={field.validation?.min || 1}
                      onChange={(e) => updateField({ 
                        validation: { 
                          ...field.validation, 
                          min: e.target.value ? parseInt(e.target.value) : 1
                        } 
                      })}
                      placeholder="1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="max">Puntuación máxima</Label>
                    <Input
                      id="max"
                      type="number"
                      value={field.validation?.max || 5}
                      onChange={(e) => updateField({ 
                        validation: { 
                          ...field.validation, 
                          max: e.target.value ? parseInt(e.target.value) : 5
                        } 
                      })}
                      placeholder="5"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Vista previa del campo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="w-5 h-5" />
            Vista Previa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FieldPreview field={field} />
        </CardContent>
      </Card>
    </div>
  );
};

// Componente para vista previa del campo
const FieldPreview: React.FC<{ field: FormFieldConfig }> = ({ field }) => {
  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
        return (
          <Input
            placeholder={field.placeholder || `Ingrese ${field.label.toLowerCase()}`}
            disabled
            className="bg-gray-50"
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder || `Ingrese ${field.label.toLowerCase()}`}
            disabled
            className="bg-gray-50"
            rows={3}
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            disabled
            className="bg-gray-50"
          />
        );
      
      case 'select':
        return (
          <Select disabled>
            <SelectTrigger className="bg-gray-50">
              <SelectValue placeholder={field.placeholder || "Seleccione una opción"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option.id} value={(option.value ?? "").trim() || String(option.id)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map(option => (
              <div key={option.id} className="flex items-center gap-2">
                <input type="checkbox" disabled className="rounded" />
                <Label className="text-sm">{option.label}</Label>
              </div>
            ))}
          </div>
        );
      
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map(option => (
              <div key={option.id} className="flex items-center gap-2">
                <input type="radio" disabled className="rounded" />
                <Label className="text-sm">{option.label}</Label>
              </div>
            ))}
          </div>
        );
      
      case 'file':
      case 'image':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <div className="text-sm text-gray-500">Haga clic para subir archivo</div>
            {field.validation?.fileTypes && (
              <div className="text-xs text-gray-400 mt-1">
                Tipos permitidos: {field.validation.fileTypes.join(', ')}
              </div>
            )}
          </div>
        );
      
      case 'rating':
        const max = field.validation?.max || 5;
        const min = field.validation?.min || 1;
        return (
          <div className="flex gap-1">
            {Array.from({ length: max - min + 1 }, (_, i) => (
              <Star key={i} className="w-6 h-6 text-gray-300" />
            ))}
          </div>
        );
      
      default:
        return (
          <div className="text-gray-500 text-sm">
            Vista previa no disponible para este tipo de campo
          </div>
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="font-medium">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      </div>
      
      {renderField()}
      
      {field.description && (
        <p className="text-xs text-gray-500">{field.description}</p>
      )}
    </div>
  );
};
