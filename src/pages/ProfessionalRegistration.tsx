
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Upload, User, Home, GraduationCap, Briefcase, FileText, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useNacionalidades } from '@/hooks/useNacionalidades';
import { useDistritosSanitarios } from '@/hooks/useDistritosSanitarios';

// Schema de validación actualizado
const formSchema = z.object({
  nombre: z.string().min(2, "El nombre es requerido"),
  apellidos: z.string().min(2, "Los apellidos son requeridos"),
  genero: z.string().min(1, "El género es requerido"),
  fecha_nacimiento: z.string().min(1, "La fecha de nacimiento es requerida"),
  nacionalidad: z.string().min(1, "La nacionalidad es requerida"),
  numero_dip: z.string().optional(),
  numero_pasaporte: z.string().optional(),
  telefono: z.string().min(8, "El teléfono debe tener al menos 8 dígitos"),
  domicilio: z.string().min(5, "El domicilio es requerido"),
  provincia: z.string().min(1, "La provincia es requerida"),
  distrito: z.string().min(1, "El distrito es requerido"),
  area_profesional: z.string().min(1, "El área profesional es requerida"),
  especialidad: z.string().optional(),
  categoria_titulacion: z.string().min(1, "La categoría de titulación es requerida"),
  titulacion_especifica_1: z.string().min(1, "La titulación es requerida"),
  institucion_1: z.string().min(1, "La institución es requerida"),
  periodo_formacion: z.string().min(1, "El período de formación es requerido"),
  pais_formacion_1: z.string().min(1, "El país de formación es requerido"),
  situacion_laboral: z.string().min(1, "La situación laboral es requerida"),
  nombre_centro: z.string().min(1, "El centro de trabajo es requerido"),
  categoria_centro: z.string().min(1, "La categoría del centro es requerida"),
  tipo_sector: z.string().min(1, "El tipo de sector es requerido"),
  distrito_sanitario: z.string().optional(),
  pertenece_brigada_medica: z.boolean().default(false),
  tipo_cooperacion: z.string().optional(),
  documentos: z.any().optional(),
  acepta_politicas: z.boolean().refine(val => val === true, "Debe aceptar las políticas")
});

type FormData = z.infer<typeof formSchema>;

const steps = [
  { id: 1, title: "Datos Personales", icon: User },
  { id: 2, title: "Domicilio", icon: Home },
  { id: 3, title: "Formación", icon: GraduationCap },
  { id: 4, title: "Situación Laboral", icon: Briefcase },
  { id: 5, title: "Documentos", icon: FileText },
  { id: 6, title: "Confirmación", icon: CheckCircle }
];

const provincias = [
  "Annobon",
  "Bioko Norte",
  "Bioko Sur",
  "Centro Sur",
  "Kie-Ntem",
  "Litoral",
  "Wele-Nzas"
];

const areas_profesionales = [
  "Medicina",
  "Enfermería",
  "Farmacia",
  "Odontología",
  "Fisioterapia",
  "Psicología",
  "Nutrición",
  "Radiología",
  "Laboratorio",
  "Otra"
];

const categorias_titulacion = [
  "LICENCIATURA",
  "DIPLOMADO", 
  "MASTER",
  "ESPECIALIDAD",
  "TÉCNICO"
];

const categorias_centro = [
  "HOSPITAL",
  "CENTRO DE SALUD",
  "CLINICA",
  "CONSULTORIO",
  "FARMACIA",
  "LABORATORIO"
];

const ProfessionalRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: nacionalidades = [] } = useNacionalidades();
  const { data: distritosSanitarios = [] } = useDistritosSanitarios();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pertenece_brigada_medica: false,
      acepta_politicas: false,
      situacion_laboral: 'Activo'
    }
  });

  const watchedValues = form.watch();
  const isEcuatoguineana = watchedValues.nacionalidad === "Ecuatoguineana";

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Calcular edad
      const birthDate = new Date(data.fecha_nacimiento);
      const age = new Date().getFullYear() - birthDate.getFullYear();

      // Preparar datos de documentos
      const documentosData = uploadedFiles.map(file => ({
        nombre: file.name,
        tipo: file.type,
        tamaño: file.size
      }));

      // Crear objeto con los datos del formulario
      const submissionData = {
        nombre_completo: `${data.nombre} ${data.apellidos}`,
        nombre: data.nombre,
        apellidos: data.apellidos,
        genero: data.genero,
        fecha_nacimiento: data.fecha_nacimiento,
        edad: age,
        nacionalidad: data.nacionalidad,
        numero_dip: data.numero_dip || null,
        numero_pasaporte: data.numero_pasaporte || null,
        telefono: data.telefono,
        domicilio: data.domicilio,
        provincia: data.provincia,
        distrito: data.distrito,
        area_profesional: data.area_profesional,
        especialidad: data.especialidad || null,
        categoria_titulacion: data.categoria_titulacion,
        titulacion_especifica_1: data.titulacion_especifica_1,
        institucion_1: data.institucion_1,
        periodo_formacion: data.periodo_formacion,
        pais_formacion_1: data.pais_formacion_1,
        situacion_laboral: data.situacion_laboral,
        nombre_centro: data.nombre_centro,
        categoria_centro: data.categoria_centro,
        tipo_sector: data.tipo_sector,
        distrito_sanitario: data.distrito_sanitario || null,
        pertenece_brigada_medica: data.pertenece_brigada_medica,
        tipo_cooperacion: data.tipo_cooperacion || null,
        documentos_cargados: documentosData,
        estado_solicitud: 'Pendiente' as const,
        fecha_solicitud: new Date().toISOString().split('T')[0]
      };

      const { data: result, error } = await supabase
        .from('profesionales_sanitarios')
        .insert([submissionData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Solicitud enviada exitosamente",
        description: "Su solicitud ha sido registrada y está pendiente de revisión.",
      });

      navigate('/');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al enviar su solicitud. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            Registro de Profesional Sanitario
          </h1>
          <p className="text-center text-gray-600">
            Complete todos los campos para registrarse en el sistema
          </p>
        </div>

        <div className="mb-8">
          <Progress value={progress} className="w-full mb-4" />
          <div className="flex justify-between items-center">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center ${
                    step.id <= currentStep ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 ${
                      step.id <= currentStep
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 bg-white text-gray-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-center font-medium">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {React.createElement(steps[currentStep - 1].icon, { className: "w-5 h-5 text-blue-600" })}
                  <span>{steps[currentStep - 1].title}</span>
                </CardTitle>
                <CardDescription>
                  Complete la información solicitada para continuar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Paso 1: Datos Personales */}
                {currentStep === 1 && (
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
                              {nacionalidades.map((nacionalidad) => (
                                <SelectItem key={nacionalidad.id} value={nacionalidad.nacionalidad}>
                                  {nacionalidad.nacionalidad}
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
                            <FormLabel>Número DIP</FormLabel>
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
                            <FormLabel>Número de Pasaporte</FormLabel>
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
                            <Input placeholder="Ej: +240123456789" {...field} />
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
                )}

                {/* Paso 2: Domicilio */}
                {currentStep === 2 && (
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
                              {provincias.map((provincia) => (
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
                          <FormControl>
                            <Input placeholder="Ingrese el distrito" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Paso 3: Formación */}
                {currentStep === 3 && (
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
                )}

                {/* Paso 4: Situación Laboral */}
                {currentStep === 4 && (
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
                )}

                {/* Paso 5: Documentos */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <label htmlFor="documentos" className="cursor-pointer">
                            <Button type="button" variant="outline" asChild>
                              <span>
                                <Upload className="w-4 h-4 mr-2" />
                                Subir Documentos
                              </span>
                            </Button>
                          </label>
                          <input
                            id="documentos"
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <p className="mt-2 text-sm text-gray-600">
                            Formatos: PDF, JPG, PNG (máx. 5MB cada uno)
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Documentos cargados:</h4>
                        {uploadedFiles.length === 0 ? (
                          <p className="text-gray-500 text-sm">Ningún documento cargado</p>
                        ) : (
                          uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                              <span className="text-sm truncate">{file.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                              >
                                ×
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Puede cargar títulos académicos, certificados, foto tipo carnet y otros documentos relevantes.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Paso 6: Confirmación */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Revise toda la información antes de enviar su solicitud.
                      </AlertDescription>
                    </Alert>

                    <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                      <h3 className="font-semibold text-lg">Resumen de la Solicitud</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Nombre:</span> {watchedValues.nombre} {watchedValues.apellidos}
                        </div>
                        <div>
                          <span className="font-medium">Nacionalidad:</span> {watchedValues.nacionalidad}
                        </div>
                        <div>
                          <span className="font-medium">Área Profesional:</span> {watchedValues.area_profesional}
                        </div>
                        <div>
                          <span className="font-medium">Categoría de Titulación:</span> {watchedValues.categoria_titulacion}
                        </div>
                        <div>
                          <span className="font-medium">Situación Laboral:</span> {watchedValues.situacion_laboral}
                        </div>
                        {watchedValues.situacion_laboral === 'Activo' && (
                          <div>
                            <span className="font-medium">Centro de Trabajo:</span> {watchedValues.nombre_centro}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Documentos:</span> {uploadedFiles.length} archivo(s)
                        </div>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="acepta_politicas"
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
                              Acepto las políticas de privacidad y términos de uso *
                            </FormLabel>
                            <p className="text-sm text-gray-600">
                              Al marcar esta casilla, confirmo que he leído y acepto las políticas de tratamiento de datos personales.
                            </p>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Anterior
              </Button>

              {currentStep < steps.length ? (
                <Button type="button" onClick={nextStep}>
                  Siguiente
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Enviando..." : "Enviar Solicitud"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ProfessionalRegistration;
