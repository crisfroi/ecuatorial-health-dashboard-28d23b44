// @ts-nocheck
import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  isWeekend,
  parseISO,
  set,
  subDays,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Activity,
  BarChart3,
  Clock3,
  Flame,
  Gauge,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useReportesAsistencia } from '@/hooks/useReportesAsistencia';
import { supabase } from '@/integrations/supabase/client';

interface CentroOption {
  id: string;
  nombre: string;
}

const WORKDAY_HOURS = 8;
const PUNCTUAL_THRESHOLD_HOUR = 8;
const PUNCTUAL_THRESHOLD_MIN = 15;

const toMinutes = (date: Date) => date.getHours() * 60 + date.getMinutes();

export function MetricasPanel() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const initialFrom = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(today);
  const [centerId, setCenterId] = useState<string>('todos');

  const {
    fetchLogsWithMeta,
    buildEnrichedDailyEntries,
    buildProfessionalSummary,
    buildCenterSummary,
  } = useReportesAsistencia();

  const centerQuery = useQuery<CentroOption[]>({
    queryKey: ['centros-options'],
    queryFn: async () => {
      const { data, error } = await supabase.from('centros_salud').select('id, nombre').order('nombre');
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60_000,
  });

  const filters = useMemo(
    () => ({
      from,
      to,
      centerId: centerId === 'todos' ? null : centerId,
      deviceId: null,
      professionalId: null,
    }),
    [from, to, centerId]
  );

  const logsQuery = useQuery({
    queryKey: ['attendance-metrics', filters],
    queryFn: () => fetchLogsWithMeta(filters),
    keepPreviousData: true,
    staleTime: 60_000,
  });

  const enrichedEntries = useMemo(
    () => buildEnrichedDailyEntries(logsQuery.data || []),
    [logsQuery.data, buildEnrichedDailyEntries]
  );

  const professionalSummary = useMemo(
    () => buildProfessionalSummary(enrichedEntries),
    [enrichedEntries, buildProfessionalSummary]
  );

  const centerSummary = useMemo(
    () => buildCenterSummary(enrichedEntries),
    [enrichedEntries, buildCenterSummary]
  );

  const metrics = useMemo(() => {
    if (!enrichedEntries.length) {
      return {
        attendanceRate: 0,
        lateCount: 0,
        averageDelayMinutes: 0,
        overtimeHours: 0,
        absences: 0,
        complianceRate: 0,
        punctualRanking: [] as Array<{ professionalName: string; averageMinutes: number; empNo?: string | null }>,
      };
    }

    const uniqueProfessionals = new Set(
      enrichedEntries.map((entry) => entry.id_profesional || entry.en_no || 'sin-id')
    );

    const rangeDays = differenceInCalendarDays(new Date(`${to}T00:00:00`), new Date(`${from}T00:00:00`)) + 1;
    const workingDays = eachDayOfInterval({
      start: new Date(`${from}T00:00:00`),
      end: new Date(`${to}T00:00:00`),
    }).filter((date) => !isWeekend(date)).length;

    const expectedDays = workingDays * uniqueProfessionals.size;
    const attendanceRate = expectedDays ? Math.min((enrichedEntries.length / expectedDays) * 100, 100) : 0;

    let lateCount = 0;
    let totalDelayMinutes = 0;
    let overtimeHours = 0;

    const punctualAggregator = new Map<string, { totalMinutes: number; count: number; professionalName: string; empNo?: string | null }>();

    enrichedEntries.forEach((entry) => {
      if (entry.entrada) {
        const entryDate = new Date(entry.entrada);
        const threshold = set(new Date(entry.entrada), {
          hours: PUNCTUAL_THRESHOLD_HOUR,
          minutes: PUNCTUAL_THRESHOLD_MIN,
          seconds: 0,
          milliseconds: 0,
        });
        if (entryDate > threshold) {
          lateCount += 1;
          totalDelayMinutes += Math.round((entryDate.getTime() - threshold.getTime()) / 60_000);
        }
        const minutes = toMinutes(entryDate);
        const key = entry.id_profesional || entry.en_no || 'sin-id';
        const existing = punctualAggregator.get(key) || {
          totalMinutes: 0,
          count: 0,
          professionalName: entry.professionalName || entry.empNo || 'Profesional',
          empNo: entry.empNo,
        };
        existing.totalMinutes += minutes;
        existing.count += 1;
        punctualAggregator.set(key, existing);
      }

      if (entry.total_horas && entry.total_horas > WORKDAY_HOURS) {
        overtimeHours += entry.total_horas - WORKDAY_HOURS;
      }
    });

    const punctualRanking = Array.from(punctualAggregator.entries())
      .map(([, value]) => ({
        professionalName: value.professionalName,
        empNo: value.empNo,
        averageMinutes: value.totalMinutes / Math.max(value.count, 1),
      }))
      .sort((a, b) => a.averageMinutes - b.averageMinutes)
      .slice(0, 5);

    const absences = Math.max(expectedDays - enrichedEntries.length, 0);
    const complianceRate = expectedDays ? Math.max(0, 100 - (absences / expectedDays) * 100) : 0;

    return {
      attendanceRate,
      lateCount,
      averageDelayMinutes: lateCount ? Math.round(totalDelayMinutes / lateCount) : 0,
      overtimeHours,
      absences,
      complianceRate,
      punctualRanking,
    };
  }, [enrichedEntries, from, to]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Métricas de asistencia</CardTitle>
          <CardDescription>Indicadores clave de desempeño basados en los fichajes biométricos.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Centro</Label>
            <Select value={centerId} onValueChange={(value) => setCenterId(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {(centerQuery.data || []).map((centro) => (
                  <SelectItem key={centro.id} value={centro.id}>
                    {centro.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Desde</Label>
            <Input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Hasta</Label>
            <Input type="date" value={to} min={from} max={today} onChange={(event) => setTo(event.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Gauge className="h-5 w-5" />}
          label="% asistencia promedio"
          value={metrics.attendanceRate}
          suffix="%"
          loading={logsQuery.isLoading}
        />
        <MetricCard
          icon={<Clock3 className="h-5 w-5" />}
          label="Retrasos detectados"
          value={metrics.lateCount}
          loading={logsQuery.isLoading}
        >
          <p className="text-xs text-muted-foreground">Retraso medio: {metrics.averageDelayMinutes} min</p>
        </MetricCard>
        <MetricCard
          icon={<Flame className="h-5 w-5" />}
          label="Horas extras"
          value={metrics.overtimeHours}
          precision={1}
          suffix="h"
          loading={logsQuery.isLoading}
        />
        <MetricCard
          icon={<ShieldCheck className="h-5 w-5" />}
          label="Cumplimiento de turnos"
          value={metrics.complianceRate}
          suffix="%"
          loading={logsQuery.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCheck className="h-5 w-5" /> Top profesionales puntuales
            </CardTitle>
            <CardDescription>Promedio de hora de entrada durante el periodo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {logsQuery.isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : metrics.punctualRanking.length ? (
              metrics.punctualRanking.map((item, index) => {
                const hours = Math.floor(item.averageMinutes / 60);
                const minutes = Math.round(item.averageMinutes % 60);
                const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                return (
                  <div key={item.professionalName + index} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{item.professionalName}</div>
                        <div className="text-xs text-muted-foreground">EmpNo: {item.empNo || '—'}</div>
                      </div>
                      <Badge variant={index === 0 ? 'default' : 'secondary'}>{formatted}</Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                No se encontraron registros para calcular puntualidad.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5" /> Resumen por centro
            </CardTitle>
            <CardDescription>Suma de horas registradas en cada centro.</CardDescription>
          </CardHeader>
          <CardContent>
            {logsQuery.isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : centerSummary.length ? (
              <div className="space-y-4">
                {centerSummary.map((center) => {
                  const hours = center.horas;
                  const percentage = Math.min((hours / Math.max(metrics.overtimeHours + hours, 1)) * 100, 100);
                  return (
                    <div key={center.centerId ?? 'sin-centro'} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{center.centerName || 'Sin centro'}</span>
                        <span className="text-sm text-muted-foreground">{hours.toFixed(1)} h</span>
                      </div>
                      <Progress value={percentage} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                No se registraron horas en el periodo.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5" /> Rendimiento por profesional
          </CardTitle>
          <CardDescription>Días asistidos y horas totales por profesional.</CardDescription>
        </CardHeader>
        <CardContent>
          {logsQuery.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : professionalSummary.length ? (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Días asistidos</TableHead>
                    <TableHead>Horas registradas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {professionalSummary.map((professional) => (
                    <TableRow key={professional.professionalId}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{professional.professionalName}</span>
                          <span className="text-xs text-muted-foreground">EmpNo: {professional.empNo || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{professional.dias}</TableCell>
                      <TableCell>{professional.horas.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              No se encontraron profesionales con datos suficientes.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  suffix?: string;
  precision?: number;
  loading?: boolean;
  children?: React.ReactNode;
}

function MetricCard({ icon, label, value, suffix, precision = 0, loading, children }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="inline-flex items-center justify-center rounded-md bg-primary/10 p-2 text-primary">
            {icon}
          </span>
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-3xl font-semibold">
            {value.toFixed(precision)}
            {suffix ? <span className="ml-1 text-base font-medium text-muted-foreground">{suffix}</span> : null}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
