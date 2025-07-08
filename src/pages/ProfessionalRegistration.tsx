import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { User, Home, GraduationCap, Briefcase, FileText, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client'; // Tu cliente Supabase ya inicializado
import { useNavigate } from 'react-router-dom';
import { useNacionalidades } from '@/hooks/useNacionalidades';
import { useDistritosSanitarios } from '@/hooks/useDistritosSanitarios';
import { useFileUpload } from '@/hooks/useFileUpload'; // Tu hook useFileUpload existente
import { v4 as uuidv4 } from 'uuid'; // Importa uuid para generar IDs únicos

// Import step components
import { PersonalInfoStep } from '@/components/registration/PersonalInfoStep';
import { AddressStep } from '@/components/registration/AddressStep';
import { EducationStep } from '@/components/registration/EducationStep';
import { WorkSituationStep } from '@/components/registration/WorkSituationStep';
import { DocumentsStep } from '@/components/registration/DocumentsStep';
import ConfirmationStep from '@/components/registration/ConfirmationStep';
import { RegistrationProgress } from '@/components/registration/RegistrationProgress';
import PDFSummary from '@/components/registration/PDFSummary';
import PoliticasModal from '@/components/registration/PoliticasModal';
// ... otras importaciones
import HealthCenters from '@/components/dashboard/HealthCenters';
import UserRoleManagement from '@/components/dashboard/UserRoleManagement';
import ApplicationProcedureSection from '@/components/registration/ApplicationProcedureSection';
import ProcedureModal from '@/components/registration/ProcedureModal';

// Schema de validación
const formSchema = z.object({
  nombre: z.string().min(2, "El nombre es requerido"),
  apellidos: z.string().min(2, "Los apellidos son requeridos"),
  genero: z.string().min(1, "El género es requerido"),
  fecha_nacimiento: z.string().min(1, "La fecha de nacimiento es requerida"),
  nacionalidad: z.string().min(1, "Seleccione su nacionalidad"),
  numero_dip: z.string().optional(),
  numero_pasaporte: z.string().optional(),
  telefono: z.string().min(9, "El teléfono debe tener al menos 9 dígitos"),
  domicilio: z.string().min(2, "El domicilio es requerido"),
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
  
  // Definimos foto_carnet y documentos_adicionales como FileList o array de File
  foto_carnet: z.any() // Será un FileList de 1 elemento
    .refine((files) => files && files.length > 0, "La foto de carnet es obligatoria.")
    .refine((files) => files?.[0]?.size <= 2 * 1024 * 1024, `La foto debe ser menor de 2MB.`)
    .refine(
      (files) => ["image/jpeg", "image/jpg", "image/png"].includes(files?.[0]?.type),
      "Formato de foto no válido (solo JPG/PNG)."
    ),
  
  documentos_adicionales: z.any() // Será un FileList o un array de Files
    .refine((files) => files.every((file: File) => file.size <= 5 * 1024 * 1024), `Cada documento debe ser menor de 5MB.`)
    .refine(
      (files) => files.every((file: File) => ["application/pdf", "image/jpeg", "image/jpg", "image/png"].includes(file.type)),
      "Formato de documento no válido (solo PDF, JPG, PNG)."
    )
    .optional(),

  acepta_politicas: z.boolean().refine(val => val === true, "Debe aceptar las políticas")
})
.superRefine((data, ctx) => {
  if (!data.nacionalidad || data.nacionalidad.trim() === "") {
    return;
  }

  if (data.nacionalidad === "Ecuatoguineana") {
    if (!data.numero_dip || data.numero_dip.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Verifique su número de DIP",
        path: ["numero_dip"],
      });
    }
  } else {
    if (!data.numero_pasaporte || data.numero_pasaporte.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Verifique su número de Pasaporte.",
        path: ["numero_pasaporte"],
      });
    }
  }
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

const stepFields: { [key: number]: (keyof FormData)[] } = {
  1: ['nombre', 'apellidos', 'genero', 'fecha_nacimiento', 'nacionalidad', 'numero_dip', 'numero_pasaporte', 'telefono'],
  2: ['domicilio', 'provincia', 'distrito'],
  3: ['area_profesional', 'categoria_titulacion', 'titulacion_especifica_1', 'institucion_1', 'periodo_formacion', 'pais_formacion_1', 'especialidad'],
  4: ['situacion_laboral', 'nombre_centro', 'categoria_centro', 'tipo_sector', 'distrito_sanitario', 'tipo_cooperacion', 'pertenece_brigada_medica'],
  5: ['foto_carnet', 'documentos_adicionales', 'acepta_politicas'],
  6: []
};

const ProfessionalRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]); // Estado para previsualización de documentos adicionales
  const [photoFile, setPhotoFile] = useState<File | null>(null); // Estado para previsualización de foto
  const [fotoCarnetBase64, setFotoCarnetBase64] = useState<string | null>(null);
  const [formDataForPDF, setFormDataForPDF] = useState<any>(null);
  const [showPoliticasModal, setShowPoliticasModal] = React.useState(false);
  const [showProcedureModal, setShowProcedureModal] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string>('');
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: nacionalidades = [] } = useNacionalidades();
  const { data: distritosSanitarios = [] } = useDistritosSanitarios();
  const { uploadFile, uploadPDF, isUploading } = useFileUpload(); // Tu hook useFileUpload existente

  console.log('Distritos sanitarios en ProfessionalRegistration:', distritosSanitarios);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pertenece_brigada_medica: false,
      acepta_politicas: false,
      situacion_laboral: 'Activo',
      nacionalidad: "Ecuatoguineana",
    }
  });

  const watchedValues = form.watch();

  // Función para manejar la carga de documentos adicionales (actualiza estado local y react-hook-form)
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    // Asegurarse de que react-hook-form también tenga estos archivos
    form.setValue('documentos_adicionales', [...(form.getValues('documentos_adicionales') || []), ...files]);
  };

  // Función para eliminar un documento adicional (actualiza estado local y react-hook-form)
  const removeFile = (index: number) => {
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updatedFiles);
    // Asegurarse de que react-hook-form también se actualice
    form.setValue('documentos_adicionales', updatedFiles);
  };

  // Función para manejar la carga de la foto de carnet (lógica original)
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPhotoFile(null);
      setFotoCarnetBase64(null);
      form.setValue('foto_carnet', undefined); // Actualizar react-hook-form
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFotoCarnetBase64(base64);
    };
    reader.readAsDataURL(file);
    form.setValue('foto_carnet', [file]); // Actualizar react-hook-form
  };

  // Función para eliminar la foto de carnet (lógica original)
  const removePhoto = () => {
    setPhotoFile(null);
    setFotoCarnetBase64(null);
    form.setValue('foto_carnet', undefined); // Actualizar react-hook-form
  };

  const onSubmit = async (data: FormData) => {
    console.log('onSubmit called with data:', data);
    
    if (solicitudEnviada) {
      toast({
        title: "Solicitud ya enviada",
        description: "Esta solicitud ya ha sido enviada. No puede enviar duplicados.",
        variant: "destructive",
      });
      return;
    }

    if (!photoFile) {
      setErrorEnvio("La foto tipo carnet es obligatoria para enviar la solicitud.");
      toast({
        title: "Requisito Faltante",
        description: "Por favor, suba su foto tipo carnet para enviar la solicitud.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    setIsSubmitting(true);
    setErrorEnvio('');
    
    try {
      console.log('Iniciando proceso de envío de formulario y documentos...');
      
      // Generar un ID único para esta solicitud/profesional
      const profesionalId = uuidv4(); 

      // --- 1. Subir Foto de Carnet usando el hook useFileUpload (LÓGICA EXISTENTE) ---
      // La foto se sube primero y su URL se obtiene.
      const fotoUrl = await uploadFile(photoFile, `fotos-carnet/${profesionalId}`); // Ruta adaptada para organización
      if (!fotoUrl) {
        throw new Error('Error al subir la foto de carnet.');
      }
      console.log('Foto de carnet subida:', fotoUrl);

      // --- 2. Preparar los datos del formulario principal para la inserción en la DB ---
      // Estos son los datos que tu API ya inserta.
      const birthDate = new Date(data.fecha_nacimiento);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      const codigoBarras = `GEQ${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const submissionData = {
        id: profesionalId, // Usar el ID generado para la clave primaria
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
        // documentos_cargados: documentosData, // Esto se manejará por la Edge Function
        foto_carnet: fotoUrl, // URL de la foto ya subida
        codigo_barras: codigoBarras,
        estado_solicitud: 'Pendiente' as const,
        fecha_solicitud: new Date().toISOString().split('T')[0]
      };

      console.log('Datos a insertar en Supabase (registro principal):', submissionData);

      // --- 3. Insertar el registro principal en la base de datos (LÓGICA EXISTENTE) ---
      const { data: result, error } = await supabase
        .from('profesionales_sanitarios')
        .insert([submissionData])
        .select()
        .single();

      if (error) {
        console.error('Error de Supabase al insertar registro principal:', error);
        throw new Error(`Error de base de datos al guardar datos: ${error.message}`);
      }

      console.log('Resultado exitoso de inserción principal:', result);

      // --- 4. Enviar Documentos Adicionales a la NUEVA Función Edge ---
      // Esta función Edge se encargará de subir los archivos y actualizar el registro existente.
      if (uploadedFiles.length > 0) {
        const edgeFunctionDocsUrl = 'https://[TU-PROYECTO-ID].supabase.co/functions/v1/upload-additional-documents'; // ¡PON AQUÍ LA URL REAL DE TU NUEVA FUNCIÓN EDGE!
        
        const docsFormData = new FormData();
        docsFormData.append('profesional_id', profesionalId); // Pasar el ID del registro recién creado
        
        uploadedFiles.forEach((file, index) => {
          docsFormData.append(`documentos_adicionales[${index}]`, file);
        });

        const session = await supabase.auth.getSession();
        const accessToken = session.data.session?.access_token;

        if (!accessToken) {
          throw new Error('No se encontró token de autenticación de Supabase para documentos adicionales.');
        }

        const docsResponse = await fetch(edgeFunctionDocsUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: docsFormData, // Envía el objeto FormData con los documentos
        });

        if (!docsResponse.ok) {
          const docsErrorData = await docsResponse.json();
          console.error('Error al enviar documentos adicionales a la función Edge:', docsErrorData);
          // Decidir si quieres que esto sea un error fatal o solo un warning
          // Por ahora, lo lanzamos como error
          throw new Error(docsErrorData.message || `Error al subir documentos adicionales: ${docsResponse.statusText}`);
        }

        const docsResult = await docsResponse.json();
        console.log('Respuesta exitosa de la Función Edge para documentos adicionales:', docsResult);
        // Puedes actualizar formDataForPDF con las URLs de los documentos adicionales si las devuelve
        setFormDataForPDF(prev => ({
          ...prev,
          documentos_adicionales_urls: docsResult.uploaded_urls || uploadedFiles.map(f => f.name)
        }));
      } else {
        // Si no hay documentos adicionales, asegúrate de que el campo en la DB sea un array vacío
        const { error: updateDocsError } = await supabase
          .from('profesionales_sanitarios')
          .update({ documentos_adicionales: [] })
          .eq('id', profesionalId);
        if (updateDocsError) {
          console.error('Error al actualizar documentos_adicionales a vacío:', updateDocsError);
        }
      }

      // Marcar solicitud como enviada
      setSolicitudEnviada(true);

      // Actualizar el estado interno con los datos para el PDF
      setFormDataForPDF(prev => ({
        ...prev,
        photoFile,
        foto_carnet: fotoUrl,
        foto_carnet_base64: fotoCarnetBase64,
        codigo_barras: codigoBarras,
        codigo_expediente: result.codigo_expediente, // Usar el código de expediente de la inserción principal
        edad: age,
        submittedData: result // Guarda la respuesta completa de la inserción principal
      }));

      toast({
        title: "¡Solicitud enviada exitosamente!",
        description: `Su solicitud ha sido registrada con código: ${result.codigo_expediente}`,
      });
      setShowProcedureModal(true);

      setCurrentStep(6); // Ir al step de confirmación
    } catch (error: any) {
      console.error('Error completo al enviar formulario:', error);
      const errorMessage = error.message || 'Error desconocido al procesar la solicitud';
      setErrorEnvio(errorMessage);
      
      toast({
        title: "Error al enviar solicitud",
        description: errorMessage,
        variant: "destructive",
      });
      
      setCurrentStep(6); // Ir al step de confirmación para mostrar el error
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    const fieldsToValidate = stepFields[currentStep];

    if (!fieldsToValidate || fieldsToValidate.length === 0) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
      return;
    }

    const isValid = await form.trigger(fieldsToValidate as any);

    if (isValid) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      toast({
        title: "Campos incompletos o incorrectos",
        description: "Por favor, complete correctamente todos los campos obligatorios del paso actual antes de avanzar.",
        variant: "destructive",
      });
      console.error("Errores de validación al avanzar de paso:", form.formState.errors);
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
            setShowPoliticasModal={setShowPoliticasModal}
          />
        );
      case 6:
        return (
          <ConfirmationStep 
            formData={formDataForPDF || { ...watchedValues, foto_carnet_base64: fotoCarnetBase64 }}
            isSubmitting={isSubmitting}
            solicitudEnviada={solicitudEnviada}
            errorEnvio={errorEnvio}
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
                <Button 
                  type="submit" 
                  disabled={isSubmitting || solicitudEnviada}
                  className="bg-guinea-teal hover:bg-guinea-teal/90"
                >
                  {isSubmitting ? "Enviando..." : solicitudEnviada ? "Solicitud Enviada" : "Enviar Solicitud"}
                </Button>
              )}
            </div>
          </form>
        </Form>
        
        <PoliticasModal open={showPoliticasModal} onClose={() => setShowPoliticasModal(false)} />
        <ProcedureModal isOpen={showProcedureModal} onClose={() => setShowProcedureModal(false)}/>
      </div>
    </div>
  );
};

export default ProfessionalRegistration;
