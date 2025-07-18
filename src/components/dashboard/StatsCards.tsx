import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// CAMBIO AQUÍ: Importamos PersonStanding en lugar de Male y Female
import {
  Users,
  UserCheck,
  Clock,
  FileText,
  AlertTriangle,
  TrendingUp,
  PersonStanding,
} from "lucide-react";
import { useEstadisticasAvanzadas } from "@/hooks/useEstadisticasAvanzadas";
import { useEstadisticasTest } from "@/hooks/useEstadisticasTest";
import { useEstadisticasMock } from "@/hooks/useEstadisticasMock";

interface StatsCardsProps {
  onNavigateToProfessionals: (filters: any) => void;
}

const StatsCards = ({ onNavigateToProfessionals }: StatsCardsProps) => {
  const { data: stats, isLoading, error } = useEstadisticasAvanzadas();
  const {
    data: testStats,
    isLoading: testLoading,
    error: testError,
  } = useEstadisticasTest();
  const { data: mockStats, isLoading: mockLoading } = useEstadisticasMock();

  // TEMPORALMENTE usar datos mock si los otros fallan (para testing)
  const effectiveStats = stats || mockStats;

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
      <Card className="col-span-full">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error al cargar estadísticas
            </h3>
            <p className="text-gray-600 mb-4">
              {error.message ||
                "No se pudieron cargar las estadísticas en este momento"}
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>Posibles causas:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Problemas de conexión a internet</li>
                <li>El servidor está temporalmente no disponible</li>
                <li>Problemas de configuración de la base de datos</li>
              </ul>
              <p className="mt-4 font-medium">
                La página se actualizará automáticamente cuando se restablezca
                la conexión.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleCardClick = (filters: any) => {
    console.log("StatsCards: Navigating with filters:", filters);
    onNavigateToProfessionals(filters);
  };

  // Debug: Log the stats data
  console.log("StatsCards: Current stats data:", stats);
  console.log("StatsCards: Is loading:", isLoading);
  console.log("StatsCards: Error:", error);
  console.log("StatsCards: Test stats data:", testStats);
  console.log("StatsCards: Test loading:", testLoading);
  console.log("StatsCards: Test error:", testError);
  console.log("StatsCards: Mock stats data:", mockStats);
  console.log("StatsCards: Effective stats (final):", effectiveStats);

  if (!effectiveStats) {
    console.log("StatsCards: No stats data available");
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">
              No hay datos de estadísticas disponibles
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card
        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 hover:border-guinea-teal"
        onClick={() => handleCardClick({ estado_solicitud: "Aprobado" })}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Profesionales Acreditados
          </CardTitle>
          <Users className="h-4 w-4 text-guinea-teal" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-guinea-teal">
            {stats?.aprobados || 0}
          </div>
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
        onClick={() => handleCardClick({ estado_solicitud: "Recibido" })}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Solicitudes Recibidas
          </CardTitle>
          <Clock className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {stats?.recibidas || 0}
          </div>
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
        onClick={() => handleCardClick({ estado_solicitud: "Revisando" })}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En Revisión</CardTitle>
          <Clock className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats?.revisando || 0}
          </div>
          <p className="text-xs text-muted-foreground">Siendo evaluadas</p>
          <div className="mt-2 text-xs text-blue-600 font-medium">
            Clic para ver detalles →
          </div>
        </CardContent>
      </Card>

      <Card
        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 hover:border-red-400"
        onClick={() => handleCardClick({ estado_solicitud: "Rechazado" })}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Solicitudes Rechazadas
          </CardTitle>
          <FileText className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {stats?.rechazados || 0}
          </div>
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
          <CardTitle className="text-sm font-medium">
            Próximos a Vencer
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {stats?.vencimientosProximos || 0}
          </div>
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
          <CardTitle className="text-sm font-medium">
            Carnets Vencidos
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {stats?.carnetVencidos || 0}
          </div>
          <p className="text-xs text-muted-foreground">Requieren renovación</p>
          <div className="mt-2 text-xs text-blue-600 font-medium">
            Clic para ver detalles →
          </div>
        </CardContent>
      </Card>

      {/* Nueva tarjeta: Profesionales por Género */}
      <Card className="md:col-span-2 hover:shadow-lg transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Profesionales por Género
          </CardTitle>
          <Users className="h-4 w-4 text-purple-600" />{" "}
          {/* Icono general para género */}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            {/* Hombres */}
            <div
              className="flex items-center gap-1 cursor-pointer hover:text-blue-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick({ genero: "Masculino" });
              }}
            >
              <PersonStanding className="h-5 w-5 text-blue-600" />{" "}
              {/* Usamos PersonStanding */}
              <span className="font-semibold text-blue-600">
                {stats?.generoMasculino || 0}
              </span>
              <Badge variant="secondary">Masculino</Badge>
            </div>
            {/* Mujeres */}
            <div
              className="flex items-center gap-1 cursor-pointer hover:text-pink-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick({ genero: "Femenino" });
              }}
            >
              <PersonStanding className="h-5 w-5 text-pink-600" />{" "}
              {/* Usamos PersonStanding */}
              <span className="font-semibold text-pink-600">
                {stats?.generoFemenino || 0}
              </span>
              <Badge variant="secondary">Femenino</Badge>
            </div>
          </div>
          <div className="mt-3 text-xs text-blue-600 font-medium">
            Clic en cualquier género para ver detalles →
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
