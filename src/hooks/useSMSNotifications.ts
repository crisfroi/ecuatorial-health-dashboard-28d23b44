
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

export function useNotificationCount(profesionalId?: string) {
  return useQuery({
    queryKey: ['notification-count', profesionalId],
    queryFn: async () => {
      if (!profesionalId) return null;

      const { data, error } = await supabase
        .from('sms_notifications_log')
        .select('id, created_at')
        .eq('profesional_id', profesionalId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notification count:', error);
        throw error;
      }

      return {
        total_notificaciones: data?.length || 0,
        ultima_notificacion: data?.[0]?.created_at
      };
    },
    enabled: !!profesionalId,
  });
}

export function useSendSMSNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      profesionalId,
      telefono,
      tipoNotificacion,
      mensaje
    }: {
      profesionalId: string;
      telefono: string;
      tipoNotificacion: string;
      mensaje: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('send-sms-notification', {
        body: {
          profesionalId,
          telefono,
          tipoNotificacion,
          mensaje
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries to refresh the data
      queryClient.invalidateQueries({
        queryKey: ['sms-notifications', variables.profesionalId]
      });
      queryClient.invalidateQueries({
        queryKey: ['notification-count', variables.profesionalId]
      });
    }
  });
}
