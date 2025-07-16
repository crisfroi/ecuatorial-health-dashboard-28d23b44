import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X, Eye, Edit, Download, Save } from 'lucide-react';
import { useProfesionales, type Profesional } from '@/hooks/useProfesionales';
import { useProfesionalesMutations } => '@/hooks/useProfesionalesMutations';
import { useToast } from '@/hooks/use-toast';

interface DashboardFilters {
  area_profesional?: string;
  estado_solicitud?: string;
  provincia?: string;
  genero?: string;
  tipo_sector?: string;
  vencimiento_proximo?: boolean;
  carnet_vencido?: boolean;
  prioridad_renovacion?: 'alta' | 'media' | 'baja' | 'vencido' | 'all';
}

interface ProfessionalsTableProps {
  onSelectProfessional: (professional: any) => void;
  userRole: string;
  appliedFilters?: DashboardFilters;
  onClearFilters?: () => void;
}

const ProfessionalsTable = (props: ProfessionalsTableProps) => {
  const { onSelectProfessional, userRole, appliedFilters, onClearFilters } = props;
  const dashboardFilters = appliedFilters; // Esto sigue siendo el filtro que viene del Dashboard

  // --- LOGS CLAVE PARA LA DEPURACIÓN (Mantenemos estos para que veas que el appliedFilters del dashboard llega) ---
  console.log('ProfessionalsTable: OBJETO PROPS COMPLETO RECIBIDO:', props);
  console.log('ProfessionalsTable: Prop appliedFilters específica:', appliedFilters);
  console.log('ProfessionalsTable: Filtros desestructurados (dashboardFilters):', dashboardFilters);
  // --- FIN LOGS CLAVE ---

  const [searchTerm, setSearchTerm] = useState('');
  const [editingStates, setEditingStates] = useState<Record<string, string>>({});

  // Ahora 'genero' se incluye en localFilters y se inicializa con 'todos'
  const [localFilters, setLocalFilters] = useState({
    area_profesional: 'todos',
    estado_solicitud: 'Aprobado',
    provincia: 'todos',
    genero: 'todos', // <<< CAMBIO CLAVE 1: Género ahora es parte de localFilters
    tipo_sector: 'todos'
  });

  const { toast } = useToast();
  const { updateProfesional } = useProfesionalesMutations();

  useEffect(() => {
    console.log("ProfessionalsTable: Received dashboardFilters prop in useEffect:", dashboardFilters);

    setSearchTerm('');

    setLocalFilters(prevLocalFilters => {
      const newLocalFilters = { ...prevLocalFilters };

      // Se aplican los filtros del dashboard si existen, de lo contrario, se usa 'todos' o el valor por defecto.
      // Si el dashboard NO proporciona un filtro de género, se mantendrá 'todos' en localFilters
      // Si el dashboard SÍ proporciona un filtro de género, se actualizará localFilters.genero con ese valor
      newLocalFilters.area_profesional = (dashboardFilters?.area_profesional && dashboardFilters.area_profesional !== 'todos') ? dashboardFilters.area_profesional : 'todos';
      newLocalFilters.provincia = (dashboardFilters?.provincia && dashboardFilters.provincia !== 'todos') ? dashboardFilters.provincia : 'todos';
      newLocalFilters.genero = (dashboardFilters?.genero && dashboardFilters.genero !== 'todos') ? dashboardFilters.genero : 'todos'; // <<< CAMBIO CLAVE 2: Se sincroniza género desde el dashboard
      newLocalFilters.tipo_sector = (dashboardFilters?.tipo_sector && dashboardFilters.tipo_sector !== 'todos') ? dashboardFilters.tipo_sector : 'todos';
      newLocalFilters.estado_solicitud = (dashboardFilters?.estado_solicitud && dashboardFilters.estado_solicitud !== 'todos') ? dashboardFilters.estado_solicitud : 'Aprobado';

      console.log("ProfessionalsTable: Updated localFilters based on dashboardFilters (inside useEffect):", newLocalFilters);
      return newLocalFilters;
    });

  }, [dashboardFilters]);

  const combinedQueryFilters = useMemo(() => {
    const filters = {
      // Género: Ahora siempre se lee de localFilters
      genero: (localFilters.genero === 'todos') ? '' : localFilters.genero, // <<< CAMBIO CLAVE 3: Leer de localFilters

      estado_solicitud: (localFilters.estado_solicitud === 'todos' || localFilters.estado_solicitud === 'Aprobado')
        ? 'Aprobado' // Siempre 'Aprobado' si es 'todos' o 'Aprobado' en localFilters
        : localFilters.estado_solicitud,

      area_profesional: (localFilters.area_profesional === 'todos' ? '' : localFilters.area_profesional),
      provincia: (localFilters.provincia === 'todos' ? '' : localFilters.provincia),
      tipo_sector: (localFilters.tipo_sector === 'todos' ? '' : localFilters.tipo_sector),

      // Los filtros específicos del dashboard (vencimiento_proximo, carnet_vencido, prioridad_renovacion)
      // se siguen tomando directamente de dashboardFilters, ya que no son parte de los selectores locales.
      vencimiento_proximo: dashboardFilters?.vencimiento_proximo || undefined,
      carnet_vencido: dashboardFilters?.carnet_vencido || undefined,
      prioridad_renovacion: (dashboardFilters?.prioridad_renovacion && dashboardFilters.prioridad_renovacion !== 'all')
        ? dashboardFilters.prioridad_renovacion
        : undefined,
    };
    console.log('ProfessionalsTable: Final combinedQueryFilters passed to useProfesionales (from useMemo):', filters);
    return filters;
  }, [dashboardFilters, localFilters]); // Mantenemos ambas dependencias por los filtros específicos del dashboard

  const { data: profesionales = [], isLoading, error, refetch } = useProfesionales(combinedQueryFilters);

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
      estado_solicitud: 'Aprobado',
      provincia: 'todos',
      genero: 'todos', // <<< CAMBIO CLAVE 4: Resetear género también
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
  // Se ha simplificado ligeramente la lógica de los localFilters
  const hasActiveFilters = searchTerm ||
    Object.entries(localFilters).some(([key, value]) => {
      // Para estado_solicitud, solo lo consideramos activo si no es 'Aprobado'
      if (key === 'estado_solicitud') {
        return value !== 'Aprobado';
      }
      // Para los demás, si no es 'todos'
      return value !== 'todos';
    }) ||
    // Los filtros que solo pueden venir del dashboard
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
              {/* Ahora los filtros de dashboard se muestran si tienen un valor,
                  y los locales si no son 'todos' (ya que género está aquí ahora) */}
              {localFilters.area_profesional !== 'todos' && (
                <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                  Área: {localFilters.area_profesional}
                </Badge>
              )}
              {localFilters.provincia !== 'todos' && (
                <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                  Provincia: {localFilters.provincia}
                </Badge>
              )}
              {localFilters.genero !== 'todos' && ( // <<< CAMBIO CLAVE 5: Mostrar género de localFilters
                <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                  Género: {localFilters.genero}
                </Badge>
              )}
              {localFilters.tipo_sector !== 'todos' && (
                <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                  Tipo Sector: {localFilters.tipo_sector}
                </Badge>
              )}
              {localFilters.estado_solicitud !== 'Aprobado' && (
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
                {/* Selector de Área Profesional (sin cambios) */}
                <Select
                  value={localFilters.area_profesional}
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

                {/* Selector de Provincia (sin cambios) */}
                <Select
                  value={localFilters.provincia}
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

                {/* Selector de Género: Ahora es controlable localmente */}
                <Select
                  value={localFilters.genero} // <<< CAMBIO CLAVE 6: El valor viene de localFilters
                  onValueChange={(value) => setLocalFilters(prev => ({...prev, genero: value}))} // <<< CAMBIO CLAVE 7: Actualizar localFilters
                  // disabled ya no está aquí, así que siempre es editable
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

                {/* Selector de Tipo de Sector (sin cambios) */}
                <Select
                  value={localFilters.tipo_sector}
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

                {/* Selector de Estado de Solicitud (sin cambios) */}
                <Select
                  value={localFilters.estado_solicitud}
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
                          {userRole === 'administrador' && (
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
