import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Profesional, CategoriaProfesional } from '@/types/guardias';

type ProfesionalSanitario = Tables<'profesionales_sanitarios'>;
type CentroSalud = Tables<'centros_salud'>;

// Map database categories to guard categories
const mapCategoriaToGuardia = (categoria: string | null): CategoriaProfesional => {
  if (!categoria) return 'auxiliar';
  
  const categoriaLower = categoria.toLowerCase();
  
  if (categoriaLower.includes('especialista') || categoriaLower.includes('medico especialista')) {
    return 'especialista';
  }
  if (categoriaLower.includes('general') || categoriaLower.includes('licenciado') || categoriaLower.includes('medico general')) {
    return 'general_licenciado';
  }
  if (categoriaLower.includes('tecnico') || categoriaLower.includes('diplomado') || categoriaLower.includes('enfermero')) {
    return 'tecnico_diplomado';
  }
  if (categoriaLower.includes('auxiliar')) {
    return 'auxiliar';
  }
  if (categoriaLower.includes('subalterno')) {
    return 'subalterno';
  }
  if (categoriaLower.includes('odepac')) {
    return 'odepac';
  }
  if (categoriaLower.includes('secretar') || categoriaLower.includes('asist')) {
    return 'secre_asist_pacientes';
  }
  if (categoriaLower.includes('caja')) {
    return 'caja';
  }
  
  return 'auxiliar'; // Default fallback
};

// Convert database professional to guard system format
const convertToGuardProfessional = (dbProfessional: ProfesionalSanitario, centro?: CentroSalud): Profesional => ({
  id: dbProfessional.id,
  nombre: dbProfessional.nombre_completo,
  categoria: mapCategoriaToGuardia(dbProfessional.area_profesional || dbProfessional.categoria_titulacion),
  unidad_servicio: dbProfessional.area_profesional || dbProfessional.especialidad || 'General',
  banco: undefined, // Not available in current schema
  iban_cuenta: undefined, // Not available in current schema
  activo: dbProfessional.estado_solicitud === 'aprobada',
  telefono: dbProfessional.telefono || undefined,
  email: dbProfessional.email || undefined
});

export const useRealProfesionales = (centroId?: string) => {
  return useQuery({
    queryKey: ['profesionales-reales', centroId],
    queryFn: async () => {
      let query = supabase
        .from('profesionales_sanitarios')
        .select(`
          *,
          centros_salud!fk_profesionales_centro_salud(*)
        `)
        .eq('estado_solicitud', 'aprobada') // Only approved professionals
        .not('nombre_completo', 'is', null);

      if (centroId) {
        query = query.eq('centro_salud_id', centroId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching professionals:', error);
        throw error;
      }

      return (data || []).map(prof => {
        const centro = Array.isArray(prof.centros_salud) ? prof.centros_salud[0] : prof.centros_salud;
        return convertToGuardProfessional(prof, centro);
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const usePublicHospitals = () => {
  return useQuery({
    queryKey: ['hospitales-publicos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('centros_salud')
        .select('*')
        .eq('sector', 'Público') // Only public hospitals
        .eq('categoria', 'Hospital') // Only hospitals, not clinics
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error fetching public hospitals:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useProfesionalesByHospital = (hospitalId: string) => {
  return useQuery({
    queryKey: ['profesionales-hospital', hospitalId],
    queryFn: async () => {
      if (!hospitalId) return [];

      const { data, error } = await supabase
        .from('profesionales_sanitarios')
        .select('*')
        .eq('centro_salud_id', hospitalId)
        .eq('estado_solicitud', 'aprobada')
        .not('nombre_completo', 'is', null)
        .order('nombre_completo', { ascending: true });

      if (error) {
        console.error('Error fetching hospital professionals:', error);
        throw error;
      }

      return (data || []).map(convertToGuardProfessional);
    },
    enabled: !!hospitalId,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook to create guard professional entry when assigning to guard system
export const useCreateGuardProfessional = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profesionalData: {
      profesionalId: string;
      categoria: CategoriaProfesional;
      unidadServicio: string;
      banco?: string;
      ibanCuenta?: string;
      telefonoGuardias?: string;
      emailGuardias?: string;
    }) => {
      const { data, error } = await supabase
        .from('profesionales_guardias')
        .insert({
          profesional_id: profesionalData.profesionalId,
          categoria: profesionalData.categoria,
          unidad_servicio: profesionalData.unidadServicio,
          banco: profesionalData.banco,
          iban_cuenta: profesionalData.ibanCuenta,
          telefono_guardias: profesionalData.telefonoGuardias,
          email_guardias: profesionalData.emailGuardias,
          activo: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profesionales-guardias'] });
    },
  });
};

export const useGuardProfessionals = (centroId?: string) => {
  return useQuery({
    queryKey: ['profesionales-guardias', centroId],
    queryFn: async () => {
      let query = supabase
        .from('profesionales_guardias')
        .select(`
          *,
          profesionales_sanitarios!profesionales_guardias_profesional_id_fkey(
            id,
            nombre_completo,
            area_profesional,
            especialidad,
            telefono,
            email,
            centro_salud_id,
            centros_salud!fk_profesionales_centro_salud(*)
          )
        `)
        .eq('activo', true);

      if (centroId) {
        query = query.eq('profesionales_sanitarios.centro_salud_id', centroId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching guard professionals:', error);
        throw error;
      }

      return (data || []).map(guardProf => {
        const dbProf = guardProf.profesionales_sanitarios;
        if (!dbProf) return null;

        return {
          id: guardProf.id,
          profesionalId: dbProf.id,
          nombre: dbProf.nombre_completo,
          categoria: guardProf.categoria as CategoriaProfesional,
          unidad_servicio: guardProf.unidad_servicio,
          banco: guardProf.banco,
          iban_cuenta: guardProf.iban_cuenta,
          activo: guardProf.activo,
          telefono: guardProf.telefono_guardias || dbProf.telefono,
          email: guardProf.email_guardias || dbProf.email,
          centroSaludId: dbProf.centro_salud_id
        };
      }).filter(Boolean);
    },
    staleTime: 5 * 60 * 1000,
  });
};
