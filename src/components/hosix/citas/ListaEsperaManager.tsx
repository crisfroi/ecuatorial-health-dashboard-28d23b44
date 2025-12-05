import React, { useState } from 'react';
import { useHosixCitas } from '@/hooks/useHosixCitas';
import { useHosixPacientes } from '@/hooks/useHosixPacientes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ListaEsperaForm {
  paciente_id: string;
  tipo_solicitud: 'hospitalizacion' | 'consulta_ambulatoria' | 'examen_diagnostico' | 'cirugia_con_hospitalizacion' | 'cirugia_mayor_ambulatoria' | 'cirugia_menor_ambulatoria';
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  motivo: string;
  observaciones: string;
}

const ListaEsperaManager: React.FC = () => {
  const { listaEspera, createListaEspera, isCreatingListaEspera, asignarDesdeListaEspera } = useHosixCitas();
  const { pacientes } = useHosixPacientes();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ListaEsperaForm>({
    paciente_id: '',
    tipo_solicitud: 'consulta_ambulatoria',
    prioridad: 'media',
    motivo: '',
    observaciones: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.paciente_id || !formData.motivo.trim()) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    try {
      await createListaEspera({
        paciente_id: formData.paciente_id,
        tipo_solicitud: formData.tipo_solicitud,
        prioridad: formData.prioridad,
        fecha_solicitud: new Date().toISOString(),
        motivo: formData.motivo,
        estado: 'activa',
        observaciones: formData.observaciones,
      });

      setShowForm(false);
      setFormData({
        paciente_id: '',
        tipo_solicitud: 'consulta_ambulatoria',
        prioridad: 'media',
        motivo: '',
        observaciones: '',
      });
    } catch (error) {
      console.error('Error creating solicitud:', error);
    }
  };

  const getPacienteInfo = (pacienteId: string) => {
    const paciente = pacientes.data?.find(p => p.id === pacienteId);
    return {
      nombre: paciente ? `${paciente.primer_nombre} ${paciente.primer_apellido}` : 'Desconocido',
      ppi: paciente?.ppi || '',
    };
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      hospitalizacion: 'Hospitalización',
      consulta_ambulatoria: 'Consulta Ambulatoria',
      examen_diagnostico: 'Examen Diagnóstico',
      cirugia_con_hospitalizacion: 'Cirugía con Hospitalización',
      cirugia_mayor_ambulatoria: 'Cirugía Mayor Ambulatoria',
      cirugia_menor_ambulatoria: 'Cirugía Menor Ambulatoria',
    };
    return labels[tipo] || tipo;
  };

  const getPrioridadBadge = (prioridad: string) => {
    const variants: Record<string, any> = {
      baja: { variant: 'outline', label: 'Baja' },
      media: { variant: 'secondary', label: 'Media' },
      alta: { variant: 'default', label: 'Alta' },
      urgente: { variant: 'destructive', label: 'Urgente' },
    };
    const config = variants[prioridad] || variants.media;
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const sortedLista = listaEspera.data?.sort((a, b) => {
    const prioridades = { urgente: 0, alta: 1, media: 2, baja: 3 };
    return (prioridades[a.prioridad as keyof typeof prioridades] || 2) -
           (prioridades[b.prioridad as keyof typeof prioridades] || 2);
  }) || [];

  const activas = sortedLista.filter(s => s.estado === 'activa');
  const asignadas = sortedLista.filter(s => s.estado === 'asignada');
  const completadas = sortedLista.filter(s => s.estado === 'completada');

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total en Espera</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activas.length}</div>
            <p className="text-xs text-gray-500">Solicitudes activas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Asignadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{asignadas.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completadas.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{sortedLista.filter(s => s.prioridad === 'urgente' && s.estado === 'activa').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Espera</CardTitle>
              <CardDescription>
                Administra solicitudes de pacientes en espera de atención
              </CardDescription>
            </div>
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Solicitud
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Agregar a Lista de Espera</DialogTitle>
                  <DialogDescription>
                    Registra una nueva solicitud de paciente para lista de espera
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="paciente">Paciente *</Label>
                    <Select value={formData.paciente_id} onValueChange={(value) => setFormData({ ...formData, paciente_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {pacientes.data?.map((paciente) => (
                          <SelectItem key={paciente.id} value={paciente.id}>
                            {paciente.primer_nombre} {paciente.primer_apellido} - {paciente.ppi}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo de Solicitud *</Label>
                      <Select value={formData.tipo_solicitud} onValueChange={(value: any) => setFormData({ ...formData, tipo_solicitud: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hospitalizacion">Hospitalización</SelectItem>
                          <SelectItem value="consulta_ambulatoria">Consulta Ambulatoria</SelectItem>
                          <SelectItem value="examen_diagnostico">Examen Diagnóstico</SelectItem>
                          <SelectItem value="cirugia_con_hospitalizacion">Cirugía c/ Hospitalización</SelectItem>
                          <SelectItem value="cirugia_mayor_ambulatoria">Cirugía Mayor Ambulatoria</SelectItem>
                          <SelectItem value="cirugia_menor_ambulatoria">Cirugía Menor Ambulatoria</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prioridad">Prioridad *</Label>
                      <Select value={formData.prioridad} onValueChange={(value: any) => setFormData({ ...formData, prioridad: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baja">Baja</SelectItem>
                          <SelectItem value="media">Media</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="urgente">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motivo">Motivo *</Label>
                    <Input
                      id="motivo"
                      value={formData.motivo}
                      onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                      placeholder="Descripción del motivo"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Input
                      id="observaciones"
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      placeholder="Notas adicionales (opcional)"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isCreatingListaEspera}>
                      {isCreatingListaEspera ? 'Agregando...' : 'Agregar a Lista'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {listaEspera.isLoading ? (
            <Alert>
              <AlertDescription>Cargando lista de espera...</AlertDescription>
            </Alert>
          ) : listaEspera.error ? (
            <Alert variant="destructive">
              <AlertDescription>Error al cargar: {listaEspera.error.message}</AlertDescription>
            </Alert>
          ) : activas.length === 0 ? (
            <Alert>
              <AlertDescription>No hay solicitudes activas en la lista de espera</AlertDescription>
            </Alert>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Fecha Solicitud</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activas.map((solicitud) => {
                    const paciente = getPacienteInfo(solicitud.paciente_id);
                    return (
                      <TableRow key={solicitud.id}>
                        <TableCell>
                          <div className="font-medium">{paciente.nombre}</div>
                          <div className="text-sm text-gray-500">{paciente.ppi}</div>
                        </TableCell>
                        <TableCell className="text-sm">{getTipoLabel(solicitud.tipo_solicitud)}</TableCell>
                        <TableCell>{getPrioridadBadge(solicitud.prioridad)}</TableCell>
                        <TableCell className="text-sm">{formatFecha(solicitud.fecha_solicitud)}</TableCell>
                        <TableCell className="text-sm">{solicitud.motivo}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Asignar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ListaEsperaManager;
