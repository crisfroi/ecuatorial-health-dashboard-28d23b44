import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage, logError } from "@/utils/errorHandler";

export function useEstadisticasAvanzadas() {
  return useQuery({
    queryKey: ["estadisticas-avanzadas"], // Mantenemos la queryKey original
    queryFn: async () => {
      console.log("Fetching estadísticas avanzadas...");

      let profesionales = [];

      try {
        // Check if offline mode is enabled
        const offlineMode = localStorage.getItem("app-offline-mode") === "true";
        if (offlineMode) {
          console.log("Offline mode detected, skipping database queries");
          throw new Error("Offline mode active - using fallback data");
        }

        // Retry logic for health check
        let healthCheck, healthError;
        const maxRetries = 3;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`Health check attempt ${attempt}/${maxRetries}`);

            const result = await supabase
              .from("profesionales_sanitarios")
              .select("id")
              .limit(1);

            healthCheck = result.data;
            healthError = result.error;

            if (!healthError) {
              console.log("Health check passed on attempt", attempt);
              break;
            }

            console.log(`Health check attempt ${attempt} failed:`, healthError);

            // Check if it's a fetch error that should be retried
            const errorMessage = getErrorMessage(healthError);
            const isFetchError =
              errorMessage.includes("fetch") ||
              errorMessage.includes("Failed to fetch") ||
              errorMessage.includes("TypeError");

            if (!isFetchError && attempt < maxRetries) {
              console.log(
                "Non-fetch error detected, stopping health check retries",
              );
              break;
            }

            // Wait before retry
            if (attempt < maxRetries) {
              const delayMs = Math.pow(2, attempt) * 1000;
              console.log(`Waiting ${delayMs}ms before health check retry...`);
              await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
          } catch (healthException: any) {
            console.error(
              `Health check attempt ${attempt} threw exception:`,
              healthException,
            );
            healthError = healthException;

            if (attempt === maxRetries) {
              break;
            }
          }
        }

        if (healthError) {
          logError("Health check failed", healthError);
          const errorMessage = getErrorMessage(healthError);

          // If it's a fetch error, enable offline mode automatically
          if (
            errorMessage.includes("fetch") ||
            errorMessage.includes("Failed to fetch")
          ) {
            console.log("Fetch error detected, enabling offline mode");
            localStorage.setItem("app-offline-mode", "true");
            localStorage.setItem(
              "app-offline-reason",
              "Automatic - fetch failure detected",
            );
          }

          throw new Error(`Database connection failed: ${errorMessage}`);
        }

        // Retry logic for main query
        let data, error;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`Main query attempt ${attempt}/${maxRetries}`);

            const result = await supabase
              .from("profesionales_sanitarios")
              .select("*");

            data = result.data;
            error = result.error;

            if (!error) {
              console.log("Main query succeeded on attempt", attempt);
              break;
            }

            console.log(`Main query attempt ${attempt} failed:`, error);

            // Check if it's a fetch error that should be retried
            const errorMessage = getErrorMessage(error);
            const isFetchError =
              errorMessage.includes("fetch") ||
              errorMessage.includes("Failed to fetch") ||
              errorMessage.includes("TypeError");

            if (!isFetchError && attempt < maxRetries) {
              console.log(
                "Non-fetch error detected, stopping main query retries",
              );
              break;
            }

            // Wait before retry
            if (attempt < maxRetries) {
              const delayMs = Math.pow(2, attempt) * 1000;
              console.log(`Waiting ${delayMs}ms before main query retry...`);
              await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
          } catch (queryException: any) {
            console.error(
              `Main query attempt ${attempt} threw exception:`,
              queryException,
            );
            error = queryException;

            if (attempt === maxRetries) {
              break;
            }
          }
        }

        if (error) {
          logError("Error fetching estadísticas avanzadas", error);
          const errorMessage = getErrorMessage(error);

          // If it's a fetch error, enable offline mode automatically
          if (
            errorMessage.includes("fetch") ||
            errorMessage.includes("Failed to fetch")
          ) {
            console.log("Fetch error in main query, enabling offline mode");
            localStorage.setItem("app-offline-mode", "true");
            localStorage.setItem(
              "app-offline-reason",
              "Automatic - main query fetch failure",
            );
          }

          throw new Error(`Failed to fetch statistics: ${errorMessage}`);
        }

        profesionales = data || [];
        console.log(
          `Successfully fetched ${profesionales.length} professionals`,
        );
        console.log("First professional sample:", profesionales[0]);
      } catch (fetchError: any) {
        console.error("Network or fetch error:", fetchError);

        // Verificar si es un error de red
        if (
          fetchError.name === "TypeError" &&
          fetchError.message.includes("fetch")
        ) {
          throw new Error(
            "Network connection failed. Please check your internet connection and try again.",
          );
        }

        // Re-lanzar otros errores
        throw fetchError;
      }

      // 1. FILTRAR PROFESIONALES APROBADOS PARA TODAS LAS ESTADÍSTICAS PRINCIPALES
      const profesionalesAprobados = profesionales.filter(
        (p) => p.estado_solicitud === "Aprobado",
      );

      // Calcular estadísticas básicas (conteos de estados sobre todos los profesionales)
      const total = profesionales.length;
      const aprobados = profesionales.filter(
        (p) => p.estado_solicitud === "Aprobado",
      ).length;
      const recibidos = profesionales.filter(
        (p) => p.estado_solicitud === "Recibido",
      ).length;
      const rechazados = profesionales.filter(
        (p) => p.estado_solicitud === "Rechazado",
      ).length;
      const revisando = profesionales.filter(
        (p) => p.estado_solicitud === "Revisando",
      ).length;

      // Estadísticas por área profesional - SOLO APROBADOS
      const porArea = profesionalesAprobados.reduce(
        (acc, prof) => {
          const area = prof.area_profesional || "Sin especificar";
          acc[area] = (acc[area] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Estadísticas por provincia - SOLO APROBADOS
      const porProvincia = profesionalesAprobados.reduce(
        (acc, prof) => {
          const provincia = prof.provincia || "Sin especificar";
          acc[provincia] = (acc[provincia] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // --- CÁLCULO DE G��NERO (SOLO PARA APROBADOS) ---
      // Estadísticas por género - AHORA SOLO DE PROFESIONALES APROBADOS
      const porGenero = profesionalesAprobados.reduce(
        (acc, prof) => {
          const genero = prof.genero || "Sin especificar";
          acc[genero] = (acc[genero] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Extraer conteos específicos para género de APROBADOS
      const generoMasculino = porGenero["Masculino"] || 0;
      const generoFemenino = porGenero["Femenino"] || 0;
      // --- FIN CÁLCULO DE GÉNERO ---

      // Estadísticas por tipo de sector - SOLO APROBADOS
      const porTipoSector = profesionalesAprobados.reduce(
        (acc, prof) => {
          const sector = prof.tipo_sector || "Sin especificar";
          acc[sector] = (acc[sector] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Estadísticas por distrito - SOLO APROBADOS
      const porDistrito = profesionalesAprobados.reduce(
        (acc, prof) => {
          const distrito = prof.distrito || "Sin especificar";
          acc[distrito] = (acc[distrito] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Calcular vencimientos próximos (próximos 30 días)
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const en30Dias = new Date();
      en30Dias.setDate(hoy.getDate() + 30);
      en30Dias.setHours(23, 59, 59, 999);

      const vencimientosProximos = profesionalesAprobados.filter((prof) => {
        if (!prof.fecha_caducidad) return false;
        const fechaVencimiento = new Date(prof.fecha_caducidad);
        fechaVencimiento.setHours(0, 0, 0, 0);

        return fechaVencimiento >= hoy && fechaVencimiento <= en30Dias;
      }).length;

      // Calcular carnets vencidos - SOLO APROBADOS
      const carnetVencidos = profesionalesAprobados.filter((prof) => {
        if (!prof.fecha_caducidad) return false;
        const fechaVencimiento = new Date(prof.fecha_caducidad);
        fechaVencimiento.setHours(0, 0, 0, 0);

        return fechaVencimiento < hoy;
      }).length;

      // Estadísticas por año de graduación - SOLO APROBADOS
      const porAnoGraduacion = profesionalesAprobados.reduce(
        (acc, prof) => {
          if (prof.año_graduacion) {
            const ano = prof.año_graduacion.toString();
            acc[ano] = (acc[ano] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>,
      );

      // Tendencias mensuales (últimos 12 meses) - Basado en 'created_at'
      const tendenciasMensuales = [];
      for (let i = 11; i >= 0; i--) {
        const fecha = new Date();
        fecha.setMonth(fecha.getMonth() - i);
        const mesAno = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;

        const registrosDelMes = profesionales.filter((prof) => {
          if (!prof.created_at) return false;
          const fechaCreacion = new Date(prof.created_at);
          const mesAnoCreacion = `${fechaCreacion.getFullYear()}-${String(fechaCreacion.getMonth() + 1).padStart(2, "0")}`;
          return mesAnoCreacion === mesAno;
        }).length;

        tendenciasMensuales.push({
          mes: fecha.toLocaleDateString("es-ES", {
            month: "short",
            year: "numeric",
          }),
          registros: registrosDelMes,
        });
      }

      const estadisticas = {
        // Estadísticas básicas (todas sobre el total de profesionales)
        total,
        aprobados,
        recibidos,
        rechazados,
        revisando,
        vencimientosProximos,
        carnetVencidos,

        // Distribuciones (todas sobre el total de profesionales)
        porArea,
        porProvincia,

        // ¡Estos son los que querías que se refieran solo a APROBADOS!
        generoMasculino,
        generoFemenino,
        porGenero,

        porTipoSector,
        porDistrito,
        porAnoGraduacion,

        // Tendencias
        tendenciasMensuales,

        // Tasas de conversión
        tasaAprobacion:
          total > 0 ? ((aprobados / total) * 100).toFixed(1) : "0",
        tasaRechazo: total > 0 ? ((rechazados / total) * 100).toFixed(1) : "0",

        // Datos para gráficos
        datosGraficoEstados: [
          { estado: "Aprobado", cantidad: aprobados, color: "#22c55e" },
          { estado: "Recibido", cantidad: recibidos, color: "#f59e0b" },
          { estado: "Rechazado", cantidad: rechazados, color: "#ef4444" },
          { estado: "Revisando", cantidad: revisando, color: "#3b82f6" },
        ],

        datosGraficoAreas: Object.entries(porArea).map(([area, cantidad]) => ({
          area,
          cantidad: cantidad as number,
        })),

        datosGraficoProvincias: Object.entries(porProvincia).map(
          ([provincia, cantidad]) => ({
            provincia,
            cantidad: cantidad as number,
          }),
        ),
      };

      console.log("Estadísticas avanzadas calculadas:", estadisticas);
      return estadisticas;
    },
    refetchInterval: () => {
      // Don't auto-refetch in offline mode
      const offlineMode = localStorage.getItem("app-offline-mode") === "true";
      if (offlineMode) {
        return false;
      }

      // Return normal interval if not in offline mode
      return 30000; // Normal 30 second interval
    },
    retry: (failureCount, error) => {
      console.log(`Retry attempt ${failureCount} for error:`, error?.message);

      // Don't retry in offline mode
      const offlineMode = localStorage.getItem("app-offline-mode") === "true";
      if (offlineMode) {
        console.log("Offline mode active, not retrying");
        return false;
      }

      // Don't retry fetch errors at this level (handled in queryFn)
      if (
        error?.message?.includes("fetch") ||
        error?.message?.includes("Failed to fetch")
      ) {
        console.log("Fetch error detected, not retrying at query level");
        return false;
      }

      // Retry network connection errors
      if (
        error?.message?.includes("Network connection failed") ||
        error?.message?.includes("Database connection failed")
      ) {
        return failureCount < 2;
      }

      return failureCount < 1;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    // Proporcionar datos de fallback cuando falle
    placeholderData: {
      total: 0,
      aprobados: 0,
      recibidos: 0,
      rechazados: 0,
      revisando: 0,
      vencimientosProximos: 0,
      carnetVencidos: 0,
      porArea: {},
      porProvincia: {},
      generoMasculino: 0,
      generoFemenino: 0,
      porGenero: {},
      porTipoSector: {},
      porDistrito: {},
      porAnoGraduacion: {},
      tendenciasMensuales: [],
      tasaAprobacion: "0",
      tasaRechazo: "0",
      datosGraficoEstados: [
        { estado: "Aprobado", cantidad: 0, color: "#22c55e" },
        { estado: "Recibido", cantidad: 0, color: "#f59e0b" },
        { estado: "Rechazado", cantidad: 0, color: "#ef4444" },
        { estado: "Revisando", cantidad: 0, color: "#3b82f6" },
      ],
      datosGraficoAreas: [],
      datosGraficoProvincias: [],
    },
  });
}
