
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle, XCircle, Clock, Eye, FileText, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useProfesionales, useProfesionalesMutations } from '@/hooks/useProfesionales';

interface RequestsPanelProps {
  userRole?: string;
}

const RequestsPanel = ({ userRole = 'SUPER_ADMINISTRADOR' }: RequestsPanelProps) => {
  const { data: profesionales = [], isLoading, refetch } = useProfesionales();
  const { actualizarProfesionalMutation } = useProfesionalesMutations();
  
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkObservations, setBulkObservations] = useState('');
  const [filters, setFilters] = useState({
    estado: '',
    area: '',
    provincia: ''
  });

  // Filtrar profesionales según criterios
  const filteredProfesionales = profesionales.filter((prof: any) => {
    const matchesState = !filters.estado || prof.estado_solicitud === filters.estado;
    const matchesArea = !filters.area || prof.area_profesional === filters.area;
    const matchesProvince = !filters.provincia || prof.provincia === filters.provincia;
    
    return matchesState && matchesArea && matchesProvince;
  });

  const pendingRequests = filteredProfesionales.filter((prof: any) => 
    prof.estado_solicitud === 'pendiente'
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(pendingRequests.map((req: any) => req.id));
    } else {
      setSelectedRequests([]);
    }
  };

  const handleSelectRequest = (requestId: string, checked: boolean) => {
    if (checked) {
      setSelectedRequests(prev => [...prev, requestId]);
    } else {
      setSelectedRequests(prev => prev.filter(id => id !== requestId));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedRequests.length === 0) {
      toast.error('Seleccione una acción y al menos una solicitud');
      return;
    }

    try {
      for (const requestId of selectedRequests) {
        const profesional = profesionales.find((p: any) => p.id === requestId);
        if (profesional) {
          await actualizarProfesionalMutation.mutateAsync({
            id: requestId,
            estado_solicitud: bulkAction,
            observaciones: bulkObservations || profesional.observaciones
          });
        }
      }
      
      toast.success(`${selectedRequests.length} solicitudes procesadas`);
      setSelectedRequests([]);
      setBulkAction('');
      setBulkObservations('');
      refetch();
    } catch (error) {
      toast.error('Error procesando solicitudes');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'aprobada': 'bg-green-100 text-green-800',
      'rechazada': 'bg-red-100 text-red-800',
      'en_revision': 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprobada':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rechazada':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'en_revision':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Panel de Solicitudes</h2>
          <p className="text-gray-600">
            {pendingRequests.length} solicitudes pendientes de revisión
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Select value={filters.estado} onValueChange={(value) => setFilters({...filters, estado: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_revision">En Revisión</SelectItem>
                <SelectItem value="aprobada">Aprobada</SelectItem>
                <SelectItem value="rechazada">Rechazada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.area} onValueChange={(value) => setFilters({...filters, area: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Área Profesional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las áreas</SelectItem>
                <SelectItem value="Medicina General">Medicina General</SelectItem>
                <SelectItem value="Enfermería">Enfermería</SelectItem>
                <SelectItem value="Especialidades">Especialidades</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.provincia} onValueChange={(value) => setFilters({...filters, provincia: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Provincia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las provincias</SelectItem>
                <SelectItem value="Bioko Norte">Bioko Norte</SelectItem>
                <SelectItem value="Bioko Sur">Bioko Sur</SelectItem>
                <SelectItem value="Centro Sur">Centro Sur</SelectItem>
                <SelectItem value="Kié-Ntem">Kié-Ntem</SelectItem>
                <SelectItem value="Litoral">Litoral</SelectItem>
                <SelectItem value="Wele-Nzas">Wele-Nzas</SelectItem>
                <SelectItem value="Djibloho">Djibloho</SelectItem>
                <SelectItem value="Annobón">Annobón</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Acciones Masivas ({selectedRequests.length} seleccionadas)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Seleccionar acción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aprobada">Aprobar</SelectItem>
                    <SelectItem value="rechazada">Rechazar</SelectItem>
                    <SelectItem value="en_revision">Poner en Revisión</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  onClick={handleBulkAction}
                  disabled={actualizarProfesionalMutation.isPending}
                  className="flex-shrink-0"
                >
                  {actualizarProfesionalMutation.isPending ? 'Procesando...' : 'Aplicar'}
                </Button>
              </div>
              
              <Textarea
                placeholder="Observaciones (opcional)"
                value={bulkObservations}
                onChange={(e) => setBulkObservations(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">
                    <Checkbox
                      checked={selectedRequests.length === pendingRequests.length && pendingRequests.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="text-left p-3">Profesional</th>
                  <th className="text-left p-3">Área</th>
                  <th className="text-left p-3">Centro</th>
                  <th className="text-left p-3">Estado</th>
                  <th className="text-left p-3">Fecha</th>
                  <th className="text-left p-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfesionales.map((profesional: any) => (
                  <tr key={profesional.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <Checkbox
                        checked={selectedRequests.includes(profesional.id)}
                        onCheckedChange={(checked) => handleSelectRequest(profesional.id, checked as boolean)}
                      />
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{profesional.nombre} {profesional.apellidos}</div>
                        <div className="text-sm text-gray-500">{profesional.documento_identidad}</div>
                      </div>
                    </td>
                    <td className="p-3">{profesional.area_profesional}</td>
                    <td className="p-3">{profesional.nombre_centro || 'No asignado'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(profesional.estado_solicitud)}
                        <Badge className={getStatusBadge(profesional.estado_solicitud)}>
                          {profesional.estado_solicitud}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-3">
                      {new Date(profesional.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Detalles del Profesional</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                              <div>
                                <h4 className="font-medium">Información Personal</h4>
                                <p><strong>Nombre:</strong> {profesional.nombre} {profesional.apellidos}</p>
                                <p><strong>Email:</strong> {profesional.email}</p>
                                <p><strong>Teléfono:</strong> {profesional.telefono}</p>
                                <p><strong>Nacionalidad:</strong> {profesional.nacionalidad}</p>
                              </div>
                              <div>
                                <h4 className="font-medium">Información Profesional</h4>
                                <p><strong>Área:</strong> {profesional.area_profesional}</p>
                                <p><strong>Titulación:</strong> {profesional.titulacion}</p>
                                <p><strong>Universidad:</strong> {profesional.universidad}</p>
                                <p><strong>Año de Graduación:</strong> {profesional.año_graduacion}</p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredProfesionales.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron solicitudes con los filtros seleccionados.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestsPanel;
