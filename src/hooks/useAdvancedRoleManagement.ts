import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/roles';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  centro_asignado_id?: string;
  permisos_especiales?: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

interface SolicitudTraslado {
  id: string;
  profesional_id: string;
  centro_origen_id: string;
  centro_destino_id: string;
  motivo: string;
  observaciones?: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  fecha_solicitud: string;
  fecha_aprobacion?: string;
  solicitante_id: string;
  aprobado_por?: string;
}

export const useAdvancedRoleManagement = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [traslados, setTraslados] = useState<SolicitudTraslado[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar usuarios (solo para RRHH y Super Admin)
  const loadUsers = async () => {
    if (!userRole || !['SUPER_ADMINISTRADOR', 'RRHH_MINISTERIO'].includes(userRole)) {
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          centros_salud:centro_asignado_id(nombre, categoria)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los usuarios',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Crear nuevo usuario
  const createUser = async (userData: {
    email: string;
    full_name: string;
    role: UserRole;
    centro_asignado_id?: string;
    department?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{
          ...userData,
          created_by: user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Usuario creado',
        description: `Usuario ${userData.full_name} creado exitosamente`
      });

      await loadUsers();
      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error al crear el usuario',
        variant: 'destructive'
      });
      return { success: false, error: error.message };
    }
  };

  // Actualizar usuario
  const updateUser = async (userId: string, updates: Partial<UserProfile>) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Usuario actualizado',
        description: 'Los datos del usuario han sido actualizados'
      });

      await loadUsers();
      return { success: true };
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar el usuario',
        variant: 'destructive'
      });
      return { success: false, error: error.message };
    }
  };

  // Cargar solicitudes de traslado
  const loadTraslados = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('solicitudes_traslado')
        .select(`
          *,
          profesional:profesionales_sanitarios(nombre_completo, area_profesional),
          centro_origen:centros_salud!centro_origen_id(nombre),
          centro_destino:centros_salud!centro_destino_id(nombre)
        `)
        .order('fecha_solicitud', { ascending: false });

      // Filtrar por centro si es admin de centro
      if (userRole === 'ADMIN_CENTRO_SANITARIO' && user?.assigned_center_id) {
        query = query.eq('centro_origen_id', user.assigned_center_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTraslados(data || []);
    } catch (error) {
      console.error('Error loading traslados:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las solicitudes de traslado',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Crear solicitud de traslado
  const createTrasladoSolicitud = async (trasladoData: {
    profesional_id: string;
    centro_destino_id: string;
    motivo: string;
    observaciones?: string;
    centro_origen_id?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('solicitudes_traslado')
        .insert([{
          ...trasladoData,
          centro_origen_id: trasladoData.centro_origen_id || (userRole === 'ADMIN_CENTRO_SANITARIO' ? user?.assigned_center_id : undefined),
          solicitante_id: user?.id,
          estado: 'pendiente'
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Solicitud creada',
        description: 'La solicitud de traslado ha sido enviada para revisión'
      });

      await loadTraslados();
      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating traslado:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error al crear la solicitud de traslado',
        variant: 'destructive'
      });
      return { success: false, error: error.message };
    }
  };

  // Aprobar/Rechazar traslado
  const processTrasladoSolicitud = async (
    solicitudId: string, 
    action: 'aprobado' | 'rechazado',
    observaciones?: string
  ) => {
    try {
      const updates: any = {
        estado: action,
        fecha_aprobacion: new Date().toISOString(),
        aprobado_por: user?.id
      };

      if (observaciones) {
        updates.observaciones = observaciones;
      }

      // Si se aprueba, también actualizar el centro del profesional
      if (action === 'aprobado') {
        // Primero obtener los datos de la solicitud
        const { data: solicitud, error: fetchError } = await supabase
          .from('solicitudes_traslado')
          .select('profesional_id, centro_destino_id')
          .eq('id', solicitudId)
          .single();

        if (fetchError) throw fetchError;

        // Actualizar el centro del profesional
        const { error: updateError } = await supabase
          .from('profesionales_sanitarios')
          .update({ centro_salud_id: solicitud.centro_destino_id })
          .eq('id', solicitud.profesional_id);

        if (updateError) throw updateError;
      }

      // Actualizar la solicitud
      const { error } = await supabase
        .from('solicitudes_traslado')
        .update(updates)
        .eq('id', solicitudId);

      if (error) throw error;

      toast({
        title: `Solicitud ${action}`,
        description: `La solicitud de traslado ha sido ${action}`
      });

      await loadTraslados();
      return { success: true };
    } catch (error: any) {
      console.error('Error processing traslado:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error al procesar la solicitud',
        variant: 'destructive'
      });
      return { success: false, error: error.message };
    }
  };

  // Verificar permisos
  const hasManageUsersPermission = () => {
    return ['SUPER_ADMINISTRADOR', 'RRHH_MINISTERIO'].includes(userRole || '');
  };

  const hasApproveTrasladosPermission = () => {
    return ['SUPER_ADMINISTRADOR', 'RRHH_MINISTERIO'].includes(userRole || '');
  };

  const hasCreateTrasladosPermission = () => {
    return ['SUPER_ADMINISTRADOR', 'RRHH_MINISTERIO', 'ADMIN_CENTRO_SANITARIO'].includes(userRole || '');
  };

  useEffect(() => {
    if (hasManageUsersPermission()) {
      loadUsers();
    }
    if (hasCreateTrasladosPermission() || hasApproveTrasladosPermission()) {
      loadTraslados();
    }
  }, [userRole]);

  return {
    users,
    traslados,
    loading,
    loadUsers,
    createUser,
    updateUser,
    loadTraslados,
    createTrasladoSolicitud,
    processTrasladoSolicitud,
    hasManageUsersPermission,
    hasApproveTrasladosPermission,
    hasCreateTrasladosPermission
  };
};
