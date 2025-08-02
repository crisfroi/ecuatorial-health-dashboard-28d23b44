import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { useAdvancedAnalytics } from "@/hooks/useAdvancedAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from 'lucide-react';
import InteractiveCharts from './InteractiveCharts';

interface AreaProfessionalStats {
  area: string;
  count: number;
}

interface DistrictStats {
  district: string;
  count: number;
}

interface AgeRangeStats {
  range: string;
  count: number;
}

interface GraduationYearStats {
  year: string;
  count: number;
}

interface MonthlyTrend {
  mes: string;
  registros: number;
}

interface AdvancedAnalyticsDashboardProps {
  onNavigateToCenter?: (center: string) => void;
}

const AdvancedAnalyticsDashboard = ({ onNavigateToCenter }: AdvancedAnalyticsDashboardProps) => {
  const { data: estadisticas, isLoading, error } = useAdvancedAnalytics();

  const handleCountryNavigation = (country: string) => {
    onNavigateToCenter?.(country);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Cargando Estadísticas Avanzadas...</CardTitle>
            <CardDescription>Por favor, espere mientras se cargan los datos.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-64" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error al Cargar Estadísticas Avanzadas</CardTitle>
            <CardDescription>Hubo un problema al cargar los datos. Por favor, inténtelo de nuevo más tarde.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">Error: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!estadisticas) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>No hay Datos Disponibles</CardTitle>
            <CardDescription>No se encontraron datos para mostrar.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>No hay datos disponibles para estadísticas avanzadas.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tendencias Mensuales de Registros</CardTitle>
          <CardDescription>Número de registros de profesionales aprobados por mes.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={estadisticas.tendenciasMensuales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="registros" fill="#8884d8" name="Registros" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribución por Año de Graduación</CardTitle>
          <CardDescription>Cantidad de profesionales por año de graduación.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(estadisticas.porAnoGraduacion).map(([year, count]) => ({ year, count: count as number }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#82ca9d" name="Cantidad" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <InteractiveCharts 
        data={estadisticas}
      />
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
