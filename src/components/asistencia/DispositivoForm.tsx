import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

// ----------------------------------------------------------------------
// 1. ESQUEMA ZOD (Añadido tm_no)
// ----------------------------------------------------------------------

const dispositivoSchema = z.object({
  nombre: z.string().min(3, 'Ingrese un nombre válido'),
  ubicacion: z.string().max(120, 'Máximo 120 caracteres').optional().or(z.literal('')),
  centro_salud_id: z.string().optional().nullable(),
  activo: z.boolean().default(true),
  // Campo técnico: tm_no (Número de Terminal)
  tm_no: z.string().max(10, 'Máximo 10 caracteres').optional().or(z.literal('')),
});

export type DispositivoFormValues = z.infer<typeof dispositivoSchema>;

interface CentroOption {
  id: string;
  nombre: string;
}

interface DispositivoFormProps {
  initialValues?: Partial<DispositivoFormValues>;
  centers: CentroOption[];
  onSubmit: (values: DispositivoFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
  loading?: boolean;
}

// ----------------------------------------------------------------------
// 2. COMPONENTE DE FORMULARIO
// ----------------------------------------------------------------------

export function DispositivoForm({
  initialValues,
  centers,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
  loading = false,
}: DispositivoFormProps) {
  const form = useForm<DispositivoFormValues>({
    resolver: zodResolver(dispositivoSchema),
    defaultValues: {
      nombre: '',
      ubicacion: '',
      centro_salud_id: null,
      activo: true,
      // Añadido tm_no a los valores por defecto
      tm_no: '',
      ...initialValues,
    },
  });

  useEffect(() => {
    form.reset({
      nombre: initialValues?.nombre ?? '',
      ubicacion: initialValues?.ubicacion ?? '',
      centro_salud_id: initialValues?.centro_salud_id ?? null,
      activo: initialValues?.activo ?? true,
      // Añadido tm_no al reset
      tm_no: initialValues?.tm_no ?? '',
    });
  }, [initialValues, form]);

  const handleSubmit = form.handleSubmit((values) => {
    const payload: DispositivoFormValues = {
      ...values,
      ubicacion: values.ubicacion?.trim() ? values.ubicacion.trim() : '',
      centro_salud_id: values.centro_salud_id ? values.centro_salud_id : null,
      // Asegurar que tm_no se guarda como string vacío si está vacío (para la DB)
      tm_no: values.tm_no?.trim() ? values.tm_no.trim() : '',
    };
    return onSubmit(payload);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ========================================================== */}
        {/* CAMPO: NÚMERO DE TERMINAL (TM No.) - Dato Técnico */}
        {/* ========================================================== */}
        <FormField
          control={form.control}
          name="tm_no"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Terminal (TM No.)</FormLabel>
              <FormControl>
                <Input placeholder="Ej. 1, 2, 3 (ID único del dispositivo)" {...field} />
              </FormControl>
              <p className="text-sm text-red-500">
                ⚠️ **CRÍTICO:** Este número debe coincidir con el ID configurado en el dispositivo físico y ser único en el sistema.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ========================================================== */}
        {/* CAMPO: NOMBRE DEL DISPOSITIVO (Funcional) */}
        {/* ========================================================== */}
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del dispositivo</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Biométrico Recepción" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ========================================================== */}
        {/* CAMPO: UBICACIÓN */}
        {/* ========================================================== */}
        <FormField
          control={form.control}
          name="ubicacion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ubicación</FormLabel>
              <FormControl>
                <Input placeholder="Sala o área" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ========================================================== */}
        {/* CAMPO: CENTRO DE SALUD */}
        {/* ========================================================== */}
        <FormField
          control={form.control}
          name="centro_salud_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Centro de salud</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                value={field.value ?? 'none'}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un centro" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {centers.map((centro) => (
                    <SelectItem key={centro.id} value={centro.id}>
                      {centro.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ========================================================== */}
        {/* CAMPO: ACTIVO */}
        {/* ========================================================== */}
        <FormField
          control={form.control}
          name="activo"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <FormLabel>Dispositivo activo</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Los fichajes sólo se registrarán cuando el dispositivo esté activo.
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Botones de acción */}
        <div className="flex justify-end gap-3">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
          ) : null}
          <Button type="submit" disabled={loading}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}