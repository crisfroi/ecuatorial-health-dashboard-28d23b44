
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Eye, ExternalLink } from 'lucide-react';
import { useProfesionales } from '@/hooks/useProfesionales';
import { useActualizarProfesional } from '@/hooks/useProfesionalesMutations';
import { useToast } from '@/hooks/use-toast';

interface RequestsPanelProps {
  userRole: string;
}

const RequestsPanel = ({ userRole }: RequestsPanelProps) => {
  const [statusFilter, setStatusFilter] = useState('todos');
  const { toast } = useToast();
  const updateProfessional = useActualizarProfesional();
  
  const { data: profesionales = [], isLoading, refetch } = useProfesionales({
    estado_solicitud: statusFilter === 'todos' ? undefined : statusFilter
  });

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

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      await updateProfessional.mutateAsync({
        id: requestId,
        updates: {
          estado_solicitud: newStatus,
          fecha_revision: newStatus !== 'Pendiente' ? new Date().toISOString().split('T')[0] : null,
          fecha_aprobacion: newStatus === 'Aprobado' ? new Date().toISOString().split('T')[0] : null,
          revisor_solicitud: newStatus !== 'Pendiente' ? 'Sistema' : null
        }
      });

      toast({
        title: "Estado actualizado",
        description: `El estado de la solicitud ha sido actualizado a ${newStatus}`,
        variant: "default",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la solicitud",
        variant: "destructive",
      });
    }
  };

  const handleViewPDF = (pdfUrl: string | null) => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    } else {
      toast({
        title: "PDF no disponible",
        description: "No hay archivo PDF asociado a esta solicitud",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
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
      </div>
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
              <Badge variant="secondary">{profesionales.length}</Badge>
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
                <TableHead>Urgencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profesionales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No hay solicitudes que coincidan con los filtros aplicados
                  </TableCell>
                </TableRow>
              ) : (
                profesionales.map((profesional) => (
                  <TableRow key={profesional.id}>
                    <TableCell className="font-medium">{profesional.nombre_completo}</TableCell>
                    <TableCell>{profesional.area_profesional || 'N/A'}</TableCell>
                    <TableCell>{profesional.nombre_centro || 'N/A'}</TableCell>
                    <TableCell>{profesional.distrito_sanitario || 'N/A'}</TableCell>
                    <TableCell>{formatDate(profesional.fecha_creacion_solicitud)}</TableCell>
                    <TableCell>
                      <Badge variant={profesional.urgencia_solicitud === 'Alta' ? 'destructive' : 'secondary'}>
                        {profesional.urgencia_solicitud || 'Media'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(profesional.estado_solicitud || 'Pendiente')}>
                        {profesional.estado_solicitud || 'Pendiente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewPDF(profesional.pdf_formulario)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver PDF
                        </Button>
                        {(userRole === 'administrador' || userRole === 'comite') && (
                          <Select onValueChange={(value) => handleStatusChange(profesional.id, value)}>
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
