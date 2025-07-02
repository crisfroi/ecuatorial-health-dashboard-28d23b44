
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Eye, Edit, Save, X, RefreshCw } from 'lucide-react';
import { useProfesionales } from '@/hooks/useProfesionales';
import { useProfesionalesMutations } from '@/hooks/useProfesionalesMutations';
import { useToast } from '@/hooks/use-toast';

interface RequestsPanelProps {
  userRole: string;
}

const RequestsPanel = ({ userRole }: RequestsPanelProps) => {
  const [statusFilter, setStatusFilter] = useState('todos');
  const [editingStates, setEditingStates] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { updateProfesional } = useProfesionalesMutations();

  // Obtener solicitudes con refetch automático
  const { data: allRequests = [], isLoading, refetch, error } = useProfesionales({});

  // Forzar actualización cada vez que cambie el filtro
  useEffect(() => {
    refetch();
  }, [statusFilter, refetch]);

  // Filtrar solo las solicitudes que NO son "Aprobado"
  const filteredRequests = allRequests.filter(req => {
    const isNotApproved = req.estado_solicitud !== 'Aprobado';
    const matchesFilter = statusFilter === 'todos' || req.estado_solicitud === statusFilter;
    return isNotApproved && matchesFilter;
  });

  console.log('Total requests from DB:', allRequests.length);
  console.log('Filtered requests (non-approved):', filteredRequests.length);
  console.log('Applied status filter:', statusFilter);

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
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleEditState = (requestId: string, currentState: string) => {
    setEditingStates(prev => ({
      ...prev,
      [requestId]: currentState
    }));
  };

  const handleSaveState = async (requestId: string) => {
    const newState = editingStates[requestId];
    if (!newState) return;

    try {
      console.log('Updating request state:', requestId, 'to:', newState);
      
      await updateProfesional.mutateAsync({
        id: requestId,
        updates: {
          estado_solicitud: newState,
          fecha_revision: newState !== 'Pendiente' ? new Date().toISOString().split('T')[0] : null,
          fecha_aprobacion: newState === 'Aprobado' ? new Date().toISOString().split('T')[0] : null,
          revisor_solicitud: newState !== 'Pendiente' ? 'Sistema' : null
        }
      });

      // Limpiar estado de edición
      setEditingStates(prev => {
        const newStates = { ...prev };
        delete newStates[requestId];
        return newStates;
      });

      // Forzar refetch de datos
      await refetch();

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
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES');
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Gestión de Solicitudes</span>
              <Badge variant="outline" className="ml-2">
                {filteredRequests.length} solicitudes
              </Badge>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Revisando">Revisando</SelectItem>
                  <SelectItem value="Pendiente de Firma">Pendiente de Firma</SelectItem>
                  <SelectItem value="Rechazado">Rechazado</SelectItem>
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
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
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
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {statusFilter === 'todos' 
                        ? 'No hay solicitudes pendientes' 
                        : `No hay solicitudes con estado: ${statusFilter}`
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {request.nombre_completo || `${request.nombre || ''} ${request.apellidos || ''}`.trim()}
                      </TableCell>
                      <TableCell>{request.area_profesional || 'N/A'}</TableCell>
                      <TableCell>{request.nombre_centro || 'N/A'}</TableCell>
                      <TableCell>{request.distrito_sanitario || 'N/A'}</TableCell>
                      <TableCell>{formatDate(request.created_at || request.fecha_solicitud)}</TableCell>
                      <TableCell>
                        {editingStates[request.id] !== undefined ? (
                          <div className="flex items-center space-x-2">
                            <Select
                              value={editingStates[request.id]}
                              onValueChange={(value) => setEditingStates(prev => ({
                                ...prev,
                                [request.id]: value
                              }))}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pendiente">Pendiente</SelectItem>
                                <SelectItem value="Revisando">Revisando</SelectItem>
                                <SelectItem value="Pendiente de Firma">Pendiente de Firma</SelectItem>
                                <SelectItem value="Aprobado">Aprobado</SelectItem>
                                <SelectItem value="Rechazado">Rechazado</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSaveState(request.id)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
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
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Badge className={`${getStatusColor(request.estado_solicitud || 'Pendiente')} border`}>
                              {request.estado_solicitud || 'Pendiente'}
                            </Badge>
                            {(userRole === 'administrador' || userRole === 'comite') && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditState(request.id, request.estado_solicitud || 'Pendiente')}
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
                          <Button variant="outline" size="sm" className="hover:bg-gray-50">
                            <Eye className="w-4 h-4 mr-1" />
                            Ver Detalles
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

export default RequestsPanel;
