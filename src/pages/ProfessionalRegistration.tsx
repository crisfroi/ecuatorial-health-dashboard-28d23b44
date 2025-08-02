import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import {
  User,
  Home,
  GraduationCap,
  Briefcase,
  FileText,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useNacionalidades } from "@/hooks/useNacionalidades";
import { useDistritosSanitarios } from "@/hooks/useDistritosSanitarios";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useCenterSync } from "@/hooks/useCenterSync";

// Importaciones de los componentes de paso (asumimos que existen en estas rutas)
import { PersonalInfoStep } from "@/components/registration/PersonalInfoStep";
import { AddressStep } from "@/components/registration/AddressStep";
import { EducationStep } from "@/components/registration/EducationStep";
import { WorkSituationStep } from "@/components/registration/WorkSituationStep";
import { DocumentsStep } from "@/components/registration/DocumentsStep";
import ConfirmationStep from "@/components/registration/ConfirmationStep";
import { RegistrationProgress } from "@/components/registration/RegistrationProgress";
import PDFSummary from "@/components/registration/PDFSummary";
import PoliticasModal from "@/components/registration/PoliticasModal";
import ProcedureModal from "@/components/registration/ProcedureModal";

// Esquema de validación con Zod
const formSchema = z
  .object({
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
    categoria_titulacion: z
      .string()
      .min(1, "La categoría de titulación es requerida"),
    titulacion_especifica_1: z.string().min(1, "La titulación es requerida"),
    institucion_1: z.string().min(1, "La institución es requerida"),
    periodo_formacion: z
      .string()
      .min(1, "El período de formaci��n es requerido"),
    pais_formacion_1: z.string().min(1, "El país de formación es requerido"),
    situacion_laboral: z.string().min(1, "La situación laboral es requerida"),
    nombre_centro: z.string().min(1, "El centro de trabajo es requerido"),
    categoria_centro: z.string().min(1, "La categoría del centro es requerida"),
    tipo_sector: z.string().min(1, "El tipo de sector es requerido"),
    distrito_sanitario: z.string().optional(),
    pertenece_brigada_medica: z.boolean().default(false),
    tipo_cooperacion: z.string().optional(),

    // Validaciones para foto_carnet (un solo archivo FileList)
    foto_carnet: z
      .any()
      .refine(
        (files: FileList | undefined) => files && files.length > 0,
        "La foto de carnet es obligatoria.",
      )
      .refine(
        (files: FileList | undefined) => files?.[0]?.size <= 2 * 1024 * 1024,
        `La foto debe ser menor de 2MB.`,
      )
      .refine(
        (files: FileList | undefined) =>
          files &&
          ["image/jpeg", "image/jpg", "image/png"].includes(files[0]?.type),
        "Formato de foto no válido (solo JPG/PNG).",
      ),

    // Campo 'documentos' renombrado a 'documentos_adicionales' y validaciones para File[]
    documentos_adicionales: z
      .any()
      .refine((files: File[] | undefined) => {
        if (!files || files.length === 0) return true; // Es opcional
        return files.every((file: File) => file.size <= 5 * 1024 * 1024);
      }, `Cada documento debe ser menor de 5MB.`)
      .refine((files: File[] | undefined) => {
        if (!files || files.length === 0) return true; // Es opcional
        return files.every((file: File) =>
          ["application/pdf", "image/jpeg", "image/jpg", "image/png"].includes(
            file.type,
          ),
        );
      }, "Formato de documento no válido (solo PDF, JPG, PNG).")
      .optional(),

    acepta_politicas: z
      .boolean()
      .refine((val) => val === true, "Debe aceptar las políticas"),
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

// Definición de los pasos del formulario
const steps = [
  { id: 1, title: "Datos Personales", icon: User },
  { id: 2, title: "Domicilio", icon: Home },
  { id: 3, title: "Formación", icon: GraduationCap },
  { id: 4, title: "Situación Laboral", icon: Briefcase },
  { id: 5, title: "Documentos", icon: FileText },
  { id: 6, title: "Confirmación", icon: CheckCircle },
];

// Campos a validar por cada paso
const stepFields: { [key: number]: (keyof FormData)[] } = {
  1: [
    "nombre",
    "apellidos",
    "genero",
    "fecha_nacimiento",
    "nacionalidad",
    "numero_dip",
    "numero_pasaporte",
    "telefono",
  ],
  2: ["domicilio", "provincia", "distrito"],
  3: [
    "area_profesional",
    "categoria_titulacion",
    "titulacion_especifica_1",
    "institucion_1",
    "periodo_formacion",
    "pais_formacion_1",
    "especialidad",
  ],
  4: [
    "situacion_laboral",
    "nombre_centro",
    "categoria_centro",
    "tipo_sector",
    "distrito_sanitario",
    "tipo_cooperacion",
    "pertenece_brigada_medica",
  ],
  5: ["foto_carnet", "documentos_adicionales", "acepta_politicas"],
  6: [],
};

const ProfessionalRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]); // Estado para documentos adicionales
  const [photoFile, setPhotoFile] = useState<File | null>(null); // Estado para foto de carnet
  const [fotoCarnetBase64, setFotoCarnetBase64] = useState<string | null>(null); // Base64 para previsualización de foto
  const [formDataForPDF, setFormDataForPDF] = useState<any>(null); // Datos para el resumen PDF
  const [showPoliticasModal, setShowPoliticasModal] = React.useState(false);
  const [showProcedureModal, setShowProcedureModal] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string>("");

  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: nacionalidades = [] } = useNacionalidades();
  const { data: distritosSanitarios = [] } = useDistritosSanitarios();
  const { uploadFile, uploadPDF, isUploading } = useFileUpload(); // Mantener useFileUpload si se usa para el PDF final
  const { syncCenterFromProfessional, updateProfessionalCenterMutation } =
    useCenterSync();

  console.log(
    "Distritos sanitarios en ProfessionalRegistration:",
    distritosSanitarios,
  );

  // Inicialización del formulario con react-hook-form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pertenece_brigada_medica: false,
      acepta_politicas: false,
      situacion_laboral: "Activo",
      nacionalidad: "Ecuatoguineana",
    },
  });

  const watchedValues = form.watch(); // Observa todos los valores del formulario

  // Manejador para la carga de documentos adicionales
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles((prev) => [...prev, ...files]);
    // Sincroniza con react-hook-form
    form.setValue("documentos_adicionales", [
      ...(form.getValues("documentos_adicionales") || []),
      ...files,
    ]);
  };

  // Manejador para eliminar un documento adicional
  const removeFile = (index: number) => {
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updatedFiles);
    // Sincroniza con react-hook-form
    form.setValue("documentos_adicionales", updatedFiles);
  };

  // Manejador para la carga de la foto de carnet
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPhotoFile(null);
      setFotoCarnetBase64(null);
      form.setValue("foto_carnet", undefined); // Sincroniza con react-hook-form
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFotoCarnetBase64(base64);
    };
    reader.readAsDataURL(file);
    form.setValue("foto_carnet", [file]); // Sincroniza con react-hook-form (FileList)
  };

  // Manejador para eliminar la foto de carnet
  const removePhoto = () => {
    setPhotoFile(null);
    setFotoCarnetBase64(null);
    form.setValue("foto_carnet", undefined); // Sincroniza con react-hook-form
  };

  // Función principal de envío del formulario
  const onSubmit = async (data: FormData) => {
    console.log("onSubmit llamado con datos:", data);

    if (solicitudEnviada) {
      toast({
        title: "Solicitud ya enviada",
        description:
          "Esta solicitud ya ha sido enviada. No puede enviar duplicados.",
        variant: "destructive",
      });
      return;
    }

    if (!photoFile) {
      setErrorEnvio(
        "La foto tipo carnet es obligatoria para enviar la solicitud.",
      );
      toast({
        title: "Requisito Faltante",
        description:
          "Por favor, suba su foto tipo carnet para enviar la solicitud.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    setErrorEnvio("");

    try {
      console.log("Iniciando proceso de envío de formulario...");

      // Subir foto a Supabase Storage (flujo original del usuario)
      const fotoUrl = await uploadFile(photoFile!, "fotos-carnet");
      if (!fotoUrl) {
        throw new Error("Error al subir la foto");
      }

      // Calcular edad
      const birthDate = new Date(data.fecha_nacimiento);
      const age = new Date().getFullYear() - birthDate.getFullYear();

      // Eliminamos la generación de codigoBarras en el frontend
      // const codigoBarras = `GEQ${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Subir documentos adicionales al bucket usando la Edge Function
      let documentosUrls: string[] = [];
      if (uploadedFiles.length > 0) {
        try {
          const formData = new FormData();
          // Agregamos un ID temporal para crear la estructura de carpetas
          const temporalId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          formData.append("profesional_id", temporalId);

          uploadedFiles.forEach((file) => {
            formData.append("documentos_adicionales[]", file);
          });

          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-documentos-adicionales`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
              body: formData,
            },
          );

          if (response.ok) {
            const result = await response.json();
            if (result.success && result.uploaded_urls) {
              documentosUrls = result.uploaded_urls;
              console.log("Documentos adicionales subidos exitosamente:", documentosUrls);
            }
          } else {
            console.warn("Error al subir documentos adicionales:", await response.text());
          }
        } catch (uploadError) {
          console.error("Error uploading additional documents:", uploadError);
          // No fallar el registro si la subida de documentos falla
          toast({
            title: "Aviso",
            description: "El registro fue exitoso, pero algunos documentos adicionales no se pudieron subir.",
            variant: "default",
          });
        }
      }

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
        // URLs de documentos adicionales subidos al bucket
        documentos_adicionales: documentosUrls, // URLs de los documentos subidos
        foto_carnet: fotoUrl, // URL de la foto subida
        // Eliminamos codigo_barras de la inserción inicial, ya que usaremos codigo_expediente de la DB
        estado_solicitud: "Recibido" as const,
        fecha_solicitud: new Date().toISOString().split("T")[0],
      };

      console.log("Datos a enviar a Supabase:", submissionData);

      const { data: result, error } = await supabase
        .from("profesionales_sanitarios")
        .insert([submissionData])
        .select("id, codigo_expediente", "url_codigo_barras_expediente") // CAMBIO: Aseguramos la selección de codigo_expediente
        .single();

      if (error) {
        console.error("Error de Supabase:", error);
        throw new Error(`Error de base de datos: ${error.message}`);
      }

      console.log("Resultado exitoso de Supabase:", result);

      // Si se subieron documentos con ID temporal, actualizar las rutas con el ID real
      if (documentosUrls.length > 0 && result.id) {
        try {
          const temporalId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          // Aquí deberíamos mover los archivos de la carpeta temporal a la carpeta del profesional real
          // Por simplicidad, vamos a actualizar solo el registro de la BD
          const { error: updateDocsError } = await supabase
            .from("profesionales_sanitarios")
            .update({
              documentos_adicionales: documentosUrls,
              updated_at: new Date().toISOString()
            })
            .eq("id", result.id);

          if (updateDocsError) {
            console.error("Error updating documents after registration:", updateDocsError);
          } else {
            console.log("Documentos adicionales vinculados al profesional:", result.id);
          }
        } catch (docUpdateError) {
          console.error("Error updating document paths:", docUpdateError);
        }
      }

      // Sync center data if professional is active
      if (data.situacion_laboral === "Activo" && data.nombre_centro) {
        try {
          const centerId = await syncCenterFromProfessional({
            nombre_centro: data.nombre_centro,
            categoria_centro: data.categoria_centro,
            distrito_sanitario: data.distrito_sanitario,
            tipo_sector: data.tipo_sector,
            provincia: data.provincia,
            distrito: data.distrito,
            professional_id: result.id,
          });

          // Update professional with center ID if center was found/created
          if (centerId) {
            await updateProfessionalCenterMutation.mutateAsync({
              professionalId: result.id,
              centerId: centerId,
            });
            console.log("Professional linked to center:", centerId);
          }
        } catch (centerError) {
          console.error("Error syncing center data:", centerError);
          // Don't fail the registration if center sync fails
          toast({
            title: "Aviso",
            description:
              "El registro fue exitoso, pero hubo un problema al sincronizar los datos del centro.",
            variant: "default",
          });
        }
      }

      // Marcar solicitud como enviada
      setSolicitudEnviada(true);

      // Actualizar el estado interno con los datos para el PDF
      setFormDataForPDF({
        ...data,
        photoFile,
        foto_carnet: fotoUrl,
        foto_carnet_base64: fotoCarnetBase64,
        url_codigo_barras_expediente: result.url_codigo_barras_expediente, // CAMBIO: Usamos el codigo_expediente de la DB
        codigo_expediente: result.codigo_expediente, // Mantenemos para claridad
        edad: age,
        submittedData: result,
      });

      toast({
        title: "¡Solicitud enviada exitosamente!",
        description: `Su solicitud ha sido registrada con código: ${result.codigo_expediente}`,
      });
      setShowProcedureModal(true);

      setCurrentStep(6); // Ir al step de confirmación
    } catch (error: any) {
      console.error("Error completo al enviar formulario:", error);
      const errorMessage =
        error.message || "Error desconocido al procesar la solicitud";
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

    // Si no hay campos definidos para el paso actual, simplemente avanza
    if (!fieldsToValidate || fieldsToValidate.length === 0) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
      return;
    }

    // Valida solo los campos del paso actual
    const isValid = await form.trigger(fieldsToValidate as any);

    if (isValid) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      toast({
        title: "Campos incompletos o incorrectos",
        description:
          "Por favor, complete correctamente todos los campos obligatorios del paso actual antes de avanzar.",
        variant: "destructive",
      });
      console.error(
        "Errores de validación al avanzar de paso:",
        form.formState.errors,
      );
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
            formData={
              formDataForPDF || {
                ...watchedValues,
                foto_carnet_base64: fotoCarnetBase64,
              }
            }
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
                  {React.createElement(steps[currentStep - 1].icon, {
                    className: "w-5 h-5 text-blue-600",
                  })}
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
                  {isSubmitting
                    ? "Enviando..."
                    : solicitudEnviada
                      ? "Solicitud Enviada"
                      : "Enviar Solicitud"}
                </Button>
              )}
            </div>
          </form>
        </Form>

        <PoliticasModal
          open={showPoliticasModal}
          onClose={() => setShowPoliticasModal(false)}
        />
        <ProcedureModal
          isOpen={showProcedureModal}
          onClose={() => setShowProcedureModal(false)}
        />
      </div>
    </div>
  );
};

export default ProfessionalRegistration;
