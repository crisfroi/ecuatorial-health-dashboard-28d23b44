export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      busqueda_profesionales_publica: {
        Row: {
          area_profesional: string | null
          created_at: string | null
          estado_solicitud: string | null
          fecha_validez: string | null
          id: string
          nombre_completo: string | null
          numero_carnet: string | null
          profesional_id: string | null
        }
        Insert: {
          area_profesional?: string | null
          created_at?: string | null
          estado_solicitud?: string | null
          fecha_validez?: string | null
          id?: string
          nombre_completo?: string | null
          numero_carnet?: string | null
          profesional_id?: string | null
        }
        Update: {
          area_profesional?: string | null
          created_at?: string | null
          estado_solicitud?: string | null
          fecha_validez?: string | null
          id?: string
          nombre_completo?: string | null
          numero_carnet?: string | null
          profesional_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "busqueda_profesionales_publica_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: true
            referencedRelation: "profesionales_sanitarios"
            referencedColumns: ["id"]
          },
        ]
      }
      carnets_generados: {
        Row: {
          created_at: string | null
          fecha_generacion: string | null
          id: string
          profesional_id: string
          url_carnet: string
        }
        Insert: {
          created_at?: string | null
          fecha_generacion?: string | null
          id?: string
          profesional_id: string
          url_carnet: string
        }
        Update: {
          created_at?: string | null
          fecha_generacion?: string | null
          id?: string
          profesional_id?: string
          url_carnet?: string
        }
        Relationships: [
          {
            foreignKeyName: "carnets_generados_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: true
            referencedRelation: "profesionales_sanitarios"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_titulacion: {
        Row: {
          codigo_color: string
          created_at: string | null
          descripcion: string | null
          id: number
          nombre: string
          updated_at: string | null
        }
        Insert: {
          codigo_color: string
          created_at?: string | null
          descripcion?: string | null
          id?: number
          nombre: string
          updated_at?: string | null
        }
        Update: {
          codigo_color?: string
          created_at?: string | null
          descripcion?: string | null
          id?: number
          nombre?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      centros_salud: {
        Row: {
          categoria: string
          created_at: string | null
          director: string | null
          distrito: string
          distrito_sanitario: string | null
          distrito_sanitario_id: number | null
          especialidades: string[] | null
          estado: string | null
          id: string
          nombre: string
          provincia: string
          sector: string
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          categoria: string
          created_at?: string | null
          director?: string | null
          distrito: string
          distrito_sanitario?: string | null
          distrito_sanitario_id?: number | null
          especialidades?: string[] | null
          estado?: string | null
          id?: string
          nombre: string
          provincia: string
          sector: string
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          categoria?: string
          created_at?: string | null
          director?: string | null
          distrito?: string
          distrito_sanitario?: string | null
          distrito_sanitario_id?: number | null
          especialidades?: string[] | null
          estado?: string | null
          id?: string
          nombre?: string
          provincia?: string
          sector?: string
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cola_generacion_carnets: {
        Row: {
          created_at: string | null
          estado: string | null
          id: string
          intentos: number | null
          mensaje_error: string | null
          profesional_id: string | null
          updated_at: string | null
          url_carnet: string | null
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          id?: string
          intentos?: number | null
          mensaje_error?: string | null
          profesional_id?: string | null
          updated_at?: string | null
          url_carnet?: string | null
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          id?: string
          intentos?: number | null
          mensaje_error?: string | null
          profesional_id?: string | null
          updated_at?: string | null
          url_carnet?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cola_generacion_carnets_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profesionales_sanitarios"
            referencedColumns: ["id"]
          },
        ]
      }
      distrito_sanitario: {
        Row: {
          abreviatura_distrito: string | null
          abreviatura_provincia: string | null
          nombre_distrito: string
          nombre_provincia: string | null
        }
        Insert: {
          abreviatura_distrito?: string | null
          abreviatura_provincia?: string | null
          nombre_distrito: string
          nombre_provincia?: string | null
        }
        Update: {
          abreviatura_distrito?: string | null
          abreviatura_provincia?: string | null
          nombre_distrito?: string
          nombre_provincia?: string | null
        }
        Relationships: []
      }
      incidencias_hospitalarias: {
        Row: {
          created_at: string | null
          descripcion: string | null
          estado: string | null
          fecha_incidencia: string | null
          fecha_resolucion: string | null
          gravedad: string | null
          id: string
          id_profesional: string | null
          notas_resolucion: string | null
          reportado_por: string | null
          resuelto_por: string | null
          tipo_incidencia: string | null
          titulo_incidencia: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha_incidencia?: string | null
          fecha_resolucion?: string | null
          gravedad?: string | null
          id?: string
          id_profesional?: string | null
          notas_resolucion?: string | null
          reportado_por?: string | null
          resuelto_por?: string | null
          tipo_incidencia?: string | null
          titulo_incidencia: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha_incidencia?: string | null
          fecha_resolucion?: string | null
          gravedad?: string | null
          id?: string
          id_profesional?: string | null
          notas_resolucion?: string | null
          reportado_por?: string | null
          resuelto_por?: string | null
          tipo_incidencia?: string | null
          titulo_incidencia?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidencias_hospitalarias_id_profesional_fkey"
            columns: ["id_profesional"]
            isOneToOne: false
            referencedRelation: "profesionales_sanitarios"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_sistema: {
        Row: {
          accion: string
          descripcion: string | null
          error: boolean | null
          fecha: string | null
          id: number
        }
        Insert: {
          accion: string
          descripcion?: string | null
          error?: boolean | null
          fecha?: string | null
          id?: never
        }
        Update: {
          accion?: string
          descripcion?: string | null
          error?: boolean | null
          fecha?: string | null
          id?: never
        }
        Relationships: []
      }
      nacionalidades_gentilicios: {
        Row: {
          gentilicio_femenino: string | null
          nacionalidad: string
        }
        Insert: {
          gentilicio_femenino?: string | null
          nacionalidad: string
        }
        Update: {
          gentilicio_femenino?: string | null
          nacionalidad?: string
        }
        Relationships: []
      }
      nacionalidades_mundo: {
        Row: {
          codigo_iso: string | null
          id: number
          nacionalidad: string
          pais: string
        }
        Insert: {
          codigo_iso?: string | null
          id?: number
          nacionalidad: string
          pais: string
        }
        Update: {
          codigo_iso?: string | null
          id?: number
          nacionalidad?: string
          pais?: string
        }
        Relationships: []
      }
      profesional_centro_asignado: {
        Row: {
          categoria_centro: string | null
          distrito_sanitario: string | null
          fecha_asignacion: string | null
          id: string
          id_profesional: string | null
          nombre_centro: string | null
          tipo_sector: string | null
        }
        Insert: {
          categoria_centro?: string | null
          distrito_sanitario?: string | null
          fecha_asignacion?: string | null
          id?: string
          id_profesional?: string | null
          nombre_centro?: string | null
          tipo_sector?: string | null
        }
        Update: {
          categoria_centro?: string | null
          distrito_sanitario?: string | null
          fecha_asignacion?: string | null
          id?: string
          id_profesional?: string | null
          nombre_centro?: string | null
          tipo_sector?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profesional_centro_asignado_id_profesional_fkey"
            columns: ["id_profesional"]
            isOneToOne: false
            referencedRelation: "profesionales_sanitarios"
            referencedColumns: ["id"]
          },
        ]
      }
      profesionales_sanitarios: {
        Row: {
          año_graduacion: number | null
          año_inicio_paro: number | null
          apellidos: string | null
          area_profesional: string | null
          brigada_cooperacion: string | null
          categoria_centro: string | null
          categoria_titulacion: string | null
          centro_salud_id: string | null
          codigo_expediente: string | null
          copia_dip: string | null
          copia_pasaporte: string | null
          creada: string | null
          created_at: string | null
          created_time: string | null
          distrito: string | null
          distrito_sanitario: string | null
          documentos_adicionales: string[] | null
          documentos_cargados: Json | null
          domicilio: string | null
          edad: number | null
          email: string | null
          especialidad: string | null
          estado_solicitud: string | null
          estado_trabajo: string | null
          fecha_alta: string | null
          fecha_aprobacion: string | null
          fecha_caducidad: string | null
          fecha_creacion_solicitud: string | null
          fecha_emision: string | null
          fecha_nacimiento: string | null
          fecha_rechazo: string | null
          fecha_revision: string | null
          fecha_solicitud: string | null
          fecha_validez_carnet: string | null
          foto_carnet: string | null
          funcion_publica: boolean | null
          genero: string | null
          gentilicio_femenino: string | null
          id: string
          id_distrito: string | null
          id_profesional_unico: string | null
          institucion_1: string | null
          institucion_2: string | null
          meses_en_paro: number | null
          motivo_rechazo: string | null
          nacionalidad: string | null
          nombre: string | null
          nombre_centro: string | null
          nombre_completo: string
          notas_aprobacion: string | null
          notas_revision: string | null
          numero_autonumerico_correlativo: number | null
          numero_dip: string | null
          numero_documento: string | null
          numero_pasaporte: string | null
          pais_formacion_1: string | null
          pais_formacion_2: string | null
          pdf_formulario: string | null
          periodo_formacion: string | null
          periodo_formacion_1: string | null
          periodo_formacion_2: string | null
          pertenece_brigada_medica: boolean | null
          provincia: string | null
          puesto_responsabilidad: string | null
          revisor_solicitud: string | null
          situacion_laboral: string | null
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
          urgencia_solicitud: string | null
          url_carnet: string | null
          url_carta_resolucion: string | null
          url_codigo_barras: string | null
          url_codigo_barras_expediente: string | null
          url_pdf: string | null
        }
        Insert: {
          año_graduacion?: number | null
          año_inicio_paro?: number | null
          apellidos?: string | null
          area_profesional?: string | null
          brigada_cooperacion?: string | null
          categoria_centro?: string | null
          categoria_titulacion?: string | null
          centro_salud_id?: string | null
          codigo_expediente?: string | null
          copia_dip?: string | null
          copia_pasaporte?: string | null
          creada?: string | null
          created_at?: string | null
          created_time?: string | null
          distrito?: string | null
          distrito_sanitario?: string | null
          documentos_adicionales?: string[] | null
          documentos_cargados?: Json | null
          domicilio?: string | null
          edad?: number | null
          email?: string | null
          especialidad?: string | null
          estado_solicitud?: string | null
          estado_trabajo?: string | null
          fecha_alta?: string | null
          fecha_aprobacion?: string | null
          fecha_caducidad?: string | null
          fecha_creacion_solicitud?: string | null
          fecha_emision?: string | null
          fecha_nacimiento?: string | null
          fecha_rechazo?: string | null
          fecha_revision?: string | null
          fecha_solicitud?: string | null
          fecha_validez_carnet?: string | null
          foto_carnet?: string | null
          funcion_publica?: boolean | null
          genero?: string | null
          gentilicio_femenino?: string | null
          id?: string
          id_distrito?: string | null
          id_profesional_unico?: string | null
          institucion_1?: string | null
          institucion_2?: string | null
          meses_en_paro?: number | null
          motivo_rechazo?: string | null
          nacionalidad?: string | null
          nombre?: string | null
          nombre_centro?: string | null
          nombre_completo: string
          notas_aprobacion?: string | null
          notas_revision?: string | null
          numero_autonumerico_correlativo?: number | null
          numero_dip?: string | null
          numero_documento?: string | null
          numero_pasaporte?: string | null
          pais_formacion_1?: string | null
          pais_formacion_2?: string | null
          pdf_formulario?: string | null
          periodo_formacion?: string | null
          periodo_formacion_1?: string | null
          periodo_formacion_2?: string | null
          pertenece_brigada_medica?: boolean | null
          provincia?: string | null
          puesto_responsabilidad?: string | null
          revisor_solicitud?: string | null
          situacion_laboral?: string | null
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
          urgencia_solicitud?: string | null
          url_carnet?: string | null
          url_carta_resolucion?: string | null
          url_codigo_barras?: string | null
          url_codigo_barras_expediente?: string | null
          url_pdf?: string | null
        }
        Update: {
          año_graduacion?: number | null
          año_inicio_paro?: number | null
          apellidos?: string | null
          area_profesional?: string | null
          brigada_cooperacion?: string | null
          categoria_centro?: string | null
          categoria_titulacion?: string | null
          centro_salud_id?: string | null
          codigo_expediente?: string | null
          copia_dip?: string | null
          copia_pasaporte?: string | null
          creada?: string | null
          created_at?: string | null
          created_time?: string | null
          distrito?: string | null
          distrito_sanitario?: string | null
          documentos_adicionales?: string[] | null
          documentos_cargados?: Json | null
          domicilio?: string | null
          edad?: number | null
          email?: string | null
          especialidad?: string | null
          estado_solicitud?: string | null
          estado_trabajo?: string | null
          fecha_alta?: string | null
          fecha_aprobacion?: string | null
          fecha_caducidad?: string | null
          fecha_creacion_solicitud?: string | null
          fecha_emision?: string | null
          fecha_nacimiento?: string | null
          fecha_rechazo?: string | null
          fecha_revision?: string | null
          fecha_solicitud?: string | null
          fecha_validez_carnet?: string | null
          foto_carnet?: string | null
          funcion_publica?: boolean | null
          genero?: string | null
          gentilicio_femenino?: string | null
          id?: string
          id_distrito?: string | null
          id_profesional_unico?: string | null
          institucion_1?: string | null
          institucion_2?: string | null
          meses_en_paro?: number | null
          motivo_rechazo?: string | null
          nacionalidad?: string | null
          nombre?: string | null
          nombre_centro?: string | null
          nombre_completo?: string
          notas_aprobacion?: string | null
          notas_revision?: string | null
          numero_autonumerico_correlativo?: number | null
          numero_dip?: string | null
          numero_documento?: string | null
          numero_pasaporte?: string | null
          pais_formacion_1?: string | null
          pais_formacion_2?: string | null
          pdf_formulario?: string | null
          periodo_formacion?: string | null
          periodo_formacion_1?: string | null
          periodo_formacion_2?: string | null
          pertenece_brigada_medica?: boolean | null
          provincia?: string | null
          puesto_responsabilidad?: string | null
          revisor_solicitud?: string | null
          situacion_laboral?: string | null
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
          urgencia_solicitud?: string | null
          url_carnet?: string | null
          url_carta_resolucion?: string | null
          url_codigo_barras?: string | null
          url_codigo_barras_expediente?: string | null
          url_pdf?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profesionales_centro_salud"
            columns: ["centro_salud_id"]
            isOneToOne: false
            referencedRelation: "centros_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profesionales_sanitarios_id_distrito_fkey"
            columns: ["id_distrito"]
            isOneToOne: false
            referencedRelation: "distrito_sanitario"
            referencedColumns: ["nombre_distrito"]
          },
        ]
      }
      sms_notifications_log: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          message_body: string
          notification_type: string
          profesional_id: string | null
          recipient_number: string
          status: string
          twilio_sid: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          message_body: string
          notification_type: string
          profesional_id?: string | null
          recipient_number: string
          status: string
          twilio_sid?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          message_body?: string
          notification_type?: string
          profesional_id?: string | null
          recipient_number?: string
          status?: string
          twilio_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_notifications_log_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profesionales_sanitarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      actualizar_numeros_correlativos_faltantes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      buscar_centros_por_criterios: {
        Args: {
          p_nombre_parcial?: string
          p_categoria?: string
          p_distrito_sanitario?: string
        }
        Returns: {
          id: string
          nombre: string
          categoria: string
          distrito_sanitario: string
          sector: string
          provincia: string
          distrito: string
          total_profesionales: number
        }[]
      }
      calcular_edad: {
        Args: { birth_date: string }
        Returns: number
      }
      generar_codigo_expediente_unico: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generar_url_carnet_profesional: {
        Args: { p_professional_id: string }
        Returns: string
      }
      generar_url_codigo_barras_expediente: {
        Args: {
          codigo_expediente_param: string
          categoria_titulacion_param?: string
        }
        Returns: string
      }
      get_notification_count: {
        Args: { p_profesional_id: string }
        Returns: {
          total_notificaciones: number
          notificaciones_30_dias: number
          notificaciones_10_dias: number
          ultima_notificacion: string
        }[]
      }
      marcar_carnet_generado: {
        Args: { p_profesional_id: string; p_url_carnet: string }
        Returns: boolean
      }
      migrar_relaciones_centros_distritos: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      obtener_color_categoria: {
        Args: { categoria_nombre: string }
        Returns: string
      }
      obtener_profesionales_por_centro: {
        Args: {
          p_centro_id: string
          p_area_profesional?: string
          p_estado_solicitud?: string
        }
        Returns: {
          id: string
          nombre_completo: string
          area_profesional: string
          estado_solicitud: string
          telefono: string
          fecha_alta: string
        }[]
      }
      trigger_renewal_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
