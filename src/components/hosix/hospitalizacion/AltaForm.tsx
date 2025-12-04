import React, { useState } from 'react';
import { useHosixHospitalizacion } from '@/hooks/useHosixHospitalizacion';
import { useHosixPacientes } from '@/hooks/useHosixPacientes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, AlertCircle } from 'lucide-react';

const AltaForm: React.FC = () => {
  const { hospitalizacionesActivas, darAlta, isDandoAlta } = useHosixHospitalizacion();
  const { pacientes } = useHosixPacientes();

  const [selectedHospitalizacion, setSelectedHospitalizacion] = useState<string>('');
  const [formData, setFormData] = useState({
    tipoAlta: 'domicilio' as 'domicilio' | 'traslado' | 'defuncion' | 'voluntaria',
    diagnosticoAlta: '',
    informeAlta: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const hospitalizacionSeleccionada = hospitalizacionesActivas.data?.find(h => h.id === selectedHospitalizacion);
  const pacienteInfo = pacientes.data?.find(p => p.id === hospitalizacionSeleccionada?.paciente_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedHospitalizacion || !formData.diagnosticoAlta.trim() || !formData.informeAlta.trim()) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      await darAlta({
        hospitalizacionId: selectedHospitalizacion,
        tipoAlta: formData.tipoAlta,
        diagnosticoAlta: formData.diagnosticoAlta,
        informeAlta: formData.informeAlta,
        camaId: hospitalizacionSeleccionada!.cama_id,
      });

      setSubmitted(true);
      setSelectedHospitalizacion('');
      setFormData({
        tipoAlta: 'domicilio',
        diagnosticoAlta: '',
        informeAlta: '',
      });

      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error('Error al dar de alta:', error);
    }
  };

  const calcularEstancia = (fechaIngreso: string) => {
    const ingreso = new Date(fechaIngreso);
    const hoy = new Date();
    const diasTranscurridos = Math.floor((hoy.getTime() - ingreso.getTime()) / (1000 * 60 * 60 * 24));
    return diasTranscurridos;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Alta de Paciente</CardTitle>
          <CardDescription>
            Registra el alta de un paciente hospitalizado
          </CardDescription>
        </CardHeader>

        <CardContent>
          {submitted && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                ¡Paciente dado de alta correctamente! La cama ha sido liberada.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seleccionar Hospitalización */}
            <div className="space-y-2">
              <Label htmlFor="hospitalizacion">Paciente Hospitalizado *</Label>
              <Select value={selectedHospitalizacion} onValueChange={setSelectedHospitalizacion}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un paciente hospitalizado" />
                </SelectTrigger>
                <SelectContent>
                  {hospitalizacionesActivas.data?.map((hosp) => {
                    const paciente = pacientes.data?.find(p => p.id === hosp.paciente_id);
                    const diasEstancia = calcularEstancia(hosp.fecha_ingreso);
                    return (
                      <SelectItem key={hosp.id} value={hosp.id}>
                        {paciente?.primer_nombre} {paciente?.primer_apellido} ({paciente?.ppi}) - {diasEstancia} días
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Información del Paciente */}
            {hospitalizacionSeleccionada && pacienteInfo && (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <div className="font-medium">{pacienteInfo.primer_nombre} {pacienteInfo.primer_apellido}</div>
                  <div className="text-sm">PPI: {pacienteInfo.ppi} | Cama: {hospitalizacionSeleccionada.cama_id}</div>
                  <div className="text-sm">Ingreso: {new Date(hospitalizacionSeleccionada.fecha_ingreso).toLocaleDateString('es-ES')}</div>
                  <div className="text-sm font-medium mt-1">Estancia: {calcularEstancia(hospitalizacionSeleccionada.fecha_ingreso)} días</div>
                </AlertDescription>
              </Alert>
            )}

            {/* Tipo de Alta */}
            <div className="space-y-2">
              <Label htmlFor="tipoAlta">Tipo de Alta *</Label>
              <Select value={formData.tipoAlta} onValueChange={(value: any) => setFormData({ ...formData, tipoAlta: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="domicilio">Alta al Domicilio</SelectItem>
                  <SelectItem value="traslado">Traslado a Otro Centro</SelectItem>
                  <SelectItem value="defuncion">Defunción</SelectItem>
                  <SelectItem value="voluntaria">Alta Voluntaria</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Diagnóstico de Alta */}
            <div className="space-y-2">
              <Label htmlFor="diagnostico">Diagnóstico de Alta *</Label>
              <Input
                id="diagnostico"
                value={formData.diagnosticoAlta}
                onChange={(e) => setFormData({ ...formData, diagnosticoAlta: e.target.value })}
                placeholder="Diagnóstico al momento del alta"
                required
              />
            </div>

            {/* Informe de Alta */}
            <div className="space-y-2">
              <Label htmlFor="informe">Informe de Alta *</Label>
              <Textarea
                id="informe"
                value={formData.informeAlta}
                onChange={(e) => setFormData({ ...formData, informeAlta: e.target.value })}
                placeholder="Incluye motivo del alta, recomendaciones, medicamentos prescritos, seguimiento recomendado..."
                className="min-h-40"
                required
              />
              <p className="text-xs text-gray-500">Mínimo 20 caracteres</p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={isDandoAlta || !selectedHospitalizacion || formData.informeAlta.length < 20}
              >
                {isDandoAlta ? 'Dando de alta...' : 'Dar de Alta'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="mt-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base text-blue-900">📋 Información Importante</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>• Al dar de alta, la cama será automáticamente marcada como disponible</p>
          <p>• El informe de alta quedará registrado en la historia clínica del paciente</p>
          <p>• Se registrarán todos los datos para auditoría y estadísticas</p>
          <p>• Esta acción no se puede deshacer, verifica los datos antes de confirmar</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AltaForm;
