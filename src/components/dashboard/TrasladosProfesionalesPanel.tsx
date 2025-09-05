import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Users, 
  ArrowRight,
  Building,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Plus
} from 'lucide-react';
import { UserRole } from '@/types/roles';

interface TrasladosProfesionalesPanelProps {
  userRole: UserRole;
  centroAsignado?: string;
}

interface SolicitudTraslado {
  id: string;
  profesionalId: string;
  nombreProfesional: string;
  areaProfesional: string;
  centroOrigen: string;
  centroDestino: string;
  motivo: string;
  observaciones?: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  fechaSolicitud: string;
  fechaRespuesta?: string;
  solicitantePor: string;
}

const TrasladosProfesionalesPanel: React.FC<TrasladosProfesionalesPanelProps> = ({ 
  userRole, 
  centroAsignado 
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProfesionals, setSelectedProfesionals] = useState<string[]>([]);
  const [newTraslado, setNewTraslado] = useState({
    profesionalIds: [] as string[],
    centroDestino: '',
    motivo: '',
    observaciones: ''
  });

  // Mock data para demostración
  const solicitudesTraslado: SolicitudTraslado[] = [
    {
      id: '1',
      profesionalId: 'prof-1',
      nombreProfesional: 'Dr. Juan Pérez',
      areaProfesional: 'Medicina General',
      centroOrigen: 'Centro Malabo',
      centroDestino: 'Hospital Nacional',
      motivo: 'Necesidad de especialización',
      estado: 'pendiente',
      fechaSolicitud: '2024-01-15',
      solicitantePor: 'Admin Centro Malabo'
    },
    {
      id: '2',
      profesionalId: 'prof-2',
      nombreProfesional: 'Dra. María García',
      areaProfesional: 'Enfermería',
      centroOrigen: 'Hospital Nacional',
      centroDestino: 'Clínica Bata',
      motivo: 'Cobertura de emergencias',
      estado: 'aprobado',
      fechaSolicitud: '2024-01-10',
      fechaRespuesta: '2024-01-12',
      solicitantePor: 'RRHH Ministerio'
    }
  ];

  const profesionalesDisponibles = [
    { id: 'prof-1', nombre: 'Dr. Juan Pérez', area: 'Medicina General', centro: 'Centro Malabo' },
    { id: 'prof-2', nombre: 'Dra. Ana López', area: 'Pediatría', centro: 'Centro Malabo' },
    { id: 'prof-3', nombre: 'Enf. Carlos Ruiz', area: 'Enfermería', centro: 'Centro Malabo' }
  ];

  const centrosDestino = [
    { id: 'hosp-1', nombre: 'Hospital Nacional', distrito: 'Malabo' },
    { id: 'cent-1', nombre: 'Centro Bata', distrito: 'Bata' },
    { id: 'clin-1', nombre: 'Clínica Especializada', distrito: 'Ebebiyín' }
  ];

  const handleCreateSolicitud = () => {
    console.log('Creating traslado solicitud:', newTraslado);
    // Aquí iría la lógica para crear la solicitud
    setIsCreateOpen(false);
    setNewTraslado({
      profesionalIds: [],
      centroDestino: '',
      motivo: '',
      observaciones: ''
    });
    setSelectedProfesionals([]);
  };

  const handleApproveTraslado = (solicitudId: string) => {
    console.log('Approving traslado:', solicitudId);
    // Aquí iría la lógica para aprobar el traslado
  };

  const handleRejectTraslado = (solicitudId: string) => {
    console.log('Rejecting traslado:', solicitudId);
    // Aquí iría la lógica para rechazar el traslado
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'aprobado':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprobado
          </Badge>
        );
      case 'rechazado':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rechazado
          </Badge>
        );
      default:
        return null;
    }
  };

  const canCreateTraslado = userRole === 'ADMIN_CENTRO_SANITARIO' || 
                           userRole === 'RRHH_MINISTERIO' || 
                           userRole === 'SUPER_ADMINISTRADOR';

  const canApproveTraslado = userRole === 'RRHH_MINISTERIO' || 
                            userRole === 'SUPER_ADMINISTRADOR';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-blue-600" />
              Traslados de Profesionales
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {solicitudesTraslado.filter(s => s.estado === 'pendiente').length} pendientes
              </Badge>
              {canCreateTraslado && (
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Solicitar Traslado
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Solicitar Traslado de Profesionales</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Seleccionar Profesionales
                        </label>
                        <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-2">
                          {profesionalesDisponibles.map((prof) => (
                            <label key={prof.id} className="flex items-center space-x-2 text-sm">
                              <input
                                type="checkbox"
                                checked={selectedProfesionals.includes(prof.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedProfesionals([...selectedProfesionals, prof.id]);
                                  } else {
                                    setSelectedProfesionals(selectedProfesionals.filter(id => id !== prof.id));
                                  }
                                }}
                              />
                              <span>{prof.nombre} - {prof.area}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedProfesionals.length} profesionales seleccionados
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1 block">Centro de Destino</label>
                        <Select value={newTraslado.centroDestino} onValueChange={(value) => 
                          setNewTraslado({...newTraslado, centroDestino: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar centro destino" />
                          </SelectTrigger>
                          <SelectContent>
                            {centrosDestino.map((centro) => (
                              <SelectItem key={centro.id} value={centro.id}>
                                {centro.nombre} - {centro.distrito}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1 block">Motivo del Traslado</label>
                        <Textarea
                          value={newTraslado.motivo}
                          onChange={(e) => setNewTraslado({...newTraslado, motivo: e.target.value})}
                          placeholder="Explique el motivo del traslado..."
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1 block">Observaciones (Opcional)</label>
                        <Textarea
                          value={newTraslado.observaciones}
                          onChange={(e) => setNewTraslado({...newTraslado, observaciones: e.target.value})}
                          placeholder="Observaciones adicionales..."
                          rows={2}
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleCreateSolicitud}
                          disabled={selectedProfesionals.length === 0 || !newTraslado.centroDestino || !newTraslado.motivo}
                        >
                          Enviar Solicitud
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profesional</TableHead>
                  <TableHead>Centro Origen</TableHead>
                  <TableHead>Centro Destino</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  {canApproveTraslado && <TableHead>Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitudesTraslado.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canApproveTraslado ? 7 : 6} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <ArrowRight className="w-12 h-12 mb-4 text-gray-400" />
                        <p className="text-lg font-medium">No hay solicitudes de traslado</p>
                        <p className="text-sm">
                          {canCreateTraslado 
                            ? 'Crea una nueva solicitud para comenzar'
                            : 'Las solicitudes aparecerán aquí cuando sean creadas'
                          }
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  solicitudesTraslado.map((solicitud) => (
                    <TableRow key={solicitud.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{solicitud.nombreProfesional}</div>
                          <div className="text-sm text-gray-500">{solicitud.areaProfesional}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          {solicitud.centroOrigen}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-blue-400" />
                          {solicitud.centroDestino}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={solicitud.motivo}>
                          {solicitud.motivo}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(solicitud.estado)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Sol: {new Date(solicitud.fechaSolicitud).toLocaleDateString()}</div>
                          {solicitud.fechaRespuesta && (
                            <div className="text-gray-500">
                              Resp: {new Date(solicitud.fechaRespuesta).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      {canApproveTraslado && (
                        <TableCell>
                          {solicitud.estado === 'pendiente' && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => handleApproveTraslado(solicitud.id)}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleRejectTraslado(solicitud.id)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Información de ayuda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">¿Cómo funciona el sistema de traslados?</p>
              <ul className="text-gray-600 space-y-1">
                <li>• Los administradores de centros pueden solicitar traslados de sus profesionales</li>
                <li>• RRHH del Ministerio revisa y aprueba/rechaza las solicitudes</li>
                <li>• Una vez aprobado, el sistema actualiza automáticamente la asignación del profesional</li>
                <li>• Todos los cambios quedan registrados para auditoría</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrasladosProfesionalesPanel;