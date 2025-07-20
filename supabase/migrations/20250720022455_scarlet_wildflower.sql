/*
  # Agregar columna documentos_adicionales

  1. Cambios
    - Agregar columna `documentos_adicionales` de tipo text[] a la tabla profesionales_sanitarios
    - Esta columna almacenará las URLs de los documentos adicionales subidos por cada profesional
    - Permitir valores NULL ya que es opcional

  2. Seguridad
    - La columna hereda las políticas RLS existentes de la tabla
*/

-- Agregar columna documentos_adicionales si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profesionales_sanitarios' 
    AND column_name = 'documentos_adicionales'
  ) THEN
    ALTER TABLE profesionales_sanitarios 
    ADD COLUMN documentos_adicionales text[];
  END IF;
END $$;

-- Agregar comentario a la columna
COMMENT ON COLUMN profesionales_sanitarios.documentos_adicionales IS 'URLs de documentos adicionales subidos por el profesional (PDF, imágenes, etc.)';