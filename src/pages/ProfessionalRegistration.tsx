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
    categoria_institucion_1: z.string().optional(),
    institucion_formacion_id_1: z.string().optional(),
    periodo_formacion: z
      .string()
      .min(1, "El período de formaci��n es requerido"),
    pais_formacion_1: z.string().min(1, "El país de formación es requerido"),
    situacion_laboral: z.string().min(1, "La situación laboral es requerida"),
    nombre_centro: z.string().min(1, "El centro de trabajo es requerido"),
    centro_salud_id: z.string().optional(), // ID del centro seleccionado
    categoria_centro: z.string().min(1, "La categoría del centro es requerida"),
    tipo_sector: z.string().min(1, "El tipo de sector es requerido"),
    distrito_sanitario: z.string().optional(),
    funcion_publica: z.boolean().default(false), // Nueva categorización
    funcionario_estatus: z.enum(['nombrado','no_nombrado']).optional(),
    numero_funcionario: z.string().optional(),
    fecha_nombramiento: z.string().optional(),
    fecha_inicio_trabajo: z.string().optional(),
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

    if (data.funcion_publica) {
      if (!data.funcionario_estatus) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Seleccione el tipo de funcionario", path: ["funcionario_estatus"] });
      } else if (data.funcionario_estatus === 'nombrado') {
        if (!data.numero_funcionario || !data.numero_funcionario.trim()) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ingrese su número de funcionario", path: ["numero_funcionario"] });
        }
        if (!data.fecha_nombramiento) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Seleccione la fecha de nombramiento", path: ["fecha_nombramiento"] });
        }
      } else if (data.funcionario_estatus === 'no_nombrado') {
        if (!data.fecha_inicio_trabajo) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Seleccione la fecha de inicio de trabajo", path: ["fecha_inicio_trabajo"] });
        }
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
      telefono: "+240",
      funcionario_estatus: undefined,
      numero_funcionario: "",
      fecha_nombramiento: "",
      fecha_inicio_trabajo: "",
      categoria_institucion_1: "",
      institucion_formacion_id_1: "",
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

  // Normalización de número de teléfono a formato E.164 para Guinea Ecuatorial
  const normalizeTelefono = (tel: string): string => {
    if (!tel) return "";
    let v = tel.replace(/\s|-/g, "");
    if (v.startsWith("+240")) return v;
    if (v.startsWith("00240")) return "+" + v.slice(2);
    if (v.startsWith("240")) return "+" + v;
    if (v.startsWith("+")) return v;
    v = v.replace(/^0+/, "");
    return "+240" + v;
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

      // Asegurar relación con institución de formación
      let institucionFormacionId: string | null = null;
      if (data.institucion_1 && data.pais_formacion_1) {
        const { data: existing, error: findErr } = await supabase
          .from('instituciones_formacion')
          .select('id, categoria')
          .eq('nombre', data.institucion_1.trim())
          .eq('pais', data.pais_formacion_1.trim())
          .maybeSingle();
        if (findErr) console.warn('find institucion error', findErr);
        if (existing?.id) {
          institucionFormacionId = existing.id;
        } else {
          const { data: created, error: createErr } = await supabase
            .from('instituciones_formacion')
            .insert([{ nombre: data.institucion_1.trim(), pais: data.pais_formacion_1.trim(), categoria: (data as any).categoria_institucion_1 || 'OTRA' }])
            .select('id')
            .single();
          if (!createErr) institucionFormacionId = created?.id || null;
        }
      }

      // Calcular edad
      const birthDate = new Date(data.fecha_nacimiento);
      const age = new Date().getFullYear() - birthDate.getFullYear();

      // Eliminamos la generación de codigoBarras en el frontend
      // const codigoBarras = `GEQ${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Preparar lista de documentos (se suben después de crear el profesional con su ID real)
      let documentosUrls: string[] = [];

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
        telefono: normalizeTelefono(data.telefono),
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
        centro_salud_id: data.centro_salud_id || null, // Añadir ID del centro
        categoria_centro: data.categoria_centro || null,
        tipo_sector: data.tipo_sector || null,
        distrito_sanitario: data.distrito_sanitario || null,
        funcion_publica: data.funcion_publica || false, // Nueva categorización
        estatus_funcionario: data.funcion_publica ? (data.funcionario_estatus || null) : null,
        numero_funcionario: data.funcion_publica && data.funcionario_estatus === 'nombrado' ? (data.numero_funcionario || null) : null,
        fecha_nombramiento: data.funcion_publica && data.funcionario_estatus === 'nombrado' ? (data.fecha_nombramiento || null) : null,
        fecha_inicio_trabajo: data.funcion_publica && data.funcionario_estatus === 'no_nombrado' ? (data.fecha_inicio_trabajo || null) : null,
        pertenece_brigada_medica: data.pertenece_brigada_medica,
        tipo_cooperacion: data.tipo_cooperacion || null,
        // URLs de documentos adicionales subidos al bucket
        documentos_adicionales: documentosUrls, // URLs de los documentos subidos
        foto_carnet: fotoUrl, // URL de la foto subida
        institucion_formacion_id_1: institucionFormacionId,
        // Eliminamos codigo_barras de la inserción inicial, ya que usaremos codigo_expediente de la DB
        estado_solicitud: "Recibido" as const,
        fecha_solicitud: new Date().toISOString().split("T")[0],
      };

      console.log("Datos a enviar a Supabase:", submissionData);

      const { data: result, error } = await supabase
        .from("profesionales_sanitarios")
        .insert([submissionData])
        .select("id, codigo_expediente, url_codigo_barras_expediente")
        .single();

      if (error) {
        console.error("Error de Supabase:", error);
        throw new Error(`Error de base de datos: ${error.message}`);
      }

      console.log("Resultado exitoso de Supabase:", result);

      // Subir documentos adicionales ahora que tenemos el ID real del profesional
      if (uploadedFiles.length > 0 && result?.id) {
        try {
          const formDataDocs = new FormData();
          formDataDocs.append("professional_id", result.id);
          uploadedFiles.forEach((file) => {
            formDataDocs.append("documentos_adicionales[]", file);
          });

          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData.session?.access_token;

          if (accessToken) {
            const resp = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-documentos-adicionales`,
              {
                method: "POST",
                headers: { Authorization: `Bearer ${accessToken}` },
                body: formDataDocs,
              },
            );

            if (!resp.ok) {
              const t = await resp.text();
              throw new Error(`Error al subir documentos: ${t}`);
            }

            const json = await resp.json();
            if (json?.success && Array.isArray(json.updated_record?.documentos_adicionales)) {
              documentosUrls = json.updated_record.documentos_adicionales as string[];
            }
          } else {
            // Fallback sin sesión: subir directamente a Storage y actualizar el registro
            const uploaded: string[] = [];
            for (const file of uploadedFiles) {
              const fileName = `${Date.now()}_${file.name}`;
              const filePath = `documentos-adicionales/${result.id}/${fileName}`;
              const { data: up, error: upErr } = await supabase.storage
                .from('documentos-profesionales')
                .upload(filePath, file, { cacheControl: '3600', upsert: false, contentType: file.type });
              if (upErr) throw upErr;
              const { data: pub } = supabase.storage
                .from('documentos-profesionales')
                .getPublicUrl(up.path);
              uploaded.push(pub.publicUrl);
            }
            if (uploaded.length > 0) {
              const { data: current } = await supabase
                .from('profesionales_sanitarios')
                .select('documentos_adicionales')
                .eq('id', result.id)
                .single();
              const combined = [ ...(current?.documentos_adicionales || []), ...uploaded ];
              const { error: updErr } = await supabase
                .from('profesionales_sanitarios')
                .update({ documentos_adicionales: combined })
                .eq('id', result.id);
              if (updErr) throw updErr;
              documentosUrls = combined;
            }
          }
        } catch (e: any) {
          console.error("Error subiendo documentos tras crear profesional:", e);
          toast({
            title: "Aviso",
            description: "El registro fue exitoso, pero los documentos adicionales no se pudieron subir.",
            variant: "default",
          });
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
        JSON.stringify(form.formState.errors, null, 2),
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
        return <AddressStep form={form} watchedValues={watchedValues} />;
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
