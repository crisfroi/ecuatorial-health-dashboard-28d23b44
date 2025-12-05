import React, { useState } from 'react';
import { useHosixPacientes } from '@/hooks/useHosixPacientes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Calendar, User, AlertCircle } from 'lucide-react';

const HistoriaClinicaView: React.FC = () => {
  const { pacientes, historiaClinica, isLoadingHistoria, errorHistoria } = useHosixPacientes();
  const [selectedPacienteId, setSelectedPacienteId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const pacienteSeleccionado = pacientes?.find(p => p.id === selectedPacienteId);
  const historiasDelPaciente = historiaClinica?.filter(h => h.paciente_id === selectedPacienteId) || [];

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTipoEntradaBadge = (tipo: string) => {
    const tipos: Record<string, any> = {
      consulta: { variant: 'outline', label: 'Consulta' },
      urgencia: { variant: 'destructive', label: 'Urgencia' },
      hospitalizacion: { variant: 'default', label: 'Hospitalización' },
      procedimiento: { variant: 'secondary', label: 'Procedimiento' },
      laboratorio: { variant: 'outline', label: 'Laboratorio' },
      imagenes: { variant: 'outline', label: 'Imágenes' },
      seguimiento: { variant: 'outline', label: 'Seguimiento' },
    };
    const config = tipos[tipo] || tipos.consulta;
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Selector de Paciente */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Paciente</CardTitle>
          <CardDescription>
            Busca y selecciona un paciente para ver su historia clínica electrónica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paciente">Paciente</Label>
            <Select value={selectedPacienteId} onValueChange={setSelectedPacienteId}>
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
        </CardContent>
      </Card>

      {/* Información del Paciente */}
      {pacienteSeleccionado && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">
              {pacienteSeleccionado.primer_nombre} {pacienteSeleccionado.primer_apellido}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="font-medium">PPI:</span> {pacienteSeleccionado.ppi}
              </div>
              <div>
                <span className="font-medium">Documento:</span> {pacienteSeleccionado.numero_documento || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Fecha Nac:</span>{' '}
                {new Date(pacienteSeleccionado.fecha_nacimiento).toLocaleDateString('es-ES')}
              </div>
              <div>
                <span className="font-medium">Sexo:</span> {pacienteSeleccionado.sexo}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <span className="font-medium">Grupo Sanguíneo:</span> {pacienteSeleccionado.grupo_sanguineo || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Teléfono:</span> {pacienteSeleccionado.telefono_movil || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Email:</span> {pacienteSeleccionado.email || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Estado:</span>{' '}
                <Badge variant={pacienteSeleccionado.activo ? 'default' : 'destructive'}>
                  {pacienteSeleccionado.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historia Clínica */}
      {pacienteSeleccionado ? (
        <Card>
          <CardHeader>
            <CardTitle>Historia Clínica Electrónica (HCE)</CardTitle>
            <CardDescription>
              Todas las entradas registradas en el sistema para este paciente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHistoria ? (
              <Alert>
                <AlertDescription>Cargando historia clínica...</AlertDescription>
              </Alert>
            ) : errorHistoria ? (
              <Alert variant="destructive">
                <AlertDescription>Error al cargar: {errorHistoria.message}</AlertDescription>
              </Alert>
            ) : historiasDelPaciente.length === 0 ? (
              <Alert>
                <AlertDescription>No hay entradas de historia clínica para este paciente</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {historiasDelPaciente.map((entrada) => (
                  <div key={entrada.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{entrada.titulo}</span>
                        {getTipoEntradaBadge(entrada.tipo_entrada)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatFecha(entrada.fecha_entrada)}
                      </div>
                      {entrada.servicio_id && (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          Servicio: {entrada.servicio_id}
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 p-3 rounded mb-3 text-sm max-h-40 overflow-y-auto">
                      <p className="whitespace-pre-wrap">{entrada.contenido}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div>
                        {entrada.firmado && <Badge variant="outline">✓ Firmado</Badge>}
                      </div>
                      <div>
                        Modificado: {new Date(entrada.updated_at).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Selecciona un paciente para ver su historia clínica electrónica
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HistoriaClinicaView;
