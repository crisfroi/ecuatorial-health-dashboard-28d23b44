import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage } from "@/utils/errorHandler";
import type { Database } from "@/integrations/supabase/types";

export type Profesional =
  Database["public"]["Tables"]["profesionales_sanitarios"]["Row"] & {
    motivo_rechazo?: string;
    universidad?: string;
    lugar_trabajo?: string;
    documento_identidad?: string;
    numero_carnet_profesional?: string;
    foto_carnet_base64?: string;
    fecha_graduacion?: number;
    codigo_barras?: string;
    // Campos opcionales para nuevos cálculos
    estatus_funcionario?: 'nombrado' | 'no_nombrado' | null;
    fecha_nombramiento?: string | null;
    fecha_inicio_trabajo?: string | null;
    fecha_nacimiento?: string | null;
    funcion_publica?: boolean | null;
    fecha_generacion_resolucion?: string | null;
  };

export type ProfesionalInsert =
  Database["public"]["Tables"]["profesionales_sanitarios"]["Insert"];
export type ProfesionalUpdate =
  Database["public"]["Tables"]["profesionales_sanitarios"]["Update"];

// Tipo para las alertas de renovación
export interface ProfesionalAlert {
  id: string;
  nombre_completo: string;
  area_profesional: string;
  fecha_caducidad: string;
  estado_solicitud: string;
  numero_carnet_profesional?: string;
  lugar_trabajo?: string;
  email?: string;
  telefono?: string;
}

// Tipo para Professional (compatibilidad) - ahora incluye todos los campos necesarios
export type Professional = Profesional;

interface Filtros {
  area_profesional?: string;
  estado_solicitud?: string;
  provincia?: string;
  genero?: string;
  tipo_sector?: string;
  distrito?: string;
  distrito_sanitario?: string;
  anoGraduacion?: string;
  lugar_trabajo?: string;
  edad_minima?: number;
  edad_maxima?: number;
  año_graduacion?: number;
  categoria_titulacion?: string;
  categoria_centro?: string;
  funcion_publica?: boolean; // Filtro para funcionarios públicos
  pais_formacion?: string; // País de formación (1 o 2)
  institucion?: string; // Institución de formación (1 o 2)
  // Filtros de fecha
  fecha_solicitud_gte?: string;
  fecha_solicitud_lte?: string;
  // Nuevos filtros calculados (client-side)
  estatus_funcionario?: 'nombrado' | 'no_nombrado';
  edad_laboral_min?: number;
  edad_laboral_max?: number;
  años_servicio_min?: number;
  años_servicio_max?: number;
  años_restantes_jubilacion_min?: number;
  años_restantes_jubilacion_max?: number;
}

// Tipo para filtros de navegación - incluye todas las propiedades necesarias
export interface NavigationFilters {
  area_profesional?: string;
  estado_solicitud?: string;
  provincia?: string;
  genero?: string;
  tipo_sector?: string;
  search?: string;
  distrito?: string;
  distrito_sanitario?: string;
  anoGraduacion?: string;
  lugar_trabajo?: string;
  edad_minima?: number;
  edad_maxima?: number;
  año_graduacion?: number;
  categoria_titulacion?: string;
  categoria_centro?: string;
  funcion_publica?: boolean; // Filtro para funcionarios públicos
  fecha_solicitud_gte?: string;
  fecha_solicitud_lte?: string;
  pais_formacion?: string;
  institucion?: string;
  // Nuevos filtros navegables
  estatus_funcionario?: 'nombrado' | 'no_nombrado';
  edad_laboral_min?: number;
  edad_laboral_max?: number;
  años_servicio_min?: number;
  años_servicio_max?: number;
  años_restantes_jubilacion_min?: number;
  años_restantes_jubilacion_max?: number;
}

