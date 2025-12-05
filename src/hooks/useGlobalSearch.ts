import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  type: 'paciente' | 'usuario' | 'profesional';
  id: string;
  titulo: string;
  subtitulo: string;
  icon: string;
  url: string;
}

export const useGlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [historial, setHistorial] = useState<string[]>([]);

  // Cargar historial desde localStorage
  const cargarHistorial = useCallback(() => {
    const saved = localStorage.getItem('hosix_search_history');
    if (saved) {
      try {
        setHistorial(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading search history:', e);
      }
    }
  }, []);

  // Guardar búsqueda en historial
  const agregarAlHistorial = useCallback((termino: string) => {
    setHistorial(prev => {
      const nuevo = [termino, ...prev.filter(h => h !== termino)].slice(0, 10);
      localStorage.setItem('hosix_search_history', JSON.stringify(nuevo));
      return nuevo;
    });
  }, []);

  // Limpiar historial
  const limpiarHistorial = useCallback(() => {
    setHistorial([]);
    localStorage.removeItem('hosix_search_history');
  }, []);

  // Búsqueda de pacientes
  const { data: resultadosPacientes = [], isLoading: loadingPacientes } = useQuery({
    queryKey: ['search_pacientes', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const { data, error } = await supabase
        .from('hosix_pacientes')
        .select('id, ppi, primer_nombre, primer_apellido, numero_documento')
        .or(
          `ppi.ilike.%${query}%,` +
          `numero_documento.ilike.%${query}%,` +
          `primer_nombre.ilike.%${query}%,` +
          `primer_apellido.ilike.%${query}%`
        )
        .eq('activo', true)
        .limit(5);

      if (error) {
        console.error('Error searching patients:', error);
        return [];
      }

      return (data || []).map(p => ({
        type: 'paciente' as const,
        id: p.id,
        titulo: `${p.primer_nombre} ${p.primer_apellido}`,
        subtitulo: `PPI: ${p.ppi} | Cédula: ${p.numero_documento}`,
        icon: 'User',
        url: `/hosix/pacientes/${p.id}`,
      }));
    },
    enabled: query.length >= 2,
  });

  // Búsqueda de usuarios
  const { data: resultadosUsuarios = [], isLoading: loadingUsuarios } = useQuery({
    queryKey: ['search_usuarios', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const { data, error } = await supabase
        .from('hosix_usuarios')
        .select('id, username, nombre_completo, email')
        .or(
          `username.ilike.%${query}%,` +
          `nombre_completo.ilike.%${query}%,` +
          `email.ilike.%${query}%`
        )
        .eq('activo', true)
        .limit(5);

      if (error) {
        console.error('Error searching users:', error);
        return [];
      }

      return (data || []).map(u => ({
        type: 'usuario' as const,
        id: u.id,
        titulo: u.nombre_completo,
        subtitulo: `@${u.username} | ${u.email}`,
        icon: 'Users',
        url: `/hosix/configuracion?tab=usuarios&id=${u.id}`,
      }));
    },
    enabled: query.length >= 2,
  });

  // Búsqueda de servicios/departamentos
  const { data: resultadosServicios = [], isLoading: loadingServicios } = useQuery({
    queryKey: ['search_servicios', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const { data, error } = await supabase
        .from('hosix_servicios')
        .select('id, nombre, descripcion')
        .or(
          `nombre.ilike.%${query}%,` +
          `descripcion.ilike.%${query}%`
        )
        .eq('activo', true)
        .limit(5);

      if (error) {
        console.error('Error searching services:', error);
        return [];
      }

      return (data || []).map(s => ({
        type: 'profesional' as const,
        id: s.id,
        titulo: s.nombre,
        subtitulo: s.descripcion || 'Servicio médico',
        icon: 'Building',
        url: `/hosix/configuracion?tab=servicios&id=${s.id}`,
      }));
    },
    enabled: query.length >= 2,
  });

  // Combinar resultados
  const resultados: SearchResult[] = [
    ...resultadosPacientes,
    ...resultadosUsuarios,
    ...resultadosServicios,
  ];

  const isLoading = loadingPacientes || loadingUsuarios || loadingServicios;

  return {
    query,
    setQuery,
    resultados,
    isLoading,
    historial,
    cargarHistorial,
    agregarAlHistorial,
    limpiarHistorial,
  };
};
