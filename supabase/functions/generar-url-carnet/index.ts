import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { professional_id } = await req.json();

    if (!professional_id) {
      throw new Error("Professional ID is required");
    }

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Get professional data
    const { data: professional, error: fetchError } = await supabase
      .from("profesionales_sanitarios")
      .select("*")
      .eq("id", professional_id)
      .single();

    if (fetchError || !professional) {
      throw new Error(`Professional not found: ${fetchError?.message}`);
    }

    // Generate URLs based on the professional's data
    const baseUrl = supabaseUrl;
    const urls = {
      url_codigo_barras: professional.codigo_barras
        ? `${baseUrl}/storage/v1/object/public/carnets/barcode_${professional.id}.png`
        : null,
      url_pdf: `${baseUrl}/storage/v1/object/public/carnets/carnet_${professional.id}.pdf`,
      url_codigo_barras_expediente: professional.codigo_expediente
        ? `${baseUrl}/storage/v1/object/public/expedientes/barcode_${professional.codigo_expediente}.png`
        : null,
    };

    // Update the professional record with generated URLs
    const { data: updated, error: updateError } = await supabase
      .from("profesionales_sanitarios")
      .update(urls)
      .eq("id", professional_id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update URLs: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        urls,
        professional: updated,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in generar-url-carnet function:", error);
    return new Response(
      JSON.stringify({
        error: "Error generating carnet URLs",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
