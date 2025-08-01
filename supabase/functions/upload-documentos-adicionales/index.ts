import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function handleCors(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "Method not allowed",
        }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("multipart/form-data")) {
      return new Response(
        JSON.stringify({
          error: "Content-Type must be multipart/form-data",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: "Authorization header required",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    // Inicializar cliente Supabase con service role para operaciones de storage
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const formData = await req.formData();
    const profesionalId = formData.get("profesional_id");

    if (!profesionalId || typeof profesionalId !== "string") {
      return new Response(
        JSON.stringify({
          error: "profesional_id is required and must be a string",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    // Verificar que el profesional existe
    const { data: professional, error: professionalError } = await supabaseClient
      .from("profesionales_sanitarios")
      .select("id, nombre_completo")
      .eq("id", profesionalId)
      .single();

    if (professionalError || !professional) {
      return new Response(
        JSON.stringify({
          error: "Professional not found",
          details: professionalError?.message,
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    const uploadedDocumentsUrls: string[] = [];
    const results: any[] = [];

    // Obtener todos los archivos del formulario
    const docFiles = formData.getAll("documentos_adicionales[]");

    if (docFiles.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No se encontraron documentos adicionales para subir.",
          profesional_id: profesionalId,
          uploaded_urls: [],
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    // Validar tipos de archivo permitidos
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg", 
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const maxFileSize = 10 * 1024 * 1024; // 10MB

    for (const fileValue of docFiles) {
      if (fileValue instanceof File) {
        const file = fileValue;

        // Validaciones
        if (file.size === 0) {
          results.push({
            name: file.name,
            status: "error",
            error: "El archivo está vacío",
          });
          continue;
        }

        if (file.size > maxFileSize) {
          results.push({
            name: file.name,
            status: "error",
            error: "El archivo excede el tamaño máximo de 10MB",
          });
          continue;
        }

        if (!allowedTypes.includes(file.type)) {
          results.push({
            name: file.name,
            status: "error",
            error: "Tipo de archivo no permitido. Solo se permiten PDF, JPG, PNG, DOC y DOCX",
          });
          continue;
        }

        const fileExtension = file.name.split(".").pop()?.toLowerCase() || "bin";
        
        // Generar nombre único para evitar conflictos
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const uniqueFileName = `${timestamp}_${randomString}_${sanitizedFileName}`;
        
        // Estructura de carpetas: profesionales/{id}/documentos/{archivo}
        const filePath = `profesionales/${profesionalId}/documentos/${uniqueFileName}`;

        try {
          const arrayBuffer = await file.arrayBuffer();
          const fileContent = new Uint8Array(arrayBuffer);

          // Subir archivo al bucket 'documentos-profesionales'
          const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from("documentos-profesionales")
            .upload(filePath, fileContent, {
              contentType: file.type,
              upsert: false, // No sobrescribir archivos existentes
            });

          if (uploadError) {
            console.error(`Error uploading ${file.name}:`, uploadError);
            results.push({
              name: file.name,
              status: "error",
              error: uploadError.message,
            });
            continue;
          }

          // Obtener URL pública
          const { data: { publicUrl } } = supabaseClient.storage
            .from("documentos-profesionales")
            .getPublicUrl(filePath);

          uploadedDocumentsUrls.push(publicUrl);

          results.push({
            name: file.name,
            originalName: file.name,
            size: file.size,
            type: file.type,
            path: filePath,
            url: publicUrl,
            status: "success",
            uploadedAt: new Date().toISOString(),
          });

          console.log(`Successfully uploaded: ${file.name} -> ${publicUrl}`);

        } catch (uploadError) {
          console.error(`Error processing ${file.name}:`, uploadError);
          results.push({
            name: file.name,
            status: "error",
            error: `Error al procesar el archivo: ${uploadError.message}`,
          });
        }
      }
    }

    // Actualizar registro en la base de datos
    if (uploadedDocumentsUrls.length > 0) {
      // Obtener documentos existentes
      const { data: existingData, error: fetchError } = await supabaseClient
        .from("profesionales_sanitarios")
        .select("documentos_adicionales")
        .eq("id", profesionalId)
        .single();

      if (fetchError) {
        console.error("Error fetching existing documents:", fetchError);
        return new Response(
          JSON.stringify({
            error: "Error al obtener documentos existentes",
            details: fetchError.message,
            uploaded_urls: uploadedDocumentsUrls,
            results,
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          },
        );
      }

      // Combinar documentos existentes con los nuevos
      const existingDocs = Array.isArray(existingData?.documentos_adicionales) 
        ? existingData.documentos_adicionales 
        : [];
      const allDocuments = [...existingDocs, ...uploadedDocumentsUrls];

      // Actualizar registro
      const { data: dbUpdateData, error: updateError } = await supabaseClient
        .from("profesionales_sanitarios")
        .update({
          documentos_adicionales: allDocuments,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profesionalId)
        .select("documentos_adicionales")
        .single();

      if (updateError) {
        console.error("Error updating database:", updateError);
        return new Response(
          JSON.stringify({
            error: "Error al actualizar el registro con documentos adicionales",
            details: updateError.message,
            uploaded_urls: uploadedDocumentsUrls,
            results,
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          },
        );
      }

      // Respuesta exitosa
      return new Response(
        JSON.stringify({
          success: true,
          message: `${uploadedDocumentsUrls.length} documentos subidos correctamente.`,
          profesional_id: profesionalId,
          professional_name: professional.nombre_completo,
          uploaded_urls: uploadedDocumentsUrls,
          total_documents: allDocuments.length,
          results,
          updated_record: dbUpdateData,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    } else {
      // No se subió ningún archivo exitosamente
      const errorCount = results.filter(r => r.status === "error").length;
      return new Response(
        JSON.stringify({
          success: false,
          message: `No se pudo subir ningún documento. ${errorCount} errores encontrados.`,
          profesional_id: profesionalId,
          uploaded_urls: [],
          results,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

  } catch (error) {
    console.error("Error processing additional documents request:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error.message || JSON.stringify(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  }
});