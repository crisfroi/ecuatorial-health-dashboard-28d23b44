import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Star, 
  MapPin, 
  PenTool,
  Eye,
  Send
} from 'lucide-react';
import { FormFieldConfig } from '@/types/dynamic-forms';

interface FormPreviewProps {
  title: string;
  description: string;
  fields: FormFieldConfig[];
  onSubmit?: (data: Record<string, any>) => void;
  readOnly?: boolean;
}

export const FormPreview: React.FC<FormPreviewProps> = ({ 
  title, 
  description, 
  fields, 
  onSubmit,
  readOnly = false 
}) => {
  const [formData, setFormData] = React.useState<Record<string, any>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const updateFieldValue = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    
    // Limpiar error al cambiar valor
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      if (field.required && (!formData[field.id] || formData[field.id] === '')) {
        newErrors[field.id] = `${field.label} es requerido`;
        return;
      }

      // Validaciones específicas
      if (formData[field.id]) {
        const value = formData[field.id];
        
        // Validación de longitud para texto
        if (['text', 'textarea', 'email'].includes(field.type)) {
          if (field.validation?.minLength && value.length < field.validation.minLength) {
            newErrors[field.id] = `Mínimo ${field.validation.minLength} caracteres`;
          }
          if (field.validation?.maxLength && value.length > field.validation.maxLength) {
            newErrors[field.id] = `Máximo ${field.validation.maxLength} caracteres`;
          }
        }
        
        // Validación de números
        if (field.type === 'number') {
          const numValue = parseFloat(value);
          if (field.validation?.min && numValue < field.validation.min) {
            newErrors[field.id] = `Valor mínimo: ${field.validation.min}`;
          }
          if (field.validation?.max && numValue > field.validation.max) {
            newErrors[field.id] = `Valor máximo: ${field.validation.max}`;
          }
        }
        
        // Validación de email
        if (field.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            newErrors[field.id] = 'Formato de email inválido';
          }
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit?.(formData);
    }
  };

  const renderField = (field: FormFieldConfig) => {
    const hasError = !!errors[field.id];
    const value = formData[field.id] || '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <Input
            type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            disabled={readOnly}
            className={hasError ? 'border-red-500' : ''}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            disabled={readOnly}
            className={hasError ? 'border-red-500' : ''}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            disabled={readOnly}
            className={hasError ? 'border-red-500' : ''}
            rows={4}
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            disabled={readOnly}
            className={hasError ? 'border-red-500' : ''}
          />
        );
      
      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(val) => updateFieldValue(field.id, val)}
            disabled={readOnly}
          >
            <SelectTrigger className={hasError ? 'border-red-500' : ''}>
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
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${option.id}`}
                  checked={value.includes?.(option.value) || false}
                  onCheckedChange={(checked) => {
                    const currentValues = value || [];
                    if (checked) {
                      updateFieldValue(field.id, [...currentValues, option.value]);
                    } else {
                      updateFieldValue(field.id, currentValues.filter((v: string) => v !== option.value));
                    }
                  }}
                  disabled={readOnly}
                />
                <Label htmlFor={`${field.id}-${option.id}`}>{option.label}</Label>
              </div>
            ))}
          </div>
        );
      
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map(option => (
              <div key={option.id} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`${field.id}-${option.id}`}
                  name={field.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => updateFieldValue(field.id, e.target.value)}
                  disabled={readOnly}
                  className="text-blue-600"
                />
                <Label htmlFor={`${field.id}-${option.id}`}>{option.label}</Label>
              </div>
            ))}
          </div>
        );
      
      case 'file':
      case 'image':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <div className="text-sm text-gray-600 mb-1">
              Haga clic para subir {field.type === 'image' ? 'imagen' : 'archivo'}
            </div>
            {field.validation?.fileTypes && (
              <div className="text-xs text-gray-500">
                Tipos permitidos: {field.validation.fileTypes.join(', ')}
              </div>
            )}
            {field.validation?.fileSize && (
              <div className="text-xs text-gray-500">
                Tamaño máximo: {field.validation.fileSize}MB
              </div>
            )}
            <input
              type="file"
              accept={field.validation?.fileTypes?.map(type => `.${type}`).join(',')}
              onChange={(e) => updateFieldValue(field.id, e.target.files?.[0])}
              disabled={readOnly}
              className="hidden"
            />
          </div>
        );
      
      case 'rating':
        const max = field.validation?.max || 5;
        const min = field.validation?.min || 1;
        const rating = value || 0;
        
        return (
          <div className="flex gap-1">
            {Array.from({ length: max - min + 1 }, (_, i) => {
              const starValue = i + min;
              return (
                <Star
                  key={starValue}
                  className={`w-6 h-6 cursor-pointer transition-colors ${
                    starValue <= rating 
                      ? 'text-yellow-400 fill-current' 
                      : 'text-gray-300 hover:text-yellow-200'
                  }`}
                  onClick={() => !readOnly && updateFieldValue(field.id, starValue)}
                />
              );
            })}
          </div>
        );
      
      case 'location':
        return (
          <div className="border rounded-lg p-4">
            <MapPin className="w-5 h-5 text-gray-400 mb-2" />
            <div className="text-sm text-gray-600">
              Funcionalidad de ubicación (requiere implementación)
            </div>
            <input
              type="hidden"
              value={value}
              onChange={(e) => updateFieldValue(field.id, e.target.value)}
            />
          </div>
        );
      
      case 'signature':
        return (
          <div className="border rounded-lg p-4">
            <PenTool className="w-5 h-5 text-gray-400 mb-2" />
            <div className="text-sm text-gray-600">
              Funcionalidad de firma digital (requiere implementación)
            </div>
            <input
              type="hidden"
              value={value}
              onChange={(e) => updateFieldValue(field.id, e.target.value)}
            />
          </div>
        );
      
      default:
        return (
          <div className="text-gray-500 text-sm">
            Tipo de campo no soportado: {field.type}
          </div>
        );
    }
  };

  if (fields.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-center">
          <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-600 text-lg mb-2">Formulario vacío</div>
          <div className="text-gray-400 text-sm">
            Agregue campos para ver la vista previa del formulario
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          {description && (
            <p className="text-gray-600 mt-2">{description}</p>
          )}
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label className="text-base font-medium">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                
                {renderField(field)}
                
                {errors[field.id] && (
                  <p className="text-sm text-red-600">{errors[field.id]}</p>
                )}
                
                {field.description && (
                  <p className="text-sm text-gray-500">{field.description}</p>
                )}
              </div>
            ))}
            
            {!readOnly && (
              <div className="flex justify-end pt-6">
                <Button type="submit" className="px-8">
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Formulario
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
