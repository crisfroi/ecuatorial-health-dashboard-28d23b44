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
import { useAdvancedRoleManagement } from '@/hooks/useAdvancedRoleManagement';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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

  const { user } = useAuth();
  const { traslados, createTrasladoSolicitud, processTrasladoSolicitud, loadTraslados } = useAdvancedRoleManagement();

  const [profesionalesDisponibles, setProfesionalesDisponibles] = useState<{ id: string; nombre: string; area?: string }[]>([]);
  const [centrosDestino, setCentrosDestino] = useState<{ id: string; nombre: string; distrito?: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Profesionales del centro asignado (si aplica)
        let profQuery = supabase
          .from('profesionales_sanitarios')
          .select('id, nombre_completo, area_profesional, centro_salud_id')
          .eq('estado_solicitud', 'Aprobado');

        if (userRole === 'ADMIN_CENTRO_SANITARIO' && (user?.assigned_center_id || centroAsignado)) {
          profQuery = profQuery.eq('centro_salud_id', (centroAsignado || user?.assigned_center_id) as string);
        }

        const [{ data: profs }, { data: centros }] = await Promise.all([
          profQuery.order('nombre_completo', { ascending: true }),
          supabase
            .from('centros_salud')
            .select('id, nombre, distrito_sanitario')
            .order('nombre', { ascending: true })
        ]);

        setProfesionalesDisponibles(
          (profs || []).map((p: any) => ({ id: p.id, nombre: p.nombre_completo, area: p.area_profesional || undefined }))
        );
        setCentrosDestino((centros || []).map((c: any) => ({ id: c.id, nombre: c.nombre, distrito: c.distrito_sanitario || undefined })));
      } catch (e) {
        console.error('Error cargando datos para traslados:', e);
      }
    };

    fetchData();
  }, [userRole, user?.assigned_center_id, centroAsignado]);

  const handleCreateSolicitud = async () => {
    if (!newTraslado.centroDestino || !newTraslado.motivo || selectedProfesionals.length === 0) return;

    for (const profesionalId of selectedProfesionals) {
      await createTrasladoSolicitud({
        profesional_id: profesionalId,
        centro_destino_id: newTraslado.centroDestino,
        motivo: newTraslado.motivo,
        observaciones: newTraslado.observaciones,
        centro_origen_id: (user?.assigned_center_id || centroAsignado) as string | undefined
      });
    }

    setIsCreateOpen(false);
    setNewTraslado({ profesionalIds: [], centroDestino: '', motivo: '', observaciones: '' });
    setSelectedProfesionals([]);
    loadTraslados();
  };

  const handleApproveTraslado = async (solicitudId: string) => {
    await processTrasladoSolicitud(solicitudId, 'aprobado');
  };

  const handleRejectTraslado = async (solicitudId: string) => {
    await processTrasladoSolicitud(solicitudId, 'rechazado');
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
                {traslados.filter((s: any) => s.estado === 'pendiente').length} pendientes
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
                              <span>{prof.nombre}{prof.area ? ` - ${prof.area}` : ''}</span>
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
                                {centro.nombre}{centro.distrito ? ` - ${centro.distrito}` : ''}
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
                {traslados.length === 0 ? (
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
                  traslados.map((solicitud: any) => (
                    <TableRow key={solicitud.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{solicitud.profesional?.nombre_completo || 'Profesional'}</div>
                          <div className="text-sm text-gray-500">{solicitud.profesional?.area_profesional || ''}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          {solicitud.centro_origen?.nombre || ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-blue-400" />
                          {solicitud.centro_destino?.nombre || ''}
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
                          <div>Sol: {new Date(solicitud.fecha_solicitud).toLocaleDateString()}</div>
                          {solicitud.fecha_aprobacion && (
                            <div className="text-gray-500">
                              Resp: {new Date(solicitud.fecha_aprobacion).toLocaleDateString()}
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
