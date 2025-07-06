
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, Clock, FileText, AlertTriangle, TrendingUp } from 'lucide-react';
import { useEstadisticasAvanzadas } from '@/hooks/useEstadisticasAvanzadas';

interface StatsCardsProps {
  onNavigateToProfessionals: (filters: any) => void;
}

const StatsCards = ({ onNavigateToProfessionals }: StatsCardsProps) => {
  const { data: stats, isLoading, error } = useEstadisticasAvanzadas();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 hover:border-guinea-teal"
        onClick={() => handleCardClick({ estado_solicitud: 'Aprobado' })}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profesionales Aprobados</CardTitle>
          <Users className="h-4 w-4 text-guinea-teal" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-guinea-teal">{stats?.aprobados || 0}</div>
          <p className="text-xs text-muted-foreground">
            Profesionales acreditados
          </p>
          <div className="mt-2 text-xs text-blue-600 font-medium">
            Clic para ver detalles →
          </div>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 hover:border-orange-400"
        onClick={() => handleCardClick({ estado_solicitud: 'Pendiente' })}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
          <Clock className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats?.pendientes || 0}</div>
          <p className="text-xs text-muted-foreground">
            En proceso de revisión
          </p>
          <div className="mt-2 text-xs text-blue-600 font-medium">
            Clic para ver detalles →
          </div>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 hover:border-blue-400"
        onClick={() => handleCardClick({ estado_solicitud: 'Revisando' })}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En Revisión</CardTitle>
          <Clock className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats?.revisando || 0}</div>
          <p className="text-xs text-muted-foreground">
            Siendo evaluadas
          </p>
          <div className="mt-2 text-xs text-blue-600 font-medium">
            Clic para ver detalles →
          </div>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 hover:border-red-400"
        onClick={() => handleCardClick({ estado_solicitud: 'Rechazado' })}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Solicitudes Rechazadas</CardTitle>
          <FileText className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats?.rechazados || 0}</div>
          <p className="text-xs text-muted-foreground">
            Tasa: {stats?.tasaRechazo || 0}%
          </p>
          <div className="mt-2 text-xs text-blue-600 font-medium">
            Clic para ver detalles →
          </div>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 hover:border-yellow-400"
        onClick={() => handleCardClick({ vencimiento_proximo: true })}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Próximos a Vencer</CardTitle>
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats?.vencimientosProximos || 0}</div>
          <p className="text-xs text-muted-foreground">
            Carnets vencen en 30 días
          </p>
          <div className="mt-2 text-xs text-blue-600 font-medium">
            Clic para ver detalles →
          </div>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 hover:border-red-500"
        onClick={() => handleCardClick({ carnet_vencido: true })}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Carnets Vencidos</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats?.carnetVencidos || 0}</div>
          <p className="text-xs text-muted-foreground">
            Requieren renovación
          </p>
          <div className="mt-2 text-xs text-blue-600 font-medium">
            Clic para ver detalles →
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 hover:shadow-lg transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Distribución por Área</CardTitle>
          <TrendingUp className="h-4 w-4 text-guinea-teal" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {stats?.porArea && Object.entries(stats.porArea).map(([area, cantidad]) => (
              <Badge 
                key={area} 
                variant="secondary"
                className="cursor-pointer hover:bg-guinea-light-teal transition-colors hover:scale-105"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick({ area_profesional: area });
                }}
              >
                {area}: {cantidad as number}
              </Badge>
            ))}
          </div>
          <div className="mt-3 text-xs text-blue-600 font-medium">
            Clic en cualquier área para ver profesionales →
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
