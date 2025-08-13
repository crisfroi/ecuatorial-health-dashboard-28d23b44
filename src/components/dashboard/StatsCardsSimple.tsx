import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, AlertTriangle, RefreshCw, PersonStanding, Clock, FileText } from "lucide-react";
import { useStatsSimple } from "@/hooks/useStatsSimple";

interface StatsCardsSimpleProps {
  onNavigateToProfessionals: (filters: any) => void;
}

const StatsCardsSimple = ({ onNavigateToProfessionals }: StatsCardsSimpleProps) => {
  const { total, aprobados, recibidos, revisando, hombres, mujeres, centros, loading, error } = useStatsSimple();

  const handleCardClick = (filters: any) => {
    console.log("StatsCards: Navigating with filters:", filters);
    onNavigateToProfessionals(filters);
  };

  if (loading) {
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
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Error al cargar estadísticas
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Debug Info */}
      <div className="bg-blue-50 border border-blue-200 p-3 rounded">
        <p className="text-sm text-blue-800">
          <strong>Debug:</strong> Total: {total}, Aprobados: {aprobados}, Recibidos: {recibidos}, Revisando: {revisando}, Hombres: {hombres}, Mujeres: {mujeres}, Centros: {centros}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Profesionales Acreditados */}
        <Card
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 hover:border-green-400"
          onClick={() => handleCardClick({ estado_solicitud: "Aprobado" })}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profesionales Acreditados</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{aprobados}</div>
            <p className="text-xs text-muted-foreground">Con acreditación aprobada</p>
          </CardContent>
        </Card>

        {/* Solicitudes Recibidas */}
        <Card
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 hover:border-orange-400"
          onClick={() => handleCardClick({ estado_solicitud: "Recibido" })}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitudes Recibidas</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{recibidos}</div>
            <p className="text-xs text-muted-foreground">En proceso de revisión</p>
          </CardContent>
        </Card>

        {/* En Revisión */}
        <Card
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 hover:border-blue-400"
          onClick={() => handleCardClick({ estado_solicitud: "Revisando" })}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Revisión</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{revisando}</div>
            <p className="text-xs text-muted-foreground">Siendo evaluadas</p>
          </CardContent>
        </Card>

        {/* Establecimientos Sanitarios */}
        <Card
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 hover:border-purple-400"
          onClick={() => handleCardClick({ navigate_to: "health-centers" })}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Establecimientos Sanitarios</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{centros}</div>
            <p className="text-xs text-muted-foreground">Establecimientos registrados</p>
            <div className="mt-2 text-xs text-blue-600 font-medium">
              Clic para ver centros →
            </div>
          </CardContent>
        </Card>

        {/* Distribución por Género */}
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Género</CardTitle>
            <PersonStanding className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 items-center">
              <div
                className="flex items-center gap-1 cursor-pointer hover:text-blue-700 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick({ genero: "Masculino" });
                }}
              >
                <span className="font-semibold text-blue-600">{hombres}</span>
                <Badge variant="secondary">Hombres</Badge>
              </div>
              <div
                className="flex items-center gap-1 cursor-pointer hover:text-pink-700 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick({ genero: "Femenino" });
                }}
              >
                <span className="font-semibold text-pink-600">{mujeres}</span>
                <Badge variant="secondary">Mujeres</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatsCardsSimple;
