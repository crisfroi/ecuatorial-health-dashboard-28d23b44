import { useAuth } from '@/contexts/AuthContext';
import { useGuardias } from '@/hooks/useGuardSystem';
import { usePublicHospitals, useProfesionalesByHospital, useGuardProfessionals } from '@/hooks/useRealProfesionales';
import { useMemo } from 'react';

/**
 * Hook that provides hospital-specific guard management
 * Automatically uses the assigned hospital for the current user
 */
export const useHospitalGuardSystem = () => {
  const { user } = useAuth();
  
  // Get user's assigned hospital
  const userHospitalId = user?.assigned_center_id;
  
  // Fetch hospital data
  const { data: hospitales = [] } = usePublicHospitals();
  const userHospital = useMemo(() => {
    return hospitales.find(h => h.id === userHospitalId);
  }, [hospitales, userHospitalId]);

  // Hospital-specific professionals
  const { data: hospitalProfessionals = [], isLoading: loadingProfessionals } = useProfesionalesByHospital(
    userHospitalId || ''
  );

  // Hospital-specific guard professionals (those enrolled in guard system)
  const { data: guardProfessionals = [], isLoading: loadingGuardProfessionals } = useGuardProfessionals(
    userHospitalId
  );

  // Hospital-specific guards
  const useHospitalGuards = (filters?: {
    mes?: number;
    anio?: number;
    profesionalId?: string;
    estado?: string;
    validacionEstado?: string;
  }) => {
    return useGuardias({
      ...filters,
      centroId: userHospitalId
    });
  };

  const isHospitalUser = user?.role === 'DIRECTIVO_CENTRO_SANITARIO';
  const isMinisterialUser = user?.role === 'PERSONALIDAD_MINISTERIAL' || user?.role === 'SUPER_ADMINISTRADOR';

  return {
    // Hospital info
    userHospital,
    userHospitalId,
    isHospitalUser,
    isMinisterialUser,
    
    // Professionals
    hospitalProfessionals,
    guardProfessionals,
    loadingProfessionals,
    loadingGuardProfessionals,
    
    // Guard management
    useHospitalGuards,
    
    // Access control
    canManageGuards: isHospitalUser && !!userHospitalId,
    canValidatePayrolls: isMinisterialUser,
    
    // Hospital context
    hospitalContext: {
      hospitalId: userHospitalId,
      hospitalName: userHospital?.nombre,
      hospitalCategory: userHospital?.categoria,
      districtName: userHospital?.distrito_sanitario
    }
  };
};
