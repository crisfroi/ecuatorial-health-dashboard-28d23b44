
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Eye, Edit } from 'lucide-react';
import { useProfesionales } from '@/hooks/useProfesionales';
import { useActualizarProfesional } from '@/hooks/useProfesionalesMutations';
import { useToast } from '@/hooks/use-toast';
import ProfessionalDetail from './ProfessionalDetail';

interface RequestsPanelProps {
  userRole: string;
}

const RequestsPanel = ({ userRole }: RequestsPanelProps) => {
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [editingStates, setEditingStates] = useState<Record<string, string>>({});

  const { toast } = useToast();
  const updateProfessional = useActualizarProfesional();

  // Obtener datos reales de la base de datos
  const { data: profesionales = [], isLoading, refetch } = useProfesionales({});

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Revisando':
        return 'bg-blue-100 text-blue-800';
      case 'Pendiente de Firma':
        return 'bg-orange-100 text-orange-800';
      case 'Aprobado':
        return 'bg-green-100 text-green-800';
      case 'Rechazado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = async (professionalId: string, newStatus: string) => {
    try {
      await updateProfessional.mutateAsync({
        id: professionalId,
        updates: {
          estado_solicitud: newStatus,
          fecha_revision: newStatus !== 'Pendiente' ? new Date().toISOString().split('T')[0] : null,
          fecha_aprobacion: newStatus === 'Aprobado' ? new Date().toISOString().split('T')[0] : null
        }
      });

      toast({
        title: "Estado actualizado",
        description: `El estado ha sido actualizado a ${newStatus}`,
        variant: "default",
      });

      refetch();
    } catch (error) {
      console.error('Error updating professional state:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const handleViewProfessional = (professional: any) => {
    setSelectedProfessional(professional);
  };

  const filteredRequests = statusFilter === 'todos' 
    ? profesionales 
    : profesionales.filter(req => req.estado_solicitud === statusFilter);

  if (selectedProfessional) {
    return (
      <ProfessionalDetail 
        professional={selectedProfessional}
        onClose={() => setSelectedProfessional(null)}
      />
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
            {[1, 2, 3].map((i) => (
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
            </CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Revisando">Revisando</SelectItem>
                <SelectItem value="Pendiente de Firma">Pendiente de Firma</SelectItem>
                <SelectItem value="Aprobado">Aprobado</SelectItem>
                <SelectItem value="Rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Área Profesional</TableHead>
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
                    No hay solicitudes registradas
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.nombre_completo}</TableCell>
                    <TableCell>{request.area_profesional || 'N/A'}</TableCell>
                    <TableCell>{request.lugar_trabajo || 'N/A'}</TableCell>
                    <TableCell>{request.distrito_sanitario || 'N/A'}</TableCell>
                    <TableCell>{request.fecha_solicitud ? new Date(request.fecha_solicitud).toLocaleDateString('es-ES') : 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(request.estado_solicitud || 'Pendiente')}>
                        {request.estado_solicitud || 'Pendiente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewProfessional(request)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                        {(userRole === 'administrador' || userRole === 'comite') && (
                          <Select onValueChange={(value) => handleStatusChange(request.id, value)}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Cambiar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pendiente">Pendiente</SelectItem>
                              <SelectItem value="Revisando">Revisando</SelectItem>
                              <SelectItem value="Pendiente de Firma">Pendiente Firma</SelectItem>
                              <SelectItem value="Aprobado">Aprobado</SelectItem>
                              <SelectItem value="Rechazado">Rechazado</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestsPanel;
