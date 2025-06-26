
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, Clock, FileText, AlertTriangle, TrendingUp, Download } from 'lucide-react';
import { useEstadisticasAvanzadas } from '@/hooks/useEstadisticasAvanzadas';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

interface StatsCardsProps {
  onNavigateToProfessionals: (filters: any) => void;
}

const StatsCards = ({ onNavigateToProfessionals }: StatsCardsProps) => {
  const { data: stats, isLoading, error } = useEstadisticasAvanzadas();
  const { toast } = useToast();

  const handleDownloadStats = async () => {
    try {
      const statsElement = document.getElementById('stats-cards-container');
      if (!statsElement) {
        toast({
          title: "Error",
          description: "No se pudo encontrar las estadísticas para descargar",
          variant: "destructive",
        });
        return;
      }

      const canvas = await html2canvas(statsElement, {
        backgroundColor: '#f9fafb',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `estadisticas-principales-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();

      toast({
        title: "Estadísticas descargadas",
        description: "Las estadísticas se han descargado correctamente",
        variant: "default",
      });
    } catch (error) {
      console.error('Error downloading stats:', error);
      toast({
        title: "Error",
        description: "No se pudo descargar las estadísticas",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse shadow-lg">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        Error al cargar las estadísticas: {error.message}
      </div>
    );
  }

  const handleCardClick = (filters: any) => {
    console.log('StatsCards: Navigating with filters:', filters);
    onNavigateToProfessionals(filters);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Estadísticas Principales</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadStats}
          className="flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Descargar</span>
        </Button>
      </div>
      
      <div id="stats-cards-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4 bg-gray-50 rounded-lg">
        <Card 
          className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 shadow-lg"
          onClick={() => handleCardClick({})}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-teal-700">Total Profesionales</CardTitle>
            <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center shadow-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-600 mb-1">{stats?.total || 0}</div>
            <p className="text-sm text-teal-600/70">
              Profesionales registrados
            </p>
            <div className="mt-2 flex items-center">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-xs text-green-600 font-medium">+2.6%</span>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg"
          onClick={() => handleCardClick({ estado_solicitud: 'Aprobado' })}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Aprobados</CardTitle>
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <UserCheck className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-1">{stats?.aprobados || 0}</div>
            <p className="text-sm text-green-600/70">
              Tasa: {stats?.tasaAprobacion || 0}%
            </p>
            <div className="mt-2 flex items-center">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-xs text-green-600 font-medium">+1.7%</span>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg"
          onClick={() => handleCardClick({ estado_solicitud: 'Pendiente' })}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Pendientes</CardTitle>
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 mb-1">{stats?.pendientes || 0}</div>
            <p className="text-sm text-orange-600/70">
              En proceso de revisión
            </p>
            <div className="mt-2 flex items-center">
              <Clock className="w-4 h-4 text-orange-500 mr-1" />
              <span className="text-xs text-orange-600 font-medium">-1.3%</span>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg"
          onClick={() => handleCardClick({ estado_solicitud: 'Rechazado' })}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Rechazadas</CardTitle>
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 mb-1">{stats?.rechazados || 0}</div>
            <p className="text-sm text-red-600/70">
              Tasa: {stats?.tasaRechazo || 0}%
            </p>
            <div className="mt-2 flex items-center">
              <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
              <span className="text-xs text-red-600 font-medium">+0.8%</span>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg"
          onClick={() => handleCardClick({ estado_solicitud: 'Revisando' })}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">En Revisión</CardTitle>
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-1">{stats?.revisando || 0}</div>
            <p className="text-sm text-blue-600/70">
              Siendo evaluadas
            </p>
            <div className="mt-2 flex items-center">
              <TrendingUp className="w-4 h-4 text-blue-500 mr-1" />
              <span className="text-xs text-blue-600 font-medium">+3.2%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Próximos a Vencer</CardTitle>
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 mb-1">{stats?.vencimientosProximos || 0}</div>
            <p className="text-sm text-yellow-600/70">
              Carnets vencen en 30 días
            </p>
            <div className="mt-2 flex items-center">
              <AlertTriangle className="w-4 h-4 text-yellow-500 mr-1" />
              <span className="text-xs text-yellow-600 font-medium">Urgente</span>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Carnets Vencidos</CardTitle>
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 mb-1">{stats?.carnetVencidos || 0}</div>
            <p className="text-sm text-purple-600/70">
              Requieren renovación
            </p>
            <div className="mt-2 flex items-center">
              <AlertTriangle className="w-4 h-4 text-purple-500 mr-1" />
              <span className="text-xs text-purple-600 font-medium">Crítico</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-4 cursor-pointer hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold text-gray-800">Distribución por Área Profesional</CardTitle>
            <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center shadow-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {stats?.porArea && Object.entries(stats.porArea).map(([area, cantidad]) => (
                <Badge 
                  key={area} 
                  variant="secondary"
                  className="cursor-pointer hover:bg-teal-100 transition-all duration-200 hover:scale-105 px-4 py-2 text-sm font-medium shadow-sm border border-teal-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick({ area_profesional: area });
                  }}
                >
                  {area}: {cantidad as number}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatsCards;
