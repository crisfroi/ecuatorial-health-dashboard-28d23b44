import React, { useState } from 'react';
import { useHosixEnfermeria, PlanCuidado } from '@/hooks/useHosixEnfermeria';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface PlanesCuidadoProps {
  pacienteId: string;
  episodioId?: string;
  tipoEpisodio?: string;
  worklistId?: string;
}

export default function PlanesCuidado({
  pacienteId,
  episodioId,
  tipoEpisodio,
  worklistId,
}: PlanesCuidadoProps) {
  const { toast } = useToast();
  const { obtenerPlanes, crearPlanMutation, actualizarPlanMutation } = useHosixEnfermeria();
  const { data: planes = [], isLoading } = obtenerPlanes(pacienteId, episodioId);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<PlanCuidado>>({
    paciente_id: pacienteId,
    episodio_id: episodioId,
    tipo_episodio: tipoEpisodio,
    worklist_id: worklistId,
    tipo_plan: 'personalizado',
    estado: 'activo',
    objetivos: [],
    intervenciones: [],
  });

  const handleInputChange = (field: keyof PlanCuidado, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAgregarObjetivo = () => {
    const nuevoObjetivo = {
      descripcion: '',
      fecha_esperada: '',
    };
    setFormData({
      ...formData,
      objetivos: [...(formData.objetivos || []), nuevoObjetivo],
    });
  };

  const handleAgregarIntervencion = () => {
    const nuevaIntervencion = {
      tipo: 'cuidado',
      descripcion: '',
      frecuencia: '',
    };
    setFormData({
      ...formData,
      intervenciones: [...(formData.intervenciones || []), nuevaIntervencion],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.diagnostico_enfermeria) {
      toast({
        title: 'Error',
        description: 'El diagnóstico de enfermería es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    try {
      await crearPlanMutation.mutateAsync(formData);

      toast({
        title: 'Plan creado',
        description: 'El plan de cuidado se ha creado correctamente.',
      });

      // Limpiar formulario
      setFormData({
        paciente_id: pacienteId,
        episodio_id: episodioId,
        tipo_episodio: tipoEpisodio,
        worklist_id: worklistId,
        tipo_plan: 'personalizado',
        estado: 'activo',
        objetivos: [],
        intervenciones: [],
      });
      setShowForm(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al crear plan de cuidado',
        variant: 'destructive',
      });
    }
  };

  const handleSuspenderPlan = async (planId: string) => {
    try {
      await actualizarPlanMutation.mutateAsync({
        id: planId,
        estado: 'suspendido',
        fecha_fin: new Date().toISOString(),
      });
      toast({
        title: 'Plan suspendido',
        description: 'El plan de cuidado ha sido suspendido.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al suspender plan',
        variant: 'destructive',
      });
    }
  };

  const formatearFecha = (fecha: string) => {
    return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
  };

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Planes de Cuidado
        </CardTitle>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : <Plus className="h-4 w-4 mr-2" />}
          {showForm ? 'Cancelar' : 'Nuevo Plan'}
        </Button>
      </div>

      {/* Formulario de nuevo plan */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nuevo Plan de Cuidado</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Plan</Label>
                  <Select
                    value={formData.tipo_plan}
                    onValueChange={(value) => handleInputChange('tipo_plan', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="estandarizado">Estandarizado</SelectItem>
                      <SelectItem value="personalizado">Personalizado</SelectItem>
                      <SelectItem value="nanda">NANDA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nombre del Plan</Label>
                  <Input
                    placeholder="Ej: Plan de cuidados post-operatorio"
                    value={formData.nombre_plan || ''}
                    onChange={(e) => handleInputChange('nombre_plan', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Diagnóstico de Enfermería *</Label>
                <Textarea
                  placeholder="Describa el diagnóstico de enfermería..."
                  value={formData.diagnostico_enfermeria || ''}
                  onChange={(e) => handleInputChange('diagnostico_enfermeria', e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Factores Relacionados</Label>
                <Textarea
                  placeholder="Factores relacionados con el diagnóstico (separados por comas)"
                  value={formData.factores_relacionados?.join(', ') || ''}
                  onChange={(e) =>
                    handleInputChange(
                      'factores_relacionados',
                      e.target.value.split(',').map((f) => f.trim()).filter(Boolean)
                    )
                  }
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Características Definitorias</Label>
                <Textarea
                  placeholder="Características definitorias (separadas por comas)"
                  value={formData.caracteristicas_definitorias?.join(', ') || ''}
                  onChange={(e) =>
                    handleInputChange(
                      'caracteristicas_definitorias',
                      e.target.value.split(',').map((c) => c.trim()).filter(Boolean)
                    )
                  }
                  rows={2}
                />
              </div>

              {/* Objetivos */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Objetivos y Resultados Esperados</Label>
                  <Button type="button" size="sm" variant="outline" onClick={handleAgregarObjetivo}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Objetivo
                  </Button>
                </div>
                {formData.objetivos && formData.objetivos.length > 0 && (
                  <div className="space-y-2 border rounded p-3">
                    {formData.objetivos.map((obj, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          placeholder="Descripción del objetivo"
                          value={obj.descripcion || ''}
                          onChange={(e) => {
                            const nuevosObjetivos = [...(formData.objetivos || [])];
                            nuevosObjetivos[idx] = { ...obj, descripcion: e.target.value };
                            handleInputChange('objetivos', nuevosObjetivos);
                          }}
                        />
                        <Input
                          type="date"
                          value={obj.fecha_esperada || ''}
                          onChange={(e) => {
                            const nuevosObjetivos = [...(formData.objetivos || [])];
                            nuevosObjetivos[idx] = { ...obj, fecha_esperada: e.target.value };
                            handleInputChange('objetivos', nuevosObjetivos);
                          }}
                          className="w-40"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const nuevosObjetivos = formData.objetivos?.filter((_, i) => i !== idx);
                            handleInputChange('objetivos', nuevosObjetivos);
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Intervenciones */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Intervenciones</Label>
                  <Button type="button" size="sm" variant="outline" onClick={handleAgregarIntervencion}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Intervención
                  </Button>
                </div>
                {formData.intervenciones && formData.intervenciones.length > 0 && (
                  <div className="space-y-2 border rounded p-3">
                    {formData.intervenciones.map((int, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          placeholder="Descripción de la intervención"
                          value={int.descripcion || ''}
                          onChange={(e) => {
                            const nuevasIntervenciones = [...(formData.intervenciones || [])];
                            nuevasIntervenciones[idx] = { ...int, descripcion: e.target.value };
                            handleInputChange('intervenciones', nuevasIntervenciones);
                          }}
                        />
                        <Input
                          placeholder="Frecuencia"
                          value={int.frecuencia || ''}
                          onChange={(e) => {
                            const nuevasIntervenciones = [...(formData.intervenciones || [])];
                            nuevasIntervenciones[idx] = { ...int, frecuencia: e.target.value };
                            handleInputChange('intervenciones', nuevasIntervenciones);
                          }}
                          className="w-32"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const nuevasIntervenciones = formData.intervenciones?.filter((_, i) => i !== idx);
                            handleInputChange('intervenciones', nuevasIntervenciones);
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={crearPlanMutation.isPending}>
                  {crearPlanMutation.isPending ? 'Creando...' : 'Crear Plan'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de planes */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <p className="text-gray-500">Cargando planes...</p>
          </div>
        ) : planes.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">No hay planes de cuidado activos</p>
            </CardContent>
          </Card>
        ) : (
          planes.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {plan.nombre_plan || 'Plan de Cuidado'}
                      <Badge
                        className={
                          plan.estado === 'activo'
                            ? 'bg-green-600 text-white'
                            : plan.estado === 'suspendido'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-600 text-white'
                        }
                      >
                        {plan.estado.toUpperCase()}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Inicio: {formatearFecha(plan.fecha_inicio)}
                      {plan.fecha_fin && ` - Fin: ${formatearFecha(plan.fecha_fin)}`}
                    </p>
                  </div>
                  {plan.estado === 'activo' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSuspenderPlan(plan.id)}
                    >
                      Suspender
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Diagnóstico de Enfermería</Label>
                  <p className="mt-1">{plan.diagnostico_enfermeria}</p>
                </div>

                {plan.factores_relacionados && plan.factores_relacionados.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold">Factores Relacionados</Label>
                    <ul className="list-disc list-inside mt-1">
                      {plan.factores_relacionados.map((factor, idx) => (
                        <li key={idx} className="text-sm">{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {plan.objetivos && plan.objetivos.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold">Objetivos</Label>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {plan.objetivos.map((obj: any, idx: number) => (
                        <li key={idx} className="text-sm">
                          {obj.descripcion}
                          {obj.fecha_esperada && (
                            <span className="text-gray-500 ml-2">
                              (Esperado: {formatearFecha(obj.fecha_esperada)})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {plan.intervenciones && plan.intervenciones.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold">Intervenciones</Label>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {plan.intervenciones.map((int: any, idx: number) => (
                        <li key={idx} className="text-sm">
                          {int.descripcion}
                          {int.frecuencia && (
                            <span className="text-gray-500 ml-2">({int.frecuencia})</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

