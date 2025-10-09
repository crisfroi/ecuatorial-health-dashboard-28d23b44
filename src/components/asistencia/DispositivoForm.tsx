import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const dispositivoSchema = z.object({
  nombre: z.string().min(3, 'Ingrese un nombre válido'),
  ubicacion: z.string().max(120, 'Máximo 120 caracteres').optional().or(z.literal('')),
  centro_salud_id: z.string().optional().nullable(),
  activo: z.boolean().default(true),
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
      ...initialValues,
    },
  });

  useEffect(() => {
    form.reset({
      nombre: initialValues?.nombre ?? '',
      ubicacion: initialValues?.ubicacion ?? '',
      centro_salud_id: initialValues?.centro_salud_id ?? null,
      activo: initialValues?.activo ?? true,
    });
  }, [initialValues, form]);

  const handleSubmit = form.handleSubmit((values) => {
    const payload: DispositivoFormValues = {
      ...values,
      ubicacion: values.ubicacion?.trim() ? values.ubicacion.trim() : '',
      centro_salud_id: values.centro_salud_id ? values.centro_salud_id : null,
    };
    return onSubmit(payload);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
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
