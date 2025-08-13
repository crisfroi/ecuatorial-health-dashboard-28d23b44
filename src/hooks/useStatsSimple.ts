import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SimpleStats {
  total: number;
  aprobados: number;
  hombres: number;
  mujeres: number;
  centros: number;
  loading: boolean;
  error: string | null;
}

export const useStatsSimple = () => {
  const [stats, setStats] = useState<SimpleStats>({
    total: 0,
    aprobados: 0,
    hombres: 0,
    mujeres: 0,
    centros: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchStats = async () => {
      console.log("🔍 Fetching simple stats...");
      
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }));

        // Query 1: Profesionales
        const { data: profesionales, error: profError } = await supabase
          .from("profesionales_sanitarios")
          .select("estado_solicitud, genero");

        if (profError) {
          console.error("❌ Error fetching profesionales:", profError);
          throw profError;
        }

        console.log("✅ Profesionales obtenidos:", profesionales?.length || 0);

        // Query 2: Centros
        const { data: centros, error: centrosError } = await supabase
          .from("centros_salud")
          .select("id");

        if (centrosError) {
          console.warn("⚠️ Error fetching centros:", centrosError);
        }

        // Calcular estadísticas
        const total = profesionales?.length || 0;
        const aprobados = profesionales?.filter(p => p.estado_solicitud === 'Aprobado').length || 0;
        const hombres = profesionales?.filter(p => p.genero === 'Masculino').length || 0;
        const mujeres = profesionales?.filter(p => p.genero === 'Femenino').length || 0;
        const totalCentros = centros?.length || 0;

        const newStats = {
          total,
          aprobados,
          hombres,
          mujeres,
          centros: totalCentros,
          loading: false,
          error: null
        };

        console.log("📊 Stats calculadas:", newStats);
        setStats(newStats);

      } catch (error: any) {
        console.error("❌ Error en useStatsSimple:", error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: error.message || "Error desconocido"
        }));
      }
    };

    fetchStats();
  }, []);

  return stats;
};
