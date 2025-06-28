
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Upload, FileText, User } from 'lucide-react';
import { useCrearProfesional } from '@/hooks/useProfesionalesMutations';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const registrationSchema = z.object({
  // Datos personales
  nombre_completo: z.string().min(1, 'El nombre completo es requerido'),
  nombre: z.string().optional(),
  apellidos: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  genero: z.enum(['MASCULINO', 'FEMENINO', 'M', 'F']).optional(),
  nacionalidad: z.string().min(1, 'La nacionalidad es requerida'),
  
  // Documentación
  numero_dip: z.string().optional(),
  numero_pasaporte: z.string().optional(),
  telefono: z.string().min(1, 'El teléfono es requerido'),
  
  // Cooperación internacional
  pertenece_brigada_medica: z.boolean().default(false),
  tipo_cooperacion: z.string().optional(),
  brigada_cooperacion: z.string().optional(),
  
  // Domicilio
  domicilio: z.string().optional(),
  provincia: z.string().min(1, 'La provincia es requerida'),
  distrito: z.string().min(1, 'El distrito es requerido'),
  distrito_sanitario: z.string().optional(),
  
  // Información profesional
  area_profesional: z.string().min(1, 'El área profesional es requerida'),
  especialidad: z.string().optional(),
  nombre_centro: z.string().optional(),
  categoria_centro: z.string().optional(),
  tipo_sector: z.enum(['Público', 'Privado']).optional(),
  puesto_responsabilidad: z.string().optional(),
  
  // Formación académica
  titulacion_especifica_1: z.string().min(1, 'La titulación principal es requerida'),
  tipo_formacion_1: z.string().optional(),
  institucion_1: z.string().optional(),
  periodo_formacion_1: z.string().optional(),
  pais_formacion_1: z.string().optional(),
  año_graduacion: z.number().optional(),
  
  titulacion_especifica_2: z.string().optional(),
  tipo_formacion_2: z.string().optional(),
  institucion_2: z.string().optional(),
  periodo_formacion_2: z.string().optional(),
  pais_formacion_2: z.string().optional(),
  
  titulo_adjunto_1: z.string().optional(),
  titulo_adjunto_2: z.string().optional(),
  
  // Situación laboral
  estado_trabajo: z.string().optional(),
  año_inicio_paro: z.number().optional(),
  meses_en_paro: z.number().default(0),
  
  // Aceptación de políticas
  acepta_politicas: z.boolean().refine(val => val === true, 'Debe aceptar las políticas'),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

const ProfessionalRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const createProfessional = useCrearProfesional();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      pertenece_brigada_medica: false,
      meses_en_paro: 0,
      acepta_politicas: false,
    },
  });

  const watchedNationalidad = form.watch('nacionalidad');
  const watchedBrigadaMedica = form.watch('pertenece_brigada_medica');
  const isGuineaEcuatorial = watchedNationalidad === 'Guinea Ecuatorial';

  const onSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true);
    try {
      await createProfessional.mutateAsync({
        ...data,
        estado_solicitud: 'Pendiente',
        fecha_solicitud: new Date().toISOString().split('T')[0],
      });

      toast({
        title: "Registro exitoso",
        description: "Su solicitud ha sido enviada y está pendiente de revisión.",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error al registrar:', error);
      toast({
        title: "Error",
        description: "No se pudo completar el registro. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: 'Datos Personales', icon: User },
    { number: 2, title: 'Domicilio', icon: User },
    { number: 3, title: 'Formación Académica', icon: FileText },
    { number: 4, title: 'Situación Laboral', icon: FileText },
    { number: 5, title: 'Documentos y Confirmación', icon: Upload },
  ];

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Registro de Profesional Sanitario
          </h1>
          <p className="text-gray-600">
            Complete el formulario para solicitar su carnet profesional
          </p>
        </div>

        {/* Indicador de pasos */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.number 
                      ? 'bg-guinea-teal border-guinea-teal text-white' 
                      : 'border-gray-300 text-gray-500'
                  }`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 ml-4 ${
                      currentStep > step.number ? 'bg-guinea-teal' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Paso {currentStep} de {steps.length}: {steps[currentStep - 1].title}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <steps[currentStep - 1].icon className="w-5 h-5 text-guinea-teal" />
                  <span>{steps[currentStep - 1].title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Paso 1: Datos Personales */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="nombre_completo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre Completo *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ingrese su nombre completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fecha_nacimiento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha de Nacimiento</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
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
                            <FormLabel>Género</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione su género" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="MASCULINO">Masculino</SelectItem>
                                <SelectItem value="FEMENINO">Femenino</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="nacionalidad"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nacionalidad *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione su nacionalidad" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Guinea Ecuatorial">Guinea Ecuatorial</SelectItem>
                                <SelectItem value="España">España</SelectItem>
                                <SelectItem value="Cuba">Cuba</SelectItem>
                                <SelectItem value="Argentina">Argentina</SelectItem>
                                <SelectItem value="Colombia">Colombia</SelectItem>
                                <SelectItem value="México">México</SelectItem>
                                <SelectItem value="Otra">Otra</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="telefono"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono *</FormLabel>
                            <FormControl>
                              <Input placeholder="+240 222 123 456" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Documentación</h3>
                      
                      {isGuineaEcuatorial ? (
                        <FormField
                          control={form.control}
                          name="numero_dip"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número de DIP</FormLabel>
                              <FormControl>
                                <Input placeholder="Ingrese su número de DIP" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
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
                    </div>

                    {!isGuineaEcuatorial && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Cooperación Internacional</h3>
                          
                          <FormField
                            control={form.control}
                            name="pertenece_brigada_medica"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
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

                          {watchedBrigadaMedica && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="tipo_cooperacion"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Tipo de Cooperación</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Ej: Brigada Médica Cubana" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="brigada_cooperacion"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nombre de la Brigada</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Nombre específico de la brigada" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Paso 2: Domicilio */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="domicilio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección de Domicilio</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Ingrese su dirección completa"
                              className="resize-none" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <SelectItem value="Bioko Norte">Bioko Norte</SelectItem>
                                <SelectItem value="Bioko Sur">Bioko Sur</SelectItem>
                                <SelectItem value="Annobón">Annobón</SelectItem>
                                <SelectItem value="Centro Sur">Centro Sur</SelectItem>
                                <SelectItem value="Kié-Ntem">Kié-Ntem</SelectItem>
                                <SelectItem value="Litoral">Litoral</SelectItem>
                                <SelectItem value="Wele-Nzas">Wele-Nzas</SelectItem>
                                <SelectItem value="Djibloho">Djibloho</SelectItem>
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

                      <FormField
                        control={form.control}
                        name="distrito_sanitario"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Distrito Sanitario</FormLabel>
                            <FormControl>
                              <Input placeholder="Distrito sanitario asignado" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Paso 3: Formación Académica */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Formación Principal</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="titulacion_especifica_1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Titulación *</FormLabel>
                              <FormControl>
                                <Input placeholder="Ej: Licenciatura en Medicina" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="tipo_formacion_1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Formación</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione el tipo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Pregrado">Pregrado</SelectItem>
                                  <SelectItem value="Postgrado">Postgrado</SelectItem>
                                  <SelectItem value="Especialización">Especialización</SelectItem>
                                  <SelectItem value="Maestría">Maestría</SelectItem>
                                  <SelectItem value="Doctorado">Doctorado</SelectItem>
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
                              <FormLabel>Institución</FormLabel>
                              <FormControl>
                                <Input placeholder="Nombre de la institución" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="año_graduacion"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Año de Graduación</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="2020"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="pais_formacion_1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>País de Formación</FormLabel>
                              <FormControl>
                                <Input placeholder="País donde se formó" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Formación Adicional (Opcional)</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="titulacion_especifica_2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Segunda Titulación</FormLabel>
                              <FormControl>
                                <Input placeholder="Ej: Especialización en Cardiología" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="tipo_formacion_2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Formación</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione el tipo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Pregrado">Pregrado</SelectItem>
                                  <SelectItem value="Postgrado">Postgrado</SelectItem>
                                  <SelectItem value="Especialización">Especialización</SelectItem>
                                  <SelectItem value="Maestría">Maestría</SelectItem>
                                  <SelectItem value="Doctorado">Doctorado</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="institucion_2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Institución</FormLabel>
                              <FormControl>
                                <Input placeholder="Nombre de la institución" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="pais_formacion_2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>País de Formación</FormLabel>
                              <FormControl>
                                <Input placeholder="País donde se formó" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Paso 4: Situación Laboral */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="area_profesional"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Área Profesional *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione su área" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="MEDICINA GENERAL">Medicina General</SelectItem>
                                <SelectItem value="ENFERMERÍA">Enfermería</SelectItem>
                                <SelectItem value="FARMACIA">Farmacia</SelectItem>
                                <SelectItem value="LABORATORIO">Laboratorio</SelectItem>
                                <SelectItem value="RADIOLOGÍA">Radiología</SelectItem>
                                <SelectItem value="ODONTOLOGÍA">Odontología</SelectItem>
                                <SelectItem value="NUTRICIÓN">Nutrición</SelectItem>
                                <SelectItem value="ESPECIALIDAD">Especialidad Médica</SelectItem>
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
                              <Input placeholder="Ej: Cardiología, Pediatría..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="nombre_centro"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Centro de Trabajo</FormLabel>
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
                            <FormLabel>Categoría del Centro</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione la categoría" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Hospital Nacional">Hospital Nacional</SelectItem>
                                <SelectItem value="Hospital Regional">Hospital Regional</SelectItem>
                                <SelectItem value="Centro de Salud">Centro de Salud</SelectItem>
                                <SelectItem value="Clínica Privada">Clínica Privada</SelectItem>
                                <SelectItem value="Consultorio">Consultorio</SelectItem>
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
                            <FormLabel>Sector</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione el sector" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Público">Público</SelectItem>
                                <SelectItem value="Privado">Privado</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="puesto_responsabilidad"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Puesto/Responsabilidad</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: Jefe de Servicio, Médico Residente..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Paso 5: Documentos y Confirmación */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Carga de Documentos</h3>
                      <p className="text-sm text-gray-600">
                        Los documentos se cargarán después del registro. Asegúrese de tener listos:
                      </p>
                      <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                        <li>Copia del DIP o Pasaporte</li>
                        <li>Títulos académicos y certificados</li>
                        <li>Fotografía para el carnet (3x4 cm)</li>
                        <li>Certificado de trabajo (si aplica)</li>
                      </ul>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Aceptación de Políticas</h3>
                      
                      <FormField
                        control={form.control}
                        name="acepta_politicas"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
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
                              <FormDescription>
                                Al marcar esta casilla, confirmo que he leído y acepto las políticas 
                                de tratamiento de datos personales del Ministerio de Sanidad y Bienestar Social.
                              </FormDescription>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Información Importante</h4>
                      <p className="text-sm text-blue-800">
                        Su solicitud será revisada por el comité técnico del Ministerio de Sanidad. 
                        Recibirá notificaciones sobre el estado de su solicitud por SMS al número proporcionado.
                        El proceso de revisión puede tomar entre 5-15 días hábiles.
                      </p>
                    </div>
                  </div>
                )}

                {/* Botones de navegación */}
                <div className="flex justify-between pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1 || isSubmitting}
                  >
                    Anterior
                  </Button>

                  {currentStep < steps.length ? (
                    <Button type="button" onClick={nextStep}>
                      Siguiente
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || !form.watch('acepta_politicas')}
                      className="bg-guinea-teal hover:bg-guinea-dark-teal"
                    >
                      {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ProfessionalRegistration;
