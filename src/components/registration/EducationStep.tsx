import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { usePaises } from '@/hooks/usePaises';

interface EducationStepProps {
  form: UseFormReturn<any>;
}

const areas_profesionales = [
  "Medicina General",
  "Enfermería",
  "Farmacia",
  "Odontología",
  "Fisioterapia",
  "Psicología",
  "Nutrición",
  "Radiología",
  "Laboratorio",
  "Biología",
  "Oftamológia",
  "Cuidados Intensivos"
];

const categorias_titulacion = [
  "LICENCIATURA",
  "DIPLOMADO", 
  "MASTER",
  "ESPECIALIDAD",
  "TÉCNICO",
  "AUXILIAR"
];

export const EducationStep = ({ form }: EducationStepProps) => {
  const { data: paises = [], isLoading: isLoadingPaises } = usePaises();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={form.control}
        name="area_profesional"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Área Profesional *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el área" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {areas_profesionales.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
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
        name="especialidad"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Especialidad</FormLabel>
            <FormControl>
              <Input placeholder="Ingrese su especialidad" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="categoria_titulacion"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Categoría de Titulación *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione la categoría" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {categorias_titulacion.map((categoria) => (
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
        name="titulacion_especifica_1"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Titulación *</FormLabel>
            <FormControl>
              <Input placeholder="Ej: Licenciado en Medicina" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="institucion_1"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Institución *</FormLabel>
            <FormControl>
              <Input placeholder="Nombre de la institución" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="periodo_formacion"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Período de Formación *</FormLabel>
            <FormControl>
              <Input placeholder="Ej: 2018-2022" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="pais_formacion_1"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>País de Formación *</FormLabel>
            <FormControl>
              <Input placeholder="País donde obtuvo la titulación" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
