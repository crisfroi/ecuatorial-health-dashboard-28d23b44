import { supabase } from '@/integrations/supabase/client';
import { Professional } from '@/types/Professional';

// Funciones para añadir campos calculados a los datos de la BD
export const enrichProfessionalData = (professional: any): Professional => {
  return {
    ...professional,
    documento_identidad: professional.numero_dip || professional.numero_pasaporte || '',
    lugar_trabajo: professional.nombre_centro || ''
  };
};

export const enrichProfessionalsArray = (professionals: any[]): Professional[] => {
  return professionals.map(enrichProfessionalData);
};

// Utilidad para crear usuarios de prueba reales cuando auth esté configurado
export const createTestUsersWithAuth = async () => {
  // Esta función se implementará cuando tengamos acceso a crear usuarios auth
  console.log('Auth user creation will be implemented when authentication is set up');
  return { success: true, message: 'Ready for auth setup' };
};