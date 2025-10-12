import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays, Download, Info, Plus, Save, Search, Trash2, Timer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'; // Nuevo: Acordeón
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { HorarioBase, HorarioBasePayload, useHorariosBase } from '@/hooks/useHorariosBase';
import { useTurnosBio } from '@/hooks/useTurnosBio'; // Nuevo: Hook de Turnos

const saveHorarioSchema = z.object({
  profesionalIds: z.array(z.string()).min(1, 'Seleccione al menos un profesional.'),
  turnoId: z.string().min(1, 'Seleccione un turno.'),
  diasSemana: z.array(z.number()).min(1, 'Seleccione al menos un día.'),
  vigenciaDesde: z.string().min(1, 'Ingrese la fecha de inicio.'),
  vigenciaHasta: z.string().nullable().optional(),
});

type SaveHorarioFormValues = z.infer<typeof saveHorarioSchema>;

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];

interface CentroOption {
  id: string;
  nombre: string;
}

interface ProfessionalRow {
  id: string;
  nombre_completo: string | null;
  numero_enrolamiento_enno: string | null;
  numero_tarjeta_rfid: string | null;
  fecha_nacimiento?: string | null;
  area_profesional?: string | null;
}

export function HorariosBasePanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { listByProfessional, save, remove } = useHorariosBase();

  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(user?.assigned_center_id ?? null);
  const [selectedProfessionalIds, setSelectedProfessionalIds] = useState<string[]>([]);
  const [activeProfessionalId, setActiveProfessionalId] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // NUEVOS ESTADOS para el formulario de creación rápida de turno
  const [quickTurnoNombre, setQuickTurnoNombre] = useState('');
  const [quickTurnoInicio, setQuickTurnoInicio] = useState('08:00');
  const [quickTurnoFin, setQuickTurnoFin] = useState('16:00');
  const [quickTurnoTol, setQuickTurnoTol] = useState(5);
  const [quickTurnoTipo, setQuickTurnoTipo] = useState<'diurno' | 'nocturno' | 'festivo'>('diurno');


  useEffect(() => {
    if (!selectedCenterId && user?.assigned_center_id) {
      setSelectedCenterId(user.assigned_center_id);
    }
  }, [selectedCenterId, user?.assigned_center_id]);

  useEffect(() => {
    if (selectedProfessionalIds.length === 0) {
      setActiveProfessionalId('');
      return;
    }

    if (!selectedProfessionalIds.includes(activeProfessionalId)) {
      setActiveProfessionalId(selectedProfessionalIds[0] ?? '');
    }
  }, [selectedProfessionalIds, activeProfessionalId]);

  const centersQuery = useQuery<CentroOption[]>({
    queryKey: ['centros-salud'],
    queryFn: async () => {
      const { data, error } = await supabase.from('centros_salud').select('id, nombre').order('nombre');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });

  // Usamos el hook de turnos adaptado
  const { turnosQuery, createMutation: createTurnoMutation } = useTurnosBio(selectedCenterId);

  const professionalsQuery = useQuery<ProfessionalRow[]>({
    queryKey: ['profesionales-centro', selectedCenterId],
    queryFn: async () => {
      if (!selectedCenterId) return [];
      const { data, error } = await supabase
        .from('profesionales_sanitarios')
        .select('id, nombre_completo, numero_enrolamiento_enno, numero_tarjeta_rfid, fecha_nacimiento, area_profesional')
        .eq('centro_salud_id', selectedCenterId)
        .order('nombre_completo');
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(selectedCenterId),
  });

  const horariosBaseQuery = useQuery<HorarioBase[]>({
    queryKey: ['horarios-base', activeProfessionalId],
    queryFn: () => listByProfessional(activeProfessionalId),
    enabled: Boolean(activeProfessionalId),
  });

  const saveForm = useForm<SaveHorarioFormValues>({
    resolver: zodResolver(saveHorarioSchema),
    defaultValues: {
      profesionalIds: [],
      turnoId: '',
      diasSemana: [DAYS_OF_WEEK[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1].value],
      vigenciaDesde: format(new Date(), 'yyyy-MM-dd'),
      vigenciaHasta: null,
    },
  });

  useEffect(() => {
    saveForm.setValue('profesionalIds', selectedProfessionalIds);
  }, [saveForm, selectedProfessionalIds]);

  const saveMutation = useMutation({
    mutationFn: (payloads: HorarioBasePayload[]) => save(payloads),
    onSuccess: (_, payloads) => {
      const affectedProfessionals = payloads.length
        ? Array.from(new Set(payloads.map((payload) => payload.id_profesional)))
        : selectedProfessionalIds;

      affectedProfessionals.forEach((id) => {
        queryClient.invalidateQueries({ queryKey: ['horarios-base', id] });
      });

      toast({
        title: 'Reglas guardadas',
        description: `${payloads.length} regla${payloads.length === 1 ? '' : 's'} asignada${payloads.length === 1 ? '' : 's'} correctamente.`,
      });

      setIsDialogOpen(false);
      saveForm.reset({
        profesionalIds: selectedProfessionalIds,
        turnoId: '',
        diasSemana: [],
        vigenciaDesde: format(new Date(), 'yyyy-MM-dd'),
        vigenciaHasta: null,
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'No se pudo guardar la regla.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => remove(id),
    onSuccess: () => {
      if (activeProfessionalId) {
        queryClient.invalidateQueries({ queryKey: ['horarios-base', activeProfessionalId] });
      }
      toast({ title: 'Regla eliminada', description: 'La regla de horario fue eliminada correctamente.' });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar la regla.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    },
  });

  // Función para la creación rápida de turnos
  const handleQuickCreateTurno = () => {
    if (!quickTurnoNombre.trim() || !selectedCenterId) {
      toast({ title: 'Datos incompletos', description: 'Ingrese un nombre para el turno y seleccione un centro.', variant: 'destructive' });
      return;
    }

    createTurnoMutation.mutate({
      nombre_turno: quickTurnoNombre.trim(),
      hora_inicio: `${quickTurnoInicio}:00`,
      hora_fin: `${quickTurnoFin}:00`,
      tolerancia_minutos: quickTurnoTol,
      tipo: quickTurnoTipo,
      centro_salud_id: selectedCenterId,
    }, {
      onSuccess: () => {
        // Limpiar el formulario
        setQuickTurnoNombre('');
        setQuickTurnoInicio('08:00');
        setQuickTurnoFin('16:00');
        setQuickTurnoTol(5);
        setQuickTurnoTipo('diurno');
      }
    });
  };

  const filteredProfessionals = useMemo(() => {
    const source = professionalsQuery.data ?? [];
    if (!searchTerm.trim()) return source;

    const term = searchTerm.toLowerCase();
    return source.filter((professional) => {
      const name = (professional.nombre_completo ?? '').toLowerCase();
      // CORRECCIÓN: Usar String() para asegurar que la propiedad es una cadena.
      const enNo = String(professional.numero_enrolamiento_enno ?? '').toLowerCase();
      const rfid = String(professional.numero_tarjeta_rfid ?? '').toLowerCase();
      // FIN DE LA CORRECCIÓN

      return name.includes(term) || enNo.includes(term) || rfid.includes(term);
    });
  }, [professionalsQuery.data, searchTerm]);

  const activeProfessional = useMemo(() => {
    return (professionalsQuery.data ?? []).find((professional) => professional.id === activeProfessionalId) ?? null;
  }, [professionalsQuery.data, activeProfessionalId]);

  const handleProfessionalToggle = (id: string) => {
    setSelectedProfessionalIds((prev) => {
      const isSelected = prev.includes(id);
      const next = isSelected ? prev.filter((current) => current !== id) : [...prev, id];
      return next;
    });
    setActiveProfessionalId((previous) => {
      if (previous === id && selectedProfessionalIds.length === 1) {
        return '';
      }
      if (!selectedProfessionalIds.includes(id)) {
        return id;
      }
      const remaining = selectedProfessionalIds.filter((current) => current !== id);
      return remaining[0] ?? '';
    });
  };

  const handleSubmit = (values: SaveHorarioFormValues) => {
    if (!selectedCenterId) {
      toast({ title: 'Centro requerido', description: 'Seleccione un centro de salud antes de guardar.', variant: 'destructive' });
      return;
    }

    const payloads: HorarioBasePayload[] = [];

    values.profesionalIds.forEach((profesionalId) => {
      values.diasSemana.forEach((day) => {
        payloads.push({
          id_profesional: profesionalId,
          turno_id: values.turnoId,
          dia_semana: day,
          centro_salud_id: selectedCenterId,
          vigencia_desde: values.vigenciaDesde,
          vigencia_hasta: values.vigenciaHasta || null,
        });
      });
    });

    if (!payloads.length) {
      toast({ title: 'Sin datos', description: 'Seleccione profesionales y días válidos.', variant: 'destructive' });
      return;
    }

    saveMutation.mutate(payloads);
  };

  const handleRemove = (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar esta regla de horario base?')) {
      return;
    }
    removeMutation.mutate(id);
  };

  const handleExport = () => {
    const professionals = professionalsQuery.data ?? [];
    if (!professionals.length) {
      toast({ title: 'Sin datos', description: 'No hay profesionales para exportar.', variant: 'destructive' });
      return;
    }

    const headers = [
      'ID', 'Nombre', 'Depto.', 'Turno', 'Admin.', 'Registro de Huella', 'Rostro', 'Registrar Contraseña',
      'ID o Tarjeta', 'Bloqueo de zona horaria', 'Grupo', 'Modo Verificar', 'Cumpleaños', 'Inicio:', 'Fin:', 'Perfil',
    ];

    const rows = professionals.map((professional) => {
      let birthdayFormatted = '';
      if (professional.fecha_nacimiento) {
        const date = new Date(`${professional.fecha_nacimiento}T00:00:00`);
        if (!Number.isNaN(date.getTime())) {
          birthdayFormatted = format(date, 'MM/dd');
        }
      }

      return {
        ID: professional.numero_enrolamiento_enno ?? '',
        Nombre: professional.nombre_completo ?? '',
        'Depto.': professional.area_profesional ?? '',
        Turno: '',
        'Admin.': 0,
        'Registro de Huella': 0,
        Rostro: 0,
        'Registrar Contraseña': 0,
        'ID o Tarjeta': professional.numero_tarjeta_rfid ?? '',
        'Bloqueo de zona horaria': 0,
        Grupo: 0,
        'Modo Verificar': 0,
        Cumpleaños: birthdayFormatted,
        'Inicio:': '',
        'Fin:': '',
        Perfil: '',
      };
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers, skipHeader: true });

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [['NOTA: Esta es la plantilla de Personal para el dispositivo biométrico. Los datos comienzan en la fila 4.']],
      { origin: 'A1' },
    );

    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A3' });
    XLSX.utils.sheet_add_json(worksheet, rows, { origin: 'A4', skipHeader: true });

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Personal');
    XLSX.writeFile(workbook, 'Personal.xls');

    toast({ title: 'Exportación creada', description: `Se generó la plantilla con ${professionals.length} profesional(es).` });
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <CardTitle>Horarios Base Semanales</CardTitle>
          <CardDescription>Defina reglas de turno recurrentes por profesional.</CardDescription>
          <div className="pt-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Centro de Salud
              </label>
              {centersQuery.isLoading ? (
                <Skeleton className="h-9 w-64" />
              ) : (
                <Select
                  value={selectedCenterId}
                  onValueChange={(value) => {
                    setSelectedCenterId(value);
                    setSelectedProfessionalIds([]);
                    setActiveProfessionalId('');
                  }}
                >
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Seleccione un centro" />
                  </SelectTrigger>
                  <SelectContent>
                    {(centersQuery.data ?? []).map((center) => (
                      <SelectItem key={center.id} value={center.id}>
                        {center.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={!selectedCenterId || professionalsQuery.isLoading || !(professionalsQuery.data ?? []).length}
          >
            <Download className="mr-2 h-4 w-4" /> Exportar Personal.xls
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setIsDialogOpen(true)}
                disabled={!selectedProfessionalIds.length || !selectedCenterId}
              >
                <Plus className="mr-2 h-4 w-4" /> Añadir regla
              </Button>
            </DialogTrigger>
             <ScrollArea className="max-h-[500px] overflow-y-auto pr-4"> {/* <-- INICIO: SCROLL AQUI */}
                <Form {...saveForm}>
                  <form onSubmit={saveForm.handleSubmit(handleSubmit)} className="grid gap-4 py-4">
                    <FormField
                      control={saveForm.control}
                      name="diasSemana"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Días de la semana</FormLabel>
                          <div className="grid grid-cols-3 gap-2">
                            {DAYS_OF_WEEK.map((day) => {
                              const isChecked = field.value?.includes(day.value) ?? false;
                              return (
                                <div key={day.value} className="flex items-center space-x-2 rounded-md border p-2">
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                      const nextValue = checked === true
                                        ? [...field.value, day.value]
                                        : field.value.filter((current) => current !== day.value);
                                      field.onChange(nextValue);
                                    }}
                                  />
                                  <span className="text-sm">{day.label}</span>
                                </div>
                              );
                            })}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* ================================================================= */}
                    {/* INICIO: Acordeón de Creación Rápida de Turno (Mejora UX/UI) */}
                    {/* ================================================================= */}
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1" className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline text-sm font-medium py-3">
                          <Timer className="mr-2 h-4 w-4" /> ¿Falta un turno? Creación Rápida
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4 space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Input
                              placeholder="Nombre del Turno (ej: Mañana 8-16)"
                              value={quickTurnoNombre}
                              onChange={e => setQuickTurnoNombre(e.target.value)}
                              className="w-44"
                              disabled={createTurnoMutation.isPending || !selectedCenterId}
                            />
                            <div className="flex items-center gap-1">
                              <span className="text-sm">Inicio</span>
                              <Input
                                type="time"
                                value={quickTurnoInicio}
                                onChange={e => setQuickTurnoInicio(e.target.value)}
                                disabled={createTurnoMutation.isPending || !selectedCenterId}
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-sm">Fin</span>
                              <Input
                                type="time"
                                value={quickTurnoFin}
                                onChange={e => setQuickTurnoFin(e.target.value)}
                                disabled={createTurnoMutation.isPending || !selectedCenterId}
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-sm">Tol (min)</span>
                              <Input
                                type="number"
                                value={quickTurnoTol}
                                onChange={e => setQuickTurnoTol(parseInt(e.target.value || '0', 10))}
                                className="w-24"
                                disabled={createTurnoMutation.isPending || !selectedCenterId}
                              />
                            </div>
                            <Select
                              value={quickTurnoTipo}
                              onValueChange={(v: any) => setQuickTurnoTipo(v)}
                              disabled={createTurnoMutation.isPending || !selectedCenterId}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="diurno">Diurno</SelectItem>
                                <SelectItem value="nocturno">Nocturno</SelectItem>
                                <SelectItem value="festivo">Festivo</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              onClick={handleQuickCreateTurno}
                              disabled={createTurnoMutation.isPending || !quickTurnoNombre.trim() || !selectedCenterId}
                              className="ml-auto"
                            >
                              {createTurnoMutation.isPending ? 'Creando...' : 'Crear Turno'}
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                    {/* ================================================================= */}
                    {/* FIN: Acordeón de Creación Rápida de Turno */}
                    {/* ================================================================= */}

                    <FormField
                      control={saveForm.control}
                      name="turnoId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Turno</FormLabel>
                          <Select
                            disabled={turnosQuery.isLoading}
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione un turno" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {turnosQuery.isLoading ? (
                                <SelectItem value="" disabled>Cargando turnos...</SelectItem>
                              ) : (
                                (turnosQuery.data ?? []).map((turno) => (
                                  <SelectItem key={turno.id} value={turno.id}>
                                    {turno.nombre_turno}
                                    <span className="text-xs text-muted-foreground ml-2">
                                      ({turno.hora_inicio.slice(0, 5)} - {turno.hora_fin.slice(0, 5)})
                                    </span>
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={saveForm.control}
                        name="vigenciaDesde"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vigencia desde</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={saveForm.control}
                        name="vigenciaHasta"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vigencia hasta (opcional)</FormLabel>
                            <FormControl>
                              <Input type="date" value={field.value ?? ''} onChange={(event) => field.onChange(event.target.value || null)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </form>
                </Form>
              </ScrollArea>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={saveMutation.isPending}>
                      <Save className="mr-2 h-4 w-4" /> {saveMutation.isPending ? 'Guardando...' : 'Guardar reglas'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Profesionales</CardTitle>
              <CardDescription>Seleccione quienes recibirán la regla.</CardDescription>
            </CardHeader>
            <div className="px-6 pb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Buscar por nombre, EnNo o RFID"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  disabled={!selectedCenterId || professionalsQuery.isLoading}
                />
              </div>
            </div>
            <ScrollArea className="h-[360px] px-6">
              {professionalsQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : !selectedCenterId ? (
                <p className="text-center text-sm text-muted-foreground">Seleccione un centro para listar profesionales.</p>
              ) : filteredProfessionals.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">No se encontraron profesionales.</p>
              ) : (
                <div className="space-y-2">
                  {filteredProfessionals.map((professional) => {
                    const isSelected = selectedProfessionalIds.includes(professional.id);
                    const isActive = activeProfessionalId === professional.id;
                    return (
                      // CÓDIGO CORREGIDO PARA EL WARNING DE ANIDAMIENTO DE BOTONES
                      <div // CAMBIO CLAVE: Usamos <div> en lugar de <button>
                        key={professional.id}
                        onClick={() => handleProfessionalToggle(professional.id)}
                        className={cn(
                          'flex w-full items-center justify-between rounded-lg border p-3 text-left transition cursor-pointer',
                          isSelected ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-accent'
                        )}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleProfessionalToggle(professional.id);
                          }
                        }}
                      >
                        <div>
                          <p className="font-medium">{professional.nombre_completo ?? 'Sin nombre'}</p>
                          <p className="text-xs text-muted-foreground">
                            EnNo: {professional.numero_enrolamiento_enno ?? '—'} · RFID: {professional.numero_tarjeta_rfid ?? '—'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isActive && <Badge variant="secondary">Visualizando</Badge>}
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleProfessionalToggle(professional.id)}
                            onClick={(e) => e.stopPropagation()} // Detenemos la propagación para evitar doble evento
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
            <div className="border-t p-4 text-xs text-muted-foreground">
              <Info className="mr-1 inline h-3 w-3" /> {selectedProfessionalIds.length} profesional(es) seleccionado(s).
            </div>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Reglas activas</CardTitle>
              {activeProfessional && (
                <Badge variant="outline">{activeProfessional.nombre_completo}</Badge>
              )}
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[420px] pr-4">
                {horariosBaseQuery.isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : !activeProfessionalId ? (
                  <div className="py-10 text-center text-muted-foreground">Seleccione un profesional para ver sus horarios.</div>
                ) : (horariosBaseQuery.data ?? []).length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">No hay reglas registradas para este profesional.</div>
                ) : (
                  <div className="space-y-3">
                    {(horariosBaseQuery.data ?? []).map((horario) => {
                      const dayLabel = DAYS_OF_WEEK.find((day) => day.value === horario.dia_semana)?.label ?? 'Día';
                      // Buscamos el nombre del turno usando los datos de la nueva query
                      const turnoNombre = (turnosQuery.data ?? []).find((turno) => turno.id === horario.turno_id)?.nombre_turno ?? 'Turno (ID: ' + horario.turno_id.slice(0, 4) + '...)';
                      const desde = format(new Date(horario.vigencia_desde), 'dd/MM/yyyy');
                      const hasta = horario.vigencia_hasta ? format(new Date(horario.vigencia_hasta), 'dd/MM/yyyy') : 'Indefinido';

                      return (
                        <div key={horario.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="font-semibold">{dayLabel} · {turnoNombre}</p>
                            <p className="text-sm text-muted-foreground">Vigencia: {desde} - {hasta}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(horario.id)}
                            disabled={removeMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="h-3 w-3" /> Estas reglas se aplican cuando no existe un cuadrante diario específico.
              </div>
            </CardFooter>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}