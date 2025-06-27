
-- Actualizar la tabla profesionales_sanitarios para incluir campos faltantes
ALTER TABLE profesionales_sanitarios 
ADD COLUMN IF NOT EXISTS fecha_creacion_solicitud TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS revisor_solicitud TEXT,
ADD COLUMN IF NOT EXISTS urgencia_solicitud TEXT DEFAULT 'Media',
ADD COLUMN IF NOT EXISTS notas_revision TEXT;

-- Crear tabla para gestión de incidencias hospitalarias
CREATE TABLE IF NOT EXISTS incidencias_hospitalarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_profesional UUID REFERENCES profesionales_sanitarios(id),
  titulo_incidencia TEXT NOT NULL,
  descripcion TEXT,
  tipo_incidencia TEXT DEFAULT 'General',
  gravedad TEXT DEFAULT 'Media',
  estado TEXT DEFAULT 'Abierta',
  fecha_incidencia TIMESTAMP DEFAULT NOW(),
  reportado_por UUID,
  resuelto_por UUID,
  fecha_resolucion TIMESTAMP,
  notas_resolucion TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Habilitar RLS en la tabla de incidencias
ALTER TABLE incidencias_hospitalarias ENABLE ROW LEVEL SECURITY;

-- Crear política para que los usuarios puedan ver sus propias incidencias
CREATE POLICY "Users can view their own incidents" ON incidencias_hospitalarias
  FOR SELECT USING (true);

CREATE POLICY "Users can create incidents" ON incidencias_hospitalarias
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update incidents" ON incidencias_hospitalarias
  FOR UPDATE USING (true);

-- Actualizar algunos registros de ejemplo para testing
UPDATE profesionales_sanitarios 
SET 
  fecha_creacion_solicitud = COALESCE(fecha_solicitud, NOW()),
  revisor_solicitud = CASE 
    WHEN estado_solicitud = 'Revisando' THEN 'Dr. Carlos Obiang'
    WHEN estado_solicitud = 'Pendiente de Firma' THEN 'Dr. Ana Nguema'
    ELSE NULL
  END,
  urgencia_solicitud = CASE 
    WHEN estado_solicitud = 'Pendiente de Firma' THEN 'Alta'
    WHEN estado_solicitud = 'Revisando' THEN 'Media'
    ELSE 'Baja'
  END
WHERE id IS NOT NULL;
