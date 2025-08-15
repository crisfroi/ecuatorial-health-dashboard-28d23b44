import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  AlertTriangle,
  CheckCircle,
  Users,
  Phone,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { useGuardiasStore } from '@/stores/useGuardiasStore';
import { guardiaSchema, type GuardiaFormData } from '@/schemas/guardiasSchemas';
import {
  formatearCategoriaProfesional,
  formatearTipoGuardia,
  validarDuracionGuardia,
  determinarTipoDia,
  calcularHorasGuardia,
  validarLimitesGuardiasMes
} from '@/utils/guardiasUtils';
import { CategoriaProfesional, TipoGuardia } from '@/types/guardias';

const RegistroGuardias: React.FC = () => {
  const {
    profesionales,
    guardias,
    addGuardia,
    selectedMes,
    selectedAnio,
    configuracion,
    calcularBaremo
  } = useGuardiasStore();

  const [fechaInicio, setFechaInicio] = useState<Date>();
  const [fechaFin, setFechaFin] = useState<Date>();
  const [showCalendarInicio, setShowCalendarInicio] = useState(false);
  const [showCalendarFin, setShowCalendarFin] = useState(false);
  const [validacionDuracion, setValidacionDuracion] = useState<{
    valida: boolean;
    mensaje?: string;
    horas: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
    clearErrors
  } = useForm<GuardiaFormData>({
    resolver: zodResolver(guardiaSchema)
  });

  const watchedValues = watch();
  const profesionalSeleccionado = profesionales.find(p => p.id === watchedValues.profesionalId);
  const tipoGuardiaSeleccionado = watchedValues.tipo;

  // Calcular información automática cuando cambian las fechas
  React.useEffect(() => {
    if (fechaInicio && fechaFin) {
      setValue('fechaInicio', fechaInicio);
      setValue('fechaFin', fechaFin);
      
      const validacion = validarDuracionGuardia(fechaInicio, fechaFin);
      setValidacionDuracion(validacion);
      
      if (validacion.valida) {
        clearErrors(['fechaFin']);
      }
    }
  }, [fechaInicio, fechaFin, setValue, clearErrors]);

  // Calcular costo estimado
  const costoEstimado = React.useMemo(() => {
    if (profesionalSeleccionado && tipoGuardiaSeleccionado && fechaInicio) {
      const tipoDia = determinarTipoDia(fechaInicio);
      return calcularBaremo(profesionalSeleccionado.categoria, tipoGuardiaSeleccionado, tipoDia);
    }
    return 0;
  }, [profesionalSeleccionado, tipoGuardiaSeleccionado, fechaInicio, calcularBaremo]);

  // Validar límites mensuales
  const limitesValidacion = React.useMemo(() => {
    if (profesionalSeleccionado && fechaInicio) {
      const mes = fechaInicio.getMonth() + 1;
      const anio = fechaInicio.getFullYear();
      return validarLimitesGuardiasMes(
        profesionalSeleccionado.id,
        mes,
        anio,
        guardias,
        configuracion.limitesGuardias
      );
    }
    return null;
  }, [profesionalSeleccionado, fechaInicio, guardias, configuracion.limitesGuardias]);

  const onSubmit = async (data: GuardiaFormData) => {
    try {
      if (!fechaInicio || !fechaFin) {
        throw new Error('Las fechas son obligatorias');
      }

      const validacion = validarDuracionGuardia(fechaInicio, fechaFin);
      if (!validacion.valida) {
        throw new Error(validacion.mensaje);
      }

      // Crear la guardia
      addGuardia({
        profesionalId: data.profesionalId,
        tipo: data.tipo,
        fechaInicio,
        fechaFin,
        observaciones: data.observaciones,
        localizableActivada: data.localizableActivada,
        horaLlamada: data.horaLlamada,
        horaLlegada: data.horaLlegada,
        servicioAtendido: data.servicioAtendido,
        casoAtendido: data.casoAtendido
      });

      // Limpiar formulario
      reset();
      setFechaInicio(undefined);
      setFechaFin(undefined);
      setValidacionDuracion(null);

      alert('Guardia registrada exitosamente');
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const categoriasProfesionales: { value: CategoriaProfesional; label: string }[] = [
    { value: 'especialista', label: 'Médicos Especialistas' },
    { value: 'general_licenciado', label: 'Médicos Generales y Licenciados' },
    { value: 'tecnico_diplomado', label: 'Técnicos y Diplomados' },
    { value: 'auxiliar', label: 'Auxiliares' },
    { value: 'subalterno', label: 'Subalternos' },
    { value: 'odepac', label: 'ODEPAC' },
    { value: 'secre_asist_pacientes', label: 'Secretaría Asist. Pacientes' },
    { value: 'caja', label: 'Personal Caja' }
  ];

  const tiposGuardia: { value: TipoGuardia; label: string; description: string }[] = [
    { 
      value: 'fisica', 
      label: 'Física', 
      description: 'Presencia física requerida en el hospital' 
    },
    { 
      value: 'localizable', 
      label: 'Localizable', 
      description: 'Disponible por teléfono, con posible llamada' 
    },
    { 
      value: 'administrativa', 
      label: 'Administrativa/Dirección', 
      description: 'Funciones administrativas y de dirección' 
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            Registro de Nueva Guardia
          </CardTitle>
          <CardDescription>
            Complete la información para registrar una nueva guardia médica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Selección de Profesional */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="profesionalId">Profesional *</Label>
                <Select 
                  onValueChange={(value) => setValue('profesionalId', value)}
                  value={watchedValues.profesionalId || ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar profesional..." />
                  </SelectTrigger>
                  <SelectContent>
                    {profesionales
                      .filter(p => p.activo)
                      .map((profesional) => (
                        <SelectItem key={profesional.id} value={profesional.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{profesional.nombre}</span>
                            <Badge variant="secondary" className="text-xs">
                              {formatearCategoriaProfesional(profesional.categoria)}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.profesionalId && (
                  <p className="text-sm text-red-600">{errors.profesionalId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Guardia *</Label>
                <Select 
                  onValueChange={(value: TipoGuardia) => setValue('tipo', value)}
                  value={watchedValues.tipo || ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposGuardia.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        <div className="space-y-1">
                          <div className="font-medium">{tipo.label}</div>
                          <div className="text-xs text-gray-500">{tipo.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tipo && (
                  <p className="text-sm text-red-600">{errors.tipo.message}</p>
                )}
              </div>
            </div>

            {/* Información del profesional seleccionado */}
            {profesionalSeleccionado && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Categoría:</span>
                      <span>{formatearCategoriaProfesional(profesionalSeleccionado.categoria)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Servicio:</span>
                      <span>{profesionalSeleccionado.unidad_servicio}</span>
                    </div>
                    {profesionalSeleccionado.telefono && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Teléfono:</span>
                        <span>{profesionalSeleccionado.telefono}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fechas y Horas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Fecha y Hora de Inicio *</Label>
                <div className="space-y-2">
                  <Popover open={showCalendarInicio} onOpenChange={setShowCalendarInicio}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fechaInicio ? (
                          format(fechaInicio, 'PPP', { locale: es })
                        ) : (
                          <span>Seleccionar fecha...</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={fechaInicio}
                        onSelect={(date) => {
                          setFechaInicio(date);
                          setShowCalendarInicio(false);
                        }}
                        disabled={(date) => date < new Date('2024-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    onChange={(e) => {
                      if (fechaInicio && e.target.value) {
                        const [hours, minutes] = e.target.value.split(':');
                        const newDate = new Date(fechaInicio);
                        newDate.setHours(parseInt(hours), parseInt(minutes));
                        setFechaInicio(newDate);
                      }
                    }}
                    value={fechaInicio ? format(fechaInicio, 'HH:mm') : ''}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fecha y Hora de Fin *</Label>
                <div className="space-y-2">
                  <Popover open={showCalendarFin} onOpenChange={setShowCalendarFin}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fechaFin ? (
                          format(fechaFin, 'PPP', { locale: es })
                        ) : (
                          <span>Seleccionar fecha...</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={fechaFin}
                        onSelect={(date) => {
                          setFechaFin(date);
                          setShowCalendarFin(false);
                        }}
                        disabled={(date) => date < new Date('2024-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    onChange={(e) => {
                      if (fechaFin && e.target.value) {
                        const [hours, minutes] = e.target.value.split(':');
                        const newDate = new Date(fechaFin);
                        newDate.setHours(parseInt(hours), parseInt(minutes));
                        setFechaFin(newDate);
                      }
                    }}
                    value={fechaFin ? format(fechaFin, 'HH:mm') : ''}
                  />
                </div>
              </div>
            </div>

            {/* Validación de duración */}
            {validacionDuracion && (
              <Alert className={validacionDuracion.valida ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <div className="flex items-center gap-2">
                  {validacionDuracion.valida ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={validacionDuracion.valida ? 'text-green-700' : 'text-red-700'}>
                    {validacionDuracion.valida ? (
                      <div className="space-y-1">
                        <div>Duración válida: {validacionDuracion.horas} horas</div>
                        {fechaInicio && (
                          <div className="text-sm">
                            Tipo de día: <Badge variant="secondary">
                              {determinarTipoDia(fechaInicio) === 'ordinario' ? 'Ordinario' :
                               determinarTipoDia(fechaInicio) === 'fin_semana' ? 'Fin de Semana' : 'Festivo'}
                            </Badge>
                            {costoEstimado > 0 && (
                              <span className="ml-2">
                                Costo estimado: <span className="font-semibold">{costoEstimado.toLocaleString()} XAF</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      validacionDuracion.mensaje
                    )}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* Validación de límites mensuales */}
            {limitesValidacion && !limitesValidacion.valido && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700">
                  <strong>Advertencia:</strong> {limitesValidacion.mensaje}
                </AlertDescription>
              </Alert>
            )}

            {/* Campos específicos para guardia localizable */}
            {tipoGuardiaSeleccionado === 'localizable' && (
              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle className="text-sm">Configuración Guardia Localizable</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="localizableActivada"
                      checked={watchedValues.localizableActivada || false}
                      onCheckedChange={(checked) => setValue('localizableActivada', !!checked)}
                    />
                    <Label htmlFor="localizableActivada" className="text-sm">
                      Llamada asistida (20% adicional)
                    </Label>
                  </div>

                  {watchedValues.localizableActivada && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="horaLlamada">Hora de Llamada</Label>
                        <Input
                          type="datetime-local"
                          {...register('horaLlamada', { valueAsDate: true })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="horaLlegada">Hora de Llegada</Label>
                        <Input
                          type="datetime-local"
                          {...register('horaLlegada', { valueAsDate: true })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="servicioAtendido">Servicio Atendido</Label>
                        <Input
                          {...register('servicioAtendido')}
                          placeholder="Ej: Urgencias, UCI..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="casoAtendido">Caso Atendido</Label>
                        <Input
                          {...register('casoAtendido')}
                          placeholder="Descripción breve del caso..."
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Observaciones */}
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                {...register('observaciones')}
                placeholder="Observaciones adicionales sobre la guardia..."
                rows={3}
              />
              {errors.observaciones && (
                <p className="text-sm text-red-600">{errors.observaciones.message}</p>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setFechaInicio(undefined);
                  setFechaFin(undefined);
                  setValidacionDuracion(null);
                }}
              >
                Limpiar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !validacionDuracion?.valida}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Registrar Guardia
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegistroGuardias;
