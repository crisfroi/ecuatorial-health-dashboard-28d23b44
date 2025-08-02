export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  department?: string;
  assigned_center_id?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export type UserRole = 
  | 'SUPER_ADMINISTRADOR'
  | 'REVISOR_SOLICITUDES'
  | 'PERSONALIDAD_MINISTERIAL'
  | 'OBSERVADOR'
  | 'DIRECTIVO_CENTRO_SANITARIO';

export interface UserInvitation {
  email: string;
  role: UserRole;
  full_name?: string;
  department?: string;
  assigned_center_id?: string;
  invited_by: string;
}
