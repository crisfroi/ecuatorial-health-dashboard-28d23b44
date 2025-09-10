import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Plus, Eye, Clock, CheckCircle, XCircle, User, Building2 } from 'lucide-react';
import { useRoleBasedData } from '@/hooks/useRoleBasedData';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRole } from '@/contexts/AuthContext';
import { useProfesionales } from '@/hooks/useProfesionales';

const IncidentManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { filterIncidentsData } = useRoleBasedData();
  const { user } = useRole();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [incidentType, setIncidentType] = useState<'hospitalaria' | 'profesional'>('hospitalaria');

  // Cargar incidencias desde Supabase
  const { data: incidenciasAll = [], isLoading } = useQuery({
    queryKey: ['incidencias_hospitalarias_all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidencias_hospitalarias')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const incidenciasHospitalarias = useMemo(() => (
    incidenciasAll.filter((i: any) => !i.id_profesional)
      .map((i: any) => ({
        id: i.id,
        titulo: i.titulo_incidencia,
        descripcion: i.descripcion,
        tipo: i.tipo_incidencia,
        gravedad: i.gravedad || 'Media',
        estado: i.estado || 'Abierta',
        fechaIncidencia: i.fecha_incidencia ? new Date(i.fecha_incidencia).toISOString().split('T')[0] : '',
        reportadoPor: i.reportado_por || '—',
      }))
  ), [incidenciasAll]);

  const incidenciasProfesionales = useMemo(() => (
    incidenciasAll.filter((i: any) => !!i.id_profesional)
      .map((i: any) => ({
        id: i.id,
        titulo: i.titulo_incidencia,
        descripcion: i.descripcion,
        tipo: i.tipo_incidencia,
        gravedad: i.gravedad || 'Media',
        estado: i.estado || 'Abierta',
        fechaIncidencia: i.fecha_incidencia ? new Date(i.fecha_incidencia).toISOString().split('T')[0] : '',
        reportadoPor: i.reportado_por || '—',
        id_profesional: i.id_profesional,
      }))
  ), [incidenciasAll]);

  // Profesionales filtrados por centro asignado (para crear incidencias de profesional)
  const { data: profesionalesCentro = [] } = useProfesionales(
    user?.assigned_center_id ? { estado_solicitud: 'Aprobado', centro_salud_id: user.assigned_center_id } as any : { estado_solicitud: 'Aprobado' }
  );

  // Aplicar filtros de rol (restricciones por centro para directivos)
  const roleFilteredIncidencias = filterIncidentsData(incidenciasHospitalarias);
  const roleFilteredIncidenciasProfesionales = filterIncidentsData(incidenciasProfesionales);

  const [newIncident, setNewIncident] = useState<{ titulo: string; descripcion: string; tipo: string; gravedad: string; id_profesional?: string | null }>({
    titulo: '',
    descripcion: '',
    tipo: '',
    gravedad: 'Media',
    id_profesional: null
  });

  const tipos = ['Suministros', 'Equipamiento', 'Personal', 'Seguridad', 'Infraestructura', 'Otro'];
  const tiposProfesionales = ['Documentación', 'Cumplimiento', 'Ética Profesional', 'Capacitación', 'Desempeño', 'Otro'];
  const gravedades = ['Baja', 'Media', 'Alta', 'Crítica'];

  const getGravityColor = (gravedad: string) => {
    switch (gravedad) {
      case 'Crítica':
        return 'bg-red-100 text-red-800';
      case 'Alta':
        return 'bg-orange-100 text-orange-800';
      case 'Media':
        return 'bg-yellow-100 text-yellow-800';
      case 'Baja':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Abierta':
        return 'bg-red-100 text-red-800';
      case 'En Progreso':
        return 'bg-blue-100 text-blue-800';
      case 'Resuelta':
        return 'bg-green-100 text-green-800';
      case 'Cerrada':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'Abierta':
        return <XCircle className="w-4 h-4" />;
      case 'En Progreso':
        return <Clock className="w-4 h-4" />;
      case 'Resuelta':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  // Crear incidencia
  const createIncident = useMutation({
    mutationFn: async () => {
      const payload: any = {
        titulo_incidencia: newIncident.titulo,
        descripcion: newIncident.descripcion,
        tipo_incidencia: newIncident.tipo,
        gravedad: newIncident.gravedad,
        estado: 'Abierta',
        fecha_incidencia: new Date().toISOString(),
        reportado_por: user?.full_name || 'Usuario Actual'
      };
      if (incidentType === 'profesional' && newIncident.id_profesional) {
        payload.id_profesional = newIncident.id_profesional;
      }
      const { error } = await supabase.from('incidencias_hospitalarias').insert([payload]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidencias_hospitalarias_all'] });
      setIsAddDialogOpen(false);
      setNewIncident({ titulo: '', descripcion: '', tipo: '', gravedad: 'Media', id_profesional: null });
      toast({ title: 'Incidencia creada', description: 'La incidencia ha sido registrada exitosamente' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleAddIncident = () => {
    if (!newIncident.titulo || !newIncident.descripcion || !newIncident.tipo) {
      toast({ title: 'Error', description: 'Todos los campos obligatorios deben ser completados', variant: 'destructive' });
      return;
    }
    if (incidentType === 'profesional' && !newIncident.id_profesional) {
      toast({ title: 'Selecciona un profesional', description: 'Debes seleccionar el profesional afectado', variant: 'destructive' });
      return;
    }
    createIncident.mutate();
  };

  // Actualizar estado
  const updateStatus = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const updates: any = { estado: newStatus };
      if (newStatus === 'Resuelta') {
        updates.fecha_resolucion = new Date().toISOString();
        updates.resuelto_por = user?.full_name || 'Usuario Actual';
      }
      const { error } = await supabase
        .from('incidencias_hospitalarias')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidencias_hospitalarias_all'] });
      toast({ title: 'Estado actualizado', description: 'La incidencia ha sido actualizada' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const renderStatsCards = (incidentData: any[], title: string) => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-red-100">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Total {title}</h3>
              <p className="text-2xl font-bold text-red-600">{incidentData.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <XCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Abiertas</h3>
              <p className="text-2xl font-bold text-orange-600">
                {incidentData.filter(i => i.estado === 'Abierta').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">En Progreso</h3>
              <p className="text-2xl font-bold text-blue-600">
                {incidentData.filter(i => i.estado === 'En Progreso').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-green-100">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Resueltas</h3>
              <p className="text-2xl font-bold text-green-600">
                {incidentData.filter(i => i.estado === 'Resuelta').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderIncidentTable = (incidentData: any[], type: 'hospitalaria' | 'profesional') => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {type === 'hospitalaria' ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
          <span>Lista de Incidencias {type === 'hospitalaria' ? 'Hospitalarias' : 'de Profesionales'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Gravedad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>{type === 'hospitalaria' ? 'Centro / Reportado por' : 'Profesional (ID)'}</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidentData.map((incident) => (
              <TableRow key={incident.id}>
                <TableCell className="font-medium">{incident.titulo}</TableCell>
                <TableCell>
                  <Badge variant="outline">{incident.tipo}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getGravityColor(incident.gravedad)}>
                    {incident.gravedad}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(incident.estado)}
                    <Badge className={getStatusColor(incident.estado)}>
                      {incident.estado}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  {type === 'hospitalaria' ? (incident.reportadoPor || '—') : (incident.id_profesional || '—')}
                </TableCell>
                <TableCell>{incident.fechaIncidencia}</TableCell>
                <TableCell className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedIncident(incident);
                      setIsViewDialogOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => updateStatus.mutate({ id: incident.id, newStatus: 'En Progreso' })}>Progreso</Button>
                  <Button variant="outline" size="sm" onClick={() => updateStatus.mutate({ id: incident.id, newStatus: 'Resuelta' })}>Resolver</Button>
                  <Button variant="outline" size="sm" onClick={() => updateStatus.mutate({ id: incident.id, newStatus: 'Cerrada' })}>Cerrar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Incidencias</h2>
          <p className="text-gray-600 mt-1">Gestión de incidencias hospitalarias y de profesionales</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-guinea-teal hover:bg-guinea-dark-teal">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Incidencia
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Reportar Nueva Incidencia</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tipo de incidencia</label>
                <Select value={incidentType} onValueChange={(value: 'hospitalaria' | 'profesional') => setIncidentType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hospitalaria">Incidencia Hospitalaria</SelectItem>
                    <SelectItem value="profesional">Incidencia de Profesional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Título de la incidencia *</label>
                <Input
                  placeholder="Descripción breve del problema"
                  value={newIncident.titulo}
                  onChange={(e) => setNewIncident({...newIncident, titulo: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Descripción detallada *</label>
                <Textarea
                  placeholder="Describe detalladamente la incidencia"
                  value={newIncident.descripcion}
                  onChange={(e) => setNewIncident({...newIncident, descripcion: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tipo *</label>
                  <Select value={newIncident.tipo} onValueChange={(value) => setNewIncident({...newIncident, tipo: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {(incidentType === 'hospitalaria' ? tipos : tiposProfesionales).map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Gravedad</label>
                  <Select value={newIncident.gravedad} onValueChange={(value) => setNewIncident({...newIncident, gravedad: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {gravedades.map((gravedad) => (
                        <SelectItem key={gravedad} value={gravedad}>{gravedad}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {incidentType === 'profesional' && (
                <div>
                  <label className="text-sm font-medium">Profesional afectado *</label>
                  <Select value={newIncident.id_profesional || ''} onValueChange={(value) => setNewIncident({ ...newIncident, id_profesional: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={user?.assigned_center_id ? 'Seleccione profesional del centro asignado' : 'Seleccione profesional'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {profesionalesCentro.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.nombre_completo} • {p.area_profesional || '—'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddIncident} disabled={createIncident.isLoading}>
                  {createIncident.isLoading ? 'Creando...' : 'Reportar Incidencia'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pestañas para tipos de incidencias */}
      <Tabs defaultValue="hospitalaria" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="hospitalaria" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Incidencias Hospitalarias
          </TabsTrigger>
          <TabsTrigger value="profesional" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Incidencias de Profesionales
          </TabsTrigger>
        </TabsList>

        {/* CONTENIDO DE INCIDENCIAS HOSPITALARIAS */}
        <TabsContent value="hospitalaria" className="space-y-6">
          {renderStatsCards(roleFilteredIncidencias, 'Hospitalarias')}
          {renderIncidentTable(roleFilteredIncidencias, 'hospitalaria')}
        </TabsContent>

        {/* CONTENIDO DE INCIDENCIAS DE PROFESIONALES */}
        <TabsContent value="profesional" className="space-y-6">
          {renderStatsCards(roleFilteredIncidenciasProfesionales, 'de Profesionales')}
          {renderIncidentTable(roleFilteredIncidenciasProfesionales, 'profesional')}
        </TabsContent>
      </Tabs>

      {/* Modal para ver detalles */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalles de la Incidencia</DialogTitle>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título:</label>
                <p className="text-sm font-semibold mt-1">{selectedIncident.titulo}</p>
              </div>
              <div className="flex space-x-2">
                <Badge className={getGravityColor(selectedIncident.gravedad)}>
                  {selectedIncident.gravedad}
                </Badge>
                <Badge className={getStatusColor(selectedIncident.estado)}>
                  {selectedIncident.estado}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium">Descripción:</label>
                <p className="text-sm text-gray-600 mt-1">{selectedIncident.descripcion}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tipo:</label>
                  <p className="text-sm">{selectedIncident.tipo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Reportado por:</label>
                  <p className="text-sm">{selectedIncident.reportadoPor}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Fecha:</label>
                  <p className="text-sm">{selectedIncident.fechaIncidencia}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Estado:</label>
                  <p className="text-sm">{selectedIncident.estado}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IncidentManagement;
