import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X, Eye, Edit, Download, Save } from 'lucide-react';
import { useProfesionales, type Profesional } from '@/hooks/useProfesionales';
import { useProfesionalesMutations } from '@/hooks/useProfesionalesMutations';
import { useToast } from '@/hooks/use-toast';

interface ProfessionalsTableProps {
  onSelectProfessional: (professional: any) => void;
  userRole: string;
  appliedFilters?: any; // Esto se usará para mostrar los filtros activos, pero no para inicializar el estado
  onClearFilters?: () => void;
  // Prop actualizada para recibir los filtros del dashboard, incluyendo los de vencimiento
  dashboardFilters?: {
    area_profesional?: string;
    estado_solicitud?: string;
    provincia?: string;
    genero?: string;
    tipo_sector?: string;
    vencimiento_proximo?: boolean; // Nuevo
    carnet_vencido?: boolean;     // Nuevo
    prioridad_renovacion?: 'alta' | 'media' | 'baja' | 'vencido' | 'all'; // Nuevo
    // Puedes añadir otros filtros si los usas
  };
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
    estado_solicitud: 'Aprobado', // Por defecto, mostrar aprobados
    provincia: 'todos',
    genero: 'todos',
    tipo_sector: 'todos'
  });

  const { toast } = useToast();
  const { updateProfesional } = useProfesionalesMutations();

  // **ACTUALIZACIÓN CLAVE**: Sincroniza los filtros internos con `dashboardFilters`
  useEffect(() => {
    console.log('ProfessionalsTable: dashboardFilters received in useEffect:', dashboardFilters);
    setFilters(prev => {
      const newFilters = { ...prev };

      // Aplica los filtros específicos del dashboard
      if (dashboardFilters?.area_profesional !== undefined) newFilters.area_profesional = dashboardFilters.area_profesional || 'todos';
      if (dashboardFilters?.provincia !== undefined) newFilters.provincia = dashboardFilters.provincia || 'todos';
      if (dashboardFilters?.genero !== undefined) newFilters.genero = dashboardFilters.genero || 'todos';
      if (dashboardFilters?.tipo_sector !== undefined) newFilters.tipo_sector = dashboardFilters.tipo_sector || 'todos';

      // Manejar estado_solicitud: Si viene del dashboard, úsalo; de lo contrario, 'Aprobado'
      if (dashboardFilters?.estado_solicitud !== undefined) {
        newFilters.estado_solicitud = dashboardFilters.estado_solicitud || 'todos';
      } else {
        newFilters.estado_solicitud = 'Aprobado'; // Si no hay estado_solicitud en dashboardFilters, por defecto Aprobado
      }

      // Los filtros de vencimiento (vencimiento_proximo, carnet_vencido, prioridad_renovacion)
      // no se guardan en el estado `filters` directamente porque no corresponden a los `Select` de la tabla,
      // pero sí se pasarán al `useProfesionales` hook a través de `queryFilters`.

      return newFilters;
    });
    // Limpiar el término de búsqueda si los filtros cambian desde el dashboard
    setSearchTerm('');
  }, [dashboardFilters]);


  // Combinar filtros locales y los recibidos del dashboard para la consulta.
  // Es importante que dashboardFilters anule los valores por defecto o locales cuando sea necesario.
  const combinedQueryFilters = {
    ...Object.fromEntries(
      Object.entries(filters).map(([key, value]) => [
        key,
        value === 'todos' ? '' : value // Convertir 'todos' a string vacío para la query
      ])
    ),
    // **ACTUALIZACIÓN CLAVE**: Incluir los filtros de vencimiento directamente aquí para el hook
    vencimiento_proximo: dashboardFilters?.vencimiento_proximo || undefined,
    carnet_vencido: dashboardFilters?.carnet_vencido || undefined,
    prioridad_renovacion: dashboardFilters?.prioridad_renovacion || undefined,
    // Asegurarse de que estado_solicitud del dashboard tenga prioridad si se estableció
    estado_solicitud: dashboardFilters?.estado_solicitud === undefined
      ? (filters.estado_solicitud === 'todos' ? '' : filters.estado_solicitud)
      : (dashboardFilters.estado_solicitud === 'todos' ? '' : dashboardFilters.estado_solicitud),
  };

  const { data: profesionales = [], isLoading, error, refetch } = useProfesionales(combinedQueryFilters);

  const filteredProfesionales = profesionales.filter(prof =>
    prof.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prof.area_profesional?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prof.numero_carnet_profesional?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClearAllFilters = () => {
    console.log('Clearing all filters in ProfessionalsTable');
    setSearchTerm('');
    setFilters({
      area_profesional: 'todos',
      estado_solicitud: 'Aprobado', // Volver a 'Aprobado' por defecto
      provincia: 'todos',
      genero: 'todos',
      tipo_sector: 'todos'
    });
    if (onClearFilters) {
      onClearFilters(); // Llama a la función del padre para limpiar los filtros globales
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
      await updateProfesional.mutateAsync({
        id: professionalId,
        updates: {
          estado_solicitud: newState,
          fecha_revision: newState !== 'Pendiente' ? new Date().toISOString().split('T')[0] : null,
          fecha_aprobacion: newState === 'Aprobado' ? new Date().toISOString().split('T')[0] : null
        }
      });

      setEditingStates(prev => {
        const newStates = { ...prev };
        delete newStates[professionalId];
        return newStates;
      });

      refetch();
      toast({
        title: "Estado actualizado",
        description: `El estado del profesional ha sido cambiado a "${newState}".`,
      });
    } catch (error) {
      console.error('Error updating professional state:', error);
      toast({
        title: "Error al actualizar",
        description: "Hubo un problema al cambiar el estado del profesional.",
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
      'Pendiente de Firma': 'bg-blue-100 text-blue-800',
      'Rechazado': 'bg-red-100 text-red-800',
      'Revisando': 'bg-orange-100 text-orange-800'
    };
    return variants[estado] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  // Determinar si hay filtros activos para mostrar la tarjeta de filtros aplicados
  const hasActiveFilters = searchTerm ||
    Object.values(filters).some(value => value && value !== 'todos' && value !== 'Aprobado') ||
    dashboardFilters?.vencimiento_proximo ||
    dashboardFilters?.carnet_vencido ||
    dashboardFilters?.prioridad_renovacion;


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
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
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
                  Búsqueda: {searchTerm}
                </Badge>
              )}
              {/* Muestra los filtros locales */}
              {Object.entries(filters).map(([key, value]) => {
                if (!value || value === 'todos' || (key === 'estado_solicitud' && value === 'Aprobado')) return null;
                return (
                  <Badge key={key} variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                    {key.replace('_', ' ')}: {String(value)}
                  </Badge>
                );
              })}
              {/* Mostrar filtros de vencimiento si vienen del dashboard */}
              {dashboardFilters?.vencimiento_proximo && (
                  <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                      Vencimiento: Próximo
                  </Badge>
              )}
              {dashboardFilters?.carnet_vencido && (
                  <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                      Vencimiento: Vencido
                  </Badge>
              )}
              {dashboardFilters?.prioridad_renovacion && dashboardFilters.prioridad_renovacion !== 'all' && (
                  <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                      Prioridad Renovación: {dashboardFilters.prioridad_renovacion}
                  </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="flex items-center space-x-2">
              <span>Profesionales Aprobados</span>
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

                <Select value={filters.provincia} onValueChange={(value) => setFilters({...filters, provincia: value})}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Provincia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="Malabo">Malabo</SelectItem>
                    <SelectItem value="Bata">Bata</SelectItem>
                    <SelectItem value="Ebebiyin">Ebebiyin</SelectItem>
                    <SelectItem value="Aconibe">Aconibe</SelectItem>
                    <SelectItem value="Mongomo">Mongomo</SelectItem>
                    <SelectItem value="Evinayong">Evinayong</SelectItem>
                    <SelectItem value="Luba">Luba</SelectItem>
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
                      No se encontraron profesionales aprobados con los filtros aplicados
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
                        {editingStates[profesional.id!] ? (
                          <div className="flex items-center space-x-2">
                            <Select
                              value={editingStates[profesional.id!]}
                              onValueChange={(value) => setEditingStates(prev => ({ ...prev, [profesional.id!]: value }))}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Aprobado">Aprobado</SelectItem>
                                <SelectItem value="Pendiente">Pendiente</SelectItem>
                                <SelectItem value="Pendiente de Firma">Pendiente de Firma</SelectItem>
                                <SelectItem value="Rechazado">Rechazado</SelectItem>
                                <SelectItem value="Revisando">Revisando</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button size="icon" variant="ghost" onClick={() => handleSaveState(profesional.id!)} disabled={updateProfesional.isLoading}>
                              <Save className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleCancelEdit(profesional.id!)}>
                              <X className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <Badge className={getEstadoBadge(profesional.estado_solicitud || 'Pendiente')}>
                            {profesional.estado_solicitud || 'Pendiente'}
                          </Badge>
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
                          {userRole === 'administrador' && ( // Solo el administrador puede editar el estado
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditState(profesional.id!, profesional.estado_solicitud || 'Pendiente')}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
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
