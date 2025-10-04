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
        .from('solicitudes_traslados')
        .select(`
          *,
          profesional:profesionales_sanitarios(nombre_completo, area_profesional),
          centro_origen:centros_salud!centro_origen_id(nombre, categoria, sector, distrito_sanitario),
          centro_destino:centros_salud!centro_destino_id(nombre, categoria, sector, distrito_sanitario)
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
      // Obtener nombres de centros
      const { data: centroOrigen } = await supabase
        .from('centros_salud')
        .select('nombre, categoria, sector, distrito_sanitario')
        .eq('id', trasladoData.centro_origen_id || user?.assigned_center_id)
        .single();

      const { data: centroDestino } = await supabase
        .from('centros_salud')
        .select('nombre, categoria, sector, distrito_sanitario')
        .eq('id', trasladoData.centro_destino_id)
        .single();

      const { data, error } = await supabase
        .from('solicitudes_traslados')
        .insert([{
          ...trasladoData,
          centro_origen_id: trasladoData.centro_origen_id || (userRole === 'ADMIN_CENTRO_SANITARIO' ? user?.assigned_center_id : undefined),
          nombre_centro_origen: centroOrigen?.nombre,
          categoria_centro_origen: centroOrigen?.categoria,
          tipo_sector_origen: centroOrigen?.sector,
          distrito_sanitario_origen: centroOrigen?.distrito_sanitario,
          nombre_centro_destino: centroDestino?.nombre,
          categoria_centro_destino: centroDestino?.categoria,
          tipo_sector_destino: centroDestino?.sector,
          distrito_sanitario_destino: centroDestino?.distrito_sanitario,
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
        // Primero obtener los datos completos de la solicitud
        const { data: traslado, error: fetchError } = await supabase
          .from('solicitudes_traslados')
          .select('*')
          .eq('id', solicitudId)
          .single();

        if (fetchError) throw fetchError;

        // Actualizar el profesional con el nuevo centro
        const { error: updateError } = await supabase
          .from('profesionales_sanitarios')
          .update({
            nombre_centro: traslado.nombre_centro_destino,
            categoria_centro: traslado.categoria_centro_destino,
            tipo_sector: traslado.tipo_sector_destino,
            distrito_sanitario: traslado.distrito_sanitario_destino,
            centro_salud_id: traslado.centro_destino_id
          })
          .eq('id', traslado.profesional_id);

        if (updateError) throw updateError;

        // Actualizar también la tabla profesional_centro_asignado
        const { error: asignacionError } = await supabase
          .from('profesional_centro_asignado')
          .update({
            nombre_centro: traslado.nombre_centro_destino,
            categoria_centro: traslado.categoria_centro_destino,
            tipo_sector: traslado.tipo_sector_destino,
            distrito_sanitario: traslado.distrito_sanitario_destino,
            fecha_asignacion: new Date().toISOString()
          })
          .eq('id_profesional', traslado.profesional_id);

        if (asignacionError) console.error('Error actualizando asignación:', asignacionError);
      }

      if (action === 'rechazado' && observaciones) {
        updates.motivo_rechazo = observaciones;
      }

      // Actualizar la solicitud
      const { error } = await supabase
        .from('solicitudes_traslados')
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
