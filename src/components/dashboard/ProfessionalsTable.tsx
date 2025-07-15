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
    genero?: string; // Ahora manejado directamente
    tipo_sector?: string;
    vencimiento_proximo?: boolean; // Nuevo
    carnet_vencido?: boolean;      // Nuevo
    prioridad_renovacion?: 'alta' | 'media' | 'baja' | 'vencido' | 'all'; // Nuevo
    // Puedes añadir otros filtros si los usas
  };
}

const ProfessionalsTable = ({
  onSelectProfessional,
  userRole,
  appliedFilters, // Esto es el `appliedFilters` del Dashboard, no es lo que pasamos directamente a useProfesionales
  onClearFilters,
  dashboardFilters // Estos son los filtros calculados del Dashboard y deben tener prioridad
}: ProfessionalsTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStates, setEditingStates] = useState<Record<string, string>>({});
  // Mantén este estado para los filtros controlados por los SELECTs de la tabla.
  // No los inicialices con "Aprobado" si la intención es que los dashboardFilters los anulen.
  const [localFilters, setLocalFilters] = useState({
    area_profesional: 'todos',
    estado_solicitud: 'todos', // Cambiado a 'todos' para que dashboardFilters.estado_solicitud tenga prioridad
    provincia: 'todos',
    genero: 'todos', // Cambiado a 'todos'
    tipo_sector: 'todos'
  });

  const { toast } = useToast();
  const { updateProfesional } = useProfesionalesMutations();

  // NO SINCRONIZAR directamentamente dashboardFilters con localFilters.
  // En su lugar, el dashboardFilters se fusiona directamente con los filtros locales
  // para la llamada a useProfesionales, dando prioridad a los del dashboard.
  // useEffect para limpiar el searchTerm cuando los filtros del dashboard cambian
  useEffect(() => {
    // Si dashboardFilters cambia, es probable que se haya navegado desde una StatCard.
    // Limpiamos el searchTerm para evitar conflictos en la búsqueda.
    setSearchTerm('');
    // Opcionalmente, puedes querer resetear algunos `localFilters` aquí si los dashboardFilters no los cubren.
    // Por ejemplo, si se aplica un filtro de género desde el dashboard, los selectores locales
    // para otros filtros deberían seguir siendo "todos" a menos que también se especifiquen en dashboardFilters.
    // Para simplificar, asumimos que dashboardFilters anula lo que sea que venga de localFilters.
    // La clave es que `combinedQueryFilters` resuelva la prioridad.
  }, [dashboardFilters]);


  // Combinar filtros locales y los recibidos del dashboard para la consulta.
  // **ACTUALIZACIÓN CLAVE AQUÍ**: Prioriza los `dashboardFilters`
  const combinedQueryFilters = {
    // 1. Inicia con los filtros por defecto (si 'todos' se convierte a vacío)
    area_profesional: localFilters.area_profesional === 'todos' ? '' : localFilters.area_profesional,
    provincia: localFilters.provincia === 'todos' ? '' : localFilters.provincia,
    genero: localFilters.genero === 'todos' ? '' : localFilters.genero,
    tipo_sector: localFilters.tipo_sector === 'todos' ? '' : localFilters.tipo_sector,
    estado_solicitud: localFilters.estado_solicitud === 'todos' ? '' : localFilters.estado_solicitud,

    // 2. Sobrescribe con los filtros del dashboard si existen
    ...(dashboardFilters?.area_profesional && { area_profesional: dashboardFilters.area_profesional }),
    ...(dashboardFilters?.provincia && { provincia: dashboardFilters.provincia }),
    ...(dashboardFilters?.genero && { genero: dashboardFilters.genero }), // <--- ¡Esto es lo crucial para género!
    ...(dashboardFilters?.tipo_sector && { tipo_sector: dashboardFilters.tipo_sector }),

    // Manejo especial para estado_solicitud: si viene del dashboard, tiene prioridad
    estado_solicitud: dashboardFilters?.estado_solicitud
        ? (dashboardFilters.estado_solicitud === 'todos' ? '' : dashboardFilters.estado_solicitud)
        : (localFilters.estado_solicitud === 'todos' ? '' : localFilters.estado_solicitud),
    
    // Filtros de vencimiento (no están en localFilters, solo vienen del dashboard)
    vencimiento_proximo: dashboardFilters?.vencimiento_proximo || undefined,
    carnet_vencido: dashboardFilters?.carnet_vencido || undefined,
    prioridad_renovacion: dashboardFilters?.prioridad_renovacion || undefined,
  };

  // Log para depuración: Muestra los filtros finales que se pasan al hook
  console.log('ProfessionalsTable: combinedQueryFilters passed to useProfesionales:', combinedQueryFilters);

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
      estado_solicitud: 'todos', // Cambiado a 'todos' para que se restablezca completamente
      provincia: 'todos',
      genero: 'todos', // Añadido para limpiar el filtro de género local
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
  // Se ha ajustado para usar `dashboardFilters` directamente para los filtros que provienen de allí.
  const hasActiveFilters = searchTerm ||
    Object.values(localFilters).some(value => value && value !== 'todos') || // Ahora localFilters solo 'todos' significa no activo
    (dashboardFilters?.estado_solicitud && dashboardFilters.estado_solicitud !== 'todos' && dashboardFilters.estado_solicitud !== 'Aprobado') || // Si dashboardFilters tiene estado_solicitud diferente de 'todos' y no es 'Aprobado'
    (dashboardFilters?.genero && dashboardFilters.genero !== 'todos') || // Mostrar si hay un filtro de género del dashboard
    (dashboardFilters?.area_profesional && dashboardFilters.area_profesional !== 'todos') ||
    (dashboardFilters?.provincia && dashboardFilters.provincia !== 'todos') ||
    (dashboardFilters?.tipo_sector && dashboardFilters.tipo_sector !== 'todos') ||
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
              {/* Mostrar los filtros activos, dando prioridad a los del dashboard */}
              {(dashboardFilters?.area_profesional && dashboardFilters.area_profesional !== 'todos') && (
                <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                  Área: {dashboardFilters.area_profesional}
                </Badge>
              )}
              {(dashboardFilters?.provincia && dashboardFilters.provincia !== 'todos') && (
                <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                  Provincia: {dashboardFilters.provincia}
                </Badge>
              )}
              {(dashboardFilters?.genero && dashboardFilters.genero !== 'todos') && (
                <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                  Género: {dashboardFilters.genero}
                </Badge>
              )}
              {(dashboardFilters?.tipo_sector && dashboardFilters.tipo_sector !== 'todos') && (
                <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                  Tipo Sector: {dashboardFilters.tipo_sector}
                </Badge>
              )}
              {(dashboardFilters?.estado_solicitud && dashboardFilters.estado_solicitud !== 'todos') && (
                <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                  Estado Solicitud: {dashboardFilters.estado_solicitud}
                </Badge>
              )}
              {/* Si no hay filtro de área del dashboard, mostrar el filtro local */}
              {!(dashboardFilters?.area_profesional) && (localFilters.area_profesional !== 'todos') && (
                <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                  Área: {localFilters.area_profesional}
                </Badge>
              )}
              {/* Si no hay filtro de provincia del dashboard, mostrar el filtro local */}
              {!(dashboardFilters?.provincia) && (localFilters.provincia !== 'todos') && (
                <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                  Provincia: {localFilters.provincia}
                </Badge>
              )}
              {/* Si no hay filtro de género del dashboard, mostrar el filtro local */}
              {!(dashboardFilters?.genero) && (localFilters.genero !== 'todos') && (
                <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                  Género: {localFilters.genero}
                </Badge>
              )}
              {/* Si no hay filtro de tipo_sector del dashboard, mostrar el filtro local */}
              {!(dashboardFilters?.tipo_sector) && (localFilters.tipo_sector !== 'todos') && (
                <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                  Tipo Sector: {localFilters.tipo_sector}
                </Badge>
              )}
              {/* Si no hay filtro de estado_solicitud del dashboard, mostrar el filtro local */}
              {!(dashboardFilters?.estado_solicitud) && (localFilters.estado_solicitud !== 'todos') && (
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
                  value={dashboardFilters?.area_profesional || localFilters.area_profesional} // Prioriza dashboardFilter
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
                  value={dashboardFilters?.provincia || localFilters.provincia} // Prioriza dashboardFilter
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

                {/* Nuevo Selector de Género */}
                <Select
                  value={dashboardFilters?.genero || localFilters.genero} // Prioriza dashboardFilter
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
                  value={dashboardFilters?.tipo_sector || localFilters.tipo_sector} // Prioriza dashboardFilter
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

                {/* Selector de Estado de Solicitud (si es necesario que esté aquí) */}
                {/* Nota: Este selector por defecto ya muestra "Aprobado" si no hay filtro de dashboard */}
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
