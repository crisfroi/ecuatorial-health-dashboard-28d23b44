import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';
import { PROVINCIAS_EG } from '@/utils/geo';
import { useDistritos } from '@/hooks/useDistritos';

interface AddressStepProps {
  form: UseFormReturn<any>;
  watchedValues?: any;
}

export const AddressStep = ({ form, watchedValues }: AddressStepProps) => {
  const { data: distritos = [] } = useDistritos(watchedValues?.provincia);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={form.control}
        name="domicilio"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Dirección de Domicilio *</FormLabel>
            <FormControl>
              <Textarea placeholder="Ingrese su dirección completa" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="provincia"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Provincia *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione la provincia" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PROVINCIAS_EG.map((provincia) => (
                  <SelectItem key={provincia} value={provincia}>
                    {provincia}
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
        name="distrito"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Distrito *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el distrito" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {distritos.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
