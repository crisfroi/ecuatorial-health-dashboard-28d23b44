// src/utils/geoUtils.ts

/**
 * Mapeo de GeoJSON (ADM2) a la Clave Canónica del Distrito Sanitario (BD).
 * ESTRICTAMENTE basado en el archivo de mapeo proporcionado y correcciones del usuario.
 * Clave: Nombre Limpio del GeoJSON (shapeName). Valor: Nombre Limpio Canónico de la BD.
 */
const GEO_CANONICAL_MAP: Record<string, string> = {
    // --------------------------------------------------------------------------------
    // CORRECCIONES Y AGREGACIONES (Reglas Finales) 
    // --------------------------------------------------------------------------------
    
    // Inconsistencias de Nombres y Agregación Única
    "ayene": "anisok",           // AGREGACIÓN: AYENE -> Anisok
    "nkue": "micomiseng",        // AGREGACIÓN: NKUE -> Micomiseng
    "aconibe": "akonibe",        // CORRECCIÓN: ACONIBE -> Akonibe
    "bicurga": "evinayong",      // AGREGACIÓN: BICURGA -> Evinayong
    "mongomoyen": "mongomo",     // CORRECCIÓN: MONGOMOYEN -> Mongomo
    "machinda": "bata",          // AGREGACIÓN: MACHINDA -> Bata
    "nkimi": "niefang",          // CORRECCIÓN FINAL: NKIMI -> Niefang
    "bitica": "mbini",           // AGREGACIÓN: BITICA -> Mbini
    "nsoc nsomo": "nsok nsomo",  // CORRECCIÓN: NSOC NSOMO -> Nsok Nsomo
    "acurenam": "akurenam",       // CORRECCIÓN: ACURENAM -> Akurenam
    
    // Agregación de Islas y Penínsulas
    "corisco": "cogo",           // AGREGACIÓN: CORISCO -> Cogo
    "elobey grande": "cogo",     // AGREGACIÓN: ELOBEY GRANDE -> Cogo
    "elobey chico": "cogo",      // AGREGACIÓN: ELOBEY CHICO -> Cogo
    "annobon": "annobon",        // Mapeo directo. La limpieza maneja la tilde 'ó' (Annobón -> annobon)
};


/**
 * Normaliza y limpia un nombre geográfico para usarlo como clave única de mapeo (Ej: "ayon", "malabo").
 * @param name El nombre de la provincia o distrito (del GeoJSON o de la BD).
 * @returns La clave canónica normalizada.
 */
export function getCleanGeoName(name: string): string {
    if (!name) return "";
    
    // 1. Limpieza inicial: Maneja el prefijo de la BD y la pérdida de la 'ñ'
    let cleanName = name
        .replace(/^Distrito Sanitario de\s/i, "") // 1. Eliminar prefijo de la BD
        .toLowerCase()
        .replace(/\s+province$/i, "") 
        .normalize("NFD") // 2. Descomponer tildes/diacríticos (Añisoc -> Anisoc)
        .replace(/[\u0300-\u036f]/g, "") // 3. Eliminar diacríticos
        .replace(/-/g, ' ') 
        .replace(/\s+/g, ' ') 
        .trim();
        
    // 2. REGLA CRÍTICA: Mapeo de 'anisoc' a la clave final de DB 'anisok'.
    // Esto asegura que 'AÑISOC' (GeoJSON) y 'Distrito Sanitario de Añisoc' (DB)
    // resulten en la clave única 'anisok'.
    if (cleanName === 'anisoc') {
        cleanName = 'anisok';
    }
    
    // 3. Aplicar mapeo de excepciones/agregación
    // Convierte la clave limpia (p. ej., 'machinda') en la clave canónica (p. ej., 'bata').
    return GEO_CANONICAL_MAP[cleanName] || cleanName;
}