
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Eye, Edit } from 'lucide-react';

interface RequestsPanelProps {
  userRole: string;
}

const RequestsPanel = ({ userRole }: RequestsPanelProps) => {
  const [statusFilter, setStatusFilter] = useState('todos');

  const requests = [
    {
      id: 1,
      nombreCompleto: 'Dr. María José Nsue Ela',
      profesion: 'Médico General',
      centroTrabajo: 'Hospital Regional de Malabo',
      distritoSanitario: 'Distrito 1 - Malabo',
      fechaSolicitud: '2024-01-15',
      estado: 'Recibido',
      pdfUrl: '/docs/solicitud-001.pdf'
    },
    {
      id: 2,
      nombreCompleto: 'Enfermera Carmen Obiang Nguema',
      profesion: 'Enfermería',
      centroTrabajo: 'Centro de Salud de Bata',
      distritoSanitario: 'Distrito 2 - Bata',
      fechaSolicitud: '2024-01-12',
      estado: 'Revisando',
      pdfUrl: '/docs/solicitud-002.pdf'
    },
    {
      id: 3,
      nombreCompleto: 'Farm. José Antonio Mba',
      profesion: 'Farmacia',
      centroTrabajo: 'Farmacia Central',
      distritoSanitario: 'Distrito 1 - Malabo',
      fechaSolicitud: '2024-01-10',
      estado: 'Pendiente de firma',
      pdfUrl: '/docs/solicitud-003.pdf'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Recibido':
        return 'bg-blue-100 text-blue-800';
      case 'Revisando':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pendiente de firma':
        return 'bg-orange-100 text-orange-800';
      case 'Aprobado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = (requestId: number, newStatus: string) => {
    console.log(`Cambiando estado de solicitud ${requestId} a ${newStatus}`);
    // Aquí se actualizaría el estado en Airtable
  };

  const filteredRequests = statusFilter === 'todos' 
    ? requests 
    : requests.filter(req => req.estado === statusFilter);

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
                <SelectItem value="Recibido">Recibido</SelectItem>
                <SelectItem value="Revisando">Revisando</SelectItem>
                <SelectItem value="Pendiente de firma">Pendiente de firma</SelectItem>
                <SelectItem value="Aprobado">Aprobado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
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
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.nombreCompleto}</TableCell>
                  <TableCell>{request.profesion}</TableCell>
                  <TableCell>{request.centroTrabajo}</TableCell>
                  <TableCell>{request.distritoSanitario}</TableCell>
                  <TableCell>{request.fechaSolicitud}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(request.estado)}>
                      {request.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        Ver PDF
                      </Button>
                      {(userRole === 'administrador' || userRole === 'comite') && (
                        <Select onValueChange={(value) => handleStatusChange(request.id, value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Cambiar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Recibido">Recibido</SelectItem>
                            <SelectItem value="Revisando">Revisando</SelectItem>
                            <SelectItem value="Pendiente de firma">Pendiente firma</SelectItem>
                            <SelectItem value="Aprobado">Aprobado</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestsPanel;
