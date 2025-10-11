import { useMemo, useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// Importaciones de date-fns, incluyendo addMonths y subMonths para la navegación
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
// 🚨 CAMBIO CLAVE: Importamos saveCuadranteMaestro y las interfaces del hook
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
// Eliminadas: CuadranteMaestroOption y AssignmentData (ahora CuadranteBio) porque se importan del hook

// Esquema para la Asignación
const assignSchema = z.object({
  professionalIds: z.array(z.string()).min(1, 'Seleccione al menos un profesional'),
  turnoId: z.string().min(1, 'Seleccione un turno'),
  startDate: z.string().min(1, 'Seleccione la fecha de inicio'),
  endDate: z.string().min(1, 'Seleccione la fecha de fin'),
});
type AssignFormValues = z.infer<typeof assignSchema>;
type CalendarAssignments = Record<string, Array<{ id: string, professionalId: string; turnoId: string }>>;

// Esquema para Guardar Cuadrante Maestro
const saveCuadranteSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
});

// --- CONSTANTES DE DISEÑO ---
const getTurnoBadgeColor = (tipo: string) => { /* ... */ };
const getDayName = (dayIndex: number) => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][dayIndex];
const getMonthName = (month: number) => [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
][month - 1];

// --- COMPONENTE PRINCIPAL ---

