
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEstadisticas } from "@/hooks/useEstadisticas";
import { useEstadisticasTest } from "@/hooks/useEstadisticasTest";
import { useEstadisticasMock } from "@/hooks/useEstadisticasMock";
import type { EstadisticasData } from "@/types/estadisticas";
import { 
  Users, 
  UserCheck, 
  Clock, 
  FileText, 
  AlertTriangle,
  TrendingUp,
  Activity
} from "lucide-react";

interface StatsCardsProps {
  useTestData?: boolean;
  useMockData?: boolean;
}

const StatsCards: React.FC<StatsCardsProps> = ({ useTestData = false, useMockData = false }) => {
  const estadisticasQuery = useEstadisticas();
  const estadisticasTestQuery = useEstadisticasTest();
  const estadisticasMockQuery = useEstadisticasMock();

  // Select data source based on props
  let query;
  if (useMockData) {
    query = estadisticasMockQuery;
  } else if (useTestData) {
    query = estadisticasTestQuery;
  } else {
    query = estadisticasQuery;
  }

  const { data, isLoading, error } = query;

  console.log("StatsCards - Props:", { useTestData, useMockData });
  console.log("StatsCards - Query status:", { isLoading, error: error?.message, hasData: !!data });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    console.error("StatsCards - Error:", error);
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-700 text-sm">Error al cargar estadísticas</p>
            <p className="text-red-600 text-xs mt-2">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    console.warn("StatsCards - No data available");
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No hay datos disponibles</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const estadisticas = data as EstadisticasData;
  console.log("StatsCards - Rendered with data:", {
    total: estadisticas.total,
    aprobados: estadisticas.aprobados,
    pendientes: estadisticas.pendientes,
    rechazados: estadisticas.rechazados
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Profesionales</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{estadisticas.total}</div>
          <p className="text-xs text-muted-foreground">
            Total de registros en el sistema
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
          <UserCheck className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{estadisticas.aprobados}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-600">
              {estadisticas.tasaAprobacion}%
            </span> del total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          <Clock className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{estadisticas.pendientes}</div>
          <p className="text-xs text-muted-foreground">
            Esperando firma
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rechazados</CardTitle>
          <FileText className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{estadisticas.rechazados}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-red-600">
              {estadisticas.tasaRechazo}%
            </span> del total
          </p>
        </CardContent>
      </Card>

      {/* Mostrar opciones de debug solo si hay datos de test o mock disponibles */}
      {(useTestData || useMockData) && (
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="text-sm">Modo de datos activo</CardTitle>
            <CardDescription>
              {useMockData && "Usando datos simulados"}
              {useTestData && "Usando datos de prueba"}
              {!useTestData && !useMockData && "Usando datos en vivo"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button variant="outline" size="sm">
              Cambiar a datos en vivo
            </Button>
            <Button variant="outline" size="sm">
              Ver datos de prueba
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StatsCards;
