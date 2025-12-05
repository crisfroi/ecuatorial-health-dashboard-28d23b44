import React, { useState, useMemo } from 'react';
import { useHosixCitas } from '@/hooks/useHosixCitas';
import { useHosixPacientes } from '@/hooks/useHosixPacientes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';

const CitasForm: React.FC = () => {
  const { agendas, createCita, isCreatingCita } = useHosixCitas();
  const { pacientes } = useHosixPacientes();

  const [formData, setFormData] = useState({
    paciente_id: '',
    agenda_id: '',
    fecha: '',
    hora: '',
    motivo: '',
    es_teleconsulta: false,
  });

  const [submitted, setSubmitted] = useState(false);

  // Generar horas disponibles (8:00 AM - 6:00 PM, cada 15 minutos)
  const horasDisponibles = useMemo(() => {
    const horas = [];
    for (let h = 8; h < 18; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        horas.push(hora);
      }
    }
    return horas;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.paciente_id || !formData.agenda_id || !formData.fecha || !formData.hora) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const fechaHora = new Date(`${formData.fecha}T${formData.hora}`);
      
      // Buscar la agenda seleccionada para obtener duración
      const agenda = agendas.data?.find(a => a.id === formData.agenda_id);
      if (!agenda) throw new Error('Agenda no encontrada');

      await createCita({
        agenda_id: formData.agenda_id,
        paciente_id: formData.paciente_id,
        fecha_hora: fechaHora.toISOString(),
        duracion_minutos: agenda.duracion_default_minutos,
        motivo: formData.motivo,
        estado: 'programada',
        es_teleconsulta: formData.es_teleconsulta,
      });

      setSubmitted(true);
      setFormData({
        paciente_id: '',
        agenda_id: '',
        fecha: '',
        hora: '',
        motivo: '',
        es_teleconsulta: false,
      });

      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error('Error al agendar cita:', error);
      alert('Error al agendar la cita');
    }
  };

  // Validar que la fecha no sea en el pasado
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Agendar Nueva Cita</CardTitle>
          <CardDescription>
            Selecciona un paciente, agenda y horario disponible
          </CardDescription>
        </CardHeader>

        <CardContent>
          {submitted && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                ¡Cita agendada exitosamente!
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Paciente */}
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

            {/* Agenda */}
            <div className="space-y-2">
              <Label htmlFor="agenda">Agenda / Servicio *</Label>
              <Select value={formData.agenda_id} onValueChange={(value) => setFormData({ ...formData, agenda_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una agenda" />
                </SelectTrigger>
                <SelectContent>
                  {agendas.data?.map((agenda) => (
                    <SelectItem key={agenda.id} value={agenda.id}>
                      {agenda.nombre} - {agenda.sala} ({agenda.duracion_default_minutos} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Fecha *
                </Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  min={today}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hora" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Hora *
                </Label>
                <Select value={formData.hora} onValueChange={(value) => setFormData({ ...formData, hora: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona hora" />
                  </SelectTrigger>
                  <SelectContent>
                    {horasDisponibles.map((hora) => (
                      <SelectItem key={hora} value={hora}>
                        {hora}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo de la Cita</Label>
              <Input
                id="motivo"
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                placeholder="Ej: Consulta de control, seguimiento, etc."
              />
            </div>

            {/* Teleconsulta */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.es_teleconsulta}
                  onChange={(e) => setFormData({ ...formData, es_teleconsulta: e.target.checked })}
                  disabled={!formData.agenda_id || agendas.data?.find(a => a.id === formData.agenda_id)?.permite_teleconsulta === false}
                />
                <span>Solicitar como Teleconsulta</span>
              </Label>
              {formData.agenda_id && !agendas.data?.find(a => a.id === formData.agenda_id)?.permite_teleconsulta && (
                <Alert className="mt-2 border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700 text-sm">
                    Esta agenda no permite teleconsultas
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={isCreatingCita || !formData.paciente_id || !formData.agenda_id || !formData.fecha || !formData.hora}
              >
                {isCreatingCita ? 'Agendando...' : 'Agendar Cita'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="mt-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base text-blue-900">💡 Instrucciones</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>• Selecciona el paciente para el cual deseas agendar la cita</p>
          <p>• Elige la agenda o servicio (médico, especialidad, sala)</p>
          <p>• Indica la fecha y hora preferidas</p>
          <p>• Opcionalmente, especifica si será una teleconsulta</p>
          <p>• Haz clic en "Agendar Cita" para confirmar</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CitasForm;
