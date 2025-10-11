import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, getDay, isAfter, isBefore } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import * as XLSX from 'xlsx'; // Importación necesaria para la exportación

import { CalendarDays, Save, Plus, Trash2, Download, Upload, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
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

// 🚨 Interfaz actualizada con los campos necesarios para la exportación de Personal.xls
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
      // Llama a la lógica de negocio en useAsistencia
      await importPersonalXls(DEVICE_ID_PLACEHOLDER, file, centerId);
      onComplete(); // Llama a invalidar queries
      setOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error de Importación',
        description: error.message || 'No se pudo procesar el archivo Personal.xls.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setFile(null); // Limpiar el archivo seleccionado
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
  const { userCenterId } = useAuth();
  const { listByProfessional, save, remove } = useHorariosBase();

  const [selectedProfessionalId, setSelectedProfessionalId] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // --- Data Fetching (Queries) ---

  // 1. Obtener Turnos Biométricos (Turnos disponibles)
  const { data: turnos = [], isLoading: isLoadingTurnos } = useQuery<TurnoRow[]>({
    queryKey: ['turnosBio', userCenterId],
    queryFn: async () => {
      if (!userCenterId) return [];
      const { data, error } = await supabase.from('turnos_biometricos').select('id, nombre_turno').eq('centro_salud_id', userCenterId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userCenterId,
  });

  // 2. Obtener Profesionales (🚨 ACTUALIZADO PARA INCLUIR CAMPOS DE EXPORTACIÓN 🚨)
  const { data: professionals = [], isLoading: isLoadingProfs } = useQuery<ProfessionalRow[]>({
    queryKey: ['professionals', userCenterId],
    queryFn: async () => {
      if (!userCenterId) return [];
      const { data, error } = await supabase.from('profesionales_sanitarios')
        .select('id, nombre_completo, numero_enrolamiento_enno, numero_tarjeta_rfid, fecha_nacimiento, area_profesional')
        .eq('centro_salud_id', userCenterId)
        .order('nombre_completo');
      if (error) throw error;
      // Añadir mapeo de nombre_completo a nombre para asegurar compatibilidad si fuera necesario, aunque se usa nombre_completo en esta interfaz.
      return data || [];
    },
    enabled: !!userCenterId,
  });

  // 3. Obtener Horarios Base del Profesional Seleccionado
  const { data: horariosBase = [], isLoading: isLoadingHorarios } = useQuery<HorarioBase[]>({
    queryKey: ['horariosBase', selectedProfessionalId],
    queryFn: () => listByProfessional(selectedProfessionalId),
    enabled: !!selectedProfessionalId,
  });

  // --- Formulario de Guardado (Mutations) ---
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

  const saveMutation = useMutation({
    mutationFn: (payload: HorarioBasePayload) => save(payload),
    onSuccess: () => {
      toast({ title: 'Regla guardada', description: 'El horario base se ha actualizado.' });
      queryClient.invalidateQueries({ queryKey: ['horariosBase', selectedProfessionalId] });
      saveForm.reset({
        ...saveForm.getValues(),
        turno_id: '',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al guardar la regla de horario base.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: z.infer<typeof saveHorarioSchema>) => {
    if (!userCenterId) {
      toast({ title: 'Error', description: 'ID de Centro de Salud no disponible.', variant: 'destructive' });
      return;
    }
    const payload: HorarioBasePayload = {
      ...values,
      dia_semana: Number(values.dia_semana),
      centro_salud_id: userCenterId,
      vigencia_hasta: values.vigencia_hasta || null,
    };
    saveMutation.mutate(payload);
  };

  // --- Funciones de Exportación (Personal.xls) - CORREGIDA Y COMPLETA ---
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

      // --- Cálculo de Cumpleaños (MM/DD) ---
      let birthdayFormatted = '';
      if (p.fecha_nacimiento) {
        try {
          // p.fecha_nacimiento viene como 'AAAA-MM-DD'. Lo convertimos a MM/DD
          const dob = new Date(p.fecha_nacimiento + 'T00:00:00');
          if (!isNaN(dob.getTime())) {
            // Formato esperado: MM/DD
            birthdayFormatted = format(dob, 'MM/dd');
          }
        } catch (e) { /* Fecha inválida */ }
      }

      return {
        ID: p.numero_enrolamiento_enno || '', // Mapeado a numero_enrolamiento_enno
        Nombre: p.nombre_completo,
        'Depto.': p.area_profesional || '', // Mapeado a area_profesional
        Turno: '',          // Vacío por defecto
        'Admin.': 0,        // Fijo 0 (no admin)
        'Registro de Huella': 0, // Fijo 0
        Rostro: 0,          // Fijo 0
        'Registrar Contraseña': 0, // Fijo 0
        'ID o Tarjeta': p.numero_tarjeta_rfid || '', // Mapeado a numero_tarjeta_rfid
        'Bloqueo de zona horaria': 0, // Fijo 0
        Grupo: 0,           // Fijo 0
        'Modo Verificar': 0, // Fijo 0
        Cumpleaños: birthdayFormatted, // Formato MM/DD
        'Inicio:': '',      // Vacío 
        'Fin:': '',         // Vacío 
        Perfil: '',         // Vacío
      };
    });

    // --- 3. Generación del Archivo Excel (XLSX) con la estructura de filas correcta ---
    const wb = XLSX.utils.book_new();
    // Creamos la hoja de datos, omitiendo la cabecera por ahora
    const ws = XLSX.utils.json_to_sheet(data, { header: headers, skipHeader: true });

    // Fila 1 (A1): Instrucciones/Notas (Fila 2 queda vacía)
    XLSX.utils.sheet_add_aoa(ws, [['NOTA: Esta es la plantilla de Personal para el dispositivo biométrico. Los datos comienzan en la Fila 4.']], { origin: 'A1' });

    // Fila 3 (A3): Cabecera real (los headers exactos)
    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A3' });

    // Fila 4 (A4): Datos de la tabla
    XLSX.utils.sheet_add_json(ws, data, {
      skipHeader: true,
      origin: 'A4',
    });

    XLSX.utils.book_append_sheet(wb, ws, 'Personal');
    XLSX.writeFile(wb, 'Personal.xls'); // Nombre de archivo correcto

    toast({ title: 'Exportación de Personal', description: 'El archivo Personal.xls con la plantilla biométrica está listo.' });
  };


  const handleImportComplete = () => {
    // Invalida la query de profesionales para obtener los nuevos EnNo/RFID
    queryClient.invalidateQueries({ queryKey: ['professionals', userCenterId] });
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
        </div>
        <div className='flex space-x-2'>
          <Button variant="outline" onClick={handleExport} disabled={isLoadingProfs || !professionals.length}>
            <Download className='mr-2 h-4 w-4' /> **Exportar Personal.xls**
          </Button>
          {/* Botón que abre el Dialog de Importación */}
          <ImportPersonalDialog centerId={userCenterId} onComplete={handleImportComplete} />
        </div>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>

          {/* Columna 1: Selección de Profesional */}
          <Card className='col-span-1 h-full'>
            <CardHeader>
              <CardTitle className='text-base'>Seleccionar Profesional</CardTitle>
              <CardDescription>Busque al profesional para ver/editar sus reglas.</CardDescription>
            </CardHeader>
            <ScrollArea className='h-[400px] p-4'>
              {isLoadingProfs ? (
                <div className='space-y-2'><Skeleton className='h-8 w-full' /><Skeleton className='h-8 w-full' /></div>
              ) : (
                <Select
                  value={selectedProfessionalId}
                  onValueChange={(val) => {
                    setSelectedProfessionalId(val);
                    saveForm.setValue('id_profesional', val);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar un profesional..." />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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
                  <Button size='sm' disabled={!selectedProfessionalId} onClick={() => saveForm.setValue('id_profesional', selectedProfessionalId)}>
                    <Plus className='mr-2 h-4 w-4' /> Añadir Regla
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
                        <Button type="submit" disabled={saveMutation.isLoading}>
                          <Save className='mr-2 h-4 w-4' /> Guardar Regla
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
                                  // Asumo que 'remove' es una función de useHorariosBase que maneja la mutación de eliminación.
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