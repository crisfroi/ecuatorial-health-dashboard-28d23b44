import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Play, 
  Pause, 
  RefreshCw, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { useCarnetQueue } from '@/hooks/useCarnetQueue';

const CarnetQueueProcessor = () => {
  const {
    professionalsWithoutCarnet,
    queueStatus,
    isLoadingProfessionals,
    isLoadingQueue,
    isAddingToQueue,
    isProcessingQueue,
    addToQueue,
    processQueue,
    processMultipleQueue,
    automateCarnetGeneration,
    refetchProfessionals,
    refetchQueue
  } = useCarnetQueue();

  const queueStats = {
    pendientes: queueStatus.filter(item => item.estado === 'pendiente').length,
    procesando: queueStatus.filter(item => item.estado === 'procesando').length,
    completados: queueStatus.filter(item => item.estado === 'completado').length,
    errores: queueStatus.filter(item => item.estado === 'error').length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendiente':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'procesando':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'completado':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pendiente: "bg-yellow-100 text-yellow-800",
      procesando: "bg-blue-100 text-blue-800",
      completado: "bg-green-100 text-green-800",
      error: "bg-red-100 text-red-800"
    };

    const labels = {
      pendiente: "Pendiente",
      procesando: "Procesando",
      completado: "Completado",
      error: "Error"
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const handleAddAllToQueue = () => {
    if (professionalsWithoutCarnet.length > 0) {
      const professionalIds = professionalsWithoutCarnet.map(p => p.id);
      addToQueue(professionalIds);
    }
  };

  const handleProcessMultiple = () => {
    const maxItems = Math.min(queueStats.pendientes, 5);
    processMultipleQueue(maxItems);
  };

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Procesador de Cola de Carnets
            </span>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  refetchProfessionals();
                  refetchQueue();
                }}
                variant="outline"
                size="sm"
                disabled={isLoadingProfessionals || isLoadingQueue}
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingProfessionals || isLoadingQueue ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Estadísticas de la cola */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-yellow-700">{queueStats.pendientes}</div>
              <div className="text-xs text-yellow-600">Pendientes</div>
            </div>
            
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <RefreshCw className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-blue-700">{queueStats.procesando}</div>
              <div className="text-xs text-blue-600">Procesando</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-green-700">{queueStats.completados}</div>
              <div className="text-xs text-green-600">Completados</div>
            </div>
            
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-red-700">{queueStats.errores}</div>
              <div className="text-xs text-red-600">Errores</div>
            </div>
          </div>

          <Separator />

          {/* Profesionales sin carnet */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Profesionales Aprobados Sin Carnet
                <Badge variant="outline">{professionalsWithoutCarnet.length}</Badge>
              </h4>
              
              {professionalsWithoutCarnet.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddAllToQueue}
                    disabled={isAddingToQueue}
                    size="sm"
                    variant="outline"
                  >
                    Agregar a Cola ({professionalsWithoutCarnet.length})
                  </Button>
                  
                  <Button
                    onClick={automateCarnetGeneration}
                    disabled={isAddingToQueue || isProcessingQueue}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Automatizar Todo
                  </Button>
                </div>
              )}
            </div>

            {isLoadingProfessionals ? (
              <div className="text-center py-4">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-gray-600">Cargando profesionales...</p>
              </div>
            ) : professionalsWithoutCarnet.length === 0 ? (
              <div className="text-center py-4 text-green-600">
                <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium">¡Excelente!</p>
                <p className="text-sm">Todos los profesionales aprobados tienen carnet</p>
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-2">
                {professionalsWithoutCarnet.slice(0, 10).map((professional) => (
                  <div key={professional.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{professional.nombre_completo}</div>
                      <div className="text-xs text-gray-500">ID: {professional.id_profesional_unico}</div>
                    </div>
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  </div>
                ))}
                {professionalsWithoutCarnet.length > 10 && (
                  <div className="text-center text-sm text-gray-500 py-2">
                    ... y {professionalsWithoutCarnet.length - 10} más
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Controles de procesamiento */}
          <div className="space-y-3">
            <h4 className="font-medium">Controles de Procesamiento</h4>
            
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => processQueue()}
                disabled={isProcessingQueue || queueStats.pendientes === 0}
                size="sm"
                variant="outline"
              >
                <Play className="w-4 h-4 mr-1" />
                Procesar Uno
              </Button>
              
              <Button
                onClick={handleProcessMultiple}
                disabled={isProcessingQueue || queueStats.pendientes === 0}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Play className="w-4 h-4 mr-1" />
                Procesar {Math.min(queueStats.pendientes, 5)} Items
              </Button>
              
              {isProcessingQueue && (
                <Badge className="bg-blue-100 text-blue-800 animate-pulse">
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Procesando...
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de la cola */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Estado de la Cola
            <Badge variant="outline">{queueStatus.length} items</Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {isLoadingQueue ? (
            <div className="text-center py-4">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-gray-600">Cargando cola...</p>
            </div>
          ) : queueStatus.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay items en la cola</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {queueStatus.map((item) => (
                <div key={item.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.estado)}
                      <span className="font-medium text-sm">
                        ID: {item.profesional_id.slice(-8)}
                      </span>
                    </div>
                    {getStatusBadge(item.estado)}
                  </div>
                  
                  {item.mensaje_error && (
                    <p className="text-xs text-red-600 mb-2">
                      Error: {item.mensaje_error}
                    </p>
                  )}
                  
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Creado: {new Date(item.created_at).toLocaleString('es-ES')}</span>
                    <span>Actualizado: {new Date(item.updated_at).toLocaleString('es-ES')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CarnetQueueProcessor;
