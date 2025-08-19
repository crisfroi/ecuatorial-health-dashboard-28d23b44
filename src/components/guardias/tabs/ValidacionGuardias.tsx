import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useGuardiasStore } from "@/stores/useGuardiasStore";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  User,
  Calendar,
  MapPin,
  MessageSquare
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
    profesionales,
    loading,
    fetchValidaciones,
    fetchGuardias,
    createValidacion,
    updateValidacion,
    aprobarValidacion,
    rechazarValidacion
  } = useGuardiasStore();

  const [selectedTab, setSelectedTab] = useState('pendientes');
  const [selectedValidacion, setSelectedValidacion] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [comentarios, setComentarios] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  useEffect(() => {
    fetchValidaciones(selectedMonth, selectedYear, selectedCenter);
    fetchGuardias(selectedMonth, selectedYear, selectedCenter);
  }, [selectedMonth, selectedYear, selectedCenter]);

  const validacionesFiltradas = validaciones.filter(validacion => {
    if (filtroEstado === 'todos') return true;
    return validacion.estado === filtroEstado;
  });

  const validacionesPendientes = validaciones.filter(v => v.estado === 'PENDIENTE');
  const validacionesAprobadas = validaciones.filter(v => v.estado === 'APROBADO');
  const validacionesRechazadas = validaciones.filter(v => v.estado === 'RECHAZADO');

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

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'APROBADO':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprobado</Badge>;
      case 'RECHAZADO':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rechazado</Badge>;
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  const getPrioridadBadge = (prioridad: string) => {
    switch (prioridad) {
      case 'ALTA':
        return <Badge className="bg-red-100 text-red-800">Alta</Badge>;
      case 'MEDIA':
        return <Badge className="bg-yellow-100 text-yellow-800">Media</Badge>;
      case 'BAJA':
        return <Badge className="bg-green-100 text-green-800">Baja</Badge>;
      default:
        return <Badge variant="secondary">{prioridad}</Badge>;
    }
  };

  const canValidate = ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL', 'REVISOR_SOLICITUDES'].includes(userRole);
  const canViewAll = ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL'].includes(userRole);

  const renderValidacionCard = (validacion: any) => (
    <Card key={validacion.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="font-semibold text-lg">
                Validación #{validacion.numero_validacion}
              </h3>
              {getEstadoBadge(validacion.estado)}
              {getPrioridadBadge(validacion.prioridad)}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Período: {validacion.mes}/{validacion.ano}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>{validacion.centro?.nombre}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Solicitado por: {validacion.solicitante?.nombre_completo}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Fecha: {new Date(validacion.fecha_solicitud).toLocaleDateString('es-ES')}</span>
              </div>
            </div>

            {validacion.descripcion && (
              <div className="mb-4">
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {validacion.descripcion}
                </p>
              </div>
            )}

            {validacion.observaciones && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Observaciones:</h4>
                <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                  {validacion.observaciones}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedValidacion(validacion);
              setIsDetailDialogOpen(true);
            }}
          >
            <FileText className="w-4 h-4 mr-1" />
            Ver Detalles
          </Button>

          {canValidate && validacion.estado === 'PENDIENTE' && (
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => handleAprobar(validacion.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Aprobar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setSelectedValidacion(validacion);
                  setIsDetailDialogOpen(true);
                }}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Rechazar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Validación de Guardias</h2>
          <p className="text-gray-600">
            Revisión y validación de guardias médicas para {selectedMonth}/{selectedYear}
          </p>
        </div>
      </div>

      {/* Estadísticas de validación */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{validacionesPendientes.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aprobadas</p>
                <p className="text-2xl font-bold text-green-600">{validacionesAprobadas.length}</p>
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
                <p className="text-2xl font-bold text-red-600">{validacionesRechazadas.length}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{validaciones.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="pendientes" className="relative">
            Pendientes
            {validacionesPendientes.length > 0 && (
              <Badge className="ml-2 bg-yellow-500 text-white">
                {validacionesPendientes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="aprobadas">Aprobadas</TabsTrigger>
          <TabsTrigger value="rechazadas">Rechazadas</TabsTrigger>
          <TabsTrigger value="todas">Todas</TabsTrigger>
        </TabsList>

        <TabsContent value="pendientes" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando validaciones...</p>
            </div>
          ) : validacionesPendientes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay validaciones pendientes
                </h3>
                <p className="text-gray-600">
                  Todas las validaciones han sido procesadas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {validacionesPendientes.map(renderValidacionCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="aprobadas" className="space-y-4">
          {validacionesAprobadas.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay validaciones aprobadas
                </h3>
                <p className="text-gray-600">
                  Las validaciones aprobadas aparecerán aquí.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {validacionesAprobadas.map(renderValidacionCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rechazadas" className="space-y-4">
          {validacionesRechazadas.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay validaciones rechazadas
                </h3>
                <p className="text-gray-600">
                  Las validaciones rechazadas aparecerán aquí.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {validacionesRechazadas.map(renderValidacionCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="todas" className="space-y-4">
          {validaciones.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay validaciones
                </h3>
                <p className="text-gray-600">
                  No se han registrado validaciones para este período.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {validaciones.map(renderValidacionCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de detalle */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Detalle de Validación #{selectedValidacion?.numero_validacion}
            </DialogTitle>
          </DialogHeader>
          
          {selectedValidacion && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Estado</h4>
                  {getEstadoBadge(selectedValidacion.estado)}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Prioridad</h4>
                  {getPrioridadBadge(selectedValidacion.prioridad)}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Descripción</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {selectedValidacion.descripcion || 'No hay descripción disponible'}
                </p>
              </div>

              {selectedValidacion.observaciones && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Observaciones</h4>
                  <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                    {selectedValidacion.observaciones}
                  </p>
                </div>
              )}

              {canValidate && selectedValidacion.estado === 'PENDIENTE' && (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comentarios de validación
                    </label>
                    <Textarea
                      value={comentarios}
                      onChange={(e) => setComentarios(e.target.value)}
                      placeholder="Ingrese sus comentarios..."
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsDetailDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => {
                        handleRechazar(selectedValidacion.id);
                        setIsDetailDialogOpen(false);
                      }}
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Rechazar
                    </Button>
                    <Button
                      onClick={() => {
                        handleAprobar(selectedValidacion.id);
                        setIsDetailDialogOpen(false);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Aprobar
                    </Button>
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
