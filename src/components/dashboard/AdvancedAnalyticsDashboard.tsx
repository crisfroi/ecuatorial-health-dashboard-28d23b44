import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  ExternalLink,
  Search,
  Loader2
} from 'lucide-react';
import { useEnhancedQuery } from '@/hooks/useEnhancedQuery';
import { useDashboardNavigation } from '@/hooks/useDashboardNavigation';
import { useToast } from '@/hooks/use-toast';
import { useAdvancedAnalyticsAI } from '@/hooks/useAdvancedAnalyticsAI';
import AdvancedAnalyticsResults from './AdvancedAnalyticsResults';

interface DashboardStats {
  totalProfesionales: number;
  profesionalesPorArea: { area: string; cantidad: number }[];
  profesionalesPorDistrito: { distrito: string; cantidad: number }[];
  profesionalesPorCentro: { centro: string; cantidad: number }[];
  distribucionEdad: { [rango: string]: number };
  paisesFormacion: { pais: string; cantidad: number }[];
  topCentros: { centro: string; cantidad: number }[];
  totalSolicitudes: number;
  solicitudesPendientes: number;
  solicitudesAprobadas: number;
  solicitudesRechazadas: number;
  solicitudesPorEstado: { estado: string; cantidad: number }[];
  topProvincias: { provincia: string; cantidad: number }[];
  distribucionGenero: { [genero: string]: number };
  tasaAprobacion: number;
  tasaRechazo: number;
  vencimientosProximos: number;
  carnetVencidos: number;
  nuevosRegistrosMes: number;
  totalCentros: number;
  topPaises: { pais: string; cantidad: number }[];
}

interface AdvancedAnalyticsDashboardProps {
  onNavigateToTab: (tab: string, filters?: any) => void;
}

