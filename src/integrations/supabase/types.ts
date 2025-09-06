export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ajustes_baremos: {
        Row: {
          activo: boolean | null
          categoria: Database["public"]["Enums"]["categoria_profesional_guardia"]
          created_at: string | null
          created_by: string | null
          fuente: string
          id: string
          observaciones: string | null
          porcentaje_llamada: number | null
          porcentaje_localizable: number | null
          tipo_dia: Database["public"]["Enums"]["tipo_dia"]
          tipo_guardia: Database["public"]["Enums"]["tipo_guardia"]
          updated_at: string | null
          valor: number
          vigente_desde: string | null
          vigente_hasta: string | null
        }
        Insert: {
          activo?: boolean | null
          categoria: Database["public"]["Enums"]["categoria_profesional_guardia"]
          created_at?: string | null
          created_by?: string | null
          fuente: string
          id?: string
          observaciones?: string | null
          porcentaje_llamada?: number | null
          porcentaje_localizable?: number | null
          tipo_dia: Database["public"]["Enums"]["tipo_dia"]
          tipo_guardia: Database["public"]["Enums"]["tipo_guardia"]
          updated_at?: string | null
          valor: number
          vigente_desde?: string | null
          vigente_hasta?: string | null
        }
        Update: {
          activo?: boolean | null
          categoria?: Database["public"]["Enums"]["categoria_profesional_guardia"]
          created_at?: string | null
          created_by?: string | null
          fuente?: string
          id?: string
          observaciones?: string | null
          porcentaje_llamada?: number | null
          porcentaje_localizable?: number | null
          tipo_dia?: Database["public"]["Enums"]["tipo_dia"]
          tipo_guardia?: Database["public"]["Enums"]["tipo_guardia"]
          updated_at?: string | null
          valor?: number
          vigente_desde?: string | null
          vigente_hasta?: string | null
        }
        Relationships: []
      }
      bitacora_guardias: {
        Row: {
          accion: string
          detalle: Json | null
          fecha: string | null
          id: string
          ip_address: unknown | null
          ref_id: string
          ref_tipo: string
          user_agent: string | null
          usuario_id: string | null
        }
        Insert: {
          accion: string
          detalle?: Json | null
          fecha?: string | null
          id?: string
          ip_address?: unknown | null
          ref_id: string
          ref_tipo: string
          user_agent?: string | null
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          detalle?: Json | null
          fecha?: string | null
          id?: string
          ip_address?: unknown | null
          ref_id?: string
          ref_tipo?: string
          user_agent?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
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
          profesionales_aprobados_count: number | null
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
          profesionales_aprobados_count?: number | null
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
          profesionales_aprobados_count?: number | null
          provincia?: string
          sector?: string
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cola_generacion_carnets: {
        Row: {
          created_at: string
          estado: string
          id: string
          intentos: number | null
          mensaje_error: string | null
          profesional_id: string
          updated_at: string
          url_carnet: string | null
        }
        Insert: {
          created_at?: string
          estado?: string
          id?: string
          intentos?: number | null
          mensaje_error?: string | null
          profesional_id: string
          updated_at?: string
          url_carnet?: string | null
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          intentos?: number | null
          mensaje_error?: string | null
          profesional_id?: string
          updated_at?: string
          url_carnet?: string | null
        }
        Relationships: []
      }
      cuadrantes_guardias: {
        Row: {
          anio: number
          approved_by: string | null
          auto_asignar: boolean | null
          centro_salud_id: string | null
          considerar_preferencias: boolean | null
          created_at: string | null
          created_by: string | null
          estado: string | null
          fecha_aprobacion: string | null
          fecha_generacion: string | null
          id: string
          mes: number
          observaciones: string | null
          tipo_cuadrante: string
          updated_at: string | null
        }
        Insert: {
          anio: number
          approved_by?: string | null
          auto_asignar?: boolean | null
          centro_salud_id?: string | null
          considerar_preferencias?: boolean | null
          created_at?: string | null
          created_by?: string | null
          estado?: string | null
          fecha_aprobacion?: string | null
          fecha_generacion?: string | null
          id?: string
          mes: number
          observaciones?: string | null
          tipo_cuadrante?: string
          updated_at?: string | null
        }
        Update: {
          anio?: number
          approved_by?: string | null
          auto_asignar?: boolean | null
          centro_salud_id?: string | null
          considerar_preferencias?: boolean | null
          created_at?: string | null
          created_by?: string | null
          estado?: string | null
          fecha_aprobacion?: string | null
          fecha_generacion?: string | null
          id?: string
          mes?: number
          observaciones?: string | null
          tipo_cuadrante?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cuadrantes_guardias_centro_salud_id_fkey"
            columns: ["centro_salud_id"]
            isOneToOne: false
            referencedRelation: "centros_salud"
            referencedColumns: ["id"]
          },
        ]
      }
      dias_festivos: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          fecha: string
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          fecha: string
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          fecha?: string
          id?: string
          nombre?: string
        }
        Relationships: []
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
      guardias: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          caso_atendido: string | null
          centro_salud_id: string | null
          created_at: string | null
          created_by: string | null
          estado: Database["public"]["Enums"]["estado_guardia"] | null
          fecha_fin: string
          fecha_inicio: string
          hora_llamada: string | null
          hora_llegada: string | null
          horas: number | null
          id: string
          localizable_activada: boolean | null
          observaciones: string | null
          profesional_guardia_id: string | null
          servicio_atendido: string | null
          tipo: Database["public"]["Enums"]["tipo_guardia"]
          tipo_dia: Database["public"]["Enums"]["tipo_dia"]
          updated_at: string | null
          validacion_estado:
            | Database["public"]["Enums"]["estado_validacion"]
            | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          caso_atendido?: string | null
          centro_salud_id?: string | null
          created_at?: string | null
          created_by?: string | null
          estado?: Database["public"]["Enums"]["estado_guardia"] | null
          fecha_fin: string
          fecha_inicio: string
          hora_llamada?: string | null
          hora_llegada?: string | null
          horas?: number | null
          id?: string
          localizable_activada?: boolean | null
          observaciones?: string | null
          profesional_guardia_id?: string | null
          servicio_atendido?: string | null
          tipo: Database["public"]["Enums"]["tipo_guardia"]
          tipo_dia: Database["public"]["Enums"]["tipo_dia"]
          updated_at?: string | null
          validacion_estado?:
            | Database["public"]["Enums"]["estado_validacion"]
            | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          caso_atendido?: string | null
          centro_salud_id?: string | null
          created_at?: string | null
          created_by?: string | null
          estado?: Database["public"]["Enums"]["estado_guardia"] | null
          fecha_fin?: string
          fecha_inicio?: string
          hora_llamada?: string | null
          hora_llegada?: string | null
          horas?: number | null
          id?: string
          localizable_activada?: boolean | null
          observaciones?: string | null
          profesional_guardia_id?: string | null
          servicio_atendido?: string | null
          tipo?: Database["public"]["Enums"]["tipo_guardia"]
          tipo_dia?: Database["public"]["Enums"]["tipo_dia"]
          updated_at?: string | null
          validacion_estado?:
            | Database["public"]["Enums"]["estado_validacion"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "guardias_centro_salud_id_fkey"
            columns: ["centro_salud_id"]
            isOneToOne: false
            referencedRelation: "centros_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardias_profesional_guardia_id_fkey"
            columns: ["profesional_guardia_id"]
            isOneToOne: false
            referencedRelation: "profesionales_guardias"
            referencedColumns: ["id"]
          },
        ]
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
      nomina_lineas: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_profesional_guardia"]
          conteo_festivos: number | null
          conteo_fines: number | null
          conteo_ordinarias: number | null
          coste_unitario: number | null
          created_at: string | null
          id: string
          localizable_llamadas: number | null
          localizable_programadas: number | null
          nomina_id: string | null
          profesional_guardia_id: string | null
          total_linea: number | null
        }
        Insert: {
          categoria: Database["public"]["Enums"]["categoria_profesional_guardia"]
          conteo_festivos?: number | null
          conteo_fines?: number | null
          conteo_ordinarias?: number | null
          coste_unitario?: number | null
          created_at?: string | null
          id?: string
          localizable_llamadas?: number | null
          localizable_programadas?: number | null
          nomina_id?: string | null
          profesional_guardia_id?: string | null
          total_linea?: number | null
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_profesional_guardia"]
          conteo_festivos?: number | null
          conteo_fines?: number | null
          conteo_ordinarias?: number | null
          coste_unitario?: number | null
          created_at?: string | null
          id?: string
          localizable_llamadas?: number | null
          localizable_programadas?: number | null
          nomina_id?: string | null
          profesional_guardia_id?: string | null
          total_linea?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nomina_lineas_nomina_id_fkey"
            columns: ["nomina_id"]
            isOneToOne: false
            referencedRelation: "nominas_guardias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nomina_lineas_profesional_guardia_id_fkey"
            columns: ["profesional_guardia_id"]
            isOneToOne: false
            referencedRelation: "profesionales_guardias"
            referencedColumns: ["id"]
          },
        ]
      }
      nominas_guardias: {
        Row: {
          anio: number
          approved_at: string | null
          approved_by: string | null
          centro_salud_id: string
          created_at: string | null
          created_by: string | null
          estado: string | null
          id: string
          mes: number
          observaciones: string | null
          total_guardias: number | null
          total_importe: number | null
          total_profesionales: number | null
          updated_at: string | null
        }
        Insert: {
          anio: number
          approved_at?: string | null
          approved_by?: string | null
          centro_salud_id: string
          created_at?: string | null
          created_by?: string | null
          estado?: string | null
          id?: string
          mes: number
          observaciones?: string | null
          total_guardias?: number | null
          total_importe?: number | null
          total_profesionales?: number | null
          updated_at?: string | null
        }
        Update: {
          anio?: number
          approved_at?: string | null
          approved_by?: string | null
          centro_salud_id?: string
          created_at?: string | null
          created_by?: string | null
          estado?: string | null
          id?: string
          mes?: number
          observaciones?: string | null
          total_guardias?: number | null
          total_importe?: number | null
          total_profesionales?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nominas_guardias_centro_salud_id_fkey"
            columns: ["centro_salud_id"]
            isOneToOne: false
            referencedRelation: "centros_salud"
            referencedColumns: ["id"]
          },
        ]
      }
      nominas_guardias_lineas: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_profesional_guardia"]
          coste_localizable_llamada: number | null
          coste_localizable_programada: number | null
          coste_unitario_festivo: number | null
          coste_unitario_fin_semana: number | null
          coste_unitario_ordinario: number | null
          created_at: string | null
          guardias_festivos: number | null
          guardias_fines_semana: number | null
          guardias_ordinarias: number | null
          id: string
          localizables_llamadas: number | null
          localizables_programadas: number | null
          nomina_id: string
          profesional_guardia_id: string
          total_linea: number | null
          updated_at: string | null
        }
        Insert: {
          categoria: Database["public"]["Enums"]["categoria_profesional_guardia"]
          coste_localizable_llamada?: number | null
          coste_localizable_programada?: number | null
          coste_unitario_festivo?: number | null
          coste_unitario_fin_semana?: number | null
          coste_unitario_ordinario?: number | null
          created_at?: string | null
          guardias_festivos?: number | null
          guardias_fines_semana?: number | null
          guardias_ordinarias?: number | null
          id?: string
          localizables_llamadas?: number | null
          localizables_programadas?: number | null
          nomina_id: string
          profesional_guardia_id: string
          total_linea?: number | null
          updated_at?: string | null
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_profesional_guardia"]
          coste_localizable_llamada?: number | null
          coste_localizable_programada?: number | null
          coste_unitario_festivo?: number | null
          coste_unitario_fin_semana?: number | null
          coste_unitario_ordinario?: number | null
          created_at?: string | null
          guardias_festivos?: number | null
          guardias_fines_semana?: number | null
          guardias_ordinarias?: number | null
          id?: string
          localizables_llamadas?: number | null
          localizables_programadas?: number | null
          nomina_id?: string
          profesional_guardia_id?: string
          total_linea?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nominas_guardias_lineas_nomina_id_fkey"
            columns: ["nomina_id"]
            isOneToOne: false
            referencedRelation: "nominas_guardias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nominas_guardias_lineas_profesional_guardia_id_fkey"
            columns: ["profesional_guardia_id"]
            isOneToOne: false
            referencedRelation: "profesionales_guardias"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones_sms: {
        Row: {
          created_at: string | null
          estado: string
          fecha_envio: string | null
          id: string
          mensaje_sid: string | null
          profesional_id: string
          telefono: string
          tipo_notificacion: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estado?: string
          fecha_envio?: string | null
          id?: string
          mensaje_sid?: string | null
          profesional_id: string
          telefono: string
          tipo_notificacion: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estado?: string
          fecha_envio?: string | null
          id?: string
          mensaje_sid?: string | null
          profesional_id?: string
          telefono?: string
          tipo_notificacion?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_sms_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profesionales_sanitarios"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos_guardias: {
        Row: {
          comprobante_url: string | null
          created_at: string | null
          created_by: string | null
          estado: string | null
          fecha_pago: string | null
          forma_pago: string
          id: string
          importe: number
          nomina_id: string
          observaciones: string | null
          profesional_guardia_id: string
          updated_at: string | null
        }
        Insert: {
          comprobante_url?: string | null
          created_at?: string | null
          created_by?: string | null
          estado?: string | null
          fecha_pago?: string | null
          forma_pago: string
          id?: string
          importe: number
          nomina_id: string
          observaciones?: string | null
          profesional_guardia_id: string
          updated_at?: string | null
        }
        Update: {
          comprobante_url?: string | null
          created_at?: string | null
          created_by?: string | null
          estado?: string | null
          fecha_pago?: string | null
          forma_pago?: string
          id?: string
          importe?: number
          nomina_id?: string
          observaciones?: string | null
          profesional_guardia_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_guardias_nomina_id_fkey"
            columns: ["nomina_id"]
            isOneToOne: false
            referencedRelation: "nominas_guardias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_guardias_profesional_guardia_id_fkey"
            columns: ["profesional_guardia_id"]
            isOneToOne: false
            referencedRelation: "profesionales_guardias"
            referencedColumns: ["id"]
          },
        ]
      }
      permisos_pestanas: {
        Row: {
          created_at: string | null
          id: string
          pestana: string
          puede_aprobar: boolean | null
          puede_editar: boolean | null
          puede_ver: boolean | null
          restricciones: Json | null
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          pestana: string
          puede_aprobar?: boolean | null
          puede_editar?: boolean | null
          puede_ver?: boolean | null
          restricciones?: Json | null
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          pestana?: string
          puede_aprobar?: boolean | null
          puede_editar?: boolean | null
          puede_ver?: boolean | null
          restricciones?: Json | null
          updated_at?: string | null
          usuario_id?: string
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
      profesionales_guardias: {
        Row: {
          activo: boolean | null
          banco: string | null
          categoria: Database["public"]["Enums"]["categoria_profesional_guardia"]
          created_at: string | null
          email_guardias: string | null
          iban_cuenta: string | null
          id: string
          profesional_id: string | null
          telefono_guardias: string | null
          unidad_servicio: string
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          banco?: string | null
          categoria: Database["public"]["Enums"]["categoria_profesional_guardia"]
          created_at?: string | null
          email_guardias?: string | null
          iban_cuenta?: string | null
          id?: string
          profesional_id?: string | null
          telefono_guardias?: string | null
          unidad_servicio: string
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          banco?: string | null
          categoria?: Database["public"]["Enums"]["categoria_profesional_guardia"]
          created_at?: string | null
          email_guardias?: string | null
          iban_cuenta?: string | null
          id?: string
          profesional_id?: string | null
          telefono_guardias?: string | null
          unidad_servicio?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profesionales_guardias_profesional_id_fkey"
            columns: ["profesional_id"]
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
          distrito_sanitario_id: string | null
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
          distrito_sanitario_id?: string | null
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
          distrito_sanitario_id?: string | null
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
            foreignKeyName: "fk_profesional_centro_salud"
            columns: ["centro_salud_id"]
            isOneToOne: false
            referencedRelation: "centros_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_profesional_distrito"
            columns: ["distrito_sanitario"]
            isOneToOne: false
            referencedRelation: "distrito_sanitario"
            referencedColumns: ["nombre_distrito"]
          },
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
      role_permissions: {
        Row: {
          center_restricted: boolean | null
          created_at: string | null
          id: string
          permission: string
          resource: string | null
          role: string
        }
        Insert: {
          center_restricted?: boolean | null
          created_at?: string | null
          id?: string
          permission: string
          resource?: string | null
          role: string
        }
        Update: {
          center_restricted?: boolean | null
          created_at?: string | null
          id?: string
          permission?: string
          resource?: string | null
          role?: string
        }
        Relationships: []
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
      solicitudes_traslado: {
        Row: {
          aprobado_por: string | null
          centro_destino_id: string
          centro_origen_id: string | null
          created_at: string | null
          estado: string
          fecha_aprobacion: string | null
          fecha_solicitud: string | null
          id: string
          motivo: string
          observaciones: string | null
          profesional_id: string
          solicitante_id: string
          updated_at: string | null
        }
        Insert: {
          aprobado_por?: string | null
          centro_destino_id: string
          centro_origen_id?: string | null
          created_at?: string | null
          estado?: string
          fecha_aprobacion?: string | null
          fecha_solicitud?: string | null
          id?: string
          motivo: string
          observaciones?: string | null
          profesional_id: string
          solicitante_id: string
          updated_at?: string | null
        }
        Update: {
          aprobado_por?: string | null
          centro_destino_id?: string
          centro_origen_id?: string | null
          created_at?: string | null
          estado?: string
          fecha_aprobacion?: string | null
          fecha_solicitud?: string | null
          id?: string
          motivo?: string
          observaciones?: string | null
          profesional_id?: string
          solicitante_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_traslado_centro_destino_id_fkey"
            columns: ["centro_destino_id"]
            isOneToOne: false
            referencedRelation: "centros_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_traslado_centro_origen_id_fkey"
            columns: ["centro_origen_id"]
            isOneToOne: false
            referencedRelation: "centros_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_traslado_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profesionales_sanitarios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          assigned_center_id: string | null
          centro_asignado_id: string | null
          configuracion_role: Json | null
          created_at: string | null
          created_by: string | null
          department: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          permisos_especiales: Json | null
          role: string
          updated_at: string | null
        }
        Insert: {
          assigned_center_id?: string | null
          centro_asignado_id?: string | null
          configuracion_role?: Json | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          permisos_especiales?: Json | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          assigned_center_id?: string | null
          centro_asignado_id?: string | null
          configuracion_role?: Json | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          permisos_especiales?: Json | null
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_userprofile_assigned_center"
            columns: ["assigned_center_id"]
            isOneToOne: false
            referencedRelation: "centros_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_assigned_center_id_fkey"
            columns: ["assigned_center_id"]
            isOneToOne: false
            referencedRelation: "centros_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_centro_asignado_id_fkey"
            columns: ["centro_asignado_id"]
            isOneToOne: false
            referencedRelation: "centros_salud"
            referencedColumns: ["id"]
          },
        ]
      }
      validaciones_guardias: {
        Row: {
          comentario: string | null
          created_at: string | null
          etapa: Database["public"]["Enums"]["etapa_validacion"]
          fecha: string | null
          firma: string | null
          guardia_id: string | null
          id: string
          resultado: string | null
          usuario_id: string | null
        }
        Insert: {
          comentario?: string | null
          created_at?: string | null
          etapa: Database["public"]["Enums"]["etapa_validacion"]
          fecha?: string | null
          firma?: string | null
          guardia_id?: string | null
          id?: string
          resultado?: string | null
          usuario_id?: string | null
        }
        Update: {
          comentario?: string | null
          created_at?: string | null
          etapa?: Database["public"]["Enums"]["etapa_validacion"]
          fecha?: string | null
          firma?: string | null
          guardia_id?: string | null
          id?: string
          resultado?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "validaciones_guardias_guardia_id_fkey"
            columns: ["guardia_id"]
            isOneToOne: false
            referencedRelation: "guardias"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      usuarios_con_centro: {
        Row: {
          assigned_center_id: string | null
          categoria_centro: string | null
          created_at: string | null
          distrito: string | null
          email: string | null
          full_name: string | null
          id: string | null
          is_active: boolean | null
          nombre_centro: string | null
          provincia: string | null
          role: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_userprofile_assigned_center"
            columns: ["assigned_center_id"]
            isOneToOne: false
            referencedRelation: "centros_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_assigned_center_id_fkey"
            columns: ["assigned_center_id"]
            isOneToOne: false
            referencedRelation: "centros_salud"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      actualizar_numeros_correlativos_faltantes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      buscar_centros_por_criterios: {
        Args: {
          p_categoria?: string
          p_distrito_sanitario?: string
          p_nombre_parcial?: string
        }
        Returns: {
          categoria: string
          distrito: string
          distrito_sanitario: string
          id: string
          nombre: string
          provincia: string
          sector: string
          total_profesionales: number
        }[]
      }
      calcular_edad: {
        Args: { birth_date: string }
        Returns: number
      }
      calcular_tipo_dia: {
        Args: { fecha_fin: string; fecha_inicio: string }
        Returns: Database["public"]["Enums"]["tipo_dia"]
      }
      can_access_resource: {
        Args: {
          required_permission: string
          resource_name: string
          target_center_id?: string
          user_id: string
        }
        Returns: boolean
      }
      generar_codigo_expediente_unico: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generar_url_codigo_barras_expediente: {
        Args: {
          categoria_titulacion_param?: string
          codigo_expediente_param: string
        }
        Returns: string
      }
      get_comprehensive_analytics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_notification_count: {
        Args: { p_profesional_id: string }
        Returns: {
          notificaciones_10_dias: number
          notificaciones_30_dias: number
          total_notificaciones: number
          ultima_notificacion: string
        }[]
      }
      get_public_analytics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_permissions: {
        Args: { user_id: string }
        Returns: {
          assigned_center_id: string
          center_restricted: boolean
          permission: string
          resource: string
          role: string
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      insertar_baremos_protocolo: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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
          p_area_profesional?: string
          p_centro_id: string
          p_estado_solicitud?: string
        }
        Returns: {
          area_profesional: string
          estado_solicitud: string
          fecha_alta: string
          id: string
          nombre_completo: string
          telefono: string
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      trigger_renewal_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "SUPER_ADMINISTRADOR"
        | "RRHH_MINISTERIO"
        | "MIEMBRO_GOBIERNO"
        | "HABILITACION"
        | "ADMIN_CENTRO_SANITARIO"
        | "REVISOR_SOLICITUDES"
        | "PERSONALIDAD_MINISTERIAL"
        | "OBSERVADOR"
        | "DIRECTIVO_CENTRO_SANITARIO"
      categoria_profesional_guardia:
        | "especialista"
        | "general_licenciado"
        | "tecnico_diplomado"
        | "auxiliar"
        | "subalterno"
        | "odepac"
        | "secre_asist_pacientes"
        | "caja"
      estado_guardia: "borrador" | "planificada" | "realizada" | "no_presentado"
      estado_validacion: "pendiente" | "validada" | "rechazada"
      etapa_validacion:
        | "dir_medica"
        | "dir_admin"
        | "dir_enfermeria"
        | "jefe_rrhh"
        | "admin_hospital"
        | "dir_gerente"
        | "dg_coordinacion"
      forma_pago: "transfer_trabajador" | "transfer_hospital" | "otro"
      fuente_baremo: "protocol" | "excel" | "manual"
      rol_usuario_guardias:
        | "admin"
        | "validador"
        | "visualizador"
        | "rrhh"
        | "dir_medica"
        | "dir_admin"
        | "dir_enfermeria"
        | "dir_gerente"
        | "dg"
      tipo_dia: "ordinario" | "fin_semana" | "festivo"
      tipo_guardia: "fisica" | "localizable" | "administrativa"
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
    Enums: {
      app_role: [
        "SUPER_ADMINISTRADOR",
        "RRHH_MINISTERIO",
        "MIEMBRO_GOBIERNO",
        "HABILITACION",
        "ADMIN_CENTRO_SANITARIO",
        "REVISOR_SOLICITUDES",
        "PERSONALIDAD_MINISTERIAL",
        "OBSERVADOR",
        "DIRECTIVO_CENTRO_SANITARIO",
      ],
      categoria_profesional_guardia: [
        "especialista",
        "general_licenciado",
        "tecnico_diplomado",
        "auxiliar",
        "subalterno",
        "odepac",
        "secre_asist_pacientes",
        "caja",
      ],
      estado_guardia: ["borrador", "planificada", "realizada", "no_presentado"],
      estado_validacion: ["pendiente", "validada", "rechazada"],
      etapa_validacion: [
        "dir_medica",
        "dir_admin",
        "dir_enfermeria",
        "jefe_rrhh",
        "admin_hospital",
        "dir_gerente",
        "dg_coordinacion",
      ],
      forma_pago: ["transfer_trabajador", "transfer_hospital", "otro"],
      fuente_baremo: ["protocol", "excel", "manual"],
      rol_usuario_guardias: [
        "admin",
        "validador",
        "visualizador",
        "rrhh",
        "dir_medica",
        "dir_admin",
        "dir_enfermeria",
        "dir_gerente",
        "dg",
      ],
      tipo_dia: ["ordinario", "fin_semana", "festivo"],
      tipo_guardia: ["fisica", "localizable", "administrativa"],
    },
  },
} as const
