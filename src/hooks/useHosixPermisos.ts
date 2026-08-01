import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/hosixClient';
import { useHosixAuth } from './useHosixAuth';

export interface Permiso {
  id: string;
  codigo: string;
  descripcion: string;
  modulo: string;
}

export interface PerfilPermiso {
  id: string;
  perfil_id: string;
  permiso_id: string;
  activo: boolean;
  permiso: Permiso;
}

export const useHosixPermisos = () => {
  const { user } = useHosixAuth();
  const [permisos, setPermisos] = useState<PerfilPermiso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar permisos del usuario
  useEffect(() => {
    const loadPermisos = async () => {
      if (!user?.perfil_id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error: err } = await supabase
          .from('hosix_permisos_modulos')
          .select(`
            id,
            perfil_id,
            permiso_id,
            activo,
            permiso:hosix_permisos(id, codigo, descripcion, modulo)
          `)
          .eq('perfil_id', user.perfil_id)
          .eq('activo', true);

        if (err) throw err;
        setPermisos(data || []);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error loading permissions';
        setError(errorMessage);
        console.error('Error loading permissions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPermisos();
  }, [user?.perfil_id]);

  // Verificar si usuario tiene permiso específico
  const tienePermiso = useCallback((codigoPermiso: string): boolean => {
    if (!user || isLoading) return false;
    return permisos.some(p => 
      p.activo && 
      p.permiso?.codigo === codigoPermiso
    );
  }, [permisos, user, isLoading]);

  // Verificar si usuario tiene acceso a módulo
  const tieneAccesoModulo = useCallback((modulo: string): boolean => {
    if (!user || isLoading) return false;
    return permisos.some(p =>
      p.activo &&
      p.permiso?.modulo === modulo
    );
  }, [permisos, user, isLoading]);

  // Obtener todos los módulos accesibles
  const getModulosAccesibles = useCallback((): string[] => {
    if (!user || isLoading) return [];
    const modulos = new Set<string>();
    permisos.forEach(p => {
      if (p.activo && p.permiso?.modulo) {
        modulos.add(p.permiso.modulo);
      }
    });
    return Array.from(modulos);
  }, [permisos, user, isLoading]);

  // Obtener permisos por módulo
  const getPermisosPorModulo = useCallback((modulo: string): Permiso[] => {
    if (!user || isLoading) return [];
    return permisos
      .filter(p => p.activo && p.permiso?.modulo === modulo)
      .map(p => p.permiso)
      .filter((p): p is Permiso => p !== undefined && p !== null);
  }, [permisos, user, isLoading]);

  return {
    permisos,
    isLoading,
    error,
    tienePermiso,
    tieneAccesoModulo,
    getModulosAccesibles,
    getPermisosPorModulo,
  };
};
