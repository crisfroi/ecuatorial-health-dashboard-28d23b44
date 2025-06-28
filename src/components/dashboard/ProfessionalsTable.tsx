
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X, Eye, Edit, Download, Save } from 'lucide-react';
import { useProfesionales, type Profesional } from '@/hooks/useProfesionales';
import { useActualizarProfesional } from '@/hooks/useProfesionalesMutations';
import { useToast } from '@/hooks/use-toast';

interface ProfessionalsTableProps {
  onSelectProfessional: (professional: any) => void;
  userRole: string;
  appliedFilters?: any;
  onClearFilters?: () => void;
  dashboardFilters?: any;
}

const ProfessionalsTable = ({ 
  onSelectProfessional, 
  userRole, 
  appliedFilters, 
  onClearFilters,
  dashboardFilters 
}: ProfessionalsTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStates, setEditingStates] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState({
    area_profesional: 'todos',
    estado_solicitud: 'todos',
    provincia: 'todos',
    genero: 'todos',
    tipo_sector: 'todos'
  });

  const { toast } = useToast();
  const updateProfessional = useActualizarProfesional();

  // Combinar filtros aplicados desde el dashboard con filtros locales
  const combinedFilters = {
    ...filters,
    ...dashboardFilters,
    ...appliedFilters
  };

  // Convertir "todos" a empty string para la query
  const queryFilters = Object.fromEntries(
    Object.entries(combinedFilters).map(([key, value]) => [
      key, 
      value === 'todos' ? '' : value
    ])
  );

  const { data: profesionales = [], isLoading, error } = useProfesionales(queryFilters);

  // Aplicar filtro de búsqueda local
  const filteredProfesionales = profesionales.filter(prof =>
    prof.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prof.area_profesional?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prof.numero_carnet_profesional?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (dashboardFilters) {
      console.log('ProfessionalsTable: Dashboard filters received:', dashboardFilters);
      // Actualizar filtros locales con los del dashboard
      setFilters(prev => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(dashboardFilters).map(([key, value]) => [key, value || 'todos'])
        )
      }));
    }
  }, [dashboardFilters]);

  const handleClearAllFilters = () => {
    console.log('Clearing all filters');
    setSearchTerm('');
    setFilters({
      area_profesional: 'todos',
      estado_solicitud: 'todos',
      provincia: 'todos',
      genero: 'todos',
      tipo_sector: 'todos'
    });
    if (onClearFilters) {
      onClearFilters();
    }
  };

  const handleEditState = (professionalId: string, currentState: string) => {
    setEditingStates(prev => ({
      ...prev,
      [professionalId]: currentState
    }));
  };

  const handleSaveState = async (professionalId: string) => {
    const newState = editingStates[professionalId];
    if (!newState) return;

    try {
      await updateProfessional.mutateAsync({
        id: professionalId,
        updates: {
          estado_solicitud: newState,
          fecha_revision: newState !== 'Pendiente' ? new Date().toISOString().split('T')[0] : null,
          fecha_aprobacion: newState === 'Aprobado' ? new Date().toISOString().split('T')[0] : null
        }
      });

      toast({
        title: "Estado actualizado",
        description: `El estado del profesional ha sido actualizado a ${newState}`,
        variant: "default",
      });

      setEditingStates(prev => {
        const newStates = { ...prev };
        delete newStates[professionalId];
        return newStates;
      });
    } catch (error) {
      console.error('Error updating professional state:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del profesional",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = (professionalId: string) => {
    setEditingStates(prev => {
      const newStates = { ...prev };
      delete newStates[professionalId];
      return newStates;
    });
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, string> = {
      'Aprobado': 'bg-green-100 text-green-800',
      'Pendiente': 'bg-yellow-100 text-yellow-800',
      'Rechazado': 'bg-red-100 text-red-800',
      'Revisando': 'bg-blue-100 text-blue-800'
    };
    return variants[estado] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = searchTerm || 
    Object.values(combinedFilters).some(value => value && value !== 'todos') ||
    Object.values(filters).some(value => value && value !== 'todos');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando profesionales...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Error al cargar los datos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error: {error.message}</p>
          <p className="text-sm text-gray-600 mt-2">
            Verifica que la tabla esté creada correctamente en Supabase.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros aplicados */}
      {hasActiveFilters && (
        <Card className="border-guinea-teal">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-guinea-teal">
                Filtros Aplicados
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAllFilters}
                className="text-guinea-teal hover:text-guinea-dark-teal hover:bg-guinea-light-teal"
              >
                <X className="w-4 h-4 mr-1" />
                Limpiar Filtros
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                  búsqueda: {searchTerm}
                </Badge>
              )}
              {Object.entries(combinedFilters).map(([key, value]) => {
                if (!value || value === 'todos') return null;
                return (
                  <Badge key={key} variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                    {key.replace('_', ' ')}: {String(value)}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="flex items-center space-x-2">
              <span>Profesionales Sanitarios</span>
              <Badge variant="outline">{filteredProfesionales.length}</Badge>
            </CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar profesional..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={filters.area_profesional} onValueChange={(value) => setFilters({...filters, area_profesional: value})}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas las áreas</SelectItem>
                    <SelectItem value="MEDICINA GENERAL">Medicina General</SelectItem>
                    <SelectItem value="ENFERMERÍA">Enfermería</SelectItem>
                    <SelectItem value="FARMACIA">Farmacia</SelectItem>
                    <SelectItem value="LABORATORIO">Laboratorio</SelectItem>
                    <SelectItem value="RADIOLOGÍA">Radiología</SelectItem>
                    <SelectItem value="ODONTOLOGÍA">Odontología</SelectItem>
                    <SelectItem value="NUTRICIÓN">Nutrición</SelectItem>
                    <SelectItem value="ESPECIALIDAD">Especialidad</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.estado_solicitud} onValueChange={(value) => setFilters({...filters, estado_solicitud: value})}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="Aprobado">Aprobado</SelectItem>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Rechazado">Rechazado</SelectItem>
                    <SelectItem value="Revisando">Revisando</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>Área Profesional</TableHead>
                  <TableHead>Carnet</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Provincia</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfesionales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {profesionales.length === 0 
                        ? "No hay profesionales registrados aún"
                        : "No se encontraron profesionales con los filtros aplicados"
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfesionales.map((profesional) => (
                    <TableRow key={profesional.id}>
                      <TableCell className="font-medium">
                        {profesional.nombre_completo}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {profesional.area_profesional}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {profesional.numero_carnet_profesional || 'Pendiente'}
                      </TableCell>
                      <TableCell>
                        {editingStates[profesional.id] !== undefined ? (
                          <div className="flex items-center space-x-2">
                            <Select
                              value={editingStates[profesional.id]}
                              onValueChange={(value) => setEditingStates(prev => ({
                                ...prev,
                                [profesional.id]: value
                              }))}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pendiente">Pendiente</SelectItem>
                                <SelectItem value="Revisando">Revisando</SelectItem>
                                <SelectItem value="Aprobado">Aprobado</SelectItem>
                                <SelectItem value="Rechazado">Rechazado</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSaveState(profesional.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancelEdit(profesional.id)}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Badge className={getEstadoBadge(profesional.estado_solicitud || 'Pendiente')}>
                              {profesional.estado_solicitud || 'Pendiente'}
                            </Badge>
                            {(userRole === 'administrador' || userRole === 'comite') && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditState(profesional.id, profesional.estado_solicitud || 'Pendiente')}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{profesional.provincia || 'N/A'}</TableCell>
                      <TableCell>{formatDate(profesional.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSelectProfessional(profesional)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessionalsTable;
