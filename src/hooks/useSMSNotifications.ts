
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SMSNotification {
  id: string;
  profesional_id: string;
  telefono: string;
  tipo_notificacion: string;
  fecha_envio: string;
  estado: string;
  mensaje_sid?: string;
}

export function useSMSNotifications(profesionalId?: string) {
  return useQuery({
    queryKey: ['sms-notifications', profesionalId],
    queryFn: async () => {
      let query = supabase
        .from('notificaciones_sms')
        .select('*')
        .order('fecha_envio', { ascending: false });

      if (profesionalId) {
        query = query.eq('profesional_id', profesionalId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profesionalId
  });
}

export function useNotificationCount(profesionalId?: string) {
  return useQuery({
    queryKey: ['notification-count', profesionalId],
    queryFn: async () => {
      if (!profesionalId) return null;

      const { data, error } = await supabase
        .rpc('get_notification_count', { p_profesional_id: profesionalId });
      
      if (error) throw error;
      return data?.[0] || {
        total_notificaciones: 0,
        notificaciones_30_dias: 0,
        notificaciones_10_dias: 0,
        ultima_notificacion: null
      };
    },
    enabled: !!profesionalId
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    }
  });
}

export function useCheckRenewalNotifications() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-renewal-notifications');
      if (error) throw error;
      return data;
    }
  });
}
