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
          fecha_creacion_solicitud: string | null
          fecha_nacimiento: string | null
          fecha_revision: string | null
          fecha_solicitud: string | null
          fecha_validez_carnet: string | null
          foto_carnet: string | null
          genero: string | null
          genero_interesado: string | null
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
          notas_revision: string | null
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
          referencia_articulo_genero: string | null
          revisor_solicitud: string | null
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
          tratamiento_genero: string | null
          ultima_modificacion_por: string | null
          updated_at: string | null
          urgencia_solicitud: string | null
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
          fecha_creacion_solicitud?: string | null
          fecha_nacimiento?: string | null
          fecha_revision?: string | null
          fecha_solicitud?: string | null
          fecha_validez_carnet?: string | null
          foto_carnet?: string | null
          genero?: string | null
          genero_interesado?: string | null
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
          notas_revision?: string | null
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
          referencia_articulo_genero?: string | null
          revisor_solicitud?: string | null
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
          tratamiento_genero?: string | null
          ultima_modificacion_por?: string | null
          updated_at?: string | null
          urgencia_solicitud?: string | null
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
          fecha_creacion_solicitud?: string | null
          fecha_nacimiento?: string | null
          fecha_revision?: string | null
          fecha_solicitud?: string | null
          fecha_validez_carnet?: string | null
          foto_carnet?: string | null
          genero?: string | null
          genero_interesado?: string | null
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
          notas_revision?: string | null
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
          referencia_articulo_genero?: string | null
          revisor_solicitud?: string | null
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
          tratamiento_genero?: string | null
          ultima_modificacion_por?: string | null
          updated_at?: string | null
          urgencia_solicitud?: string | null
          url_carta_resolucion?: string | null
          url_codigo_barras?: string | null
          url_pdf?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profesionales_sanitarios_id_distrito_fkey"
            columns: ["id_distrito"]
            isOneToOne: false
            referencedRelation: "distrito_sanitario"
            referencedColumns: ["nombre_distrito"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calcular_edad: {
        Args: { birth_date: string }
        Returns: number
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
