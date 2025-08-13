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
  RefreshCw,
} from "lucide-react";
import { useEstadisticasAvanzadas } from "@/hooks/useEstadisticasAvanzadas";
import { useEstadisticasTest } from "@/hooks/useEstadisticasTest";
import { useEstadisticasMock } from "@/hooks/useEstadisticasMock";
import { useSupabaseConnectivity } from "@/hooks/useSupabaseConnectivity";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import { useEstadisticasSimples } from "@/hooks/useEstadisticasSimples";

interface StatsCardsProps {
  onNavigateToProfessionals: (filters: any) => void;
}

const StatsCards = ({ onNavigateToProfessionals }: StatsCardsProps) => {
  const { data: statsSimples, isLoading: simplesLoading, error: simplesError } = useEstadisticasSimples();
  const { data: stats, isLoading, error } = useEstadisticasAvanzadas();
  const {
    data: testStats,
    isLoading: testLoading,
    error: testError,
  } = useEstadisticasTest();
  const { data: mockStats, isLoading: mockLoading } = useEstadisticasMock();
  const {
    data: connectivityData,
    isLoading: connectivityLoading,
    error: connectivityError,
  } = useSupabaseConnectivity();
  const {
    isOfflineMode,
    reason: offlineReason,
    disableOfflineMode,
  } = useOfflineMode();

  // Enhanced fallback logic - priorizar estadísticas simples
  let effectiveStats = null;
  let fallbackReason = null;
  let isLoadingStats = simplesLoading || isLoading;

  console.log("🔍 Evaluando estadísticas disponibles:", {
    statsSimples: statsSimples?.total || 0,
    stats: stats?.total || 0,
    testStats: testStats?.total || 0,
    mockStats: mockStats?.total || 0
  });

  // Priorizar estadísticas simples si están disponibles
  if (statsSimples && statsSimples.total > 0) {
    effectiveStats = {
      total: statsSimples.total,
      aprobados: statsSimples.aprobados,
      pendientes: statsSimples.pendientes,
      rechazados: statsSimples.rechazados,
      porGenero: {
        masculino: statsSimples.hombres,
        femenino: statsSimples.mujeres
      },
      centrosSalud: statsSimples.centros,
      proximosVencer: statsSimples.proximosVencer
    };
    console.log("✅ Usando estadísticas simples:", effectiveStats);
  }
  // Si las estadísticas simples fallan, usar las avanzadas
  else if (stats && stats.total > 0) {
    effectiveStats = stats;
    console.log("✅ Usando estadísticas avanzadas:", effectiveStats);
  }
  // Si ambas fallan, usar estadísticas de prueba
  else if (testStats && testStats.total > 0) {
    effectiveStats = testStats;
    fallbackReason = "test";
    console.log("⚠️ Usando estadísticas de prueba");
  }
  // Último recurso: datos mock
  else if (mockStats && mockStats.total > 0) {
    effectiveStats = mockStats;
    fallbackReason = "mock";
    console.log("⚠️ Usando estadísticas mock");
  }
  // Si todo falla
  else {
    effectiveStats = {
      total: 0,
      aprobados: 0,
      pendientes: 0,
      rechazados: 0,
      porGenero: { masculino: 0, femenino: 0 },
      centrosSalud: 0,
      proximosVencer: 0,
    };
    fallbackReason = simplesError ? `Error: ${simplesError.message}` : "No hay datos disponibles";
    console.error("❌ No hay estadísticas disponibles:", { simplesError, error, testError });
  }

  if (isLoadingStats) {
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

  // Si hay error pero tenemos datos de fallback, continuamos con la lógica normal
  // Solo mostramos error si no tenemos ningún dato disponible
  if (error && !effectiveStats) {
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
  console.log("StatsCards: Connectivity data:", connectivityData);
  console.log("StatsCards: Connectivity loading:", connectivityLoading);
  console.log("StatsCards: Connectivity error:", connectivityError);
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
    <div className="space-y-4">
      {/* Offline mode indicator */}
      {(isOfflineMode || fallbackReason) && (
        <div
          className={`border rounded-lg p-4 ${
            isOfflineMode
              ? "bg-orange-50 border-orange-200"
              : "bg-yellow-50 border-yellow-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle
                className={`w-4 h-4 ${
                  isOfflineMode ? "text-orange-600" : "text-yellow-600"
                }`}
              />
              <div>
                <div
                  className={`text-sm font-medium ${
                    isOfflineMode ? "text-orange-800" : "text-yellow-800"
                  }`}
                >
                  {isOfflineMode && `Offline Mode Active: ${offlineReason}`}
                  {!isOfflineMode &&
                    fallbackReason === "network" &&
                    "Using offline data due to network connectivity issues"}
                  {!isOfflineMode &&
                    fallbackReason === "test" &&
                    "Using test data due to database connection issues"}
                  {!isOfflineMode &&
                    fallbackReason === "mock" &&
                    "Using mock data - database unavailable"}
                </div>
                {isOfflineMode && (
                  <div className="text-xs text-orange-600 mt-1">
                    Mock data is being used. Database queries are disabled.
                  </div>
                )}
              </div>
            </div>

            {isOfflineMode && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  disableOfflineMode();
                }}
                className="text-orange-700 border-orange-300 hover:bg-orange-100"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Reconnect
              </Button>
            )}
          </div>
        </div>
      )}

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
              {effectiveStats?.aprobados || 0}
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
              {effectiveStats?.recibidos || 0}
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
              {effectiveStats?.revisando || 0}
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
              {effectiveStats?.rechazados || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Tasa: {effectiveStats?.tasaRechazo || 0}%
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
              {effectiveStats?.vencimientosProximos || 0}
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
              {effectiveStats?.carnetVencidos || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requieren renovación
            </p>
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
                  {effectiveStats?.generoMasculino || 0}
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
                  {effectiveStats?.generoFemenino || 0}
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
    </div>
  );
};

export default StatsCards;
