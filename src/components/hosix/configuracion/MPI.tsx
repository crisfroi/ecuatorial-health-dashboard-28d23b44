import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useHosixMPI } from '@/hooks/useHosixMPI';
import { AlertCircle, Merge, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const MPI: React.FC = () => {
  const {
    posiblesDuplicados,
    loadingDuplicados,
    historiaCentralizada,
    loadingHistoria,
    fusionarHistorias,
  } = useHosixMPI();

  const [duplicadoSeleccionado, setDuplicadoSeleccionado] = useState<string | null>(null);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<{
    original: string;
    duplicado: string;
  } | null>(null);

  const handleFusionar = async (pacienteOriginal: string, pacienteDuplicado: string) => {
    await fusionarHistorias.mutateAsync({
      pacienteOriginal,
      pacienteDuplicado,
    });
    setDuplicadoSeleccionado(null);
    setPacienteSeleccionado(null);
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pacientes Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loadingHistoria ? '-' : historiaCentralizada?.totalPacientes}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pacientes Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loadingHistoria ? '-' : historiaCentralizada?.pacientesActivos}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Duplicados Detectados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {loadingDuplicados ? '-' : posiblesDuplicados.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Duplicados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gestión de Duplicados
          </CardTitle>
          <CardDescription>
            Detectar y fusionar registros duplicados de pacientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingDuplicados && (
            <div className="text-center py-8 text-gray-500">
              Buscando duplicados...
            </div>
          )}

          {!loadingDuplicados && posiblesDuplicados.length === 0 && (
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                No se encontraron duplicados en el sistema
              </AlertDescription>
            </Alert>
          )}

          {!loadingDuplicados && posiblesDuplicados.length > 0 && (
            <div className="space-y-4">
              {posiblesDuplicados.map((grupo, idx) => (
                <Card key={idx} className="border-amber-200 bg-amber-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {grupo.pacientes[0].primer_nombre} {grupo.pacientes[0].primer_apellido}
                        </CardTitle>
                        <CardDescription>
                          {grupo.cantidad} registros encontrados
                        </CardDescription>
                      </div>
                      <Badge variant="destructive">{grupo.cantidad} dup.</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {grupo.pacientes.map((paciente, pIdx) => (
                      <div
                        key={paciente.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">
                            {paciente.ppi} - {paciente.primer_nombre} {paciente.primer_apellido}
                          </p>
                          <p className="text-sm text-gray-600">
                            Cédula: {paciente.numero_documento} | Nac: {paciente.fecha_nacimiento}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {pIdx === 0 && (
                            <Badge variant="outline" className="bg-green-50">
                              Principal
                            </Badge>
                          )}
                          {pIdx !== 0 && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setDuplicadoSeleccionado(grupo.clave);
                                setPacienteSeleccionado({
                                  original: grupo.pacientes[0].id,
                                  duplicado: paciente.id,
                                });
                              }}
                            >
                              <Merge className="w-4 h-4 mr-2" />
                              Fusionar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}

                    {pacienteSeleccionado &&
                      duplicadoSeleccionado === grupo.clave && (
                        <Alert variant="destructive" className="mt-4">
                          <AlertCircle className="w-4 h-4" />
                          <AlertDescription>
                            <p>
                              ¿Confirmar fusión? Se moverán todos los registros al principal
                              y se desactivará el duplicado.
                            </p>
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setDuplicadoSeleccionado(null);
                                  setPacienteSeleccionado(null);
                                }}
                              >
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (pacienteSeleccionado) {
                                    handleFusionar(
                                      pacienteSeleccionado.original,
                                      pacienteSeleccionado.duplicado
                                    );
                                  }
                                }}
                                disabled={fusionarHistorias.isPending}
                              >
                                {fusionarHistorias.isPending ? 'Fusionando...' : 'Confirmar Fusión'}
                              </Button>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
