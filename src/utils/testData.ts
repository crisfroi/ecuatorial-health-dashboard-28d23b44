import type { ProfesionalInsert } from "@/hooks/useProfesionales";

export const mockProfesionales: Array<ProfesionalInsert & { 
  documento_identidad?: string;
  lugar_trabajo?: string;
  universidad?: string;
}> = [
  {
    id: '1',
    nombre_completo: 'Dr. Juan Pérez González',
    nombre: 'Juan',
    apellidos: 'Pérez González',
    area_profesional: 'Medicina General',
    estado_solicitud: 'Aprobado',
    genero: 'Masculino',
    nacionalidad: 'Ecuatoguineana',
    provincia: 'Bioko Norte',
    distrito: 'Malabo',
    documento_identidad: '12345678A',
    lugar_trabajo: 'Hospital General de Malabo',
    universidad: 'Universidad Nacional de Guinea Ecuatorial',
    telefono: '+240 123 456 789',
    email: 'juan.perez@hospital.gq',
    edad: 35,
    año_graduacion: 2010,
    fecha_caducidad: '2025-12-31',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    nombre_completo: 'Dra. María Nsue Okomo',
    nombre: 'María',
    apellidos: 'Nsue Okomo',
    area_profesional: 'Pediatría',
    estado_solicitud: 'Pendiente de Firma',
    genero: 'Femenino',
    nacionalidad: 'Ecuatoguineana',
    provincia: 'Bioko Sur',
    distrito: 'Luba',
    documento_identidad: '87654321B',
    lugar_trabajo: 'Centro de Salud de Luba',
    universidad: 'Universidad de Barcelona',
    telefono: '+240 987 654 321',
    email: 'maria.nsue@centrosalud.gq',
    edad: 42,
    año_graduacion: 2005,
    fecha_caducidad: '2024-08-15',
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    nombre_completo: 'Dr. José Mba Nguema',
    nombre: 'José',
    apellidos: 'Mba Nguema',
    area_profesional: 'Cirugía',
    estado_solicitud: 'Recibido',
    genero: 'Masculino',
    nacionalidad: 'Ecuatoguineana',
    provincia: 'Litoral',
    distrito: 'Bata',
    documento_identidad: '11223344C',
    lugar_trabajo: 'Hospital Regional de Bata',
    universidad: 'Universidad Complutense de Madrid',
    telefono: '+240 555 123 456',
    email: 'jose.mba@hospitalregional.gq',
    edad: 45,
    año_graduacion: 2002,
    fecha_caducidad: '2025-03-20',
    created_at: new Date().toISOString()
  }
];
