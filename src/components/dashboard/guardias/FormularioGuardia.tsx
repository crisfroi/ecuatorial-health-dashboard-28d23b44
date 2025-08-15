import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, AlertCircle, Save, X } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { guardiaSchema } from '@/schemas/guardiasSchemas';
import { useCreateGuardia, useUpdateGuardia } from '@/hooks/useGuardSystem';
import { useHospitalGuardSystem } from '@/hooks/useHospitalGuardSystem';
import ProfessionalSelector from './ProfessionalSelector';
import { Guardia, TipoGuardia, GuardiaFormData, Profesional } from '@/types/guardias';
import { format, addHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface FormularioGuardiaProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date | null;
  editingGuard?: Guardia | null;
  hospitalId: string;
}

const FormularioGuardia: React.FC<FormularioGuardiaProps> = ({
  isOpen,
  onClose,
  selectedDate,
  editingGuard,
  hospitalId
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProfessionalSelector, setShowProfessionalSelector] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<Profesional | null>(null);

  const createGuardiaMutation = useCreateGuardia();
  const updateGuardiaMutation = useUpdateGuardia();

  const { hospitalProfessionals, loadingProfessionals } = useHospitalGuardSystem();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<GuardiaFormData>({
    resolver: zodResolver(guardiaSchema),
    defaultValues: {
      profesionalId: '',
      tipo: 'fisica',
      fechaInicio: selectedDate || new Date(),
      fechaFin: selectedDate ? addHours(selectedDate, 12) : addHours(new Date(), 12),
      observaciones: '',
      localizableActivada: false,
      horaLlamada: undefined,
      horaLlegada: undefined,
      servicioAtendido: '',
      casoAtendido: ''
    }
  });

  // Reset form when dialog opens/closes or editing guard changes
  useEffect(() => {
    if (isOpen) {
      if (editingGuard) {
        reset({
          profesionalId: editingGuard.profesionalId,
          tipo: editingGuard.tipo,
          fechaInicio: editingGuard.fechaInicio,
          fechaFin: editingGuard.fechaFin,
          observaciones: editingGuard.observaciones || '',
          localizableActivada: editingGuard.localizableActivada || false,
          horaLlamada: editingGuard.horaLlamada,
          horaLlegada: editingGuard.horaLlegada,
          servicioAtendido: editingGuard.servicioAtendido || '',
          casoAtendido: editingGuard.casoAtendido || ''
        });
      } else if (selectedDate) {
        reset({
          profesionalId: '',
          tipo: 'fisica',
          fechaInicio: selectedDate,
          fechaFin: addHours(selectedDate, 12),
          observaciones: '',
          localizableActivada: false,
          horaLlamada: undefined,
          horaLlegada: undefined,
          servicioAtendido: '',
          casoAtendido: ''
        });
      }
    }
  }, [isOpen, editingGuard, selectedDate, reset]);

  const watchedTipo = watch('tipo');
  const watchedLocalizableActivada = watch('localizableActivada');

  // Auto-adjust end time when type changes
  useEffect(() => {
    const fechaInicio = watch('fechaInicio');
    if (fechaInicio) {
      let horasDefault = 12;
      if (watchedTipo === 'administrativa') horasDefault = 8;
      if (watchedTipo === 'localizable') horasDefault = 24;
      
      setValue('fechaFin', addHours(fechaInicio, horasDefault));
    }
  }, [watchedTipo, setValue, watch]);

  const onSubmit = async (data: GuardiaFormData) => {
    setIsSubmitting(true);
    
    try {
      const guardiaData = {
        profesionalGuardiaId: data.profesionalId,
        centroSaludId: hospitalId,
        tipo: data.tipo,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        observaciones: data.observaciones,
        localizableActivada: data.localizableActivada,
        servicioAtendido: data.servicioAtendido,
        casoAtendido: data.casoAtendido
      };

      if (editingGuard) {
        await updateGuardiaMutation.mutateAsync({
          id: editingGuard.id,
          updates: {
            tipo: data.tipo,
            fechaInicio: data.fechaInicio,
            fechaFin: data.fechaFin,
            observaciones: data.observaciones,
            localizableActivada: data.localizableActivada,
            horaLlamada: data.horaLlamada,
            horaLlegada: data.horaLlegada,
            servicioAtendido: data.servicioAtendido,
            casoAtendido: data.casoAtendido
          }
        });
        toast.success('Guardia actualizada exitosamente');
      } else {
        await createGuardiaMutation.mutateAsync(guardiaData);
        toast.success('Guardia creada exitosamente');
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error saving guard:', error);
      toast.error(error.message || 'Error al guardar la guardia');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTipoGuardiaLabel = (tipo: TipoGuardia) => {
    switch (tipo) {
      case 'fisica': return 'Guardia Física';
      case 'localizable': return 'Guardia Localizable';
      case 'administrativa': return 'Guardia Administrativa';
      default: return tipo;
    }
  };

  const getTipoGuardiaDescription = (tipo: TipoGuardia) => {
    switch (tipo) {
      case 'fisica': 
        return 'Presencia física obligatoria en el centro durante toda la guardia';
      case 'localizable': 
        return 'Disponibilidad telefónica, con obligación de acudir si es requerido';
      case 'administrativa': 
        return 'Guardia para gestión administrativa y supervisión';
      default: 
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-guinea-teal" />
            {editingGuard ? 'Editar Guardia' : 'Nueva Guardia'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Professional Selection */}
          <div className="space-y-2">
            <Label>Profesional *</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 justify-start h-10"
                onClick={() => setShowProfessionalSelector(true)}
                disabled={loadingProfessionals}
              >
                {selectedProfessional ? (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-guinea-teal" />
                    <div className="text-left">
                      <div className="font-medium">{selectedProfessional.nombre}</div>
                      <div className="text-xs text-gray-500">
                        {selectedProfessional.unidad_servicio} • {selectedProfessional.categoria}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    Seleccionar profesional...
                  </>
                )}
              </Button>
              {selectedProfessional && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedProfessional(null);
                    setValue('profesionalId', '');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <Controller
              name="profesionalId"
              control={control}
              render={() => null}
            />
            {errors.profesionalId && (
              <p className="text-sm text-red-600">{errors.profesionalId.message}</p>
            )}
          </div>

          {/* Guard Type */}
          <div className="space-y-3">
            <Label>Tipo de Guardia *</Label>
            <Controller
              name="tipo"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(['fisica', 'localizable', 'administrativa'] as TipoGuardia[]).map((tipo) => (
                    <Card
                      key={tipo}
                      className={`cursor-pointer transition-all ${
                        field.value === tipo
                          ? 'border-guinea-teal bg-guinea-light-teal/10'
                          : 'hover:border-gray-300'
                      }`}
                      onClick={() => field.onChange(tipo)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <input
                            type="radio"
                            checked={field.value === tipo}
                            onChange={() => field.onChange(tipo)}
                            className="text-guinea-teal"
                          />
                          <span className="font-medium">{getTipoGuardiaLabel(tipo)}</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {getTipoGuardiaDescription(tipo)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            />
            {errors.tipo && (
              <p className="text-sm text-red-600">{errors.tipo.message}</p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fechaInicio">Fecha y Hora Inicio *</Label>
              <Controller
                name="fechaInicio"
                control={control}
                render={({ field }) => (
                  <Input
                    type="datetime-local"
                    value={format(field.value, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                  />
                )}
              />
              {errors.fechaInicio && (
                <p className="text-sm text-red-600">{errors.fechaInicio.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaFin">Fecha y Hora Fin *</Label>
              <Controller
                name="fechaFin"
                control={control}
                render={({ field }) => (
                  <Input
                    type="datetime-local"
                    value={format(field.value, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                  />
                )}
              />
              {errors.fechaFin && (
                <p className="text-sm text-red-600">{errors.fechaFin.message}</p>
              )}
            </div>
          </div>

          {/* Duration Info */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                Duración estimada: {
                  ((watch('fechaFin')?.getTime() || 0) - (watch('fechaInicio')?.getTime() || 0)) / (1000 * 60 * 60)
                } horas
              </span>
            </div>
          </div>

          {/* Localizable specific fields */}
          {watchedTipo === 'localizable' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuración Localizable</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Controller
                    name="localizableActivada"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label>Guardia localizable fue activada (hubo llamada)</Label>
                </div>

                {watchedLocalizableActivada && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="horaLlamada">Hora de Llamada</Label>
                      <Controller
                        name="horaLlamada"
                        control={control}
                        render={({ field }) => (
                          <Input
                            type="datetime-local"
                            value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="horaLlegada">Hora de Llegada</Label>
                      <Controller
                        name="horaLlegada"
                        control={control}
                        render={({ field }) => (
                          <Input
                            type="datetime-local"
                            value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="servicioAtendido">Servicio Atendido</Label>
                      <Controller
                        name="servicioAtendido"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            placeholder="Ej: Urgencias, UCI, Quirófano..."
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="casoAtendido">Caso Atendido</Label>
                      <Controller
                        name="casoAtendido"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            placeholder="Descripción breve del caso..."
                          />
                        )}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Observations */}
          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Controller
              name="observaciones"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder="Observaciones adicionales sobre la guardia..."
                  rows={3}
                />
              )}
            />
            {errors.observaciones && (
              <p className="text-sm text-red-600">{errors.observaciones.message}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-guinea-teal hover:bg-guinea-dark-teal"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting 
                ? 'Guardando...' 
                : editingGuard 
                  ? 'Actualizar Guardia'
                  : 'Crear Guardia'
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FormularioGuardia;
