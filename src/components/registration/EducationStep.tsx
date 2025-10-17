import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { usePaises, Pais } from '@/hooks/usePaises'; // AHORA IMPORTAMOS 'Pais'
import { useInstitucionesFormacion, addInstitucionFormacion } from '@/hooks/useInstitucionesFormacion';
import { Button } from '@/components/ui/button';

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
  // MODIFICACIÓN 1: usePaises ahora devuelve objetos { id, pais }
  const { data: paises = [], isLoading: isLoadingPaises } = usePaises(); 
  
  // Campos vigilados (watched fields)
  const watchedCategoria = form.watch('categoria_titulacion');
  
  // MODIFICACIÓN 2: Se vigila el ID del país para guardarlo
  const watchedPais = form.watch('pais_formacion_1'); // Nombre del país (texto, para filtrar instituciones)
  const watchedPaisId = form.watch('pais_formacion_id_1'); // NUEVO: ID del país (clave foránea)
  
  // Vigilamos el ID de la institución
  const watchedInstitucionId = form.watch('institucion_formacion_id_1'); 
  const watchedInstitucionName = form.watch('institucion_1');
  
  const { data: instituciones = [] } = useInstitucionesFormacion(watchedPais);

  // Estados para añadir nueva institución y periodo
  const [addingNew, setAddingNew] = React.useState(false);
  const [categoriaInstitucion, setCategoriaInstitucion] = React.useState<string>('Universidad');
  const [anioInicio, setAnioInicio] = React.useState<number | ''>('');
  const [anioFin, setAnioFin] = React.useState<number | ''>('');

  // Efecto para calcular el periodo de formación
  React.useEffect(() => {
    if (typeof anioInicio === 'number' && typeof anioFin === 'number' && anioInicio > 1900 && anioFin >= anioInicio) {
      form.setValue('periodo_formacion', `${anioInicio}-${anioFin}`);
    }
  }, [anioInicio, anioFin]);

  // Efecto para sincronizar la categoría al seleccionar una institución existente por su ID
  React.useEffect(() => {
    if (watchedInstitucionId) {
      // Buscamos por ID
      const inst = instituciones.find(i => i.id === watchedInstitucionId);
      if (inst) {
        setCategoriaInstitucion(inst.categoria);
        form.setValue('categoria_institucion_1', inst.categoria as any);
      }
    } else {
      // Si el ID se borra, limpiamos el campo de nombre por seguridad
      if (!addingNew) {
        form.setValue('institucion_1', '');
      }
    }
  }, [watchedInstitucionId, instituciones, addingNew, form.setValue]);

  // MODIFICACIÓN 3: La función de añadir institución ahora requiere el ID del país.
  const handleAddInstitution = async () => {
    // Validamos que exista tanto el nombre del país (texto) como su ID (numérico)
    if (!watchedPais || !watchedInstitucionName || !watchedPaisId) return; 
    
    // Comprobación de duplicidad (por nombre en el mismo país)
    const exists = instituciones.find(i => i.nombre.trim().toLowerCase() === watchedInstitucionName.trim().toLowerCase());
    if (exists) return;

    // 1. Insertar en la tabla de catálogo (instituciones_formacion)
    // PASAMOS EL watchedPaisId a la función de inserción
    const created = await addInstitucionFormacion(watchedInstitucionName, watchedPais, categoriaInstitucion || 'OTRA', watchedPaisId);
    
    // 2. Actualizar el formulario con el ID y el nombre
    form.setValue('institucion_formacion_id_1', created.id); // GUARDAMOS EL ID (Clave foránea)
    form.setValue('institucion_1', created.nombre); // GUARDAMOS EL NOMBRE (Compatibilidad/Referencia)
    
    // 3. Establecer la categoría y limpiar estados
    setAddingNew(false);
    setCategoriaInstitucion(created.categoria);
    form.setValue('categoria_institucion_1', created.categoria as any);
  };
  
  // Función para manejar el cambio en el Select de institución
  const handleSelectInstitution = (id: string) => {
    // 1. Guardamos el ID en la clave foránea
    form.setValue('institucion_formacion_id_1', id);
    
    // 2. Buscamos el objeto para obtener el nombre y la categoría
    const inst = instituciones.find(i => i.id === id); 
    
    if(inst) {
      // 3. Actualizamos el campo de nombre y la categoría para la UI/compatibilidad
      form.setValue('institucion_1', inst.nombre);
      form.setValue('categoria_institucion_1', inst.categoria as any);
      setCategoriaInstitucion(inst.categoria);
    }
    setAddingNew(false);
  };

  // MODIFICACIÓN 4: Nueva función para manejar el cambio de país y guardar el ID.
  const handlePaisChange = (paisIdString: string) => {
    // Convertimos el ID de vuelta a número
    const paisId = Number(paisIdString); 
    // Buscamos el objeto país completo ({ id, pais })
    const selectedPais = paises.find((p: Pais) => p.id === paisId);
    
    if (selectedPais) {
      // 1. GUARDAMOS EL ID (Clave foránea: pais_formacion_id_1)
      form.setValue('pais_formacion_id_1', paisId);
      // 2. GUARDAMOS EL NOMBRE (Texto de compatibilidad: pais_formacion_1)
      form.setValue('pais_formacion_1', selectedPais.pais.toUpperCase());

      // Limpiamos los campos de institución al cambiar el país
      form.setValue('institucion_formacion_id_1', '');
      form.setValue('institucion_1', '');
      setAddingNew(false);
    }
  };


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Área Profesional */}
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

      {/* Especialidad (condicional) */}
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

      {/* Categoría de Titulación */}
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

      {/* Titulación */}
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

      {/* MODIFICACIÓN 5: País de Formación (Ahora usa pais_formacion_id_1) */}
      <FormField
        control={form.control}
        name="pais_formacion_id_1" // Usamos el ID como campo principal
        render={() => (
          <FormItem className="md:col-span-2">
            <FormLabel>País de Formación *</FormLabel>
            {/* El valor del Select es el ID del país */}
            <Select 
                onValueChange={handlePaisChange} // Usamos la nueva función handlePaisChange
                value={watchedPaisId ? String(watchedPaisId) : undefined}
                disabled={isLoadingPaises}
            >
              <FormControl>
                <SelectTrigger>
                  {/* Se muestra el nombre del país seleccionado, que se guarda en pais_formacion_1 */}
                  <SelectValue placeholder={isLoadingPaises ? "Cargando países..." : "Seleccione el país donde obtuvo la titulación"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {paises.map((pais: Pais) => (
                  // El valor es el ID (string), el texto es el nombre en mayúsculas
                  <SelectItem key={pais.id} value={String(pais.id)}>
                    {pais.pais.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Campo de validación para el nombre del país (por si la validación depende de él) */}
            <FormField
                control={form.control}
                name="pais_formacion_1"
                render={() => <FormMessage />}
            />
          </FormItem>
        )}
      />

      {/* Institución de Formación */}
      <FormField
        control={form.control}
        name="institucion_formacion_id_1" 
        render={() => (
          <FormItem>
            <FormLabel>Institución de Formación *</FormLabel>
            <div className="space-y-2">
              <Select 
                onValueChange={handleSelectInstitution} 
                value={watchedInstitucionId} 
                disabled={!watchedPais || addingNew}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={watchedPais ? (watchedInstitucionName || "Seleccione institución") : "Seleccione primero el país"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {instituciones.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setAddingNew(!addingNew)} disabled={!watchedPais}>
                  {addingNew ? 'Cancelar' : 'Añadir nueva institución'}
                </Button>
              </div>

              {addingNew && (
                <div className="space-y-2 pt-2 border-t border-dashed mt-2">
                  <Input 
                      placeholder="Nombre de la institución" 
                      value={watchedInstitucionName || ''} 
                      onChange={(e) => { 
                          form.setValue('institucion_1', e.target.value); 
                          form.setValue('institucion_formacion_id_1', ''); 
                      }} 
                  />
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
                  {/* MODIFICACIÓN 6: Deshabilitar el botón si el ID del país no está definido */}
                  <Button type="button" onClick={handleAddInstitution} disabled={!watchedPais || !watchedInstitucionName || !watchedPaisId}>Guardar institución</Button>
                </div>
              )}
            </div>
            <FormField
                control={form.control}
                name="institucion_1"
                render={() => <FormMessage />}
            />
          </FormItem>
        )}
      />

      {/* Período de Formación */}
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
