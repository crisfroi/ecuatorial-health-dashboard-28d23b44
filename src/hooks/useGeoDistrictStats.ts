// src/hooks/useGeoDistrictStats.ts

import { useMemo } from "react";
// Importamos el hook original y su interfaz (asumiendo que está en esta ruta)
import { useDistritosSanitarios, DistritoSanitario } from "@/hooks/useDistritosSanitarios"; 
import { getCleanGeoName } from "@/utils/geoUtils";

// Define la estructura de datos que el mapa necesita
export type DistritoGeoStats = DistritoSanitario & {
  total_profesionales: number; 
  total_centros: number;      
  cleanName: string;          // Clave única normalizada para mapear al GeoJSON
};

export const useGeoDistrictStats = () => {
    // 1. Obtener los datos reales de la BD usando tu hook original
    const distritosQuery = useDistritosSanitarios();

    const data: DistritoGeoStats[] = useMemo(() => {
        if (!distritosQuery.data) return [];

        return distritosQuery.data.map(d => {
            // Genera la clave limpia para mapear al GeoJSON (ej. "akonibe")
            const cleanName = getCleanGeoName(d.nombre_distrito);

            // -------------------------------------------------------------------
            // SIMULACIÓN DE ESTADÍSTICAS (Las 19 Claves Canónicas del CSV)
            // -------------------------------------------------------------------
            const simulatedStats: Record<string, { prof: number, cent: number }> = {
                // Claves que recogen datos de polígonos agregados o corregidos
                'akonibe': { prof: 15, cent: 3 }, // Recibe ACONIBE
                'anisoc': { prof: 18, cent: 3 }, // Recibe AÑISOC y AYENE
                'bata': { prof: 60, cent: 8 }, // Recibe MACHINDA
                'cogo': { prof: 5, cent: 1 }, // Recibe CORISCO, ELOBEY GRANDE/CHICO
                'evinayong': { prof: 8, cent: 1 }, // Recibe BICURGA
                'mbini': { prof: 6, cent: 1 }, // Recibe BITICA
                'micomiseng': { prof: 22, cent: 4 }, // Recibe NKUE
                'mongomo': { prof: 16, cent: 3 }, // Recibe MONGOMOYEN
                'oyala': { prof: 5, cent: 1 }, // Recibe NKIMI
                
                // Claves Canónicas Estándar
                'akurenam': { prof: 10, cent: 2 }, 
                'annobon': { prof: 3, cent: 1 }, // Annobón (DB NAME del CSV)
                'baney': { prof: 12, cent: 2 },
                'ebebiyin': { prof: 25, cent: 4 },
                'luba': { prof: 10, cent: 2 },
                'malabo': { prof: 90, cent: 12 },
                'niefang': { prof: 14, cent: 2 },
                'nsok nsomo': { prof: 7, cent: 1 },
                'nsork': { prof: 9, cent: 1 },
                'riaba': { prof: 4, cent: 1 },
            };
            const stats = simulatedStats[cleanName] || { prof: 0, cent: 0 };
            // -------------------------------------------------------------------

            return {
                ...d,
                total_profesionales: stats.prof,
                total_centros: stats.cent,
                cleanName: cleanName,
            } as DistritoGeoStats;
        });
    }, [distritosQuery.data]);

    // Retorna los datos limpios y el estado de la consulta original
    return { ...distritosQuery, data };
};