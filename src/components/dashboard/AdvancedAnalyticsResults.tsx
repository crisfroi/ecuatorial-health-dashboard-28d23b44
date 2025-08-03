import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart3, 
  Users, 
  GraduationCap, 
  Building2, 
  FileText, 
  CreditCard, 
  Calendar,
  TrendingUp,
  PieChart,
  Activity
} from 'lucide-react';
import { AdvancedStatsResult, AnalyticsCategory } from '@/hooks/useAdvancedAnalyticsAI';

interface AdvancedAnalyticsResultsProps {
  results: AdvancedStatsResult[];
  categories: AnalyticsCategory[];
}

const getCategoryIcon = (categoryId: string) => {
  switch (categoryId) {
    case 'demographics': return <Users className="h-4 w-4" />;
    case 'professional_areas': return <BarChart3 className="h-4 w-4" />;
    case 'education': return <GraduationCap className="h-4 w-4" />;
    case 'work_centers': return <Building2 className="h-4 w-4" />;
    case 'application_status': return <FileText className="h-4 w-4" />;
    case 'carnet_generation': return <CreditCard className="h-4 w-4" />;
    case 'centers_analysis': return <Building2 className="h-4 w-4" />;
    case 'temporal_analysis': return <Calendar className="h-4 w-4" />;
    case 'comprehensive': return <TrendingUp className="h-4 w-4" />;
    default: return <Activity className="h-4 w-4" />;
  }
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const getColorForValue = (value: number, max: number): string => {
  const percentage = (value / max) * 100;
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 60) return 'bg-blue-500';
  if (percentage >= 40) return 'bg-yellow-500';
  if (percentage >= 20) return 'bg-orange-500';
  return 'bg-red-500';
};

const renderStatsCard = (title: string, data: any, type: 'count' | 'distribution' | 'list') => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <Card className="col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sin datos disponibles</p>
        </CardContent>
      </Card>
    );
  }

  switch (type) {
    case 'count':
      return (
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data)}</div>
          </CardContent>
        </Card>
      );

    case 'distribution':
      const maxValue = Math.max(...Object.values(data as Record<string, number>));
      return (
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(data as Record<string, number>)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm truncate flex-1">{key}</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={(value / maxValue) * 100} 
                      className="w-20 h-2"
                    />
                    <span className="text-sm font-medium min-w-[3rem] text-right">
                      {formatNumber(value)}
                    </span>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      );

    case 'list':
      return (
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {Object.entries(data as Record<string, number>)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 8)
                .map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {key}: {formatNumber(value)}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      );

    default:
      return null;
  }
};

const renderComprehensiveResults = (data: any) => {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Demográficas */}
      {data.demograficas && (
        <>
          {renderStatsCard('Total Profesionales', data.demograficas.total_profesionales, 'count')}
          {renderStatsCard('Distribución por Género', data.demograficas.genero, 'distribution')}
          {renderStatsCard('Grupos de Edad', data.demograficas.grupos_edad, 'distribution')}
          {renderStatsCard('Nacionalidades', data.demograficas.nacionalidades, 'list')}
          {renderStatsCard('Provincias', data.demograficas.provincias, 'list')}
        </>
      )}

      {/* Áreas Profesionales */}
      {data.areas_profesionales && (
        <>
          {renderStatsCard('Áreas Profesionales', data.areas_profesionales.areas_profesionales, 'distribution')}
          {renderStatsCard('Especialidades', data.areas_profesionales.especialidades, 'list')}
          {renderStatsCard('Categorías de Titulación', data.areas_profesionales.categorias_titulacion, 'list')}
        </>
      )}

      {/* Educación */}
      {data.educacion && (
        <>
          {renderStatsCard('Países de Formación', data.educacion.paises_formacion, 'list')}
          {renderStatsCard('Años de Graduación', data.educacion.años_graduacion, 'distribution')}
          {renderStatsCard('Instituciones', data.educacion.instituciones, 'list')}
          {renderStatsCard('Tipos de Formación', data.educacion.tipos_formacion, 'list')}
        </>
      )}

      {/* Centros de Trabajo */}
      {data.centros_trabajo && (
        <>
          {renderStatsCard('Centros de Trabajo', data.centros_trabajo.centros_trabajo, 'list')}
          {renderStatsCard('Categorías de Centro', data.centros_trabajo.categorias_centro, 'distribution')}
          {renderStatsCard('Tipos de Sector', data.centros_trabajo.tipos_sector, 'distribution')}
          {renderStatsCard('Distritos Sanitarios', data.centros_trabajo.distritos_sanitarios, 'list')}
        </>
      )}

      {/* Estados de Solicitud */}
      {data.estados_solicitud && (
        <>
          {renderStatsCard('Estados de Solicitud', data.estados_solicitud.estados_solicitud, 'distribution')}
          {renderStatsCard('Niveles de Urgencia', data.estados_solicitud.urgencias, 'distribution')}
          {renderStatsCard('Solicitudes por Mes', data.estados_solicitud.solicitudes_por_mes, 'distribution')}
          {renderStatsCard('Motivos de Rechazo', data.estados_solicitud.motivos_rechazo, 'list')}
        </>
      )}

      {/* Generación de Carnets */}
      {data.generacion_carnets && (
        <>
          {renderStatsCard('Carnets Generados', data.generacion_carnets.carnets_generados, 'count')}
          {renderStatsCard('En Cola de Generación', data.generacion_carnets.en_cola_generacion, 'count')}
          {renderStatsCard('Estados de Cola', data.generacion_carnets.estados_cola, 'distribution')}
          {renderStatsCard('Carnets por Fecha', data.generacion_carnets.carnets_por_fecha, 'distribution')}
        </>
      )}

      {/* Análisis de Centros */}
      {data.analisis_centros && (
        <>
          {renderStatsCard('Total Centros', data.analisis_centros.total_centros, 'count')}
          {renderStatsCard('Centros por Categoría', data.analisis_centros.centros_por_categoria, 'distribution')}
          {renderStatsCard('Centros por Provincia', data.analisis_centros.centros_por_provincia, 'list')}
          {renderStatsCard('Centros por Distrito', data.analisis_centros.centros_por_distrito, 'list')}
        </>
      )}

      {/* Análisis Temporal */}
      {data.analisis_temporal && (
        <>
          {renderStatsCard('Registros por Mes', data.analisis_temporal.registros_por_mes, 'distribution')}
          {renderStatsCard('Aprobaciones por Mes', data.analisis_temporal.aprobaciones_por_mes, 'distribution')}
          {renderStatsCard('Años de Graduación', data.analisis_temporal.generaciones_graduacion, 'distribution')}
        </>
      )}
    </div>
  );
};

