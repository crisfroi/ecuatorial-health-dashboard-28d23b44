import { useMemo, useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addMonths, eachDayOfInterval, endOfMonth, format, isSameDay, startOfMonth, subMonths, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCuadrantesBio } from '@/hooks/useCuadrantesBio';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

// Importaciones de iconos del primer componente para enriquecer la UI
import {
  Calendar,
  Download,
  Grid,
  List,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
  CalendarPlus,
} from 'lucide-react';

// --- Interfaces ---

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

interface AssignmentData {
  id_profesional: string;
  turno_id: string;
  fecha: string;
}

// --- Esquema y Tipos ---

const assignSchema = z.object({
  professionalIds: z.array(z.string()).min(1, 'Seleccione al menos un profesional'),
  turnoId: z.string().min(1, 'Seleccione un turno'),
  startDate: z.string().min(1, 'Seleccione la fecha de inicio'),
  endDate: z.string().min(1, 'Seleccione la fecha de fin'),
});

type AssignFormValues = z.infer<typeof assignSchema>;

type CalendarAssignments = Record<string, Array<{ professionalId: string; turnoId: string }>>;

// --- Constantes de Diseño (Adaptadas del primer código) ---

const getTurnoBadgeColor = (tipo: string) => {
  // Simulación de tipos de turno basados en el nombre
  if (tipo.toLowerCase().includes('noche')) return 'bg-purple-100 text-purple-800';
  if (tipo.toLowerCase().includes('tarde')) return 'bg-orange-100 text-orange-800';
  if (tipo.toLowerCase().includes('mañana')) return 'bg-blue-100 text-blue-800';
  return 'bg-gray-100 text-gray-800';
};

const getDayName = (dayIndex: number) => {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return days[dayIndex];
};

const getMonthName = (month: number) => {
  const months = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  return months[month - 1];
};

// --- Componente Principal ---

