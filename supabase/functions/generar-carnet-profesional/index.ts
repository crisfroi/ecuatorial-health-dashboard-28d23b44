import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

// Configuración de CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    if (req.method !== 'GET') {
      return new Response('Método no permitido', {
        status: 405,
        headers: corsHeaders
      });
    }

    const url = new URL(req.url);
    const idProfesional = url.searchParams.get('id');

    if (!idProfesional) {
      return new Response('Parámetro "id" es requerido', {
        status: 400,
        headers: corsHeaders
      });
    }

    console.log(`Generando carnet para profesional ID: ${idProfesional}`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    );

    // Verificar si ya existe un carnet generado
    const { data: carnetExistente, error: errorCarnetExistente } = await supabaseAdmin
      .from('carnets_generados')
      .select('url_carnet, fecha_generacion')
      .eq('profesional_id', idProfesional)
      .single();

    if (carnetExistente) {
      console.log(`Carnet ya existe para profesional ${idProfesional}`);
      return new Response(JSON.stringify({
        success: true,
        message: 'Carnet ya fue generado previamente',
        url_carnet: carnetExistente.url_carnet,
        fecha_generacion: carnetExistente.fecha_generacion,
        profesional_id: idProfesional
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    const { data: profesional, error: errorProfesional } = await supabaseAdmin
      .from('profesionales_sanitarios')
      .select(`
        id,
        id_profesional_unico,
        nombre_completo,
        fecha_emision,
        fecha_caducidad,
        titulacion_especifica_1,
        categoria_titulacion,
        foto_carnet,
        url_codigo_barras
      `)
      .eq('id', idProfesional)
      .single();

    if (errorProfesional || !profesional) {
      console.error('Error al obtener datos del profesional:', errorProfesional);
      return new Response(JSON.stringify({
        error: 'Profesional no encontrado',
        details: errorProfesional?.message || 'No se encontró el profesional con el ID proporcionado'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    console.log('Datos del profesional obtenidos:', {
      id: profesional.id,
      id_profesional_unico: profesional.id_profesional_unico,
      nombre: profesional.nombre_completo,
      categoria: profesional.categoria_titulacion
    });

    // Verificar campos requeridos
    if (!profesional.id_profesional_unico) {
      return new Response(JSON.stringify({
        error: 'El profesional no tiene un ID profesional único asignado',
        profesional_id: idProfesional
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    if (!profesional.url_codigo_barras) {
      return new Response(JSON.stringify({
        error: 'El profesional no tiene código de barras generado',
        profesional_id: idProfesional
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    const categoria = (profesional.categoria_titulacion || 'general')
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    const rutaPlantilla = `plantillas-carnets/${categoria}.svg`;
    console.log(`Intentando obtener plantilla: ${rutaPlantilla}`);

    let plantillaData;
    const { data, error: errorPlantilla } = await supabaseAdmin.storage
      .from('carnets')
      .download(rutaPlantilla);

    if (errorPlantilla || !data) {
      console.error('Error al obtener plantilla SVG:', errorPlantilla);
      const { data: plantillaGeneralData, error: errorPlantillaGeneral } = await supabaseAdmin.storage
        .from('carnets')
        .download('plantillas-carnets/general.svg');

      if (errorPlantillaGeneral || !plantillaGeneralData) {
        return new Response(JSON.stringify({
          error: 'No se encontró ninguna plantilla válida',
          categoria: categoria,
          detalles: errorPlantilla?.message
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      plantillaData = plantillaGeneralData;
    } else {
      plantillaData = data;
    }

    const plantillaSVG = await plantillaData.text();

    // Procesar SVG con los datos del profesional
    const carnetSVG = await procesarSVGConReemplazo(plantillaSVG, profesional, supabaseAdmin);

    const nombreArchivo = `${profesional.nombre_completo.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}.svg`;
    const rutaCarnet = `carnets-generados/${nombreArchivo}`;

    console.log(`Guardando carnet en: ${rutaCarnet}`);

    const { error: errorGuardar } = await supabaseAdmin.storage
      .from('carnets')
      .upload(rutaCarnet, new Blob([carnetSVG], { type: 'image/svg+xml' }), {
        contentType: 'image/svg+xml',
        upsert: true
      });

    if (errorGuardar) {
      console.error('Error al guardar el carnet generado:', errorGuardar);
      return new Response(JSON.stringify({
        error: 'Error al guardar el carnet generado',
        details: errorGuardar.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    const { data: urlCarnet } = await supabaseAdmin.storage
      .from('carnets')
      .getPublicUrl(rutaCarnet);

    // Actualizar URL del carnet en el profesional
    const { error: errorActualizar } = await supabaseAdmin
      .from('profesionales_sanitarios')
      .update({ url_carnet: urlCarnet.publicUrl })
      .eq('id', idProfesional);

    if (errorActualizar) {
      console.error('Error al actualizar URL del carnet:', errorActualizar);
    }

    // Marcar carnet como generado para evitar duplicados
    const { data: marcadoExitoso, error: errorMarcar } = await supabaseAdmin.rpc('marcar_carnet_generado', {
      p_profesional_id: idProfesional,
      p_url_carnet: urlCarnet.publicUrl
    });

    if (errorMarcar) {
      console.error('Error al marcar carnet como generado:', errorMarcar);
    }

    await supabaseAdmin.from('logs_sistema').insert({
      accion: 'GENERACION_CARNET',
      descripcion: `Carnet generado exitosamente para profesional ID: ${idProfesional}`,
      error: false
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Carnet profesional generado correctamente',
      url_carnet: urlCarnet.publicUrl,
      profesional_id: idProfesional,
      svg_content: carnetSVG
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Error al generar carnet profesional:', error);

    try {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL'),
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      );
      await supabaseAdmin.from('logs_sistema').insert({
        accion: 'ERROR_GENERACION_CARNET',
        descripcion: `Error: ${error.message}`,
        error: true
      });
    } catch (logError) {
      console.error('Error al registrar log:', logError);
    }

    return new Response(JSON.stringify({
      error: 'Error al generar carnet profesional',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});

// Función para formatear fechas
function formatearFecha(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    console.error("Error al formatear fecha:", e);
    return isoString;
  }
}

// Helper para convertir ArrayBuffer a Base64
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for(let i = 0; i < len; i++){
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper para obtener imagen y convertir a Base64
async function getImageBase64(imageUrl, defaultMimeType) {
  if (!imageUrl) {
    console.warn(`URL de imagen vacía, no se puede obtener Base64.`);
    return '';
  }
  try {
    console.log(`Intentando obtener imagen para Base64: ${imageUrl}`);
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`Error al obtener imagen ${imageUrl}: ${response.status} - ${response.statusText}`);
      return '';
    }
    const arrayBuffer = await response.arrayBuffer();
    const mimeType = response.headers.get('Content-Type') || defaultMimeType;
    const base64 = arrayBufferToBase64(arrayBuffer);
    console.log(`Imagen obtenida y convertida a Base64. MIME: ${mimeType}`);
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error(`Error al procesar imagen ${imageUrl} a Base64: ${error.message}`);
    return '';
  }
}

// Función mejorada para procesar SVG con código de barras por categoría
async function procesarSVGConReemplazo(svgContent, profesional, supabaseClient) {
  console.log("Iniciando procesamiento del SVG por reemplazo de strings (incrustando imágenes en Base64).");
  let finalSvg = svgContent;

  // --- 1. Reemplazo de campos de texto ---
  finalSvg = finalSvg
    .replace(/{{NOMBRE_COMPLETO}}/gi, profesional.nombre_completo || '')
    .replace(/{{ID_PROFESIONAL}}/gi, profesional.id_profesional_unico || '')
    .replace(/{{TITULACION_ESPECIFICA}}/gi, profesional.titulacion_especifica_1 || '')
    .replace(/{{FECHA_EMISION}}/gi, formatearFecha(profesional.fecha_emision))
    .replace(/{{FECHA_CADUCIDAD}}/gi, formatearFecha(profesional.fecha_caducidad));

  console.log("Campos de texto actualizados.");

  // --- 2. Obtener color de la categoría de titulación ---
  let colorCategoria = '000000'; // Negro por defecto
  if (profesional.categoria_titulacion) {
    const { data: categoria, error: errorCategoria } = await supabaseClient
      .from('categorias_titulacion')
      .select('codigo_color')
      .eq('nombre', profesional.categoria_titulacion.toUpperCase())
      .single();

    if (!errorCategoria && categoria) {
      colorCategoria = categoria.codigo_color.replace('#', '');
      console.log(`Color de categoría obtenido: ${colorCategoria} para ${profesional.categoria_titulacion}`);
    } else {
      console.log(`No se encontró color para categoría: ${profesional.categoria_titulacion}, usando negro por defecto`);
    }
  }

  // --- 3. Preparar foto del carnet ---
  let photoUrlForFetch = '';
  if (profesional.foto_carnet && profesional.foto_carnet.startsWith('http')) {
    photoUrlForFetch = profesional.foto_carnet;
    console.log(`[LOG] FOTO_URL: URL de foto desde DB (directa): ${photoUrlForFetch}`);
  } else if (profesional.foto_carnet) {
    const { data: urlPublica, error: urlError } = await supabaseClient.storage
      .from('fotos-carnet')
      .getPublicUrl(profesional.foto_carnet);
    if (urlError) {
      console.error(`[ERROR] FOTO_URL: Error al obtener URL pública para foto_carnet: ${urlError.message}`);
      const { data: urlDefecto } = await supabaseClient.storage
        .from('fotos-carnet')
        .getPublicUrl('default/sin-foto.png');
      photoUrlForFetch = urlDefecto?.publicUrl || '';
    } else {
      photoUrlForFetch = urlPublica?.publicUrl || '';
      console.log(`[LOG] FOTO_URL: URL pública de foto obtenida: ${photoUrlForFetch}`);
    }
  } else {
    console.log(`[LOG] FOTO_URL: No hay foto, usando imagen por defecto.`);
    const { data: urlDefecto } = await supabaseClient.storage
      .from('fotos-carnet')
      .getPublicUrl('default/sin-foto.png');
    photoUrlForFetch = urlDefecto?.publicUrl || '';
  }

  const photoBase64 = await getImageBase64(photoUrlForFetch, 'image/jpeg');
  finalSvg = finalSvg.replace(/href="{{FOTO_URL}}"/gi, `href="${photoBase64}"`);
  console.log(`Placeholders de FOTO_URL reemplazados con Base64.`);

  // --- 4. Generar código de barras con color específico ---
  let barcodeImageUrlForFetch;
  if (profesional.url_codigo_barras && profesional.url_codigo_barras.startsWith('http')) {
    // Si ya tiene URL del código de barras, pero necesitamos actualizarla con el color correcto
    barcodeImageUrlForFetch = `${Deno.env.get('SUPABASE_URL')}/functions/v1/generar-codigo-barras?codigo=${profesional.id_profesional_unico.replace('-', '')}&color=${colorCategoria}&ancho=1011&alto=639`;
  } else {
    // Generar nueva URL con el color de la categoría
    barcodeImageUrlForFetch = `${Deno.env.get('SUPABASE_URL')}/functions/v1/generar-codigo-barras?codigo=${profesional.id_profesional_unico.replace('-', '')}&color=${colorCategoria}&ancho=1011&alto=639`;
  }

  console.log(`Generando código de barras con color ${colorCategoria}: ${barcodeImageUrlForFetch}`);

  const barcodeBase64 = await getImageBase64(barcodeImageUrlForFetch, 'image/png');
  finalSvg = finalSvg.replace(/href="{{CODIGO_BARRAS_PROFESIONAL}}"/gi, `href="${barcodeBase64}"`);
  console.log(`Placeholders de CODIGO_BARRAS_PROFESIONAL reemplazados con Base64.`);

  console.log("Procesamiento final del SVG completado.");
  return finalSvg;
}
