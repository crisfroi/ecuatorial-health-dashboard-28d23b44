import React, { useState } from 'react';
import { useHosixEnfermeria, ConstantesVitales as ConstantesVitalesType } from '@/hooks/useHosixEnfermeria';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Heart, Thermometer, Activity, Wind, Droplet, Stethoscope, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface ConstantesVitalesProps {
  pacienteId: string;
  episodioId?: string;
  tipoEpisodio?: string;
  worklistId?: string;
  onClose?: () => void;
}

export default function ConstantesVitales({
  pacienteId,
  episodioId,
  tipoEpisodio,
  worklistId,
  onClose,
}: ConstantesVitalesProps) {
  const { toast } = useToast();
  const { obtenerConstantes, registrarConstantesMutation } = useHosixEnfermeria();
  const { data: constantesHistoricas = [], isLoading } = obtenerConstantes(pacienteId, episodioId);

  const [formData, setFormData] = useState<Partial<ConstantesVitalesType>>({
    paciente_id: pacienteId,
    episodio_id: episodioId,
    tipo_episodio: tipoEpisodio,
    worklist_id: worklistId,
  });

  const [alertas, setAlertas] = useState<string[]>([]);

  const validarConstantes = (data: Partial<ConstantesVitalesType>) => {
    const nuevasAlertas: string[] = [];

    // Validar presión arterial
    if (data.presion_arterial_sistolica && data.presion_arterial_diastolica) {
      if (data.presion_arterial_sistolica > 180 || data.presion_arterial_diastolica > 120) {
        nuevasAlertas.push('Hipertensión severa');
      }
      if (data.presion_arterial_sistolica < 90 || data.presion_arterial_diastolica < 60) {
        nuevasAlertas.push('Hipotensión');
      }
    }

    // Validar frecuencia cardíaca
    if (data.frecuencia_cardiaca) {
      if (data.frecuencia_cardiaca > 100) {
        nuevasAlertas.push('Taquicardia');
      }
      if (data.frecuencia_cardiaca < 60) {
        nuevasAlertas.push('Bradicardia');
      }
    }

    // Validar frecuencia respiratoria
    if (data.frecuencia_respiratoria) {
      if (data.frecuencia_respiratoria > 20) {
        nuevasAlertas.push('Taquipnea');
      }
      if (data.frecuencia_respiratoria < 12) {
        nuevasAlertas.push('Bradipnea');
      }
    }

    // Validar temperatura
    if (data.temperatura_celsius) {
      if (data.temperatura_celsius > 38) {
        nuevasAlertas.push('Fiebre');
      }
      if (data.temperatura_celsius < 36) {
        nuevasAlertas.push('Hipotermia');
      }
    }

    // Validar saturación de oxígeno
    if (data.saturacion_oxigeno) {
      if (data.saturacion_oxigeno < 95) {
        nuevasAlertas.push('Hipoxemia');
      }
      if (data.saturacion_oxigeno < 90) {
        nuevasAlertas.push('Hipoxemia severa - Requiere atención inmediata');
      }
    }

    // Validar glucosa
    if (data.glucosa_capilar) {
      if (data.glucosa_capilar > 180) {
        nuevasAlertas.push('Hiperglucemia');
      }
      if (data.glucosa_capilar < 70) {
        nuevasAlertas.push('Hipoglucemia');
      }
    }

    setAlertas(nuevasAlertas);
    return nuevasAlertas;
  };

  const handleInputChange = (field: keyof ConstantesVitalesType, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    validarConstantes(newData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await registrarConstantesMutation.mutateAsync({
        ...formData,
        alertas: alertas.length > 0 ? alertas : undefined,
      });

      toast({
        title: 'Constantes registradas',
        description: 'Las constantes vitales se han registrado correctamente.',
      });

      // Limpiar formulario
      setFormData({
        paciente_id: pacienteId,
        episodio_id: episodioId,
        tipo_episodio: tipoEpisodio,
        worklist_id: worklistId,
      });
      setAlertas([]);

      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al registrar constantes vitales',
        variant: 'destructive',
      });
    }
  };

  const formatearFechaHora = (fecha: string) => {
    return format(new Date(fecha), 'dd/MM/yyyy HH:mm', { locale: es });
  };

  return (
    <div className="space-y-4">
      {/* Formulario de registro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Registrar Constantes Vitales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Alertas */}
            {alertas.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Alertas detectadas:</strong>
                  <ul className="list-disc list-inside mt-2">
                    {alertas.map((alerta, idx) => (
                      <li key={idx}>{alerta}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Presión Arterial */}
              <div className="space-y-2">
                <Label>Presión Arterial</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Sistólica"
                    value={formData.presion_arterial_sistolica || ''}
                    onChange={(e) =>
                      handleInputChange('presion_arterial_sistolica', parseInt(e.target.value) || undefined)
                    }
                  />
                  <span className="self-center">/</span>
                  <Input
                    type="number"
                    placeholder="Diastólica"
                    value={formData.presion_arterial_diastolica || ''}
                    onChange={(e) =>
                      handleInputChange('presion_arterial_diastolica', parseInt(e.target.value) || undefined)
                    }
                  />
                </div>
              </div>

              {/* Frecuencia Cardíaca */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Heart className="h-4 w-4 text-red-500" />
                  Frecuencia Cardíaca (lpm)
                </Label>
                <Input
                  type="number"
                  placeholder="Ej: 72"
                  value={formData.frecuencia_cardiaca || ''}
                  onChange={(e) =>
                    handleInputChange('frecuencia_cardiaca', parseInt(e.target.value) || undefined)
                  }
                />
              </div>

              {/* Frecuencia Respiratoria */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Wind className="h-4 w-4 text-blue-500" />
                  Frecuencia Respiratoria (rpm)
                </Label>
                <Input
                  type="number"
                  placeholder="Ej: 16"
                  value={formData.frecuencia_respiratoria || ''}
                  onChange={(e) =>
                    handleInputChange('frecuencia_respiratoria', parseInt(e.target.value) || undefined)
                  }
                />
              </div>

              {/* Temperatura */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Thermometer className="h-4 w-4 text-orange-500" />
                  Temperatura (°C)
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 36.5"
                  value={formData.temperatura_celsius || ''}
                  onChange={(e) =>
                    handleInputChange('temperatura_celsius', parseFloat(e.target.value) || undefined)
                  }
                />
              </div>

              {/* Saturación de Oxígeno */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Activity className="h-4 w-4 text-green-500" />
                  Saturación O₂ (%)
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 98"
                  value={formData.saturacion_oxigeno || ''}
                  onChange={(e) =>
                    handleInputChange('saturacion_oxigeno', parseFloat(e.target.value) || undefined)
                  }
                />
              </div>

              {/* Glucosa Capilar */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Droplet className="h-4 w-4 text-purple-500" />
                  Glucosa Capilar (mg/dL)
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 100"
                  value={formData.glucosa_capilar || ''}
                  onChange={(e) =>
                    handleInputChange('glucosa_capilar', parseFloat(e.target.value) || undefined)
                  }
                />
              </div>

              {/* Peso */}
              <div className="space-y-2">
                <Label>Peso (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 70.5"
                  value={formData.peso_kg || ''}
                  onChange={(e) => handleInputChange('peso_kg', parseFloat(e.target.value) || undefined)}
                />
              </div>

              {/* Talla */}
              <div className="space-y-2">
                <Label>Talla (cm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 170"
                  value={formData.talla_cm || ''}
                  onChange={(e) => handleInputChange('talla_cm', parseFloat(e.target.value) || undefined)}
                />
              </div>

              {/* IMC (calculado automáticamente) */}
              {formData.imc && (
                <div className="space-y-2">
                  <Label>IMC</Label>
                  <Input type="number" value={formData.imc.toFixed(2)} disabled />
                </div>
              )}
            </div>

            {/* Observaciones */}
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                placeholder="Observaciones adicionales sobre las constantes vitales..."
                value={formData.observaciones || ''}
                onChange={(e) => handleInputChange('observaciones', e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              {onClose && (
                <Button type="button" variant="outline" onClick={onClose}>
                  Cerrar
                </Button>
              )}
              <Button type="submit" disabled={registrarConstantesMutation.isPending}>
                {registrarConstantesMutation.isPending ? 'Registrando...' : 'Registrar Constantes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Historial de constantes */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Constantes Vitales</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">Cargando historial...</p>
            </div>
          ) : constantesHistoricas.length === 0 ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">No hay registros de constantes vitales</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead>PA</TableHead>
                    <TableHead>FC</TableHead>
                    <TableHead>FR</TableHead>
                    <TableHead>T°</TableHead>
                    <TableHead>SpO₂</TableHead>
                    <TableHead>Glucosa</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>Alertas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {constantesHistoricas.map((constante) => (
                    <TableRow key={constante.id}>
                      <TableCell className="text-sm">
                        {formatearFechaHora(constante.fecha_registro)}
                      </TableCell>
                      <TableCell>
                        {constante.presion_arterial_sistolica && constante.presion_arterial_diastolica
                          ? `${constante.presion_arterial_sistolica}/${constante.presion_arterial_diastolica}`
                          : '-'}
                      </TableCell>
                      <TableCell>{constante.frecuencia_cardiaca || '-'}</TableCell>
                      <TableCell>{constante.frecuencia_respiratoria || '-'}</TableCell>
                      <TableCell>
                        {constante.temperatura_celsius ? `${constante.temperatura_celsius}°C` : '-'}
                      </TableCell>
                      <TableCell>
                        {constante.saturacion_oxigeno ? `${constante.saturacion_oxigeno}%` : '-'}
                      </TableCell>
                      <TableCell>
                        {constante.glucosa_capilar ? `${constante.glucosa_capilar} mg/dL` : '-'}
                      </TableCell>
                      <TableCell>
                        {constante.peso_kg ? `${constante.peso_kg} kg` : '-'}
                      </TableCell>
                      <TableCell>
                        {constante.alertas && constante.alertas.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {constante.alertas.map((alerta, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded"
                              >
                                {alerta}
                              </span>
                            ))}
                          </div>
                        ) : (
                          '-'
                        )}
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

