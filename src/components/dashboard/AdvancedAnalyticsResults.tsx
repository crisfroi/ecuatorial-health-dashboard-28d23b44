
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Users, 
  Building, 
  MapPin, 
  GraduationCap, 
  Calendar,
  TrendingUp,
  PieChart,
  ExternalLink
} from 'lucide-react';
import type { AdvancedStatsResult } from '@/hooks/useAdvancedAnalyticsAI';

interface AdvancedAnalyticsResultsProps {
  results: AdvancedStatsResult[];
  onNavigateToTab?: (tab: string, filters?: any) => void;
}

const AdvancedAnalyticsResults: React.FC<AdvancedAnalyticsResultsProps> = ({ 
  results, 
  onNavigateToTab 
}) => {
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay resultados para mostrar
      </div>
    );
  }

  const renderDataVisualization = (data: any, queryType: string) => {
    if (!data) return null;

    console.log('🎨 Renderizando visualización:', { queryType, data });

    return (
      <div className="space-y-6">
        {/* Resumen General */}
        {data.resumen_general && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-800">
                <BarChart3 className="w-5 h-5" />
                <span>Resumen General del Sistema</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="text-2xl font-bold text-blue-600">
                    {data.resumen_general.total_profesionales || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Total Profesionales</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="text-2xl font-bold text-green-600">
                    {data.resumen_general.total_centros || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Centros de Salud</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="text-2xl font-bold text-purple-600">
                    {data.resumen_general.total_distritos || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Distritos Sanitarios</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="text-2xl font-bold text-orange-600">
                    {data.resumen_general.total_paises || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Países de Formación</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Distribución por Género */}
        {data.distribucion_genero && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-pink-600" />
                <span>Distribución por Género</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(data.distribucion_genero).map(([genero, cantidad]: [string, any]) => {
                  const total = Object.values(data.distribucion_genero).reduce((sum: number, val: any) => {
                    const numVal = Number(val) || 0;
                    return sum + numVal;
                  }, 0);
                  const numCantidad = Number(cantidad) || 0;
                  const percentage = total > 0 ? ((numCantidad / total) * 100).toFixed(1) : '0';
                  
                  return (
                    <div key={genero} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">{genero}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{cantidad}</span>
                          <Badge variant="outline">
                            {percentage}%
                          </Badge>
                        </div>
                      </div>
                      <Progress 
                        value={Number(percentage)} 
                        className="h-2" 
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Áreas Profesionales */}
        {data.areas_profesionales && Array.isArray(data.areas_profesionales) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-blue-600" />
                <span>Áreas Profesionales</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.areas_profesionales.slice(0, 10).map((area: any, index: number) => (
                  <div key={area.area || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{area.area || 'Sin especificar'}</div>
                        <div className="text-sm text-gray-600">{area.cantidad || 0} profesionales</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {area.porcentaje || '0'}%
                      </Badge>
                      {onNavigateToTab && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onNavigateToTab('professionals', { area_profesional: area.area })}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Centros */}
        {data.top_centros && Array.isArray(data.top_centros) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-green-600" />
                <span>Centros con Más Profesionales</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.top_centros.slice(0, 8).map((centro: any, index: number) => (
                  <div key={centro.nombre || index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{centro.nombre || 'Centro sin nombre'}</div>
                        <div className="text-sm text-gray-600">{centro.categoria || 'Sin categoría'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{centro.profesionales || centro.total_profesionales || 0}</div>
                      <div className="text-xs text-gray-500">profesionales</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Distribución por Edad */}
        {data.distribucion_edad && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span>Distribución por Edad</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(data.distribucion_edad).map(([rango, cantidad]: [string, any]) => {
                  const total = Object.values(data.distribucion_edad).reduce((sum: number, val: any) => {
                    const numVal = Number(val) || 0;
                    return sum + numVal;
                  }, 0);
                  const numCantidad = Number(cantidad) || 0;
                  const percentage = total > 0 ? ((numCantidad / total) * 100).toFixed(1) : '0';
                  
                  return (
                    <div key={rango} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{rango}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{cantidad}</span>
                          <Badge variant="outline">
                            {percentage}%
                          </Badge>
                        </div>
                      </div>
                      <Progress 
                        value={Number(percentage)} 
                        className="h-2" 
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Países de Formación */}
        {data.paises_formacion && Array.isArray(data.paises_formacion) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <span>Países de Formación</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.paises_formacion.slice(0, 10).map((pais: any, index: number) => (
                  <div key={pais.pais || index} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{pais.pais || 'No especificado'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold">{pais.cantidad || 0}</span>
                      <Badge variant="secondary">
                        {pais.porcentaje || '0'}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Distritos Sanitarios */}
        {data.distritos_sanitarios && Array.isArray(data.distritos_sanitarios) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-teal-600" />
                <span>Distribución por Distritos Sanitarios</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.distritos_sanitarios.slice(0, 8).map((distrito: any, index: number) => (
                  <div key={distrito.distrito || index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{distrito.distrito || distrito.nombre || 'Sin nombre'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{distrito.profesionales || distrito.total_profesionales || 0} profesionales</span>
                      {onNavigateToTab && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onNavigateToTab('professionals', { distrito: distrito.distrito })}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Datos adicionales si existen */}
        {data.total_profesionales && !data.resumen_general && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-800">
                <TrendingUp className="w-5 h-5" />
                <span>Información General</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {data.total_profesionales}
                </div>
                <div className="text-gray-600">Total de profesionales en el sistema</div>
                {data.total_centros && (
                  <div className="mt-4 text-xl text-green-600">
                    {data.total_centros} centros de salud
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      {results.map((result, index) => (
        <div key={`result-${index}`} className="w-full">
          {result.success ? (
            renderDataVisualization(result.data, result.query || '')
          ) : (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center space-x-2">
                  <PieChart className="w-5 h-5" />
                  <span>Error en el Análisis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700">{result.error}</p>
              </CardContent>
            </Card>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdvancedAnalyticsResults;
