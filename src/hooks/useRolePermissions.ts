import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PERMISSIONS, Permission, UserRole } from '@/types/roles';
import { useToast } from '@/hooks/use-toast';

export type RolePermissionMap = Record<UserRole, Set<string>>;

export const useRolePermissions = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rolePerms, setRolePerms] = useState<RolePermissionMap>({} as RolePermissionMap);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('role, permission');
      if (error) throw error;
      const map: RolePermissionMap = {} as RolePermissionMap;
      (data || []).forEach((r: any) => {
        const role = r.role as UserRole;
        if (!map[role]) map[role] = new Set<string>();
        map[role].add(r.permission);
      });
      setRolePerms(map);
    } catch (e: any) {
      console.error('Error loading role_permissions:', e);
      toast({ title: 'Error', description: 'No se pudieron cargar permisos de roles', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const getPermissionsForRole = (role: UserRole): string[] => Array.from(rolePerms[role] || []);
  const getAvailablePermissions = (): Permission[] => PERMISSIONS;

  const setPermissionsForRole = async (role: UserRole, nextPermissions: string[]) => {
    setLoading(true);
    try {
      const current = new Set(getPermissionsForRole(role));
      const next = new Set(nextPermissions);

      const toAdd = [...next].filter(p => !current.has(p));
      const toRemove = [...current].filter(p => !next.has(p));

      if (toAdd.length) {
        const { error: addError } = await supabase
          .from('role_permissions')
          .insert(toAdd.map(p => ({ role, permission: p })));
        if (addError) throw addError;
      }
      if (toRemove.length) {
        const { error: delError } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role', role)
          .in('permission', toRemove);
        if (delError) throw delError;
      }

      // Refresh local
      await load();
      toast({ title: 'Permisos actualizados', description: `Rol ${role} actualizado correctamente` });
      return { success: true };
    } catch (e: any) {
      console.error('Error updating role permissions:', e);
      toast({ title: 'Error', description: e.message || 'No se pudieron actualizar los permisos', variant: 'destructive' });
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  };

  const getEffectiveUserPermissions = async (userId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase.rpc('get_user_permissions', { user_id: userId });
      if (error) throw error;
      return (data as string[]) || [];
    } catch (e) {
      console.warn('Falling back to role permissions for user', userId, e);
      // Fallback: try to read profile -> role and then from rolePerms
      const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', userId).maybeSingle();
      const role = (profile?.role || 'OBSERVADOR') as UserRole;
      return getPermissionsForRole(role);
    }
  };

  return {
    loading,
    rolePerms,
    getPermissionsForRole,
    getAvailablePermissions,
    setPermissionsForRole,
    getEffectiveUserPermissions,
    reload: load,
  };
};
