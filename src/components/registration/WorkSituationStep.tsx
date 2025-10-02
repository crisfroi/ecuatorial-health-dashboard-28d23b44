import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { UseFormReturn } from 'react-hook-form';
import { CentroTrabajoAutocomplete } from './CentroTrabajoAutocomplete';

interface WorkSituationStepProps {
  form: UseFormReturn<any>;
  watchedValues: any;
  distritosSanitarios: any[];
}

export const WorkSituationStep = ({ form, watchedValues, distritosSanitarios }: WorkSituationStepProps) => {
  console.log('Distritos sanitarios disponibles:', distritosSanitarios);
  
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="situacion_laboral"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Situación Laboral *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu situación laboral" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="En paro">En paro</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
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
            name="categoria_centro"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría del Centro *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="HOSPITAL">HOSPITAL</SelectItem>
                    <SelectItem value="CLINICA">CLINICA</SelectItem>
                    <SelectItem value="CENTRO DE SALUD">CENTRO DE SALUD</SelectItem>
                    <SelectItem value="CONSULTORIO">CONSULTORIO</SelectItem>
                    <SelectItem value="FARMACIA">FARMACIA</SelectItem>
                    <SelectItem value="LABORATORIO">LABORATORIO</SelectItem>
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
              <FormItem>
                <FormLabel>Distrito Sanitario</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el distrito sanitario" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {distritosSanitarios && distritosSanitarios.length > 0 ? (
                      distritosSanitarios.map((distrito) => (
                        <SelectItem key={distrito.nombre_distrito} value={distrito.nombre_distrito}>
                          {distrito.nombre_distrito} - {distrito.nombre_provincia}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-disponible" disabled>
                        No hay distritos disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Componente de autocompletado para centros de trabajo */}
          {watchedValues.categoria_centro && (
            <CentroTrabajoAutocomplete 
              form={form} 
              watchedValues={watchedValues}
            />
          )}

          <FormField
            control={form.control}
            name="tipo_sector"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Sector *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de sector" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Público">Público</SelectItem>
                    <SelectItem value="Privado">Privado</SelectItem>
                    <SelectItem value="Mixto">Mixto</SelectItem>
                    <SelectItem value="ONG">ONG</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="funcion_publica"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    ¿Pertenece a la Función Pública?
                  </FormLabel>
                  <p className="text-sm text-gray-600">
                    Marque esta casilla si es empleado/funcionario del sector público de salud
                  </p>
                </div>
              </FormItem>
            )}
          />

          {watchedValues.funcion_publica && (
            <>
              <FormField
                control={form.control}
                name="funcionario_estatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Funcionario</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione estatus" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="nombrado">Nombrado</SelectItem>
                        <SelectItem value="no_nombrado">No nombrado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedValues.funcionario_estatus === 'nombrado' && (
                <FormField
                  control={form.control}
                  name="numero_funcionario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Funcionario</FormLabel>
                      <FormControl>
                        <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Ingrese su número de funcionario" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {watchedValues.funcionario_estatus === 'nombrado' ? (
                  <FormField
                    control={form.control}
                    name="fecha_nombramiento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Nombramiento</FormLabel>
                        <FormControl>
                          <input type="date" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="fecha_inicio_trabajo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Inicio de Trabajo</FormLabel>
                        <FormControl>
                          <input type="date" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </>
          )}
        </>
      )}

      <FormField
        control={form.control}
        name="pertenece_brigada_medica"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                ¿Pertenece a alguna brigada médica de cooperación?
              </FormLabel>
              <p className="text-sm text-gray-600">
                Marque esta casilla si forma parte de brigadas médicas internacionales
              </p>
            </div>
          </FormItem>
        )}
      />

      {watchedValues.pertenece_brigada_medica && (
        <FormField
          control={form.control}
          name="tipo_cooperacion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Cooperación</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de cooperación" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Cuba">Cooperación con Cuba</SelectItem>
                  <SelectItem value="China">Cooperación con China</SelectItem>
                  <SelectItem value="España">Cooperación con España</SelectItem>
                  <SelectItem value="Francia">Cooperación con Francia</SelectItem>
                  <SelectItem value="OMS">Organización Mundial de la Salud</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
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
