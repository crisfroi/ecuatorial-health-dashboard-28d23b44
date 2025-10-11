import { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // useMutation eliminado
import { format, getDay, isAfter, isBefore } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import * as XLSX from 'xlsx';

import { CalendarDays, Save, Plus, Trash2, Download, Upload, Info, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
// Asumo que 'useHorariosBase' es un hook creado por usted
import { HorarioBase, HorarioBasePayload, useHorariosBase } from '@/hooks/useHorariosBase';
import { useAsistencia } from '@/hooks/useAsistencia';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

// --- Esquemas de Validación ---
const saveHorarioSchema = z.object({
  id_profesional: z.string().min(1, 'Seleccione un profesional.'),
  turno_id: z.string().min(1, 'Seleccione un turno.'),
  dia_semana: z.string().min(1, 'Seleccione el día.'),
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
// ⚡️ COMPONENTE DE DIÁLOGO DE IMPORTACIÓN ⚡️
// ----------------------------------------------------------------------

const ImportPersonalDialog = ({ centerId, onComplete }: { centerId?: string | null, onComplete: () => void }) => {
  const { toast } = useToast();
  const { importPersonalXls } = useAsistencia();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // ID Dispositivo NO RELEVANTE para esta importación de mapeo, usamos un placeholder.
  const DEVICE_ID_PLACEHOLDER = 'N/A';

  const handleConfirmImport = async () => {
    if (!file || !centerId) {
      toast({ title: 'Error', description: 'Debe seleccionar un archivo y tener un Centro de Salud asignado.', variant: 'destructive' });
      return;
    };
    setLoading(true);
    try {
      await importPersonalXls(DEVICE_ID_PLACEHOLDER, file, centerId);
      onComplete();
      setOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error de Importación',
        description: error.message || 'No se pudo procesar el archivo Personal.xls.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" disabled={!centerId}>
          <Upload className='mr-2 h-4 w-4' /> Importar Mapeo (.xls)
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Importar Mapeo de Personal (Personal.xls)</DialogTitle>
          <DialogDescription>
            Cargue el archivo Personal.xls para actualizar masivamente los números de enrolamiento (EmpNo) y las tarjetas RFID de los profesionales.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file" className="text-right">Archivo</Label>
            <Input
              id="file"
              type="file"
              accept=".xls,.xlsx"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="col-span-3"
            />
          </div>
          <p className='text-sm text-muted-foreground col-span-4 flex items-center pt-2'>
            <Info className='h-4 w-4 mr-2 text-blue-500' />
            El archivo debe usar la plantilla exportada y la cabecera debe estar en la **fila 3**.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleConfirmImport} disabled={loading || !file}><Save className='mr-2 h-4 w-4' /> {loading ? 'Procesando...' : 'Confirmar Importación'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


// ----------------------------------------------------------------------
// ⚡️ COMPONENTE PRINCIPAL HorariosBasePanel ⚡️
// ----------------------------------------------------------------------

export function HorariosBasePanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth(); // Obtenemos el objeto 'user'
  const userCenterId = user?.assigned_center_id;
  const { listByProfessional, save, remove } = useHorariosBase(); // 'save' se usa directamente en onSubmit

  // --- Estados y Hooks ---
  const [selectedCenterId, setSelectedCenterId] = useState<string>(user?.assigned_center_id || '');
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('');
  // ESTADO PARA LA SELECCIÓN MÚLTIPLE
  const [selectedProfessionalIds, setSelectedProfessionalIds] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // Estado para la búsqueda

  // Sincronizar selectedCenterId al cargar el userCenterId inicial
  useEffect(() => {
    if (userCenterId && !selectedCenterId) {
      setSelectedCenterId(userCenterId);
    }
  }, [userCenterId]);


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

  // 3. Obtener Horarios Base del Profesional Seleccionado
  const { data: horariosBase = [], isLoading: isLoadingHorarios } = useQuery<HorarioBase[]>({
    // Usamos selectedProfessionalId (single) para mostrar la vista de reglas.
    queryKey: ['horariosBase', selectedProfessionalId],
    queryFn: () => listByProfessional(selectedProfessionalId),
    enabled: !!selectedProfessionalId,
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

  // --- Formulario de Guardado (react-hook-form) ---
  const saveForm = useForm<z.infer<typeof saveHorarioSchema>>({
    resolver: zodResolver(saveHorarioSchema),
    defaultValues: {
      id_profesional: selectedProfessionalId,
      dia_semana: String(getDay(new Date()) === 0 ? 7 : getDay(new Date())),
      vigencia_desde: format(new Date(), 'yyyy-MM-dd'),
      vigencia_hasta: null,
      turno_id: '',
    },
  });


  // --- LÓGICA DE ASIGNACIÓN MÚLTIPLE (REEMPLAZA A saveMutation) ---
  const onSubmit = async (values: z.infer<typeof saveHorarioSchema>) => {
    if (!selectedCenterId) {
      toast({ title: 'Error', description: 'ID de Centro de Salud no disponible.', variant: 'destructive' });
      return;
    }

    if (selectedProfessionalIds.length === 0) {
      toast({ title: 'Error', description: 'Debe seleccionar al menos un profesional.', variant: 'destructive' });
      return;
    }

    // 1. Crear el payload base con los valores del formulario
    const basePayload = {
      ...values,
      dia_semana: Number(values.dia_semana),
      centro_salud_id: selectedCenterId,
      vigencia_hasta: values.vigencia_hasta || null,
    };

    // 2. Crear una promesa de guardado por cada profesional seleccionado
    const mutationPromises = selectedProfessionalIds.map(id_profesional => {
      const payload: HorarioBasePayload = {
        ...basePayload,
        id_profesional, // Sobreescribir el ID profesional para la asignación
      };
      return save(payload); // Usar la función 'save' directa del hook
    });

    try {
      await Promise.all(mutationPromises);

      // 3. Manejo de éxito
      toast({ title: 'Reglas guardadas', description: `Se asignó la regla a ${selectedProfessionalIds.length} profesionales.` });

      // Invalidar solo la vista del profesional seleccionado actualmente
      queryClient.invalidateQueries({ queryKey: ['horariosBase', selectedProfessionalId] });
      // También invalidar profesionales si el save tiene side effects
      queryClient.invalidateQueries({ queryKey: ['professionals', selectedCenterId] });

      setIsDialogOpen(false);
      saveForm.reset({
        ...saveForm.getValues(),
        turno_id: '',
      });

    } catch (error: any) {
      // 4. Manejo de errores
      toast({
        title: 'Error de Asignación Múltiple',
        description: error.message || 'Error al guardar la regla de horario base en uno o más profesionales.',
        variant: 'destructive',
      });
    }
  };


  // --- Funciones de Exportación (Personal.xls) - CORRECTA ---
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
  const handleImportComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['professionals', selectedCenterId] });
  };

  // --- Renderizado ---

  const selectedProfessional = professionals.find(p => p.id === selectedProfessionalId);

  return (
    <Card className='w-full'>
      <CardHeader className='flex flex-row items-center justify-between'>
        <div className='space-y-1'>
          <CardTitle>Horarios Base Semanales</CardTitle>
          <CardDescription>
            Define las reglas de turno fijas a largo plazo por profesional.
          </CardDescription>
          {/* Selector de Centro (NUEVO) */}
          <div className='pt-2'>
            <Label htmlFor="center-select">Centro de Salud</Label>
            {isLoadingCenters ? (
              <Skeleton className='h-9 w-64' />
            ) : (
              <Select
                value={selectedCenterId}
                onValueChange={(val) => {
                  setSelectedCenterId(val);
                  setSelectedProfessionalId(''); // Limpiar selección al cambiar de centro
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
          <ImportPersonalDialog centerId={selectedCenterId} onComplete={handleImportComplete} />
        </div>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>

          {/* Columna 1: Selección de Profesional */}
          <Card className='col-span-1 h-full'>
            <CardHeader>
              <CardTitle className='text-base'>Seleccionar Profesional</CardTitle>
              <CardDescription>Busque y seleccione uno o más profesionales para asignar reglas.</CardDescription>
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
                    <Button
                      key={p.id}
                      // Usa selectedProfessionalIds para la selección múltiple
                      variant={selectedProfessionalIds.includes(p.id) ? 'default' : 'ghost'}
                      // Sintaxis corregida y estilo para selección múltiple
                      className={cn('w-full justify-start', {
                        'ring-2 ring-offset-2 ring-primary': selectedProfessionalIds.includes(p.id)
                      })}
                      onClick={() => {
                        // Alternar la selección
                        setSelectedProfessionalIds(prevIds => {
                          if (prevIds.includes(p.id)) {
                            // Deseleccionar
                            return prevIds.filter(id => id !== p.id);
                          } else {
                            // Seleccionar
                            return [...prevIds, p.id];
                          }
                        });
                        // Mantener la selección única (selectedProfessionalId) para ver las reglas existentes
                        setSelectedProfessionalId(p.id);
                      }}
                    >
                      {p.nombre_completo}
                    </Button>
                  ))
                )}
              </div>)
              }
              {/* Información del profesional seleccionado */}
              <div className='mt-4 text-sm text-muted-foreground space-y-1'>
                {selectedProfessional ? (
                  <>
                    <p>EnNo: <Badge variant="secondary">{selectedProfessional.numero_enrolamiento_enno || 'N/A'}</Badge></p>
                    <p>RFID: <Badge variant="secondary">{selectedProfessional.numero_tarjeta_rfid || 'N/A'}</Badge></p>
                    <p className='text-xs pt-2'>
                      <Info className='inline h-3 w-3 mr-1' />
                      Utilice "Importar Mapeo" para actualizar EnNo/RFID.
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
              <CardTitle className='text-base'>Reglas Activas</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size='sm'
                    // Deshabilitar si no hay profesionales seleccionados
                    disabled={selectedProfessionalIds.length === 0}
                    onClick={() => {
                      // Poner el ID del primer seleccionado en el form (necesario para la validación del esquema)
                      saveForm.setValue('id_profesional', selectedProfessionalIds[0] || '');
                      setIsDialogOpen(true);
                    }}
                  >
                    <Plus className='mr-2 h-4 w-4' />
                    {selectedProfessionalIds.length > 1
                      ? `Asignar a ${selectedProfessionalIds.length} Profs`
                      : 'Añadir Regla'}
                  </Button>
                </DialogTrigger>
                <DialogContent className='sm:max-w-[425px]'>
                  <DialogHeader>
                    <DialogTitle>Añadir Regla de Horario Base</DialogTitle>
                    <DialogDescription>
                      Asigne un turno fijo a un día de la semana con un periodo de vigencia.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...saveForm}>
                    <form onSubmit={saveForm.handleSubmit(onSubmit)} className='grid gap-4 py-4'>
                      <FormField
                        control={saveForm.control}
                        name="dia_semana"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Día de la Semana</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione un día" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {DIAS_SEMANA.map(d => (
                                  <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                        <Button type="submit" disabled={saveForm.formState.isSubmitting}>
                          <Save className='mr-2 h-4 w-4' />
                          {saveForm.formState.isSubmitting ? 'Guardando...' : 'Guardar Regla'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-[400px] pr-4'>
                {isLoadingHorarios ? (
                  <div className='space-y-2'><Skeleton className='h-12 w-full' /><Skeleton className='h-12 w-full' /></div>
                ) : !horariosBase.length ? (
                  <div className='text-center py-10 text-muted-foreground'>
                    {selectedProfessionalId ? 'No hay reglas de horario base definidas para este profesional.' : 'Seleccione un profesional.'}
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