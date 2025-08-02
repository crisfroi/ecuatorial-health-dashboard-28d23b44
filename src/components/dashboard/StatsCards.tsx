
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  UserCheck,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { useEstadisticas } from "@/hooks/useEstadisticas";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardsProps {
  onNavigateToSection?: (section: string) => void;
}

const StatsCards = ({ onNavigateToSection }: StatsCardsProps) => {
  const { data: estadisticas, isLoading, error } = useEstadisticas();
  const [showMockData, setShowMockData] = useState(false);

  // Mock data for testing
  const mockEstadisticas = {
    total: 150,
    aprobados: 120,
    pendientes: 15,
    recibidos: 10,
    rechazados: 5,
    revisando: 0,
    vencimientosProximos: 8,
    carnetVencidos: 3,
    porArea: { "Medicina": 80, "Enfermería": 40, "Farmacia": 30 },
    porProvincia: { "Bioko Norte": 100, "Bioko Sur": 30, "Litoral": 20 },
    generoMasculino: 70,
    generoFemenino: 80,
    totalPorGenero: { Masculino: 70, Femenino: 80 },
    totalPorDistrito: { "Malabo": 100, "Luba": 30, "Bata": 20 },
    totalPorTipoSector: { "Público": 120, "Privado": 30 },
    totalPorNacionalidad: { "Guinea Ecuatorial": 130, "España": 15, "Cuba": 5 },
    totalPorAreaProfesional: { "Medicina": 80, "Enfermería": 40, "Farmacia": 30 },
    totalPorEstadoSolicitud: {
      "Recibido": 10,
      "En Revisión": 0,
      "Aprobado": 120,
      "Pendiente de Firma": 15,
      "Rechazado": 5
    },
    totalPorDistritoSanitario: { "Distrito I": 50, "Distrito II": 60, "Distrito III": 40 },
    datosGraficoProvincias: [
      { name: "Bioko Norte", value: 100, color: "hsl(210, 70%, 50%)" },
      { name: "Bioko Sur", value: 30, color: "hsl(255, 70%, 50%)" },
      { name: "Litoral", value: 20, color: "hsl(300, 70%, 50%)" }
    ]
  };

  const currentData = showMockData ? mockEstadisticas : estadisticas;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error al cargar estadísticas</CardTitle>
            <CardDescription>
              No se pudieron cargar las estadísticas. Intenta recargar la página.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                Recargar
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setShowMockData(!showMockData)}
              >
                {showMockData ? 'Ocultar datos de prueba' : 'Mostrar datos de prueba'}
              </Button>
            </div>
            {showMockData && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  📊 Mostrando datos de prueba para desarrollo
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const statsCards = [
    {
      title: "Total Profesionales",
      value: currentData?.total || 0,
      description: "Profesionales registrados",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      onClick: () => onNavigateToSection?.('profesionales')
    },
    {
      title: "Aprobados",
      value: currentData?.aprobados || 0,
      description: `${((currentData?.aprobados || 0) / (currentData?.total || 1) * 100).toFixed(1)}% del total`,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      onClick: () => onNavigateToSection?.('aprobados')
    },
    {
      title: "Pendientes de Firma",
      value: currentData?.pendientes || 0,
      description: "Esperando firma",
      icon: FileText,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      onClick: () => onNavigateToSection?.('pendientes')
    },
    {
      title: "En Revisión",
      value: currentData?.revisando || 0,
      description: "Siendo procesados",
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      onClick: () => onNavigateToSection?.('revision')
    },
    {
      title: "Recibidos",
      value: currentData?.recibidos || 0,
      description: "Recién ingresados",
      icon: UserCheck,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      onClick: () => onNavigateToSection?.('recibidos')
    },
    {
      title: "Rechazados",
      value: currentData?.rechazados || 0,
      description: "No aprobados",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      onClick: () => onNavigateToSection?.('rechazados')
    },
    {
      title: "Vencen Pronto",
      value: currentData?.vencimientosProximos || 0,
      description: "Próximos 30 días",
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      onClick: () => onNavigateToSection?.('vencimientos')
    },
    {
      title: "Vencidos",
      value: currentData?.carnetVencidos || 0,
      description: "Carnets caducados",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      onClick: () => onNavigateToSection?.('vencidos')
    }
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card, index) => (
          <Card 
            key={index} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={card.onClick}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {showMockData && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Modo de Desarrollo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700">
              Se están mostrando datos simulados para desarrollo. Los datos reales se cargarán cuando la conexión a la base de datos esté disponible.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setShowMockData(false)}
            >
              Ocultar datos de prueba
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StatsCards;
