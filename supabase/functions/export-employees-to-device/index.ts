import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportPayload {
  profesional_ids: string[];
  centro_salud_id: string;
  device_sns?: string[];
  solo_con_turno?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: ExportPayload = await req.json();
    const { profesional_ids, centro_salud_id, device_sns, solo_con_turno } = payload;

    console.log('📤 Exportando empleados:', {
      profesionales: profesional_ids.length,
      centro: centro_salud_id,
      dispositivos: device_sns?.length || 'todos',
    });

    // 1. Obtener datos de profesionales con ENNO
    const { data: empleadosData, error: empleadosError } = await supabaseClient
      .from('empleado_dispositivo_map')
      .select(`
        enroll_id,
        profesional_id,
        profesionales_sanitarios!inner(
          nombre_completo
        )
      `)
      .in('profesional_id', profesional_ids)
      .not('enroll_id', 'is', null);

    if (empleadosError) {
      throw new Error(`Error obteniendo empleados: ${empleadosError.message}`);
    }

    if (!empleadosData || empleadosData.length === 0) {
      throw new Error('No se encontraron empleados con ENNO válido');
    }

    // 2. Si solo_con_turno = true, filtrar por turnos
    let empleadosFinal = empleadosData;
    if (solo_con_turno) {
      const { data: turnosData } = await supabaseClient
        .from('horarios_base_profesional')
        .select('profesional_id')
        .in('profesional_id', profesional_ids);

      const profesionalesConTurno = new Set(turnosData?.map((t: any) => t.profesional_id) || []);
      empleadosFinal = empleadosData.filter((e: any) =>
        profesionalesConTurno.has(e.profesional_id)
      );
    }

    // 3. Obtener dispositivos del centro
    let dispositivosQuery = supabaseClient
      .from('dispositivos')
      .select('device_sn, nombre')
      .eq('centro_salud_id', centro_salud_id)
      .eq('activo', true)
      .not('device_sn', 'is', null);

    if (device_sns && device_sns.length > 0) {
      dispositivosQuery = dispositivosQuery.in('device_sn', device_sns);
    }

    const { data: dispositivosData, error: dispositivosError } = await dispositivosQuery;

    if (dispositivosError) {
      throw new Error(`Error obteniendo dispositivos: ${dispositivosError.message}`);
    }

    if (!dispositivosData || dispositivosData.length === 0) {
      throw new Error('No hay dispositivos activos en el centro');
    }

    // 4. Crear comandos en Render (machine_command)
    // NOTA: Aquí usamos URL de Render para insertar comandos
    const RENDER_DB_URL = Deno.env.get('RENDER_DB_URL');
    if (!RENDER_DB_URL) {
      throw new Error('RENDER_DB_URL no configurado');
    }

    const comandos = [];
    for (const empleado of empleadosFinal) {
      for (const dispositivo of dispositivosData) {
        const comando = {
          cmd: 'setuserinfo',
          enrollid: empleado.enroll_id,
          name: empleado.profesionales_sanitarios.nombre_completo,
          backupnum: 10, // 10=Huella, 11=Rostro (usar 10 por defecto)
          admin: 0,
          record: '', // Sin datos biométricos (solo nombre y ENNO)
        };

        comandos.push({
          name: 'setuserinfo',
          serial: dispositivo.device_sn,
          content: JSON.stringify(comando),
          status: 0,
          send_status: 0,
          err_count: 0,
          gmt_create: new Date().toISOString(),
          gmt_modified: new Date().toISOString(),
        });
      }
    }

    // 5. Insertar comandos en Render vía HTTP
    const response = await fetch(`${RENDER_DB_URL}/api/insert-commands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RENDER_API_KEY')}`,
      },
      body: JSON.stringify({ commands: comandos }),
    });

    if (!response.ok) {
      throw new Error(`Error insertando comandos en Render: ${response.statusText}`);
    }

    const result = await response.json();

    console.log('✅ Comandos insertados:', {
      total: comandos.length,
      empleados: empleadosFinal.length,
      dispositivos: dispositivosData.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `${comandos.length} comandos enviados`,
        comandos_enviados: comandos.length,
        detalle: {
          empleados: empleadosFinal.length,
          dispositivos: dispositivosData.length,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Error en export-employees-to-device:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error desconocido',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
