import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input'; // Importamos Input para las fechas
import { Textarea } from '@/components/ui/textarea'; // Para el motivo de rechazo
import { FileText, Eye, Edit, Save, X, RefreshCw, ChevronDown } from 'lucide-react';
import { useProfesionales, type Profesional } from '@/hooks/useProfesionales';
import { useProfesionalesMutations } from '@/hooks/useProfesionalesMutations';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox'; // Para los checkboxes de selección masiva
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Para el dropdown de acciones masivas

// Definimos los estados válidos y su orden para el flujo
const STATUS_ORDER = [
  'Recibido',
  'Revisando',
  'Pendiente de Firma',
  'Aprobado',
  'Rechazado'
];

interface RequestsPanelProps {
  userRole: string;
  initialStatusFilter?: string;
  onSelectProfessional?: (professional: Profesional) => void;
}

const RequestsPanel = ({ userRole, initialStatusFilter, onSelectProfessional }: RequestsPanelProps) => {
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter || 'Pendiente');
  const [editingStates, setEditingStates] = useState<Record<string, string>>({});
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({}); // Nuevo estado para motivos de rechazo

  // --- Nuevos estados para el filtro por rango de fechas ---
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // --- Nuevo estado para la selección masiva ---
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [bulkUpdateStatus, setBulkUpdateStatus] = useState<string>('');
  const [bulkRejectionReason, setBulkRejectionReason] = useState<string>('');

  const { toast } = useToast();
  const { updateProfesional } = useProfesionalesMutations();

  // Sincroniza `statusFilter` con `initialStatusFilter` del Dashboard
  useEffect(() => {
    console.log('RequestsPanel: initialStatusFilter received in useEffect:', initialStatusFilter);
    if (initialStatusFilter !== undefined && initialStatusFilter !== statusFilter) {
      setStatusFilter(initialStatusFilter);
    } else if (initialStatusFilter === undefined && statusFilter !== 'Pendiente') {
      setStatusFilter('Pendiente'); // Vuelve al estado por defecto si el padre limpia el filtro
    }
    // Limpia los filtros de fecha cuando el filtro de estado del dashboard cambia
    setStartDate('');
    setEndDate('');
  }, [initialStatusFilter]);

  // Construye los filtros para el hook useProfesionales
  const queryFilters = useMemo(() => {
    const filters: { [key: string]: any } = {
      estado_solicitud: statusFilter === 'todos' ? '' : statusFilter,
    };
    if (startDate) {
      filters.fecha_solicitud_gte = startDate; // Asumiendo que tu hook espera esto
    }
    if (endDate) {
      filters.fecha_solicitud_lte = endDate; // Asumiendo que tu hook espera esto
    }
    console.log('RequestsPanel: Query filters for useProfesionales:', filters);
    return filters;
  }, [statusFilter, startDate, endDate]);

  const { data: profesionales = [], isLoading, refetch, error } = useProfesionales(queryFilters);

  // Filtra los profesionales para excluir "Aprobado" si el filtro general es 'todos'
  // O para mostrar solo el estado específico si statusFilter está activo
  const filteredRequests = useMemo(() => {
    if (statusFilter === 'todos') {
      return profesionales.filter(req => req.estado_solicitud !== 'Aprobado');
    }
    return profesionales; // Si hay un filtro específico, ya viene filtrado del hook
  }, [profesionales, statusFilter]);

  console.log('Total professionals from DB (filtered by hook):', profesionales.length);
  console.log('Filtered requests (non-approved, post-hook):', filteredRequests.length);
  console.log('Applied status filter:', statusFilter);

  // --- Lógica para el flujo de estado no regresivo ---
  const getAvailableStatusOptions = useCallback((currentStatus: string | undefined) => {
    const currentStatusIndex = STATUS_ORDER.indexOf(currentStatus || 'Recibido');
    const options = ['Revisando','Rechazado', 'Pendiente de Firma', 'Aprobado' ]; // Todas las opciones posibles

    // Filtra las opciones basándose en el flujo
    return options.filter(option => {
      const optionIndex = STATUS_ORDER.indexOf(option);

      // Regla 1: No regresión de 'Revisando' a 'Recibido'
      // Si el estado actual es 'Revisando', no permitir 'Recibido' (que ya no está en el select de todas formas)
      // Pero si el 'Revisando' es un estado intermedio, no debería volver atrás en general.
      if (currentStatus === 'Revisando' && option === 'Recibido') return false; // Redundante si Pendiente no está en el select

      // Regla 2: No saltar de 'Pendiente' a 'Aprobado'
      if (currentStatus === 'Recibido' && option === 'Aprobado') return false;

      // Restricción general de no ir hacia atrás, excepto si el destino es "Rechazado"
      if (optionIndex < currentStatusIndex && option !== 'Rechazado') {
        return false;
      }

      return true;
    });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Revisando':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Pendiente de Firma':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Rechazado':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Aprobado': // Aunque no se muestren aquí, es bueno tener el color
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleEditState = (requestId: string, currentState: string) => {
    setEditingStates(prev => ({
      ...prev,
      [requestId]: currentState
    }));
    setRejectionReasons(prev => { // Limpiar motivo de rechazo si se edita de nuevo
      const newReasons = { ...prev };
      delete newReasons[requestId];
      return newReasons;
    });
  };

  const handleSaveState = async (requestId: string) => {
    const newState = editingStates[requestId];
    if (!newState) return;

    const currentProfesional = profesionales.find(p => p.id === requestId);
    const currentStatus = currentProfesional?.estado_solicitud || 'Recibido';

    // Validación de flujo no regresivo (individual)
    const availableOptions = getAvailableStatusOptions(currentStatus);
    if (!availableOptions.includes(newState) && newState !== currentStatus) {
      // Manejar casos especiales donde el usuario intenta un salto no permitido
      if (currentStatus === 'Recibido' && newState === 'Aprobado') {
        toast({
          title: "Error de Flujo",
          description: "No se puede pasar de 'Recibido' a 'Aprobado' directamente. Debe pasar por 'Pendiente de Firma'.",
          variant: "destructive",
        });
        return;
      }
       if (currentStatus === 'Recibido' && newState === 'Aprobado') {
        toast({
          title: "Error de Flujo",
          description: "No se puede pasar de 'Recibido' a 'Recibido' directamente. Debe pasar por 'Pendiente de Firma'.",
          variant: "destructive",
        });
        return;
      }
      // Si hay otras reglas que no son solo de regresión, se pueden añadir aquí
    }

    if (newState === 'Rechazado' && !rejectionReasons[requestId]) {
      toast({
        title: "Motivo de Rechazo Requerido",
        description: "Debe introducir un motivo si el estado es 'Rechazado'.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Updating request state:', requestId, 'to:', newState);

      await updateProfesional.mutateAsync({
        id: requestId,
        updates: {
          estado_solicitud: newState,
          fecha_revision: (newState !== 'Recibido' && newState !== 'Revisando' && newState !== 'Rechazado') ? new Date().toISOString().split('T')[0] : null,
          fecha_aprobacion: newState === 'Aprobado' ? new Date().toISOString().split('T')[0] : null,
          revisor_solicitud: newState !== 'Recibido' ? 'Sistema' : null, // Considera usar el ID del usuario actual aquí
          motivo_rechazo: newState === 'Rechazado' ? rejectionReasons[requestId] : null, // Guarda el motivo si es rechazo
        }
      });

      // Limpiar estados de edición y motivo de rechazo
      setEditingStates(prev => {
        const newStates = { ...prev };
        delete newStates[requestId];
        return newStates;
      });
      setRejectionReasons(prev => {
        const newReasons = { ...prev };
        delete newReasons[requestId];
        return newReasons;
      });

      await refetch(); // Forzar refetch de datos para reflejar el cambio

      toast({
        title: "Estado actualizado",
        description: `El estado de la solicitud ha sido actualizado a ${newState}`,
      });

    } catch (error) {
      console.error('Error updating request state:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la solicitud",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = (requestId: string) => {
    setEditingStates(prev => {
      const newStates = { ...prev };
      delete newStates[requestId];
      return newStates;
    });
    setRejectionReasons(prev => { // Limpiar motivo de rechazo si se cancela
      const newReasons = { ...prev };
      delete newReasons[requestId];
      return newReasons;
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    // Asegurarse de que el formato sea 'YYYY-MM-DD' si viene de la DB
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A'; // Manejar fechas inválidas
    return date.toLocaleDateString('es-ES');
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: "Datos actualizados",
        description: "La lista de solicitudes se ha actualizado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron actualizar los datos",
        variant: "destructive",
      });
    }
  };

  // --- Lógica de Selección Masiva ---
  const handleCheckboxChange = (requestId: string, isChecked: boolean) => {
    setSelectedRequestIds(prev =>
      isChecked ? [...prev, requestId] : prev.filter(id => id !== requestId)
    );
  };

  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      const allIds = filteredRequests.map(req => req.id);
      setSelectedRequestIds(allIds);
    } else {
      setSelectedRequestIds([]);
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkUpdateStatus) {
      toast({
        title: "Estado Requerido",
        description: "Debe seleccionar un estado para la actualización masiva.",
        variant: "destructive",
      });
      return;
    }

    if (bulkUpdateStatus === 'Rechazado' && !bulkRejectionReason) {
      toast({
        title: "Motivo de Rechazo Requerido",
        description: "Debe introducir un motivo si el estado es 'Rechazado' en la actualización masiva.",
        variant: "destructive",
      });
      return;
    }

    if (selectedRequestIds.length === 0) {
      toast({
        title: "Sin Seleccionar",
        description: "No hay solicitudes seleccionadas para actualizar.",
        variant: "default",
      });
      return;
    }

    const updates = selectedRequestIds.map(async (id) => {
      const currentProfesional = profesionales.find(p => p.id === id);
      const currentStatus = currentProfesional?.estado_solicitud || 'Recibido';

      // Validación de flujo no regresivo (masiva)
      const availableOptions = getAvailableStatusOptions(currentStatus);
      if (!availableOptions.includes(bulkUpdateStatus) && bulkUpdateStatus !== currentStatus) {
        if (currentStatus === 'Recibido' && bulkUpdateStatus === 'Aprobado') {
          // Loggear o notificar específicamente para el usuario sobre este error de flujo
          console.warn(`Saltando actualización para ${id}: No se puede pasar de 'Recibido' a 'Aprobado'.`);
          return { id, success: false, reason: "Invalid status transition" };
        }
       if (currentStatus === 'Recibido' && bulkUpdateStatus === 'Rechazado') {
          // Loggear o notificar específicamente para el usuario sobre este error de flujo
          console.warn(`Saltando actualización para ${id}: No se puede pasar de 'Recibido' a 'Rechazado'.`);
          return { id, success: false, reason: "Invalid status transition" };
        } 
         // Puedes añadir más lógica para otros casos no permitidos
      }

      try {
        await updateProfesional.mutateAsync({
          id: id,
          updates: {
            estado_solicitud: bulkUpdateStatus,
            fecha_revision: (bulkUpdateStatus !== 'Recibido' && bulkUpdateStatus !== 'Revisando' && bulkUpdateStatus !== 'Rechazado') ? new Date().toISOString().split('T')[0] : null,
            fecha_aprobacion: bulkUpdateStatus === 'Aprobado' ? new Date().toISOString().split('T')[0] : null,
            revisor_solicitud: bulkUpdateStatus !== 'Recibido' ? 'Sistema' : null,
            motivo_rechazo: bulkUpdateStatus === 'Rechazado' ? bulkRejectionReason : null,
          }
        });
        return { id, success: true };
      } catch (error) {
        console.error(`Error updating professional ${id}:`, error);
        return { id, success: false, reason: (error as Error).message };
      }
    });

    const results = await Promise.all(updates);
    const successfulUpdates = results.filter(r => r.success).length;
    const failedUpdates = results.filter(r => !r.success).length;

    if (successfulUpdates > 0) {
      toast({
        title: "Actualización Masiva Completa",
        description: `Se actualizaron ${successfulUpdates} solicitudes. ${failedUpdates > 0 ? `(${failedUpdates} fallaron o fueron omitidas por reglas de flujo).` : ''}`,
      });
      setSelectedRequestIds([]);
      setBulkUpdateStatus('');
      setBulkRejectionReason('');
      await refetch();
    } else {
      toast({
        title: "Actualización Fallida",
        description: "Ninguna solicitud pudo ser actualizada. Revise las reglas de flujo o los errores.",
        variant: "destructive",
      });
    }
  };


  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Error al cargar solicitudes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Error: {error.message}</p>
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando solicitudes...</CardTitle>
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

  const isAllSelected = filteredRequests.length > 0 && selectedRequestIds.length === filteredRequests.length;
  const isIndeterminate = selectedRequestIds.length > 0 && selectedRequestIds.length < filteredRequests.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Gestión de Solicitudes</span>
              <Badge variant="outline" className="ml-2">
                {filteredRequests.length} solicitudes
              </Badge>
            </CardTitle>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Filtro por rango de fechas */}
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Fecha Inicio"
                  className="w-auto"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="Fecha Fin"
                  className="w-auto"
                />
              </div>

              <div className="flex items-center space-x-2">
                {/* Selector de Estado de Solicitud */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    {/* Excluimos Aprobado aquí porque este panel es para NO aprobadas,
                        y 'Pendiente' porque es el estado por defecto o no se retorna a el */}
                    <SelectItem value="Recibido">Recibido</SelectItem> {/* Mantener Pendiente aquí para poder filtrar */}
                    <SelectItem value="Revisando">Revisando</SelectItem>
                    <SelectItem value="Pendiente de Firma">Pendiente de Firma</SelectItem>
                    <SelectItem value="Rechazado">Rechazado</SelectItem>
                    {/* No ofrecemos "Aprobado" en este filtro principal, ya que el panel es para "solicitudes" */}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Barra de Acciones Masivas */}
          {selectedRequestIds.length > 0 && (
            <div className="flex items-center justify-between p-3 mb-4 bg-gray-50 border rounded-md shadow-sm">
              <span className="text-sm font-medium">
                {selectedRequestIds.length} solicitudes seleccionadas
              </span>
              <div className="flex items-center space-x-3">
                <Select value={bulkUpdateStatus} onValueChange={setBulkUpdateStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Cambiar estado a..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableStatusOptions(undefined).map(option => ( // Pasamos undefined para mostrar todas las opciones iniciales
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {bulkUpdateStatus === 'Rechazado' && (
                  <Input
                    placeholder="Motivo de rechazo masivo"
                    value={bulkRejectionReason}
                    onChange={(e) => setBulkRejectionReason(e.target.value)}
                    className="w-64"
                  />
                )}
                <Button onClick={handleBulkUpdate} disabled={updateProfesional.isLoading || !bulkUpdateStatus || (bulkUpdateStatus === 'Rechazado' && !bulkRejectionReason)}>
                  Aplicar <Save className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      indeterminate={isIndeterminate}
                    />
                  </TableHead>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>Profesión</TableHead>
                  <TableHead>Centro de Trabajo</TableHead>
                  <TableHead>Distrito Sanitario</TableHead>
                  <TableHead>Fecha Solicitud</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="text-lg font-medium">
                          {statusFilter === 'todos'
                            ? 'No hay solicitudes pendientes o activas en este momento.'
                            : `No hay solicitudes con el estado: "${statusFilter}".`
                          }
                        </p>
                        {startDate || endDate ? (
                          <p className="text-sm text-gray-400 mt-1">Ajusta tu rango de fechas o los filtros.</p>
                        ) : (
                          <p className="text-sm text-gray-400 mt-1">Revisa el filtro de estado o los rangos de fecha.</p>
                        )}
                        <Button variant="link" onClick={() => setStatusFilter('todos')} className="mt-2">
                          Mostrar todos los estados
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id} className="hover:bg-gray-50">
                      <TableCell className="w-[50px] text-center">
                        <Checkbox
                          checked={selectedRequestIds.includes(request.id)}
                          onCheckedChange={(checked) => handleCheckboxChange(request.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {request.nombre_completo || `${request.nombre || ''} ${request.apellidos || ''}`.trim()}
                      </TableCell>
                      <TableCell>{request.area_profesional || 'N/A'}</TableCell>
                      <TableCell>{request.nombre_centro || 'N/A'}</TableCell>
                      <TableCell>{request.distrito_sanitario || 'N/A'}</TableCell>
                      <TableCell>{formatDate(request.created_at || request.fecha_solicitud)}</TableCell>
                      <TableCell>
                        {editingStates[request.id] !== undefined ? (
                          <div className="flex flex-col space-y-2">
                            <Select
                              value={editingStates[request.id]}
                              onValueChange={(value) => {
                                setEditingStates(prev => ({
                                  ...prev,
                                  [request.id]: value
                                }));
                                // Limpia/establece motivo de rechazo al cambiar el estado
                                if (value !== 'Rechazado') {
                                  setRejectionReasons(prev => {
                                    const newReasons = { ...prev };
                                    delete newReasons[request.id];
                                    return newReasons;
                                  });
                                } else {
                                  // Inicializa el motivo si se cambia a Rechazado y no existe
                                  setRejectionReasons(prev => ({
                                    ...prev,
                                    [request.id]: prev[request.id] || ''
                                  }));
                                }
                              }}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {/* Opciones dinámicas según el flujo */}
                                {getAvailableStatusOptions(request.estado_solicitud).map(option => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {editingStates[request.id] === 'Rechazado' && (
                              <Textarea
                                placeholder="Motivo de rechazo..."
                                value={rejectionReasons[request.id] || ''}
                                onChange={(e) => setRejectionReasons(prev => ({
                                  ...prev,
                                  [request.id]: e.target.value
                                }))}
                                className="mt-2 resize-y"
                              />
                            )}
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSaveState(request.id)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                disabled={updateProfesional.isLoading || (editingStates[request.id] === 'Rechazado' && !rejectionReasons[request.id])}
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCancelEdit(request.id)}
                                className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Badge className={`${getStatusColor(request.estado_solicitud || 'Recibido')} border`}>
                              {request.estado_solicitud || 'Recibido'}
                            </Badge>
                            {(userRole === 'administrador' || userRole === 'comite') && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditState(request.id, request.estado_solicitud || 'Recibido')}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {onSelectProfessional && (
                            <Button variant="outline" size="sm" className="hover:bg-gray-50" onClick={() => onSelectProfessional(request)}>
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Detalles
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

export default RequestsPanel;
