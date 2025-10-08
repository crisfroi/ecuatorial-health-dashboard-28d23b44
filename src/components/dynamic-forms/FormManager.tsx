import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Copy, 
  Link, 
  BarChart3,
  Users,
  Calendar,
  Settings,
  Globe,
  Lock
} from 'lucide-react';
import { useDynamicForms } from '@/hooks/useDynamicForms';
import { DynamicForm, FormCategory } from '@/types/dynamic-forms';
import { FormBuilder } from './FormBuilder';
import { IndicatorManager } from './IndicatorManager';
import { useToast } from '@/hooks/use-toast';

const FORM_CATEGORIES: { value: FormCategory; label: string; color: string }[] = [
  { value: 'profesionales', label: 'Profesionales', color: 'bg-blue-100 text-blue-800' },
  { value: 'centros_salud', label: 'Centros de Salud', color: 'bg-green-100 text-green-800' },
  { value: 'evaluaciones', label: 'Evaluaciones', color: 'bg-purple-100 text-purple-800' },
  { value: 'encuestas', label: 'Encuestas', color: 'bg-orange-100 text-orange-800' },
  { value: 'reportes', label: 'Reportes', color: 'bg-red-100 text-red-800' },
  { value: 'otros', label: 'Otros', color: 'bg-gray-100 text-gray-800' }
];

export const FormManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FormCategory | 'all'>('all');
  const [selectedForm, setSelectedForm] = useState<DynamicForm | null>(null);
  const [activeTab, setActiveTab] = useState('forms');
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  
  const { forms, isLoading, deleteForm, isDeleting } = useDynamicForms();
  const { toast } = useToast();

  // Filtrar formularios
  const filteredForms = forms.filter(form => {
    const matchesSearch = form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         form.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || form.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDeleteForm = async (form: DynamicForm) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el formulario "${form.title}"?`)) {
      try {
        await deleteForm(form.id);
        toast({
          title: "Éxito",
          description: "Formulario eliminado correctamente"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Error al eliminar el formulario",
          variant: "destructive"
        });
      }
    }
  };

  const handleCopyForm = (form: DynamicForm) => {
    // Aquí implementarías la lógica para duplicar un formulario
    toast({
      title: "Función en desarrollo",
      description: "La duplicación de formularios estará disponible próximamente"
    });
  };

  const handleViewForm = (form: DynamicForm) => {
    if (form.publicSettings?.publicUrl) {
      window.open(`/form/${form.publicSettings.publicUrl}`, '_blank');
    } else {
      toast({
        title: 'Sin enlace público',
        description: 'Activa “Formulario público” y guarda para generar el enlace.',
      });
    }
  };

  const getCategoryInfo = (category: FormCategory) => {
    return FORM_CATEGORIES.find(c => c.value === category);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (showFormBuilder) {
    return (
      <FormBuilder
        formId={selectedForm?.id}
        onSave={(form) => {
          setShowFormBuilder(false);
          setSelectedForm(null);
          toast({
            title: "Éxito",
            description: "Formulario guardado correctamente"
          });
        }}
        onCancel={() => {
          setShowFormBuilder(false);
          setSelectedForm(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Formularios</h1>
          <p className="text-gray-600 mt-1">
            Crea y gestiona formularios dinámicos para recopilar información
          </p>
        </div>
        
        <Button onClick={() => setShowFormBuilder(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Formulario
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="forms">Formularios</TabsTrigger>
          <TabsTrigger value="indicators">Indicadores</TabsTrigger>
        </TabsList>

        <TabsContent value="forms" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar formularios..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as FormCategory | 'all')}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {FORM_CATEGORIES.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Lista de formularios */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))
            ) : filteredForms.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-500 text-lg mb-2">No hay formularios</div>
                <div className="text-gray-400 text-sm">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'No se encontraron formularios con los filtros aplicados'
                    : 'Crea tu primer formulario para comenzar'
                  }
                </div>
              </div>
            ) : (
              filteredForms.map((form) => {
                const categoryInfo = getCategoryInfo(form.category);
                
                return (
                  <Card key={form.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{form.title}</CardTitle>
                          {form.description && (
                            <p className="text-gray-600 text-sm line-clamp-2">
                              {form.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedForm(form);
                              setShowFormBuilder(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewForm(form)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyForm(form)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteForm(form)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-3">
                        {/* Categoría */}
                        {categoryInfo && (
                          <Badge className={categoryInfo.color}>
                            {categoryInfo.label}
                          </Badge>
                        )}
                        
                        {/* Estado */}
                        <div className="flex items-center gap-2">
                          <Badge variant={form.is_active ? "default" : "secondary"}>
                            {form.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                          
                          {form.publicSettings?.isPublic && (
                            <Badge variant="outline">
                              {form.publicSettings.password ? (
                                <Lock className="w-3 h-3 mr-1" />
                              ) : (
                                <Globe className="w-3 h-3 mr-1" />
                              )}
                              {form.publicSettings.password ? "Protegido" : "Público"}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Estadísticas */}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {form.submissions_count} respuestas
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(form.created_at)}
                          </div>
                        </div>
                        
                        {/* Campos */}
                        <div className="text-sm text-gray-500">
                          {form.fields.length} campo{form.fields.length !== 1 ? 's' : ''}
                        </div>
                        
                        {/* Enlace público */}
                        {form.publicSettings?.isPublic && form.publicSettings?.publicUrl && (
                          <div className="pt-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `${window.location.origin}/form/${form.publicSettings.publicUrl}`
                                );
                                toast({
                                  title: "Enlace copiado",
                                  description: "El enlace público ha sido copiado al portapapeles"
                                });
                              }}
                            >
                              <Link className="w-4 h-4 mr-2" />
                              Copiar enlace público
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="indicators">
          <IndicatorManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};