function parseISO(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function yearsDiff(from: Date, to: Date): number {
  let years = to.getFullYear() - from.getFullYear();
  const m = to.getMonth() - from.getMonth();
  if (m < 0 || (m === 0 && to.getDate() < from.getDate())) years--;
  return years;
}

export function useProfesionales(filtros: Filtros = {}) {
  return useQuery({
    queryKey: ["profesionales", filtros],
    queryFn: async () => {
      console.log("Fetching profesionales with filters:", filtros);

      let query = supabase
        .from("profesionales_sanitarios")
        .select("*")
        .order("created_at", { ascending: false });

      // Aplicar filtros existentes
      if (filtros.area_profesional && filtros.area_profesional !== "todos") {
        const pattern = `%${filtros.area_profesional}%`;
        query = query.ilike("area_profesional", pattern);
      }

      if (filtros.estado_solicitud && filtros.estado_solicitud !== "todos") {
        query = query.eq("estado_solicitud", filtros.estado_solicitud);
      }

      if (filtros.provincia && filtros.provincia !== "todos") {
        query = query.eq("provincia", filtros.provincia);
      }

      if (filtros.genero && filtros.genero !== "todos") {
        query = query.eq("genero", filtros.genero);
      }

      if (filtros.tipo_sector && filtros.tipo_sector !== "todos") {
        query = query.eq("tipo_sector", filtros.tipo_sector);
      }

      if (filtros.distrito && filtros.distrito !== "todos") {
        query = query.eq("distrito", filtros.distrito);
      }

      if (filtros.distrito_sanitario && filtros.distrito_sanitario !== "todos") {
        query = query.eq("distrito_sanitario", filtros.distrito_sanitario);
      }

      if (filtros.anoGraduacion && filtros.anoGraduacion !== "todos") {
        query = query.eq("año_graduacion", parseInt(filtros.anoGraduacion));
      }

      if ((filtros as any).centro_salud_id) {
        query = query.eq('centro_salud_id', (filtros as any).centro_salud_id);
      }

      if (filtros.lugar_trabajo && filtros.lugar_trabajo !== "todos") {
        query = query.eq("nombre_centro", filtros.lugar_trabajo);
      }

      if (filtros.año_graduacion) {
        query = query.eq("año_graduacion", filtros.año_graduacion);
      }

      if (filtros.edad_minima !== undefined) {
        query = query.gte("edad", filtros.edad_minima);
      }

      if (filtros.edad_maxima !== undefined) {
        query = query.lte("edad", filtros.edad_maxima);
      }

      if (filtros.categoria_titulacion && filtros.categoria_titulacion !== "todos") {
        query = query.eq("categoria_titulacion", filtros.categoria_titulacion);
      }

      if (filtros.categoria_centro && filtros.categoria_centro !== "todos") {
        query = query.eq("categoria_centro", filtros.categoria_centro);
      }

      if (filtros.pais_formacion && filtros.pais_formacion !== "todos") {
        // Buscar por país de formación en cualquiera de las columnas pais_formacion_1 o pais_formacion_2
        query = query.or(
          `pais_formacion_1.eq.${filtros.pais_formacion},pais_formacion_2.eq.${filtros.pais_formacion}`
        );
      }

      if (filtros.institucion && filtros.institucion !== "todos") {
        // Buscar por institución en cualquiera de las columnas institucion_1 o institucion_2
        query = query.or(
          `institucion_1.eq.${filtros.institucion},institucion_2.eq.${filtros.institucion}`
        );
      }

      // --- APLICAR FILTROS DE FECHA ---
      // Asumimos que la columna para la fecha de solicitud es 'created_at' en tu tabla
      if (filtros.fecha_solicitud_gte) {
        query = query.gte("created_at", filtros.fecha_solicitud_gte);
      }
      if (filtros.fecha_solicitud_lte) {
        // Para incluir el día completo de la fecha final, ajustamos la fecha_lte
        // Si la fecha_lte es 'YYYY-MM-DD', Supabase filtra hasta el inicio de ese día.
        // Para incluir todo el día, le sumamos un día y usamos '<' (lt)
        const endDateObj = new Date(filtros.fecha_solicitud_lte);
        endDateObj.setDate(endDateObj.getDate() + 1); // Suma un día
        query = query.lt("created_at", endDateObj.toISOString().split("T")[0]);
        // Alternativa más simple si quieres justo hasta el final del día elegido:
        // query = query.lte('created_at', filtros.fecha_solicitud_lte + 'T23:59:59.999Z');
      }
      // --- FIN FILTROS DE FECHA ---

      // Búsqueda libre (server-side) por nombre, área, ID único, lugar de trabajo
      if (filtros.search && filtros.search.trim()) {
        const term = filtros.search.trim();
        query = query.or(
          `nombre_completo.ilike.%${term}%,area_profesional.ilike.%${term}%,id_profesional_unico.ilike.%${term}%,nombre_centro.ilike.%${term}%`
        );
      }

      // Filtro para funcionarios públicos
      if (filtros.funcion_publica !== undefined) {
        const val = typeof filtros.funcion_publica === 'string' ? filtros.funcion_publica === 'true' : filtros.funcion_publica
        query = query.eq("funcion_publica", val as any);
        // Regla de negocio: para considerar función pública, debe estar Aprobado
        query = query.eq("estado_solicitud", "Aprobado");
      }

      // Filtro por estatus de funcionario (nombrado / no_nombrado)
      if ((filtros as any).estatus_funcionario) {
        query = query.eq('estatus_funcionario', (filtros as any).estatus_funcionario);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching profesionales:", {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          filters: filtros
        });

        const errorMessage = getErrorMessage(error);
        throw new Error(`Failed to fetch professionals: ${errorMessage}`);
      }

      console.log("Fetched profesionales:", data?.length || 0);

      // Aplicar filtros calculados en cliente
      const now = new Date();
      const filtered = (data || []).filter((p: any) => {
        const nacimiento = parseISO(p.fecha_nacimiento);
        const inicioTrabajo = parseISO(p.fecha_inicio_trabajo);
        const nombramiento = parseISO(p.fecha_nombramiento);

        const edadActual = nacimiento ? yearsDiff(nacimiento, now) : null;

        // Edad laboral: desde la fecha más antigua disponible entre inicioTrabajo y nombramiento
        let edadLaboral: number | null = null;
        const posiblesInicios = [inicioTrabajo, nombramiento].filter(Boolean) as Date[];
        if (posiblesInicios.length > 0) {
          const masAntigua = posiblesInicios.reduce((a, b) => (a < b ? a : b));
          edadLaboral = yearsDiff(masAntigua, now);
        }

        // Años de servicio: depende del estatus_funcionario
        let anosServicio: number | null = null;
        if (p.estatus_funcionario === 'nombrado' && nombramiento) {
          anosServicio = yearsDiff(nombramiento, now);
        } else if (p.estatus_funcionario === 'no_nombrado' && inicioTrabajo) {
          anosServicio = yearsDiff(inicioTrabajo, now);
        } else if (!p.estatus_funcionario) {
          // Si no hay estatus, usar el primero disponible
          const start = inicioTrabajo || nombramiento;
          if (start) anosServicio = yearsDiff(start, now);
        }

        // Años restantes hasta jubilación (65)
        const anosRestantes = typeof edadActual === 'number' ? Math.max(0, 65 - edadActual) : null;

        // Validar contra filtros si existen
        if (filtros.edad_laboral_min !== undefined) {
          if (edadLaboral === null || edadLaboral < filtros.edad_laboral_min) return false;
        }
        if (filtros.edad_laboral_max !== undefined) {
          if (edadLaboral === null || edadLaboral > filtros.edad_laboral_max) return false;
        }

        if (filtros.años_servicio_min !== undefined) {
          if (anosServicio === null || anosServicio < filtros.años_servicio_min) return false;
        }
        if (filtros.años_servicio_max !== undefined) {
          if (anosServicio === null || anosServicio > filtros.años_servicio_max) return false;
        }

        if (filtros.años_restantes_jubilacion_min !== undefined) {
          if (anosRestantes === null || anosRestantes < filtros.años_restantes_jubilacion_min) return false;
        }
        if (filtros.años_restantes_jubilacion_max !== undefined) {
          if (anosRestantes === null || anosRestantes > filtros.años_restantes_jubilacion_max) return false;
        }

        return true;
      });

      return filtered;
    },
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if ((error as any)?.code === 'PGRST301') return false;

      // Don't retry on permission errors
      if ((error as any)?.code === 'PGRST116') return false;

      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    onError: (error) => {
      console.error("useProfesionales query failed:", error);
    },
  });
}
