
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';

interface WorkSituationStepProps {
  form: UseFormReturn<any>;
  watchedValues: any;
  distritosSanitarios: any[];
}

const categorias_centro = [
  "HOSPITAL",
  "CENTRO DE SALUD",
  "CLINICA",
  "CONSULTORIO",
  "FARMACIA",
  "LABORATORIO"
];

export const WorkSituationStep = ({ form, watchedValues, distritosSanitarios }: WorkSituationStepProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={form.control}
        name="situacion_laboral"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Situación Laboral *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione su situación" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="En paro">En paro</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {watchedValues.situacion_laboral === 'Activo' && (
        <>
          <FormField
            control={form.control}
            name="nombre_centro"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Centro de Trabajo *</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del centro donde trabaja" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoria_centro"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría del Centro *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione la categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categorias_centro.map((categoria) => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
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
            name="tipo_sector"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Sector *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el sector" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Público">Público</SelectItem>
                    <SelectItem value="Privado">Privado</SelectItem>
                    <SelectItem value="Mixto">Mixto</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="distrito_sanitario"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Distrito Sanitario</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el distrito sanitario" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {distritosSanitarios.map((distrito) => (
                      <SelectItem key={distrito.nombre_distrito} value={distrito.nombre_distrito}>
                        {distrito.nombre_distrito} - {distrito.nombre_provincia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  );
};
