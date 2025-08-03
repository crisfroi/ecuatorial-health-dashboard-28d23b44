
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EstadisticasData {
  total: number;
  aprobados: number;
  pendientes: number;  // Será "Pendiente de Firma"
  recibidos: number;
  rechazados: number;
  revisando: number;
  vencimientosProximos: number;
  carnetVencidos: number;
  porArea: any;
  porProvincia: any;
  generoMasculino: any;
  generoFemenino: any;
  totalPorGenero: any;
  totalPorDistrito: any;
  totalPorTipoSector: any;
  totalPorNacionalidad: any;
  totalPorAreaProfesional: any;
  totalPorEstadoSolicitud: any;
  totalPorDistritoSanitario: any;
  datosGraficoProvincias: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  // Propiedades adicionales requeridas por los componentes
  datosGraficoAreas: Array<{
    area: string;
    cantidad: number;
  }>;
  datosGraficoEstados: Array<{
    estado: string;
    cantidad: number;
    color: string;
  }>;
  tendenciasMensuales?: Array<{
    mes: string;
    registros: number;
  }>;
  tasaAprobacion?: string;
  tasaRechazo?: string;
  porGenero?: any;
  porTipoSector?: any;
  porDistrito?: any;
  porAnoGraduacion?: any;
}

export function useEstadisticas() {
  return useQuery({
    queryKey: ["estadisticas"],
    queryFn: async (): Promise<EstadisticasData> => {
      console.log("🔄 Fetching estadísticas...");

      const { data: profesionales, error } = await supabase
        .from("profesionales_sanitarios")
        .select("*");

      if (error) {
        console.error("❌ Error fetching estadísticas:", error);
        // En lugar de lanzar el error, devolvemos datos vacíos pero válidos
        console.log("⚠️ Returning empty stats due to error");
        return {
          total: 0,
          aprobados: 0,
          pendientes: 0,
          recibidos: 0,
          rechazados: 0,
          revisando: 0,
          vencimientosProximos: 0,
          carnetVencidos: 0,
          porArea: {},
          porProvincia: {},
          generoMasculino: 0,
          generoFemenino: 0,
          totalPorGenero: {},
          totalPorDistrito: {},
          totalPorTipoSector: {},
          totalPorNacionalidad: {},
          totalPorAreaProfesional: {},
          totalPorEstadoSolicitud: {},
          totalPorDistritoSanitario: {},
          datosGraficoProvincias: [],
          datosGraficoAreas: [],
          datosGraficoEstados: [],
          tasaAprobacion: "0",
          tasaRechazo: "0"
        };
      }

      if (!profesionales || profesionales.length === 0) {
        console.log("⚠️ No se encontraron profesionales");
        return {
          total: 0,
          aprobados: 0,
          pendientes: 0,
          recibidos: 0,
          rechazados: 0,
          revisando: 0,
          vencimientosProximos: 0,
          carnetVencidos: 0,
          porArea: {},
          porProvincia: {},
          generoMasculino: 0,
          generoFemenino: 0,
          totalPorGenero: {},
          totalPorDistrito: {},
          totalPorTipoSector: {},
          totalPorNacionalidad: {},
          totalPorAreaProfesional: {},
          totalPorEstadoSolicitud: {},
          totalPorDistritoSanitario: {},
          datosGraficoProvincias: [],
          datosGraficoAreas: [],
          datosGraficoEstados: [],
          tasaAprobacion: "0",
          tasaRechazo: "0"
        };
      }

      // Calcular estadísticas
      const total = profesionales.length;
      const aprobados = profesionales.filter(p => p.estado_solicitud === "Aprobado").length;
      const pendientes = profesionales.filter(p => p.estado_solicitud === "Pendiente de Firma").length;
      const recibidos = profesionales.filter(p => p.estado_solicitud === "Recibido").length;
      const rechazados = profesionales.filter(p => p.estado_solicitud === "Rechazado").length;
      const revisando = profesionales.filter(p => p.estado_solicitud === "En Revisión").length;

      // Calcular vencimientos
      const hoy = new Date();
      const treintaDias = new Date();
      treintaDias.setDate(hoy.getDate() + 30);

      const vencimientosProximos = profesionales.filter(p => {
        if (!p.fecha_caducidad) return false;
        const fechaCaducidad = new Date(p.fecha_caducidad);
        return fechaCaducidad > hoy && fechaCaducidad <= treintaDias;
      }).length;

      const carnetVencidos = profesionales.filter(p => {
        if (!p.fecha_caducidad) return false;
        const fechaCaducidad = new Date(p.fecha_caducidad);
        return fechaCaducidad <= hoy;
      }).length;

      // Estadísticas por área profesional
      const porArea = profesionales.reduce((acc: any, p) => {
        const area = p.area_profesional || "Sin especificar";
        acc[area] = (acc[area] || 0) + 1;
        return acc;
      }, {});

      // Estadísticas por provincia
      const porProvincia = profesionales.reduce((acc: any, p) => {
        const provincia = p.provincia || "Sin especificar";
        acc[provincia] = (acc[provincia] || 0) + 1;
        return acc;
      }, {});

      // Estadísticas por género
      const generoMasculino = profesionales.filter(p => p.genero === "Masculino").length;
      const generoFemenino = profesionales.filter(p => p.genero === "Femenino").length;

      // Generar datos para gráficos
      const datosGraficoAreas = Object.entries(porArea).map(([area, cantidad]) => ({
        area,
        cantidad: cantidad as number
      }));

      const datosGraficoEstados = [
        { estado: "Aprobado", cantidad: aprobados, color: "#22c55e" },
        { estado: "Recibido", cantidad: recibidos, color: "#f59e0b" },
        { estado: "Rechazado", cantidad: rechazados, color: "#ef4444" },
        { estado: "Revisando", cantidad: revisando, color: "#3b82f6" },
        { estado: "Pendiente de Firma", cantidad: pendientes, color: "#8b5cf6" }
      ];

      // Calcular tasas
      const tasaAprobacion = total > 0 ? ((aprobados / total) * 100).toFixed(1) : "0";
      const tasaRechazo = total > 0 ? ((rechazados / total) * 100).toFixed(1) : "0";

      const estadisticas: EstadisticasData = {
        total,
        aprobados,
        pendientes,
        recibidos,
        rechazados,
        revisando,
        vencimientosProximos,
        carnetVencidos,
        porArea,
        porProvincia,
        generoMasculino,
        generoFemenino,
        totalPorGenero: { Masculino: generoMasculino, Femenino: generoFemenino },
        totalPorDistrito: profesionales.reduce((acc: any, p) => {
          const distrito = p.distrito || "Sin especificar";
          acc[distrito] = (acc[distrito] || 0) + 1;
          return acc;
        }, {}),
        totalPorTipoSector: profesionales.reduce((acc: any, p) => {
          const sector = p.tipo_sector || "Sin especificar";
          acc[sector] = (acc[sector] || 0) + 1;
          return acc;
        }, {}),
        totalPorNacionalidad: profesionales.reduce((acc: any, p) => {
          const nacionalidad = p.nacionalidad || "Sin especificar";
          acc[nacionalidad] = (acc[nacionalidad] || 0) + 1;
          return acc;
        }, {}),
        totalPorAreaProfesional: porArea,
        totalPorEstadoSolicitud: {
          "Recibido": recibidos,
          "En Revisión": revisando,
          "Aprobado": aprobados,
          "Pendiente de Firma": pendientes,
          "Rechazado": rechazados
        },
        totalPorDistritoSanitario: profesionales.reduce((acc: any, p) => {
          const distrito = p.distrito_sanitario || "Sin especificar";
          acc[distrito] = (acc[distrito] || 0) + 1;
          return acc;
        }, {}),
        datosGraficoProvincias: Object.entries(porProvincia).map(([name, value], index) => ({
          name,
          value: value as number,
          color: `hsl(${index * 45}, 70%, 50%)`
        })),
        datosGraficoAreas,
        datosGraficoEstados,
        tasaAprobacion,
        tasaRechazo
      };

      console.log("✅ Estadísticas calculadas:", estadisticas);
      return estadisticas;
    },
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });
}
