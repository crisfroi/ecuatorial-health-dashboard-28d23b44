/**
 * Mapeo de GeoJSON (ADM2) a la Clave Canónica del Distrito Sanitario (BD).
 * ESTRICTAMENTE basado en el archivo de mapeo proporcionado y correcciones del usuario.
 * Clave: Nombre Limpio del GeoJSON (shapeName). Valor: Nombre Limpio Canónico de la BD.
 * * NOTA CRÍTICA: Este mapa SÓLO debe ser usado por la capa de datos para obtener la clave
 * unificada de la DB. No debe usarse para obtener la clave del polígono GeoJSON.
 */
const GEO_CANONICAL_MAP: Record<string, string> = {
    // --------------------------------------------------------------------------------
    // CORRECCIONES Y AGREGACIONES (Reglas Finales) 
    // --------------------------------------------------------------------------------
    
    // Inconsistencias de Nombres y Agregación Única
    "ayene": "anisok",           // AGREGACIÓN: AYENE -> Anisok
    "nkue": "micomiseng",        // AGREGACIÓN: NKUE -> Micomiseng
    "aconibe": "akonibe",        // CORRECCIÓN: ACONIBE -> Akonibe
    "bicurga": "evinayong",      // AGREGACIÓN: BICURGA -> Evinayong
    "mongomoyen": "mongomo",     // CORRECCIÓN: MONGOMOYEN -> Mongomo
    "machinda": "bata",          // AGREGACIÓN: MACHINDA -> Bata
    "nkimi": "niefang",          // CORRECCIÓN FINAL: NKIMI -> Niefang
    "bitica": "mbini",           // AGREGACIÓN: BITICA -> Mbini
    "nsoc nsomo": "nsok nsomo",  // CORRECCIÓN: NSOC NSOMO -> Nsok Nsomo
    "acurenam": "akurenam",       // CORRECCIÓN: ACURENAM -> Akurenam
    
    // Agregación de Islas y Penínsulas
    "corisco": "cogo",           // AGREGACIÓN: CORISCO -> Cogo
    "elobey grande": "cogo",     // AGREGACIÓN: ELOBEY GRANDE -> Cogo
    "elobey chico": "cogo",      // AGREGACIÓN: ELOBEY CHICO -> Cogo
    "annobon": "annobon",        // Mapeo directo. La limpieza maneja la tilde 'ó' (Annobón -> annobon)

    // Agregación de Padres (Necesaria para los Distritos de la DB que coincidan con un padre GeoJSON)
    // Esto asegura que la DB use la clave limpia del GeoJSON para la unión.
    "añisoc": "anisok",          // AÑISOC (GeoJSON) -> anisok (DB Key)
    "evinayong": "evinayong",    // EVINAYONG (GeoJSON) -> evinayong (DB Key)
    "bata": "bata",              // BATA (GeoJSON) -> bata (DB Key)
    "mbini": "mbini",            // MBINI (GeoJSON) -> mbini (DB Key)
    "cogo": "cogo",              // COGO (GeoJSON) -> cogo (DB Key)
    "micomiseng": "micomiseng",  // MICOMISENG (GeoJSON) -> micomiseng (DB Key)
    "mongomo": "mongomo",        // MONGOMO (GeoJSON) -> mongomo (DB Key)
    "niefang": "niefang",            // NIEFANG (GeoJSON) -> niefang (DB Key)
};


/**
 * Normaliza y limpia un nombre geográfico (del GeoJSON o de la BD) para usarlo como clave canónica ÚNICA.
 * Esta función *incluye* la lógica de agregación/corrección.
 * @param name El nombre de la provincia o distrito (del GeoJSON o de la BD).
 * @returns La clave canónica normalizada (ej: 'machinda' -> 'bata'; 'bata' -> 'bata').
 */
export function getCanonicalDBName(name: string): string {
    if (!name) return "";
    
    let cleanName = getGeoKey(name); // Usamos la nueva función para obtener la clave limpia sin mapeo.
    
    // Aplicar mapeo de excepciones/agregación
    // Convierte la clave limpia (p. ej., 'machinda') en la clave canónica (p. ej., 'bata').
    return GEO_CANONICAL_MAP[cleanName] || cleanName;
}

/**
 * Normaliza y limpia un nombre geográfico para obtener una CLAVE SIN EL MAPEO CANÓNICO (solo limpieza).
 * Esto se usa para identificar el polígono GeoJSON específico (ej: "machinda" o "bata").
 * @param name El nombre de la provincia o distrito (del GeoJSON o de la BD).
 * @returns La clave limpia (ej: 'Machinda' -> 'machinda'; 'BATA' -> 'bata').
 */
export function getGeoKey(name: string): string {
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
    // Esto asegura que 'AÑISOC' (GeoJSON) resulte en la clave 'anisok' si no estuviera en el mapa.
    if (cleanName === 'anisoc') {
        cleanName = 'anisok';
    }
    
    // 3. ¡IMPORTANTE! NO aplicamos GEO_CANONICAL_MAP aquí.
    return cleanName;
}

// Renombrar la función exportada anteriormente
export const getCleanGeoName = getGeoKey;