import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  Plus, 
  Trash2, 
  Edit,
  Eye,
  Calendar,
  FileText,
  Award,
  Globe,
  BookOpen,
  Target,
  Briefcase,
  GraduationCap,
  Shield,
  User
} from 'lucide-react';
import { useProfessionalIndicators } from '@/hooks/useDynamicForms';
import { useProfessionalIndicatorValues } from '@/hooks/useDynamicForms';
import { ProfessionalIndicator, ProfessionalIndicatorValue } from '@/types/dynamic-forms';
import { useToast } from '@/hooks/use-toast';

interface ProfessionalIndicatorsEditorProps {
  professionalId: string;
  onSave?: () => void;
}

const CATEGORY_ICONS = {
  personal: User,
  profesional: Briefcase,
  academico: GraduationCap,
  laboral: Briefcase,
  certificaciones: Shield,
  sanciones: Shield,
  reconocimientos: Award,
  experiencia: Briefcase,
  idiomas: Globe,
  publicaciones: BookOpen,
  proyectos: Target,
  otros: FileText
};

const CATEGORY_COLORS = {
  personal: 'bg-blue-100 text-blue-800 border-blue-200',
  profesional: 'bg-green-100 text-green-800 border-green-200',
  academico: 'bg-purple-100 text-purple-800 border-purple-200',
  laboral: 'bg-orange-100 text-orange-800 border-orange-200',
  certificaciones: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  sanciones: 'bg-red-100 text-red-800 border-red-200',
  reconocimientos: 'bg-pink-100 text-pink-800 border-pink-200',
  experiencia: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  idiomas: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  publicaciones: 'bg-teal-100 text-teal-800 border-teal-200',
  proyectos: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  otros: 'bg-gray-100 text-gray-800 border-gray-200'
};