const renderSpecificResults = (data: any, query: string) => {
  if (!data) return null;

  switch (query) {
    case 'demographics':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderStatsCard('Total Profesionales', data.total_profesionales, 'count')}
          {renderStatsCard('Distribución por Género', data.genero, 'distribution')}
          {renderStatsCard('Grupos de Edad', data.grupos_edad, 'distribution')}
          {renderStatsCard('Nacionalidades', data.nacionalidades, 'list')}
          {renderStatsCard('Provincias', data.provincias, 'list')}
        </div>
      );

    case 'professional_areas':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderStatsCard('Áreas Profesionales', data.areas_profesionales, 'distribution')}
          {renderStatsCard('Especialidades', data.especialidades, 'list')}
          {renderStatsCard('Categorías de Titulación', data.categorias_titulacion, 'list')}
        </div>
      );

    case 'education':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderStatsCard('Países de Formación', data.paises_formacion, 'list')}
          {renderStatsCard('Años de Graduación', data.años_graduacion, 'distribution')}
          {renderStatsCard('Instituciones', data.instituciones, 'list')}
          {renderStatsCard('Tipos de Formación', data.tipos_formacion, 'list')}
        </div>
      );

    case 'work_centers':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderStatsCard('Centros de Trabajo', data.centros_trabajo, 'list')}
          {renderStatsCard('Categorías de Centro', data.categorias_centro, 'distribution')}
          {renderStatsCard('Tipos de Sector', data.tipos_sector, 'distribution')}
          {renderStatsCard('Distritos Sanitarios', data.distritos_sanitarios, 'list')}
          {renderStatsCard('Situaciones Laborales', data.situaciones_laborales, 'distribution')}
        </div>
      );

    case 'application_status':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderStatsCard('Estados de Solicitud', data.estados_solicitud, 'distribution')}
          {renderStatsCard('Niveles de Urgencia', data.urgencias, 'distribution')}
          {renderStatsCard('Solicitudes por Mes', data.solicitudes_por_mes, 'distribution')}
          {renderStatsCard('Motivos de Rechazo', data.motivos_rechazo, 'list')}
        </div>
      );

    case 'carnet_generation':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderStatsCard('Carnets Generados', data.carnets_generados, 'count')}
          {renderStatsCard('En Cola de Generación', data.en_cola_generacion, 'count')}
          {renderStatsCard('Estados de Cola', data.estados_cola, 'distribution')}
          {renderStatsCard('Carnets por Fecha', data.carnets_por_fecha, 'distribution')}
        </div>
      );

    case 'centers_analysis':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderStatsCard('Total Centros', data.total_centros, 'count')}
          {renderStatsCard('Centros por Categoría', data.centros_por_categoria, 'distribution')}
          {renderStatsCard('Centros por Provincia', data.centros_por_provincia, 'list')}
          {renderStatsCard('Centros por Distrito', data.centros_por_distrito, 'list')}
          {renderStatsCard('Profesionales por Centro', data.profesionales_por_centro, 'list')}
        </div>
      );

    case 'temporal_analysis':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderStatsCard('Registros por Mes', data.registros_por_mes, 'distribution')}
          {renderStatsCard('Aprobaciones por Mes', data.aprobaciones_por_mes, 'distribution')}
          {renderStatsCard('Años de Graduación', data.generaciones_graduacion, 'distribution')}
        </div>
      );

    default:
      return (
        <Card>
          <CardContent className="pt-6">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      );
  }
};

export function AdvancedAnalyticsResults({ results, categories }: AdvancedAnalyticsResultsProps) {
  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay resultados de análisis disponibles</p>
            <p className="text-sm">Realiza una consulta para ver estadísticas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {results.map((result, index) => {
        const category = categories.find(cat => cat.queries.includes(result.query || ''));
        
        return (
          <Card key={index} className="w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                {result.query && getCategoryIcon(result.query)}
                <CardTitle>
                  {category?.name || 'Análisis de Datos'}
                </CardTitle>
                <Badge variant={result.success ? "default" : "destructive"}>
                  {result.success ? "Exitoso" : "Error"}
                </Badge>
              </div>
              <CardDescription>
                {result.query && category?.description}
                {result.timestamp && (
                  <span className="block text-xs text-muted-foreground mt-1">
                    {new Date(result.timestamp).toLocaleString('es-ES')}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result.error ? (
                <div className="text-red-600 p-4 bg-red-50 rounded-lg">
                  <p className="font-medium">Error en el análisis:</p>
                  <p className="text-sm">{result.error}</p>
                </div>
              ) : (
                <ScrollArea className="h-[600px] w-full">
                  <div className="p-4">
                    {result.query === 'comprehensive' 
                      ? renderComprehensiveResults(result.data)
                      : renderSpecificResults(result.data, result.query || '')
                    }
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 