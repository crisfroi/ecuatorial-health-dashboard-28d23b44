import React, { useState, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Settings, 
  Eye, 
  Save, 
  Trash2, 
  Copy, 
  Move,
  GripVertical,
  Type,
  Calendar,
  CheckSquare,
  Upload,
  Star,
  MapPin,
  Hash,
  Mail,
  Phone,
  FileText,
  Image,
  PenTool
} from 'lucide-react';
import { useDynamicForms } from '@/hooks/useDynamicForms';
import { FormFieldConfig, FormFieldType, DynamicForm } from '@/types/dynamic-forms';
import { FieldEditor } from './FieldEditor';
import { FormPreview } from './FormPreview';
import { FormSettings } from './FormSettings';
import { useToast } from '@/hooks/use-toast';

const FIELD_TEMPLATES = [
  {
    type: 'text' as FormFieldType,
    label: 'Texto',
    icon: Type,
    description: 'Campo de texto simple',
    category: 'basic' as const
  },
  {
    type: 'textarea' as FormFieldType,
    label: 'Área de texto',
    icon: FileText,
    description: 'Texto largo de múltiples líneas',
    category: 'basic' as const
  },
  {
    type: 'email' as FormFieldType,
    label: 'Email',
    icon: Mail,
    description: 'Dirección de correo electrónico',
    category: 'basic' as const
  },
  {
    type: 'phone' as FormFieldType,
    label: 'Teléfono',
    icon: Phone,
    description: 'Número de teléfono',
    category: 'basic' as const
  },
  {
    type: 'number' as FormFieldType,
    label: 'Número',
    icon: Hash,
    description: 'Campo numérico',
    category: 'basic' as const
  },
  {
    type: 'date' as FormFieldType,
    label: 'Fecha',
    icon: Calendar,
    description: 'Selección de fecha',
    category: 'basic' as const
  },
  {
    type: 'select' as FormFieldType,
    label: 'Selección',
    icon: CheckSquare,
    description: 'Lista desplegable',
    category: 'advanced' as const
  },
  {
    type: 'checkbox' as FormFieldType,
    label: 'Casilla',
    icon: CheckSquare,
    description: 'Casillas de verificación',
    category: 'advanced' as const
  },
  {
    type: 'file' as FormFieldType,
    label: 'Archivo',
    icon: Upload,
    description: 'Subida de archivos',
    category: 'media' as const
  },
  {
    type: 'image' as FormFieldType,
    label: 'Imagen',
    icon: Image,
    description: 'Subida de imágenes',
    category: 'media' as const
  },
  {
    type: 'rating' as FormFieldType,
    label: 'Calificación',
    icon: Star,
    description: 'Escala de calificación',
    category: 'advanced' as const
  },
  {
    type: 'location' as FormFieldType,
    label: 'Ubicación',
    icon: MapPin,
    description: 'Selección de ubicación',
    category: 'advanced' as const
  },
  {
    type: 'signature' as FormFieldType,
    label: 'Firma',
    icon: PenTool,
    description: 'Captura de firma digital',
    category: 'advanced' as const
  }
];

interface FormBuilderProps {
  formId?: string;
  onSave?: (form: DynamicForm) => void;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({ formId, onSave }) => {
  const [selectedField, setSelectedField] = useState<FormFieldConfig | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [formTitle, setFormTitle] = useState('Nuevo Formulario');
  const [formDescription, setFormDescription] = useState('');
  const [fields, setFields] = useState<FormFieldConfig[]>([]);
  const { toast } = useToast();
  
  const { createForm, updateForm, isCreating, isUpdating } = useDynamicForms();

  const addField = useCallback((type: FormFieldType) => {
    const newField: FormFieldConfig = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      label: `Nuevo campo ${type}`,
      required: false,
      order: fields.length,
      options: type === 'select' || type === 'checkbox' || type === 'radio' ? [
        { id: '1', label: 'Opción 1', value: 'opcion1' },
        { id: '2', label: 'Opción 2', value: 'opcion2' }
      ] : undefined
    };

    setFields(prev => [...prev, newField]);
    setSelectedField(newField);
  }, [fields.length]);

