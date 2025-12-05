import React, { useState } from 'react';
import { useHosixEnfermeria, KardexEntry } from '@/hooks/useHosixEnfermeria';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, Pill, Heart, FileText, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface KardexProps {
  pacienteId: string;
  episodioId?: string;
  tipoEpisodio?: string;
  worklistId?: string;
}

export default function Kardex({ pacienteId, episodioId, tipoEpisodio, worklistId }: KardexProps) {
  const { toast } = useToast();
  const { obtenerKardex, registrarKardexMutation } = useHosixEnfermeria();
  const { data: kardexEntries = [], isLoading } = obtenerKardex(pacienteId, episodioId);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<KardexEntry>>({
    paciente_id: pacienteId,
    episodio_id: episodioId,
    tipo_episodio: tipoEpisodio,
    worklist_id: worklistId,
    tipo_registro: 'dispensacion',
    estado: 'realizado',
  });

  const handleInputChange = (field: keyof KardexEntry, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await registrarKardexMutation.mutateAsync(formData);

      toast({
        title: 'Registro agregado',
        description: 'El registro se ha agregado al kardex correctamente.',
      });

      // Limpiar formulario
      setFormData({
        paciente_id: pacienteId,
        episodio_id: episodioId,
        tipo_episodio: tipoEpisodio,
        worklist_id: worklistId,
        tipo_registro: 'dispensacion',
        estado: 'realizado',
      });
      setShowForm(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al registrar en kardex',
        variant: 'destructive',
      });
    }
  };

  const formatearFechaHora = (fecha: string) => {
    return format(new Date(fecha), 'dd/MM/yyyy HH:mm', { locale: es });
  };

  const getTipoRegistroIcon = (tipo: string) => {
    switch (tipo) {
      case 'dispensacion':
      case 'administracion':
        return <Pill className="h-4 w-4" />;
      case 'cuidado':
        return <Heart className="h-4 w-4" />;
      case 'observacion':
        return <FileText className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'realizado':
        return (
          <Badge className="bg-green-600 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Realizado
          </Badge>
        );
      case 'omitido':
        return (
          <Badge className="bg-red-600 text-white">
            <XCircle className="h-3 w-3 mr-1" />
            Omitido
          </Badge>
        );
      case 'programado':
        return (
          <Badge className="bg-yellow-600 text-white">
            <Clock className="h-3 w-3 mr-1" />
            Programado
          </Badge>
        );
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Kardex - Registro de Cuidados y Dispensaciones
        </CardTitle>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Nuevo Registro'}
        </Button>
      </div>

      {/* Formulario de registro */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nuevo Registro en Kardex</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Registro</Label>
                  <Select
                    value={formData.tipo_registro}
                    onValueChange={(value) => handleInputChange('tipo_registro', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dispensacion">Dispensación</SelectItem>
                      <SelectItem value="administracion">Administración</SelectItem>
                      <SelectItem value="cuidado">Cuidado</SelectItem>
                      <SelectItem value="observacion">Observación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) => handleInputChange('estado', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realizado">Realizado</SelectItem>
                      <SelectItem value="programado">Programado</SelectItem>
                      <SelectItem value="omitido">Omitido</SelectItem>
                      <SelectItem value="rechazado">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.tipo_registro === 'dispensacion' || formData.tipo_registro === 'administracion' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Medicamento</Label>
                      <Input
                        placeholder="Nombre del medicamento"
                        value={formData.medicamento_texto || ''}
                        onChange={(e) => handleInputChange('medicamento_texto', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dosis</Label>
                      <Input
                        placeholder="Ej: 500mg"
                        value={formData.dosis || ''}
                        onChange={(e) => handleInputChange('dosis', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Vía de Administración</Label>
                      <Select
                        value={formData.via_administracion || ''}
                        onValueChange={(value) => handleInputChange('via_administracion', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar vía" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="oral">Oral</SelectItem>
                          <SelectItem value="intravenosa">Intravenosa</SelectItem>
                          <SelectItem value="intramuscular">Intramuscular</SelectItem>
                          <SelectItem value="subcutanea">Subcutánea</SelectItem>
                          <SelectItem value="topica">Tópica</SelectItem>
                          <SelectItem value="inhalatoria">Inhalatoria</SelectItem>
                          <SelectItem value="rectal">Rectal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Hora Programada</Label>
                      <Input
                        type="time"
                        value={formData.hora_programada || ''}
                        onChange={(e) => handleInputChange('hora_programada', e.target.value)}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Tipo de Cuidado</Label>
                    <Select
                      value={formData.tipo_cuidado || ''}
                      onValueChange={(value) => handleInputChange('tipo_cuidado', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cambio_postura">Cambio de Postura</SelectItem>
                        <SelectItem value="cura">Cura</SelectItem>
                        <SelectItem value="higiene">Higiene</SelectItem>
                        <SelectItem value="alimentacion">Alimentación</SelectItem>
                        <SelectItem value="movilizacion">Movilización</SelectItem>
                        <SelectItem value="monitoreo">Monitoreo</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción del Cuidado</Label>
                    <Textarea
                      placeholder="Describa el cuidado realizado..."
                      value={formData.descripcion_cuidado || ''}
                      onChange={(e) => handleInputChange('descripcion_cuidado', e.target.value)}
                      rows={3}
                    />
                  </div>
                </>
              )}

              {formData.estado === 'omitido' && (
                <div className="space-y-2">
                  <Label>Motivo de Omisión</Label>
                  <Textarea
                    placeholder="Explique por qué se omitió..."
                    value={formData.motivo_omision || ''}
                    onChange={(e) => handleInputChange('motivo_omision', e.target.value)}
                    rows={2}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Observaciones adicionales..."
                  value={formData.observaciones || ''}
                  onChange={(e) => handleInputChange('observaciones', e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Respuesta del Paciente</Label>
                <Textarea
                  placeholder="Reacción o respuesta del paciente..."
                  value={formData.respuesta_paciente || ''}
                  onChange={(e) => handleInputChange('respuesta_paciente', e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={registrarKardexMutation.isPending}>
                  {registrarKardexMutation.isPending ? 'Registrando...' : 'Registrar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabla de kardex */}
      <Card>
        <CardHeader>
          <CardTitle>Registros del Kardex</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">Cargando kardex...</p>
            </div>
          ) : kardexEntries.length === 0 ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">No hay registros en el kardex</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Detalle</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Observaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kardexEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          {formatearFechaHora(entry.fecha_hora)}
                        </div>
                        {entry.hora_programada && (
                          <div className="text-xs text-gray-500">
                            Prog: {entry.hora_programada}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTipoRegistroIcon(entry.tipo_registro)}
                          <span className="capitalize">{entry.tipo_registro}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.tipo_registro === 'dispensacion' || entry.tipo_registro === 'administracion' ? (
                          <div>
                            <p className="font-medium">{entry.medicamento_texto}</p>
                            <p className="text-sm text-gray-500">
                              {entry.dosis} - {entry.via_administracion}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium">{entry.tipo_cuidado}</p>
                            <p className="text-sm text-gray-500">{entry.descripcion_cuidado}</p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getEstadoBadge(entry.estado)}</TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm">{entry.observaciones || '-'}</p>
                          {entry.motivo_omision && (
                            <p className="text-xs text-red-600 mt-1">
                              <strong>Omisión:</strong> {entry.motivo_omision}
                            </p>
                          )}
                          {entry.respuesta_paciente && (
                            <p className="text-xs text-blue-600 mt-1">
                              <strong>Respuesta:</strong> {entry.respuesta_paciente}
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

