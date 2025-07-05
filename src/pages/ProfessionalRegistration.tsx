import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { User, Home, GraduationCap, Briefcase, FileText, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useNacionalidades } from '@/hooks/useNacionalidades';
import { useDistritosSanitarios } from '@/hooks/useDistritosSanitarios';

// Import step components
import { PersonalInfoStep } from '@/components/registration/PersonalInfoStep';
import { AddressStep } from '@/components/registration/AddressStep';
import { EducationStep } from '@/components/registration/EducationStep';
import { WorkSituationStep } from '@/components/registration/WorkSituationStep';
import { DocumentsStep } from '@/components/registration/DocumentsStep';
import ConfirmationStep from '@/components/registration/ConfirmationStep';
import { RegistrationProgress } from '@/components/registration/RegistrationProgress';
import PDFSummary from '@/components/registration/PDFSummary';

// Schema de validación
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

const ProfessionalRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [fotoCarnetBase64, setFotoCarnetBase64] = useState<string | null>(null);
  const [formDataForPDF, setFormDataForPDF] = useState<any>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: nacionalidades = [] } = useNacionalidades();
  const { data: distritosSanitarios = [] } = useDistritosSanitarios();

  console.log('Distritos sanitarios en ProfessionalRegistration:', distritosSanitarios);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pertenece_brigada_medica: false,
      acepta_politicas: false,
      situacion_laboral: 'Activo'
    }
  });

  const watchedValues = form.watch();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setPhotoFile(file);

  const reader = new FileReader();
  reader.onloadend = () => {
    const base64 = reader.result as string;
    setFotoCarnetBase64(base64);
  };
  reader.readAsDataURL(file);
  };


  const removePhoto = () => {
  setPhotoFile(null);
  setFotoCarnetBase64(null);
 };

  const onSubmit = async (data: FormData) => {
    if (!photoFile) {
      toast({
        title: "Error",
        description: "La foto tipo carnet es obligatoria.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Enviando formulario con datos:', data);
      
      // Subir foto a Supabase Storage
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fotos-carnet')
        .upload(filePath, photoFile);

      if (uploadError) {
        console.error('Error uploading photo:', uploadError);
        throw new Error('Error al subir la foto: ' + uploadError.message);
      }

      // Obtener URL pública de la foto
      const { data: { publicUrl } } = supabase.storage
        .from('fotos-carnet')
        .getPublicUrl(filePath);

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
        nombre_centro: data.nombre_centro || null,
        categoria_centro: data.categoria_centro || null,
        tipo_sector: data.tipo_sector || null,
        distrito_sanitario: data.distrito_sanitario || null,
        pertenece_brigada_medica: data.pertenece_brigada_medica,
        tipo_cooperacion: data.tipo_cooperacion || null,
        documentos_cargados: documentosData,
        foto_carnet: publicUrl,
        estado_solicitud: 'Pendiente' as const,
        fecha_solicitud: new Date().toISOString().split('T')[0]
      };

      console.log('Datos a enviar:', submissionData);

      const { data: result, error } = await supabase
        .from('profesionales_sanitarios')
        .insert([submissionData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Resultado exitoso:', result);

      // Actualizar el estado interno con los datos para el PDF
      setFormDataForPDF({
         ...data,
        photoFile,
        foto_carnet: publicUrl,
        foto_carnet_base64: fotoCarnetBase64,
        submittedData: result
      });

      
      toast({
        title: "Solicitud enviada exitosamente",
        description: "Su solicitud ha sido registrada y está pendiente de revisión.",
      });

      setCurrentStep(6); // Ir al step de confirmación en lugar de navegar
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: `Hubo un problema al enviar su solicitud: ${error.message}`,
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalInfoStep 
            form={form} 
            nacionalidades={nacionalidades} 
            watchedValues={watchedValues} 
          />
        );
      case 2:
        return <AddressStep form={form} />;
      case 3:
        return <EducationStep form={form} />;
      case 4:
        return (
          <WorkSituationStep 
            form={form} 
            watchedValues={watchedValues} 
            distritosSanitarios={distritosSanitarios} 
          />
        );
      case 5:
        return (
          <DocumentsStep 
            uploadedFiles={uploadedFiles}
            handleFileUpload={handleFileUpload}
            removeFile={removeFile}
            photoFile={photoFile}
            handlePhotoUpload={handlePhotoUpload}
            removePhoto={removePhoto}
            setFotoCarnetBase64={setFotoCarnetBase64}
          />
        );
      case 6:
        return (
          <ConfirmationStep 
            formData={{formDataForPDF || watchedValues}
            foto_carnet_base64: fotoCarnetBase64
            isSubmitting={isSubmitting}
            />
        );
      default:
        return null;
    }
  };

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

        <RegistrationProgress steps={steps} currentStep={currentStep} />

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
                {renderStepContent()}
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
