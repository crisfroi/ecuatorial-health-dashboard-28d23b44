import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Calendar,
  Building2,
  Activity,
  Zap,
  Download,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useReportesAsistencia } from '@/hooks/useReportesAsistencia';
import { getErrorMessage, logError } from '@/utils/errorHandler';

interface KPIData {
  totalProfesionales: number;
  presentes: number;
  ausentes: number;
  retardos: number;
  tasaAsistencia: number;
  tasaPuntualidad: number;
}

interface CentroStats {
  id: string;
  nombre: string;
  presentes: number;
  ausentes: number;
  retardos: number;
  tasaAsistencia: number;
}

interface TendenciaData {
  fecha: string;
  presentes: number;
  ausentes: number;
  retardos: number;
  tasaAsistencia: number;
}

interface ProfesionalAusente {
  id: string;
  nombre_completo: string;
  centro_salud_id: string;
  centro_nombre: string;
  tipo_falta: 'ausencia' | 'retardo';
  dias_consecutivos: number;
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

export function AsistenciaOverviewDashboard() {
  const { toast } = useToast();
  const { buildCenterSummary, buildProfessionalSummary } = useReportesAsistencia();
  
  const [selectedCenter, setSelectedCenter] = useState<string>('todos');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [centros, setCentros] = useState<CentroStats[]>([]);
  const [tendencias, setTendencias] = useState<TendenciaData[]>([]);
  const [ausentes, setAusentes] = useState<ProfesionalAusente[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch centros
  const centrosQuery = useQuery({
    queryKey: ['centros'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('centros_salud')
        .select('id, nombre')
        .order('nombre');
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60_000,
  });

  // Calculate date range
  const getDateRange = () => {
    const today = new Date();
    let from, to;

    switch (dateRange) {
      case 'today':
        from = format(startOfDay(today), 'yyyy-MM-dd');
        to = format(endOfDay(today), 'yyyy-MM-dd');
        break;
      case 'week':
        from = format(startOfDay(subDays(today, 7)), 'yyyy-MM-dd');
        to = format(endOfDay(today), 'yyyy-MM-dd');
        break;
      case 'month':
        from = format(startOfDay(subDays(today, 30)), 'yyyy-MM-dd');
        to = format(endOfDay(today), 'yyyy-MM-dd');
        break;
    }

    return { from, to };
  };

  // Fetch KPI data
  useEffect(() => {
    const fetchKPIData = async () => {
      setLoading(true);
      try {
        const { from, to } = getDateRange();
        const fromISO = new Date(`${from}T00:00:00`).toISOString();
        const toISO = new Date(`${to}T23:59:59`).toISOString();

        // Fetch logs with metadata
        const { data: logs, error: logsError } = await supabase
          .from('attendance_logs')
          .select(
            `
            id,
            id_profesional,
            fecha_hora,
            inout,
            dispositivos!inner(centro_salud_id),
            profesionales_sanitarios(nombre_completo)
          `
          )
          .gte('fecha_hora', fromISO)
          .lte('fecha_hora', toISO);

        if (logsError) throw logsError;

        // Fetch all professionals with active status
        const { data: profesionales, error: profError } = await supabase
          .from('profesionales_sanitarios')
          .select('id, nombre_completo, centro_salud_id')
          .eq('situacion_laboral', 'Activo');

        if (profError) throw profError;

        // Calculate KPIs
        const presentes = new Set();
        const retardos = new Set();
        const ausentes = new Set(profesionales?.map((p) => p.id) || []);

        if (logs) {
          for (const log of logs) {
            if (log.inout === 'IN') {
              presentes.add(log.id_profesional);
              ausentes.delete(log.id_profesional);

              // Check if late (after 8:15)
              const time = new Date(log.fecha_hora);
              if (time.getHours() > 8 || (time.getHours() === 8 && time.getMinutes() > 15)) {
                retardos.add(log.id_profesional);
              }
            }
          }
        }

        const totalProfesionales = profesionales?.length || 0;
        const presentesCount = presentes.size;
        const ausentsCount = ausentes.size;
        const retardosCount = retardos.size;

        setKpiData({
          totalProfesionales,
          presentes: presentesCount,
          ausentes: ausentsCount,
          retardos: retardosCount,
          tasaAsistencia: totalProfesionales > 0 ? (presentesCount / totalProfesionales) * 100 : 0,
          tasaPuntualidad:
            presentesCount > 0 ? ((presentesCount - retardosCount) / presentesCount) * 100 : 0,
        });

        // Fetch ausentes details
        if (ausentes.size > 0) {
          const { data: ausentsData, error: ausentsError } = await supabase
            .from('profesionales_sanitarios')
            .select('id, nombre_completo, centro_salud_id, centros_salud(nombre)')
            .in('id', Array.from(ausentes));

          if (!ausentsError && ausentsData) {
            setAusentes(
              ausentsData.map((prof) => ({
                id: prof.id,
                nombre_completo: prof.nombre_completo,
                centro_salud_id: prof.centro_salud_id,
                centro_nombre: prof.centros_salud?.nombre || 'Sin centro',
                tipo_falta: 'ausencia',
                dias_consecutivos: 1,
              }))
            );
          }
        }

        // Fetch center stats
        if (centrosQuery.data) {
          const centerStatsPromises = centrosQuery.data.map(async (centro) => {
            const { data: centreLogs } = await supabase
              .from('attendance_logs')
              .select(`
                id,
                id_profesional,
                inout,
                fecha_hora,
                dispositivos!inner(id, centro_salud_id)
              `)
              .gte('fecha_hora', fromISO)
              .lte('fecha_hora', toISO);

            const { data: centreProfs } = await supabase
              .from('profesionales_sanitarios')
              .select('id')
              .eq('centro_salud_id', centro.id)
              .eq('situacion_laboral', 'Activo');

            // Filter logs by centro (since the Supabase filter on nested relationships doesn't work reliably)
            const centroLogsFiltered = centreLogs?.filter((l) => l.dispositivos?.centro_salud_id === centro.id) || [];

            const presentesSet = new Set(
              centroLogsFiltered.filter((l) => l.inout === 'IN').map((l) => l.id_profesional) || []
            );
            const retardosSet = new Set(
              centroLogsFiltered
                .filter((l) => {
                  const time = new Date(l.fecha_hora);
                  return (
                    l.inout === 'IN' &&
                    (time.getHours() > 8 || (time.getHours() === 8 && time.getMinutes() > 15))
                  );
                })
                .map((l) => l.id_profesional) || []
            );

            const total = centreProfs?.length || 1;
            const presentes = presentesSet.size;
            const ausentes = total - presentes;
            const retardos = retardosSet.size;

            return {
              id: centro.id,
              nombre: centro.nombre,
              presentes,
              ausentes,
              retardos,
              tasaAsistencia: (presentes / total) * 100,
            };
          });

          const centerStats = await Promise.all(centerStatsPromises);
          setCentros(
            selectedCenter === 'todos'
              ? centerStats
              : centerStats.filter((c) => c.id === selectedCenter)
          );
        }
      } catch (error) {
        logError('Error fetching KPI data', error);
        const errorMessage = getErrorMessage(error);
        toast({
          title: 'Error',
          description: errorMessage || 'No se pudo cargar los datos de asistencia',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchKPIData();
  }, [dateRange, selectedCenter, centrosQuery.data]);

  if (!kpiData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare chart data
  const pieData = [
    { name: 'Presentes', value: kpiData.presentes, color: '#10b981' },
    { name: 'Retardos', value: kpiData.retardos, color: '#f59e0b' },
    { name: 'Ausentes', value: kpiData.ausentes, color: '#ef4444' },
  ];

  const centerChartData = centros.map((c) => ({
    nombre: c.nombre,
    asistencia: c.tasaAsistencia,
    ausentes: ((c.ausentes / (c.presentes + c.ausentes + c.retardos)) * 100) || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asistencia Biométrica</h1>
          <p className="text-gray-600 mt-1">
            Dashboard de monitoreo en tiempo real de asistencia profesional
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Período</label>
          <div className="flex gap-2">
            {(['today', 'week', 'month'] as const).map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange(range)}
              >
                {range === 'today'
                  ? 'Hoy'
                  : range === 'week'
                    ? 'Esta semana'
                    : 'Este mes'}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Centro de Salud</label>
          <Select value={selectedCenter} onValueChange={setSelectedCenter}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Seleccionar centro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los centros</SelectItem>
              {centrosQuery.data?.map((centro) => (
                <SelectItem key={centro.id} value={centro.id}>
                  {centro.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Total Profesionales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{kpiData.totalProfesionales}</div>
            <p className="text-xs text-gray-600 mt-1">Profesionales activos</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Presentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{kpiData.presentes}</div>
            <p className="text-xs text-gray-600 mt-1">
              {kpiData.tasaAsistencia.toFixed(1)}% de asistencia
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              Retardos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{kpiData.retardos}</div>
            <p className="text-xs text-gray-600 mt-1">
              {kpiData.tasaPuntualidad.toFixed(1)}% puntualidad
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Ausentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{kpiData.ausentes}</div>
            <p className="text-xs text-gray-600 mt-1">Sin registrar entrada</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Details */}
      <Tabs defaultValue="distribucion" className="space-y-4">
        <TabsList>
          <TabsTrigger value="distribucion">Distribución</TabsTrigger>
          <TabsTrigger value="centros">Por Centro</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="distribucion" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Asistencia</CardTitle>
                <CardDescription>Estado actual del personal</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData.filter((d) => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} personas`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas Principales</CardTitle>
                <CardDescription>Indicadores de desempeño</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Tasa de Asistencia</span>
                    <span className="text-sm font-bold text-green-600">
                      {kpiData.tasaAsistencia.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${kpiData.tasaAsistencia}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Tasa de Puntualidad</span>
                    <span className="text-sm font-bold text-blue-600">
                      {kpiData.tasaPuntualidad.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${kpiData.tasaPuntualidad}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tasa Ausencias</span>
                    <Badge variant="destructive">
                      {((kpiData.ausentes / kpiData.totalProfesionales) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tasa Retardos</span>
                    <Badge variant="outline">
                      {((kpiData.retardos / kpiData.totalProfesionales) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="centros" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Asistencia por Centro de Salud</CardTitle>
              <CardDescription>Tasa de asistencia y ausentismo por centro</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={centerChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="asistencia" fill="#10b981" name="Tasa Asistencia %" />
                  <Bar dataKey="ausentes" fill="#ef4444" name="Tasa Ausentismo %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {centros.map((centro) => (
              <Card key={centro.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{centro.nombre}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Presentes</span>
                    <span className="font-bold text-green-600">{centro.presentes}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Retardos</span>
                    <span className="font-bold text-yellow-600">{centro.retardos}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ausentes</span>
                    <span className="font-bold text-red-600">{centro.ausentes}</span>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-medium">Asistencia</span>
                      <span className="text-xs font-bold">{centro.tasaAsistencia.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${centro.tasaAsistencia}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alertas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Profesionales Ausentes
              </CardTitle>
              <CardDescription>Profesionales sin registrar entrada hoy</CardDescription>
            </CardHeader>
            <CardContent>
              {ausentes.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Excelente asistencia</p>
                  <p className="text-sm text-gray-500">Todos los profesionales han registrado entrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ausentes.map((prof) => (
                    <div
                      key={prof.id}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{prof.nombre_completo}</p>
                        <p className="text-xs text-gray-600">{prof.centro_nombre}</p>
                      </div>
                      <Badge variant="destructive">Ausente</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
