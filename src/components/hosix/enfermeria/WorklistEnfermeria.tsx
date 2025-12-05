import React, { useState } from 'react';
import { useHosixEnfermeria, WorklistEnfermeria } from '@/hooks/useHosixEnfermeria';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Clock, AlertCircle, CheckCircle, User } from 'lucide-react';
import ConstantesVitales from './ConstantesVitales';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const getPrioridadColor = (prioridad: string) => {
  switch (prioridad) {
    case 'critica':
      return 'bg-red-600 text-white';
    case 'alta':
      return 'bg-orange-600 text-white';
    case 'normal':
      return 'bg-blue-600 text-white';
    case 'baja':
      return 'bg-gray-600 text-white';
    default:
      return 'bg-gray-400 text-white';
  }
};

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'en_atencion':
      return 'bg-green-600 text-white';
    case 'pendiente':
      return 'bg-yellow-600 text-white';
    case 'completado':
      return 'bg-gray-600 text-white';
    default:
      return 'bg-gray-400 text-white';
  }
};

const getTipoEpisodioLabel = (tipo: string) => {
  const labels: Record<string, string> = {
    urgencia: 'Urgencia',
    hospitalizacion: 'Hospitalización',
    consulta: 'Consulta',
    quirofano: 'Quirófano',
  };
  return labels[tipo] || tipo;
};

export default function WorklistEnfermeria() {
  const { worklist, isLoadingWorklist, actualizarWorklistMutation } = useHosixEnfermeria();
  const [selectedPaciente, setSelectedPaciente] = useState<WorklistEnfermeria | null>(null);
  const [showConstantesForm, setShowConstantesForm] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('todos');

  const calcularEdad = (fechaNacimiento: string) => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const formatearHora = (fecha: string) => {
    return format(new Date(fecha), 'HH:mm', { locale: es });
  };

  const formatearFecha = (fecha: string) => {
    return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
  };

  const calcularTiempoAsignacion = (fechaAsignacion: string) => {
    const asignacion = new Date(fechaAsignacion);
    const ahora = new Date();
    const minutos = Math.floor((ahora.getTime() - asignacion.getTime()) / 60000);

    if (minutos < 60) {
      return `${minutos}m`;
    }
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
  };

  const handleCambiarEstado = async (id: string, nuevoEstado: string) => {
    await actualizarWorklistMutation.mutateAsync({
      id,
      estado: nuevoEstado,
    });
  };

  const handleAbrirConstantes = (paciente: WorklistEnfermeria) => {
    setSelectedPaciente(paciente);
    setShowConstantesForm(true);
  };

  const worklistFiltrada = worklist.filter((item) => {
    if (filtroEstado !== 'todos' && item.estado !== filtroEstado) return false;
    if (filtroPrioridad !== 'todos' && item.prioridad !== filtroPrioridad) return false;
    return true;
  });

  const estadisticas = {
    pendientes: worklist.filter((w) => w.estado === 'pendiente').length,
    enAtencion: worklist.filter((w) => w.estado === 'en_atencion').length,
    criticos: worklist.filter((w) => w.prioridad === 'critica').length,
    total: worklist.length,
  };

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-pink-600" />
          <h2 className="text-2xl font-bold">Worklist de Enfermería</h2>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{estadisticas.pendientes}</p>
              <p className="text-sm text-gray-600">Pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{estadisticas.enAtencion}</p>
              <p className="text-sm text-gray-600">En Atención</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{estadisticas.criticos}</p>
              <p className="text-sm text-gray-600">Críticos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{estadisticas.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Estado</label>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en_atencion">En Atención</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Prioridad</label>
              <Select value={filtroPrioridad} onValueChange={setFiltroPrioridad}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de worklist */}
      <Card>
        <CardHeader>
          <CardTitle>Pacientes Asignados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingWorklist ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">Cargando worklist...</p>
            </div>
          ) : worklistFiltrada.length === 0 ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">No hay pacientes asignados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Edad</TableHead>
                  <TableHead>Tipo Episodio</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Tiempo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {worklistFiltrada.map((item) => {
                  const paciente = item.paciente;
                  const edad = paciente?.fecha_nacimiento
                    ? calcularEdad(paciente.fecha_nacimiento)
                    : '-';

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium">
                              {paciente?.primer_nombre} {paciente?.primer_apellido}
                            </p>
                            <p className="text-sm text-gray-500">PPI: {paciente?.ppi}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{edad} años</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getTipoEpisodioLabel(item.tipo_episodio)}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.servicio?.nombre || '-'}</TableCell>
                      <TableCell>
                        <Badge className={getPrioridadColor(item.prioridad)}>
                          {item.prioridad.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getEstadoColor(item.estado)}>
                          {item.estado.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.fecha_asignacion && (
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {calcularTiempoAsignacion(item.fecha_asignacion)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAbrirConstantes(item)}
                          >
                            <Heart className="h-4 w-4 mr-1" />
                            Constantes
                          </Button>
                          {item.estado === 'pendiente' && (
                            <Button
                              size="sm"
                              onClick={() => handleCambiarEstado(item.id, 'en_atencion')}
                            >
                              Iniciar
                            </Button>
                          )}
                          {item.estado === 'en_atencion' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCambiarEstado(item.id, 'completado')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Completar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog para constantes vitales */}
      <Dialog open={showConstantesForm} onOpenChange={setShowConstantesForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Constantes Vitales - {selectedPaciente?.paciente?.primer_nombre}{' '}
              {selectedPaciente?.paciente?.primer_apellido}
            </DialogTitle>
          </DialogHeader>
          {selectedPaciente && (
            <ConstantesVitales
              pacienteId={selectedPaciente.paciente_id}
              episodioId={selectedPaciente.episodio_id}
              tipoEpisodio={selectedPaciente.tipo_episodio}
              worklistId={selectedPaciente.id}
              onClose={() => setShowConstantesForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

