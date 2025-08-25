-- Migración para añadir campo función pública
-- Fecha: $(date)
-- Descripción: Añade el campo funcion_publica a la tabla profesionales_sanitarios

-- 1. Añadir la columna funcion_publica
ALTER TABLE profesionales_sanitarios 
ADD COLUMN IF NOT EXISTS funcion_publica BOOLEAN DEFAULT FALSE;

-- 2. Crear comentario en la columna
COMMENT ON COLUMN profesionales_sanitarios.funcion_publica IS 'Indica si el profesional pertenece a la función pública de salud';

-- 3. Migración de datos existentes basada en tipo_sector
-- Auto-categorizar profesionales existentes según su sector
UPDATE profesionales_sanitarios 
SET funcion_publica = TRUE 
WHERE tipo_sector = 'Público' AND funcion_publica IS NULL;

UPDATE profesionales_sanitarios 
SET funcion_publica = FALSE 
WHERE tipo_sector IN ('Privado', 'Mixto', 'ONG') AND funcion_publica IS NULL;

-- 4. Crear índice para optimizar consultas por función pública
CREATE INDEX IF NOT EXISTS idx_profesionales_funcion_publica 
ON profesionales_sanitarios(funcion_publica);

-- 5. Crear índice compuesto para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_profesionales_sector_funcion 
ON profesionales_sanitarios(tipo_sector, funcion_publica);

-- 6. Actualizar estadísticas de la tabla
ANALYZE profesionales_sanitarios;

-- 7. Verificar migración (query de verificación)
SELECT 
    COUNT(*) as total_profesionales,
    COUNT(CASE WHEN funcion_publica = TRUE THEN 1 END) as funcion_publica,
    COUNT(CASE WHEN funcion_publica = FALSE THEN 1 END) as no_funcion_publica,
    COUNT(CASE WHEN funcion_publica IS NULL THEN 1 END) as sin_categorizar
FROM profesionales_sanitarios;

-- 8. Verificar distribución por sector
SELECT 
    tipo_sector,
    COUNT(*) as total,
    COUNT(CASE WHEN funcion_publica = TRUE THEN 1 END) as funcion_publica,
    COUNT(CASE WHEN funcion_publica = FALSE THEN 1 END) as no_funcion_publica
FROM profesionales_sanitarios 
WHERE tipo_sector IS NOT NULL
GROUP BY tipo_sector
ORDER BY tipo_sector;
