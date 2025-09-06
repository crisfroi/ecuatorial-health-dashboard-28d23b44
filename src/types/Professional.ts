// Interface unificada para Professional basada en la tabla profesionales_sanitarios
export interface Professional {
  id: string;
  nombre_completo: string;
  nombre?: string;
  apellidos?: string;
  genero?: string;
  fecha_nacimiento?: string;
  edad?: number;
  nacionalidad?: string;
  gentilicio_femenino?: string;
  numero_dip?: string;
  numero_pasaporte?: string;
  numero_documento?: string;
  tipo_documento?: string;
  telefono?: string;
  domicilio?: string;
  email?: string;
  
  // Campos profesionales
  area_profesional?: string;
  especialidad?: string;
  numero_carnet_profesional?: string;
  id_profesional_unico?: string;
  fecha_validez_carnet?: string;
  fecha_alta?: string;
  fecha_caducidad?: string;
  fecha_emision?: string;
  
  // Centro de trabajo
  nombre_centro?: string;
  centro_salud_id?: string;
  provincia?: string;
  distrito?: string;
  distrito_sanitario?: string;
  categoria_centro?: string;
  tipo_sector?: string;
  puesto_responsabilidad?: string;
  
  // Estado y solicitud  
  estado_solicitud?: string;
  estado_trabajo?: string;
  fecha_solicitud?: string;
  fecha_aprobacion?: string;
  fecha_revision?: string;
  fecha_rechazo?: string;
  motivo_rechazo?: string;
  notas_revision?: string;
  notas_aprobacion?: string;
  revisor_solicitud?: string;
  urgencia_solicitud?: string;
  
  // Formación
  titulacion_especifica_1?: string;
  tipo_formacion_1?: string;
  institucion_1?: string;
  periodo_formacion_1?: string;
  pais_formacion_1?: string;
  titulacion_especifica_2?: string;
  tipo_formacion_2?: string;
  institucion_2?: string;
  periodo_formacion_2?: string;
  pais_formacion_2?: string;
  año_graduacion?: number;
  periodo_formacion?: string;
  categoria_titulacion?: string;
  
  // Cooperación y trabajo
  pertenece_brigada_medica?: boolean;
  tipo_cooperacion?: string;
  brigada_cooperacion?: string;
  funcion_publica?: boolean;
  situacion_laboral?: string;
  año_inicio_paro?: number;
  meses_en_paro?: number;
  
  // Documentos y archivos
  foto_carnet?: string;
  codigo_expediente?: string;
  url_codigo_barras?: string;
  url_codigo_barras_expediente?: string;
  url_carnet?: string;
  url_pdf?: string;
  url_carta_resolucion?: string;
  pdf_formulario?: string;
  copia_dip?: string;
  copia_pasaporte?: string;
  documentos_cargados?: any;
  documentos_adicionales?: string[];
  titulo_adjunto_1?: string;
  titulo_adjunto_2?: string;
  
  // Metadatos
  numero_autonumerico_correlativo?: number;
  fecha_creacion_solicitud?: string;
  fecha_creacion?: string;
  ultima_modificacion_por?: string;
  created_at?: string;
  updated_at?: string;
  created_time?: string;
  creada?: string;
  
  // Campos adicionales
  id_distrito?: string;
  distrito_sanitario_id?: string;
  
  // Campos calculados para compatibilidad
  documento_identidad?: string; // numero_dip o numero_pasaporte
  lugar_trabajo?: string; // nombre_centro
}

// Tipo para inserción de nuevos profesionales
export type ProfesionalInsert = Omit<Professional, 'id' | 'created_at' | 'updated_at'> & {
  nombre_completo: string;
  area_profesional?: string;
  estado_solicitud?: string;
};