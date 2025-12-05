import React, { useState } from 'react';
import { useHosixUrgencias } from '@/hooks/useHosixUrgencias';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface AtencionFormProps {
  episodio_id: string;
  onSuccess: () => void;
}

export default function AtencionForm({ episodio_id, onSuccess }: AtencionFormProps) {
  const { registrarAtencion, isRegistrandoAtencion, cerrarEpisodio, isCerrandoEpisodio } = useHosixUrgencias();
  const [tab, setTab] = useState('atencion');
  const [diagnosticoInicial, setDiagnosticoInicial] = useState('');
  const [diagnosticoFinal, setDiagnosticoFinal] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [tipoSalida, setTipoSalida] = useState('');
  const [destinoSalida, setDestinoSalida] = useState('');

  const handleRegistrarAtencion = () => {
    registrarAtencion(
      {
        episodio_id,
        diagnostico_inicial: diagnosticoInicial || undefined,
        diagnostico_final: diagnosticoFinal || undefined,
        observaciones,
      },
      {
        onSuccess: () => {
          toast.success('Atención registrada correctamente');
        },
        onError: (error: any) => {
          toast.error(`Error: ${error.message}`);
        },
      }
    );
  };

  const handleCerrarEpisodio = () => {
    if (!tipoSalida) {
      toast.warning('Seleccione tipo de salida');
      return;
    }

    cerrarEpisodio(
      {
        episodio_id,
        tipo_salida: tipoSalida,
        destino_salida: destinoSalida || undefined,
        diagnostico_final: diagnosticoFinal || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Episodio cerrado correctamente');
          onSuccess();
        },
        onError: (error: any) => {
          toast.error(`Error: ${error.message}`);
        },
      }
    );
  };

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="atencion">Registro de Atención</TabsTrigger>
        <TabsTrigger value="alta">Cierre del Episodio</TabsTrigger>
      </TabsList>

      <TabsContent value="atencion" className="space-y-6">
        {/* Diagnóstico */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Diagnósticos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="diagnostico-inicial">Diagnóstico Inicial</Label>
              <Textarea
                id="diagnostico-inicial"
                value={diagnosticoInicial}
                onChange={(e) => setDiagnosticoInicial(e.target.value)}
                placeholder="Diagnóstico inicial según evaluación..."
                className="h-20"
              />
            </div>
            <div>
              <Label htmlFor="diagnostico-final">Diagnóstico Final</Label>
              <Textarea
                id="diagnostico-final"
                value={diagnosticoFinal}
                onChange={(e) => setDiagnosticoFinal(e.target.value)}
                placeholder="Diagnóstico final después de evaluación y pruebas..."
                className="h-20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Observaciones */}
        <div>
          <Label htmlFor="observaciones">Observaciones de Atención</Label>
          <Textarea
            id="observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Notas sobre la atención brindada..."
            className="h-20"
          />
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button onClick={handleRegistrarAtencion} disabled={isRegistrandoAtencion}>
            {isRegistrandoAtencion ? 'Guardando...' : 'Guardar Atención'}
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="alta" className="space-y-6">
        {/* Tipo de Salida */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tipo de Salida</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={tipoSalida} onValueChange={setTipoSalida}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo de salida..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alta">Alta a Domicilio</SelectItem>
                <SelectItem value="ingreso">Ingreso a Hospitalización</SelectItem>
                <SelectItem value="traslado">Traslado a Otro Centro</SelectItem>
                <SelectItem value="referencia">Referencia Especializada</SelectItem>
                <SelectItem value="defuncion">Defunción</SelectItem>
                <SelectItem value="fuga">Fuga</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Destino */}
        {tipoSalida !== 'alta' && tipoSalida !== 'defuncion' && tipoSalida !== 'fuga' && (
          <div>
            <Label htmlFor="destino">Destino/Unidad</Label>
            <Input
              id="destino"
              value={destinoSalida}
              onChange={(e) => setDestinoSalida(e.target.value)}
              placeholder="Especificar destino del paciente..."
            />
          </div>
        )}

        {/* Diagnóstico Final */}
        <div>
          <Label htmlFor="diag-final">Diagnóstico Final</Label>
          <Textarea
            id="diag-final"
            value={diagnosticoFinal}
            onChange={(e) => setDiagnosticoFinal(e.target.value)}
            placeholder="Diagnóstico final del episodio..."
            className="h-20"
          />
        </div>

        {/* Información de Alta */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recomendaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Recomendaciones para el paciente al salir de urgencias..."
              className="h-20"
            />
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCerrarEpisodio} 
            disabled={isCerrandoEpisodio}
            className="bg-green-600 hover:bg-green-700"
          >
            {isCerrandoEpisodio ? 'Cerrando...' : 'Cerrar Episodio'}
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}