export const ProfessionalIndicatorsEditor: React.FC<ProfessionalIndicatorsEditorProps> = ({
  professionalId,
  onSave
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [editingValues, setEditingValues] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);
  
  const { indicators, isLoading: loadingIndicators } = useProfessionalIndicators();
  const { values, isLoading: loadingValues, updateIndicatorValue, isUpdating } = useProfessionalIndicatorValues(professionalId);
  const { toast } = useToast();

  // Cargar valores existentes en el estado de edición
  useEffect(() => {
    const initialValues: Record<string, any> = {};
    values.forEach(value => {
      initialValues[value.indicator_id] = value.value;
    });
    setEditingValues(initialValues);
  }, [values]);

  // Filtrar indicadores por categoría
  const filteredIndicators = indicators.filter(indicator => 
    activeCategory === 'all' || indicator.category === activeCategory
  );

  // Agrupar indicadores por categoría
  const indicatorsByCategory = indicators.reduce((acc, indicator) => {
    if (!acc[indicator.category]) {
      acc[indicator.category] = [];
    }
    acc[indicator.category].push(indicator);
    return acc;
  }, {} as Record<string, ProfessionalIndicator[]>);

  const handleValueChange = (indicatorId: string, value: any) => {
    setEditingValues(prev => ({
      ...prev,
      [indicatorId]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      const savePromises = Object.entries(editingValues).map(([indicatorId, value]) => {
        return updateIndicatorValue({ indicatorId, value });
      });

      await Promise.all(savePromises);
      
      setHasChanges(false);
      toast({
        title: "Éxito",
        description: "Indicadores actualizados correctamente"
      });
      
      onSave?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al guardar los indicadores",
        variant: "destructive"
      });
    }
  };

  const renderField = (indicator: ProfessionalIndicator) => {
    const currentValue = editingValues[indicator.id] || '';
    const Icon = CATEGORY_ICONS[indicator.category as keyof typeof CATEGORY_ICONS] || FileText;

    switch (indicator.type) {
      case 'text':
        return (
          <Input
            value={currentValue}
            onChange={(e) => handleValueChange(indicator.id, e.target.value)}
            placeholder={indicator.description || `Ingrese ${indicator.name.toLowerCase()}`}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={currentValue}
            onChange={(e) => handleValueChange(indicator.id, e.target.value)}
            placeholder={indicator.description || `Ingrese ${indicator.name.toLowerCase()}`}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={currentValue}
            onChange={(e) => handleValueChange(indicator.id, e.target.value)}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={indicator.id}
              checked={currentValue === true}
              onCheckedChange={(checked) => handleValueChange(indicator.id, checked)}
            />
            <Label htmlFor={indicator.id}>
              {currentValue ? 'Sí' : 'No'}
            </Label>
          </div>
        );

      case 'select':
        return (
          <Select
            value={currentValue}
            onValueChange={(value) => handleValueChange(indicator.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Seleccione ${indicator.name.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {indicator.options?.map(option => (
                <SelectItem key={option.id} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {indicator.options?.map(option => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`${indicator.id}-${option.id}`}
                  checked={currentValue?.includes?.(option.value) || false}
                  onCheckedChange={(checked) => {
                    const currentValues = currentValue || [];
                    if (checked) {
                      handleValueChange(indicator.id, [...currentValues, option.value]);
                    } else {
                      handleValueChange(indicator.id, currentValues.filter((v: string) => v !== option.value));
                    }
                  }}
                />
                <Label htmlFor={`${indicator.id}-${option.id}`}>{option.label}</Label>
              </div>
            ))}
          </div>
        );

      case 'json':
        return (
          <Textarea
            value={typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleValueChange(indicator.id, parsed);
              } catch {
                handleValueChange(indicator.id, e.target.value);
              }
            }}
            placeholder={indicator.description || `Ingrese datos para ${indicator.name.toLowerCase()}`}
            rows={4}
          />
        );

      default:
        return (
          <div className="text-gray-500 text-sm">
            Tipo de campo no soportado: {indicator.type}
          </div>
        );
    }
  };

  if (loadingIndicators || loadingValues) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-gray-500">Cargando indicadores...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Indicadores Adicionales</h2>
          <p className="text-gray-600 mt-1">
            Información adicional y personalizada del profesional
          </p>
        </div>
        
        {hasChanges && (
          <Button onClick={handleSave} disabled={isUpdating}>
            <Save className="w-4 h-4 mr-2" />
            Guardar Cambios
          </Button>
        )}
      </div>

      {/* Tabs por categoría */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="profesional">Profesional</TabsTrigger>
          <TabsTrigger value="laboral">Laboral</TabsTrigger>
          <TabsTrigger value="certificaciones">Certificaciones</TabsTrigger>
          <TabsTrigger value="otros">Otros</TabsTrigger>
        </TabsList>

        <TabsContent value={activeCategory} className="space-y-4">
          {filteredIndicators.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-600 text-lg mb-2">No hay indicadores</div>
                <div className="text-gray-400 text-sm">
                  {activeCategory === 'all' 
                    ? 'No hay indicadores configurados'
                    : `No hay indicadores en la categoría ${activeCategory}`
                  }
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredIndicators.map((indicator) => {
                const Icon = CATEGORY_ICONS[indicator.category as keyof typeof CATEGORY_ICONS] || FileText;
                const colorClass = CATEGORY_COLORS[indicator.category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.otros;
                
                return (
                  <Card key={indicator.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Icon className="w-5 h-5" />
                        {indicator.name}
                        {indicator.isRequired && (
                          <Badge variant="destructive" className="text-xs">Requerido</Badge>
                        )}
                      </CardTitle>
                      {indicator.description && (
                        <p className="text-sm text-gray-600">{indicator.description}</p>
                      )}
                      <Badge className={`text-xs ${colorClass}`}>
                        {indicator.category}
                      </Badge>
                    </CardHeader>
                    
                    <CardContent>
                      {renderField(indicator)}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Resumen de valores guardados */}
      {values.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Resumen de Indicadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {values.map((value) => {
                const indicator = indicators.find(i => i.id === value.indicator_id);
                if (!indicator) return null;
                
                const Icon = CATEGORY_ICONS[indicator.category as keyof typeof CATEGORY_ICONS] || FileText;
                
                return (
                  <div key={value.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-600" />
                      <span className="font-medium">{indicator.name}:</span>
                      <span className="text-gray-600">
                        {typeof value.value === 'object' 
                          ? JSON.stringify(value.value) 
                          : String(value.value)
                        }
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(value.created_at).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

