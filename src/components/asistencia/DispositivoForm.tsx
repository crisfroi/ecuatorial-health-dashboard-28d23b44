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
// 1. ESQUEMA ZOD (Mantiene tm_no como string para el campo de entrada)
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
  // Usamos 'any' en onSubmit para permitir que el payload tenga number/null para tm_no, 
  // aunque el formulario lo maneje como string.
  onSubmit: (values: any) => Promise<void> | void;
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
      tm_no: initialValues?.tm_no ?? '',
    });
  }, [initialValues, form]);

  const handleSubmit = form.handleSubmit((values) => {

    // 1. LÓGICA CRÍTICA: Convertir el string tm_no a number o null para la DB
    const rawTmNo = values.tm_no?.trim();
    let tm_no_db_value: string | number | null = null;

    if (rawTmNo) {
      const num = Number(rawTmNo);
      // Si el valor es un número válido (ej. "1"), lo enviamos como number (1)
      // Si no es un número (ej. "ABC"), lo enviamos como string (si la DB lo permite)
      tm_no_db_value = isNaN(num) ? rawTmNo : num;
    } else {
      // Si el campo está vacío, enviamos NULL para que la DB lo maneje correctamente
      tm_no_db_value = null;
    }

    // 2. Construcción del Payload final para la base de datos
    const payloadForDb = {
      ...values,
      // Usar NULL para ubicacion si está vacío (mejor que string vacío)
      ubicacion: values.ubicacion?.trim() ? values.ubicacion.trim() : null,
      centro_salud_id: values.centro_salud_id ? values.centro_salud_id : null,
      // Aplicamos el valor con el tipo correcto (number o null)
      tm_no: tm_no_db_value,
    };

    // ------------------------------------------------------------------
    // 📢 LOG DE SALIDA (Actualizado para mostrar el tipo final)
    // ------------------------------------------------------------------
    console.log('✅ PAYLOAD FINAL DEL FORMULARIO (con conversión a number/null):', payloadForDb);
    // ------------------------------------------------------------------

    // Llamamos a onSubmit con el payload modificado
    return onSubmit(payloadForDb);
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
                {/* Nota: Type "text" para que React Hook Form lo maneje como string */}
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
