import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Settings, 
  Eye, 
  Edit, 
  Trash2, 
  Copy,
  Filter,
  Search,
  Type,
  Hash,
  Calendar,
  CheckSquare,
  Upload,
  Star,
  MapPin,
  PenTool,
  Award,
  User,
  GraduationCap,
  Briefcase,
  Shield,
  FileText,
  Globe,
  BookOpen,
  Target
} from 'lucide-react';
import { useProfessionalIndicators } from '@/hooks/useDynamicForms';
import { ProfessionalIndicator, IndicatorType, IndicatorCategory } from '@/types/dynamic-forms';
import { useToast } from '@/hooks/use-toast';

const INDICATOR_TYPES: { value: IndicatorType; label: string; icon: React.ComponentType<any> }[] = [
  { value: 'text', label: 'Texto', icon: Type },
  { value: 'number', label: 'Número', icon: Hash },
  { value: 'date', label: 'Fecha', icon: Calendar },
  { value: 'boolean', label: 'Sí/No', icon: CheckSquare },
  { value: 'select', label: 'Selección', icon: CheckSquare },
  { value: 'multiselect', label: 'Múltiple', icon: CheckSquare },
  { value: 'file', label: 'Archivo', icon: Upload },
  { value: 'json', label: 'Datos complejos', icon: FileText }
];

const INDICATOR_CATEGORIES: { value: IndicatorCategory; label: string; icon: React.ComponentType<any>; color: string }[] = [
  { value: 'personal', label: 'Personal', icon: User, color: 'bg-blue-100 text-blue-800' },
  { value: 'profesional', label: 'Profesional', icon: Briefcase, color: 'bg-green-100 text-green-800' },
  { value: 'academico', label: 'Académico', icon: GraduationCap, color: 'bg-purple-100 text-purple-800' },
  { value: 'laboral', label: 'Laboral', icon: Briefcase, color: 'bg-orange-100 text-orange-800' },
  { value: 'certificaciones', label: 'Certificaciones', icon: Shield, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'sanciones', label: 'Sanciones', icon: Shield, color: 'bg-red-100 text-red-800' },
  { value: 'reconocimientos', label: 'Reconocimientos', icon: Award, color: 'bg-pink-100 text-pink-800' },
  { value: 'experiencia', label: 'Experiencia', icon: Briefcase, color: 'bg-indigo-100 text-indigo-800' },
  { value: 'idiomas', label: 'Idiomas', icon: Globe, color: 'bg-cyan-100 text-cyan-800' },
  { value: 'publicaciones', label: 'Publicaciones', icon: BookOpen, color: 'bg-teal-100 text-teal-800' },
  { value: 'proyectos', label: 'Proyectos', icon: Target, color: 'bg-emerald-100 text-emerald-800' },
  { value: 'otros', label: 'Otros', icon: FileText, color: 'bg-gray-100 text-gray-800' }
];

