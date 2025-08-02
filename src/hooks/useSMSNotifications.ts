
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NotificacionSMS {
  id: string;
  profesional_id?: string;
  recipient_number: string;
  message_body: string;
  notification_type: string;
  status: string;
  twilio_sid?: string;
  error_message?: string;
  created_at: string;
}

export function useSMSNotifications(profesionalId?: string) {
  return useQuery({
    queryKey: ['sms-notifications', profesionalId],
    queryFn: async (): Promise<NotificacionSMS[]> => {
      let query = supabase
        .from('sms_notifications_log')
        .select('*')
        .order('created_at', { ascending: false });

      if (profesionalId) {
        query = query.eq('profesional_id', profesionalId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching SMS notifications:', error);
        throw error;
      }

      return data || [];
    },
    enabled: true,
  });
}
