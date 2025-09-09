import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { UseFormReturn } from 'react-hook-form';

interface PersonalInfoStepProps {
  form: UseFormReturn<any>;
  nacionalidades: any[];
  watchedValues: any;
}

export const PersonalInfoStep = ({ form, nacionalidades, watchedValues }: PersonalInfoStepProps) => {
  const isEcuatoguineana = watchedValues.nacionalidad === "Ecuatoguineana";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={form.control}
        name="nombre"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre *</FormLabel>
            <FormControl>
              <Input placeholder="Ingrese su nombre" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="apellidos"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Apellidos *</FormLabel>
            <FormControl>
              <Input placeholder="Ingrese sus apellidos" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="genero"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Género *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione su género" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Masculino">Masculino</SelectItem>
                <SelectItem value="Femenino">Femenino</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="fecha_nacimiento"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Fecha de Nacimiento *</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="nacionalidad"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Nacionalidad *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione su nacionalidad" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {Array.from(
                  new Set((nacionalidades || []).map((n: any) => String(n.nacionalidad || '').trim()))
                )
                  .filter((v) => !!v)
                  .map((val, idx) => (
                    <SelectItem key={`${val}-${idx}`} value={val}>
                      {val}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {isEcuatoguineana && (
        <FormField
          control={form.control}
          name="numero_dip"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número DIP *</FormLabel>
              <FormControl>
                <Input placeholder="Ingrese su número DIP" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {!isEcuatoguineana && (
        <FormField
          control={form.control}
          name="numero_pasaporte"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Pasaporte *</FormLabel>
              <FormControl>
                <Input placeholder="Ingrese su número de pasaporte" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="telefono"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Teléfono *</FormLabel>
            <FormControl>
              <Input
                placeholder="Ej: +240XXXXXXXX"
                inputMode="tel"
                value={field.value}
                onChange={(e) => {
                  let v = e.target.value.replace(/\s|-/g, "");
                  if (v && !v.startsWith("+240")) {
                    if (v.startsWith("00240")) v = "+" + v.slice(2);
                    else if (v.startsWith("240")) v = "+" + v;
                    else if (!v.startsWith("+")) v = "+240" + v.replace(/^0+/, "");
                  }
                  field.onChange(v);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {!isEcuatoguineana && (
        <FormField
          control={form.control}
          name="pertenece_brigada_medica"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 md:col-span-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  ¿Pertenece a una brigada médica de cooperación?
                </FormLabel>
              </div>
            </FormItem>
          )}
        />
      )}

      {watchedValues.pertenece_brigada_medica && (
        <FormField
          control={form.control}
          name="tipo_cooperacion"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Tipo de Cooperación</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione el tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Brigada Médica Cubana">Brigada Médica Cubana</SelectItem>
                  <SelectItem value="Cooperación Española">Cooperación Española</SelectItem>
                  <SelectItem value="Cooperación Marroquí">Cooperación Marroquí</SelectItem>
                  <SelectItem value="Otra">Otra</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};
