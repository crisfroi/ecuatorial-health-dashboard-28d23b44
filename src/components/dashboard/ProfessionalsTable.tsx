import { useState, useEffect, useCallback } from 'react';
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
    genero?: string; // Ahora manejado directamente
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
  appliedFilters, // Esto es el `appliedFilters` del Dashboard, solo para mostrar filtros activos
  onClearFilters,
  dashboardFilters // Estos son los filtros calculados del Dashboard y deben tener prioridad cuando aplique
}: ProfessionalsTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStates, setEditingStates] = useState<Record<string, string>>({});
  
  // Mantenemos localFilters para los selectores de la tabla.
  // estado_solicitud se inicializa a 'Aprobado' para la tabla de profesionales.
  const [localFilters, setLocalFilters] = useState({
    area_profesional: 'todos',
    estado_solicitud: 'Aprobado', // VUELVE A 'Aprobado' por defecto para esta tabla
    provincia: 'todos',
    genero: 'todos', // Vuelve a 'todos'
    tipo_sector: 'todos'
  });

  const { toast } = useToast();
  const { updateProfesional } = useProfesionalesMutations();

  // useEffect para limpiar el searchTerm y asegurar que localFilters.estado_solicitud sea 'Aprobado'
  // y que los filtros locales se reinicien si el dashboardFilters se vacía.
  useEffect(() => {
    console.log("ProfessionalsTable: Received dashboardFilters prop:", dashboardFilters); // Log 3
    setSearchTerm('');
    
    // Si el dashboard está "limpiando" todos los filtros (por ejemplo, al cambiar de pestaña),
    // queremos que los filtros locales vuelvan a su estado predeterminado.
    // Una forma de detectarlo es si dashboardFilters se vuelve un objeto vacío o solo tiene propiedades indefinidas.
    const isDashboardFiltersEmpty = !dashboardFilters || Object.keys(dashboardFilters).every(key => dashboardFilters[key as keyof typeof dashboardFilters] === undefined || dashboardFilters[key as keyof typeof dashboardFilters] === 'todos' || dashboardFilters[key as keyof typeof dashboardFilters] === 'all');

    setLocalFilters(prevLocalFilters => {
        const newLocalFilters = { ...prevLocalFilters };

        // Solo restablece los filtros locales si el dashboard no tiene un filtro específico para ellos
        // y si el filtro local actual no es 'todos' (o 'Aprobado' para estado_solicitud)
        if (!dashboardFilters?.area_profesional || dashboardFilters.area_profesional === 'todos') {
            newLocalFilters.area_profesional = 'todos';
        }
        if (!dashboardFilters?.provincia || dashboardFilters.provincia === 'todos') {
            newLocalFilters.provincia = 'todos';
        }
        if (!dashboardFilters?.genero || dashboardFilters.genero === 'todos') {
            newLocalFilters.genero = 'todos';
        }
        if (!dashboardFilters?.tipo_sector || dashboardFilters.tipo_sector === 'todos') {
            newLocalFilters.tipo_sector = 'todos';
        }
        // Para estado_solicitud, si el dashboard no lo especifica o es 'todos', siempre será 'Aprobado' en localFilters
        if (!dashboardFilters?.estado_solicitud || dashboardFilters.estado_solicitud === 'todos') {
            newLocalFilters.estado_solicitud = 'Aprobado';
        }
        
        console.log("ProfessionalsTable: Updated localFilters based on dashboardFilters (inside useEffect):", newLocalFilters); // Log 4
        return newLocalFilters;
    });

  }, [dashboardFilters]);


  // Combinar filtros locales y los recibidos del dashboard para la consulta.
  const combinedQueryFilters = {
    // Género: Dar prioridad al dashboardFilter. Si no está definido o es 'todos', usa el localFilter.
    // Si el localFilter es 'todos', conviértelo a cadena vacía para la consulta.
    genero: (dashboardFilters?.genero && dashboardFilters.genero !== 'todos')
      ? dashboardFilters.genero
      : (localFilters.genero === 'todos' ? '' : localFilters.genero),

    // Estado de Solicitud: Dar prioridad al dashboardFilter. Si no está definido o es 'todos', usa el localFilter.
    // El localFilter de estado_solicitud debería ser 'Aprobado' por defecto.
    estado_solicitud: (dashboardFilters?.estado_solicitud && dashboardFilters.estado_solicitud !== 'todos')
      ? dashboardFilters.estado_solicitud
      : localFilters.estado_solicitud, // localFilters.estado_solicitud es 'Aprobado' por defecto

    // Área Profesional: Similar, prioridad a dashboardFilter.
    area_profesional: (dashboardFilters?.area_profesional && dashboardFilters.area_profesional !== 'todos')
      ? dashboardFilters.area_profesional
      : (localFilters.area_profesional === 'todos' ? '' : localFilters.area_profesional),

    // Provincia: Similar, prioridad a dashboardFilter.
    provincia: (dashboardFilters?.provincia && dashboardFilters.provincia !== 'todos')
      ? dashboardFilters.provincia
      : (localFilters.provincia === 'todos' ? '' : localFilters.provincia),

    // Tipo de Sector: Similar, prioridad a dashboardFilter.
    tipo_sector: (dashboardFilters?.tipo_sector && dashboardFilters.tipo_sector !== 'todos')
      ? dashboardFilters.tipo_sector
      : (localFilters.tipo_sector === 'todos' ? '' : localFilters.tipo_sector),

    // Filtros de vencimiento (estos no tienen un equivalente local de "todos", vienen directos del dashboard)
    vencimiento_proximo: dashboardFilters?.vencimiento_proximo || undefined,
    carnet_vencido: dashboardFilters?.carnet_vencido || undefined,
    prioridad_renovacion: (dashboardFilters?.prioridad_renovacion && dashboardFilters.prioridad_renovacion !== 'all')
      ? dashboardFilters.prioridad_renovacion
      : undefined, // Si es 'all' o no está definido, no se pasa el filtro
  };

  // Log para depuración: Muestra los filtros finales que se pasan al hook
  console.log('ProfessionalsTable: Final combinedQueryFilters passed to useProfesionales:', combinedQueryFilters); // Log 5

  const { data: profesionales = [], isLoading, error, refetch } = useProfesionales(combinedQueryFilters);

  // La búsqueda por término sigue filtrando el resultado de la base de datos
  const filteredProfesionales = profesionales.filter(prof =>
    prof.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prof.area_profesional?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prof.numero_carnet_profesional?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClearAllFilters = () => {
    console.log('Clearing all filters in ProfessionalsTable');
    setSearchTerm('');
    setLocalFilters({
      area_profesional: 'todos',
      estado_solicitud: 'Aprobado', // Importante: volver a 'Aprobado'
      provincia: 'todos',
      genero: 'todos', // Limpiar el filtro de género local
      tipo_sector: 'todos'
    });
    if (onClearFilters) {
      onClearFilters(); // Llama a la función del padre para limpiar los filtros globales (dashboardFilters)
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
    Object.entries(localFilters).some(([key, value]) => {
        // Mostrar filtro local si no hay un filtro de dashboard correspondiente
        // O si el filtro de dashboard es 'todos' y el local no es 'todos' (o 'Aprobado' para estado_solicitud)
        if (key === 'estado_solicitud') {
            return (dashboardFilters?.estado_solicitud === 'todos' && value !== 'Aprobado') ||
                   (!dashboardFilters?.estado_solicitud && value !== 'Aprobado');
        }
        return (dashboardFilters?.[key as keyof typeof dashboardFilters] === 'todos' && value !== 'todos') ||
               (!dashboardFilters?.[key as keyof typeof dashboardFilters] && value !== 'todos');
    }) ||
    // Mostrar filtros del dashboard si son específicos
    (dashboardFilters?.area_profesional && dashboardFilters.area_profesional !== 'todos') ||
    (dashboardFilters?.provincia && dashboardFilters.provincia !== 'todos') ||
    (dashboardFilters?.genero && dashboardFilters.genero !== 'todos') ||
    (dashboardFilters?.tipo_sector && dashboardFilters.tipo_sector !== 'todos') ||
    (dashboardFilters?.estado_solicitud && dashboardFilters.estado_solicitud !== 'todos') ||
    dashboardFilters?.vencimiento_proximo ||
    dashboardFilters?.carnet_vencido ||
    (dashboardFilters?.prioridad_renovacion && dashboardFilters.prioridad_renovacion !== 'all');


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
              {/* Mostrar los filtros del dashboard si son específicos y no 'todos' */}
              {dashboardFilters?.area_profesional && dashboardFilters.area_profesional !== 'todos' && (
                <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                  Área: {dashboardFilters.area_profesional}
                </Badge>
              )}
              {dashboardFilters?.provincia && dashboardFilters.provincia !== 'todos' && (
                <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                  Provincia: {dashboardFilters.provincia}
                </Badge>
              )}
              {dashboardFilters?.genero && dashboardFilters.genero !== 'todos' && (
                <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                  Género: {dashboardFilters.genero}
                </Badge>
              )}
              {dashboardFilters?.tipo_sector && dashboardFilters.tipo_sector !== 'todos' && (
                <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                  Tipo Sector: {dashboardFilters.tipo_sector}
                </Badge>
              )}
              {dashboardFilters?.estado_solicitud && dashboardFilters.estado_solicitud !== 'todos' && (
                <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                  Estado Solicitud: {dashboardFilters.estado_solicitud}
                </Badge>
              )}

              {/* Mostrar filtros locales SOLO si no son anulados por un filtro específico del dashboard */}
              {!dashboardFilters?.area_profesional && localFilters.area_profesional !== 'todos' && (
                <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                  Área: {localFilters.area_profesional}
                </Badge>
              )}
              {!dashboardFilters?.provincia && localFilters.provincia !== 'todos' && (
                <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                  Provincia: {localFilters.provincia}
                </Badge>
              )}
              {!dashboardFilters?.genero && localFilters.genero !== 'todos' && (
                <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                  Género: {localFilters.genero}
                </Badge>
              )}
              {!dashboardFilters?.tipo_sector && localFilters.tipo_sector !== 'todos' && (
                <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                  Tipo Sector: {localFilters.tipo_sector}
                </Badge>
              )}
              {/* Mostrar "Estado: Aprobado" por defecto si no hay un filtro de estado específico del dashboard */}
              {!dashboardFilters?.estado_solicitud && localFilters.estado_solicitud === 'Aprobado' && (
                <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                  Estado Solicitud: Aprobado
                </Badge>
              )}
                {/* Mostrar el filtro local de estado si existe y no es Aprobado, y no hay filtro de dashboard */}
              {!dashboardFilters?.estado_solicitud && localFilters.estado_solicitud !== 'todos' && localFilters.estado_solicitud !== 'Aprobado' && (
                <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                  Estado Solicitud: {localFilters.estado_solicitud}
                </Badge>
              )}


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
                {/* Selector de Área Profesional */}
                <Select
                  value={dashboardFilters?.area_profesional || localFilters.area_profesional}
                  onValueChange={(value) => setLocalFilters(prev => ({...prev, area_profesional: value}))}
                >
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

                {/* Selector de Provincia */}
                <Select
                  value={dashboardFilters?.provincia || localFilters.provincia}
                  onValueChange={(value) => setLocalFilters(prev => ({...prev, provincia: value}))}
                >
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

                {/* Selector de Género */}
                <Select
                  value={dashboardFilters?.genero || localFilters.genero}
                  onValueChange={(value) => setLocalFilters(prev => ({...prev, genero: value}))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los géneros</SelectItem>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Femenino">Femenino</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>

                {/* Selector de Tipo de Sector */}
                <Select
                  value={dashboardFilters?.tipo_sector || localFilters.tipo_sector}
                  onValueChange={(value) => setLocalFilters(prev => ({...prev, tipo_sector: value}))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los sectores</SelectItem>
                    <SelectItem value="Público">Público</SelectItem>
                    <SelectItem value="Privado">Privado</SelectItem>
                  </SelectContent>
                </Select>

                {/* Selector de Estado de Solicitud */}
                {/* NOTA: Este selector debería reflejar "Aprobado" por defecto si no viene un filtro de estado explícito del dashboard */}
                <Select
                  value={dashboardFilters?.estado_solicitud || localFilters.estado_solicitud}
                  onValueChange={(value) => setLocalFilters(prev => ({...prev, estado_solicitud: value}))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="Aprobado">Aprobado</SelectItem>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Pendiente de Firma">Pendiente de Firma</SelectItem>
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
                      No se encontraron profesionales con los filtros aplicados.
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
