export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profesionales_sanitarios: {
        Row: {
          año_graduacion: number | null
          año_inicio_paro: number | null
          apellidos: string | null
          area_profesional: string | null
          autonumerico_interno: number | null
          brigada_cooperacion: string | null
          categoria_centro: string | null
          codigo_barras: string | null
          codigo_expediente: string | null
          copia_dip: string | null
          copia_pasaporte: string | null
          creada: string | null
          created_at: string | null
          created_time: string | null
          distrito: string | null
          distrito_sanitario: string | null
          domicilio: string | null
          edad: number | null
          especialidad: string | null
          estado_solicitud: string | null
          estado_trabajo: string | null
          fecha_alta: string | null
          fecha_aprobacion: string | null
          fecha_aprobacion_carnet: string | null
          fecha_nacimiento: string | null
          fecha_revision: string | null
          fecha_solicitud: string | null
          fecha_validez_carnet: string | null
          foto_carnet: string | null
          genero: string | null
          gentilicio: string | null
          id: string
          id_profesional_unico: string | null
          institucion_1: string | null
          institucion_2: string | null
          lugar_trabajo: string | null
          meses_en_paro: number | null
          motivo_rechazo: string | null
          nacionalidad: string | null
          nombre: string | null
          nombre_completo: string
          numero_autonumerico_correlativo: number | null
          numero_carnet_profesional: string | null
          numero_correlativo: number | null
          numero_dip: string | null
          numero_documento: string | null
          numero_pasaporte: string | null
          pais_formacion_1: string | null
          pais_formacion_2: string | null
          pdf_formulario: string | null
          periodo_formacion_1: string | null
          periodo_formacion_2: string | null
          pertenece_brigada_medica: boolean | null
          prefijo_area: string | null
          provincia: string | null
          puesto_responsabilidad: string | null
          telefono: string | null
          tipo_cooperacion: string | null
          tipo_documento: string | null
          tipo_formacion_1: string | null
          tipo_formacion_2: string | null
          tipo_sector: string | null
          titulacion_especifica_1: string | null
          titulacion_especifica_2: string | null
          titulo_adjunto_1: string | null
          titulo_adjunto_2: string | null
          ultima_modificacion_por: string | null
          updated_at: string | null
          url_carta_resolucion: string | null
          url_codigo_barras: string | null
          url_pdf: string | null
        }
        Insert: {
          año_graduacion?: number | null
          año_inicio_paro?: number | null
          apellidos?: string | null
          area_profesional?: string | null
          autonumerico_interno?: number | null
          brigada_cooperacion?: string | null
          categoria_centro?: string | null
          codigo_barras?: string | null
          codigo_expediente?: string | null
          copia_dip?: string | null
          copia_pasaporte?: string | null
          creada?: string | null
          created_at?: string | null
          created_time?: string | null
          distrito?: string | null
          distrito_sanitario?: string | null
          domicilio?: string | null
          edad?: number | null
          especialidad?: string | null
          estado_solicitud?: string | null
          estado_trabajo?: string | null
          fecha_alta?: string | null
          fecha_aprobacion?: string | null
          fecha_aprobacion_carnet?: string | null
          fecha_nacimiento?: string | null
          fecha_revision?: string | null
          fecha_solicitud?: string | null
          fecha_validez_carnet?: string | null
          foto_carnet?: string | null
          genero?: string | null
          gentilicio?: string | null
          id?: string
          id_profesional_unico?: string | null
          institucion_1?: string | null
          institucion_2?: string | null
          lugar_trabajo?: string | null
          meses_en_paro?: number | null
          motivo_rechazo?: string | null
          nacionalidad?: string | null
          nombre?: string | null
          nombre_completo: string
          numero_autonumerico_correlativo?: number | null
          numero_carnet_profesional?: string | null
          numero_correlativo?: number | null
          numero_dip?: string | null
          numero_documento?: string | null
          numero_pasaporte?: string | null
          pais_formacion_1?: string | null
          pais_formacion_2?: string | null
          pdf_formulario?: string | null
          periodo_formacion_1?: string | null
          periodo_formacion_2?: string | null
          pertenece_brigada_medica?: boolean | null
          prefijo_area?: string | null
          provincia?: string | null
          puesto_responsabilidad?: string | null
          telefono?: string | null
          tipo_cooperacion?: string | null
          tipo_documento?: string | null
          tipo_formacion_1?: string | null
          tipo_formacion_2?: string | null
          tipo_sector?: string | null
          titulacion_especifica_1?: string | null
          titulacion_especifica_2?: string | null
          titulo_adjunto_1?: string | null
          titulo_adjunto_2?: string | null
          ultima_modificacion_por?: string | null
          updated_at?: string | null
          url_carta_resolucion?: string | null
          url_codigo_barras?: string | null
          url_pdf?: string | null
        }
        Update: {
          año_graduacion?: number | null
          año_inicio_paro?: number | null
          apellidos?: string | null
          area_profesional?: string | null
          autonumerico_interno?: number | null
          brigada_cooperacion?: string | null
          categoria_centro?: string | null
          codigo_barras?: string | null
          codigo_expediente?: string | null
          copia_dip?: string | null
          copia_pasaporte?: string | null
          creada?: string | null
          created_at?: string | null
          created_time?: string | null
          distrito?: string | null
          distrito_sanitario?: string | null
          domicilio?: string | null
          edad?: number | null
          especialidad?: string | null
          estado_solicitud?: string | null
          estado_trabajo?: string | null
          fecha_alta?: string | null
          fecha_aprobacion?: string | null
          fecha_aprobacion_carnet?: string | null
          fecha_nacimiento?: string | null
          fecha_revision?: string | null
          fecha_solicitud?: string | null
          fecha_validez_carnet?: string | null
          foto_carnet?: string | null
          genero?: string | null
          gentilicio?: string | null
          id?: string
          id_profesional_unico?: string | null
          institucion_1?: string | null
          institucion_2?: string | null
          lugar_trabajo?: string | null
          meses_en_paro?: number | null
          motivo_rechazo?: string | null
          nacionalidad?: string | null
          nombre?: string | null
          nombre_completo?: string
          numero_autonumerico_correlativo?: number | null
          numero_carnet_profesional?: string | null
          numero_correlativo?: number | null
          numero_dip?: string | null
          numero_documento?: string | null
          numero_pasaporte?: string | null
          pais_formacion_1?: string | null
          pais_formacion_2?: string | null
          pdf_formulario?: string | null
          periodo_formacion_1?: string | null
          periodo_formacion_2?: string | null
          pertenece_brigada_medica?: boolean | null
          prefijo_area?: string | null
          provincia?: string | null
          puesto_responsabilidad?: string | null
          telefono?: string | null
          tipo_cooperacion?: string | null
          tipo_documento?: string | null
          tipo_formacion_1?: string | null
          tipo_formacion_2?: string | null
          tipo_sector?: string | null
          titulacion_especifica_1?: string | null
          titulacion_especifica_2?: string | null
          titulo_adjunto_1?: string | null
          titulo_adjunto_2?: string | null
          ultima_modificacion_por?: string | null
          updated_at?: string | null
          url_carta_resolucion?: string | null
          url_codigo_barras?: string | null
          url_pdf?: string | null
        }
        Relationships: []
      }
      "RENAPROSA 1": {
        Row: {
          "¿Pertenece usted a alguna Brigada o Cooperación Médica Inter":
            | string
            | null
          "Año de inicio del paro": number | null
          Apellidos: string | null
          "Area Profesional": string | null
          "AUTONUMÉRICO INTERNO": number | null
          "Brigadas y Cooperaciones": string | null
          "Categorias centros": string | null
          "codigo barras(url)": string | null
          "Codigo de Expediente": string
          Creada: string | null
          createdTime: string | null
          Distrito: string | null
          "Distritos Sanitarios": string | null
          Domicilio: string | null
          "Estado Actual  de Trabajo": string | null
          "Estado de Solicitud": string | null
          "Fecha de Aprobación": string | null
          "Fecha de Nacimiento": string | null
          "Fecha de Revisión": string | null
          "Fecha de Solicitud": string | null
          "Foto Carnet": string | null
          "Género o sexo": string | null
          "Gentilicio (from Nacionalidad)": string | null
          id: string | null
          "ID Profesional": string | null
          "IMAGEN CODIGO BARRAS": string | null
          "Institución 1": string | null
          "Institución 2": string | null
          "Lugar de trabajo": string | null
          "Meses en paro": number | null
          "Motivo del rechazo": string | null
          Nacionalidad: string | null
          Nombre: string | null
          "NOMBRE COMPLETO": string
          "NUMERO CORRELATIVO": number | null
          "Número de DIP": number | null
          "Número de Documento": string | null
          "Número de Pasaporte": string | null
          "Número de Teléfono": number | null
          "País de Formación 1": string | null
          "Pais de Formación 2": string | null
          "pdf formulario": string | null
          "Periodo Formación 1": string | null
          "Periodo Formación 2": string | null
          "PREFIJO DE ÁREA": string | null
          "Puesto o Responsabilidad": string | null
          "Seleccione su Brigada o Cooperacíon": string | null
          "Tipo de formación 1": string | null
          "Tipo de formación 2": string | null
          "Tipo de sector": string | null
          "Titulación específica 1": string | null
          "Titulación específica 2": string | null
          "Titulo Adjunto 1": string | null
          "Titulo Adjunto 2": string | null
          "Última modificación por": string | null
          "Url Carta de Resolución": string | null
          "url pdf": string | null
        }
        Insert: {
          "¿Pertenece usted a alguna Brigada o Cooperación Médica Inter"?:
            | string
            | null
          "Año de inicio del paro"?: number | null
          Apellidos?: string | null
          "Area Profesional"?: string | null
          "AUTONUMÉRICO INTERNO"?: number | null
          "Brigadas y Cooperaciones"?: string | null
          "Categorias centros"?: string | null
          "codigo barras(url)"?: string | null
          "Codigo de Expediente": string
          Creada?: string | null
          createdTime?: string | null
          Distrito?: string | null
          "Distritos Sanitarios"?: string | null
          Domicilio?: string | null
          "Estado Actual  de Trabajo"?: string | null
          "Estado de Solicitud"?: string | null
          "Fecha de Aprobación"?: string | null
          "Fecha de Nacimiento"?: string | null
          "Fecha de Revisión"?: string | null
          "Fecha de Solicitud"?: string | null
          "Foto Carnet"?: string | null
          "Género o sexo"?: string | null
          "Gentilicio (from Nacionalidad)"?: string | null
          id?: string | null
          "ID Profesional"?: string | null
          "IMAGEN CODIGO BARRAS"?: string | null
          "Institución 1"?: string | null
          "Institución 2"?: string | null
          "Lugar de trabajo"?: string | null
          "Meses en paro"?: number | null
          "Motivo del rechazo"?: string | null
          Nacionalidad?: string | null
          Nombre?: string | null
          "NOMBRE COMPLETO": string
          "NUMERO CORRELATIVO"?: number | null
          "Número de DIP"?: number | null
          "Número de Documento"?: string | null
          "Número de Pasaporte"?: string | null
          "Número de Teléfono"?: number | null
          "País de Formación 1"?: string | null
          "Pais de Formación 2"?: string | null
          "pdf formulario"?: string | null
          "Periodo Formación 1"?: string | null
          "Periodo Formación 2"?: string | null
          "PREFIJO DE ÁREA"?: string | null
          "Puesto o Responsabilidad"?: string | null
          "Seleccione su Brigada o Cooperacíon"?: string | null
          "Tipo de formación 1"?: string | null
          "Tipo de formación 2"?: string | null
          "Tipo de sector"?: string | null
          "Titulación específica 1"?: string | null
          "Titulación específica 2"?: string | null
          "Titulo Adjunto 1"?: string | null
          "Titulo Adjunto 2"?: string | null
          "Última modificación por"?: string | null
          "Url Carta de Resolución"?: string | null
          "url pdf"?: string | null
        }
        Update: {
          "¿Pertenece usted a alguna Brigada o Cooperación Médica Inter"?:
            | string
            | null
          "Año de inicio del paro"?: number | null
          Apellidos?: string | null
          "Area Profesional"?: string | null
          "AUTONUMÉRICO INTERNO"?: number | null
          "Brigadas y Cooperaciones"?: string | null
          "Categorias centros"?: string | null
          "codigo barras(url)"?: string | null
          "Codigo de Expediente"?: string
          Creada?: string | null
          createdTime?: string | null
          Distrito?: string | null
          "Distritos Sanitarios"?: string | null
          Domicilio?: string | null
          "Estado Actual  de Trabajo"?: string | null
          "Estado de Solicitud"?: string | null
          "Fecha de Aprobación"?: string | null
          "Fecha de Nacimiento"?: string | null
          "Fecha de Revisión"?: string | null
          "Fecha de Solicitud"?: string | null
          "Foto Carnet"?: string | null
          "Género o sexo"?: string | null
          "Gentilicio (from Nacionalidad)"?: string | null
          id?: string | null
          "ID Profesional"?: string | null
          "IMAGEN CODIGO BARRAS"?: string | null
          "Institución 1"?: string | null
          "Institución 2"?: string | null
          "Lugar de trabajo"?: string | null
          "Meses en paro"?: number | null
          "Motivo del rechazo"?: string | null
          Nacionalidad?: string | null
          Nombre?: string | null
          "NOMBRE COMPLETO"?: string
          "NUMERO CORRELATIVO"?: number | null
          "Número de DIP"?: number | null
          "Número de Documento"?: string | null
          "Número de Pasaporte"?: string | null
          "Número de Teléfono"?: number | null
          "País de Formación 1"?: string | null
          "Pais de Formación 2"?: string | null
          "pdf formulario"?: string | null
          "Periodo Formación 1"?: string | null
          "Periodo Formación 2"?: string | null
          "PREFIJO DE ÁREA"?: string | null
          "Puesto o Responsabilidad"?: string | null
          "Seleccione su Brigada o Cooperacíon"?: string | null
          "Tipo de formación 1"?: string | null
          "Tipo de formación 2"?: string | null
          "Tipo de sector"?: string | null
          "Titulación específica 1"?: string | null
          "Titulación específica 2"?: string | null
          "Titulo Adjunto 1"?: string | null
          "Titulo Adjunto 2"?: string | null
          "Última modificación por"?: string | null
          "Url Carta de Resolución"?: string | null
          "url pdf"?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
