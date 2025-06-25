
import { supabase } from '@/integrations/supabase/client';
import type { ProfesionalInsert } from '@/hooks/useProfesionales';

export const createTestProfessionals = async () => {
  const testProfessionals: ProfesionalInsert[] = [
    {
      nombre_completo: "Dr. Carlos Mendoza García",
      nombre: "Carlos",
      apellidos: "Mendoza García",
      genero: "Masculino",
      fecha_nacimiento: "1985-03-15",
      edad: 39,
      nacionalidad: "Ecuatoguineana",
      gentilicio: "Ecuatoguineano",
      domicilio: "Calle Principal 123, Malabo",
      numero_dip: "12345678",
      numero_pasaporte: "EG123456789",
      telefono: "+240222123456",
      area_profesional: "MEDICINA GENERAL",
      prefijo_area: "MG",
      especialidad: "Medicina Interna",
      lugar_trabajo: "Hospital General de Malabo",
      provincia: "Bioko Norte",
      distrito: "Malabo",
      distrito_sanitario: "Malabo Centro",
      tipo_sector: "Público",
      categoria_centro: "Hospital Nacional",
      estado_solicitud: "Aprobado",
      estado_trabajo: "Activo",
      año_graduacion: 2010,
      titulacion_especifica_1: "Licenciatura en Medicina y Cirugía",
      tipo_formacion_1: "Universitaria",
      institucion_1: "Universidad Nacional de Guinea Ecuatorial",
      periodo_formacion_1: "2004-2010",
      pais_formacion_1: "Guinea Ecuatorial",
      puesto_responsabilidad: "Médico Internista",
      numero_carnet_profesional: "MG-2024-001",
      fecha_validez_carnet: "2025-12-31",
      fecha_solicitud: "2024-01-15",
      fecha_aprobacion: "2024-02-01",
      pertenece_brigada_medica: false
    },
    {
      nombre_completo: "Enfermera María José Nsue Obiang",
      nombre: "María José",
      apellidos: "Nsue Obiang",
      genero: "Femenino",
      fecha_nacimiento: "1990-07-22",
      edad: 34,
      nacionalidad: "Ecuatoguineana",
      gentilicio: "Ecuatoguineana",
      domicilio: "Barrio Ela Nguema, Bata",
      numero_dip: "87654321",
      numero_pasaporte: "EG987654321",
      telefono: "+240333456789",
      area_profesional: "ENFERMERÍA",
      prefijo_area: "ENF",
      especialidad: "Enfermería Pediátrica",
      lugar_trabajo: "Hospital Regional de Bata",
      provincia: "Litoral",
      distrito: "Bata",
      distrito_sanitario: "Bata Urbano",
      tipo_sector: "Público",
      categoria_centro: "Hospital Regional",
      estado_solicitud: "Pendiente",
      estado_trabajo: "Activo",
      año_graduacion: 2015,
      titulacion_especifica_1: "Diplomatura en Enfermería",
      tipo_formacion_1: "Universitaria",
      institucion_1: "Escuela de Enfermería de Bata",
      periodo_formacion_1: "2012-2015",
      pais_formacion_1: "Guinea Ecuatorial",
      puesto_responsabilidad: "Supervisora de Enfermería Pediátrica",
      fecha_solicitud: "2024-03-10",
      pertenece_brigada_medica: true,
      brigada_cooperacion: "Brigada Médica Cubana"
    },
    {
      nombre_completo: "Farm. Antonio Nguema Mba",
      nombre: "Antonio",
      apellidos: "Nguema Mba",
      genero: "Masculino",
      fecha_nacimiento: "1988-11-08",
      edad: 36,
      nacionalidad: "Ecuatoguineana",
      gentilicio: "Ecuatoguineano",
      domicilio: "Avenida de la Independencia 45, Malabo",
      numero_dip: "45678901",
      numero_pasaporte: "EG456789012",
      telefono: "+240555789012",
      area_profesional: "FARMACIA",
      prefijo_area: "FARM",
      especialidad: "Farmacia Hospitalaria",
      lugar_trabajo: "Hospital La Paz",
      provincia: "Bioko Norte",
      distrito: "Malabo",
      distrito_sanitario: "Malabo Sur",
      tipo_sector: "Privado",
      categoria_centro: "Hospital Privado",
      estado_solicitud: "Aprobado",
      estado_trabajo: "Activo",
      año_graduacion: 2013,
      titulacion_especifica_1: "Licenciatura en Farmacia",
      tipo_formacion_1: "Universitaria",
      institucion_1: "Universidad de Alcalá de Henares",
      periodo_formacion_1: "2008-2013",
      pais_formacion_1: "España",
      titulacion_especifica_2: "Máster en Farmacia Hospitalaria",
      tipo_formacion_2: "Postgrado",
      institucion_2: "Universidad Complutense de Madrid",
      periodo_formacion_2: "2014-2015",
      pais_formacion_2: "España",
      puesto_responsabilidad: "Jefe de Farmacia",
      numero_carnet_profesional: "FARM-2024-002",
      fecha_validez_carnet: "2025-06-30",
      fecha_solicitud: "2024-01-20",
      fecha_aprobacion: "2024-02-15",
      pertenece_brigada_medica: false,
      año_inicio_paro: null,
      meses_en_paro: 0
    }
  ];

  console.log('Inserting test professionals:', testProfessionals);

  const { data, error } = await supabase
    .from('profesionales_sanitarios')
    .insert(testProfessionals)
    .select();

  if (error) {
    console.error('Error inserting test professionals:', error);
    throw error;
  }

  console.log('Test professionals inserted successfully:', data);
  return data;
};
