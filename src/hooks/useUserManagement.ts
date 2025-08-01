import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserInvitation, UserProfile } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export const useUserManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const inviteUser = async (invitation: UserInvitation) => {
    setIsLoading(true);
    try {
      // Llamar a la función Supabase para enviar invitación
      const { data, error } = await supabase.functions.invoke('send-user-invitation', {
        body: {
          email: invitation.email,
          role: invitation.role,
          full_name: invitation.full_name,
          department: invitation.department,
          assigned_center_id: invitation.assigned_center_id,
          invited_by: invitation.invited_by
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Invitación enviada",
        description: `Se ha enviado una invitación a ${invitation.email}`,
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('Error inviting user:', error);
      toast({
        title: "Error al enviar invitación",
        description: error.message || "Ocurrió un error al enviar la invitación",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const getUserProfiles = async (): Promise<UserProfile[]> => {
    try {
      // Obtener usuarios de auth.users y sus perfiles
      const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        throw authError;
      }

      // Convertir usuarios de auth a UserProfile
      const userProfiles: UserProfile[] = users.map(user => ({
        id: user.id,
        email: user.email || '',
        role: (user.user_metadata?.role || 'OBSERVADOR') as any,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
        department: user.user_metadata?.department || 'Ministerio de Sanidad',
        assigned_center_id: user.user_metadata?.assigned_center_id,
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at,
        is_active: !user.email_confirmed_at ? false : true
      }));

      return userProfiles;
    } catch (error: any) {
      console.error('Error fetching user profiles:', error);
      toast({
        title: "Error al cargar usuarios",
        description: error.message,
        variant: "destructive",
      });
      return [];
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { role }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Rol actualizado",
        description: "El rol del usuario ha sido actualizado correctamente",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error al actualizar rol",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) {
        throw error;
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
