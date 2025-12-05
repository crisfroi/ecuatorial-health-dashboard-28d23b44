import React, { useState } from 'react';
import { useHosixUrgencias, getNivelTriageColor, getNivelTriageDescripcion } from '@/hooks/useHosixUrgencias';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface TriageFormProps {
  episodio_id: string;
  onSuccess: () => void;
}

export default function TriageForm({ episodio_id, onSuccess }: TriageFormProps) {
  const { registrarTriage, isRegistrandoTriage } = useHosixUrgencias();
  const [nivel, setNivel] = useState<number>(3);
  const [signos, setSignos] = useState({
    temperatura: '',
    presion_arterial: '',
    frecuencia_cardiaca: '',
    frecuencia_respiratoria: '',
    saturacion_oxigeno: '',
  });
  const [sintomas, setSintomas] = useState<string[]>([]);
  const [motivo, setMotivo] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const sintomasComunes = [
    'Dolor torácico',
    'Disnea (falta de aire)',
    'Pérdida de conciencia',
    'Hemorragia',
    'Trauma',
    'Quemaduras',
    'Envenenamiento',
    'Dolor abdominal',
    'Fiebre',
    'Mareos',
  ];

  const handleAgregarSintoma = (sintoma: string) => {
    if (sintomas.includes(sintoma)) {
      setSintomas(sintomas.filter(s => s !== sintoma));
    } else {
      setSintomas([...sintomas, sintoma]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    registrarTriage(
      {
        episodio_id,
        triageData: {
          nivel_urgencia: nivel,
          motivo_consulta: motivo,
          signos_vitales: {
            temperatura: signos.temperatura ? parseFloat(signos.temperatura) : undefined,
            presion_arterial: signos.presion_arterial || undefined,
            frecuencia_cardiaca: signos.frecuencia_cardiaca ? parseInt(signos.frecuencia_cardiaca) : undefined,
            frecuencia_respiratoria: signos.frecuencia_respiratoria ? parseInt(signos.frecuencia_respiratoria) : undefined,
            saturacion_oxigeno: signos.saturacion_oxigeno ? parseFloat(signos.saturacion_oxigeno) : undefined,
          },
          sintomas,
          observaciones,
        },
      },
      {
        onSuccess: () => {
          toast.success('Triage registrado correctamente');
          onSuccess();
        },
        onError: (error: any) => {
          toast.error(`Error: ${error.message}`);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nivel de Triage */}
      <Card className="border-2">
        <CardHeader className="bg-gray-50">
          <CardTitle className="text-lg">Nivel de Triage</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {[1, 2, 3, 4, 5].map((nivel_) => (
              <div key={nivel_} className="flex items-center space-x-2">
                <RadioGroup value={nivel.toString()} onValueChange={(v) => setNivel(parseInt(v))}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={nivel_.toString()} id={`nivel-${nivel_}`} />
                    <Label htmlFor={`nivel-${nivel_}`} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Badge className={`text-white ${getNivelTriageColor(nivel_)}`}>
                          Nivel {nivel_}
                        </Badge>
                        <span className="text-sm">{getNivelTriageDescripcion(nivel_)}</span>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Motivo de Consulta */}
      <div>
        <Label htmlFor="motivo">Motivo de Consulta</Label>
        <Textarea
          id="motivo"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Descripción del motivo de consulta..."
          className="h-20"
        />
      </div>

      {/* Signos Vitales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signos Vitales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="temperatura">Temperatura (°C)</Label>
              <Input
                id="temperatura"
                type="number"
                step="0.1"
                min="32"
                max="44"
                value={signos.temperatura}
                onChange={(e) => setSignos({ ...signos, temperatura: e.target.value })}
                placeholder="37.5"
              />
            </div>
            <div>
              <Label htmlFor="presion">Presión Arterial (mmHg)</Label>
              <Input
                id="presion"
                value={signos.presion_arterial}
                onChange={(e) => setSignos({ ...signos, presion_arterial: e.target.value })}
                placeholder="120/80"
              />
            </div>
            <div>
              <Label htmlFor="fc">Frecuencia Cardíaca (lpm)</Label>
              <Input
                id="fc"
                type="number"
                min="0"
                max="300"
                value={signos.frecuencia_cardiaca}
                onChange={(e) => setSignos({ ...signos, frecuencia_cardiaca: e.target.value })}
                placeholder="72"
              />
            </div>
            <div>
              <Label htmlFor="fr">Frecuencia Respiratoria (rpm)</Label>
              <Input
                id="fr"
                type="number"
                min="0"
                max="60"
                value={signos.frecuencia_respiratoria}
                onChange={(e) => setSignos({ ...signos, frecuencia_respiratoria: e.target.value })}
                placeholder="16"
              />
            </div>
            <div>
              <Label htmlFor="saturacion">Saturación O2 (%)</Label>
              <Input
                id="saturacion"
                type="number"
                min="0"
                max="100"
                value={signos.saturacion_oxigeno}
                onChange={(e) => setSignos({ ...signos, saturacion_oxigeno: e.target.value })}
                placeholder="98"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Síntomas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Síntomas Presentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {sintomasComunes.map((sintoma) => (
              <div key={sintoma} className="flex items-center space-x-2">
                <Checkbox
                  id={sintoma}
                  checked={sintomas.includes(sintoma)}
                  onCheckedChange={() => handleAgregarSintoma(sintoma)}
                />
                <Label htmlFor={sintoma} className="cursor-pointer">{sintoma}</Label>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Label htmlFor="otros-sintomas">Otros Síntomas</Label>
            <Textarea
              id="otros-sintomas"
              placeholder="Otros síntomas adicionales..."
              className="h-12"
            />
          </div>
        </CardContent>
      </Card>

      {/* Observaciones */}
      <div>
        <Label htmlFor="observaciones">Observaciones</Label>
        <Textarea
          id="observaciones"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Notas adicionales del triage..."
          className="h-20"
        />
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isRegistrandoTriage}>
          {isRegistrandoTriage ? 'Guardando...' : 'Registrar Triage'}
        </Button>
      </div>
    </form>
  );
}
