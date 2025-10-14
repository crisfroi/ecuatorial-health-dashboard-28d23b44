// src/utils/geoUtils.ts

/**
 * Normaliza y limpia un nombre geográfico para usarlo como clave única de mapeo.
 * Elimina prefijos, sufijos, tildes, convierte a minúsculas y simplifica espacios.
 * @param name El nombre de la provincia o distrito (del GeoJSON o de la BD).
 * @returns La clave normalizada.
 */
export function getCleanGeoName(name: string): string {
    if (!name) return "";
    
    // 1. Limpieza específica de la BD (eliminar el prefijo "Distrito Sanitario de")
    let cleanName = name.replace(/^Distrito Sanitario de\s/i, "").trim();
    
    // 2. Limpieza general para GeoJSON/CSV
    return cleanName
        .toLowerCase()
        .replace(/\s+province$/i, "") // Para ADM1 (ej. "Litoral Province")
        .normalize("NFD") // Descomponer tildes, ñ (ej. Kié-Ntem -> Kie-Ntem, Añisoc -> Anisoc)
        .replace(/[\u0300-\u036f]/g, "") // Eliminar diacríticos
        .replace(/\s+/g, " ") // Simplificar múltiples espacios
        .trim();
}