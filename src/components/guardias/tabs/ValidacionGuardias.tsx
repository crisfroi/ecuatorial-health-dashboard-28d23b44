import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useGuardiasStore } from "@/stores/useGuardiasStore";
import {
  mapWorkflowToEtapa,
  mapEtapaToWorkflow,
  getWorkflowDisplayName,
  EtapaWorkflow,
  isValidWorkflowStage
} from "@/utils/validacionHelpers";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  User,
  Calendar,
  MapPin,
  MessageSquare,
  Eye,
  Plus,
  ArrowRight,
  Filter
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ValidacionGuardiasProps {
  selectedMonth: number;
  selectedYear: number;
  selectedCenter: string | null;
  userRole: string;
}

export const ValidacionGuardias: React.FC<ValidacionGuardiasProps> = ({
  selectedMonth,
  selectedYear,
  selectedCenter,
  userRole
}) => {
  const { toast } = useToast();
  const {
    validaciones,
    guardias,
    loading,
    fetchValidaciones,
    fetchGuardias,
    createValidacion,
    updateValidacion,
    aprobarValidacion,
    rechazarValidacion
  } = useGuardiasStore();

  const [selectedTab, setSelectedTab] = useState('revision_inicial');
  const [selectedValidacion, setSelectedValidacion] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [comentarios, setComentarios] = useState('');
  const [filtroResultado, setFiltroResultado] = useState<string>('todos');
  
  const [formData, setFormData] = useState({
    guardia_id: '',
    etapa: 'revision_inicial' as EtapaWorkflow,
    resultado: '',
    comentario: '',
    firma: ''
  });

  useEffect(() => {
    fetchValidaciones(selectedMonth, selectedYear, selectedCenter);
    fetchGuardias(selectedMonth, selectedYear, selectedCenter);
  }, [selectedMonth, selectedYear, selectedCenter]);

  // Agrupar validaciones por etapa (mapear de DB a workflow)
  const validacionesRevisionInicial = validaciones.filter(v => mapEtapaToWorkflow(v.etapa) === 'revision_inicial');
  const validacionesSupervisionTecnica = validaciones.filter(v => mapEtapaToWorkflow(v.etapa) === 'supervision_tecnica');
  const validacionesAprobacionFinal = validaciones.filter(v => mapEtapaToWorkflow(v.etapa) === 'aprobacion_final');

  // Filtrar por resultado si es necesario
  const getValidacionesFiltradas = (validacionesEtapa: any[]) => {
    if (filtroResultado === 'todos') return validacionesEtapa;
    return validacionesEtapa.filter(v => v.resultado === filtroResultado);
  };

  // Obtener guardias que necesitan validación (sin validaciones en la etapa actual)
  const getGuardiasParaValidar = (etapa: string) => {
    const guardiasConValidacion = validaciones
      .filter(v => v.etapa === etapa)
      .map(v => v.guardia_id);
    
    return guardias.filter(g => !guardiasConValidacion.includes(g.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedValidacion) {
        await updateValidacion(selectedValidacion.id, {
          resultado: formData.resultado,
          comentario: formData.comentario,
          fecha: new Date().toISOString()
        });
        toast({
          title: "Validación actualizada",
          description: "La validación ha sido actualizada correctamente.",
        });
      } else {
        // Map frontend workflow stage to database etapa value
        const mappedEtapa = mapWorkflowToEtapa(formData.etapa);
        console.log('🔄 Creating validation with mapped etapa:', formData.etapa, '→', mappedEtapa);

        await createValidacion({
          guardia_id: formData.guardia_id,
          etapa: mappedEtapa,
          resultado: formData.resultado,
          comentario: formData.comentario,
          firma: formData.firma
        });
        toast({
          title: "Validación registrada",
          description: "La nueva validación ha sido registrada correctamente.",
        });
      }
      
      setIsCreateDialogOpen(false);
      setSelectedValidacion(null);
      resetForm();
      fetchValidaciones(selectedMonth, selectedYear, selectedCenter);
    } catch (error: any) {
      console.error('❌ Error in validacion form submission:', error);
      const errorMessage = error?.message || error?.toString() || "Ha ocurrido un error al procesar la solicitud.";
      toast({
        title: "Error al procesar validación",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleAprobar = async (validacionId: string) => {
    try {
      await aprobarValidacion(validacionId, comentarios);
      toast({
        title: "Validación aprobada",
        description: "La validación ha sido aprobada correctamente.",
      });
      setComentarios('');
      fetchValidaciones(selectedMonth, selectedYear, selectedCenter);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo aprobar la validación.",
        variant: "destructive",
      });
    }
  };

  const handleRechazar = async (validacionId: string) => {
    if (!comentarios.trim()) {
      toast({
        title: "Comentarios requeridos",
        description: "Debe proporcionar comentarios al rechazar una validación.",
        variant: "destructive",
      });
      return;
    }

    try {
      await rechazarValidacion(validacionId, comentarios);
      toast({
        title: "Validación rechazada",
        description: "La validación ha sido rechazada.",
      });
      setComentarios('');
      fetchValidaciones(selectedMonth, selectedYear, selectedCenter);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo rechazar la validación.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (validacion: any) => {
    setSelectedValidacion(validacion);
    setFormData({
      guardia_id: validacion.guardia_id,
      etapa: validacion.etapa,
      resultado: validacion.resultado || '',
      comentario: validacion.comentario || '',
      firma: validacion.firma || ''
    });
    setIsCreateDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      guardia_id: '',
      etapa: 'revision_inicial' as EtapaWorkflow,
      resultado: '',
      comentario: '',
      firma: ''
    });
  };

  const getEtapaBadge = (etapa: string) => {
    switch (etapa) {
      case 'revision_inicial':
        return <Badge className="bg-blue-100 text-blue-800">Revisión Inicial</Badge>;
      case 'supervision_tecnica':
        return <Badge className="bg-yellow-100 text-yellow-800">Supervisión Técnica</Badge>;
      case 'aprobacion_final':
        return <Badge className="bg-green-100 text-green-800">Aprobación Final</Badge>;
      default:
        return <Badge variant="secondary">{etapa}</Badge>;
    }
  };

  const getResultadoBadge = (resultado: string) => {
    switch (resultado) {
      case 'aprobada':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprobada</Badge>;
      case 'rechazada':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rechazada</Badge>;
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'revision':
        return <Badge className="bg-orange-100 text-orange-800"><AlertTriangle className="w-3 h-3 mr-1" />En Revisión</Badge>;
      default:
        return <Badge variant="secondary">{resultado || 'Sin resultado'}</Badge>;
    }
  };

  const canCreateValidacion = ['SUPER_ADMINISTRADOR', 'DIRECTIVO_CENTRO_SANITARIO', 'REVISOR_SOLICITUDES'].includes(userRole);
  const canApproveValidacion = ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL'].includes(userRole);

  const renderValidacionCard = (validacion: any) => {
    // Buscar la guardia relacionada
    const guardia = guardias.find(g => g.id === validacion.guardia_id);
    
    return (
      <Card key={validacion.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <h3 className="font-semibold text-lg">
                  {guardia ? `Guardia ${new Date(guardia.fecha_inicio).toLocaleDateString('es-ES')}` : 'Guardia no encontrada'}
                </h3>
                {getEtapaBadge(validacion.etapa)}
                {getResultadoBadge(validacion.resultado)}
              </div>
              
              {guardia && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(guardia.fecha_inicio).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{guardia.tipo} - {guardia.tipo_dia}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>{guardia.profesional?.nombre_completo || 'Profesional no identificado'}</span>
                  </div>
                </div>
              )}

              {validacion.comentario && (
                <div className="mb-4">
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    {validacion.comentario}
                  </p>
                </div>
              )}

              <div className="text-xs text-gray-500">
                <p>Validado: {validacion.fecha ? new Date(validacion.fecha).toLocaleString('es-ES') : 'Pendiente'}</p>
                {validacion.created_at && (
                  <p>Creado: {new Date(validacion.created_at).toLocaleString('es-ES')}</p>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedValidacion(validacion);
                  setIsDetailDialogOpen(true);
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
              
              {canCreateValidacion && !validacion.resultado && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(validacion)}
                >
                  <FileText className="w-4 h-4" />
                </Button>
              )}
              
              {canApproveValidacion && validacion.resultado === 'pendiente' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleAprobar(validacion.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRechazar(validacion.id)}
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sistema de Validación por Etapas</h2>
          <p className="text-gray-600">
            Validación de guardias médicas por etapas para {selectedMonth}/{selectedYear}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {canCreateValidacion && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setSelectedValidacion(null); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Validación
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedValidacion ? 'Editar Validación' : 'Registrar Nueva Validación'}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Guardia</label>
                      <Select
                        value={formData.guardia_id}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, guardia_id: value }))}
                        required
                        disabled={!!selectedValidacion}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar guardia" />
                        </SelectTrigger>
                        <SelectContent>
                          {guardias.map((guardia) => (
                            <SelectItem key={guardia.id} value={guardia.id}>
                              {new Date(guardia.fecha_inicio).toLocaleDateString('es-ES')} - 
                              {guardia.profesional?.nombre_completo || 'Sin profesional'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Etapa</label>
                      <Select
                        value={formData.etapa}
                        onValueChange={(value: 'revision_inicial' | 'supervision_tecnica' | 'aprobacion_final') => 
                          setFormData(prev => ({ ...prev, etapa: value }))
                        }
                        disabled={!!selectedValidacion}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="revision_inicial">Revisión Inicial</SelectItem>
                          <SelectItem value="supervision_tecnica">Supervisión Técnica</SelectItem>
                          <SelectItem value="aprobacion_final">Aprobación Final</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Resultado</label>
                    <Select
                      value={formData.resultado}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, resultado: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar resultado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aprobada">Aprobada</SelectItem>
                        <SelectItem value="rechazada">Rechazada</SelectItem>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="revision">En Revisión</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Comentarios</label>
                    <Textarea
                      value={formData.comentario}
                      onChange={(e) => setFormData(prev => ({ ...prev, comentario: e.target.value }))}
                      placeholder="Comentarios sobre la validación..."
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Firma Digital</label>
                    <Textarea
                      value={formData.firma}
                      onChange={(e) => setFormData(prev => ({ ...prev, firma: e.target.value }))}
                      placeholder="Firma digital o identificación del validador..."
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {selectedValidacion ? 'Actualizar' : 'Registrar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Estadísticas por etapa */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revisión Inicial</p>
                <p className="text-2xl font-bold text-blue-600">{validacionesRevisionInicial.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Supervisión Técnica</p>
                <p className="text-2xl font-bold text-yellow-600">{validacionesSupervisionTecnica.length}</p>
              </div>
              <Eye className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aprobación Final</p>
                <p className="text-2xl font-bold text-green-600">{validacionesAprobacionFinal.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Validaciones</p>
                <p className="text-2xl font-bold text-purple-600">{validaciones.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={filtroResultado} onValueChange={setFiltroResultado}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por resultado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los resultados</SelectItem>
                <SelectItem value="aprobada">Aprobadas</SelectItem>
                <SelectItem value="rechazada">Rechazadas</SelectItem>
                <SelectItem value="pendiente">Pendientes</SelectItem>
                <SelectItem value="revision">En Revisión</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="revision_inicial" className="relative">
            Revisión Inicial
            {validacionesRevisionInicial.length > 0 && (
              <Badge className="ml-2 bg-blue-500 text-white">
                {validacionesRevisionInicial.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="supervision_tecnica" className="relative">
            Supervisión Técnica
            {validacionesSupervisionTecnica.length > 0 && (
              <Badge className="ml-2 bg-yellow-500 text-white">
                {validacionesSupervisionTecnica.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="aprobacion_final" className="relative">
            Aprobación Final
            {validacionesAprobacionFinal.length > 0 && (
              <Badge className="ml-2 bg-green-500 text-white">
                {validacionesAprobacionFinal.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revision_inicial" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando validaciones...</p>
            </div>
          ) : getValidacionesFiltradas(validacionesRevisionInicial).length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay validaciones de revisión inicial
                </h3>
                <p className="text-gray-600 mb-4">
                  {filtroResultado !== 'todos' 
                    ? 'No hay validaciones que coincidan con el filtro aplicado.' 
                    : 'Comenzar validaciones en esta etapa.'}
                </p>
                {canCreateValidacion && filtroResultado === 'todos' && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primera Validación
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {getValidacionesFiltradas(validacionesRevisionInicial).map(renderValidacionCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="supervision_tecnica" className="space-y-4">
          {getValidacionesFiltradas(validacionesSupervisionTecnica).length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay validaciones de supervisión técnica
                </h3>
                <p className="text-gray-600">
                  Las validaciones de supervisión técnica aparecerán aquí.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {getValidacionesFiltradas(validacionesSupervisionTecnica).map(renderValidacionCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="aprobacion_final" className="space-y-4">
          {getValidacionesFiltradas(validacionesAprobacionFinal).length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay validaciones de aprobación final
                </h3>
                <p className="text-gray-600">
                  Las validaciones de aprobación final aparecerán aquí.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {getValidacionesFiltradas(validacionesAprobacionFinal).map(renderValidacionCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de detalle */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Detalle de la Validación
            </DialogTitle>
          </DialogHeader>
          
          {selectedValidacion && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Etapa</h4>
                  {getEtapaBadge(selectedValidacion.etapa)}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Resultado</h4>
                  {getResultadoBadge(selectedValidacion.resultado)}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Guardia Asociada</h4>
                {(() => {
                  const guardia = guardias.find(g => g.id === selectedValidacion.guardia_id);
                  return guardia ? (
                    <div className="bg-gray-50 p-3 rounded-lg text-sm">
                      <p><strong>Fecha:</strong> {new Date(guardia.fecha_inicio).toLocaleDateString('es-ES')}</p>
                      <p><strong>Tipo:</strong> {guardia.tipo} - {guardia.tipo_dia}</p>
                      <p><strong>Profesional:</strong> {guardia.profesional?.nombre_completo || 'No identificado'}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Guardia no encontrada</p>
                  );
                })()}
              </div>

              {selectedValidacion.comentario && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Comentarios</h4>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedValidacion.comentario}</p>
                </div>
              )}

              {selectedValidacion.firma && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Firma</h4>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedValidacion.firma}</p>
                </div>
              )}

              <div className="text-xs text-gray-500 pt-2 border-t">
                <p>Creado: {selectedValidacion.created_at ? new Date(selectedValidacion.created_at).toLocaleString('es-ES') : 'Sin fecha'}</p>
                {selectedValidacion.fecha && (
                  <p>Validado: {new Date(selectedValidacion.fecha).toLocaleString('es-ES')}</p>
                )}
              </div>

              {canApproveValidacion && selectedValidacion.resultado === 'pendiente' && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-gray-900 mb-2">Acciones de Validación</h4>
                  <div className="space-y-2">
                    <Textarea
                      value={comentarios}
                      onChange={(e) => setComentarios(e.target.value)}
                      placeholder="Comentarios adicionales..."
                      rows={2}
                    />
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleAprobar(selectedValidacion.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Aprobar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleRechazar(selectedValidacion.id)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
