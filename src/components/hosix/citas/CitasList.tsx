import React, { useState, useMemo } from 'react';
import { useHosixCitas } from '@/hooks/useHosixCitas';
import { useHosixPacientes } from '@/hooks/useHosixPacientes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Calendar, Clock, User, CheckCircle, X } from 'lucide-react';

const CitasList: React.FC = () => {
  const { citas, confirmarCita, cancelarCita, isUpdatingCita } = useHosixCitas();
  const { pacientes } = useHosixPacientes();

  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedCita, setSelectedCita] = useState<string | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');

  const filteredCitas = useMemo(() => {
    return citas.data?.filter(cita => {
      const paciente = pacientes.data?.find(p => p.id === cita.paciente_id);
      const matchesSearch = !searchTerm || 
        paciente?.primer_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paciente?.ppi.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEstado = !estadoFilter || cita.estado === estadoFilter;
      return matchesSearch && matchesEstado;
    }) || [];
  }, [citas.data, pacientes.data, searchTerm, estadoFilter]);

  const getPacienteNombre = (pacienteId: string) => {
    const paciente = pacientes.data?.find(p => p.id === pacienteId);
    return paciente ? `${paciente.primer_nombre} ${paciente.primer_apellido}` : 'Desconocido';
  };

  const getPacientePPI = (pacienteId: string) => {
    const paciente = pacientes.data?.find(p => p.id === pacienteId);
    return paciente?.ppi || '';
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, any> = {
      programada: { variant: 'default', label: 'Programada' },
      confirmada: { variant: 'secondary', label: 'Confirmada' },
      en_proceso: { variant: 'outline', label: 'En Proceso' },
      completada: { variant: 'default', label: 'Completada' },
      cancelada: { variant: 'destructive', label: 'Cancelada' },
      no_asistio: { variant: 'destructive', label: 'No Asistió' },
    };
    const config = variants[estado] || variants.programada;
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleConfirm = async (citaId: string) => {
    try {
      await confirmarCita(citaId);
    } catch (error) {
      console.error('Error confirming cita:', error);
    }
  };

  const handleCancelClick = (citaId: string) => {
    setSelectedCita(citaId);
    setShowCancelDialog(true);
  };

  const handleCancelSubmit = async () => {
    if (!selectedCita || !motivoCancelacion.trim()) {
      alert('Por favor especifica un motivo de cancelación');
      return;
    }

    try {
      await cancelarCita({
        id: selectedCita,
        motivo: motivoCancelacion,
      });
      setShowCancelDialog(false);
      setSelectedCita(null);
      setMotivoCancelacion('');
    } catch (error) {
      console.error('Error canceling cita:', error);
    }
  };

  const canTakeAction = (estado: string) => {
    return ['programada', 'confirmada'].includes(estado);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Citas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{citas.data?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Programadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{citas.data?.filter(c => c.estado === 'programada').length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{citas.data?.filter(c => c.estado === 'confirmada').length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{citas.data?.filter(c => c.estado === 'cancelada').length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Citas</CardTitle>
          <CardDescription>
            Administra, confirma y cancela citas de pacientes
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar Paciente</Label>
              <Input
                id="search"
                placeholder="Nombre o PPI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Filtrar por Estado</Label>
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="programada">Programada</SelectItem>
                  <SelectItem value="confirmada">Confirmada</SelectItem>
                  <SelectItem value="en_proceso">En Proceso</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="no_asistio">No Asistió</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEstadoFilter('')}
                className="w-full"
              >
                Limpiar filtro
              </Button>
            </div>
          </div>

          {/* Citas Table */}
          {citas.isLoading ? (
            <Alert>
              <AlertDescription>Cargando citas...</AlertDescription>
            </Alert>
          ) : citas.error ? (
            <Alert variant="destructive">
              <AlertDescription>Error al cargar citas: {citas.error.message}</AlertDescription>
            </Alert>
          ) : filteredCitas.length === 0 ? (
            <Alert>
              <AlertDescription>No hay citas disponibles con los filtros seleccionados</AlertDescription>
            </Alert>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Fecha y Hora
                    </TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCitas.map((cita) => (
                    <TableRow key={cita.id}>
                      <TableCell>
                        <div className="font-medium flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {getPacienteNombre(cita.paciente_id)}
                        </div>
                        <div className="text-sm text-gray-500">{getPacientePPI(cita.paciente_id)}</div>
                      </TableCell>
                      <TableCell className="text-sm">{formatFecha(cita.fecha_hora)}</TableCell>
                      <TableCell className="text-sm">{cita.duracion_minutos} min</TableCell>
                      <TableCell className="text-sm">{cita.motivo || '-'}</TableCell>
                      <TableCell>{getEstadoBadge(cita.estado)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {canTakeAction(cita.estado) && (
                          <>
                            {cita.estado === 'programada' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleConfirm(cita.id)}
                                disabled={isUpdatingCita}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Confirmar
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancelClick(cita.id)}
                              disabled={isUpdatingCita}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancelar
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Cita</AlertDialogTitle>
            <AlertDialogDescription>
              Especifica el motivo de la cancelación
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <Input
              placeholder="Motivo de cancelación"
              value={motivoCancelacion}
              onChange={(e) => setMotivoCancelacion(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <AlertDialogCancel>No, mantener</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelSubmit} className="bg-red-600 hover:bg-red-700">
              Sí, cancelar cita
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CitasList;
