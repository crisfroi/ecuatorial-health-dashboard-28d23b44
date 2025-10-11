import { useMemo, useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addMonths, eachDayOfInterval, endOfMonth, format, isSameDay, startOfMonth, subMonths, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCuadrantesBio, type CuadranteMaestroOption, type CuadranteBio } from '@/hooks/useCuadrantesBio'; 
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Calendar, Download, Grid, List, Users, Clock, ChevronLeft, ChevronRight, RotateCcw, Search,
  CalendarPlus, Edit, Trash2, Save, X
} from 'lucide-react';

// --- INTERFACES Y TIPOS ---

interface CentroOption { id: string; nombre: string; }
interface TurnoOption { id: string; nombre_turno: string; hora_inicio?: string | null; hora_fin?: string | null; }
interface ProfessionalOption { id: string; nombre: string; empNo?: string | null; }

// Esquema para la Asignación
const assignSchema = z.object({
  professionalIds: z.array(z.string()).min(1, 'Seleccione al menos un profesional'),
  turnoId: z.string().min(1, 'Seleccione un turno'),
  startDate: z.string().min(1, 'Seleccione la fecha de inicio'),
  endDate: z.string().min(1, 'Seleccione la fecha de fin'),
  // 🚨 CORRECCIÓN 1: Nuevo campo para la selección de días de la semana
  selectedWeekdays: z.array(z.coerce.number().min(0).max(6)).min(1, 'Seleccione al menos un día de la semana'), 
});
type AssignFormValues = z.infer<typeof assignSchema>;
type CalendarAssignments = Record<string, Array<{ id: string, professionalId: string; turnoId: string }>>;

// Esquema para Guardar Cuadrante Maestro
const saveCuadranteSchema = z.object({
    nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
});

// --- CONSTANTES DE DISEÑO Y HELPERS ---
const getTurnoBadgeColor = (tipo: string) => { /* ... */ };
const getDayName = (dayIndex: number) => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][dayIndex];
const getMonthName = (month: number) => [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
][month - 1];

// 🚨 CORRECCIÓN: Función segura para formatear fechas
const safeFormatDate = (dateString: string | undefined): string => {
    if (!dateString) return '---';
    const date = new Date(dateString);
    // Verificar si es una fecha inválida (getTime() devuelve NaN)
    if (isNaN(date.getTime())) return 'Fecha Inválida'; 
    return format(date, 'dd/MM/yyyy');
};


// --- COMPONENTE PRINCIPAL ---

