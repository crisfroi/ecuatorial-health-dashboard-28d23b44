
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, Clock, FileText, AlertTriangle, TrendingUp } from 'lucide-react';
import { useEstadisticasProfesionales } from '@/hooks/useProfesionales';

interface StatsCardsProps {
  onNavigateToProfessionals: (filters: any) => void;
}

const StatsCards = ({ onNavigateToProfessionals }: StatsCardsProps) => {
  const { data: stats, isLoading, error } = useEstadisticasProfesionales();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
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
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => handleCardClick({})}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Profesionales</CardTitle>
          <Users className="h-4 w-4 text-guinea-teal" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-guinea-teal">{stats?.total || 0}</div>
          <p className="text-xs text-muted-foreground">
            Profesionales registrados
          </p>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => handleCardClick({ estado_solicitud: 'Aprobado' })}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
          <UserCheck className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats?.aprobados || 0}</div>
          <p className="text-xs text-muted-foreground">
            Solicitudes aprobadas
          </p>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => handleCardClick({ estado_solicitud: 'Pendiente' })}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          <Clock className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats?.pendientes || 0}</div>
          <p className="text-xs text-muted-foreground">
            En proceso de revisión
          </p>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => handleCardClick({ estado_solicitud: 'Rechazado' })}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
          <FileText className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats?.rechazados || 0}</div>
          <p className="text-xs text-muted-foreground">
            Solicitudes rechazadas
          </p>
        </CardContent>
      </Card>

      {/* Tarjetas adicionales para alertas */}
      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Próximos a Vencer</CardTitle>
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats?.vencimientosProximos || 0}</div>
          <p className="text-xs text-muted-foreground">
            Carnets vencen en 30 días
          </p>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Carnets Vencidos</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">0</div>
          <p className="text-xs text-muted-foreground">
            Requieren renovación
          </p>
        </CardContent>
      </Card>

      {/* Mostrar distribución por área más grande */}
      <Card className="md:col-span-2 cursor-pointer hover:shadow-lg transition-shadow">
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
                className="cursor-pointer hover:bg-guinea-light-teal"
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
  );
};

export default StatsCards;
