import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Plus, Edit, Eye, Clock, CheckCircle, XCircle, User, Building2 } from 'lucide-react';
import { useRoleBasedData } from '@/hooks/useRoleBasedData';
import { useToast } from '@/hooks/use-toast';

const IncidentManagement = () => {
  const { toast } = useToast();
  const { filterIncidentsData } = useRoleBasedData();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [incidentType, setIncidentType] = useState<'hospitalaria' | 'profesional'>('hospitalaria');

  // Datos simulados de incidencias hospitalarias
  const [incidencias, setIncidencias] = useState([
    {
      id: 1,
      titulo: 'Falta de suministros médicos',
      descripcion: 'Escasez crítica de medicamentos esenciales en farmacia',
      tipo: 'Suministros',
      gravedad: 'Alta',
      estado: 'Abierta',
      fechaIncidencia: '2024-01-20',
      reportadoPor: 'Dr. Carlos Obiang',
      centroAfectado: 'Hospital Regional Malabo',
      provincia: 'Bioko Norte'
    },
    {
      id: 2,
      titulo: 'Equipo médico averiado',
      descripcion: 'Máquina de rayos X fuera de servicio desde hace 3 días',
      tipo: 'Equipamiento',
      gravedad: 'Media',
      estado: 'En Progreso',
      fechaIncidencia: '2024-01-18',
      reportadoPor: 'Dra. María Nsue',
      centroAfectado: 'Centro de Salud Bata',
      provincia: 'Litoral'
    },
    {
      id: 3,
      titulo: 'Incidente de seguridad',
      descripcion: 'Robo de medicamentos en área de farmacia durante la noche',
      tipo: 'Seguridad',
      gravedad: 'Alta',
      estado: 'Resuelta',
      fechaIncidencia: '2024-01-15',
      fechaResolucion: '2024-01-22',
      reportadoPor: 'Farm. Ana Nguema',
      resuelto: 'Admin. Pedro Nsue',
      centroAfectado: 'Farmacia Central',
      provincia: 'Bioko Norte'
    }
  ]);

  // Datos de incidencias de profesionales
  const [incidenciasProfesionales, setIncidenciasProfesionales] = useState([
    {
      id: 1,
      titulo: 'Solicitud de carnet vencida',
      descripcion: 'Profesional con carnet vencido desde hace 3 meses sin renovar',
      tipo: 'Documentación',
      gravedad: 'Media',
      estado: 'Abierta',
      fechaIncidencia: '2024-01-25',
      reportadoPor: 'Sistema Automático',
      profesionalAfectado: 'Dr. Juan Mba Ela',
      areaProfesional: 'Medicina General',
      centroTrabajo: 'Hospital Regional Malabo',
      provincia: 'Bioko Norte'
    },
    {
      id: 2,
      titulo: 'Documentación incompleta',
      descripcion: 'Faltan documentos de titulación académica en el expediente',
      tipo: 'Documentación',
      gravedad: 'Alta',
      estado: 'En Progreso',
      fechaIncidencia: '2024-01-22',
      reportadoPor: 'Comité Evaluador',
      profesionalAfectado: 'Enfermera Rosa Nsue',
      areaProfesional: 'Enfermería',
      centroTrabajo: 'Centro de Salud Bata',
      provincia: 'Litoral'
    },
    {
      id: 3,
      titulo: 'Cambio no autorizado de centro',
      descripcion: 'Profesional trabajando en centro diferente al registrado',
      tipo: 'Cumplimiento',
      gravedad: 'Media',
      estado: 'Resuelta',
      fechaIncidencia: '2024-01-20',
      fechaResolucion: '2024-01-24',
      reportadoPor: 'Director Centro',
      resuelto: 'Coord. Recursos Humanos',
      profesionalAfectado: 'Dr. Carlos Nguema',
      areaProfesional: 'Pediatría',
      centroTrabajo: 'Hospital Infantil',
      provincia: 'Bioko Norte'
    },
    {
      id: 4,
      titulo: 'Actividad profesional no autorizada',
      descripcion: 'Ejercicio de medicina privada sin autorización ministerial',
      tipo: 'Cumplimiento',
      gravedad: 'Alta',
      estado: 'En Progreso',
      fechaIncidencia: '2024-01-18',
      reportadoPor: 'Inspector Sanitario',
      profesionalAfectado: 'Dra. Elena Obiang',
      areaProfesional: 'Ginecología',
      centroTrabajo: 'Clínica Privada El Sol',
      provincia: 'Litoral'
    }
  ]);

  // Aplicar filtros de rol (restricciones por centro para directivos)
  const roleFilteredIncidencias = filterIncidentsData(incidencias);
  const roleFilteredIncidenciasProfesionales = filterIncidentsData(incidenciasProfesionales);

  const [newIncident, setNewIncident] = useState({
    titulo: '',
    descripcion: '',
    tipo: '',
    gravedad: 'Media',
    centroAfectado: '',
    provincia: '',
    profesionalAfectado: '',
    areaProfesional: '',
    centroTrabajo: ''
  });

  const tipos = ['Suministros', 'Equipamiento', 'Personal', 'Seguridad', 'Infraestructura', 'Otro'];
  const tiposProfesionales = ['Documentación', 'Cumplimiento', 'Ética Profesional', 'Capacitación', 'Desempeño', 'Otro'];
  const gravedades = ['Baja', 'Media', 'Alta', 'Crítica'];
  const estados = ['Abierta', 'En Progreso', 'Resuelta', 'Cerrada'];

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

  const handleAddIncident = () => {
    if (!newIncident.titulo || !newIncident.descripcion || !newIncident.tipo) {
      toast({
        title: "Error",
        description: "Todos los campos obligatorios deben ser completados",
        variant: "destructive",
      });
      return;
    }

    const newIncidentData = {
      id: incidentType === 'hospitalaria' ? incidencias.length + 1 : incidenciasProfesionales.length + 1,
      ...newIncident,
      estado: 'Abierta',
      fechaIncidencia: new Date().toISOString().split('T')[0],
      reportadoPor: 'Usuario Actual'
    };

    if (incidentType === 'hospitalaria') {
      setIncidencias([...incidencias, newIncidentData]);
    } else {
      setIncidenciasProfesionales([...incidenciasProfesionales, newIncidentData]);
    }

    setNewIncident({
      titulo: '',
      descripcion: '',
      tipo: '',
      gravedad: 'Media',
      centroAfectado: '',
      provincia: '',
      profesionalAfectado: '',
      areaProfesional: '',
      centroTrabajo: ''
    });
    setIsAddDialogOpen(false);

    toast({
      title: "Incidencia creada",
      description: "La nueva incidencia ha sido registrada exitosamente",
    });
  };

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
              <TableHead>{type === 'hospitalaria' ? 'Centro Afectado' : 'Profesional'}</TableHead>
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
                  {type === 'hospitalaria' ? incident.centroAfectado : incident.profesionalAfectado}
                </TableCell>
                <TableCell>{incident.fechaIncidencia}</TableCell>
                <TableCell>
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

              {incidentType === 'hospitalaria' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Centro afectado</label>
                    <Input
                      placeholder="Nombre del centro"
                      value={newIncident.centroAfectado}
                      onChange={(e) => setNewIncident({...newIncident, centroAfectado: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Provincia</label>
                    <Input
                      placeholder="Provincia"
                      value={newIncident.provincia}
                      onChange={(e) => setNewIncident({...newIncident, provincia: e.target.value})}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Profesional afectado</label>
                    <Input
                      placeholder="Nombre del profesional"
                      value={newIncident.profesionalAfectado}
                      onChange={(e) => setNewIncident({...newIncident, profesionalAfectado: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Área profesional</label>
                      <Input
                        placeholder="Área de trabajo"
                        value={newIncident.areaProfesional}
                        onChange={(e) => setNewIncident({...newIncident, areaProfesional: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Centro de trabajo</label>
                      <Input
                        placeholder="Centro actual"
                        value={newIncident.centroTrabajo}
                        onChange={(e) => setNewIncident({...newIncident, centroTrabajo: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddIncident}>
                  Reportar Incidencia
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
          {renderStatsCards(incidencias, 'Hospitalarias')}
          {renderIncidentTable(incidencias, 'hospitalaria')}
        </TabsContent>

        {/* CONTENIDO DE INCIDENCIAS DE PROFESIONALES */}
        <TabsContent value="profesional" className="space-y-6">
          {renderStatsCards(incidenciasProfesionales, 'de Profesionales')}
          {renderIncidentTable(incidenciasProfesionales, 'profesional')}
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
                  <label className="text-sm font-medium">
                    {selectedIncident.centroAfectado ? 'Centro:' : 'Profesional:'}
                  </label>
                  <p className="text-sm">
                    {selectedIncident.centroAfectado || selectedIncident.profesionalAfectado}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Reportado por:</label>
                  <p className="text-sm">{selectedIncident.reportadoPor}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Fecha:</label>
                  <p className="text-sm">{selectedIncident.fechaIncidencia}</p>
                </div>
              </div>
              {selectedIncident.estado === 'Resuelta' && selectedIncident.fechaResolucion && (
                <div className="border-t pt-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Resuelto:</label>
                      <p className="text-sm">{selectedIncident.fechaResolucion} por {selectedIncident.resuelto}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IncidentManagement;
