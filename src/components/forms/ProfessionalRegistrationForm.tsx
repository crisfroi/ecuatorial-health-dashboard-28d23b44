
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Upload, User, MapPin, GraduationCap, Briefcase } from 'lucide-react';
import { useCrearProfesional } from '@/hooks/useProfesionalesMutations';
import { toast } from 'sonner';

const formSchema = z.object({
  // Datos personales
  nombre_completo: z.string().min(1, 'Nombre completo es requerido'),
  fecha_nacimiento: z.string().optional(),
  genero: z.enum(['MASCULINO', 'FEMENINO']),
  nacionalidad: z.string().min(1, 'Nacionalidad es requerida'),
  numero_dip: z.string().optional(),
  numero_pasaporte: z.string().optional(),
  telefono: z.string().optional(),
  
  // Domicilio
  domicilio: z.string().optional(),
  provincia: z.string().optional(),
  distrito: z.string().optional(),
  distrito_sanitario: z.string().optional(),
  
  // Formación
  area_profesional: z.string().min(1, 'Área profesional es requerida'),
  especialidad: z.string().optional(),
  titulacion_especifica_1: z.string().optional(),
  institucion_1: z.string().optional(),
  año_graduacion: z.number().optional(),
  
  // Situación laboral
  nombre_centro: z.string().optional(),
  categoria_centro: z.string().optional(),
  tipo_sector: z.enum(['Público', 'Privado']).optional(),
  puesto_responsabilidad: z.string().optional(),
  
  // Cooperación (condicional)
  pertenece_brigada_medica: z.boolean().optional(),
  tipo_cooperacion: z.string().optional(),
  
  // Políticas
  acepta_politicas: z.boolean().refine(val => val === true, 'Debe aceptar las políticas')
});

type FormData = z.infer<typeof formSchema>;

const ProfessionalRegistrationForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    domicilio: false,
    formacion: false,
    laboral: false,
    documentos: false
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      genero: 'MASCULINO',
      nacionalidad: 'Guinea Ecuatorial',
      pertenece_brigada_medica: false,
      acepta_politicas: false
    }
  });

  const createProfessional = useCrearProfesional();
  const watchedNationality = form.watch('nacionalidad');
  const isFromGuineaEcuatorial = watchedNationality === 'Guinea Ecuatorial';

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Determinar el número de documento según lo que esté lleno
      let numero_documento = '';
      let tipo_documento = '';
      
      if (data.numero_dip) {
        numero_documento = data.numero_dip;
        tipo_documento = 'DIP';
      } else if (data.numero_pasaporte) {
        numero_documento = data.numero_pasaporte;
        tipo_documento = 'PASAPORTE';
      }

      const professionalData = {
        ...data,
        numero_documento,
        tipo_documento,
        estado_solicitud: 'Pendiente',
        fecha_solicitud: new Date().toISOString().split('T')[0],
        edad: data.fecha_nacimiento ? new Date().getFullYear() - new Date(data.fecha_nacimiento).getFullYear() : undefined
      };

      await createProfessional.mutateAsync(professionalData);
      toast.success('Solicitud enviada correctamente. Recibirá una notificación cuando sea procesada.');
      form.reset();
    } catch (error) {
      console.error('Error creating professional:', error);
      toast.error('Error al enviar la solicitud. Por favor, inténtelo de nuevo.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Registro de Profesional Sanitario
          </CardTitle>
          <p className="text-center text-gray-600">
            Complete todos los campos requeridos para procesar su solicitud
          </p>
        </CardHeader>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Datos Personales */}
          <Card>
            <Collapsible 
              open={expandedSections.personal} 
              onOpenChange={() => toggleSection('personal')}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <User className="w-5 h-5 text-blue-600" />
                      <span>Datos Personales</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.personal ? 'rotate-180' : ''}`} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nombre_completo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre Completo *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre y apellidos completos" {...field} />
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
                          <FormLabel>Género *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
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
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Guinea Ecuatorial">Guinea Ecuatorial</SelectItem>
                              <SelectItem value="Cuba">Cuba</SelectItem>
                              <SelectItem value="España">España</SelectItem>
                              <SelectItem value="Camerún">Camerún</SelectItem>
                              <SelectItem value="Gabón">Gabón</SelectItem>
                              <SelectItem value="Otra">Otra</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {isFromGuineaEcuatorial ? (
                      <FormField
                        control={form.control}
                        name="numero_dip"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número DIP</FormLabel>
                            <FormControl>
                              <Input placeholder="Documento de Identidad Personal" {...field} />
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
                              <Input placeholder="Número de pasaporte" {...field} />
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
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <Input placeholder="+240 XXX XXX XXX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {!isFromGuineaEcuatorial && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
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

                      {form.watch('pertenece_brigada_medica') && (
                        <FormField
                          control={form.control}
                          name="tipo_cooperacion"
                          render={({ field }) => (
                            <FormItem className="mt-3">
                              <FormLabel>Tipo de Cooperación</FormLabel>
                              <FormControl>
                                <Input placeholder="Ej: Brigada Médica Cubana" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Domicilio */}
          <Card>
            <Collapsible 
              open={expandedSections.domicilio} 
              onOpenChange={() => toggleSection('domicilio')}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-green-600" />
                      <span>Domicilio</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.domicilio ? 'rotate-180' : ''}`} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="domicilio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección Completa</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Dirección completa de residencia" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="provincia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Provincia</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar provincia" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Bioko Norte">Bioko Norte</SelectItem>
                              <SelectItem value="Bioko Sur">Bioko Sur</SelectItem>
                              <SelectItem value="Litoral">Litoral</SelectItem>
                              <SelectItem value="Centro Sur">Centro Sur</SelectItem>
                              <SelectItem value="Kié-Ntem">Kié-Ntem</SelectItem>
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
                          <FormLabel>Distrito</FormLabel>
                          <FormControl>
                            <Input placeholder="Distrito" {...field} />
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
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar distrito sanitario" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Malabo">Malabo</SelectItem>
                              <SelectItem value="Bata">Bata</SelectItem>
                              <SelectItem value="Ebebiyin">Ebebiyin</SelectItem>
                              <SelectItem value="Mongomo">Mongomo</SelectItem>
                              <SelectItem value="Evinayong">Evinayong</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Formación */}
          <Card>
            <Collapsible 
              open={expandedSections.formacion} 
              onOpenChange={() => toggleSection('formacion')}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <GraduationCap className="w-5 h-5 text-purple-600" />
                      <span>Formación Académica</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.formacion ? 'rotate-180' : ''}`} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="area_profesional"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Área Profesional *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar área" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Medicina">Medicina</SelectItem>
                              <SelectItem value="Enfermería">Enfermería</SelectItem>
                              <SelectItem value="Farmacia">Farmacia</SelectItem>
                              <SelectItem value="Odontología">Odontología</SelectItem>
                              <SelectItem value="Laboratorio">Análisis Clínicos</SelectItem>
                              <SelectItem value="Fisioterapia">Fisioterapia</SelectItem>
                              <SelectItem value="Nutrición">Nutrición</SelectItem>
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
                            <Input placeholder="Especialidad médica" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="titulacion_especifica_1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Titulación Principal</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Licenciatura en Medicina" {...field} />
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
                          <FormLabel>Institución</FormLabel>
                          <FormControl>
                            <Input placeholder="Universidad o institución" {...field} />
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
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Situación Laboral */}
          <Card>
            <Collapsible 
              open={expandedSections.laboral} 
              onOpenChange={() => toggleSection('laboral')}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <Briefcase className="w-5 h-5 text-orange-600" />
                      <span>Situación Laboral</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.laboral ? 'rotate-180' : ''}`} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nombre_centro"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Centro de Trabajo</FormLabel>
                          <FormControl>
                            <Input placeholder="Hospital, clínica o centro de salud" {...field} />
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
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar categoría" />
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
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar sector" />
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
                          <FormLabel>Puesto de Responsabilidad</FormLabel>
                          <FormControl>
                            <Input placeholder="Cargo o posición" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Documentos */}
          <Card>
            <Collapsible 
              open={expandedSections.documentos} 
              onOpenChange={() => toggleSection('documentos')}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <Upload className="w-5 h-5 text-red-600" />
                      <span>Documentos y Políticas</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.documentos ? 'rotate-180' : ''}`} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Foto Carnet
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Clic para subir foto carnet</p>
                        <Input type="file" accept="image/*" className="hidden" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Títulos Académicos
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Clic para subir títulos</p>
                        <Input type="file" accept=".pdf,.jpg,.png" multiple className="hidden" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
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
                            <FormLabel className="text-sm">
                              Acepto las políticas de privacidad y términos de uso del sistema de registro de profesionales sanitarios de Guinea Ecuatorial. *
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormMessage />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          <div className="flex justify-center">
            <Button 
              type="submit" 
              size="lg"
              disabled={createProfessional.isPending}
              className="px-8"
            >
              {createProfessional.isPending ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ProfessionalRegistrationForm;
