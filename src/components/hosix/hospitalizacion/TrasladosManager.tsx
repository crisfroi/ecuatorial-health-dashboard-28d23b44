import React, { useState } from 'react';
import { useHosixHospitalizacion } from '@/hooks/useHosixHospitalizacion';
import { useHosixPacientes } from '@/hooks/useHosixPacientes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowRight, CheckCircle } from 'lucide-react';

const TrasladosManager: React.FC = () => {
  const {
    hospitalizacionesActivas,
    camasDisponibles,
    traslados,
    crearTraslado,
    isCreatingTraslado,
  } = useHosixHospitalizacion();
  const { pacientes } = useHosixPacientes();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    hospitalizacion_id: '',
    cama_nueva_id: '',
    servicio_nuevo_id: '',
    motivo: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const hospitalizacionSeleccionada = hospitalizacionesActivas.data?.find(
    h => h.id === formData.hospitalizacion_id
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.hospitalizacion_id || !formData.cama_nueva_id || !formData.servicio_nuevo_id || !formData.motivo.trim()) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const hosp = hospitalizacionSeleccionada;
      if (!hosp) throw new Error('Hospitalización no encontrada');

      await crearTraslado({
        hospitalizacion_id: formData.hospitalizacion_id,
        cama_anterior_id: hosp.cama_id,
        cama_nueva_id: formData.cama_nueva_id,
        servicio_anterior_id: hosp.servicio_id,
        servicio_nuevo_id: formData.servicio_nuevo_id,
        fecha_traslado: new Date().toISOString(),
        motivo: formData.motivo,
        medico_responsable_id: hosp.medico_responsable_id,
      });

      setSubmitted(true);
      setShowForm(false);
      setFormData({
        hospitalizacion_id: '',
        cama_nueva_id: '',
        servicio_nuevo_id: '',
        motivo: '',
      });

      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error('Error al crear traslado:', error);
    }
  };

  const getPacienteInfo = (pacienteId: string) => {
    const paciente = pacientes.data?.find(p => p.id === pacienteId);
    return `${paciente?.primer_nombre} ${paciente?.primer_apellido}`;
  };

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Hospitalizados Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hospitalizacionesActivas.data?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Camas Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{camasDisponibles.data?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Traslados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{traslados.data?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Traslados</CardTitle>
              <CardDescription>
                Traslada pacientes entre camas y servicios
              </CardDescription>
            </div>
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Traslado
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear Traslado</DialogTitle>
                  <DialogDescription>
                    Traslada un paciente a una cama y/o servicio diferente
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Paciente Hospitalizado */}
                  <div className="space-y-2">
                    <Label htmlFor="hospitalizacion">Paciente a Trasladar *</Label>
                    <Select 
                      value={formData.hospitalizacion_id} 
                      onValueChange={(value) => setFormData({ ...formData, hospitalizacion_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {hospitalizacionesActivas.data?.map((hosp) => (
                          <SelectItem key={hosp.id} value={hosp.id}>
                            {getPacienteInfo(hosp.paciente_id)} - Cama: {hosp.cama_id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Info Actual */}
                  {hospitalizacionSeleccionada && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertDescription className="text-blue-800 text-sm">
                        <div className="font-medium mb-1">Ubicación Actual:</div>
                        <div>Cama: {hospitalizacionSeleccionada.cama_id}</div>
                        <div>Servicio: {hospitalizacionSeleccionada.servicio_id}</div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Nueva Cama */}
                  <div className="space-y-2">
                    <Label htmlFor="cama">Cama Destino *</Label>
                    <Select value={formData.cama_nueva_id} onValueChange={(value) => setFormData({ ...formData, cama_nueva_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una cama disponible" />
                      </SelectTrigger>
                      <SelectContent>
                        {camasDisponibles.data?.map((cama) => (
                          <SelectItem key={cama.id} value={cama.id}>
                            {cama.codigo} - {cama.nombre} ({cama.ubicacion})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Servicio */}
                  <div className="space-y-2">
                    <Label htmlFor="servicio">Servicio Destino *</Label>
                    <Input
                      id="servicio"
                      value={formData.servicio_nuevo_id}
                      onChange={(e) => setFormData({ ...formData, servicio_nuevo_id: e.target.value })}
                      placeholder="ID del servicio destino"
                      required
                    />
                  </div>

                  {/* Motivo */}
                  <div className="space-y-2">
                    <Label htmlFor="motivo">Motivo del Traslado *</Label>
                    <Input
                      id="motivo"
                      value={formData.motivo}
                      onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                      placeholder="Ej: Mejora del paciente, cambio de servicio, etc."
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isCreatingTraslado}>
                      {isCreatingTraslado ? 'Trasladando...' : 'Realizar Traslado'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {submitted && (
            <Alert className="border-green-200 bg-green-50 mb-4">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                ¡Traslado realizado correctamente!
              </AlertDescription>
            </Alert>
          )}

          {traslados.isLoading ? (
            <Alert>
              <AlertDescription>Cargando traslados...</AlertDescription>
            </Alert>
          ) : traslados.error ? (
            <Alert variant="destructive">
              <AlertDescription>Error: {traslados.error.message}</AlertDescription>
            </Alert>
          ) : traslados.data?.length === 0 ? (
            <Alert>
              <AlertDescription>No hay traslados registrados aún</AlertDescription>
            </Alert>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Cama Anterior</TableHead>
                    <TableHead className="text-center">
                      <ArrowRight className="w-4 h-4 mx-auto" />
                    </TableHead>
                    <TableHead>Cama Nueva</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {traslados.data?.map((traslado) => {
                    const hosp = hospitalizacionesActivas.data?.find(h => h.id === traslado.hospitalizacion_id);
                    return (
                      <TableRow key={traslado.id}>
                        <TableCell className="font-medium">
                          {hosp ? getPacienteInfo(hosp.paciente_id) : 'Desconocido'}
                        </TableCell>
                        <TableCell>{traslado.cama_anterior_id}</TableCell>
                        <TableCell className="text-center">
                          <ArrowRight className="w-4 h-4 mx-auto text-gray-400" />
                        </TableCell>
                        <TableCell>{traslado.cama_nueva_id}</TableCell>
                        <TableCell className="text-sm">{formatFecha(traslado.fecha_traslado)}</TableCell>
                        <TableCell className="text-sm">{traslado.motivo}</TableCell>
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

export default TrasladosManager;