export function CuadrantesPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { list, assign, exportPersonalXls, exportCuadrantesXls } = useCuadrantesBio();

  // Estados
  const [selectedCenter, setSelectedCenter] = useState<string>('todos');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewType, setViewType] = useState<'calendario' | 'lista'>('calendario');
  const [professionalSearch, setProfessionalSearch] = useState('');

  // Fechas y Filtros
  const from = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const to = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
  const centerIdFilter = selectedCenter === 'todos' ? null : selectedCenter;

  const currentMonthNumber = currentMonth.getMonth() + 1;
  const currentYearNumber = currentMonth.getFullYear();

  // --- Data Fetching (useQuery) ---

  const { data: centers = [], isLoading: centersLoading } = useQuery<CentroOption[]>({
    queryKey: ['centros-options'],
    queryFn: async () => {
      const { data, error } = await supabase.from('centros_salud').select('id, nombre').order('nombre');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });

  const { data: turnos = [] } = useQuery<TurnoOption[]>({
    queryKey: ['turnos-bio'],
    queryFn: async () => {
      const { data, error } = await supabase.from('turnos_biometricos').select('id, nombre_turno, hora_inicio, hora_fin').order('nombre_turno');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });

  const { data: professionals = [], isLoading: professionalsLoading } = useQuery<ProfessionalOption[]>({
    queryKey: ['profesionales-centro', centerIdFilter],
    queryFn: async () => {
      const baseQuery = supabase
        .from('profesionales_sanitarios')
        .select('id, nombre_completo, id_profesional_unico')
        .order('nombre_completo', { ascending: true });

      const query = centerIdFilter ? baseQuery.eq('centro_salud_id', centerIdFilter) : baseQuery.limit(200);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((item) => ({
        id: item.id,
        nombre: item.nombre_completo || 'Sin nombre',
        empNo: item.id_profesional_unico,
      }));
    },
    staleTime: 60_000,
    enabled: centers.length > 0,
  });

  const {
    data: assignments = [],
    isLoading: assignmentsLoading,
    refetch: refetchAssignments,
  } = useQuery<AssignmentData[]>({
    queryKey: ['cuadrantes', centerIdFilter, from, to],
    queryFn: () => list(centerIdFilter, from, to),
    staleTime: 15_000,
    enabled: !!centerIdFilter || selectedCenter === 'todos',
  });

  // --- Mutaciones ---

  const assignMutation = useMutation<number, Error, AssignFormValues>({
    mutationFn: async (payload) => {
      const start = new Date(payload.startDate);
      const end = new Date(payload.endDate);

      if (start > end) {
        throw new Error('La fecha de inicio debe ser anterior o igual a la fecha final');
      }
      if (!centerIdFilter) {
        throw new Error('Debe seleccionar un centro específico, no "Todos los centros", para asignar turnos.');
      }
      if (payload.professionalIds.length === 0) {
        throw new Error('Debe seleccionar al menos un profesional.');
      }

      const days = eachDayOfInterval({ start, end });
      const rows: Array<any> = [];

      for (const day of days) {
        for (const professionalId of payload.professionalIds) {
          rows.push({
            id_profesional: professionalId,
            turno_id: payload.turnoId,
            fecha: format(day, 'yyyy-MM-dd'),
            centro_salud_id: centerIdFilter,
          });
        }
      }

      await assign(rows); // Esta función maneja la inserción múltiple
      return rows.length;
    },
    onSuccess: (total) => {
      toast({ title: 'Cuadrante actualizado', description: `${total} asignaciones registradas` });
      setAssignDialogOpen(false);
      setSelectedDate(null);
      // Invalida solo la consulta de cuadrantes para no refetchar centros/profesionales
      queryClient.invalidateQueries({ queryKey: ['cuadrantes'], exact: false });
      void refetchAssignments();
    },
    onError: (error) => {
      toast({ title: 'No se pudo asignar', description: error.message || 'Revise los datos y reintente', variant: 'destructive' });
    },
  });

  // --- Mapeos y Datos Derivados ---

  const professionalMap = useMemo(() => {
    const map = new Map<string, ProfessionalOption>();
    professionals.forEach((professional) => map.set(professional.id, professional));
    return map;
  }, [professionals]);

  const turnosMap = useMemo(() => {
    const map = new Map<string, TurnoOption>();
    turnos.forEach((turno) => map.set(turno.id, turno));
    return map;
  }, [turnos]);

  const assignmentsByDate = useMemo<CalendarAssignments>(() => {
    const grouped: CalendarAssignments = {};
    assignments.forEach((assignment) => {
      grouped[assignment.fecha] = grouped[assignment.fecha] || [];
      grouped[assignment.fecha].push({ professionalId: assignment.id_profesional, turnoId: assignment.turno_id });
    });
    return grouped;
  }, [assignments]);

  const calendarDays = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }),
    [currentMonth]
  );

  const daysInMonth = calendarDays.length;
  const firstDayOfMonth = getDay(startOfMonth(currentMonth)); // 0 = Domingo, 1 = Lunes

  // --- Lógica del Formulario ---

  const form = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      professionalIds: [],
      turnoId: '',
      startDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : from,
      endDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : from,
    },
    mode: 'onChange',
  });

  // Sincronizar fechas en el formulario cuando se selecciona una fecha del calendario
  useEffect(() => {
    if (selectedDate) {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      form.setValue('startDate', dateString);
      form.setValue('endDate', dateString);
      form.clearErrors(['startDate', 'endDate']);
    }
  }, [selectedDate, form]);

  // --- Handlers de UI ---

  const handleOpenAssign = (date: Date) => {
    if (!centerIdFilter) {
      toast({
        title: 'Selección requerida',
        description: 'Por favor, seleccione un centro de salud específico para asignar turnos.',
        variant: 'destructive',
      });
      return;
    }
    setSelectedDate(date);
    form.reset({
      professionalIds: [],
      turnoId: '',
      startDate: format(date, 'yyyy-MM-dd'),
      endDate: format(date, 'yyyy-MM-dd'),
    });
    setProfessionalSearch(''); // Limpiar el filtro de búsqueda
    setAssignDialogOpen(true);
  };

  const handleMonthChange = (offset: number) => {
    const next = offset > 0 ? addMonths(currentMonth, offset) : subMonths(currentMonth, Math.abs(offset));
    setCurrentMonth(next);
  };

  const handleExportPersonal = useCallback(() => {
    if (!centerIdFilter) {
      toast({ title: 'Seleccione un centro', description: 'Debes elegir un centro para exportar el archivo Personal.xls', variant: 'destructive' });
      return;
    }
    exportPersonalXls(centerIdFilter, from, to, toast);
  }, [centerIdFilter, from, to, exportPersonalXls, toast]);

  const handleExportCuadrantes = useCallback(() => {
    if (!centerIdFilter) {
      toast({ title: 'Seleccione un centro', description: 'Debes elegir un centro para exportar los cuadrantes', variant: 'destructive' });
      return;
    }
    exportCuadrantesXls(centerIdFilter, from, to);
  }, [centerIdFilter, from, to, exportCuadrantesXls]);

  // --- Vistas de Renderizado ---

  const renderCalendarView = () => {
    const calendarElements = [];

    // Días vacíos al inicio del mes
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarElements.push(
        <div key={`empty-${i}`} className="h-32 bg-gray-50 border border-gray-200"></div>
      );
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(currentYearNumber, currentMonthNumber - 1, day);
      const dateKey = format(dayDate, 'yyyy-MM-dd');
      const assignmentsDelDia = assignmentsByDate[dateKey] || [];
      const isToday = isSameDay(dayDate, new Date());

      calendarElements.push(
        <div
          key={day}
          className={cn(
            'h-32 border border-gray-200 p-2 overflow-hidden hover:bg-gray-50 transition-colors cursor-pointer',
            isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
          )}
          onClick={() => handleOpenAssign(dayDate)}
        >
          <div className={`text-lg font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {day}
          </div>
          <div className="space-y-1">
            {assignmentsDelDia.slice(0, 2).map((assignment, index) => {
              const professional = professionalMap.get(assignment.professionalId);
              const turno = turnosMap.get(assignment.turnoId);
              return (
                <div
                  key={index}
                  className="text-xs p-1 rounded truncate"
                  style={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
                  title={`${professional?.nombre || 'Sin asignar'} - ${turno?.nombre_turno || 'Turno'}`}
                >
                  {professional?.nombre?.split(' ')[0] || 'Sin prof.'} ({turno?.nombre_turno.split(' ')[0] || 'T'})
                </div>
              );
            })}
            {assignmentsDelDia.length > 2 && (
              <div className="text-xs text-gray-500">
                +{assignmentsDelDia.length - 2} más
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-0 border border-gray-300 rounded-lg overflow-hidden">
        {/* Encabezados de días */}
        {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
          <div
            key={dayIndex}
            className="bg-gray-100 p-2 text-center text-sm font-medium text-gray-700 border-b border-gray-300"
          >
            {getDayName(dayIndex)}
          </div>
        ))}
        {/* Días del calendario */}
        {calendarElements}
      </div>
    );
  };

  const renderListView = () => {
    const sortedDates = Object.keys(assignmentsByDate).sort();

    return (
      <div className="space-y-4">
        {sortedDates.map((fecha) => (
          <Card key={fecha}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>
                  {format(new Date(fecha), "EEEE, dd 'de' LLLL 'de' yyyy", { locale: es })}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {assignmentsByDate[fecha].map((assignment, index) => {
                  const professional = professionalMap.get(assignment.professionalId);
                  const turno = turnosMap.get(assignment.turnoId);

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{professional?.nombre || 'No asignado'}</span>
                        <Badge className={getTurnoBadgeColor(turno?.nombre_turno || 'ordinario')}>
                          {turno?.nombre_turno || 'Turno sin nombre'}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {turno?.hora_inicio?.slice(0, 5) || '--:--'} - {turno?.hora_fin?.slice(0, 5) || '--:--'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        {sortedDates.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay asignaciones programadas</h3>
              <p className="text-gray-600">
                Seleccione un centro y haga click en una fecha para asignar un turno.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const filteredProfessionals = useMemo(() => {
    if (!professionalSearch) return professionals;
    return professionals.filter((p) =>
      p.nombre.toLowerCase().includes(professionalSearch.toLowerCase()) ||
      p.empNo?.toLowerCase().includes(professionalSearch.toLowerCase())
    );
  }, [professionals, professionalSearch]);

  const totalAssignedProfessionals = useMemo(() => {
    const profIds = assignments.map(a => a.id_profesional);
    return new Set(profIds.filter(id => id)).size;
  }, [assignments]);

  const totalLocalizableAssignments = useMemo(() => {
    const localizableIds = turnos.filter(t => t.nombre_turno.toLowerCase().includes('localizable')).map(t => t.id);
    return assignments.filter(a => localizableIds.includes(a.turno_id)).length;
  }, [assignments, turnos]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cuadrantes de Asistencia Biométrico</h2>
          <p className="text-gray-600">
            Programación de turnos para {getMonthName(currentMonthNumber)} {currentYearNumber}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Controles de mes */}
          <Button variant="outline" size="sm" onClick={() => handleMonthChange(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())} title="Ir al mes actual">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleMonthChange(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Selector de Centro */}
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

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-base py-1 px-3 font-semibold">
                {format(currentMonth, "LLLL yyyy", { locale: es })}
              </Badge>
              {centerIdFilter && (
                <Badge variant="secondary" className="text-sm py-1 px-2">
                  Centro: {centers.find(c => c.id === centerIdFilter)?.nombre || 'Seleccionado'}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center space-x-2">
              {/* Controles de vista */}
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={viewType === 'calendario' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewType('calendario')}
                  className="rounded-none"
                  title="Vista Calendario"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewType === 'lista' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewType('lista')}
                  className="rounded-none"
                  title="Vista Lista"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              {/* Botones de acción */}
              <Button variant="secondary" onClick={handleExportPersonal} disabled={!centerIdFilter}>
                <Download className="mr-2 h-4 w-4" /> Exportar Personal.xls
              </Button>
              <Button variant="secondary" onClick={handleExportCuadrantes} disabled={!centerIdFilter}>
                <Download className="mr-2 h-4 w-4" /> Exportar Cuadrantes.xls
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {assignmentsLoading || professionalsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando cuadrante...</p>
            </div>
          ) : (
            <div className="min-h-[500px]">
              {viewType === 'calendario' ? renderCalendarView() : renderListView()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen Estadístico (Adaptado del primer código) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Asignaciones</p>
                <p className="text-2xl font-bold">{assignments.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Profesionales Asignados</p>
                <p className="text-2xl font-bold">{totalAssignedProfessionals}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Turnos Biométricos</p>
                <p className="text-2xl font-bold">{turnos.length}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Asignaciones Localizable</p>
                <p className="text-2xl font-bold">{totalLocalizableAssignments}</p>
              </div>
              <Calendar className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diálogo de Asignación (Actualizado con Multi-Select) */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Asignar Turno Biométrico</DialogTitle>
            <CardDescription className="pt-1">
              {selectedDate
                ? `Asignación para el rango: ${format(new Date(form.getValues('startDate')), 'dd/MM/yyyy')} a ${format(new Date(form.getValues('endDate')), 'dd/MM/yyyy')}`
                : 'Asigne profesionales y un turno para el período seleccionado.'}
            </CardDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => assignMutation.mutate(values))}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Columna 1: Selección de Fechas */}
                <div className="col-span-1 space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Rango de Fechas</h3>
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

                  {/* Selección de Turno */}
                  <h3 className="text-lg font-semibold border-b pb-2 pt-4">Selección de Turno</h3>
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
                            {turnos.map((turno) => (
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
                </div>

                {/* Columna 2 y 3: Selección de Profesionales (Multi-Select) */}
                <FormField
                  control={form.control}
                  name="professionalIds"
                  render={() => (
                    <FormItem className="md:col-span-2">
                      <h3 className="text-lg font-semibold border-b pb-2">
                        Profesionales
                        {centerIdFilter ? (
                          <span className="text-sm font-normal text-muted-foreground ml-2">
                            ({professionals.length} en este centro)
                          </span>
                        ) : (
                          <span className="text-sm font-normal text-red-500 ml-2">
                            (Seleccione un centro para ver y asignar)
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Search className="w-4 h-4 text-gray-500" />
                        <Input
                          placeholder="Buscar profesional por nombre o EmpNo..."
                          value={professionalSearch}
                          onChange={(e) => setProfessionalSearch(e.target.value)}
                          disabled={!centerIdFilter || professionalsLoading}
                        />
                      </div>
                      <FormLabel className="pt-2 block">
                        Seleccionados: {form.getValues('professionalIds').length}
                      </FormLabel>
                      <ScrollArea className="h-64 w-full rounded-md border p-4 bg-gray-50">
                        {professionalsLoading ? (
                          <div className="text-center text-sm text-gray-500">Cargando profesionales...</div>
                        ) : (
                          filteredProfessionals.map((professional) => (
                            <FormField
                              key={professional.id}
                              control={form.control}
                              name="professionalIds"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={professional.id}
                                    className="flex flex-row items-start space-x-3 space-y-0 p-2 hover:bg-white rounded-md transition-colors"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(professional.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, professional.id])
                                            : field.onChange(field.value?.filter((value) => value !== professional.id));
                                        }}
                                        disabled={!centerIdFilter}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel className="font-medium cursor-pointer">
                                        {professional.nombre}
                                      </FormLabel>
                                      <div className="text-xs text-muted-foreground">
                                        EmpNo: {professional.empNo || '—'}
                                      </div>
                                    </div>
                                  </FormItem>
                                );
                              }}
                            />
                          ))
                        )}
                        {!filteredProfessionals.length && professionalSearch && (
                           <div className="text-center text-sm text-gray-500 py-4">No se encontraron profesionales.</div>
                        )}
                      </ScrollArea>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAssignDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    assignMutation.isLoading ||
                    !centerIdFilter ||
                    form.getValues('professionalIds').length === 0 ||
                    !form.formState.isValid
                  }
                >
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