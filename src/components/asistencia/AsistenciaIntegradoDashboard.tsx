import React, { useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
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
  Download,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  useAsistenciaConsolidada,
  type FiltrosAsistencia,
} from '@/hooks/useAsistenciaConsolidada';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

interface StatsCard {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  suffix?: string;
}

export function AsistenciaIntegradoDashboard() {
  const { toast } = useToast();
  const today = format(new Date(), 'yyyy-MM-dd');
  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  const [activeTab, setActiveTab] = useState<'consolidado' | 'biometrico' | 'manual'>('consolidado');
  const [selectedCentro, setSelectedCentro] = useState<string>('todos');
  const [fechaDesde, setFechaDesde] = useState(thirtyDaysAgo);
  const [fechaHasta, setFechaHasta] = useState(today);

  // Fetch centros
  const centrosQuery = useQuery({
    queryKey: ['centros_salud_opciones'],
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

  // Build filtros based on active tab
  const filtros = useMemo<FiltrosAsistencia>(() => {
    const base: FiltrosAsistencia = {
      fechaDesde,
      fechaHasta,
      limit: 1000,
    };

    if (selectedCentro !== 'todos') {
      base.centroId = selectedCentro;
    }

    if (activeTab === 'biometrico') {
      base.sourceType = 'biometrico';
    } else if (activeTab === 'manual') {
      base.sourceType = 'manual';
    }

    return base;
  }, [fechaDesde, fechaHasta, selectedCentro, activeTab]);

  // Fetch consolidated data
  const asistenciaQuery = useAsistenciaConsolidada(filtros);

  // Calculate statistics
  const stats = useMemo<StatsCard[]>(() => {
    const data = asistenciaQuery.data || [];

    const entradas = data.filter((d) => d.inout === 'IN').length;
    const salidas = data.filter((d) => d.inout === 'OUT').length;
    const biometricos = data.filter((d) => d.source_type === 'biometrico').length;
    const manuales = data.filter((d) => d.source_type === 'manual').length;

    return [
      {
        label: 'Total Registros',
        value: data.length,
        icon: <Users className="h-5 w-5" />,
        color: 'bg-blue-100 text-blue-700',
      },
      {
        label: 'Entradas',
        value: entradas,
        icon: <Clock className="h-5 w-5" />,
        color: 'bg-green-100 text-green-700',
      },
      {
        label: 'Salidas',
        value: salidas,
        icon: <Clock className="h-5 w-5" />,
        color: 'bg-orange-100 text-orange-700',
      },
      {
        label: 'Fuente Biométrica',
        value: biometricos,
        icon: <Wifi className="h-5 w-5" />,
        color: 'bg-purple-100 text-purple-700',
        suffix: `(${manuales})`,
      },
    ];
  }, [asistenciaQuery.data]);

  // Group by date for chart
  const chartData = useMemo(() => {
    if (!asistenciaQuery.data) return [];

    const grouped = new Map<string, { IN: number; OUT: number }>();

    asistenciaQuery.data.forEach((record) => {
      const date = format(new Date(record.fecha_hora), 'yyyy-MM-dd');
      if (!grouped.has(date)) {
        grouped.set(date, { IN: 0, OUT: 0 });
      }
      const entry = grouped.get(date)!;
      if (record.inout === 'IN') {
        entry.IN += 1;
      } else if (record.inout === 'OUT') {
        entry.OUT += 1;
      }
    });

    return Array.from(grouped.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, counts]) => ({
        date: format(new Date(date), 'dd MMM', { locale: es }),
        IN: counts.IN,
        OUT: counts.OUT,
      }));
  }, [asistenciaQuery.data]);

  // Group by source type for pie
  const sourceData = useMemo(() => {
    if (!asistenciaQuery.data) return [];

    const grouped = asistenciaQuery.data.reduce(
      (acc, record) => {
        const idx = acc.findIndex((d) => d.name === record.source_type);
        if (idx >= 0) {
          acc[idx].value += 1;
        } else {
          acc.push({ name: record.source_type === 'biometrico' ? 'Biométrico' : 'Manual', value: 1 });
        }
        return acc;
      },
      [] as Array<{ name: string; value: number }>
    );

    return grouped;
  }, [asistenciaQuery.data]);

  const handleExport = () => {
    if (!asistenciaQuery.data || asistenciaQuery.data.length === 0) {
      toast({
        title: 'Error',
        description: 'No hay datos para exportar',
        variant: 'destructive',
      });
      return;
    }

    const csv = [
      ['Fecha', 'Hora', 'Entrada/Salida', 'Profesional', 'Centro', 'Fuente', 'Temperatura'],
      ...asistenciaQuery.data.map((record) => [
        format(new Date(record.fecha_hora), 'yyyy-MM-dd'),
        format(new Date(record.fecha_hora), 'HH:mm:ss'),
        record.inout || '',
        record.numero_enno || '',
        record.centro_salud_id || '',
        record.source_type || '',
        record.temperature || '',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asistencia-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const isLoading = asistenciaQuery.isLoading;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Selecciona los parámetros para ver los datos de asistencia</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="centro">Centro de Salud</Label>
            <Select value={selectedCentro} onValueChange={setSelectedCentro}>
              <SelectTrigger id="centro">
                <SelectValue placeholder="Todos" />
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

          <div className="space-y-2">
            <Label htmlFor="desde">Desde</Label>
            <Input
              id="desde"
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              max={fechaHasta}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hasta">Hasta</Label>
            <Input
              id="hasta"
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              min={fechaDesde}
              max={today}
            />
          </div>

          <div className="flex items-end gap-2">
            <Button
              onClick={() => asistenciaQuery.refetch()}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
            <Button
              onClick={handleExport}
              disabled={isLoading || !asistenciaQuery.data || asistenciaQuery.data.length === 0}
              variant="outline"
              size="sm"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-2">
                    {isLoading ? <Skeleton className="h-8 w-12" /> : stat.value}
                    {stat.suffix && <span className="text-sm text-muted-foreground ml-2">{stat.suffix}</span>}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${stat.color}`}>{stat.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico */}
      <Card>
        <CardHeader>
          <CardTitle>Asistencia Diaria</CardTitle>
          <CardDescription>Tendencia de entradas y salidas</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="IN" stroke="#10b981" name="Entradas" />
                <Line type="monotone" dataKey="OUT" stroke="#ef4444" name="Salidas" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Sin datos para mostrar
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla de Registros */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Asistencia</CardTitle>
          <CardDescription>Vista detallada de todos los fichajes</CardDescription>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
            className="mt-4"
          >
            <TabsList>
              <TabsTrigger value="consolidado">
                Todos ({asistenciaQuery.data?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="biometrico">
                Biométrico ({asistenciaQuery.data?.filter((d) => d.source_type === 'biometrico').length || 0})
              </TabsTrigger>
              <TabsTrigger value="manual">
                Manual ({asistenciaQuery.data?.filter((d) => d.source_type === 'manual').length || 0})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : asistenciaQuery.data && asistenciaQuery.data.length > 0 ? (
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Centro</TableHead>
                    <TableHead>Fuente</TableHead>
                    <TableHead>Temperatura</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {asistenciaQuery.data.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(record.fecha_hora), 'dd/MM/yyyy HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.inout === 'IN' ? 'default' : 'secondary'}>
                          {record.inout || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.numero_enno || 'Sin identificar'}</TableCell>
                      <TableCell className="text-sm">
                        {record.centro_salud_id || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {record.source_type === 'biometrico' ? (
                            <>
                              <Wifi className="mr-1 h-3 w-3" /> Biométrico
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-1 h-3 w-3" /> Manual
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.temperature ? `${record.temperature.toFixed(1)}°C` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <AlertTriangle className="h-10 w-10 mb-2 opacity-50" />
              <p>No hay datos disponibles para los filtros seleccionados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
