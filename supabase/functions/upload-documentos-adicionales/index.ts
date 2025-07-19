import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Configuración de CORS para permitir solicitudes desde tu frontend
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Maneja las solicitudes OPTIONS para CORS
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

    // Inicializa el cliente Supabase con la clave anónima y el token de autorización del usuario
    // El token de autorización permite que la función actúe en nombre del usuario autenticado.
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      },
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

    const uploadedDocumentsUrls: string[] = []; // Para almacenar las URLs de los documentos subidos
    const results: any[] = []; // Para resultados detallados de cada archivo

    // formData.getAll('documentos_adicionales[]') recogerá todos los archivos con ese nombre de campo
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

    for (const fileValue of docFiles) {
      if (fileValue instanceof File) {
        const file = fileValue;

        if (file.size === 0) {
          results.push({
            name: file.name,
            status: "error",
            error: "File is empty",
          });
          continue;
        }

        const fileExtension =
          file.name.split(".").pop()?.toLowerCase() || "bin";

        // Generar un nombre único y ruta para el Storage
        // La ruta será: bucket_name/profesionales/profesionalId/documentos_adicionales/nombre_unico.ext
        const uniqueFileName = `${profesionalId}_doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;
        const filePath = `profesionales/${profesionalId}/documentos_adicionales/${uniqueFileName}`;

        let contentType = file.type;
        if (!contentType || contentType === "application/octet-stream") {
          // Intenta inferir el tipo de contenido si no se proporciona o es genérico
          if (fileExtension === "pdf") contentType = "application/pdf";
          else if (["jpg", "jpeg"].includes(fileExtension))
            contentType = "image/jpeg";
          else if (fileExtension === "png") contentType = "image/png";
          else if (fileExtension === "doc") contentType = "application/msword";
          else if (fileExtension === "docx")
            contentType =
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }

        const arrayBuffer = await file.arrayBuffer();
        const fileContent = new Uint8Array(arrayBuffer);

        // Subir el archivo al bucket 'documentos-profesionales' en Supabase Storage
        const { data: uploadData, error: uploadError } =
          await supabaseClient.storage
            .from("documentos-profesionales") // Nombre del bucket con guiones medios
            .upload(filePath, fileContent, {
              contentType,
              upsert: true, // Permite sobrescribir si el archivo ya existe (útil para re-subidas)
            });

        if (uploadError) {
          console.error(
            `Error uploading additional document ${file.name}:`,
            uploadError,
          );
          results.push({
            name: file.name,
            status: "error",
            error: uploadError.message,
          });
          continue;
        }

        // Obtener la URL pública del archivo subido
        const {
          data: { publicUrl },
        } = supabaseClient.storage
          .from("documentos-profesionales") // Nombre del bucket con guiones medios
          .getPublicUrl(filePath);

        uploadedDocumentsUrls.push(publicUrl); // Añadir a la lista de URLs de documentos adicionales

        results.push({
          name: file.name,
          size: file.size,
          type: contentType,
          path: filePath,
          url: publicUrl,
          status: "success",
        });
      }
    }

    // --- Actualizar el registro existente en la base de datos con las URLs de los documentos adicionales ---
    // Se asume que el registro del profesional ya existe en 'profesionales_sanitarios'
    // y que 'id' es la clave primaria.

    // Primero obtenemos los documentos existentes para no sobrescribirlos
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
    const existingDocs = existingData?.documentos_adicionales || [];
    const allDocuments = [...existingDocs, ...uploadedDocumentsUrls];

    const { data: dbUpdateData, error: updateError } = await supabaseClient
      .from("profesionales_sanitarios")
      .update({
        documentos_adicionales: allDocuments,
      }) // Actualiza solo esta columna
      .eq("id", profesionalId) // Usa el ID del profesional para encontrar el registro
      .select() // Para obtener el registro actualizado en la respuesta
      .single();

    if (updateError) {
      console.error(
        "Error updating profesionales_sanitarios with additional documents:",
        updateError,
      );
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

    // Devolver respuesta exitosa con las URLs de los documentos subidos
    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Documentos adicionales subidos y registro actualizado correctamente.",
        profesional_id: profesionalId,
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
  } catch (error) {
    console.error("Error processing request for additional documents:", error);
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
