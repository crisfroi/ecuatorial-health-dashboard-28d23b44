import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { useAreasProfesionales } from '@/hooks/useAreasProfesionales';
import { usePaises } from '@/hooks/usePaises';
import { useInstitucionesFormacion, addInstitucionFormacion } from '@/hooks/useInstitucionesFormacion';
import { Button } from '@/components/ui/button';

interface EducationStepProps {
  form: UseFormReturn<any>;
}

// Eliminado listado estático: ahora se obtiene desde la tabla areas_profesionales

const categorias_titulacion = [
  "LICENCIATURA",
  "DIPLOMADO", 
  "MASTER",
  "ESPECIALIDAD",
  "TÉCNICO",
  "AUXILIAR"
];

export const EducationStep = ({ form }: EducationStepProps) => {
  const { data: areas = [] } = useAreasProfesionales();
  const { data: paises = [], isLoading: isLoadingPaises } = usePaises();
  const watchedCategoria = form.watch('categoria_titulacion');
  const watchedPais = form.watch('pais_formacion_1');
  const watchedInstitucion = form.watch('institucion_1');
  const { data: instituciones = [] } = useInstitucionesFormacion(watchedPais);

  // Estados para añadir nueva institución y periodo
  const [addingNew, setAddingNew] = React.useState(false);
  const [categoriaInstitucion, setCategoriaInstitucion] = React.useState<string>('Universidad');

  // Recuperar anio_inicio y anio_fin del formulario si existen
  const savedAnioInicio = form.watch('anio_inicio');
  const savedAnioFin = form.watch('anio_fin');

  const [anioInicio, setAnioInicio] = React.useState<number | ''>(savedAnioInicio || '');
  const [anioFin, setAnioFin] = React.useState<number | ''>(savedAnioFin || '');

  // Sincronizar años con el formulario para persistencia
  React.useEffect(() => {
    if (anioInicio) form.setValue('anio_inicio', anioInicio);
  }, [anioInicio, form]);

  React.useEffect(() => {
    if (anioFin) form.setValue('anio_fin', anioFin);
  }, [anioFin, form]);

  // Calcular período cuando los años cambian
  React.useEffect(() => {
    if (typeof anioInicio === 'number' && typeof anioFin === 'number' && anioInicio > 1900 && anioFin >= anioInicio) {
      form.setValue('periodo_formacion', `${anioInicio}-${anioFin}`);
    }
  }, [anioInicio, anioFin, form]);

  React.useEffect(() => {
    // Si selecciona una institución existente, limpiamos la categoría editable
    if (watchedInstitucion && instituciones.find(i => i.nombre === watchedInstitucion)) {
      const inst = instituciones.find(i => i.nombre === watchedInstitucion)!;
      setCategoriaInstitucion(inst.categoria);
      form.setValue('categoria_institucion_1', inst.categoria as any);
    }
  }, [watchedInstitucion, instituciones]);

  const handleAddInstitution = async () => {
    if (!watchedPais || !watchedInstitucion) return;
    const exists = instituciones.find(i => i.nombre.trim().toLowerCase() === watchedInstitucion.trim().toLowerCase());
    if (exists) return;
    const created = await addInstitucionFormacion(watchedInstitucion, watchedPais, categoriaInstitucion || 'OTRA');
    setAddingNew(false);
    setCategoriaInstitucion(created.categoria);
    form.setValue('categoria_institucion_1', created.categoria as any);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Selector de área profesional (por FK). Se guarda id y nombre */}
      <FormField
        control={form.control}
        name="area_profesional"
        render={() => (
          <FormItem>
            <FormLabel>Área Profesional *</FormLabel>
            <Select
              value={form.watch('area_profesional_id') || ''}
              onValueChange={(id) => {
                const selected = areas.find((a) => a.id === id);
                form.setValue('area_profesional_id', id);
                form.setValue('area_profesional', selected?.nombre || '');
              }}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el área" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {areas.length > 0
                  ? areas.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.nombre}
                      </SelectItem>
                    ))
                  : null}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {watchedCategoria === 'ESPECIALIDAD' && (
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
      )}

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
        name="pais_formacion_1"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>País de Formación *</FormLabel>
            <Select onValueChange={(v) => field.onChange(String(v).toUpperCase())} defaultValue={field.value ? String(field.value).toUpperCase() : field.value} disabled={isLoadingPaises}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingPaises ? "Cargando países..." : "Seleccione el país donde obtuvo la titulación"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {paises.map((pais) => (
                  <SelectItem key={pais} value={String(pais).toUpperCase()}>
                    {String(pais).toUpperCase()}
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
        name="institucion_1"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Institución de Formación *</FormLabel>
            <div className="space-y-2">
              <Select onValueChange={(v) => { field.onChange(v); setAddingNew(false); }} defaultValue={field.value} disabled={!watchedPais}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={watchedPais ? "Seleccione institución" : "Seleccione primero el país"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {instituciones.map((inst) => (
                    <SelectItem key={inst.id} value={inst.nombre}>{inst.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setAddingNew(!addingNew)} disabled={!watchedPais}>
                  {addingNew ? 'Cancelar' : 'Añadir nueva institución'}
                </Button>
              </div>
              {addingNew && (
                <div className="space-y-2">
                  <Input placeholder="Nombre de la institución" value={field.value || ''} onChange={(e) => field.onChange(e.target.value)} />
                  <div>
                    <FormLabel>Categoría de la Institución</FormLabel>
                    <Select value={categoriaInstitucion} onValueChange={(v) => { setCategoriaInstitucion(v); form.setValue('categoria_institucion_1', v as any); }}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Universidad">Universidad</SelectItem>
                        <SelectItem value="Instituto Profesional">Instituto Profesional</SelectItem>
                        <SelectItem value="Centro de Formación">Centro de Formación</SelectItem>
                        <SelectItem value="Escuela Técnica">Escuela Técnica</SelectItem>
                        <SelectItem value="Otra">Otra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="button" onClick={handleAddInstitution} disabled={!watchedPais || !field.value}>Guardar institución</Button>
                </div>
              )}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="periodo_formacion"
        render={() => (
          <FormItem>
            <FormLabel>Período de Formación *</FormLabel>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Inicio (YYYY)" value={anioInicio as any} onChange={(e) => setAnioInicio(e.target.value ? Number(e.target.value) : '')} />
              <Input type="number" placeholder="Fin (YYYY)" value={anioFin as any} onChange={(e) => setAnioFin(e.target.value ? Number(e.target.value) : '')} />
            </div>
            <div className="text-xs text-gray-500">Se guardará como: {typeof anioInicio === 'number' && typeof anioFin === 'number' ? `${anioInicio}-${anioFin}` : 'YYYY-YYYY'}</div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
