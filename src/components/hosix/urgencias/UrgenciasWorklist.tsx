import React, { useState } from 'react';
import { useHosixUrgencias, getNivelTriageColor, getNivelTriageDescripcion } from '@/hooks/useHosixUrgencias';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Plus, Clock, CheckCircle } from 'lucide-react';
import TriageForm from './TriageForm';
import AtencionForm from './AtencionForm';

export default function UrgenciasWorklist() {
  const { episodios, isLoadingEpisodios } = useHosixUrgencias();
  const [selectedEpisodio, setSelectedEpisodio] = useState<string | null>(null);
  const [showTriageForm, setShowTriageForm] = useState(false);
  const [showAtencionForm, setShowAtencionForm] = useState(false);

  const formatearHora = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const calcularTiempoEspera = (fecha_entrada: string) => {
    const entrada = new Date(fecha_entrada);
    const ahora = new Date();
    const minutos = Math.floor((ahora.getTime() - entrada.getTime()) / 60000);

    if (minutos < 60) {
      return `${minutos}m`;
    }
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
  };

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-6 w-6 text-red-600" />
          <h2 className="text-2xl font-bold">Urgencias - Lista de Trabajo</h2>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Entrada
        </Button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{episodios.filter(e => e.nivel_triage === 1).length}</p>
              <p className="text-sm text-gray-600">Nivel 1 - Emergencia</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{episodios.filter(e => e.nivel_triage === 2).length}</p>
              <p className="text-sm text-gray-600">Nivel 2 - Urgencia</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{episodios.filter(e => e.nivel_triage === 3).length}</p>
              <p className="text-sm text-gray-600">Nivel 3 - Grave</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{episodios.length}</p>
              <p className="text-sm text-gray-600">Total en Espera</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de urgencias */}
      <Card>
        <CardHeader>
          <CardTitle>Episodios Activos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingEpisodios ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">Cargando episodios...</p>
            </div>
          ) : episodios.length === 0 ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">No hay episodios activos en urgencias</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Hora Entrada</TableHead>
                  <TableHead>Paciente (PPI)</TableHead>
                  <TableHead>Triage</TableHead>
                  <TableHead>Box</TableHead>
                  <TableHead>Procedencia</TableHead>
                  <TableHead>Tiempo Espera</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {episodios.sort((a, b) => {
                  const nivelA = a.nivel_triage || 999;
                  const nivelB = b.nivel_triage || 999;
                  if (nivelA !== nivelB) return nivelA - nivelB;
                  return new Date(a.fecha_entrada).getTime() - new Date(b.fecha_entrada).getTime();
                }).map((episodio) => (
                  <TableRow key={episodio.id} className="hover:bg-gray-50">
                    <TableCell className="font-mono text-sm">
                      {formatearHora(episodio.fecha_entrada)}
                    </TableCell>
                    <TableCell>
                      <div className="font-mono font-bold text-blue-600">{episodio.paciente?.ppi}</div>
                      <div className="text-sm text-gray-600">
                        {episodio.paciente?.primer_nombre} {episodio.paciente?.primer_apellido}
                      </div>
                    </TableCell>
                    <TableCell>
                      {episodio.nivel_triage ? (
                        <Badge className={`text-white ${getNivelTriageColor(episodio.nivel_triage)}`}>
                          Nivel {episodio.nivel_triage}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Sin Triage</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono font-bold">
                      {episodio.box_asignado || 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {episodio.procedencia || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        <Clock className="h-3 w-3 mr-1" />
                        {calcularTiempoEspera(episodio.fecha_entrada)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {!episodio.nivel_triage && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedEpisodio(episodio.id);
                              setShowTriageForm(true);
                            }}
                          >
                            Triage
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEpisodio(episodio.id);
                            setShowAtencionForm(true);
                          }}
                        >
                          Atender
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedEpisodio(episodio.id);
                          }}
                        >
                          Ver
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Triage Form */}
      <Dialog open={showTriageForm} onOpenChange={setShowTriageForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Triage</DialogTitle>
          </DialogHeader>
          {selectedEpisodio && (
            <TriageForm
              episodio_id={selectedEpisodio}
              onSuccess={() => setShowTriageForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Atención Form */}
      <Dialog open={showAtencionForm} onOpenChange={setShowAtencionForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Atención</DialogTitle>
          </DialogHeader>
          {selectedEpisodio && (
            <AtencionForm
              episodio_id={selectedEpisodio}
              onSuccess={() => setShowAtencionForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
