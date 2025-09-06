import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserInvitation, UserProfile } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export const useUserManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const inviteUser = async (invitation: UserInvitation) => {
    setIsLoading(true);
    console.log('🚀 Starting user invitation process:', {
      email: invitation.email,
      role: invitation.role,
      full_name: invitation.full_name
    });
    
    try {
      // Validar datos básicos
      if (!invitation.email?.trim()) {
        throw new Error('Email es requerido');
      }
      if (!invitation.role) {
        throw new Error('Rol es requerido');
      }

      console.log('📧 Calling send-user-invitation function...');
      
      // Crear un timeout para evitar que se cuelgue
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: La función tardó más de 30 segundos')), 30000);
      });

      // Llamar a la función con timeout (usar POST y stringified body)
      const invitePromise = supabase.functions.invoke('send-user-invitation', {
        body: JSON.stringify({
          email: invitation.email.trim(),
          role: invitation.role,
          full_name: invitation.full_name?.trim(),
          department: invitation.department?.trim(),
          assigned_center_id: invitation.assigned_center_id,
          invited_by: invitation.invited_by
        }),
        method: 'POST'
      });

      console.log('⏱️ Waiting for function response (max 30s)...');

      try {
        const res = await Promise.race([invitePromise, timeoutPromise]) as any;

        // The Functions client can return different shapes; normalize
        const data = res?.data ?? res;
        const errorFromRes = res?.error ?? (res && !res?.success ? res : null);

        console.log('📨 Function response received:', {
          raw: res,
          data: data,
          error: errorFromRes,
        });

        if (errorFromRes) {
          console.error('❌ Supabase function returned error payload:', errorFromRes);
          throw errorFromRes;
        }

        if (data?.error || data?.success === false) {
          console.error('❌ Function returned error object:', data);
          throw data;
        }

        console.log('✅ Invitation sent successfully');

        toast({
          title: "✅ Invitación enviada",
          description: `Se ha enviado una invitación a ${invitation.email}`,
        });

        return { success: true, data };
      } catch (fnError: any) {
        // Mejorar la información del error para debugging
        console.error('❌ Supabase function error (detailed):', fnError);

        // Intentar extraer detalles útiles
        let detailedMessage = fnError?.message || String(fnError);

        // Si es un FunctionsHttpError con response, intentar leer el body
        try {
          if (fnError?.response && typeof fnError.response.text === 'function') {
            const text = await fnError.response.text();
            detailedMessage = `${detailedMessage} - ${text}`;
          } else if (fnError?.error) {
            detailedMessage = JSON.stringify(fnError.error);
          } else if (fnError?.data) {
            detailedMessage = JSON.stringify(fnError.data);
          }
        } catch (readErr) {
          console.warn('No se pudo leer body del error de función:', readErr);
        }

        throw new Error(detailedMessage);
      }

    } catch (error: any) {
      // Log completo del error
      console.error('❌ Complete invitation error:', error, {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
      });

      // Preparar mensaje legible
      let errorMessage = '';
      if (typeof error === 'string') errorMessage = error;
      else if (error?.message) errorMessage = error.message;
      else if (error?.error) errorMessage = JSON.stringify(error.error);
      else if (error?.data) errorMessage = JSON.stringify(error.data);
      else errorMessage = 'Error desconocido al enviar la invitación';

      // Personalizar mensajes de error
      if (errorMessage.includes('Timeout')) {
        errorMessage = 'La invitación está tardando mucho. Verifique su conexión e intente nuevamente.';
      } else if (errorMessage.includes('RESEND_API_KEY')) {
        errorMessage = 'Error de configuración: Servicio de correo no configurado';
      } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
        errorMessage = 'Error de conexión. Verifique su internet e intente nuevamente';
      } else if (errorMessage.includes('not configured')) {
        errorMessage = 'Error de configuración del sistema';
      }

      toast({
        title: '❌ Error al enviar invitación',
        description: errorMessage,
        variant: 'destructive',
      });

      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
      console.log('🏁 Invitation process finished');
    }
  };

  const getUserProfiles = async (): Promise<UserProfile[]> => {
    try {
      // Usar la función Edge para obtener usuarios
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'listUsers' }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Error fetching users');
      }

      return data.users || [];
    } catch (error: any) {
      console.error('Error fetching user profiles:', error);
      
      // Si hay un error de permisos, mostrar usuarios mock para demo
      if (error.message?.includes('permissions') || error.message?.includes('not allowed')) {
        toast({
          title: "Modo Demo",
          description: "Mostrando usuarios de ejemplo. Configure permisos de administrador para datos reales.",
          variant: "default",
        });
        
        // Retornar usuarios de ejemplo para demostración
        return [
          {
            id: 'juan-froilan-id',
            email: 'juan.froilan@ministeriosanidad.gq',
            role: 'SUPER_ADMINISTRADOR',
            full_name: 'Juan Froilan Ramos Nabama',
            department: 'Ministerio de Sanidad y Bienestar Social',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true
          },
          {
            id: 'demo-revisor-id',
            email: 'revisor@ministeriosanidad.gq',
            role: 'REVISOR_SOLICITUDES',
            full_name: 'Usuario Revisor Demo',
            department: 'Comité de Revisión',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true
          }
        ] as UserProfile[];
      }
      
      toast({
        title: "Error al cargar usuarios",
        description: error.message,
        variant: "destructive",
      });
      return [];
    }
  };

  const updateUserRole = async (userId: string, updates: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { 
          action: 'updateUser',
          userId,
          updates
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Error updating user');
      }

      toast({
        title: "Usuario actualizado",
        description: "Los datos del usuario han sido actualizados correctamente",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error al actualizar usuario",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { 
          action: 'deleteUser',
          userId
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Error deleting user');
      }

      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado correctamente",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error al eliminar usuario",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  return {
    inviteUser,
    getUserProfiles,
    updateUserRole,
    deleteUser,
    isLoading
  };
};
