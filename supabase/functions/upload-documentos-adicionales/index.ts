import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificar autenticación
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      console.error('Error de autenticación:', authError)
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (req.method === 'POST') {
      const formData = await req.formData()
      const professionalId = formData.get('professional_id') as string
      
      if (!professionalId) {
        return new Response(
          JSON.stringify({ error: 'ID del profesional requerido' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const uploadedDocuments: string[] = []
      const errors: string[] = []

      // Procesar todos los archivos que vienen con el nombre 'documentos_adicionales[]'
      for (const [key, value] of formData.entries()) {
        if (key === 'documentos_adicionales[]' && value instanceof File) {
          try {
            const file = value as File
            const fileName = `${Date.now()}_${file.name}`
            const filePath = `documentos-adicionales/${professionalId}/${fileName}`

            console.log(`Subiendo archivo: ${fileName}`)

            // Convertir File a ArrayBuffer y luego a Uint8Array
            const arrayBuffer = await file.arrayBuffer()
            const uint8Array = new Uint8Array(arrayBuffer)

            // Subir archivo a Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('documentos-profesionales')
              .upload(filePath, uint8Array, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false
              })

            if (uploadError) {
              console.error(`Error subiendo ${fileName}:`, uploadError)
              errors.push(`Error subiendo ${fileName}: ${uploadError.message}`)
              continue
            }

            // Obtener URL pública
            const { data: { publicUrl } } = supabase.storage
              .from('documentos-profesionales')
              .getPublicUrl(uploadData.path)

            uploadedDocuments.push(publicUrl)
            console.log(`Archivo subido exitosamente: ${fileName}`)

          } catch (error) {
            console.error(`Error procesando archivo:`, error)
            errors.push(`Error procesando archivo: ${error.message}`)
          }
        }
      }

      if (uploadedDocuments.length === 0) {
        return new Response(
          JSON.stringify({ 
            error: 'No se pudieron subir los documentos', 
            details: errors 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Actualizar el registro del profesional con las URLs de los documentos
      try {
        // Primero obtener los documentos existentes
        const { data: currentRecord, error: fetchError } = await supabase
          .from('profesionales_sanitarios')
          .select('documentos_adicionales')
          .eq('id', professionalId)
          .single()

        if (fetchError) {
          console.error('Error obteniendo registro actual:', fetchError)
          return new Response(
            JSON.stringify({ error: 'Error obteniendo registro actual' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Combinar documentos existentes con los nuevos
        const existingDocs = currentRecord?.documentos_adicionales || []
        const allDocuments = [...existingDocs, ...uploadedDocuments]

        // Actualizar el registro
        const { data: updatedRecord, error: updateError } = await supabase
          .from('profesionales_sanitarios')
          .update({ 
            documentos_adicionales: allDocuments,
            updated_at: new Date().toISOString()
          })
          .eq('id', professionalId)
          .select()
          .single()

        if (updateError) {
          console.error('Error actualizando registro:', updateError)
          return new Response(
            JSON.stringify({ error: 'Error actualizando registro en la base de datos' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        return new Response(
          JSON.stringify({ 
            success: true,
            uploaded_documents: uploadedDocuments,
            total_documents: allDocuments.length,
            updated_record: updatedRecord,
            errors: errors.length > 0 ? errors : undefined
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      } catch (error) {
        console.error('Error actualizando base de datos:', error)
        return new Response(
          JSON.stringify({ error: 'Error actualizando la base de datos' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Método no permitido' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error general:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})