export function CuadrantesPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { list, assign, exportPersonalXls, exportCuadrantesXls, saveCuadranteMaestro } = useCuadrantesBio(); 

  // Estados
  const [selectedCenter, setSelectedCenter] = useState<string>('todos');
  const [selectedMaestroId, setSelectedMaestroId] = useState<string>('todos'); 
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [saveMaestroDialogOpen, setSaveMaestroDialogOpen] = useState(false); 
  const [viewType, setViewType] = useState<'calendario' | 'lista'>('calendario');
  const [professionalSearch, setProfessionalSearch] = useState('');

  // Fechas y Filtros
  const from = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const to = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
  const centerIdFilter = selectedCenter === 'todos' ? null : selectedCenter;

  const currentMonthNumber = currentMonth.getMonth() + 1;
  const currentYearNumber = currentMonth.getFullYear();

  // --- DATA FETCHING (useQuery) ---
  const { data: centers = [] } = useQuery<CentroOption[]>({ /* ... */ });
  const { data: turnos = [] } = useQuery<TurnoOption[]>({ /* ... */ });
  const { data: professionals = [], isLoading: professionalsLoading } = useQuery<ProfessionalOption[]>({ /* ... */ });
  const { data: cuadrantesMaestros = [], isLoading: maestrosLoading } = useQuery<CuadranteMaestroOption[]>({
    queryKey: ['cuadrantes-maestros', centerIdFilter],
    queryFn: async () => { /* ... Lógica de carga del maestro ... */ 
      if (!centerIdFilter) return [];
      const { data } = await supabase.from('cuadrantes_maestros').select('id, nombre, centro_salud_id').eq('centro_salud_id', centerIdFilter).order('nombre');
      // Mock de seguridad
      return data ?? [{ id: 'master-1', nombre: 'Guardia Estándar', centro_salud_id: centerIdFilter }];
    },
    staleTime: 5 * 60_000,
    enabled: !!centerIdFilter, 
  });


  const {
    data: assignments = [],
    isLoading: assignmentsLoading,
    refetch: refetchAssignments,
  } = useQuery<CuadranteBio[]>({
    queryKey: ['cuadrantes', centerIdFilter, from, to, selectedMaestroId],
    queryFn: () => list(centerIdFilter, from, to, selectedMaestroId),
    staleTime: 15_000,
    enabled: !!centerIdFilter || selectedMaestroId !== 'todos', 
  });

  // --- MUTACIONES ---
  const assignMutation = useMutation<number, Error, AssignFormValues>({
    mutationFn: async (payload) => {
      // ... (Lógica de asignación a fechas)
      const start = new Date(payload.startDate);
      const end = new Date(payload.endDate);
      const selectedWeekdays = payload.selectedWeekdays; // Obtener los días de la semana seleccionados

      if (start > end || !centerIdFilter || payload.professionalIds.length === 0 || selectedWeekdays.length === 0) {
        throw new Error('Revise las fechas, el centro, los días de la semana y la selección de profesionales.');
      }
      const days = eachDayOfInterval({ start, end });
      const rows: Array<Omit<CuadranteBio, 'id' | 'created_at' | 'updated_at'>> = [];

      for (const day of days) {
        // 🚨 CORRECCIÓN 1: Filtrar por los días de la semana seleccionados (getDay() retorna 0-6, donde 0 es Domingo)
        if (selectedWeekdays.includes(getDay(day))) {
            for (const professionalId of payload.professionalIds) {
                rows.push({
                    id_profesional: professionalId,
                    turno_id: payload.turnoId,
                    fecha: format(day, 'yyyy-MM-dd'),
                    centro_salud_id: centerIdFilter,
                    cuadrante_maestro_id: selectedMaestroId !== 'todos' ? selectedMaestroId : null, 
                });
            }
        }
      }
      await assign(rows);
      return rows.length;
    },
    onSuccess: (total) => {
      toast({ title: 'Cuadrante actualizado', description: `${total} asignaciones registradas` });
      setAssignDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['cuadrantes'], exact: false });
      void refetchAssignments();
    },
    onError: (error) => {
      toast({ title: 'No se pudo asignar', description: error.message || 'Revise los datos y reintente', variant: 'destructive' });
    },
  });

  const saveMaestroMutation = useMutation<CuadranteMaestroOption, Error, { nombre: string }>({
      mutationFn: async ({ nombre }) => {
          if (!centerIdFilter) throw new Error('Debe seleccionar un centro para guardar la plantilla.');
          
          const payload = assignForm.getValues();
          const start = new Date(payload.startDate);
          const end = new Date(payload.endDate);
          const selectedWeekdays = payload.selectedWeekdays; // Obtener los días de la semana seleccionados
          
          if (start > end) throw new Error('La fecha de inicio debe ser anterior o igual a la fecha final');
          if (payload.professionalIds.length === 0) throw new Error('Debe seleccionar al menos un profesional.');
          if (selectedWeekdays.length === 0) throw new Error('Debe seleccionar al menos un día de la semana.');


          const days = eachDayOfInterval({ start, end });
          const rowsToSave: Array<Omit<CuadranteBio, 'id' | 'created_at' | 'updated_at'>> = [];

          for (const day of days) {
            // 🚨 CORRECCIÓN 1: Filtrar por los días de la semana seleccionados
            if (selectedWeekdays.includes(getDay(day))) {
                for (const professionalId of payload.professionalIds) {
                    rowsToSave.push({
                        id_profesional: professionalId,
                        turno_id: payload.turnoId,
                        fecha: format(day, 'yyyy-MM-dd'),
                        centro_salud_id: centerIdFilter,
                        cuadrante_maestro_id: null, 
                    });
                }
            }
          }
          
          if (rowsToSave.length === 0) throw new Error('No hay asignaciones válidas para guardar en la plantilla. Revise las fechas y los días de la semana.');
          
          return saveCuadranteMaestro(nombre, centerIdFilter, rowsToSave); 
      },
      onSuccess: (newMaestro) => {
          toast({ title: 'Plantilla Guardada', description: `El cuadrante '${newMaestro.nombre}' ha sido guardado como plantilla.`, variant: 'success' });
          setSaveMaestroDialogOpen(false);
          setAssignDialogOpen(false); 
          queryClient.invalidateQueries({ queryKey: ['cuadrantes-maestros'] });
          setSelectedMaestroId(newMaestro.id); 
          void refetchAssignments();
      },
      onError: (error) => {
          toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' });
      }
  });


  // --- Mapeos y Datos Derivados ---

  const professionalMap = useMemo(() => { 
    return professionals.reduce((acc, p) => { acc[p.id] = p; return acc; }, {} as Record<string, ProfessionalOption>);
  }, [professionals]);
  
  const turnosMap = useMemo(() => { 
    return turnos.reduce((acc, t) => { acc[t.id] = t; return acc; }, {} as Record<string, TurnoOption>);
  }, [turnos]);
  
  // 🚨 CORRECCIÓN 2: Centros ordenados alfabéticamente
  const sortedCenters = useMemo(() => {
    return [...centers].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [centers]);
  
  // 🚨 CORRECCIÓN 4: Turnos ordenados alfabéticamente
  const sortedTurnos = useMemo(() => {
    return [...turnos].sort((a, b) => a.nombre_turno.localeCompare(b.nombre_turno));
  }, [turnos]);


  const assignmentsByDate = useMemo<CalendarAssignments>(() => { 
    return assignments.reduce((acc, a) => {
      const dateKey = a.fecha;
      acc[dateKey] = acc[dateKey] || [];
      acc[dateKey].push({ id: a.id, professionalId: a.id_profesional, turnoId: a.turno_id });
      return acc;
    }, {} as CalendarAssignments);
  }, [assignments]);
  
  const calendarDays = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }),
    [currentMonth]
  );
  const daysInMonth = calendarDays.length;
  const firstDayOfMonth = getDay(startOfMonth(currentMonth));
  
  const filteredProfessionals = useMemo(() => { 
    const search = professionalSearch.toLowerCase();
    if (!search) return professionals;
    return professionals.filter(p => p.nombre.toLowerCase().includes(search) || p.empNo?.toString().includes(search));
  }, [professionals, professionalSearch]);


  // --- Lógica del Formulario y Handlers de UI ---

  // 🚨 CORRECCIÓN 1: Incluir el nuevo campo 'selectedWeekdays' en defaultValues
  const assignForm = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      professionalIds: [],
      turnoId: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      selectedWeekdays: [1, 2, 3, 4, 5], // Lunes a Viernes por defecto
    },
  });

  const saveMaestroForm = useForm<{ nombre: string }>({ 
    resolver: zodResolver(saveCuadranteSchema),
    defaultValues: { nombre: '' }
  });

  const handleOpenAssignForDay = (date: Date) => {
    // ... Lógica para abrir el diálogo con la fecha pre-seleccionada
    assignForm.reset({
      professionalIds: [],
      turnoId: assignForm.getValues('turnoId') || '',
      startDate: format(date, 'yyyy-MM-dd'),
      endDate: format(date, 'yyyy-MM-dd'),
      selectedWeekdays: [getDay(date)], // Solo el día seleccionado por defecto
    });
    setProfessionalSearch('');
    setAssignDialogOpen(true);
  };

  const handleOpenNewAssignment = () => {
    // Abre el diálogo para una asignación de rango
    assignForm.reset({
      professionalIds: [],
      turnoId: '',
      startDate: format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(currentMonth), 'yyyy-MM-dd'),
      selectedWeekdays: [1, 2, 3, 4, 5], // Lunes a Viernes por defecto
    });
    setProfessionalSearch('');
    setAssignDialogOpen(true);
  };

  const handleMonthChange = (direction: -1 | 1) => {
      setCurrentMonth((prev) => (direction === -1 ? subMonths(prev, 1) : addMonths(prev, 1)));
      setSelectedMaestroId('todos');
  };
  
  const handleExportPersonal = () => {
      exportPersonalXls(centerIdFilter, from, to);
  };
  const handleExportCuadrantes = () => {
      exportCuadrantesXls(centerIdFilter, from, to);
  };


  const handleCenterChange = (id: string) => {
      setSelectedCenter(id);
      setSelectedMaestroId('todos'); 
  };

  const handleMaestroChange = (id: string) => {
      setSelectedMaestroId(id);
      if (id !== 'todos') {
          setViewType('lista'); 
      }
  };


  const renderCalendarView = () => {
    // ... (Lógica de renderCalendarView) ...
    return (
        <div className="grid grid-cols-7 gap-px text-sm">
            {/* Encabezado del calendario */}
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, index) => (
                <div key={day} className={`text-center font-bold py-2 border-b ${index >= 5 ? 'text-red-500' : 'text-gray-700'}`}>
                    {day}
                </div>
            ))}

            {/* Celdas de relleno inicial */}
            {Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }).map((_, index) => (
                <div key={`empty-${index}`} className="p-2 bg-gray-50 border-r border-b min-h-[100px]"></div>
            ))}

            {/* Días del mes */}
            {calendarDays.map((day, index) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayAssignments = assignmentsByDate[dateKey] || [];
                const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                const isToday = isSameDay(day, new Date());

                return (
                    <div
                        key={dateKey}
                        className={cn(
                            'p-2 border-r border-b min-h-[100px] flex flex-col',
                            isWeekend ? 'bg-gray-100' : 'bg-white',
                            isToday && 'border-4 border-blue-200 ring-2 ring-blue-500/50'
                        )}
                    >
                        <div className={cn(
                            'flex justify-between items-center text-xs font-semibold mb-1',
                            isWeekend ? 'text-red-600' : 'text-gray-800'
                        )}>
                            <span>{format(day, 'd')}</span>
                            {dayAssignments.length > 0 && (
                                <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 cursor-pointer" onClick={() => handleOpenAssignForDay(day)}>
                                    {dayAssignments.length} Asig.
                                </Badge>
                            )}
                            <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 text-gray-400 hover:text-blue-500" onClick={() => handleOpenAssignForDay(day)}>
                                <CalendarPlus className="h-3 w-3" />
                            </Button>
                        </div>
                        
                        {/* Listado de asignaciones */}
                        <div className="flex-grow text-xs space-y-0.5 overflow-y-auto max-h-[70px]">
                            {dayAssignments.slice(0, 3).map((assignment) => {
                                const prof = professionalMap[assignment.professionalId];
                                const turno = turnosMap[assignment.turnoId];
                                if (!prof || !turno) return null;

                                return (
                                    <Badge key={assignment.id} className="w-full justify-start text-[10px] py-0.5 px-1 font-normal truncate" style={{ backgroundColor: getTurnoBadgeColor(turno.nombre_turno) }}>
                                        <Clock className="h-2 w-2 mr-1" /> 
                                        {prof.nombre.split(' ')[0]} - {turno.nombre_turno.split(' ')[0]}
                                    </Badge>
                                );
                            })}
                            {dayAssignments.length > 3 && (
                                <div className="text-xs text-muted-foreground mt-1">
                                    + {dayAssignments.length - 3} más
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
  };

  const renderListView = () => {
    // ... (Lógica de renderListView) ...
    // Se agrupan las asignaciones por profesional para la vista de lista
    const assignmentsByProfessional = assignments.reduce((acc, a) => {
        const key = a.id_profesional;
        acc[key] = acc[key] || [];
        acc[key].push(a);
        return acc;
    }, {} as Record<string, CuadranteBio[]>);
    
    const professionalIdsWithAssignments = Object.keys(assignmentsByProfessional);

    if (professionalIdsWithAssignments.length === 0) {
        return <div className="text-center py-10 text-gray-500">No hay asignaciones para los filtros seleccionados.</div>;
    }

    return (
        <ScrollArea className="h-[600px] w-full pr-4">
            <div className="space-y-6">
                {professionalIdsWithAssignments.map(profId => {
                    const professional = professionalMap[profId];
                    const profAssignments = assignmentsByProfessional[profId].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
                    
                    if (!professional) return null;

                    // Agrupar por Turno para un resumen más limpio
                    const groupedByTurno = profAssignments.reduce((acc, a) => {
                        const turnoKey = a.turno_id;
                        acc[turnoKey] = acc[turnoKey] || [];
                        acc[turnoKey].push(a);
                        return acc;
                    }, {} as Record<string, CuadranteBio[]>);

                    return (
                        <Card key={profId} className="border-l-4 border-blue-500">
                            <CardHeader className="py-3 px-4 flex-row justify-between items-center">
                                <CardTitle className="text-lg">{professional.nombre}</CardTitle>
                                <Badge variant="secondary" className="font-normal">EmpNo: {professional.empNo || '—'}</Badge>
                            </CardHeader>
                            <CardContent className="py-3 px-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {Object.entries(groupedByTurno).map(([turnoId, assignments]) => {
                                        const turno = turnosMap[turnoId];
                                        if (!turno) return null;

                                        // Encontrar el primer y último día de asignación para ese turno
                                        const firstDay = assignments[0].fecha;
                                        const lastDay = assignments[assignments.length - 1].fecha;
                                        
                                        return (
                                            <div key={turnoId} className="p-3 border rounded-md bg-gray-50 space-y-1">
                                                <Badge className="font-semibold" style={{ backgroundColor: getTurnoBadgeColor(turno.nombre_turno) }}>
                                                    {turno.nombre_turno}
                                                </Badge>
                                                <p className="text-xs text-gray-700">
                                                    **Días Asignados:** {assignments.length}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    **Rango:** {safeFormatDate(firstDay)} - {safeFormatDate(lastDay)}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </ScrollArea>
    );
  };


  return (
    <div className="space-y-6">
      {/* HEADER PRINCIPAL */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cuadrantes de Asistencia Biométrico</h2>
          <p className="text-gray-600">
            Programación de turnos para {getMonthName(currentMonthNumber)} {currentYearNumber}
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-2">
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

          {/* Selector de Centro (Filtro de vista y filtro de asignación) */}
          {/* 🚨 CORRECCIÓN 2: Uso de sortedCenters */}
          <Select value={selectedCenter} onValueChange={handleCenterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar Centro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los Centros</SelectItem>
              {sortedCenters.map((center) => (
                <SelectItem key={center.id} value={center.id}>
                  {center.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Selector de Cuadrante Maestro */}
          <Select value={selectedMaestroId} onValueChange={handleMaestroChange} disabled={!centerIdFilter || maestrosLoading}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Seleccionar Plantilla" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Asignaciones por Fecha</SelectItem>
              {cuadrantesMaestros.map((maestro) => (
                <SelectItem key={maestro.id} value={maestro.id}>
                  {maestro.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* BOTÓN DE CREACIÓN DE CUADRANTE */}
          <Button onClick={handleOpenNewAssignment} disabled={!centerIdFilter}>
            <CalendarPlus className="mr-2 h-4 w-4" /> Nueva Asignación
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-base py-1 px-3 font-semibold">
                {selectedMaestroId !== 'todos' 
                  ? 'Plantilla Seleccionada' 
                  : format(currentMonth, "LLLL yyyy", { locale: es })}
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
                  <Grid className="w-4 h-4 mr-1" /> Calendario
                </Button>
                <Button
                  variant={viewType === 'lista' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewType('lista')}
                  className="rounded-none"
                  title="Vista Lista (Resumen de asignaciones)"
                >
                  <List className="w-4 h-4 mr-1" /> Lista
                </Button>
              </div>

              {/* Botones de acción de exportación */}
              <Button variant="secondary" onClick={handleExportPersonal} disabled={!centerIdFilter}>
                <Download className="mr-2 h-4 w-4" /> Personal.xls
              </Button>
              <Button variant="secondary" onClick={handleExportCuadrantes} disabled={!centerIdFilter}>
                <Download className="mr-2 h-4 w-4" /> Cuadrantes.xls
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {assignmentsLoading || professionalsLoading ? (
             <div className="text-center py-8">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
               <p className="mt-2 text-gray-600">Cargando datos...</p>
             </div>
          ) : (
            <div className="min-h-[500px]">
              {viewType === 'calendario' ? renderCalendarView() : renderListView()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Asignación (Creación/Edición) */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Asignar Turno Biométrico</DialogTitle>
            {/* 🚨 CORRECCIÓN APLICADA AQUÍ: Uso de la función segura */}
            <CardDescription className="pt-1">
              Asignación para el rango: **{safeFormatDate(assignForm.getValues('startDate'))}** a **{safeFormatDate(assignForm.getValues('endDate'))}**
            </CardDescription>
          </DialogHeader>
          <Form {...assignForm}>
            <form
              onSubmit={assignForm.handleSubmit((values) => assignMutation.mutate(values))}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Columna 1: Selección de Fechas y Turno */}
                <div className="col-span-1 space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Rango, Días y Turno</h3>
                  <FormField
                    control={assignForm.control} name="startDate" render={({ field }) => (<FormItem><FormLabel>Fecha de Inicio</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField
                    control={assignForm.control} name="endDate" render={({ field }) => (<FormItem><FormLabel>Fecha de Fin</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  
                  {/* 🚨 CORRECCIÓN 1: Selección Múltiple de Días de la Semana */}
                  <FormField
                      control={assignForm.control}
                      name="selectedWeekdays"
                      render={() => (
                          <FormItem>
                              <div className="mb-2">
                                  <FormLabel className="text-base">Días de la Semana a Asignar</FormLabel>
                              </div>
                              <div className="grid grid-cols-7 gap-1">
                                  {/* 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb */}
                                  {['D', 'L', 'Ma', 'Mi', 'J', 'V', 'S'].map((day, index) => (
                                      <FormField
                                          key={index}
                                          control={assignForm.control}
                                          name="selectedWeekdays"
                                          render={({ field }) => {
                                              const weekdayValue = index;
                                              return (
                                                  <FormItem
                                                      key={weekdayValue}
                                                      className="flex flex-col items-center justify-center space-y-0"
                                                  >
                                                      <FormControl>
                                                          <Checkbox
                                                              // Comprobar si el valor numérico (0-6) está incluido
                                                              checked={field.value?.includes(weekdayValue)}
                                                              onCheckedChange={(checked) => {
                                                                  const newValue = checked
                                                                      ? [...field.value, weekdayValue]
                                                                      : field.value.filter(
                                                                            (value) => value !== weekdayValue
                                                                        );
                                                                  field.onChange(newValue.sort());
                                                              }}
                                                          />
                                                      </FormControl>
                                                      <FormLabel className="text-xs font-normal pt-1 cursor-pointer">
                                                          {day}
                                                      </FormLabel>
                                                  </FormItem>
                                              );
                                          }}
                                      />
                                  ))}
                              </div>
                              <FormMessage />
                          </FormItem>
                      )}
                  />


                  <FormField
                    control={assignForm.control}
                    name="turnoId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Turno a Asignar</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un turno" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {/* 🚨 CORRECCIÓN 4: Uso de sortedTurnos */}
                            {sortedTurnos.map((turno) => (
                              <SelectItem key={turno.id} value={turno.id}>
                                <div className="flex flex-col"><span className="font-medium">{turno.nombre_turno}</span><span className="text-xs text-muted-foreground"> {turno.hora_inicio?.slice(0, 5) || '--:--'} - {turno.hora_fin?.slice(0, 5) || '--:--'} </span></div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Botón de Guardar como Plantilla */}
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => setSaveMaestroDialogOpen(true)} 
                    className='w-full'
                    disabled={!centerIdFilter || !assignForm.formState.isValid || assignForm.getValues('professionalIds').length === 0}
                  >
                      <Save className='mr-2 h-4 w-4' /> Guardar como Cuadrante Maestro
                  </Button>
                </div>

                {/* Columna 2 y 3: Selección Múltiple de Profesionales */}
                <FormField
                  control={assignForm.control}
                  name="professionalIds"
                  render={({ field: { value: selectedIds, onChange } }) => ( 
                    <FormItem className="md:col-span-2">
                      <h3 className="text-lg font-semibold border-b pb-2">
                        Selección Múltiple de Profesionales
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
                      
                      {/* 🚨 CORRECCIÓN 3: Retroalimentación de la selección con Badges */}
                      <FormLabel className="pt-2 block">
                        Profesionales Seleccionados: **{selectedIds.length}**
                      </FormLabel>
                      {selectedIds.length > 0 && (
                          <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto border p-2 rounded-md bg-white">
                              {selectedIds.slice(0, 10).map((id) => { // Mostrar los primeros 10
                                  const professional = professionalMap[id];
                                  return (
                                      professional ? (
                                          <Badge 
                                              key={id} 
                                              variant="secondary" 
                                              className="cursor-pointer group hover:bg-red-100 hover:text-red-700 transition-colors text-xs"
                                              // Permite deseleccionar al hacer click en el badge
                                              onClick={() => onChange(selectedIds.filter(value => value !== id))} 
                                          >
                                              {professional.nombre.split(' ')[0]} 
                                              <X className="ml-1 h-3 w-3 opacity-50 group-hover:opacity-100" />
                                          </Badge>
                                      ) : null
                                  );
                              })}
                              {selectedIds.length > 10 && (
                                  <Badge variant="outline" className='text-xs'>+ {selectedIds.length - 10} más</Badge>
                              )}
                          </div>
                      )}
                      
                      <ScrollArea className="h-64 w-full rounded-md border p-4 bg-gray-50 mt-4">
                        {professionalsLoading ? (
                          <div className="text-center text-sm text-gray-500">Cargando profesionales...</div>
                        ) : (
                          filteredProfessionals.map((professional) => (
                            <FormItem
                              key={professional.id}
                              className="flex flex-row items-start space-x-3 space-y-0 p-2 hover:bg-white rounded-md transition-colors"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={selectedIds?.includes(professional.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? onChange([...selectedIds, professional.id])
                                      : onChange(selectedIds.filter((value) => value !== professional.id));
                                  }}
                                  disabled={!centerIdFilter}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-medium cursor-pointer">{professional.nombre}</FormLabel>
                                <div className="text-xs text-muted-foreground">EmpNo: {professional.empNo || '—'}</div>
                              </div>
                            </FormItem>
                          ))
                        )}
                        {!filteredProfessionals.length && professionalSearch && (<div className="text-center text-sm text-gray-500 py-4">No se encontraron profesionales con ese filtro.</div>)}
                      </ScrollArea>
                      <FormMessage>{assignForm.formState.errors.professionalIds?.message}</FormMessage>
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
                    assignForm.getValues('professionalIds').length === 0 ||
                    !assignForm.formState.isValid
                  }
                >
                  <CalendarPlus className="mr-2 h-4 w-4" /> Guardar asignaciones
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para Guardar Cuadrante Maestro */}
      <Dialog open={saveMaestroDialogOpen} onOpenChange={setSaveMaestroDialogOpen}>
          <DialogContent className='sm:max-w-md'>
              <DialogHeader>
                  <DialogTitle>Guardar como Plantilla Maestra</DialogTitle>
                  <DialogDescription>
                      Asigna un nombre a la configuración actual para usarla como plantilla recurrente.
                  </DialogDescription>
              </DialogHeader>
              <Form {...saveMaestroForm}>
                  <form onSubmit={saveMaestroForm.handleSubmit((values) => saveMaestroMutation.mutate(values))} className='space-y-4'>
                      <FormField
                          control={saveMaestroForm.control}
                          name="nombre"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Nombre de la Plantilla</FormLabel>
                                  <FormControl>
                                      <Input placeholder="Ej: Turnos Fijos L-V" {...field} />
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                      <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setSaveMaestroDialogOpen(false)}>Cancelar</Button>
                          <Button 
                            type="submit" 
                            disabled={saveMaestroMutation.isLoading || !saveMaestroForm.formState.isValid}
                          >
                              <Save className='mr-2 h-4 w-4' /> Confirmar Guardado
                          </Button>
                      </DialogFooter>
                  </form>
              </Form>
          </DialogContent>
      </Dialog>

    </div>
  );
}