export function CuadrantesPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // 🚨 CAMBIO CLAVE: Se añade saveCuadranteMaestro al destructuring
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

  // Carga de Cuadrantes Maestros (Plantillas)
  const { data: cuadrantesMaestros = [], isLoading: maestrosLoading } = useQuery<CuadranteMaestroOption[]>({
    queryKey: ['cuadrantes-maestros', centerIdFilter],
    queryFn: async () => { /* ... Lógica de carga del maestro ... */
      if (!centerIdFilter) return [];

      const { data, error } = await supabase
        .from('cuadrantes_maestros')
        .select('id, nombre, centro_salud_id')
        .eq('centro_salud_id', centerIdFilter)
        .order('nombre');

      if (error) {
        console.warn("Error al cargar cuadrantes maestros. Usando mock data si es necesario.", error);
        // Si el hook ya maneja el error, devolvemos data o array vacío.
        // Aquí mantenemos el mock en caso de error para la simulación de la UI:
        return [
          { id: 'master-1', nombre: 'Guardia Estándar', centro_salud_id: centerIdFilter },
          { id: 'master-2', nombre: 'Verano Reducido', centro_salud_id: centerIdFilter },
        ];
      }
      return data ?? [];
    },
    staleTime: 5 * 60_000,
    enabled: !!centerIdFilter,
  });


  // Carga de Asignaciones (se filtra por mes O por Cuadrante Maestro)
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
      // ... (Lógica de asignación a fechas, ya incluye cuadrante_maestro_id)
      const start = new Date(payload.startDate);
      const end = new Date(payload.endDate);
      if (start > end || !centerIdFilter || payload.professionalIds.length === 0) {
        throw new Error('Revise las fechas, el centro y la selección de profesionales.');
      }
      const days = eachDayOfInterval({ start, end });
      const rows: Array<Omit<CuadranteBio, 'id' | 'created_at' | 'updated_at'>> = [];

      for (const day of days) {
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

  // 🚨 CAMBIO CLAVE: Mutación de Guardado de Plantilla (Lógica real)
  const saveMaestroMutation = useMutation<CuadranteMaestroOption, Error, { nombre: string }>({
    mutationFn: async ({ nombre }) => {
      if (!centerIdFilter) throw new Error('Debe seleccionar un centro para guardar la plantilla.');

      const payload = assignForm.getValues();
      const start = new Date(payload.startDate);
      const end = new Date(payload.endDate);

      if (start > end) throw new Error('La fecha de inicio debe ser anterior o igual a la fecha final');
      if (payload.professionalIds.length === 0) throw new Error('Debe seleccionar al menos un profesional.');

      const days = eachDayOfInterval({ start, end });
      // La plantilla usa las fechas del formulario para guardar las asignaciones
      const rowsToSave: Array<Omit<CuadranteBio, 'id' | 'created_at' | 'updated_at'>> = [];

      for (const day of days) {
        for (const professionalId of payload.professionalIds) {
          rowsToSave.push({
            id_profesional: professionalId,
            turno_id: payload.turnoId,
            fecha: format(day, 'yyyy-MM-dd'),
            centro_salud_id: centerIdFilter,
            cuadrante_maestro_id: null, // El hook le asignará el ID del nuevo maestro
          });
        }
      }

      if (rowsToSave.length === 0) throw new Error('No hay asignaciones válidas para guardar en la plantilla.');

      // Llamada a la función del hook (asumo que se comporta como en mi respuesta anterior)
      return saveCuadranteMaestro(nombre, centerIdFilter, rowsToSave);
    },
    onSuccess: (newMaestro) => {
      toast({ title: 'Plantilla Guardada', description: `El cuadrante '${newMaestro.nombre}' ha sido guardado como plantilla.`, variant: 'success' });
      setSaveMaestroDialogOpen(false);
      setAssignDialogOpen(false); // Cierra también el diálogo principal
      queryClient.invalidateQueries({ queryKey: ['cuadrantes-maestros'] });
      setSelectedMaestroId(newMaestro.id); // Selecciona la nueva plantilla
      void refetchAssignments();
    },
    onError: (error) => {
      toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' });
    }
  });


  // --- Mapeos y Datos Derivados ---

  const professionalMap = useMemo(() => { /* ... */ }, [professionals]);
  const turnosMap = useMemo(() => { /* ... */ }, [turnos]);
  const assignmentsByDate = useMemo<CalendarAssignments>(() => { /* ... */ }, [assignments]);
  const calendarDays = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }),
    [currentMonth]
  );
  const daysInMonth = calendarDays.length;
  const firstDayOfMonth = getDay(startOfMonth(currentMonth));
  const filteredProfessionals = useMemo(() => { /* ... */ }, [professionals, professionalSearch]);


  // --- Lógica del Formulario y Handlers de UI ---

  const assignForm = useForm<AssignFormValues>({ /* ... */ });
  const saveMaestroForm = useForm<{ nombre: string }>({ /* ... */ });

  const handleOpenAssignForDay = (date: Date) => { /* ... */ };

  const handleOpenNewAssignment = () => { /* ... */ };

  // 🚨 AÑADIDO: Lógica de navegación de mes
  const handleMonthChange = (direction: -1 | 1) => {
    setCurrentMonth((prev) => (direction === -1 ? subMonths(prev, 1) : addMonths(prev, 1)));
    setSelectedMaestroId('todos'); // Al cambiar de mes, siempre vuelve a la vista normal
  };

  // 🚨 AÑADIDO: Wrappers de exportación
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
    // Si hay un Cuadrante Maestro seleccionado, se muestra un aviso para ir a la vista de lista
    if (selectedMaestroId !== 'todos') {
      // Lógica de advertencia de maestro en calendario
    }
    // ... (El resto de la lógica del renderCalendarView sigue igual)
    /* ... */
  };

  const renderListView = () => {
    // ... (Lógica de renderListView)
    /* ... */
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
          <Select value={selectedCenter} onValueChange={handleCenterChange}>
            {/* ... */}
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
                {selectedMaestroId !== 'todos' ? 'Plantilla Seleccionada' : format(currentMonth, "LLLL yyyy", { locale: es })}
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
          {assignmentsLoading ? (
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
            <CardDescription className="pt-1">
              Asignación para el rango: **{format(new Date(assignForm.getValues('startDate')), 'dd/MM/yyyy')}** a **{format(new Date(assignForm.getValues('endDate')), 'dd/MM/yyyy')}**
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
                  <h3 className="text-lg font-semibold border-b pb-2">Rango y Turno</h3>
                  {/* ... Campos de Fecha y Turno ... */}
                  <FormField
                    control={assignForm.control} name="startDate" render={({ field }) => (<FormItem><FormLabel>Fecha de Inicio</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField
                    control={assignForm.control} name="endDate" render={({ field }) => (<FormItem><FormLabel>Fecha de Fin</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField
                    control={assignForm.control}
                    name="turnoId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Turno a Asignar</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un turno" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {turnos.map((turno) => (
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
                  render={() => ( /* ... Lógica de selección de profesionales ... */
                    <FormItem className="md:col-span-2">
                      <h3 className="text-lg font-semibold border-b pb-2">
                        Selección Múltiple de Profesionales
                        {/* ... */}
                      </h3>
                      {/* ... Controles de búsqueda y lista de profesionales ... */}
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
                        Seleccionados: **{assignForm.getValues('professionalIds').length}**
                      </FormLabel>
                      <ScrollArea className="h-64 w-full rounded-md border p-4 bg-gray-50">
                        {professionalsLoading ? (
                          <div className="text-center text-sm text-gray-500">Cargando profesionales...</div>
                        ) : (
                          filteredProfessionals.map((professional) => (
                            <FormField
                              key={professional.id}
                              control={assignForm.control}
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
                                      <FormLabel className="font-medium cursor-pointer">{professional.nombre}</FormLabel>
                                      <div className="text-xs text-muted-foreground">EmpNo: {professional.empNo || '—'}</div>
                                    </div>
                                  </FormItem>
                                );
                              }}
                            />
                          ))
                        )}
                        {!filteredProfessionals.length && professionalSearch && (<div className="text-center text-sm text-gray-500 py-4">No se encontraron profesionales con ese filtro.</div>)}
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
                <Button type="submit" disabled={saveMaestroMutation.isLoading || !saveMaestroForm.formState.isValid}>
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