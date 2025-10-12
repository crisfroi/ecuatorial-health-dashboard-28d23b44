import { useMemo, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, getDay, isAfter, isBefore } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import * as XLSX from 'xlsx';

import { CalendarDays, Save, Plus, Trash2, Download, Search, Check, Info } from 'lucide-react'; // Añadida 'Info' para el Badge
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
// 🚨 CORRECCIÓN/OPTIMIZACIÓN DE AUTH 🚨: Importamos useRole desde la ruta confirmada para permisos y user.
import { useRole } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
// Asumo que 'useHorariosBase' es un hook creado por usted
import { HorarioBase, HorarioBasePayload, useHorariosBase } from '@/hooks/useHorariosBase';
import { useAsistencia } from '@/hooks/useAsistencia';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox'; // Importar Checkbox

// --- Esquemas de Validación ---
// MODIFICADO: id_profesional es ahora un array de strings, dia_semana es un array de strings.
const saveHorarioSchema = z.object({
  id_profesional: z.array(z.string()).min(1, 'Seleccione al menos un profesional.'),
  turno_id: z.string().min(1, 'Seleccione un turno.'),
  dia_semana: z.array(z.string()).min(1, 'Seleccione al menos un día.'), // MODIFICADO A ARRAY
  vigencia_desde: z.string().min(1, 'Ingrese la fecha de inicio.'),
  vigencia_hasta: z.string().nullable().optional(),
});

// --- Helpers ---
const DIAS_SEMANA = [
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
  nombre_completo: string;
  numero_enrolamiento_enno: string | null;
  numero_tarjeta_rfid: string | null;
  fecha_nacimiento?: string | null; // AAAA-MM-DD para Cumpleaños
  area_profesional?: string | null; // Depto.
}

interface TurnoRow {
  id: string;
  nombre_turno: string;
}

// ----------------------------------------------------------------------
// ⚡️ COMPONENTE PRINCIPAL HorariosBasePanel ⚡️
// ----------------------------------------------------------------------