const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({ onNavigateToTab }) => {
  const [stats, setStats] = useState<Partial<DashboardStats>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isAIAnalysisLoading, setIsAIAnalysisLoading] = useState(false);
  const [aiAnalysisResults, setAiAnalysisResults] = useState<any[]>([]);
  const [isAdvancedAnalysisLoading, setIsAdvancedAnalysisLoading] = useState(false);
  const [advancedAnalysisResults, setAdvancedAnalysisResults] = useState<any[]>([]);
  const [isSubmittingAIQuery, setIsSubmittingAIQuery] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiQueryResults, setAiQueryResults] = useState<any[]>([]);
  const [isAIQueryLoading, setIsAIQueryLoading] = useState(false);
  const [isAIQueryError, setIsAIQueryError] = useState(false);
  const [aiQueryError, setAiQueryError] = useState<string | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [isStatsError, setIsStatsError] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const { toast } = useToast();
  const { runAdvancedAnalytics } = useAdvancedAnalyticsAI();
  const { 
    navigateToArea, 
    navigateToDistrict, 
    navigateToCenter, 
    navigateToAgeRange, 
    navigateToGraduationYear, 
    navigateToCountry,
    navigateToRenewals,
    navigateToRequests,
    navigateToProvince
  } = useDashboardNavigation(onNavigateToTab);

  const fetchDashboardStats = useCallback(async () => {
    setIsStatsLoading(true);
    setStatsError(null);

    try {
      // Simulate fetching data from multiple endpoints
      const [
        totalProfesionales,
        profesionalesPorArea,
        profesionalesPorDistrito,
        profesionalesPorCentro,
        distribucionEdad,
        paisesFormacion,
        topCentros,
        totalSolicitudes,
        solicitudesPendientes,
        solicitudesAprobadas,
        solicitudesRechazadas,
        solicitudesPorEstado,
        topProvincias,
        distribucionGenero,
        tasaAprobacion,
        tasaRechazo,
        vencimientosProximos,
        carnetVencidos,
        nuevosRegistrosMes,
        totalCentros,
        topPaises
      ] = await Promise.all([
        Promise.resolve(Math.floor(Math.random() * 1000)),
        Promise.resolve(Array.from({ length: 5 }, (_, i) => ({ area: `Area ${i + 1}`, cantidad: Math.floor(Math.random() * 200) }))),
        Promise.resolve(Array.from({ length: 5 }, (_, i) => ({ distrito: `Distrito ${i + 1}`, cantidad: Math.floor(Math.random() * 150) }))),
        Promise.resolve(Array.from({ length: 5 }, (_, i) => ({ centro: `Centro ${i + 1}`, cantidad: Math.floor(Math.random() * 100) }))),
        Promise.resolve({ "18-24": Math.floor(Math.random() * 50), "25-34": Math.floor(Math.random() * 80), "35-44": Math.floor(Math.random() * 120) }),
        Promise.resolve(Array.from({ length: 3 }, (_, i) => ({ pais: `Pais ${i + 1}`, cantidad: Math.floor(Math.random() * 70) }))),
        Promise.resolve(Array.from({ length: 3 }, (_, i) => ({ centro: `Centro ${i + 1}`, cantidad: Math.floor(Math.random() * 90) }))),
        Promise.resolve(Math.floor(Math.random() * 300)),
        Promise.resolve(Math.floor(Math.random() * 50)),
        Promise.resolve(Math.floor(Math.random() * 200)),
        Promise.resolve(Math.floor(Math.random() * 30)),
        Promise.resolve(Array.from({ length: 3 }, (_, i) => ({ estado: `Estado ${i + 1}`, cantidad: Math.floor(Math.random() * 60) }))),
        Promise.resolve(Array.from({ length: 3 }, (_, i) => ({ provincia: `Provincia ${i + 1}`, cantidad: Math.floor(Math.random() * 80) }))),
        Promise.resolve({ Masculino: Math.floor(Math.random() * 40), Femenino: Math.floor(Math.random() * 110) }),
        Promise.resolve(Math.random() * 100),
        Promise.resolve(Math.random() * 100),
        Promise.resolve(Math.floor(Math.random() * 40)),
        Promise.resolve(Math.floor(Math.random() * 20)),
        Promise.resolve(Math.floor(Math.random() * 70)),
        Promise.resolve(Math.floor(Math.random() * 150)),
        Promise.resolve(Array.from({ length: 3 }, (_, i) => ({ pais: `Pais ${i + 1}`, cantidad: Math.floor(Math.random() * 70) })))
      ]);

      setStats({
        totalProfesionales,
        profesionalesPorArea,
        profesionalesPorDistrito,
        profesionalesPorCentro,
        distribucionEdad,
        paisesFormacion,
        topCentros,
        totalSolicitudes,
        solicitudesPendientes,
        solicitudesAprobadas,
        solicitudesRechazadas,
        solicitudesPorEstado,
        topProvincias,
        distribucionGenero,
        tasaAprobacion,
        tasaRechazo,
        vencimientosProximos,
        carnetVencidos,
        nuevosRegistrosMes,
        totalCentros,
        topPaises
      });
    } catch (err: any) {
      console.error("Error fetching dashboard stats:", err);
      setStatsError(err.message || "Failed to fetch dashboard stats");
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  const performSearch = () => {
    setIsLoading(true);
    setError(null);

    // Simulate searching through the data
    const results = [
      { id: 1, name: 'Professional 1', category: 'Doctors' },
      { id: 2, name: 'Health Center A', category: 'Hospitals' },
      { id: 3, name: 'Request Form 1', category: 'Requests' },
    ].filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory ? item.category === selectedCategory : true)
    );

    setSearchResults(results);
    setIsLoading(false);
  };

  const handleAIAnalysis = async () => {
    setIsAIAnalysisLoading(true);
    setAiAnalysisResults([]);

    // Simulate AI analysis
    const aiResults = [
      { id: 1, title: 'AI Analysis 1', description: 'Description 1' },
      { id: 2, title: 'AI Analysis 2', description: 'Description 2' },
      { id: 3, title: 'AI Analysis 3', description: 'Description 3' },
    ];

    setAiAnalysisResults(aiResults);
    setIsAIAnalysisLoading(false);
  };

  const handleAdvancedAnalysis = useCallback(async () => {
    setIsAdvancedAnalysisLoading(true);
    setAdvancedAnalysisResults([]);

    try {
      const results = await runAdvancedAnalytics([
        'distribucion_genero',
        'areas_profesionales',
        'top_centros',
        'distribucion_edad',
        'paises_formacion',
        'distritos_sanitarios',
        'resumen_general'
      ]);
      setAdvancedAnalysisResults(results);
    } catch (err: any) {
      console.error("Error running advanced analytics:", err);
      toast({
        title: "Error en el análisis avanzado",
        description: err.message || "No se pudieron obtener los resultados del análisis.",
        variant: "destructive",
      });
    } finally {
      setIsAdvancedAnalysisLoading(false);
    }
  }, [runAdvancedAnalytics, toast]);

  const handleAIQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAiQuery(e.target.value);
  };

  const submitAIQuery = async () => {
    setIsSubmittingAIQuery(true);
    setIsAIQueryLoading(true);
    setIsAIQueryError(false);
    setAiQueryError(null);
    setAiQueryResults([]);

    // Simulate AI query processing
    try {
      const aiResults = [
        { id: 1, title: 'AI Query Result 1', description: 'Result 1 based on your query' },
        { id: 2, title: 'AI Query Result 2', description: 'Result 2 based on your query' },
        { id: 3, title: 'AI Query Result 3', description: 'Result 3 based on your query' },
      ];

      setAiQueryResults(aiResults);
    } catch (err: any) {
      console.error("Error processing AI query:", err);
      setIsAIQueryError(true);
      setAiQueryError(err.message || "Failed to process AI query");
    } finally {
      setIsSubmittingAIQuery(false);
      setIsAIQueryLoading(false);
    }
  };

  useEffect(() => {
    if (!advancedAnalysisResults || advancedAnalysisResults.length === 0) {
      handleAdvancedAnalysis();
    }
  }, [advancedAnalysisResults, handleAdvancedAnalysis]);

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Búsqueda y Análisis Avanzado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={handleSearch}
            />
            <Select onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Doctors">Doctores</SelectItem>
                <SelectItem value="Hospitals">Hospitales</SelectItem>
                <SelectItem value="Requests">Solicitudes</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={performSearch} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="text-red-500">Error: {error}</div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Resultados de la Búsqueda</h3>
              <ul>
                {searchResults.map(result => (
                  <li key={result.id} className="p-2 border rounded-md">
                    {result.name} ({result.category})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Análisis con IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={handleAIAnalysis} disabled={isAIAnalysisLoading}>
              {isAIAnalysisLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analizando...
                </>
              ) : (
                "Ejecutar Análisis con IA"
              )}
            </Button>
            <Button onClick={handleAdvancedAnalysis} disabled={isAdvancedAnalysisLoading}>
              {isAdvancedAnalysisLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analizando...
                </>
              ) : (
                "Ejecutar Análisis Avanzado"
              )}
            </Button>
          </div>

          {aiAnalysisResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Resultados del Análisis con IA</h3>
              <ul>
                {aiAnalysisResults.map(result => (
                  <li key={result.id} className="p-2 border rounded-md">
                    {result.title}: {result.description}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {advancedAnalysisResults && advancedAnalysisResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Resultados del Análisis Avanzado</h3>
              <AdvancedAnalyticsResults results={advancedAnalysisResults} onNavigateToTab={onNavigateToTab} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consultas Personalizadas con IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              placeholder="Escribe tu consulta..."
              value={aiQuery}
              onChange={handleAIQueryChange}
            />
            <Button onClick={submitAIQuery} disabled={isSubmittingAIQuery}>
              {isSubmittingAIQuery ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Consultando...
                </>
              ) : (
                "Enviar Consulta a la IA"
              )}
            </Button>
          </div>

          {isAIQueryError && (
            <div className="text-red-500">Error: {aiQueryError}</div>
          )}

          {aiQueryResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Resultados de la Consulta con IA</h3>
              <ul>
                {aiQueryResults.map(result => (
                  <li key={result.id} className="p-2 border rounded-md">
                    {result.title}: {result.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas Generales */}
      {isStatsLoading ? (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Cargando Estadísticas...</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={50} />
          </CardContent>
        </Card>
      ) : isStatsError ? (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Error al Cargar Estadísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{statsError}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total de Profesionales */}
          {stats.totalProfesionales !== undefined && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-800">
                  <Users className="w-5 h-5" />
                  <span>Total de Profesionales</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {stats.totalProfesionales}
                </div>
                <div className="text-gray-600">Profesionales registrados</div>
              </CardContent>
            </Card>
          )}

          {/* Solicitudes Pendientes */}
          {stats.solicitudesPendientes !== undefined && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-yellow-800">
                  <Calendar className="w-5 h-5" />
                  <span>Solicitudes Pendientes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {stats.solicitudesPendientes}
                </div>
                <div className="text-gray-600">Solicitudes por revisar</div>
              </CardContent>
            </Card>
          )}

          {/* Tasa de Aprobación */}
          {stats.tasaAprobacion !== undefined && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-800">
                  <TrendingUp className="w-5 h-5" />
                  <span>Tasa de Aprobación</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {stats.tasaAprobacion.toFixed(1)}%
                </div>
                <div className="text-gray-600">Tasa de aprobación de solicitudes</div>
              </CardContent>
            </Card>
          )}

          {/* Vencimientos Próximos */}
          {stats.vencimientosProximos !== undefined && (
            <Card className="bg-orange-50 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-orange-800">
                  <Calendar className="w-5 h-5" />
                  <span>Vencimientos Próximos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {stats.vencimientosProximos}
                </div>
                <div className="text-gray-600">Carnets por vencer este mes</div>
              </CardContent>
            </Card>
          )}

          {/* Nuevos Registros del Mes */}
          {stats.nuevosRegistrosMes !== undefined && (
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-purple-800">
                  <Users className="w-5 h-5" />
                  <span>Nuevos Registros (Mes)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {stats.nuevosRegistrosMes}
                </div>
                <div className="text-gray-600">Nuevos profesionales registrados este mes</div>
              </CardContent>
            </Card>
          )}

          {/* Total de Centros */}
          {stats.totalCentros !== undefined && (
            <Card className="bg-teal-50 border-teal-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-teal-800">
                  <Building className="w-5 h-5" />
                  <span>Total de Centros</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-teal-600">
                  {stats.totalCentros}
                </div>
                <div className="text-gray-600">Centros de salud registrados</div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Distribución por Áreas Profesionales */}
      {Array.isArray(stats.profesionalesPorArea) && stats.profesionalesPorArea.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Áreas Profesionales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stats.profesionalesPorArea.slice(0, 6).map((area: any, index: number) => (
                <div
                  key={area.area || index}
                  className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  onClick={() => navigateToArea(area.area)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{area.area || 'Sin especificar'}</span>
                    <Badge variant="secondary">{area.cantidad || 0}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribución por Distritos Sanitarios */}
      {Array.isArray(stats.profesionalesPorDistrito) && stats.profesionalesPorDistrito.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Distritos Sanitarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stats.profesionalesPorDistrito.slice(0, 6).map((distrito: any, index: number) => (
                <div
                  key={distrito.distrito || index}
                  className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  onClick={() => navigateToDistrict(distrito.distrito)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{distrito.distrito || 'Sin especificar'}</span>
                    <Badge variant="secondary">{distrito.cantidad || 0}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribución por Centros de Salud */}
      {Array.isArray(stats.profesionalesPorCentro) && stats.profesionalesPorCentro.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Centros de Salud</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stats.profesionalesPorCentro.slice(0, 6).map((centro: any, index: number) => (
                <div
                  key={centro.centro || index}
                  className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  onClick={() => navigateToCenter(centro.centro)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{centro.centro || 'Sin especificar'}</span>
                    <Badge variant="secondary">{centro.cantidad || 0}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribución por Edad */}
      {stats.distribucionEdad && Object.keys(stats.distribucionEdad).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Edad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(stats.distribucionEdad).map(([rango, cantidad]) => (
                <div
                  key={rango}
                  className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  onClick={() => navigateToAgeRange(rango)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{rango}</span>
                    <Badge variant="secondary">{cantidad || 0}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribución por Países de Formación */}
      {Array.isArray(stats.paisesFormacion) && stats.paisesFormacion.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Países de Formación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stats.paisesFormacion.slice(0, 6).map((pais: any, index: number) => (
                <div
                  key={pais.pais || index}
                  className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  onClick={() => navigateToCountry(pais.pais)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{pais.pais || 'Sin especificar'}</span>
                    <Badge variant="secondary">{pais.cantidad || 0}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

                {/* Top países */}
                {Array.isArray(stats.topPaises) && stats.topPaises.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Países de Formación</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {stats.topPaises.slice(0, 8).map((pais: any, index: number) => (
                          <div
                            key={pais.pais || index}
                            className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                            onClick={() => navigateToCenter(pais.pais)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{pais.pais || 'Sin especificar'}</span>
                              <Badge variant="secondary">{pais.cantidad || 0}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
