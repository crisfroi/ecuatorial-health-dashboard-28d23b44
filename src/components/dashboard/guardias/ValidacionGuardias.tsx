import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  FileText, 
  AlertTriangle,
  Eye,
  MessageSquare,
  Calendar,
  Building
} from 'lucide-react';
import { useGuardias, useValidaciones, useCreateValidacion } from '@/hooks/useGuardSystem';
import { useGuardiasStore } from '@/stores/useGuardiasStore';
import { 
  Guardia, 
  Validacion, 
  EtapaValidacion, 
  EstadoValidacion 
} from '@/types/guardias';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const ETAPAS_VALIDACION: { 
  value: EtapaValidacion; 
  label: string; 
  description: string;
  color: string;
}[] = [
  { 
    value: 'dir_medica', 
    label: 'Dirección Médica', 
    description: 'Validación médica de la guardia',
    color: 'bg-blue-100 text-blue-800'
  },
  { 
    value: 'dir_admin', 
    label: 'Dirección Administrativa', 
    description: 'Aprobación administrativa',
    color: 'bg-purple-100 text-purple-800'
  },
  { 
    value: 'dir_enfermeria', 
    label: 'Dirección de Enfermería', 
    description: 'Validación de personal de enfermería',
    color: 'bg-pink-100 text-pink-800'
  },
  { 
    value: 'jefe_rrhh', 
    label: 'Jefe de RRHH', 
    description: 'Validación de recursos humanos',
    color: 'bg-orange-100 text-orange-800'
  },
  { 
    value: 'admin_hospital', 
    label: 'Administración Hospital', 
    description: 'Aprobación final del hospital',
    color: 'bg-green-100 text-green-800'
  },
  { 
    value: 'dir_gerente', 
    label: 'Dirección Gerente', 
    description: 'Validación gerencial',
    color: 'bg-indigo-100 text-indigo-800'
  },
  { 
    value: 'dg_coordinacion', 
    label: 'DG Coordinación', 
    description: 'Coordinación general',
    color: 'bg-teal-100 text-teal-800'
  }
];

