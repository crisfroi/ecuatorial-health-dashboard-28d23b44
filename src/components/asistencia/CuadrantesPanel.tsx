import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addMonths, eachDayOfInterval, endOfMonth, format, isSameDay, startOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarPlus, ChevronLeft, ChevronRight, Download, Plus } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCuadrantesBio } from '@/hooks/useCuadrantesBio';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface CentroOption {
  id: string;
  nombre: string;
}

interface TurnoOption {
  id: string;
  nombre_turno: string;
  hora_inicio?: string | null;
  hora_fin?: string | null;
}

interface ProfessionalOption {
  id: string;
  nombre: string;
  empNo?: string | null;
}

const assignSchema = z.object({
  professionalId: z.string().min(1, 'Seleccione un profesional'),
  turnoId: z.string().min(1, 'Seleccione un turno'),
  startDate: z.string().min(1, 'Seleccione la fecha de inicio'),
  endDate: z.string().min(1, 'Seleccione la fecha de fin'),
});

type AssignFormValues = z.infer<typeof assignSchema>;

type CalendarAssignments = Record<string, Array<{ professionalId: string; turnoId: string }>>;

export function CuadrantesPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { list, assign, exportPersonalXls, exportCuadrantesXls } = useCuadrantesBio();

  const [selectedCenter, setSelectedCenter] = useState<string>('todos');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const from = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const to = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
  const centerIdFilter = selectedCenter === 'todos' ? null : selectedCenter;

  const { data: centers = [], isLoading: centersLoading } = useQuery<CentroOption[]>(
    ['centros-options'],
    async () => {
      const { data, error } = await supabase.from('centros_salud').select('id, nombre').order('nombre');
      if (error) throw error;
      return data || [];
    },
    { staleTime: 5 * 60_000 }
  );

  const { data: turnos = [] } = useQuery<TurnoOption[]>(
    ['turnos-bio'],
    async () => {
      const { data, error } = await supabase.from('turnos_biometricos').select('id, nombre_turno, hora_inicio, hora_fin').order('nombre_turno');
      if (error) throw error;
      return data || [];
    },
    { staleTime: 5 * 60_000 }
  );

  const { data: professionals = [], isLoading: professionalsLoading } = useQuery<ProfessionalOption[]>(
    ['profesionales-centro', centerIdFilter],
    async () => {
      if (!centerIdFilter) {
        const { data, error } = await supabase
          .from('profesionales_sanitarios')
          .select('id, nombre_completo, id_profesional_unico')
          .order('nombre_completo', { ascending: true })
          .limit(200);
        if (error) throw error;
        return (data || []).map((item) => ({ id: item.id, nombre: item.nombre_completo || 'Sin nombre', empNo: item.id_profesional_unico }));
      }
      const { data, error } = await supabase
        .from('profesionales_sanitarios')
        .select('id, nombre_completo, id_profesional_unico')
        .eq('centro_salud_id', centerIdFilter)
        .order('nombre_completo', { ascending: true });
      if (error) throw error;
      return (data || []).map((item) => ({ id: item.id, nombre: item.nombre_completo || 'Sin nombre', empNo: item.id_profesional_unico }));
    },
    { staleTime: 60_000, enabled: centers.length > 0 }
  );

  const { data: assignments = [], isLoading: assignmentsLoading, refetch: refetchAssignments } = useQuery(
    ['cuadrantes', centerIdFilter, from],
    () => list(centerIdFilter, from, to),
    { staleTime: 15_000, enabled: !!centerIdFilter || selectedCenter === 'todos' }
  );

  const assignMutation = useMutation(
    async (payload: AssignFormValues) => {
      const start = new Date(payload.startDate);
      const end = new Date(payload.endDate);
      if (start > end) {
        throw new Error('La fecha de inicio debe ser anterior a la fecha final');
      }
      const days = eachDayOfInterval({ start, end });
      const rows = days.map((date) => ({
        id_profesional: payload.professionalId,
        turno_id: payload.turnoId,
        fecha: format(date, 'yyyy-MM-dd'),
        centro_salud_id: centerIdFilter ?? undefined,
      }));
      await assign(rows);
      return rows.length;
    },
    {
      onSuccess: (total) => {
        toast({ title: 'Cuadrante actualizado', description: `${total} asignaciones registradas` });
        setAssignDialogOpen(false);
        setSelectedDate(null);
        queryClient.invalidateQueries({ queryKey: ['cuadrantes'] });
        void refetchAssignments();
      },
      onError: (error: any) => {
        toast({ title: 'No se pudo asignar', description: error?.message || 'Revise los datos y reintente', variant: 'destructive' });
      },
    }
  );

  const form = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      professionalId: '',
      turnoId: '',
      startDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : from,
      endDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : from,
    },
  });

  const calendarDays = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }),
    [currentMonth]
  );

  const professionalMap = useMemo(() => {
    const map = new Map<string, ProfessionalOption>();
    (professionals || []).forEach((professional) => map.set(professional.id, professional));
    return map;
  }, [professionals]);

  const turnosMap = useMemo(() => {
    const map = new Map<string, TurnoOption>();
    (turnos || []).forEach((turno) => map.set(turno.id, turno));
    return map;
  }, [turnos]);

  const assignmentsByDate = useMemo<CalendarAssignments>(() => {
    const grouped: CalendarAssignments = {};
    (assignments || []).forEach((assignment) => {
      grouped[assignment.fecha] = grouped[assignment.fecha] || [];
      grouped[assignment.fecha].push({ professionalId: assignment.id_profesional, turnoId: assignment.turno_id });
    });
    return grouped;
  }, [assignments]);

  const handleOpenAssign = (date: Date) => {
    setSelectedDate(date);
    form.reset({
      professionalId: '',
      turnoId: '',
      startDate: format(date, 'yyyy-MM-dd'),
      endDate: format(date, 'yyyy-MM-dd'),
    });
    setAssignDialogOpen(true);
  };

  const handleMonthChange = (offset: number) => {
    const next = offset > 0 ? addMonths(currentMonth, offset) : subMonths(currentMonth, Math.abs(offset));
    setCurrentMonth(next);
  };

  const handleExportPersonal = () => {
    if (!centerIdFilter) {
      toast({ title: 'Seleccione un centro', description: 'Debes elegir un centro para exportar el archivo Personal.xls', variant: 'destructive' });
      return;
    }
    exportPersonalXls(centerIdFilter, undefined, from);
  };

  const handleExportCuadrantes = () => {
    if (!centerIdFilter) {
      toast({ title: 'Seleccione un centro', description: 'Debes elegir un centro para exportar los cuadrantes', variant: 'destructive' });
      return;
    }
    exportCuadrantesXls(centerIdFilter, from, to);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Cuadrantes de asistencia</CardTitle>
              <CardDescription>Asigna turnos por profesional y descarga archivos compatibles con los dispositivos biométricos.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => handleMonthChange(-1)}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Mes anterior
              </Button>
              <Button variant="outline" onClick={() => handleMonthChange(1)}>
                Siguiente mes <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Select value={selectedCenter} onValueChange={setSelectedCenter}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Centro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los centros</SelectItem>
                  {centers.map((centro) => (
                    <SelectItem key={centro.id} value={centro.id}>
                      {centro.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{format(currentMonth, "LLLL yyyy", { locale: es })}</Badge>
            <Button variant="secondary" onClick={handleExportPersonal}>
              <Download className="mr-2 h-4 w-4" /> Exportar Personal.xls
            </Button>
            <Button variant="secondary" onClick={handleExportCuadrantes}>
              <Download className="mr-2 h-4 w-4" /> Exportar Cuadrantes.xls
            </Button>
          </div>

          {assignmentsLoading ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {calendarDays.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const items = assignmentsByDate[dateKey] || [];
                return (
                  <Card
                    key={dateKey}
                    className={cn('cursor-pointer transition hover:border-primary/50', isSameDay(day, selectedDate || new Date()) && 'border-primary')}
                    onClick={() => handleOpenAssign(day)}
                  >
                    <CardHeader className="space-y-1">
                      <CardTitle className="text-base">{format(day, "dd 'de' LLLL", { locale: es })}</CardTitle>
                      <CardDescription>{format(day, 'EEEE', { locale: es })}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {items.length ? (
                        items.map((item, index) => {
                          const professional = professionalMap.get(item.professionalId);
                          const turno = turnosMap.get(item.turnoId);
                          return (
                            <div key={`${item.professionalId}-${index}`} className="rounded-md border p-2">
                              <div className="text-sm font-medium">{professional?.nombre || 'Profesional'}</div>
                              <div className="text-xs text-muted-foreground">
                                Turno: {turno?.nombre_turno || item.turnoId}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                          Sin asignaciones
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          {centersLoading
            ? 'Cargando centros...'
            : `${assignments?.length || 0} registros de cuadrantes en el mes seleccionado`}
        </CardFooter>
      </Card>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Asignar turno biométrico</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => assignMutation.mutate(values))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="professionalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profesional</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={professionalsLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un profesional" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(professionals || []).map((professional) => (
                          <SelectItem key={professional.id} value={professional.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{professional.nombre}</span>
                              <span className="text-xs text-muted-foreground">EmpNo: {professional.empNo || '—'}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="turnoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turno</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un turno" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(turnos || []).map((turno) => (
                          <SelectItem key={turno.id} value={turno.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{turno.nombre_turno}</span>
                              <span className="text-xs text-muted-foreground">
                                {turno.hora_inicio?.slice(0, 5) || '--:--'} - {turno.hora_fin?.slice(0, 5) || '--:--'}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inicio</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fin</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAssignDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={assignMutation.isLoading}>
                  <CalendarPlus className="mr-2 h-4 w-4" /> Guardar asignaciones
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
