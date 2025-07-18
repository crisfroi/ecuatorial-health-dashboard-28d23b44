import { useQuery } from "@tanstack/react-query";

export function useEstadisticasMock() {
  return useQuery({
    queryKey: ["estadisticas-mock"],
    queryFn: async () => {
      console.log("Using mock estadisticas data...");

      // Simular un pequeño retraso
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Datos mock para probar la UI
      return {
        total: 150,
        aprobados: 120,
        recibidos: 15,
        rechazados: 10,
        revisando: 5,
        vencimientosProximos: 8,
        carnetVencidos: 3,

        // Distribuciones
        porArea: {
          "Medicina General": 45,
          "Enfermer��a": 35,
          Odontología: 20,
          Farmacia: 15,
          Psicología: 10,
          Fisioterapia: 25,
        },
        porProvincia: {
          Malabo: 80,
          Bata: 40,
          Ebebiyin: 15,
          Mongomo: 10,
          Evinayong: 5,
        },

        // Género (solo aprobados)
        generoMasculino: 65,
        generoFemenino: 55,
        porGenero: {
          Masculino: 65,
          Femenino: 55,
        },

        porTipoSector: {
          Público: 90,
          Privado: 60,
        },
        porDistrito: {
          "Distrito 1": 40,
          "Distrito 2": 35,
          "Distrito 3": 30,
          "Distrito 4": 25,
          "Distrito 5": 20,
        },
        porAnoGraduacion: {
          "2020": 25,
          "2021": 30,
          "2022": 35,
          "2023": 40,
          "2024": 20,
        },

        // Tendencias
        tendenciasMensuales: [
          { mes: "Ene 24", registros: 12 },
          { mes: "Feb 24", registros: 15 },
          { mes: "Mar 24", registros: 18 },
          { mes: "Abr 24", registros: 22 },
          { mes: "May 24", registros: 25 },
          { mes: "Jun 24", registros: 20 },
          { mes: "Jul 24", registros: 16 },
          { mes: "Ago 24", registros: 19 },
          { mes: "Sep 24", registros: 21 },
          { mes: "Oct 24", registros: 18 },
          { mes: "Nov 24", registros: 14 },
          { mes: "Dic 24", registros: 10 },
        ],

        // Tasas de conversión
        tasaAprobacion: "80.0",
        tasaRechazo: "6.7",

        // Datos para gráficos
        datosGraficoEstados: [
          { estado: "Aprobado", cantidad: 120, color: "#22c55e" },
          { estado: "Recibido", cantidad: 15, color: "#f59e0b" },
          { estado: "Rechazado", cantidad: 10, color: "#ef4444" },
          { estado: "Revisando", cantidad: 5, color: "#3b82f6" },
        ],

        datosGraficoAreas: [
          { area: "Medicina General", cantidad: 45 },
          { area: "Enfermería", cantidad: 35 },
          { area: "Fisioterapia", cantidad: 25 },
          { area: "Odontología", cantidad: 20 },
          { area: "Farmacia", cantidad: 15 },
          { area: "Psicología", cantidad: 10 },
        ],

        datosGraficoProvincias: [
          { provincia: "Malabo", cantidad: 80 },
          { provincia: "Bata", cantidad: 40 },
          { provincia: "Ebebiyin", cantidad: 15 },
          { provincia: "Mongomo", cantidad: 10 },
          { provincia: "Evinayong", cantidad: 5 },
        ],
      };
    },
    staleTime: Infinity, // No refetch automáticamente
    refetchInterval: false,
  });
}
