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
      access_day: {
        Row: {
          created_at: string | null
          id: number
          time1_end: string | null
          time1_start: string | null
          time2_end: string | null
          time2_start: string | null
          time3_end: string | null
          time3_start: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: number
          time1_end?: string | null
          time1_start?: string | null
          time2_end?: string | null
          time2_start?: string | null
          time3_end?: string | null
          time3_start?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          time1_end?: string | null
          time1_start?: string | null
          time2_end?: string | null
          time2_start?: string | null
          time3_end?: string | null
          time3_start?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      access_week: {
        Row: {
          created_at: string | null
          fri: number | null
          id: number
          mon: number | null
          sat: number | null
          sun: number | null
          thu: number | null
          tue: number | null
          updated_at: string | null
          wed: number | null
        }
        Insert: {
          created_at?: string | null
          fri?: number | null
          id: number
          mon?: number | null
          sat?: number | null
          sun?: number | null
          thu?: number | null
          tue?: number | null
          updated_at?: string | null
          wed?: number | null
        }
        Update: {
          created_at?: string | null
          fri?: number | null
          id?: number
          mon?: number | null
          sat?: number | null
          sun?: number | null
          thu?: number | null
          tue?: number | null
          updated_at?: string | null
          wed?: number | null
        }
        Relationships: []
      }
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
      areas_profesionales: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      asistencia_auditoria: {
        Row: {
          accion: string
          created_at: string | null
          datos_antes: Json | null
          datos_despues: Json | null
          fichaje_id: string | null
          id: string
          ip_address: unknown
          usuario_id: string | null
        }
        Insert: {
          accion: string
          created_at?: string | null
          datos_antes?: Json | null
          datos_despues?: Json | null
          fichaje_id?: string | null
          id?: string
          ip_address?: unknown
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          created_at?: string | null
          datos_antes?: Json | null
          datos_despues?: Json | null
          fichaje_id?: string | null
          id?: string
          ip_address?: unknown
          usuario_id?: string | null
        }
        Relationships: []
      }
      asistencia_enroll_map: {
        Row: {
          created_at: string | null
          enroll_id: number
          profesional_id: string
        }
        Insert: {
          created_at?: string | null
          enroll_id: number
          profesional_id: string
        }
        Update: {
          created_at?: string | null
          enroll_id?: number
          profesional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asistencia_enroll_map_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: true
            referencedRelation: "profesionales_sanitarios"
            referencedColumns: ["id"]
          },
        ]
      }
      asistencia_fichajes: {
        Row: {
          centro_salud_id: string | null
          created_at: string | null
          device_sn: string
          enroll_id: number
          event: number | null
          id: string
          image_url: string | null
          inout: number | null
          mode: number | null
          profesional_id: string | null
          raw_index: number | null
          temperature: number | null
          time_local: string
        }
        Insert: {
          centro_salud_id?: string | null
          created_at?: string | null
          device_sn: string
          enroll_id: number
          event?: number | null
          id?: string
          image_url?: string | null
          inout?: number | null
          mode?: number | null
          profesional_id?: string | null
          raw_index?: number | null
          temperature?: number | null
          time_local: string
        }
        Update: {
          centro_salud_id?: string | null
          created_at?: string | null
          device_sn?: string
          enroll_id?: number
          event?: number | null
          id?: string
          image_url?: string | null
          inout?: number | null
          mode?: number | null
          profesional_id?: string | null
          raw_index?: number | null
          temperature?: number | null
          time_local?: string
        }
        Relationships: [
          {
            foreignKeyName: "asistencia_fichajes_centro_salud_id_fkey"
            columns: ["centro_salud_id"]
            isOneToOne: false
            referencedRelation: "centros_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencia_fichajes_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profesionales_sanitarios"
            referencedColumns: ["id"]
          },
        ]
      }
      asistencia_resumen_mensual: {
        Row: {
          anio: number
          created_at: string | null
          horas_extra: number | null
          horas_nocturnas: number | null
          horas_trabajadas: number | null
          id: string
          incidencias: Json | null
          mes: number
          profesional_id: string
          total_pagar: number | null
          updated_at: string | null
        }
        Insert: {
          anio: number
          created_at?: string | null
          horas_extra?: number | null
          horas_nocturnas?: number | null
          horas_trabajadas?: number | null
          id?: string
          incidencias?: Json | null
          mes: number
          profesional_id: string
          total_pagar?: number | null
          updated_at?: string | null
        }
        Update: {
          anio?: number
          created_at?: string | null
          horas_extra?: number | null
          horas_nocturnas?: number | null
          horas_trabajadas?: number | null
          id?: string
          incidencias?: Json | null
          mes?: number
          profesional_id?: string
          total_pagar?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asistencia_resumen_mensual_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profesionales_sanitarios"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_logs: {
        Row: {
          created_at: string
          en_no: string | null
          fecha_hora: string
          id: string
          id_dispositivo: string
          id_profesional: string | null
          inout: Database["public"]["Enums"]["inout_type"] | null
          mode: string | null
          raw_line: string | null
          source_file: string | null
          tm_no: string | null
        }
        Insert: {
          created_at?: string
          en_no?: string | null
          fecha_hora: string
          id?: string
          id_dispositivo: string
          id_profesional?: string | null
          inout?: Database["public"]["Enums"]["inout_type"] | null
          mode?: string | null
          raw_line?: string | null
          source_file?: string | null
          tm_no?: string | null
        }
        Update: {
          created_at?: string
          en_no?: string | null
          fecha_hora?: string
          id?: string
          id_dispositivo?: string
          id_profesional?: string | null
          inout?: Database["public"]["Enums"]["inout_type"] | null
          mode?: string | null
          raw_line?: string | null
          source_file?: string | null
          tm_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_logs_id_dispositivo_fkey"
            columns: ["id_dispositivo"]
            isOneToOne: false
            referencedRelation: "dispositivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_logs_id_profesional_fkey"
            columns: ["id_profesional"]
            isOneToOne: false
            referencedRelation: "profesionales_sanitarios"
            referencedColumns: ["id"]
          },
        ]
      }
      baremos: {
        Row: {
          activo: boolean | null
          bonificacion_festivo: number | null
          bonificacion_fin_semana: number | null
          bonificacion_guardia: number | null
          categoria_profesional: string
          created_at: string | null
          created_by: string | null
          descripcion: string | null
          estado: string
          fuente: string | null
          id: string
          monto_base: number
          nombre: string
          observaciones: string | null
          porcentaje_descuentos: number | null
          porcentaje_llamada: number | null
          porcentaje_localizable: number | null
          tipo_dia: string
          tipo_guardia: string
          updated_at: string | null
          vigente_desde: string
          vigente_hasta: string | null
        }
        Insert: {
          activo?: boolean | null
          bonificacion_festivo?: number | null
          bonificacion_fin_semana?: number | null
          bonificacion_guardia?: number | null
          categoria_profesional: string
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          estado?: string
          fuente?: string | null
          id?: string
          monto_base?: number
          nombre: string
          observaciones?: string | null
          porcentaje_descuentos?: number | null
          porcentaje_llamada?: number | null
          porcentaje_localizable?: number | null
          tipo_dia: string
          tipo_guardia: string
          updated_at?: string | null
          vigente_desde?: string
          vigente_hasta?: string | null
        }
        Update: {
          activo?: boolean | null
          bonificacion_festivo?: number | null
          bonificacion_fin_semana?: number | null
          bonificacion_guardia?: number | null
          categoria_profesional?: string
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          estado?: string
          fuente?: string | null
          id?: string
          monto_base?: number
          nombre?: string
          observaciones?: string | null
          porcentaje_descuentos?: number | null
          porcentaje_llamada?: number | null
          porcentaje_localizable?: number | null
          tipo_dia?: string
          tipo_guardia?: string
          updated_at?: string | null
          vigente_desde?: string
          vigente_hasta?: string | null
        }
        Relationships: []
      }
      biometric_sync_logs: {
        Row: {
          created_at: string | null
          device_sn: string
          error_message: string | null
          id: number
          records_synced: number | null
          status: string
          synced_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_sn: string
          error_message?: string | null
          id?: number
          records_synced?: number | null
          status: string
          synced_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_sn?: string
          error_message?: string | null
          id?: number
          records_synced?: number | null
          status?: string
          synced_at?: string | null
        }
        Relationships: []
      }
      bitacora_guardias: {
        Row: {
          accion: string
          detalle: Json | null
          fecha: string | null
          id: string
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
      centro_enno_seq: {
        Row: {
          centro_id: string
          last_enno: number
        }
        Insert: {
          centro_id: string
          last_enno?: number
        }
        Update: {
          centro_id?: string
          last_enno?: number
        }
        Relationships: [
          {
            foreignKeyName: "centro_enno_seq_centro_id_fkey"
            columns: ["centro_id"]
            isOneToOne: true
            referencedRelation: "centros_salud"
            referencedColumns: ["id"]
          },
        ]
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
          fecha_registro: string | null
          fotos_establecimiento: string[] | null
          id: string
          nif: string | null
          nombre: string
          numero_registro: string | null
          profesionales_aprobados_count: number | null
          provincia: string
          responsable: string | null
          sector: string
          subcategoria: string | null
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
          fecha_registro?: string | null
          fotos_establecimiento?: string[] | null
          id?: string
          nif?: string | null
          nombre: string
          numero_registro?: string | null
          profesionales_aprobados_count?: number | null
          provincia: string
          responsable?: string | null
          sector: string
          subcategoria?: string | null
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
          fecha_registro?: string | null
          fotos_establecimiento?: string[] | null
          id?: string
          nif?: string | null
          nombre?: string
          numero_registro?: string | null
          profesionales_aprobados_count?: number | null
          provincia?: string
          responsable?: string | null
          sector?: string
          subcategoria?: string | null
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
      comandos_biometricos: {
        Row: {
          comando_json: Json
          comando_tipo: string
          completado_at: string | null
          creado_por: string | null
          created_at: string | null
          device_sn: string
          enroll_id: number | null
          error_mensaje: string | null
          estado: string
          id: string
          intentos: number | null
          procesado_at: string | null
          profesional_id: string | null
        }
        Insert: {
          comando_json: Json
          comando_tipo: string
          completado_at?: string | null
          creado_por?: string | null
          created_at?: string | null
          device_sn: string
          enroll_id?: number | null
          error_mensaje?: string | null
          estado?: string
          id?: string
          intentos?: number | null
          procesado_at?: string | null
          profesional_id?: string | null
        }
        Update: {
          comando_json?: Json
          comando_tipo?: string
          completado_at?: string | null
          creado_por?: string | null
          created_at?: string | null
          device_sn?: string
          enroll_id?: number | null
          error_mensaje?: string | null
          estado?: string
          id?: string
          intentos?: number | null
          procesado_at?: string | null
          profesional_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comandos_biometricos_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profesionales_sanitarios"
            referencedColumns: ["id"]
          },
        ]
      }
      cuadrantes_biometricos: {
        Row: {
          centro_salud_id: string | null
          created_at: string
          cuadrante_maestro_id: string | null
          fecha: string
          id: string
          id_profesional: string
          turno_id: string
          updated_at: string
        }
        Insert: {
          centro_salud_id?: string | null
          created_at?: string
          cuadrante_maestro_id?: string | null
          fecha: string
          id?: string
          id_profesional: string
          turno_id: string
          updated_at?: string
        }
        Update: {
          centro_salud_id?: string | null
          created_at?: string
          cuadrante_maestro_id?: string | null
          fecha?: string
          id?: string
          id_profesional?: string
          turno_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cuadrantes_biometricos_centro_salud_id_fkey"
            columns: ["centro_salud_id"]
            isOneToOne: false
            referencedRelation: "centros_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cuadrantes_biometricos_id_profesional_fkey"
            columns: ["id_profesional"]
            isOneToOne: false
            referencedRelation: "profesionales_sanitarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cuadrantes_biometricos_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos_biometricos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cuadrante_maestro"
            columns: ["cuadrante_maestro_id"]
            isOneToOne: false
            referencedRelation: "cuadrantes_maestros"
            referencedColumns: ["id"]
          },
        ]
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
      cuadrantes_maestros: {
        Row: {
          centro_salud_id: string
          created_at: string | null
          id: string
          nombre: string
          updated_at: string | null
        }
        Insert: {
          centro_salud_id: string
          created_at?: string | null
          id?: string
          nombre: string
          updated_at?: string | null
        }
        Update: {
          centro_salud_id?: string
          created_at?: string | null
          id?: string
          nombre?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_centro_salud"
            columns: ["centro_salud_id"]
            isOneToOne: false
            referencedRelation: "centros_salud"
            referencedColumns: ["id"]
          },
        ]
      }
      device: {
        Row: {
          created_at: string | null
          id: number
          serial_num: string
          status: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          serial_num: string
          status?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          serial_num?: string
          status?: number
          updated_at?: string | null
        }
        Relationships: []
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
      dispositivos: {
        Row: {
          activo: boolean
          centro_salud_id: string | null
          created_at: string
          device_sn: string | null
          id: string
          last_seen_at: string | null
          nombre: string
          tm_no: number | null
          ubicacion: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          centro_salud_id?: string | null
          created_at?: string
          device_sn?: string | null
          id?: string
          last_seen_at?: string | null
          nombre: string
          tm_no?: number | null
          ubicacion?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          centro_salud_id?: string | null
          created_at?: string
          device_sn?: string | null
          id?: string
          last_seen_at?: string | null
          nombre?: string
          tm_no?: number | null
          ubicacion?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispositivos_centro_salud_id_fkey"
            columns: ["centro_salud_id"]
            isOneToOne: false
            referencedRelation: "centros_salud"
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
      dynamic_forms: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          fields: Json
          id: string
          is_active: boolean | null
          public_settings: Json
          settings: Json
          submissions_count: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          fields?: Json
          id?: string
          is_active?: boolean | null
          public_settings?: Json
          settings?: Json
          submissions_count?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          fields?: Json
          id?: string
          is_active?: boolean | null
          public_settings?: Json
          settings?: Json
          submissions_count?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      empleado_dispositivo_map: {
        Row: {
          created_at: string
          en_no: string
          enroll_id: number | null
          id: string
          id_dispositivo: string
          id_profesional: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          en_no: string
          enroll_id?: number | null
          id?: string
          id_dispositivo: string
          id_profesional: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          en_no?: string
          enroll_id?: number | null
          id?: string
          id_dispositivo?: string
          id_profesional?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "empleado_dispositivo_map_id_dispositivo_fkey"
            columns: ["id_dispositivo"]
            isOneToOne: false
            referencedRelation: "dispositivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empleado_dispositivo_map_id_profesional_fkey"
            columns: ["id_profesional"]
            isOneToOne: false
            referencedRelation: "profesionales_sanitarios"
            referencedColumns: ["id"]
          },
        ]
      }
      enroll_info: {
        Row: {
          backupnum: number
          created_at: string | null
          enroll_id: number
          id: number
          imagepath: string | null
          signatures: string | null
          updated_at: string | null
        }
        Insert: {
          backupnum: number
          created_at?: string | null
          enroll_id: number
          id?: number
          imagepath?: string | null
          signatures?: string | null
          updated_at?: string | null
        }
        Update: {
          backupnum?: number
          created_at?: string | null
          enroll_id?: number
          id?: number
          imagepath?: string | null
          signatures?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enroll_info_enroll_id_fkey"
            columns: ["enroll_id"]
            isOneToOne: false
            referencedRelation: "person"
            referencedColumns: ["id"]
          },
        ]
      }
      expedientes_disciplinarios: {
        Row: {
          archivo_adjunto_url: string | null
          autoridad_solicitante: string | null
          centro_salud_id: string | null
          created_at: string
          created_by: string
          descripcion: string | null
          estado: Database["public"]["Enums"]["expediente_estado"]
          falta_codigo: string | null
          fecha_apertura: string
          fecha_incidente: string | null
          gravedad: string | null
          id: string
          inhabilitacion_permanente: boolean
          motivo: string
          multa_monto: number | null
          profesional_id: string
          pruebas_urls: Json
          resolucion_final: string | null
          sancion_fecha_fin: string | null
          sancion_fecha_inicio: string | null
          sancion_tipo: string | null
          updated_at: string
        }
        Insert: {
          archivo_adjunto_url?: string | null
          autoridad_solicitante?: string | null
          centro_salud_id?: string | null
          created_at?: string
          created_by: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["expediente_estado"]
          falta_codigo?: string | null
          fecha_apertura?: string
          fecha_incidente?: string | null
          gravedad?: string | null
          id?: string
          inhabilitacion_permanente?: boolean
          motivo: string
          multa_monto?: number | null
          profesional_id: string
          pruebas_urls?: Json
          resolucion_final?: string | null
          sancion_fecha_fin?: string | null
          sancion_fecha_inicio?: string | null
          sancion_tipo?: string | null
          updated_at?: string
        }
        Update: {
          archivo_adjunto_url?: string | null
          autoridad_solicitante?: string | null
          centro_salud_id?: string | null
          created_at?: string
          created_by?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["expediente_estado"]
          falta_codigo?: string | null
          fecha_apertura?: string
          fecha_incidente?: string | null
          gravedad?: string | null
          id?: string
          inhabilitacion_permanente?: boolean
          motivo?: string
          multa_monto?: number | null
          profesional_id?: string
          pruebas_urls?: Json
          resolucion_final?: string | null
          sancion_fecha_fin?: string | null
          sancion_fecha_inicio?: string | null
          sancion_tipo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expedientes_disciplinarios_centro_salud_id_fkey"
            columns: ["centro_salud_id"]
            isOneToOne: false
            referencedRelation: "centros_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedientes_disciplinarios_falta_codigo_fkey"
            columns: ["falta_codigo"]
            isOneToOne: false
            referencedRelation: "faltas_catalogo"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "expedientes_disciplinarios_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profesionales_sanitarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedientes_disciplinarios_sancion_tipo_fkey"
            columns: ["sancion_tipo"]
            isOneToOne: false
            referencedRelation: "sanciones_catalogo"
            referencedColumns: ["codigo"]
          },
        ]
      }
      faltas_catalogo: {
        Row: {
          activo: boolean
          categoria: string | null
          codigo: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          categoria?: string | null
          codigo: string
          nombre: string
        }
        Update: {
          activo?: boolean
          categoria?: string | null
          codigo?: string
          nombre?: string
        }
        Relationships: []
      }
      form_submissions: {
        Row: {
          data: Json
          form_id: string
          id: string
          ip_address: unknown
          metadata: Json | null
          status: string | null
          submitted_at: string | null
          submitted_by: string | null
          user_agent: string | null
        }
        Insert: {
          data?: Json
          form_id: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          user_agent?: string | null
        }
        Update: {
          data?: Json
          form_id?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "dynamic_forms"
            referencedColumns: ["id"]
          },
        ]
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
      historial_acciones_expediente: {
        Row: {
          accion: string
          actor_id: string
          comentario: string | null
          created_at: string
          expediente_id: string
          id: string
        }
        Insert: {
          accion: string
          actor_id: string
          comentario?: string | null
          created_at?: string
          expediente_id: string
          id?: string
        }
        Update: {
          accion?: string
          actor_id?: string
          comentario?: string | null
          created_at?: string
          expediente_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historial_acciones_expediente_expediente_id_fkey"
            columns: ["expediente_id"]
            isOneToOne: false
            referencedRelation: "expedientes_disciplinarios"
            referencedColumns: ["id"]
          },
        ]
      }
      horarios_base_profesional: {
        Row: {
          centro_salud_id: string
          created_at: string | null
          dia_semana: number
          id: string
          id_profesional: string
          turno_id: string
          updated_at: string | null
          vigencia_desde: string
          vigencia_hasta: string | null
        }
        Insert: {
          centro_salud_id: string
          created_at?: string | null
          dia_semana: number
          id?: string
          id_profesional: string
          turno_id: string
          updated_at?: string | null
          vigencia_desde: string
          vigencia_hasta?: string | null
        }
        Update: {
          centro_salud_id?: string
          created_at?: string | null
          dia_semana?: number
          id?: string
          id_profesional?: string
          turno_id?: string
          updated_at?: string | null
          vigencia_desde?: string
          vigencia_hasta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_horario_profesional"
            columns: ["id_profesional"]
            isOneToOne: false
            referencedRelation: "profesionales_sanitarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_horario_turno"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos_biometricos"
            referencedColumns: ["id"]
          },
        ]
      }
      horarios_profesionales: {
        Row: {
          activo: boolean | null
          centro_salud_id: string | null
          created_at: string | null
          dia_semana: number
          id: string
          profesional_id: string
          turno_id: string
          vigente_desde: string | null
          vigente_hasta: string | null
        }
        Insert: {
          activo?: boolean | null
          centro_salud_id?: string | null
          created_at?: string | null
          dia_semana: number
          id?: string
          profesional_id: string
          turno_id: string
          vigente_desde?: string | null
          vigente_hasta?: string | null
        }
        Update: {
          activo?: boolean | null
          centro_salud_id?: string | null
          created_at?: string | null
          dia_semana?: number
          id?: string
          profesional_id?: string
          turno_id?: string
          vigente_desde?: string | null
          vigente_hasta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "horarios_profesionales_centro_salud_id_fkey"
            columns: ["centro_salud_id"]
            isOneToOne: false
            referencedRelation: "centros_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "horarios_profesionales_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profesionales_sanitarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "horarios_profesionales_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos_plantillas"
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
      instituciones_formacion: {
        Row: {
          categoria: string
          created_at: string
          id: string
          nombre: string
          pais: string
          pais_id: number | null
        }
        Insert: {
          categoria?: string
          created_at?: string
          id?: string
          nombre: string
          pais: string
          pais_id?: number | null
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          nombre?: string
          pais?: string
          pais_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_institucion_pais"
            columns: ["pais_id"]
            isOneToOne: false
            referencedRelation: "nacionalidades_mundo"
            referencedColumns: ["id"]
          },
        ]
      }
      lock_group: {
        Row: {
          access_week_id: number | null
          created_at: string | null
          id: number
          lock1: number | null
          lock2: number | null
          lock3: number | null
          lock4: number | null
        }
        Insert: {
          access_week_id?: number | null
          created_at?: string | null
          id: number
          lock1?: number | null
          lock2?: number | null
          lock3?: number | null
          lock4?: number | null
        }
        Update: {
          access_week_id?: number | null
          created_at?: string | null
          id?: number
          lock1?: number | null
          lock2?: number | null
          lock3?: number | null
          lock4?: number | null
        }
        Relationships: []
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
      machine_command: {
        Row: {
          content: string | null
          created_at: string | null
          err_count: number | null
          gmt_crate: string | null
          gmt_modified: string | null
          id: number
          name: string | null
          run_time: string | null
          send_status: number | null
          serial: string | null
          status: number | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          err_count?: number | null
          gmt_crate?: string | null
          gmt_modified?: string | null
          id?: number
          name?: string | null
          run_time?: string | null
          send_status?: number | null
          serial?: string | null
          status?: number | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          err_count?: number | null
          gmt_crate?: string | null
          gmt_modified?: string | null
          id?: number
          name?: string | null
          run_time?: string | null
          send_status?: number | null
          serial?: string | null
          status?: number | null
          updated_at?: string | null
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
          cantidad_lineas: number | null
          centro_salud_id: string
          created_at: string | null
          created_by: string | null
          estado: string | null
          id: string
          mes: number
          observaciones: string | null
          periodo: string | null
          total_bruto: number | null
          total_descuentos: number | null
          total_guardias: number | null
          total_importe: number | null
          total_neto: number | null
          total_profesionales: number | null
          updated_at: string | null
        }
        Insert: {
          anio: number
          approved_at?: string | null
          approved_by?: string | null
          cantidad_lineas?: number | null
          centro_salud_id: string
          created_at?: string | null
          created_by?: string | null
          estado?: string | null
          id?: string
          mes: number
          observaciones?: string | null
          periodo?: string | null
          total_bruto?: number | null
          total_descuentos?: number | null
          total_guardias?: number | null
          total_importe?: number | null
          total_neto?: number | null
          total_profesionales?: number | null
          updated_at?: string | null
        }
        Update: {
          anio?: number
          approved_at?: string | null
          approved_by?: string | null
          cantidad_lineas?: number | null
          centro_salud_id?: string
          created_at?: string | null
          created_by?: string | null
          estado?: string | null
          id?: string
          mes?: number
          observaciones?: string | null
          periodo?: string | null
          total_bruto?: number | null
          total_descuentos?: number | null
          total_guardias?: number | null
          total_importe?: number | null
          total_neto?: number | null
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
          bonificacion_festivo: number | null
          bonificacion_fin_semana: number | null
          bonificacion_guardia: number | null
          categoria: Database["public"]["Enums"]["categoria_profesional_guardia"]
          coste_localizable_llamada: number | null
          coste_localizable_programada: number | null
          coste_unitario_festivo: number | null
          coste_unitario_fin_semana: number | null
          coste_unitario_ordinario: number | null
          created_at: string | null
          descuentos: number | null
          detalles: string | null
          guardias_festivos: number | null
          guardias_fines_semana: number | null
          guardias_ordinarias: number | null
          id: string
          localizables_llamadas: number | null
          localizables_programadas: number | null
          monto_base: number | null
          monto_neto: number | null
          nomina_id: string
          profesional_guardia_id: string
          total_linea: number | null
          updated_at: string | null
        }
        Insert: {
          bonificacion_festivo?: number | null
          bonificacion_fin_semana?: number | null
          bonificacion_guardia?: number | null
          categoria: Database["public"]["Enums"]["categoria_profesional_guardia"]
          coste_localizable_llamada?: number | null
          coste_localizable_programada?: number | null
          coste_unitario_festivo?: number | null
          coste_unitario_fin_semana?: number | null
          coste_unitario_ordinario?: number | null
          created_at?: string | null
          descuentos?: number | null
          detalles?: string | null
          guardias_festivos?: number | null
          guardias_fines_semana?: number | null
          guardias_ordinarias?: number | null
          id?: string
          localizables_llamadas?: number | null
          localizables_programadas?: number | null
          monto_base?: number | null
          monto_neto?: number | null
          nomina_id: string
          profesional_guardia_id: string
          total_linea?: number | null
          updated_at?: string | null
        }
        Update: {
          bonificacion_festivo?: number | null
          bonificacion_fin_semana?: number | null
          bonificacion_guardia?: number | null
          categoria?: Database["public"]["Enums"]["categoria_profesional_guardia"]
          coste_localizable_llamada?: number | null
          coste_localizable_programada?: number | null
          coste_unitario_festivo?: number | null
          coste_unitario_fin_semana?: number | null
          coste_unitario_ordinario?: number | null
          created_at?: string | null
          descuentos?: number | null
          detalles?: string | null
          guardias_festivos?: number | null
          guardias_fines_semana?: number | null
          guardias_ordinarias?: number | null
          id?: string
          localizables_llamadas?: number | null
          localizables_programadas?: number | null
          monto_base?: number | null
          monto_neto?: number | null
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
          fecha_aprobacion: string | null
          fecha_pago: string | null
          fecha_procesamiento: string | null
          forma_pago: string
          id: string
          importe: number
          metodo_pago: string | null
          nomina_id: string
          nomina_linea_id: string | null
          observaciones: string | null
          profesional_guardia_id: string
          referencia_pago: string | null
          updated_at: string | null
        }
        Insert: {
          comprobante_url?: string | null
          created_at?: string | null
          created_by?: string | null
          estado?: string | null
          fecha_aprobacion?: string | null
          fecha_pago?: string | null
          fecha_procesamiento?: string | null
          forma_pago: string
          id?: string
          importe: number
          metodo_pago?: string | null
          nomina_id: string
          nomina_linea_id?: string | null
          observaciones?: string | null
          profesional_guardia_id: string
          referencia_pago?: string | null
          updated_at?: string | null
        }
        Update: {
          comprobante_url?: string | null
          created_at?: string | null
          created_by?: string | null
          estado?: string | null
          fecha_aprobacion?: string | null
          fecha_pago?: string | null
          fecha_procesamiento?: string | null
          forma_pago?: string
          id?: string
          importe?: number
          metodo_pago?: string | null
          nomina_id?: string
          nomina_linea_id?: string | null
          observaciones?: string | null
          profesional_guardia_id?: string
          referencia_pago?: string | null
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
      parametros_profesionales: {
        Row: {
          activo: boolean | null
          categoria: Database["public"]["Enums"]["categoria_parametro"]
          color: string | null
          created_at: string | null
          created_by: string | null
          descripcion: string | null
          es_obligatorio: boolean | null
          icono: string | null
          id: string
          nombre: string
          opciones_seleccion: Json | null
          orden_visualizacion: number | null
          tipo_dato: Database["public"]["Enums"]["tipo_dato_parametro"]
          unidad: string | null
          updated_at: string | null
          visible_en_detalles: boolean | null
        }
        Insert: {
          activo?: boolean | null
          categoria?: Database["public"]["Enums"]["categoria_parametro"]
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          es_obligatorio?: boolean | null
          icono?: string | null
          id?: string
          nombre: string
          opciones_seleccion?: Json | null
          orden_visualizacion?: number | null
          tipo_dato: Database["public"]["Enums"]["tipo_dato_parametro"]
          unidad?: string | null
          updated_at?: string | null
          visible_en_detalles?: boolean | null
        }
        Update: {
          activo?: boolean | null
          categoria?: Database["public"]["Enums"]["categoria_parametro"]
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          es_obligatorio?: boolean | null
          icono?: string | null
          id?: string
          nombre?: string
          opciones_seleccion?: Json | null
          orden_visualizacion?: number | null
          tipo_dato?: Database["public"]["Enums"]["tipo_dato_parametro"]
          unidad?: string | null
          updated_at?: string | null
          visible_en_detalles?: boolean | null
        }
        Relationships: []
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
      person: {
        Row: {
          created_at: string | null
          id: number
          name: string
          roll_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: number
          name: string
          roll_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          roll_id?: number | null
          updated_at?: string | null
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
          area_profesional_id: string | null
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
          estatus_funcionario: string | null
          fecha_alta: string | null
          fecha_aprobacion: string | null
          fecha_caducidad: string | null
          fecha_creacion_solicitud: string | null
          fecha_emision: string | null
          fecha_generacion_resolucion: string | null
          fecha_inicio_trabajo: string | null
          fecha_nacimiento: string | null
          fecha_nombramiento: string | null
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
          institucion_formacion_id_1: string | null
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
          numero_enrolamiento_enno: number | null
          numero_funcionario: string | null
          numero_pasaporte: string | null
          numero_tarjeta_rfid: string | null
          pais_formacion_1: string | null
          pais_formacion_2: string | null
          pais_formacion_id_1: number | null
          pdf_formulario: string | null
          periodo_formacion: string | null
          periodo_formacion_1: string | null
          periodo_formacion_2: string | null
          pertenece_brigada_medica: boolean | null
          provincia: string | null
          puesto_responsabilidad: string | null
          recien_graduado: boolean | null
          revisor_solicitud: string | null
          situacion_laboral: string | null
          telefono: string | null
          tipo_cooperacion: string | null
          tipo_formacion_1: string | null
          tipo_formacion_2: string | null
          tipo_sector: string | null
          titulacion_especifica_1: string | null
          titulacion_especifica_2: string | null
          titulo_adjunto_1: string | null
          titulo_adjunto_2: string | null
          ultima_modificacion_por: string | null
          ultimo_trabajo: string | null
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
          area_profesional_id?: string | null
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
          estatus_funcionario?: string | null
          fecha_alta?: string | null
          fecha_aprobacion?: string | null
          fecha_caducidad?: string | null
          fecha_creacion_solicitud?: string | null
          fecha_emision?: string | null
          fecha_generacion_resolucion?: string | null
          fecha_inicio_trabajo?: string | null
          fecha_nacimiento?: string | null
          fecha_nombramiento?: string | null
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
          institucion_formacion_id_1?: string | null
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
          numero_enrolamiento_enno?: number | null
          numero_funcionario?: string | null
          numero_pasaporte?: string | null
          numero_tarjeta_rfid?: string | null
          pais_formacion_1?: string | null
          pais_formacion_2?: string | null
          pais_formacion_id_1?: number | null
          pdf_formulario?: string | null
          periodo_formacion?: string | null
          periodo_formacion_1?: string | null
          periodo_formacion_2?: string | null
          pertenece_brigada_medica?: boolean | null
          provincia?: string | null
          puesto_responsabilidad?: string | null
          recien_graduado?: boolean | null
          revisor_solicitud?: string | null
          situacion_laboral?: string | null
          telefono?: string | null
          tipo_cooperacion?: string | null
          tipo_formacion_1?: string | null
          tipo_formacion_2?: string | null
          tipo_sector?: string | null
          titulacion_especifica_1?: string | null
          titulacion_especifica_2?: string | null
          titulo_adjunto_1?: string | null
          titulo_adjunto_2?: string | null
          ultima_modificacion_por?: string | null
          ultimo_trabajo?: string | null
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
          area_profesional_id?: string | null
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
          estatus_funcionario?: string | null
          fecha_alta?: string | null
          fecha_aprobacion?: string | null
          fecha_caducidad?: string | null
          fecha_creacion_solicitud?: string | null
          fecha_emision?: string | null
          fecha_generacion_resolucion?: string | null
          fecha_inicio_trabajo?: string | null
          fecha_nacimiento?: string | null
          fecha_nombramiento?: string | null
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
          institucion_formacion_id_1?: string | null
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
          numero_enrolamiento_enno?: number | null
          numero_funcionario?: string | null
          numero_pasaporte?: string | null
          numero_tarjeta_rfid?: string | null
          pais_formacion_1?: string | null
          pais_formacion_2?: string | null
          pais_formacion_id_1?: number | null
          pdf_formulario?: string | null
          periodo_formacion?: string | null
          periodo_formacion_1?: string | null
          periodo_formacion_2?: string | null
          pertenece_brigada_medica?: boolean | null
          provincia?: string | null
          puesto_responsabilidad?: string | null
          recien_graduado?: boolean | null
          revisor_solicitud?: string | null
          situacion_laboral?: string | null
          telefono?: string | null
          tipo_cooperacion?: string | null
          tipo_formacion_1?: string | null
          tipo_formacion_2?: string | null
          tipo_sector?: string | null
          titulacion_especifica_1?: string | null
          titulacion_especifica_2?: string | null
          titulo_adjunto_1?: string | null
          titulo_adjunto_2?: string | null
          ultima_modificacion_por?: string | null
          ultimo_trabajo?: string | null
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
            foreignKeyName: "fk_prof_pais_formacion"
            columns: ["pais_formacion_id_1"]
            isOneToOne: false
            referencedRelation: "nacionalidades_mundo"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "profesionales_sanitarios_area_profesional_id_fkey"
            columns: ["area_profesional_id"]
            isOneToOne: false
            referencedRelation: "areas_profesionales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profesionales_sanitarios_id_distrito_fkey"
            columns: ["id_distrito"]
            isOneToOne: false
            referencedRelation: "distrito_sanitario"
            referencedColumns: ["nombre_distrito"]
          },
          {
            foreignKeyName: "profesionales_sanitarios_institucion_formacion_id_1_fkey"
            columns: ["institucion_formacion_id_1"]
            isOneToOne: false
            referencedRelation: "instituciones_formacion"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_indicator_values: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          indicator_id: string
          professional_id: string
          submission_id: string | null
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          indicator_id: string
          professional_id: string
          submission_id?: string | null
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          indicator_id?: string
          professional_id?: string
          submission_id?: string | null
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_indicator_values_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "professional_indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_indicator_values_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profesionales_sanitarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_indicator_values_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_indicators: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          form_id: string | null
          id: string
          is_required: boolean | null
          is_visible: boolean | null
          name: string
          options: Json | null
          order_index: number | null
          type: string
          updated_at: string | null
          validation: Json | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          form_id?: string | null
          id?: string
          is_required?: boolean | null
          is_visible?: boolean | null
          name: string
          options?: Json | null
          order_index?: number | null
          type: string
          updated_at?: string | null
          validation?: Json | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          form_id?: string | null
          id?: string
          is_required?: boolean | null
          is_visible?: boolean | null
          name?: string
          options?: Json | null
          order_index?: number | null
          type?: string
          updated_at?: string | null
          validation?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_indicators_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "dynamic_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      records: {
        Row: {
          created_at: string | null
          day: number | null
          device_serial_num: string | null
          enroll_id: number | null
          event: number | null
          hour: number | null
          id: number
          image: string | null
          intOut: number | null
          minute: number | null
          mode: number | null
          month: number | null
          records_time: string | null
          reserved: number | null
          second: number | null
          temperature: number | null
          updated_at: string | null
          verify_mode: number | null
          workcode: number | null
          year: number | null
        }
        Insert: {
          created_at?: string | null
          day?: number | null
          device_serial_num?: string | null
          enroll_id?: number | null
          event?: number | null
          hour?: number | null
          id?: number
          image?: string | null
          intOut?: number | null
          minute?: number | null
          mode?: number | null
          month?: number | null
          records_time?: string | null
          reserved?: number | null
          second?: number | null
          temperature?: number | null
          updated_at?: string | null
          verify_mode?: number | null
          workcode?: number | null
          year?: number | null
        }
        Update: {
          created_at?: string | null
          day?: number | null
          device_serial_num?: string | null
          enroll_id?: number | null
          event?: number | null
          hour?: number | null
          id?: number
          image?: string | null
          intOut?: number | null
          minute?: number | null
          mode?: number | null
          month?: number | null
          records_time?: string | null
          reserved?: number | null
          second?: number | null
          temperature?: number | null
          updated_at?: string | null
          verify_mode?: number | null
          workcode?: number | null
          year?: number | null
        }
        Relationships: []
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
      sanciones_catalogo: {
        Row: {
          activo: boolean
          codigo: string
          nombre: string
          requiere_monto: boolean
          requiere_periodo: boolean
        }
        Insert: {
          activo?: boolean
          codigo: string
          nombre: string
          requiere_monto?: boolean
          requiere_periodo?: boolean
        }
        Update: {
          activo?: boolean
          codigo?: string
          nombre?: string
          requiere_monto?: boolean
          requiere_periodo?: boolean
        }
        Relationships: []
      }
      slideshow_settings: {
        Row: {
          duration: number
          id: number
          images: Json
          updated_at: string
        }
        Insert: {
          duration?: number
          id?: number
          images?: Json
          updated_at?: string
        }
        Update: {
          duration?: number
          id?: number
          images?: Json
          updated_at?: string
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
      solicitudes_establecimientos: {
        Row: {
          areas_especializadas: string[] | null
          asesor_tecnico: Json | null
          autorizador_id: string | null
          categoria: string
          centro_id: string | null
          created_at: string | null
          direccion: string
          director_responsable: string | null
          distrito_sanitario: string | null
          documentos_adicionales: string[] | null
          email: string | null
          equipamiento_medico: string[] | null
          estado: string | null
          fecha_autorizacion: string | null
          fecha_revision: string | null
          fecha_solicitud: string | null
          fotos_establecimiento: string[] | null
          id: string
          motivo_rechazo: string | null
          nacionalidad_responsable: string | null
          nif: string | null
          nombre_establecimiento: string
          notas_revision: string | null
          numero_camas: number | null
          numero_documento: string | null
          numero_registro: string | null
          numero_solicitud: string | null
          observaciones: string | null
          pdf_url_resolucion: string | null
          pdf_url_solicitud: string | null
          personal_apertura: Json | null
          provincia: string
          revisor_id: string | null
          servicios_ofrecidos: string[] | null
          solicitante_id: string | null
          telefono: string | null
          tipo_documento: string | null
          tipo_servicio: string
          updated_at: string | null
        }
        Insert: {
          areas_especializadas?: string[] | null
          asesor_tecnico?: Json | null
          autorizador_id?: string | null
          categoria: string
          centro_id?: string | null
          created_at?: string | null
          direccion: string
          director_responsable?: string | null
          distrito_sanitario?: string | null
          documentos_adicionales?: string[] | null
          email?: string | null
          equipamiento_medico?: string[] | null
          estado?: string | null
          fecha_autorizacion?: string | null
          fecha_revision?: string | null
          fecha_solicitud?: string | null
          fotos_establecimiento?: string[] | null
          id?: string
          motivo_rechazo?: string | null
          nacionalidad_responsable?: string | null
          nif?: string | null
          nombre_establecimiento: string
          notas_revision?: string | null
          numero_camas?: number | null
          numero_documento?: string | null
          numero_registro?: string | null
          numero_solicitud?: string | null
          observaciones?: string | null
          pdf_url_resolucion?: string | null
          pdf_url_solicitud?: string | null
          personal_apertura?: Json | null
          provincia: string
          revisor_id?: string | null
          servicios_ofrecidos?: string[] | null
          solicitante_id?: string | null
          telefono?: string | null
          tipo_documento?: string | null
          tipo_servicio: string
          updated_at?: string | null
        }
        Update: {
          areas_especializadas?: string[] | null
          asesor_tecnico?: Json | null
          autorizador_id?: string | null
          categoria?: string
          centro_id?: string | null
          created_at?: string | null
          direccion?: string
          director_responsable?: string | null
          distrito_sanitario?: string | null
          documentos_adicionales?: string[] | null
          email?: string | null
          equipamiento_medico?: string[] | null
          estado?: string | null
          fecha_autorizacion?: string | null
          fecha_revision?: string | null
          fecha_solicitud?: string | null
          fotos_establecimiento?: string[] | null
          id?: string
          motivo_rechazo?: string | null
          nacionalidad_responsable?: string | null
          nif?: string | null
          nombre_establecimiento?: string
          notas_revision?: string | null
          numero_camas?: number | null
          numero_documento?: string | null
          numero_registro?: string | null
          numero_solicitud?: string | null
          observaciones?: string | null
          pdf_url_resolucion?: string | null
          pdf_url_solicitud?: string | null
          personal_apertura?: Json | null
          provincia?: string
          revisor_id?: string | null
          servicios_ofrecidos?: string[] | null
          solicitante_id?: string | null
          telefono?: string | null
          tipo_documento?: string | null
          tipo_servicio?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_establecimientos_centro_id_fkey"
            columns: ["centro_id"]
            isOneToOne: false
            referencedRelation: "centros_salud"
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
      solicitudes_traslados: {
        Row: {
          aprobado_por: string | null
          centro_destino_id: string
          centro_origen_id: string | null
          created_at: string | null
          estado: string
          fecha_aprobacion: string | null
          fecha_rechazo: string | null
          fecha_solicitud: string | null
          id: string
          motivo: string
          motivo_rechazo: string | null
          nombre_centro_destino: string
          nombre_centro_origen: string | null
          observaciones: string | null
          profesional_id: string
          rechazado_por: string | null
          solicitado_por: string | null
          updated_at: string | null
        }
        Insert: {
          aprobado_por?: string | null
          centro_destino_id: string
          centro_origen_id?: string | null
          created_at?: string | null
          estado?: string
          fecha_aprobacion?: string | null
          fecha_rechazo?: string | null
          fecha_solicitud?: string | null
          id?: string
          motivo: string
          motivo_rechazo?: string | null
          nombre_centro_destino: string
          nombre_centro_origen?: string | null
          observaciones?: string | null
          profesional_id: string
          rechazado_por?: string | null
          solicitado_por?: string | null
          updated_at?: string | null
        }
        Update: {
          aprobado_por?: string | null
          centro_destino_id?: string
          centro_origen_id?: string | null
          created_at?: string | null
          estado?: string
          fecha_aprobacion?: string | null
          fecha_rechazo?: string | null
          fecha_solicitud?: string | null
          id?: string
          motivo?: string
          motivo_rechazo?: string | null
          nombre_centro_destino?: string
          nombre_centro_origen?: string | null
          observaciones?: string | null
          profesional_id?: string
          rechazado_por?: string | null
          solicitado_por?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_traslados_centro_destino_id_fkey"
            columns: ["centro_destino_id"]
            isOneToOne: false
            referencedRelation: "centros_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_traslados_centro_origen_id_fkey"
            columns: ["centro_origen_id"]
            isOneToOne: false
            referencedRelation: "centros_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_traslados_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profesionales_sanitarios"
            referencedColumns: ["id"]
          },
        ]
      }
      turnos_biometricos: {
        Row: {
          activo: boolean
          centro_salud_id: string | null
          created_at: string
          hora_fin: string
          hora_inicio: string
          id: string
          nombre_turno: string
          tipo: string
          tolerancia_minutos: number
          updated_at: string
        }
        Insert: {
          activo?: boolean
          centro_salud_id?: string | null
          created_at?: string
          hora_fin: string
          hora_inicio: string
          id?: string
          nombre_turno: string
          tipo: string
          tolerancia_minutos?: number
          updated_at?: string
        }
        Update: {
          activo?: boolean
          centro_salud_id?: string | null
          created_at?: string
          hora_fin?: string
          hora_inicio?: string
          id?: string
          nombre_turno?: string
          tipo?: string
          tolerancia_minutos?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "turnos_biometricos_centro_salud_id_fkey"
            columns: ["centro_salud_id"]
            isOneToOne: false
            referencedRelation: "centros_salud"
            referencedColumns: ["id"]
          },
        ]
      }
      turnos_maestros: {
        Row: {
          activo: boolean | null
          centro_salud_id: string | null
          created_at: string | null
          dispositivo_id: string | null
          hora_fin: string
          hora_inicio: string
          id: string
          nombre_turno: string
          sync_a_dispositivo: boolean | null
          tipo: string | null
          tolerancia_entrada_min: number | null
          tolerancia_salida_min: number | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          centro_salud_id?: string | null
          created_at?: string | null
          dispositivo_id?: string | null
          hora_fin: string
          hora_inicio: string
          id?: string
          nombre_turno: string
          sync_a_dispositivo?: boolean | null
          tipo?: string | null
          tolerancia_entrada_min?: number | null
          tolerancia_salida_min?: number | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          centro_salud_id?: string | null
          created_at?: string | null
          dispositivo_id?: string | null
          hora_fin?: string
          hora_inicio?: string
          id?: string
          nombre_turno?: string
          sync_a_dispositivo?: boolean | null
          tipo?: string | null
          tolerancia_entrada_min?: number | null
          tolerancia_salida_min?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "turnos_maestros_centro_salud_id_fkey"
            columns: ["centro_salud_id"]
            isOneToOne: false
            referencedRelation: "centros_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_maestros_dispositivo_id_fkey"
            columns: ["dispositivo_id"]
            isOneToOne: false
            referencedRelation: "dispositivos"
            referencedColumns: ["id"]
          },
        ]
      }
      turnos_plantillas: {
        Row: {
          created_at: string | null
          hora_fin: string
          hora_inicio: string
          id: string
          nocturno: boolean | null
          nombre: string
          tolerancia_minutos: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          hora_fin: string
          hora_inicio: string
          id?: string
          nocturno?: boolean | null
          nombre: string
          tolerancia_minutos?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          hora_fin?: string
          hora_inicio?: string
          id?: string
          nocturno?: boolean | null
          nombre?: string
          tolerancia_minutos?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_lock: {
        Row: {
          created_at: string | null
          end_time: string | null
          enroll_id: number | null
          id: number
          lock_group_id: number | null
          start_time: string | null
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          enroll_id?: number | null
          id?: number
          lock_group_id?: number | null
          start_time?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          enroll_id?: number | null
          id?: number
          lock_group_id?: number | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_lock_enroll_id_fkey"
            columns: ["enroll_id"]
            isOneToOne: false
            referencedRelation: "person"
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
      valores_parametros_profesionales: {
        Row: {
          created_at: string | null
          fecha_registro: string | null
          id: string
          notas: string | null
          parametro_id: string
          profesional_id: string
          registrado_por: string | null
          updated_at: string | null
          valor_archivo_url: string | null
          valor_boolean: boolean | null
          valor_fecha: string | null
          valor_numero: number | null
          valor_seleccion: string[] | null
          valor_texto: string | null
        }
        Insert: {
          created_at?: string | null
          fecha_registro?: string | null
          id?: string
          notas?: string | null
          parametro_id: string
          profesional_id: string
          registrado_por?: string | null
          updated_at?: string | null
          valor_archivo_url?: string | null
          valor_boolean?: boolean | null
          valor_fecha?: string | null
          valor_numero?: number | null
          valor_seleccion?: string[] | null
          valor_texto?: string | null
        }
        Update: {
          created_at?: string | null
          fecha_registro?: string | null
          id?: string
          notas?: string | null
          parametro_id?: string
          profesional_id?: string
          registrado_por?: string | null
          updated_at?: string | null
          valor_archivo_url?: string | null
          valor_boolean?: boolean | null
          valor_fecha?: string | null
          valor_numero?: number | null
          valor_seleccion?: string[] | null
          valor_texto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "valores_parametros_profesionales_parametro_id_fkey"
            columns: ["parametro_id"]
            isOneToOne: false
            referencedRelation: "parametros_profesionales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valores_parametros_profesionales_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profesionales_sanitarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      asistencia_consolidada: {
        Row: {
          centro_salud_id: string | null
          created_at: string | null
          dispositivo_sn: string | null
          event: string | null
          fecha_hora: string | null
          id: string | null
          image_url: string | null
          inout: string | null
          mode: string | null
          nombre_centro: string | null
          nombre_profesional: string | null
          numero_enno: string | null
          profesional_id: string | null
          raw_line: string | null
          source_type: string | null
          temperature: number | null
        }
        Relationships: []
      }
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
      actualizar_estado_profesional: {
        Args: { p_nuevo_estado: string; p_profesional_id: string }
        Returns: string
      }
      actualizar_numeros_correlativos_faltantes: {
        Args: never
        Returns: undefined
      }
      asignar_guardia: {
        Args: {
          p_centro_id: string
          p_fecha_fin: string
          p_fecha_inicio: string
          p_profesional_id: string
          p_tipo?: string
        }
        Returns: string
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
      calcular_edad: { Args: { birth_date: string }; Returns: number }
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
      exec_sql: { Args: { query: string }; Returns: Json }
      generar_codigo_expediente_unico: { Args: never; Returns: string }
      generar_nomina: {
        Args: { p_anio: number; p_centro_id: string; p_mes: number }
        Returns: string
      }
      generar_url_codigo_barras_expediente: {
        Args: {
          categoria_titulacion_param?: string
          codigo_expediente_param: string
        }
        Returns: string
      }
      get_comprehensive_analytics: { Args: never; Returns: Json }
      get_dynamic_schema: { Args: never; Returns: Json }
      get_next_enno: { Args: { p_centro_id: string }; Returns: number }
      get_notification_count: {
        Args: { p_profesional_id: string }
        Returns: {
          notificaciones_10_dias: number
          notificaciones_30_dias: number
          total_notificaciones: number
          ultima_notificacion: string
        }[]
      }
      get_public_analytics: { Args: never; Returns: Json }
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
      insertar_baremos_protocolo: { Args: never; Returns: undefined }
      is_admin_user: { Args: never; Returns: boolean }
      limpiar_comandos_antiguos: { Args: never; Returns: number }
      marcar_carnet_generado: {
        Args: { p_profesional_id: string; p_url_carnet: string }
        Returns: boolean
      }
      migrar_relaciones_centros_distritos: { Args: never; Returns: undefined }
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
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      trigger_renewal_notifications: { Args: never; Returns: undefined }
      unaccent: { Args: { "": string }; Returns: string }
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
      categoria_parametro:
        | "formacion"
        | "condecoracion"
        | "promocion"
        | "incidencia"
        | "evento"
        | "salario"
        | "certificacion"
        | "evaluacion"
        | "disciplinario"
        | "reconocimiento"
        | "otro"
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
      expediente_estado: "abierto" | "en_revision" | "resuelto" | "cerrado"
      expediente_estado_v2:
        | "borrador"
        | "en_investigacion"
        | "audiencia_programada"
        | "pendiente_resolucion"
        | "sancionado"
        | "archivado"
        | "abierto"
        | "en_revision"
        | "resuelto"
        | "cerrado"
      forma_pago: "transfer_trabajador" | "transfer_hospital" | "otro"
      fuente_baremo: "protocol" | "excel" | "manual"
      inout_type: "IN" | "OUT"
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
      tipo_dato_parametro:
        | "texto"
        | "numero"
        | "fecha"
        | "boolean"
        | "seleccion_unica"
        | "seleccion_multiple"
        | "archivo"
        | "moneda"
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
      categoria_parametro: [
        "formacion",
        "condecoracion",
        "promocion",
        "incidencia",
        "evento",
        "salario",
        "certificacion",
        "evaluacion",
        "disciplinario",
        "reconocimiento",
        "otro",
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
      expediente_estado: ["abierto", "en_revision", "resuelto", "cerrado"],
      expediente_estado_v2: [
        "borrador",
        "en_investigacion",
        "audiencia_programada",
        "pendiente_resolucion",
        "sancionado",
        "archivado",
        "abierto",
        "en_revision",
        "resuelto",
        "cerrado",
      ],
      forma_pago: ["transfer_trabajador", "transfer_hospital", "otro"],
      fuente_baremo: ["protocol", "excel", "manual"],
      inout_type: ["IN", "OUT"],
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
      tipo_dato_parametro: [
        "texto",
        "numero",
        "fecha",
        "boolean",
        "seleccion_unica",
        "seleccion_multiple",
        "archivo",
        "moneda",
      ],
      tipo_dia: ["ordinario", "fin_semana", "festivo"],
      tipo_guardia: ["fisica", "localizable", "administrativa"],
    },
  },
} as const
