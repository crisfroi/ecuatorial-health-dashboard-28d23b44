import React, { useState } from 'react';
import { useHosixHospitalizacion } from '@/hooks/useHosixHospitalizacion';
import { useHosixPacientes } from '@/hooks/useHosixPacientes';
import { useProfesionales } from '@/hooks/useProfesionales';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';

const IngresoPacienteForm: React.FC = () => {
  const { camasDisponibles, createHospitalizacion, isCreatingHospitalizacion } = useHosixHospitalizacion();
  const { pacientes } = useHosixPacientes();
  const { data: profesionales = [] } = useProfesionales();

  const [formData, setFormData] = useState({
    paciente_id: '',
    cama_id: '',
    servicio_id: '',
    medico_responsable_id: '',
    origen_ingreso: 'programado' as 'urgencias' | 'programado' | 'traslado',
    diagnostico_ingreso: '',
    duracion_prevista_dias: 5,
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.paciente_id || !formData.cama_id || !formData.servicio_id || !formData.medico_responsable_id || !formData.diagnostico_ingreso) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      await createHospitalizacion({
        paciente_id: formData.paciente_id,
        cama_id: formData.cama_id,
        servicio_id: formData.servicio_id,
        medico_responsable_id: formData.medico_responsable_id,
        fecha_ingreso: new Date().toISOString(),
        origen_ingreso: formData.origen_ingreso,
        diagnostico_ingreso: formData.diagnostico_ingreso,
        duracion_prevista_dias: formData.duracion_prevista_dias,
        estado: 'activo',
      });

      setSubmitted(true);
      setFormData({
        paciente_id: '',
        cama_id: '',
        servicio_id: '',
        medico_responsable_id: '',
        origen_ingreso: 'programado',
        diagnostico_ingreso: '',
        duracion_prevista_dias: 5,
      });

      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error('Error al ingresar paciente:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Ingreso de Paciente</CardTitle>
          <CardDescription>
            Registra el ingreso de un paciente para hospitalización
          </CardDescription>
        </CardHeader>

        <CardContent>
          {submitted && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                ¡Paciente ingresado exitosamente a hospitalización!
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
                  {pacientes?.map((paciente) => (
                    <SelectItem key={paciente.id} value={paciente.id}>
                      {paciente.primer_nombre} {paciente.primer_apellido} ({paciente.ppi})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Origen de Ingreso */}
            <div className="space-y-2">
              <Label htmlFor="origen">Origen de Ingreso *</Label>
              <Select value={formData.origen_ingreso} onValueChange={(value: any) => setFormData({ ...formData, origen_ingreso: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgencias">Desde Urgencias</SelectItem>
                  <SelectItem value="programado">Programado</SelectItem>
                  <SelectItem value="traslado">Traslado de otro Centro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Médico Responsable */}
            <div className="space-y-2">
              <Label htmlFor="medico">Médico Responsable *</Label>
              <Select value={formData.medico_responsable_id} onValueChange={(value) => setFormData({ ...formData, medico_responsable_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un médico" />
                </SelectTrigger>
                <SelectContent>
                  {profesionales?.filter(p => p.area_profesional?.includes('Médico') || p.area_profesional === 'Médico')?.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.nombre_completo || `${prof.primer_nombre} ${prof.primer_apellido}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Servicio y Cama */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="servicio">Servicio *</Label>
                <Input
                  id="servicio"
                  value={formData.servicio_id}
                  onChange={(e) => setFormData({ ...formData, servicio_id: e.target.value })}
                  placeholder="ID del servicio"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cama">Cama *</Label>
                <Select value={formData.cama_id} onValueChange={(value) => setFormData({ ...formData, cama_id: value })}>
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
            </div>

            {/* Diagnóstico e Ingreso */}
            <div className="space-y-2">
              <Label htmlFor="diagnostico">Diagnóstico de Ingreso *</Label>
              <Input
                id="diagnostico"
                value={formData.diagnostico_ingreso}
                onChange={(e) => setFormData({ ...formData, diagnostico_ingreso: e.target.value })}
                placeholder="Diagnóstico principal"
                required
              />
            </div>

            {/* Duración Prevista */}
            <div className="space-y-2">
              <Label htmlFor="duracion">Duración Prevista (días)</Label>
              <Input
                id="duracion"
                type="number"
                value={formData.duracion_prevista_dias}
                onChange={(e) => setFormData({ ...formData, duracion_prevista_dias: parseInt(e.target.value) })}
                min="1"
                max="365"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={isCreatingHospitalizacion}
              >
                {isCreatingHospitalizacion ? 'Ingresando...' : 'Ingresar Paciente'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="mt-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base text-blue-900">📋 Procedimiento</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>• Selecciona el paciente a ser hospitalizado</p>
          <p>• Indica el origen del ingreso (urgencias, programado, traslado)</p>
          <p>• Asigna un médico responsable para el seguimiento</p>
          <p>• Especifica el servicio donde se hospitalizará</p>
          <p>• Selecciona una cama disponible</p>
          <p>• Registra el diagnóstico de ingreso</p>
          <p>• Estima la duración prevista de la hospitalización</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default IngresoPacienteForm;
