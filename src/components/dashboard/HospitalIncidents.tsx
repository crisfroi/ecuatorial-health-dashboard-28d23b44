
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Plus, Eye, Clock, CheckCircle, XCircle, Hospital, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Incident {
  id: string;
  hospitalName: string;
  professionalName: string;
  professionalId: string;
  incidentType: string;
  severity: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  description: string;
  reportedBy: string;
  reportDate: Date;
  status: 'Pendiente' | 'En Revisión' | 'Resuelta' | 'Escalada';
  actions: string;
}

const HospitalIncidents = () => {
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: '1',
      hospitalName: 'Hospital Nacional de Malabo',
      professionalName: 'Dr. María González',
      professionalId: 'GE-MED-2024-001',
      incidentType: 'Incumplimiento de protocolo',
      severity: 'Media',
      description: 'No siguió el protocolo de desinfección en sala de operaciones',
      reportedBy: 'Jefe de Enfermería',
      reportDate: new Date('2024-01-15'),
      status: 'En Revisión',
      actions: 'Reunión programada con el profesional'
    },
    {
      id: '2',
      hospitalName: 'Centro de Salud de Bata',
      professionalName: 'Enf. Carlos Mbomio',
      professionalId: 'GE-ENF-2024-045',
      incidentType: 'Ausencia no justificada',
      severity: 'Alta',
      description: 'Ausencia de 3 días sin notificación previa',
      reportedBy: 'Director del Centro',
      reportDate: new Date('2024-01-20'),
      status: 'Pendiente',
      actions: 'Pendiente de contacto'
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    hospitalName: '',
    professionalName: '',
    professionalId: '',
    incidentType: '',
    severity: '',
    description: '',
    reportedBy: '',
    actions: ''
  });

  const hospitals = [
    'Hospital Nacional de Malabo',
    'Hospital Regional de Bata',
    'Centro de Salud de Ebebiyín',
    'Hospital de Mongomo',
    'Centro Médico de Evinayong',
    'Clínica San Carlos',
    'Hospital La Paz'
  ];

  const incidentTypes = [
    'Incumplimiento de protocolo',
    'Ausencia no justificada',
    'Negligencia profesional',
    'Conflicto con pacientes',
    'Uso inadecuado de recursos',
    'Violación de confidencialidad',
    'Otros'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newIncident: Incident = {
      id: (Date.now()).toString(),
      hospitalName: formData.hospitalName,
      professionalName: formData.professionalName,
      professionalId: formData.professionalId,
      incidentType: formData.incidentType,
      severity: formData.severity as any,
      description: formData.description,
      reportedBy: formData.reportedBy,
      reportDate: new Date(),
      status: 'Pendiente',
      actions: formData.actions
    };

    setIncidents(prev => [newIncident, ...prev]);
    setIsDialogOpen(false);
    setFormData({
      hospitalName: '',
      professionalName: '',
      professionalId: '',
      incidentType: '',
      severity: '',
      description: '',
      reportedBy: '',
      actions: ''
    });

    toast({
      title: "Incidencia registrada",
      description: "La incidencia ha sido registrada correctamente y será revisada por el comité.",
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Baja': return 'bg-green-100 text-green-800';
      case 'Media': return 'bg-yellow-100 text-yellow-800';
      case 'Alta': return 'bg-orange-100 text-orange-800';
      case 'Crítica': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendiente': return 'bg-gray-100 text-gray-800';
      case 'En Revisión': return 'bg-blue-100 text-blue-800';
      case 'Resuelta': return 'bg-green-100 text-green-800';
      case 'Escalada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pendiente': return <Clock className="w-4 h-4" />;
      case 'En Revisión': return <Eye className="w-4 h-4" />;
      case 'Resuelta': return <CheckCircle className="w-4 h-4" />;
      case 'Escalada': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-500 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Portal de Incidencias</h2>
            <p className="text-gray-600">Registro y seguimiento de incidencias hospitalarias</p>
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-guinea-teal hover:bg-guinea-dark-teal">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Incidencia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Nueva Incidencia</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Hospital/Centro</label>
                  <Select value={formData.hospitalName} onValueChange={(value) => setFormData({...formData, hospitalName: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar hospital" />
                    </SelectTrigger>
                    <SelectContent>
                      {hospitals.map((hospital) => (
                        <SelectItem key={hospital} value={hospital}>{hospital}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo de Incidencia</label>
                  <Select value={formData.incidentType} onValueChange={(value) => setFormData({...formData, incidentType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {incidentTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre del Profesional</label>
                  <Input
                    value={formData.professionalName}
                    onChange={(e) => setFormData({...formData, professionalName: e.target.value})}
                    placeholder="Nombre completo"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">ID Profesional</label>
                  <Input
                    value={formData.professionalId}
                    onChange={(e) => setFormData({...formData, professionalId: e.target.value})}
                    placeholder="GE-XXX-XXXX-XXX"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Severidad</label>
                  <Select value={formData.severity} onValueChange={(value) => setFormData({...formData, severity: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Nivel de severidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baja">Baja</SelectItem>
                      <SelectItem value="Media">Media</SelectItem>
                      <SelectItem value="Alta">Alta</SelectItem>
                      <SelectItem value="Crítica">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Reportado por</label>
                  <Input
                    value={formData.reportedBy}
                    onChange={(e) => setFormData({...formData, reportedBy: e.target.value})}
                    placeholder="Nombre del reportante"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descripción de la Incidencia</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe detalladamente la incidencia..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Acciones Inmediatas Tomadas</label>
                <Textarea
                  value={formData.actions}
                  onChange={(e) => setFormData({...formData, actions: e.target.value})}
                  placeholder="Describe las acciones tomadas hasta el momento..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-guinea-teal hover:bg-guinea-dark-teal">
                  Registrar Incidencia
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gray-100 rounded">
                <FileText className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{incidents.length}</p>
                <p className="text-sm text-gray-600">Total Incidencias</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-100 rounded">
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{incidents.filter(i => i.status === 'Pendiente').length}</p>
                <p className="text-sm text-gray-600">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded">
                <Eye className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{incidents.filter(i => i.status === 'En Revisión').length}</p>
                <p className="text-sm text-gray-600">En Revisión</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded">
                <CheckCircle className="w-4 h-4 text-green-600"  />
              </div>
              <div>
                <p className="text-2xl font-bold">{incidents.filter(i => i.status === 'Resuelta').length}</p>
                <p className="text-sm text-gray-600">Resueltas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Hospital className="w-5 h-5 text-guinea-teal" />
            <span>Registro de Incidencias</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hospital</TableHead>
                <TableHead>Profesional</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Severidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell className="font-medium">{incident.hospitalName}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{incident.professionalName}</p>
                      <p className="text-sm text-gray-500">{incident.professionalId}</p>
                    </div>
                  </TableCell>
                  <TableCell>{incident.incidentType}</TableCell>
                  <TableCell>
                    <Badge className={getSeverityColor(incident.severity)}>
                      {incident.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(incident.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(incident.status)}
                        <span>{incident.status}</span>
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>{incident.reportDate.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
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
    </div>
  );
};

export default HospitalIncidents;
