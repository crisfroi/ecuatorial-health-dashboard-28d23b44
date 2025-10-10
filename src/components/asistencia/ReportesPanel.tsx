import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Download, FileSpreadsheet, LineChart, Users, Building2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAsistencia } from '@/hooks/useAsistencia';
import { useReportesAsistencia } from '@/hooks/useReportesAsistencia';
import { supabase } from '@/integrations/supabase/client';

import { FichajesList } from './FichajesList';

interface CentroOption {
  id: string;
  nombre: string;
}

interface DeviceOption {
  id: string;
  nombre: string;
}

interface ProfessionalOption {
  id: string;
  nombre: string;
  empNo?: string | null;
}

const formatTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : format(date, 'HH:mm:ss');
};

export function ReportesPanel() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const initialFrom = format(subDays(new Date(), 7), 'yyyy-MM-dd');

  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(today);
  const [centerId, setCenterId] = useState<string>('todos');
  const [deviceId, setDeviceId] = useState<string>('todos');
  const [professionalId, setProfessionalId] = useState<string>('todos');

  const { exportDAT } = useAsistencia();
  const {
    fetchLogsWithMeta,
    buildEnrichedDailyEntries,
    buildWeeklySummary,
    buildMonthlySummary,
    buildProfessionalSummary,
    buildCenterSummary,
  } = useReportesAsistencia();

  // useQuery v5 Syntax
  const centerQuery = useQuery<CentroOption[]>({
    queryKey: ['centros-options'],
    queryFn: async () => {
      const { data, error } = await supabase.from('centros_salud').select('id, nombre').order('nombre');
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60_000,
  });

  // useQuery v5 Syntax
  const deviceQuery = useQuery<DeviceOption[]>({
    queryKey: ['dispositivos', centerId, 'reportes'],
    queryFn: async () => {
      let query = supabase.from('dispositivos').select('id, nombre');
      if (centerId !== 'todos') query = query.eq('centro_salud_id', centerId);
      const { data, error } = await query.order('nombre');
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });

  // useQuery v5 Syntax
  const professionalQuery = useQuery<ProfessionalOption[]>({
    queryKey: ['profesionales-reportes', centerId],
    queryFn: async () => {
      let query = supabase
        .from('profesionales_sanitarios')
        .select('id, nombre_completo, id_profesional_unico')
        .order('nombre_completo')
        .limit(400);
      if (centerId !== 'todos') query = query.eq('centro_salud_id', centerId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((item) => ({
        id: item.id,
        nombre: item.nombre_completo || 'Sin nombre',
        empNo: item.id_profesional_unico,
      }));
    },
    staleTime: 60_000,
  });

  const filters = useMemo(
    () => ({
      from,
      to,
      centerId: centerId === 'todos' ? null : centerId,
      deviceId: deviceId === 'todos' ? null : deviceId,
      professionalId: professionalId === 'todos' ? null : professionalId,
    }),
    [from, to, centerId, deviceId, professionalId]
  );

  // useQuery v5 Syntax
  const logsQuery = useQuery({
    queryKey: ['attendance-logs', filters],
    queryFn: () => fetchLogsWithMeta(filters),
    keepPreviousData: true,
    staleTime: 30_000,
  });

  const enrichedEntries = useMemo(
    () => buildEnrichedDailyEntries(logsQuery.data || []),
    [logsQuery.data, buildEnrichedDailyEntries]
  );

  const weeklySummary = useMemo(
    () => buildWeeklySummary(enrichedEntries),
    [enrichedEntries, buildWeeklySummary]
  );

  const monthlySummary = useMemo(
    () => buildMonthlySummary(enrichedEntries),
    [enrichedEntries, buildMonthlySummary]
  );

  const professionalSummary = useMemo(
    () => buildProfessionalSummary(enrichedEntries),
    [enrichedEntries, buildProfessionalSummary]
  );

  const centerSummary = useMemo(
    () => buildCenterSummary(enrichedEntries),
    [enrichedEntries, buildCenterSummary]
  );

  const fichajeRows = useMemo(
    () =>
      (logsQuery.data || []).map((log) => ({
        enNo: log.en_no,
        fechaHora: log.fecha_hora,
        mode: log.mode,
        inout: log.inout,
        source: log.deviceName || undefined,
        profesional: log.professionalName || null,
      })),
    [logsQuery.data]
  );

  // ------------------------------------------------
  // EL RETURN COMIENZA AQUÍ, LIBRE DE LLAVES ADICIONALES
  // ------------------------------------------------
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Reportes de asistencia</CardTitle>
              <CardDescription>
                Analiza la asistencia por rango de fechas, centro, dispositivo y profesional.
              </CardDescription>
            </div>
            <Button
              variant="secondary"
              onClick={() => exportDAT(enrichedEntries)}
              disabled={!enrichedEntries.length}
            >
              <Download className="mr-2 h-4 w-4" /> Exportar DAT
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <div className="space-y-2 md:col-span-2">
              <Label>Desde</Label>
              <Input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Hasta</Label>
              <Input type="date" value={to} min={from} max={today} onChange={(event) => setTo(event.target.value)} />
            </div>
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
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Dispositivo</Label>
              <Select value={deviceId} onValueChange={setDeviceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {(deviceQuery.data || []).map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Profesional</Label>
              <Select value={professionalId} onValueChange={setProfessionalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="todos">Todos</SelectItem>
                  {(professionalQuery.data || []).map((professional) => (
                    <SelectItem key={professional.id} value={professional.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{professional.nombre}</span>
                        <span className="text-xs text-muted-foreground">EmpNo: {professional.empNo || '—'}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <LineChart className="h-4 w-4" /> Registros
            </CardTitle>
            <CardDescription>Fichajes en el rango seleccionado</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {logsQuery.isLoading ? <Skeleton className="h-8 w-24" /> : logsQuery.data?.length ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="h-4 w-4" /> Días consolidados
            </CardTitle>
            <CardDescription>Entradas y salidas por día</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {logsQuery.isLoading ? <Skeleton className="h-8 w-24" /> : enrichedEntries.length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" /> Profesionales
            </CardTitle>
            <CardDescription>Con fichajes en el periodo</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {logsQuery.isLoading ? <Skeleton className="h-8 w-24" /> : new Set(enrichedEntries.map((entry) => entry.id_profesional || entry.en_no)).size}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" /> Centros
            </CardTitle>
            <CardDescription>Con actividad registrada</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {logsQuery.isLoading ? <Skeleton className="h-8 w-24" /> : new Set(enrichedEntries.map((entry) => entry.centerId || 'sin-centro')).size}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle de asistencia</CardTitle>
          <CardDescription>Consulta vistas agregadas por periodo, profesional y centro.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="diario" className="space-y-4">
            <TabsList className="grid grid-cols-2 gap-2 md:grid-cols-5">
              <TabsTrigger value="diario">Diario</TabsTrigger>
              <TabsTrigger value="semanal">Semanal</TabsTrigger>
              <TabsTrigger value="mensual">Mensual</TabsTrigger>
              <TabsTrigger value="profesional">Por profesional</TabsTrigger>
              <TabsTrigger value="centro">Por centro</TabsTrigger>
            </TabsList>

            <TabsContent value="diario" className="space-y-4">
              {logsQuery.isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : enrichedEntries.length ? (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Profesional</TableHead>
                        <TableHead>Entrada</TableHead>
                        <TableHead>Salida</TableHead>
                        <TableHead>Horas</TableHead>
                        <TableHead>Centro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrichedEntries.map((entry) => (
                        <TableRow key={`${entry.empNo || entry.id_profesional || entry.en_no}-${entry.fecha}`}>
                          <TableCell>{format(new Date(`${entry.fecha}T00:00:00`), "dd 'de' MMMM", { locale: es })}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{entry.professionalName || entry.empNo || 'Profesional'}</span>
                              <span className="text-xs text-muted-foreground">EmpNo: {entry.empNo || '—'}</span>
                            </div>
                          </TableCell>
                          <TableCell>{formatTime(entry.entrada)}</TableCell>
                          <TableCell>{formatTime(entry.salida)}</TableCell>
                          <TableCell>{entry.total_horas?.toFixed(2) ?? '—'}</TableCell>
                          <TableCell>{entry.centerName || 'Sin centro'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              ) : (
                <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No se encontraron registros en el periodo seleccionado.
                </div>
              )}
            </TabsContent>

            <TabsContent value="semanal">
              {logsQuery.isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : weeklySummary.length ? (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Semana</TableHead>
                        <TableHead>Días registrados</TableHead>
                        <TableHead>Horas totales</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weeklySummary.map((week) => (
                        <TableRow key={week.weekKey}>
                          <TableCell>{week.label}</TableCell>
                          <TableCell>{week.dias}</TableCell>
                          <TableCell>{week.horas.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              ) : (
                <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No hay consolidación semanal disponible.
                </div>
              )}
            </TabsContent>

            <TabsContent value="mensual">
              {logsQuery.isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : monthlySummary.length ? (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mes</TableHead>
                        <TableHead>Días registrados</TableHead>
                        <TableHead>Horas totales</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlySummary.map((month) => (
                        <TableRow key={month.monthKey}>
                          <TableCell>{month.label}</TableCell>
                          <TableCell>{month.dias}</TableCell>
                          <TableCell>{month.horas.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              ) : (
                <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No hay consolidación mensual disponible.
                </div>
              )}
            </TabsContent>

            <TabsContent value="profesional">
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
              ) : (
                <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No se encontraron profesionales con asistencia registrada.
                </div>
              )}
            </TabsContent>

            <TabsContent value="centro">
              {logsQuery.isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : centerSummary.length ? (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Centro</TableHead>
                        <TableHead>Días registrados</TableHead>
                        <TableHead>Horas totales</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {centerSummary.map((center) => (
                        <TableRow key={center.centerId ?? 'sin-centro'}>
                          <TableCell>{center.centerName || 'Sin centro'}</TableCell>
                          <TableCell>{center.dias}</TableCell>
                          <TableCell>{center.horas.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              ) : (
                <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No se encontraron centros con registros.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fichajes individuales</CardTitle>
          <CardDescription>Vista previa de los registros importados con identificación del dispositivo.</CardDescription>
        </CardHeader>
        <CardContent>
          <FichajesList rows={fichajeRows} />
        </CardContent>
      </Card>
    </div>
              );
} // <--- ESTA DEBE SER LA ÚNICA LLAVE DE CIERRE FINAL