export const IndicatorManager: React.FC = () => {
  const [selectedIndicator, setSelectedIndicator] = useState<ProfessionalIndicator | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IndicatorCategory | 'all'>('all');
  
  const { indicators, isLoading, createIndicator, isCreating: isCreatingIndicator } = useProfessionalIndicators();
  const { toast } = useToast();

  // Filtrar indicadores
  const filteredIndicators = indicators.filter(indicator => {
    const matchesSearch = indicator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         indicator.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || indicator.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateIndicator = async (indicatorData: Omit<ProfessionalIndicator, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await createIndicator(indicatorData);
      toast({
        title: "Éxito",
        description: "Indicador creado correctamente"
      });
      setIsCreating(false);
      setSelectedIndicator(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al crear el indicador",
        variant: "destructive"
      });
    }
  };

  const getCategoryInfo = (category: IndicatorCategory) => {
    return INDICATOR_CATEGORIES.find(c => c.value === category);
  };

  const getTypeInfo = (type: IndicatorType) => {
    return INDICATOR_TYPES.find(t => t.value === type);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Indicadores</h1>
          <p className="text-gray-600 mt-1">
            Crea y gestiona indicadores dinámicos para profesionales
          </p>
        </div>
        
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Indicador
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar indicadores</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Buscar por nombre o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="category">Categoría</Label>
              <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as IndicatorCategory | 'all')}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {INDICATOR_CATEGORIES.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de indicadores */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Indicadores ({filteredIndicators.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Cargando indicadores...</div>
                </div>
              ) : filteredIndicators.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-gray-600 text-lg mb-2">No hay indicadores</div>
                  <div className="text-gray-400 text-sm">
                    {searchTerm || selectedCategory !== 'all' 
                      ? 'No se encontraron indicadores con los filtros aplicados'
                      : 'Crea tu primer indicador para comenzar'
                    }
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredIndicators.map((indicator) => {
                    const categoryInfo = getCategoryInfo(indicator.category);
                    const typeInfo = getTypeInfo(indicator.type);
                    
                    return (
                      <div
                        key={indicator.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                          selectedIndicator?.id === indicator.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => setSelectedIndicator(indicator)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{indicator.name}</h3>
                              {indicator.isRequired && (
                                <Badge variant="destructive" className="text-xs">Requerido</Badge>
                              )}
                              {!indicator.isVisible && (
                                <Badge variant="outline" className="text-xs">Oculto</Badge>
                              )}
                            </div>
                            
                            {indicator.description && (
                              <p className="text-gray-600 text-sm mb-2">{indicator.description}</p>
                            )}
                            
                            <div className="flex items-center gap-2">
                              {categoryInfo && (
                                <Badge className={categoryInfo.color}>
                                  <categoryInfo.icon className="w-3 h-3 mr-1" />
                                  {categoryInfo.label}
                                </Badge>
                              )}
                              
                              {typeInfo && (
                                <Badge variant="outline">
                                  <typeInfo.icon className="w-3 h-3 mr-1" />
                                  {typeInfo.label}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 ml-4">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel de detalles/creación */}
        <div>
          {isCreating ? (
            <IndicatorCreator onSave={handleCreateIndicator} onCancel={() => setIsCreating(false)} />
          ) : selectedIndicator ? (
            <IndicatorDetails indicator={selectedIndicator} />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-600 text-lg mb-2">Selecciona un indicador</div>
                <div className="text-gray-400 text-sm">
                  Haz clic en un indicador para ver sus detalles y configuraciones
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente para crear indicador
const IndicatorCreator: React.FC<{
  onSave: (indicator: Omit<ProfessionalIndicator, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'text' as IndicatorType,
    category: 'otros' as IndicatorCategory,
    description: '',
    isRequired: false,
    isVisible: true,
    order: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    onSave({
      ...formData,
      options: formData.type === 'select' || formData.type === 'multiselect' ? [
        { id: '1', label: 'Opción 1', value: 'opcion1' },
        { id: '2', label: 'Opción 2', value: 'opcion2' }
      ] : undefined
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Nuevo Indicador</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre del indicador *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Condecoraciones recibidas"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Tipo de dato</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as IndicatorType }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INDICATOR_TYPES.map(type => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="category">Categoría</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as IndicatorCategory }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INDICATOR_CATEGORIES.map(category => {
                  const Icon = category.icon;
                  return (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {category.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción del indicador..."
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="required">Campo requerido</Label>
              <Switch
                id="required"
                checked={formData.isRequired}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRequired: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="visible">Visible en formularios</Label>
              <Switch
                id="visible"
                checked={formData.isVisible}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVisible: checked }))}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Crear Indicador
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Componente para detalles del indicador
const IndicatorDetails: React.FC<{ indicator: ProfessionalIndicator }> = ({ indicator }) => {
  const categoryInfo = INDICATOR_CATEGORIES.find(c => c.value === indicator.category);
  const typeInfo = INDICATOR_TYPES.find(t => t.value === indicator.type);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {categoryInfo && <categoryInfo.icon className="w-5 h-5" />}
          {indicator.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {indicator.description && (
          <div>
            <Label className="font-medium">Descripción</Label>
            <p className="text-gray-600 text-sm">{indicator.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="font-medium">Tipo</Label>
            <div className="flex items-center gap-2 mt-1">
              {typeInfo && <typeInfo.icon className="w-4 h-4 text-gray-600" />}
              <span className="text-sm">{typeInfo?.label}</span>
            </div>
          </div>

          <div>
            <Label className="font-medium">Categoría</Label>
            <div className="flex items-center gap-2 mt-1">
              {categoryInfo && <categoryInfo.icon className="w-4 h-4 text-gray-600" />}
              <span className="text-sm">{categoryInfo?.label}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-medium">Configuración</Label>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={indicator.isRequired ? "destructive" : "outline"}>
                {indicator.isRequired ? "Requerido" : "Opcional"}
              </Badge>
              <Badge variant={indicator.isVisible ? "default" : "secondary"}>
                {indicator.isVisible ? "Visible" : "Oculto"}
              </Badge>
            </div>
          </div>
        </div>

        {indicator.options && indicator.options.length > 0 && (
          <div>
            <Label className="font-medium">Opciones</Label>
            <div className="space-y-1 mt-1">
              {indicator.options.map(option => (
                <div key={option.id} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-xs">{option.value}</Badge>
                  <span className="text-gray-600">{option.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <div className="flex gap-2">
            <Button size="sm" className="flex-1">
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button size="sm" variant="outline">
              <Copy className="w-4 h-4 mr-2" />
              Duplicar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