  const updateField = useCallback((fieldId: string, updates: Partial<FormFieldConfig>) => {
    setFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ));
    
    if (selectedField?.id === fieldId) {
      setSelectedField(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [selectedField]);

  const deleteField = useCallback((fieldId: string) => {
    setFields(prev => prev.filter(field => field.id !== fieldId));
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  }, [selectedField]);

  const moveField = useCallback((dragIndex: number, hoverIndex: number) => {
    setFields(prev => {
      const newFields = [...prev];
      const draggedField = newFields[dragIndex];
      newFields.splice(dragIndex, 1);
      newFields.splice(hoverIndex, 0, draggedField);
      
      // Actualizar el orden
      return newFields.map((field, index) => ({
        ...field,
        order: index
      }));
    });
  }, []);

  const handleSave = async () => {
    if (!formTitle.trim()) {
      toast({
        title: "Error",
        description: "El título del formulario es requerido",
        variant: "destructive"
      });
      return;
    }

    const formData: Omit<DynamicForm, 'id' | 'created_at' | 'updated_at' | 'submissions_count'> = {
      title: formTitle,
      description: formDescription,
      category: 'encuestas',
      fields,
      settings: {
        allowMultipleSubmissions: true,
        requireAuthentication: false,
        showProgressBar: true,
        theme: {
          primaryColor: '#3b82f6',
          secondaryColor: '#64748b',
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
          fontFamily: 'Inter',
          borderRadius: 'medium'
        },
        autoSave: true
      },
      publicSettings: {
        isPublic: true,
        publicUrl: '',
        allowAnonymous: true,
        collectEmail: false,
        showInDirectory: false
      },
      created_by: '' as any,
      is_active: true
    };

    try {
      if (formId) {
        await updateForm({ id: formId, ...formData });
      } else {
        await createForm(formData);
      }

      toast({
        title: "Éxito",
        description: "Formulario guardado correctamente"
      });

      onSave?.(formData as DynamicForm);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Error al guardar el formulario",
        variant: "destructive"
      });
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar - Plantillas de campos */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Elementos del Formulario</h3>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-500 mb-2">Básicos</div>
              {FIELD_TEMPLATES.filter(t => t.category === 'basic').map(template => (
                <FieldTemplate
                  key={template.type}
                  template={template}
                  onAdd={addField}
                />
              ))}
              
              <div className="text-sm font-medium text-gray-500 mb-2 mt-4">Avanzados</div>
              {FIELD_TEMPLATES.filter(t => t.category === 'advanced').map(template => (
                <FieldTemplate
                  key={template.type}
                  template={template}
                  onAdd={addField}
                />
              ))}
              
              <div className="text-sm font-medium text-gray-500 mb-2 mt-4">Multimedia</div>
              {FIELD_TEMPLATES.filter(t => t.category === 'media').map(template => (
                <FieldTemplate
                  key={template.type}
                  template={template}
                  onAdd={addField}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Área principal */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-md">
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Título del formulario"
                  className="text-xl font-semibold border-none p-0 h-auto"
                />
                <Textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Descripción del formulario"
                  className="mt-1 border-none p-0 resize-none"
                  rows={1}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={previewMode ? "default" : "outline"}
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {previewMode ? 'Editar' : 'Vista previa'}
                </Button>
                
                <Button
                  onClick={handleSave}
                  disabled={isCreating || isUpdating}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 flex">
            {/* Constructor de formulario */}
            <div className="flex-1 p-6">
              {previewMode ? (
                <FormPreview
                  title={formTitle}
                  description={formDescription}
                  fields={fields}
                  readOnly
                />
              ) : (
                <FormCanvas
                  fields={fields}
                  selectedField={selectedField}
                  onSelectField={setSelectedField}
                  onUpdateField={updateField}
                  onDeleteField={deleteField}
                  onMoveField={moveField}
                />
              )}
            </div>

            {/* Panel de propiedades */}
            {selectedField && !previewMode && (
              <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
                <FieldEditor
                  field={selectedField}
                  onUpdate={updateField}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

// Componente para plantillas de campos
const FieldTemplate: React.FC<{
  template: typeof FIELD_TEMPLATES[0];
  onAdd: (type: FormFieldType) => void;
}> = ({ template, onAdd }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'field-template',
    item: { type: template.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const Icon = template.icon;

  return (
    <div
      ref={drag}
      className={`
        flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-move
        hover:border-blue-300 hover:bg-blue-50 transition-colors
        ${isDragging ? 'opacity-50' : ''}
      `}
      onClick={() => onAdd(template.type)}
    >
      <Icon className="w-5 h-5 text-gray-600" />
      <div className="flex-1">
        <div className="font-medium text-sm">{template.label}</div>
        <div className="text-xs text-gray-500">{template.description}</div>
      </div>
    </div>
  );
};

// Componente para el lienzo del formulario
const FormCanvas: React.FC<{
  fields: FormFieldConfig[];
  selectedField: FormFieldConfig | null;
  onSelectField: (field: FormFieldConfig) => void;
  onUpdateField: (fieldId: string, updates: Partial<FormFieldConfig>) => void;
  onDeleteField: (fieldId: string) => void;
  onMoveField: (dragIndex: number, hoverIndex: number) => void;
}> = ({ fields, selectedField, onSelectField, onUpdateField, onDeleteField, onMoveField }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'field-template',
    drop: (item: { type: FormFieldType }) => {
      // Aquí se manejaría la adición de campos por drag & drop
      // Por ahora usamos el click directo
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  });

  if (fields.length === 0) {
    return (
      <div
        ref={drop}
        className={`
          h-full flex items-center justify-center border-2 border-dashed rounded-lg
          ${isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
        `}
      >
        <div className="text-center">
          <div className="text-gray-500 text-lg mb-2">
            Arrastra elementos aquí para construir tu formulario
          </div>
          <div className="text-gray-400 text-sm">
            O haz clic en los elementos de la barra lateral
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={drop} className="space-y-4 max-w-2xl mx-auto">
      {fields.map((field, index) => (
        <FieldItem
          key={field.id}
          field={field}
          index={index}
          isSelected={selectedField?.id === field.id}
          onSelect={() => onSelectField(field)}
          onDelete={() => onDeleteField(field.id)}
          onMove={(dragIndex, hoverIndex) => onMoveField(dragIndex, hoverIndex)}
        />
      ))}
    </div>
  );
};

// Componente para un elemento del formulario
const FieldItem: React.FC<{
  field: FormFieldConfig;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
}> = ({ field, index, isSelected, onSelect, onDelete, onMove }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'field-item',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const [, drop] = useDrop({
    accept: 'field-item',
    hover: (draggedItem: { index: number }) => {
      if (draggedItem.index !== index) {
        onMove(draggedItem.index, index);
        draggedItem.index = index;
      }
    }
  });

  return (
    <div
      ref={(node) => {
        drag(drop(node));
      }}
      className={`
        relative p-4 border rounded-lg cursor-pointer transition-all
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
        ${isDragging ? 'opacity-50' : ''}
      `}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-400" />
          <Label className="font-medium">{field.label}</Label>
          {field.required && <Badge variant="destructive" className="text-xs">Requerido</Badge>}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      <FieldPreview field={field} />
    </div>
  );
};

// Componente para vista previa de campos
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
          <div className="bg-gray-50 border rounded px-3 py-2 text-gray-500">
            Seleccione una opción
          </div>
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
      
      case 'file':
      case 'image':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <div className="text-sm text-gray-500">Haga clic para subir archivo</div>
          </div>
        );
      
      case 'rating':
        return (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <Star key={star} className="w-6 h-6 text-gray-300" />
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
    <div className="space-y-1">
      {renderField()}
      {field.description && (
        <p className="text-xs text-gray-500">{field.description}</p>
      )}
    </div>
  );
};