const ValidacionGuardias: React.FC = () => {
  const { selectedHospital } = useGuardiasStore();
  const [selectedGuardia, setSelectedGuardia] = useState<Guardia | null>(null);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationForm, setValidationForm] = useState({
    etapa: '' as EtapaValidacion,
    resultado: '' as 'aprobada' | 'rechazada',
    comentario: ''
  });
  const [filterEstado, setFilterEstado] = useState<EstadoValidacion | 'all'>('all');

  const { data: guardias = [], isLoading, error: guardiasError } = useGuardias({
    centroId: selectedHospital,
    validacionEstado: filterEstado === 'all' ? undefined : filterEstado
  });

  const { data: validaciones = [], error: validacionesError } = useValidaciones();

  // Show warning if database tables don't exist yet
  React.useEffect(() => {
    if (guardiasError) {
      console.warn('Guardias error in ValidacionGuardias:', guardiasError);
    }
    if (validacionesError) {
      console.warn('Validaciones error in ValidacionGuardias:', validacionesError);
    }
  }, [guardiasError, validacionesError]);
  const createValidacionMutation = useCreateValidacion();

  const getValidationsByGuard = (guardiaId: string) => {
    return validaciones.filter(v => v.guardiaId === guardiaId)
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  };

  const getValidationProgress = (guardia: Guardia) => {
    const guardValidations = getValidationsByGuard(guardia.id);
    const completedStages = guardValidations.map(v => v.etapa);
    const progress = (completedStages.length / ETAPAS_VALIDACION.length) * 100;
    
    return {
      progress,
      completedStages,
      nextStage: ETAPAS_VALIDACION.find(e => !completedStages.includes(e.value)),
      hasRejections: guardValidations.some(v => v.resultado === 'rechazada')
    };
  };

  const handleValidate = async () => {
    if (!selectedGuardia || !validationForm.etapa || !validationForm.resultado) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    try {
      await createValidacionMutation.mutateAsync({
        guardiaId: selectedGuardia.id,
        etapa: validationForm.etapa,
        resultado: validationForm.resultado,
        comentario: validationForm.comentario
      });

      toast.success(`Guardia ${validationForm.resultado} exitosamente`);
      setShowValidationDialog(false);
      setValidationForm({ etapa: '' as EtapaValidacion, resultado: '' as 'aprobada' | 'rechazada', comentario: '' });
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar la validación');
    }
  };

  const getEstadoBadge = (estado: EstadoValidacion) => {
    switch (estado) {
      case 'pendiente':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Pendiente
        </Badge>;
      case 'validada':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Validada
        </Badge>;
      case 'rechazada':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Rechazada
        </Badge>;
      default:
        return null;
    }
  };

  const getEtapaInfo = (etapa: EtapaValidacion) => {
    return ETAPAS_VALIDACION.find(e => e.value === etapa);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-guinea-teal mx-auto"></div>
          <p className="mt-2">Cargando guardias...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Validación de Guardias</h2>
          <p className="text-gray-600">
            Sistema de validación multi-etapa para guardias médicas
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={filterEstado} onValueChange={(value) => setFilterEstado(value as EstadoValidacion | 'all')}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por estado..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las guardias</SelectItem>
              <SelectItem value="pendiente">Pendientes</SelectItem>
              <SelectItem value="validada">Validadas</SelectItem>
              <SelectItem value="rechazada">Rechazadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Guardias</p>
                <p className="text-2xl font-bold text-gray-900">{guardias.length}</p>
              </div>
              <Building className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {guardias.filter(g => g.validacionEstado === 'pendiente').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Validadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {guardias.filter(g => g.validacionEstado === 'validada').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rechazadas</p>
                <p className="text-2xl font-bold text-red-600">
                  {guardias.filter(g => g.validacionEstado === 'rechazada').length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Guards List */}
      <Card>
        <CardHeader>
          <CardTitle>Guardias para Validación</CardTitle>
        </CardHeader>
        <CardContent>
          {guardias.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No hay guardias para validar en este momento</p>
            </div>
          ) : (
            <div className="space-y-4">
              {guardias.map((guardia) => {
                const validationProgress = getValidationProgress(guardia);
                const guardValidations = getValidationsByGuard(guardia.id);
                
                return (
                  <Card key={guardia.id} className="border-l-4 border-l-guinea-teal">
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">
                              {guardia.profesional?.nombre || 'Profesional no especificado'}
                            </h3>
                            {getEstadoBadge(guardia.validacionEstado)}
                            <Badge variant="outline">
                              {guardia.tipo.charAt(0).toUpperCase() + guardia.tipo.slice(1)}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {format(guardia.fechaInicio, 'dd/MM/yyyy HH:mm', { locale: es })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{guardia.horas} horas</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4" />
                              <span>{guardia.centro?.nombre || 'Centro no especificado'}</span>
                            </div>
                          </div>

                          {/* Validation Progress */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Progreso de Validación</span>
                              <span className="text-sm text-gray-500">
                                {validationProgress.completedStages.length} / {ETAPAS_VALIDACION.length} etapas
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${
                                  validationProgress.hasRejections ? 'bg-red-500' : 'bg-guinea-teal'
                                }`}
                                style={{ width: `${validationProgress.progress}%` }}
                              />
                            </div>
                            {validationProgress.nextStage && (
                              <p className="text-xs text-gray-500 mt-1">
                                Siguiente etapa: {validationProgress.nextStage.label}
                              </p>
                            )}
                          </div>

                          {/* Recent Validations */}
                          {guardValidations.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {guardValidations.slice(0, 3).map((validation) => {
                                const etapaInfo = getEtapaInfo(validation.etapa);
                                return (
                                  <Badge 
                                    key={validation.id}
                                    variant="outline" 
                                    className={`text-xs ${
                                      validation.resultado === 'aprobada' 
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : 'bg-red-50 text-red-700 border-red-200'
                                    }`}
                                  >
                                    {etapaInfo?.label}: {validation.resultado}
                                  </Badge>
                                );
                              })}
                              {guardValidations.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{guardValidations.length - 3} más
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedGuardia(guardia);
                              // Show detailed view
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalles
                          </Button>
                          
                          {guardia.validacionEstado === 'pendiente' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedGuardia(guardia);
                                setShowValidationDialog(true);
                              }}
                              className="bg-guinea-teal hover:bg-guinea-dark-teal"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Validar
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Dialog */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Validar Guardia</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedGuardia && (
              <div className="p-3 bg-gray-50 rounded">
                <h3 className="font-medium">{selectedGuardia.profesional?.nombre}</h3>
                <p className="text-sm text-gray-600">
                  {format(selectedGuardia.fechaInicio, 'dd/MM/yyyy HH:mm', { locale: es })} - 
                  {format(selectedGuardia.fechaFin, 'dd/MM/yyyy HH:mm', { locale: es })}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Etapa de Validación *</label>
              <Select 
                value={validationForm.etapa} 
                onValueChange={(value) => setValidationForm(prev => ({ ...prev, etapa: value as EtapaValidacion }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar etapa..." />
                </SelectTrigger>
                <SelectContent>
                  {ETAPAS_VALIDACION.map((etapa) => (
                    <SelectItem key={etapa.value} value={etapa.value}>
                      <div className="flex flex-col">
                        <span>{etapa.label}</span>
                        <span className="text-xs text-gray-500">{etapa.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Resultado *</label>
              <Select 
                value={validationForm.resultado} 
                onValueChange={(value) => setValidationForm(prev => ({ ...prev, resultado: value as 'aprobada' | 'rechazada' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar resultado..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aprobada">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Aprobada
                    </div>
                  </SelectItem>
                  <SelectItem value="rechazada">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      Rechazada
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Comentarios</label>
              <Textarea
                value={validationForm.comentario}
                onChange={(e) => setValidationForm(prev => ({ ...prev, comentario: e.target.value }))}
                placeholder="Observaciones sobre la validación..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowValidationDialog(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleValidate}
                disabled={!validationForm.etapa || !validationForm.resultado}
                className="bg-guinea-teal hover:bg-guinea-dark-teal"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Procesar Validación
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ValidacionGuardias;