export function HorariosBasePanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // 🚨 CORRECCIÓN/OPTIMIZACIÓN DE AUTH 🚨: Usamos useRole, que también incluye 'user'
  const { user } = useRole();
  const userCenterId = user?.assigned_center_id;
  const { listByProfessional, save, remove } = useHorariosBase();

  // --- Estados y Hooks ---
  const [selectedCenterId, setSelectedCenterId] = useState<string>(user?.assigned_center_id || '');
  // MODIFICADO: Ahora es un array para selección múltiple.
  const [selectedProfessionalIds, setSelectedProfessionalIds] = useState<string[]>([]);
  // El ID individual es solo para la visualización de reglas
  const [professionalIdForDisplay, setProfessionalIdForDisplay] = useState<string>('');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // Estado para la búsqueda

  // Sincronizar selectedCenterId al cargar el userCenterId inicial
  useEffect(() => {
    if (userCenterId && !selectedCenterId) {
      setSelectedCenterId(userCenterId);
    }
  }, [userCenterId, selectedCenterId]);


  // --- Data Fetching (Queries) ---

  // 0. Obtener Centros de Salud (NUEVO)
  const { data: centers = [], isLoading: isLoadingCenters } = useQuery<CentroOption[]>({
    queryKey: ['centers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('centros_salud').select('id, nombre');
      if (error) throw error;
      return data || [];
    },
  });

  // 1. Obtener Turnos Biométricos
  const { data: turnos = [], isLoading: isLoadingTurnos } = useQuery<TurnoRow[]>({
    queryKey: ['turnosBio', selectedCenterId],
    queryFn: async () => {
      if (!selectedCenterId) return [];
      const { data, error } = await supabase.from('turnos_biometricos').select('id, nombre_turno').eq('centro_salud_id', selectedCenterId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCenterId,
  });

  // 2. Obtener Profesionales (Incluyendo campos de exportación)
  const { data: professionals = [], isLoading: isLoadingProfs } = useQuery<ProfessionalRow[]>({
    queryKey: ['professionals', selectedCenterId],
    queryFn: async () => {
      if (!selectedCenterId) return [];
      const { data, error } = await supabase.from('profesionales_sanitarios')
        .select('id, nombre_completo, numero_enrolamiento_enno, numero_tarjeta_rfid, fecha_nacimiento, area_profesional')
        .eq('centro_salud_id', selectedCenterId)
        .order('nombre_completo');
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCenterId,
  });

  // 3. Obtener Horarios Base del Profesional para la pantalla de reglas
  const { data: horariosBase = [], isLoading: isLoadingHorarios } = useQuery<HorarioBase[]>({
    queryKey: ['horariosBase', professionalIdForDisplay],
    queryFn: () => listByProfessional(professionalIdForDisplay),
    enabled: !!professionalIdForDisplay,
  });

  // --- Lógica de Búsqueda y Filtrado de Profesionales ---
  const filteredProfessionals = useMemo(() => {
    if (!searchTerm) return professionals;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return professionals.filter(p =>
      p.nombre_completo.toLowerCase().includes(lowerCaseSearch) ||
      String(p.numero_enrolamiento_enno || '').toLowerCase().includes(lowerCaseSearch) ||
      String(p.numero_tarjeta_rfid || '').toLowerCase().includes(lowerCaseSearch)
    );
  }, [professionals, searchTerm]);

  // --- Formulario de Guardado (Mutations) ---
  const saveForm = useForm<z.infer<typeof saveHorarioSchema>>({
    resolver: zodResolver(saveHorarioSchema),
    defaultValues: {
      id_profesional: [], // Array vacío por defecto
      dia_semana: [String(getDay(new Date()) === 0 ? 7 : getDay(new Date()))], // Array
      vigencia_desde: format(new Date(), 'yyyy-MM-dd'),
      vigencia_hasta: null,
      turno_id: '',
    },
  });

  // Sincronizar el estado de IDs seleccionados con el formulario al abrir el diálogo
  useEffect(() => {
    if (isDialogOpen) {
      saveForm.setValue('id_profesional', selectedProfessionalIds);
    }
  }, [isDialogOpen, selectedProfessionalIds, saveForm]); // Añadir saveForm a dependencias

  const saveMutation = useMutation({
    // La mutación ahora acepta un array de payloads para inserciones múltiples
    mutationFn: (payloads: HorarioBasePayload[]) => {
      // Usamos Promise.all para guardar todas las reglas de una vez
      return Promise.all(payloads.map(p => save(p)));
    },
    onSuccess: () => {
      toast({ title: 'Reglas guardadas', description: `Se han guardado las reglas para ${selectedProfessionalIds.length} profesional(es).` });
      // Invalidar la query del profesional que se está viendo
      queryClient.invalidateQueries({ queryKey: ['horariosBase', professionalIdForDisplay] });
      setIsDialogOpen(false); // Cierra el diálogo al guardar con éxito
      saveForm.reset({
        ...saveForm.getValues(),
        turno_id: '',
        id_profesional: selectedProfessionalIds, // Mantener IDs seleccionados
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al guardar la regla(s) de horario base.',
        variant: 'destructive',
      });
    },
  });

  // MODIFICADO: Maneja la lógica de inserción múltiple
  const onSubmit = (values: z.infer<typeof saveHorarioSchema>) => {
    if (!selectedCenterId) {
      toast({ title: 'Error', description: 'ID de Centro de Salud no disponible.', variant: 'destructive' });
      return;
    }

    const payloads: HorarioBasePayload[] = [];

    // Generar un payload para CADA profesional seleccionado y CADA día seleccionado
    values.id_profesional.forEach(profId => {
      values.dia_semana.forEach(diaString => {
        const payload: HorarioBasePayload = {
          id_profesional: profId,
          turno_id: values.turno_id,
          dia_semana: Number(diaString), // Convertir a número
          centro_salud_id: selectedCenterId,
          vigencia_desde: values.vigencia_desde,
          vigencia_hasta: values.vigencia_hasta || null,
        };
        payloads.push(payload);
      });
    });

    saveMutation.mutate(payloads);
  };

  // --- Funciones de Exportación (Personal.xls) - SIN CAMBIOS ---
  const handleExport = () => {
    if (!professionals.length) {
      toast({ title: 'Error', description: 'No hay profesionales para exportar.', variant: 'destructive' });
      return;
    }

    // --- 1. Definición de Cabeceras EXACTAS (16 campos) ---
    const headers = [
      'ID', 'Nombre', 'Depto.', 'Turno', 'Admin.', 'Registro de Huella', 'Rostro', 'Registrar Contraseña',
      'ID o Tarjeta', 'Bloqueo de zona horaria', 'Grupo', 'Modo Verificar', 'Cumpleaños', 'Inicio:', 'Fin:', 'Perfil'
    ];

    // --- 2. Mapeo de Datos con Formato y Campos Requeridos ---
    const data = professionals.map((p) => {

      let birthdayFormatted = '';
      if (p.fecha_nacimiento) {
        try {
          // Asegura que se parsea correctamente como fecha UTC/local al agregar la hora
          const dob = new Date(p.fecha_nacimiento + 'T00:00:00');
          if (!isNaN(dob.getTime())) {
            birthdayFormatted = format(dob, 'MM/dd'); // Formato esperado: MM/DD
          }
        } catch (e) { /* Fecha inválida */ }
      }

      return {
        ID: p.numero_enrolamiento_enno || '',
        Nombre: p.nombre_completo,
        'Depto.': p.area_profesional || '',
        Turno: '',
        'Admin.': 0,
        'Registro de Huella': 0,
        Rostro: 0,
        'Registrar Contraseña': 0,
        'ID o Tarjeta': p.numero_tarjeta_rfid || '',
        'Bloqueo de zona horaria': 0,
        Grupo: 0,
        'Modo Verificar': 0,
        Cumpleaños: birthdayFormatted,
        'Inicio:': '',
        'Fin:': '',
        Perfil: '',
      };
    });

    // --- 3. Generación del Archivo Excel (XLSX) con la estructura de filas correcta ---
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data, { header: headers, skipHeader: true });

    XLSX.utils.sheet_add_aoa(ws, [['NOTA: Esta es la plantilla de Personal para el dispositivo biométrico. Los datos comienzan en la Fila 4.']], { origin: 'A1' });

    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A3' });

    XLSX.utils.sheet_add_json(ws, data, {
      skipHeader: true,
      origin: 'A4',
    });

    XLSX.utils.book_append_sheet(wb, ws, 'Personal');
    XLSX.writeFile(wb, 'Personal.xls');

    toast({ title: 'Exportación de Personal', description: 'El archivo Personal.xls con la plantilla biométrica está listo.' });
  };

  // --- Renderizado ---

  // Usamos professionalIdForDisplay para mostrar la información en el panel de la derecha
  const professionalDisplay = professionals.find(p => p.id === professionalIdForDisplay);

  return (
    <Card className='w-full'>
      <CardHeader className='flex flex-row items-center justify-between'>
        <div className='space-y-1'>
          <CardTitle>Horarios Base Semanales</CardTitle>
          <CardDescription>
            Define las reglas de turno fijas a largo plazo por profesional.
          </CardDescription>
          {/* Selector de Centro */}
          <div className='pt-2'>
            <Label htmlFor="center-select">Centro de Salud</Label>
            {isLoadingCenters ? (
              <Skeleton className='h-9 w-64' />
            ) : (
              <Select
                value={selectedCenterId}
                onValueChange={(val) => {
                  setSelectedCenterId(val);
                  setProfessionalIdForDisplay(''); // Limpiar visualización
                  setSelectedProfessionalIds([]); // Limpiar selección múltiple
                }}
              >
                <SelectTrigger id="center-select" className='w-[300px]'>
                  <SelectValue placeholder="Seleccione un Centro..." />
                </SelectTrigger>
                <SelectContent>
                  {centers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <div className='flex space-x-2'>
          <Button variant="outline" onClick={handleExport} disabled={isLoadingProfs || !professionals.length || !selectedCenterId}>
            <Download className='mr-2 h-4 w-4' /> **Exportar Personal.xls**
          </Button>
          {/* ELIMINADO: Componente ImportPersonalDialog */}
        </div>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>

          {/* Columna 1: Selección Múltiple de Profesional */}
          <Card className='col-span-1 h-full'>
            <CardHeader>
              <CardTitle className='text-base'>Seleccionar Profesional(es)</CardTitle>
              <CardDescription>Use las casillas para seleccionar uno o varios profesionales.</CardDescription>
            </CardHeader>
            <div className='px-4 pb-4'>
              <div className='relative'>
                <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Buscar por nombre, EnNo o RFID...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-8'
                  disabled={isLoadingProfs || !selectedCenterId}
                />
              </div>
            </div>
            <ScrollArea className='h-[340px] p-4 pt-0'>
              {isLoadingProfs ? (
                <div className='space-y-2'><Skeleton className='h-8 w-full' /><Skeleton className='h-8 w-full' /></div>
              ) : !selectedCenterId ? (
                <div className='text-center text-sm text-muted-foreground'>Seleccione un centro.</div>
              ) : (<div className='space-y-1'>
                {filteredProfessionals.length === 0 ? (
                  <p className='text-center text-sm text-muted-foreground'>
                    No se encontraron profesionales.
                  </p>
                ) : (
                  filteredProfessionals.map((p) => (
                    // MODIFICADO: Uso de un div con checkbox para selección múltiple
                    <div
                      key={p.id}
                      className={cn(
                        'flex items-center space-x-3 p-2 rounded-lg cursor-pointer hover:bg-accent',
                        selectedProfessionalIds.includes(p.id) && 'bg-accent font-medium'
                      )}
                      onClick={() => {
                        const newSelectedIds = selectedProfessionalIds.includes(p.id)
                          ? selectedProfessionalIds.filter(id => id !== p.id) // Deseleccionar
                          : [p.id]; // Seleccionar (temporalmente solo uno para la visualización de reglas)

                        // Si es la primera selección, o se hace clic en el mismo que se ve, actualiza la visualización
                        if (!professionalIdForDisplay || professionalIdForDisplay === p.id) {
                          setProfessionalIdForDisplay(newSelectedIds[0] || ''); // Muestra el primero o nada
                        }

                        setSelectedProfessionalIds(prevIds =>
                          prevIds.includes(p.id)
                            ? prevIds.filter(id => id !== p.id)
                            : [...prevIds, p.id]
                        );
                      }}
                    >
                      <Checkbox
                        id={`prof-${p.id}`}
                        checked={selectedProfessionalIds.includes(p.id)}
                        // Importante: El onClick del div maneja el cambio de estado,
                        // pero este onClick asegura que la visualización de reglas
                        // siempre siga al profesional que se está viendo activamente.
                        onClick={(e) => {
                          e.stopPropagation(); // Previene que el click del div se dispare
                          if (!selectedProfessionalIds.includes(p.id)) {
                            setProfessionalIdForDisplay(p.id); // Si se va a seleccionar, este será el visible
                          } else if (professionalIdForDisplay === p.id) {
                            // Si se deselecciona el visible, muestra el primer ID restante o nada
                            const remainingIds = selectedProfessionalIds.filter(id => id !== p.id);
                            setProfessionalIdForDisplay(remainingIds[0] || '');
                          }
                        }}
                        className='h-4 w-4 rounded-sm'
                      />
                      <Label htmlFor={`prof-${p.id}`} className='cursor-pointer flex-1'>
                        {p.nombre_completo}
                        {p.id === professionalIdForDisplay && (
                          <Badge className='ml-2 h-4 bg-blue-500/10 text-blue-600 hover:bg-blue-500/10'>Visualizando</Badge>
                        )}
                      </Label>
                    </div>
                  ))
                )}
              </div>)}
              {/* Información del profesional seleccionado para visualización de reglas */}
              <div className='mt-4 text-sm text-muted-foreground space-y-1 border-t pt-4'>
                {professionalDisplay ? (
                  <>
                    <p className='font-semibold'>Visualizando: {professionalDisplay.nombre_completo}</p>
                    <p>EnNo: <Badge variant="secondary">{professionalDisplay.numero_enrolamiento_enno || 'N/A'}</Badge></p>
                    <p>RFID: <Badge variant="secondary">{professionalDisplay.numero_tarjeta_rfid || 'N/A'}</Badge></p>
                    <p className='text-xs pt-2'>
                      <Info className='inline h-3 w-3 mr-1' />
                      {selectedProfessionalIds.length} profesional(es) seleccionado(s) para nueva regla.
                    </p>
                  </>
                ) : (
                  <p>Seleccione un profesional para ver sus horarios.</p>
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* Columna 2: Reglas de Horario Existentes */}
          <Card className='col-span-2'>
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle className='text-base'>Reglas Activas {professionalDisplay ? `(${professionalDisplay.nombre_completo})` : ''}</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size='sm' disabled={selectedProfessionalIds.length === 0} onClick={() => {
                    saveForm.setValue('id_profesional', selectedProfessionalIds);
                    setIsDialogOpen(true);
                  }}>
                    <Plus className='mr-2 h-4 w-4' /> Añadir Regla ({selectedProfessionalIds.length} Prof(s))
                  </Button>
                </DialogTrigger>
                <DialogContent className='sm:max-w-[425px]'>
                  <DialogHeader>
                    <DialogTitle>Añadir Regla de Horario Base</DialogTitle>
                    <DialogDescription>
                      Asigne un turno fijo a uno o varios días de la semana con un periodo de vigencia.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...saveForm}>
                    <form onSubmit={saveForm.handleSubmit(onSubmit)} className='grid gap-4 py-4'>
                      {/* MODIFICADO: Selección Múltiple de Días */}
                      <FormField
                        control={saveForm.control}
                        name="dia_semana"
                        render={() => (
                          <FormItem>
                            <FormLabel>Días de la Semana</FormLabel>
                            <div className='grid grid-cols-3 gap-2'>
                              {DIAS_SEMANA.map(d => (
                                <FormField
                                  key={d.value}
                                  control={saveForm.control}
                                  name="dia_semana"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={d.value}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(String(d.value))}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...field.value, String(d.value)])
                                                : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== String(d.value)
                                                  )
                                                );
                                            }}
                                            className='h-4 w-4 rounded-sm'
                                          />
                                        </FormControl>
                                        <FormLabel className="font-normal cursor-pointer">
                                          {d.label}
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
                      {/* Turno Asignado - Sin cambios */}
                      <FormField
                        control={saveForm.control}
                        name="turno_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Turno Asignado</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger disabled={isLoadingTurnos}>
                                  <SelectValue placeholder="Seleccione un turno" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {turnos.map(t => (
                                  <SelectItem key={t.id} value={t.id}>{t.nombre_turno}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Vigencia - Sin cambios */}
                      <div className='flex space-x-2'>
                        <FormField
                          control={saveForm.control}
                          name="vigencia_desde"
                          render={({ field }) => (
                            <FormItem className='flex-1'>
                              <FormLabel>Vigencia Desde</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={saveForm.control}
                          name="vigencia_hasta"
                          render={({ field }) => (
                            <FormItem className='flex-1'>
                              <FormLabel>Vigencia Hasta (Opcional)</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <DialogFooter className='pt-4'>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={saveMutation.isLoading}>
                          <Save className='mr-2 h-4 w-4' /> {saveMutation.isLoading ? 'Guardando...' : `Guardar Regla (${selectedProfessionalIds.length} Prof(s))`}
                        </Button>
                      </DialogFooter>
                    </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-[400px] pr-4'>
                {isLoadingHorarios ? (
                  <div className='space-y-2'><Skeleton className='h-12 w-full' /><Skeleton className='h-12 w-full' /></div>
                ) : !horariosBase.length ? (
                  <div className='text-center py-10 text-muted-foreground'>
                    {professionalIdForDisplay ? 'No hay reglas de horario base definidas para este profesional.' : 'Seleccione un profesional.'}
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {horariosBase.map((h) => {
                      const turnoNombre = turnos.find(t => t.id === h.turno_id)?.nombre_turno || 'Turno Desconocido';
                      const dia = DIAS_SEMANA.find(d => d.value === h.dia_semana)?.label || 'Día Desconocido';

                      const today = format(new Date(), 'yyyy-MM-dd');
                      const isFuture = isAfter(new Date(h.vigencia_desde), new Date(today));
                      const isExpired = h.vigencia_hasta && isBefore(new Date(h.vigencia_hasta), new Date(today));

                      return (
                        <div key={h.id} className={cn(
                          'flex items-center justify-between p-3 border rounded-lg',
                          isExpired ? 'bg-red-50/50 border-red-200' : 'hover:bg-accent'
                        )}>
                          <div>
                            <p className='font-semibold'>{dia} - {turnoNombre}</p>
                            <p className='text-sm text-muted-foreground'>
                              Vigencia: {format(new Date(h.vigencia_desde), 'dd/MM/yyyy')} - {h.vigencia_hasta ? format(new Date(h.vigencia_hasta), 'dd/MM/yyyy') : 'Indefinido'}
                            </p>
                          </div>
                          <div className='flex items-center space-x-2'>
                            {isFuture && <Badge variant='secondary'>Futuro</Badge>}
                            {isExpired && <Badge variant='destructive'>Expirado</Badge>}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const isConfirmed = window.confirm('¿Está seguro de eliminar esta regla de horario base?');
                                if (isConfirmed) {
                                  remove(h.id);
                                  // Invalida la query del profesional que se está viendo
                                  queryClient.invalidateQueries({ queryKey: ['horariosBase', professionalIdForDisplay] });
                                }
                              }}
                            >
                              <Trash2 className='h-4 w-4 text-red-500' />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <div className='text-xs text-muted-foreground flex items-center space-x-1'>
                <CalendarDays className='h-3 w-3' />
                <p>Las reglas base se utilizan cuando no hay asignación en el cuadrante diario.</p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

// Exportación del componente.
export default HorariosBasePanel;