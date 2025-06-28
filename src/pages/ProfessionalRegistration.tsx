import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Upload, User, Home, GraduationCap, Briefcase, FileText, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

// Schema de validación
const formSchema = z.object({
  nombre_completo: z.string().min(2, "El nombre completo es requerido"),
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
  titulacion_especifica_1: z.string().min(1, "La titulación es requerida"),
  institucion_1: z.string().min(1, "La institución es requerida"),
  año_graduacion: z.number().min(1950).max(new Date().getFullYear()),
  pais_formacion_1: z.string().min(1, "El país de formación es requerido"),
  nombre_centro: z.string().min(1, "El centro de trabajo es requerido"),
  categoria_centro: z.string().min(1, "La categoría del centro es requerida"),
  tipo_sector: z.string().min(1, "El tipo de sector es requerido"),
  pertenece_brigada_medica: z.boolean().default(false),
  tipo_cooperacion: z.string().optional(),
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

const nacionalidades = [
  "Ecuatoguineana",
  "Española",
  "Cubana",
  "Marroquí",
  "Camerunesa",
  "Gabonesa",
  "Nigeria",
  "Otra"
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

const ProfessionalRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pertenece_brigada_medica: false,
      acepta_politicas: false
    }
  });

  const watchedValues = form.watch();
  const isEcuatoguineana = watchedValues.nacionalidad === "Ecuatoguineana";

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Calcular edad
      const birthDate = new Date(data.fecha_nacimiento);
      const age = new Date().getFullYear() - birthDate.getFullYear();

      const submissionData = {
        ...data,
        edad: age,
        fecha_nacimiento: data.fecha_nacimiento,
        año_graduacion: data.año_graduacion,
        estado_solicitud: 'Pendiente',
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
                      name="nombre_completo"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
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
                        <FormItem>
                          <FormLabel>Nacionalidad *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione su nacionalidad" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {nacionalidades.map((nacionalidad) => (
                                <SelectItem key={nacionalidad} value={nacionalidad}>
                                  {nacionalidad}
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
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
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
                          <FormItem>
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
                      name="año_graduacion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Año de Graduación *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Ej: 2020" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                              <SelectItem value="Hospital Nacional">Hospital Nacional</SelectItem>
                              <SelectItem value="Hospital Regional">Hospital Regional</SelectItem>
                              <SelectItem value="Centro de Salud">Centro de Salud</SelectItem>
                              <SelectItem value="Puesto de Salud">Puesto de Salud</SelectItem>
                              <SelectItem value="Clínica Privada">Clínica Privada</SelectItem>
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
                  </div>
                )}

                {/* Paso 5: Documentos */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        La carga de documentos será habilitada próximamente. Por ahora, puede continuar con el registro.
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <Button variant="outline" disabled>
                            <Upload className="w-4 h-4 mr-2" />
                            Subir Títulos
                          </Button>
                          <p className="mt-2 text-sm text-gray-600">
                            Formatos: PDF, JPG, PNG (máx. 5MB)
                          </p>
                        </div>
                      </div>

                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <Button variant="outline" disabled>
                            <Upload className="w-4 h-4 mr-2" />
                            Foto Carnet
                          </Button>
                          <p className="mt-2 text-sm text-gray-600">
                            Formato: JPG, PNG (máx. 2MB)
                          </p>
                        </div>
                      </div>
                    </div>
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
                          <span className="font-medium">Nombre:</span> {watchedValues.nombre_completo}
                        </div>
                        <div>
                          <span className="font-medium">Nacionalidad:</span> {watchedValues.nacionalidad}
                        </div>
                        <div>
                          <span className="font-medium">Área Profesional:</span> {watchedValues.area_profesional}
                        </div>
                        <div>
                          <span className="font-medium">Centro de Trabajo:</span> {watchedValues.nombre_centro}
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
