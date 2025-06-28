
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  professional_id: string;
  message: string;
  phone_number: string;
  notification_type: 'renewal_30_days' | 'renewal_10_days' | 'expired';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method === 'POST') {
      // Programar notificación manual
      const { professional_id, message, phone_number, notification_type }: NotificationRequest = await req.json();
      
      // Aquí iría la lógica para enviar SMS (integración con servicio SMS)
      console.log('Sending SMS notification:', {
        to: phone_number,
        message: message,
        type: notification_type
      });

      // Registrar la notificación en la base de datos
      const { error } = await supabase.from('notification_log').insert({
        professional_id,
        notification_type,
        message,
        phone_number,
        sent_at: new Date().toISOString(),
        status: 'sent'
      });

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (req.method === 'GET') {
      // Verificar vencimientos automáticamente
      console.log('Checking for upcoming renewals...');
      
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      
      const tenDaysFromNow = new Date();
      tenDaysFromNow.setDate(today.getDate() + 10);

      // Buscar carnets que vencen en 30 días
      const { data: renewals30Days, error: error30 } = await supabase
        .from('profesionales_sanitarios')
        .select('id, nombre_completo, telefono, fecha_validez_carnet')
        .eq('fecha_validez_carnet', thirtyDaysFromNow.toISOString().split('T')[0])
        .not('telefono', 'is', null);

      // Buscar carnets que vencen en 10 días
      const { data: renewals10Days, error: error10 } = await supabase
        .from('profesionales_sanitarios')
        .select('id, nombre_completo, telefono, fecha_validez_carnet')
        .eq('fecha_validez_carnet', tenDaysFromNow.toISOString().split('T')[0])
        .not('telefono', 'is', null);

      // Procesar notificaciones de 30 días
      if (renewals30Days && renewals30Days.length > 0) {
        for (const professional of renewals30Days) {
          const message = `Estimado/a ${professional.nombre_completo}, su carnet profesional vence el ${professional.fecha_validez_carnet}. Por favor, inicie el proceso de renovación.`;
          
          // Aquí iría la lógica de envío de SMS
          console.log('30-day renewal notification:', {
            to: professional.telefono,
            message: message
          });

          // Registrar notificación
          await supabase.from('notification_log').insert({
            professional_id: professional.id,
            notification_type: 'renewal_30_days',
            message,
            phone_number: professional.telefono,
            sent_at: new Date().toISOString(),
            status: 'sent'
          });
        }
      }

      // Procesar notificaciones de 10 días
      if (renewals10Days && renewals10Days.length > 0) {
        for (const professional of renewals10Days) {
          const message = `URGENTE: ${professional.nombre_completo}, su carnet profesional vence en 10 días (${professional.fecha_validez_carnet}). Renueve inmediatamente.`;
          
          // Aquí iría la lógica de envío de SMS
          console.log('10-day renewal notification:', {
            to: professional.telefono,
            message: message
          });

          // Registrar notificación
          await supabase.from('notification_log').insert({
            professional_id: professional.id,
            notification_type: 'renewal_10_days',
            message,
            phone_number: professional.telefono,
            sent_at: new Date().toISOString(),
            status: 'sent'
          });
        }
      }

      return new Response(JSON.stringify({ 
        processed: {
          thirty_day_notifications: renewals30Days?.length || 0,
          ten_day_notifications: renewals10Days?.length || 0
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  } catch (error) {
    console.error('Error in notification scheduler:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};

serve(handler);
