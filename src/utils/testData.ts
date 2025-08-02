
import { supabase } from '@/integrations/supabase/client';
import type { ProfesionalInsert } from '@/hooks/useProfesionales';

const testProfesionales: ProfesionalInsert[] = [
  {
    nombre_completo: "Dr. Juan Carlos Mendoza",
    nombre: "Juan Carlos",
    apellidos: "Mendoza",
    genero: "Masculino",
    fecha_nacimiento: "1985-03-15",
    edad: 39,
    nacionalidad: "Ecuatoguineana",
    gentilicio_femenino: "Ecuatoguineana",
    numero_dip: "12345678",
    telefono: "+240222123456",
    domicilio: "Barrio Ela Nguema, Malabo",
    area_profesional: "Medicina",
    especialidad: "Cardiología",
    numero_carnet_profesional: "MED-001-2024",
    fecha_validez_carnet: "2025-12-31",
    nombre_centro: "Hospital Nacional de Malabo",
    provincia: "Bioko Norte",
    distrito: "Malabo",
    categoria_centro: "Hospital Nacional",
    tipo_sector: "Público",
    estado_solicitud: "Aprobado",
    titulacion_especifica_1: "Licenciado en Medicina",
    institucion_1: "Universidad Nacional de Guinea Ecuatorial",
    año_graduacion: 2010,
    pais_formacion_1: "Guinea Ecuatorial",
    fecha_solicitud: "2024-01-15",
    fecha_aprobacion: "2024-02-01",
    pertenece_brigada_medica: false
  },
  {
    nombre_completo: "Dra. María Carmen Obiang",
    nombre: "María Carmen",
    apellidos: "Obiang",
    genero: "Femenino",
    fecha_nacimiento: "1990-07-22",
    edad: 34,
    nacionalidad: "Ecuatoguineana",
    gentilicio_femenino: "Ecuatoguineana",
    numero_dip: "87654321",
    telefono: "+240333456789",
    domicilio: "Barrio Comandachina, Bata",
    area_profesional: "Enfermería",
    especialidad: "Enfermería Pediátrica",
    numero_carnet_profesional: "ENF-002-2024",
    fecha_validez_carnet: "2025-06-30",
    nombre_centro: "Hospital Regional de Bata",
    provincia: "Litoral",
    distrito: "Bata",
    categoria_centro: "Hospital Regional",
    tipo_sector: "Público",
    estado_solicitud: "Aprobado",
    titulacion_especifica_1: "Diplomado en Enfermería",
    institucion_1: "Escuela de Enfermería de Bata",
    año_graduacion: 2015,
    pais_formacion_1: "Guinea Ecuatorial",
    fecha_solicitud: "2024-01-20",
    fecha_aprobacion: "2024-02-10",
    pertenece_brigada_medica: false
  },
  {
    nombre_completo: "Dr. Antonio Nsue Micha",
    nombre: "Antonio",
    apellidos: "Nsue Micha",
    genero: "Masculino",
    fecha_nacimiento: "1982-11-08",
    edad: 42,
    nacionalidad: "Ecuatoguineana",
    gentilicio_femenino: "Ecuatoguineana",
    numero_dip: "11223344",
    telefono: "+240444567890",
    domicilio: "Barrio Ela Nguema, Malabo",
    area_profesional: "Farmacia",
    especialidad: "Farmacia Hospitalaria",
    numero_carnet_profesional: "FAR-003-2024",
    fecha_validez_carnet: "2024-12-31",
    nombre_centro: "Farmacia Central de Malabo",
    provincia: "Bioko Norte",
    distrito: "Malabo",
    categoria_centro: "Centro de Salud",
    tipo_sector: "Público",
    estado_solicitud: "Pendiente",
    titulacion_especifica_1: "Licenciado en Farmacia",
    institucion_1: "Universidad de Barcelona",
    año_graduacion: 2008,
    pais_formacion_1: "España",
    fecha_solicitud: "2024-02-01",
    pertenece_brigada_medica: false
  }
];

export const createTestData = async () => {
  try {
    console.log('Creando datos de prueba...');
    
    const { data, error } = await supabase
      .from('profesionales_sanitarios')
      .insert(testProfesionales)
      .select();

    if (error) {
      console.error('Error creando datos de prueba:', error);
      throw error;
    }

    console.log('Datos de prueba creados exitosamente:', data?.length || 0, 'registros');
    return data;
  } catch (error) {
    console.error('Error en createTestData:', error);
    throw error;
  }
};

export const clearTestData = async () => {
  try {
    console.log('Eliminando todos los datos...');
    
    const { error } = await supabase
      .from('profesionales_sanitarios')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todos excepto un ID imposible

    if (error) {
      console.error('Error eliminando datos:', error);
      throw error;
    }

    console.log('Datos eliminados exitosamente');
  } catch (error) {
    console.error('Error en clearTestData:', error);
    throw error;
  }
};
