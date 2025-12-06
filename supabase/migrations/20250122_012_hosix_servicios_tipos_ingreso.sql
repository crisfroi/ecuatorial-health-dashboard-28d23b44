-- Add columns to hosix_servicios to track which admission types each service supports
ALTER TABLE hosix_servicios 
ADD COLUMN IF NOT EXISTS atiende_urgencias BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS atiende_externa BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS atiende_hospitalizacion BOOLEAN DEFAULT false;

-- Create an index for filtering by service type
CREATE INDEX IF NOT EXISTS idx_hosix_servicios_tipos_ingreso 
ON hosix_servicios(atiende_urgencias, atiende_externa, atiende_hospitalizacion)
WHERE activo = true;

-- Set default values based on tipo_servicio for existing records (if applicable)
UPDATE hosix_servicios 
SET 
  atiende_urgencias = CASE WHEN tipo_servicio = 'urgencia' THEN true ELSE false END,
  atiende_externa = CASE WHEN tipo_servicio IN ('consulta', 'externa') THEN true ELSE false END,
  atiende_hospitalizacion = CASE WHEN tipo_servicio IN ('hospitalizacion', 'internamiento') THEN true ELSE false END
WHERE atiende_urgencias = false 
  AND atiende_externa = false 
  AND atiende_hospitalizacion = false;
