import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Download,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useCarnetGeneration } from '@/hooks/useCarnetGeneration';
import { useToast } from '@/hooks/use-toast';

interface CarnetStatus {
  profesionalId: string;
  profesionalName: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  message?: string;
  url_carnet?: string;
  timestamp: string;
}

interface CarnetGenerationStatusProps {
  recentStatusChanges?: Array<{
    profesionalId: string;
    profesionalName: string;
    newStatus: string;
    timestamp: string;
  }>;
}

const CarnetGenerationStatus = ({ recentStatusChanges = [] }: CarnetGenerationStatusProps) => {
  const { isGenerating } = useCarnetGeneration();
  const { toast } = useToast();
  const [carnetStatuses, setCarnetStatuses] = useState<CarnetStatus[]>([]);

  // Actualizar estados cuando hay cambios recientes a "Pendiente de Firma"
  useEffect(() => {
    const pendienteFirmaChanges = recentStatusChanges.filter(
      change => change.newStatus === "Pendiente de Firma"
    );

    if (pendienteFirmaChanges.length > 0) {
      const newStatuses: CarnetStatus[] = pendienteFirmaChanges.map(change => ({
        profesionalId: change.profesionalId,
        profesionalName: change.profesionalName,
        status: 'generating',
        message: 'Generando carnet automáticamente...',
        timestamp: change.timestamp
      }));

      setCarnetStatuses(prev => [...newStatuses, ...prev].slice(0, 10)); // Mantener solo los últimos 10
    }
  }, [recentStatusChanges]);

  const getStatusIcon = (status: CarnetStatus['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'generating':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: CarnetStatus['status']) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      generating: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      error: "bg-red-100 text-red-800"
    };

    const labels = {
      pending: "Pendiente",
      generating: "Generando",
      completed: "Completado",
      error: "Error"
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const handleViewCarnet = (url_carnet: string) => {
    window.open(url_carnet, '_blank');
  };

  const handleDownloadCarnet = async (url_carnet: string, profesionalName: string) => {
    try {
      const response = await fetch(url_carnet);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `carnet_${profesionalName.replace(/[^a-zA-Z0-9]/g, '_')}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Descarga iniciada",
        description: `Descargando carnet de ${profesionalName}`,
      });
    } catch (error) {
      console.error('Error downloading carnet:', error);
      toast({
        title: "Error en descarga",
        description: "No se pudo descargar el carnet",
        variant: "destructive",
      });
    }
  };

  // Simular actualización de estados (en una implementación real, esto vendría de websockets o polling)
  useEffect(() => {
    const updateInterval = setInterval(() => {
      setCarnetStatuses(prev => 
        prev.map(status => {
          // Simular que después de 5 segundos, los carnets en estado "generating" se completan
          if (status.status === 'generating') {
            const elapsedTime = Date.now() - new Date(status.timestamp).getTime();
            if (elapsedTime > 5000) { // 5 segundos
              return {
                ...status,
                status: 'completed' as const,
                message: 'Carnet generado exitosamente',
                url_carnet: `https://example.com/carnet/${status.profesionalId}.svg` // URL simulada
              };
            }
          }
          return status;
        })
      );
    }, 1000);

    return () => clearInterval(updateInterval);
  }, []);

  if (carnetStatuses.length === 0 && !isGenerating) {
    return null; // No mostrar el componente si no hay actividad
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          Estado de Generación de Carnets
          {isGenerating && (
            <Badge className="bg-blue-100 text-blue-800 animate-pulse">
              Procesando...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {carnetStatuses.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No hay generaciones de carnets recientes</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {carnetStatuses.map((status, index) => (
              <div key={`${status.profesionalId}-${index}`} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.status)}
                    <span className="font-medium text-sm">{status.profesionalName}</span>
                  </div>
                  {getStatusBadge(status.status)}
                </div>
                
                <p className="text-xs text-gray-600 mb-2">
                  {status.message || 'Procesando carnet profesional...'}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {new Date(status.timestamp).toLocaleString('es-ES')}
                  </span>
                  
                  {status.status === 'completed' && status.url_carnet && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewCarnet(status.url_carnet!)}
                        className="h-6 px-2 text-xs"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadCarnet(status.url_carnet!, status.profesionalName)}
                        className="h-6 px-2 text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Descargar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Separator />
        
        <div className="text-xs text-gray-500 text-center">
          Los carnets se generan automáticamente cuando el estado cambia a "Pendiente de Firma"
        </div>
      </CardContent>
    </Card>
  );
};

export default CarnetGenerationStatus;
