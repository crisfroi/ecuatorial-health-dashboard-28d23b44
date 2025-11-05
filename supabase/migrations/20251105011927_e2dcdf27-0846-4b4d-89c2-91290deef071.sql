-- =====================================================
-- MIGRACIÓN: Sistema completo de exportación de empleados
-- Fecha: 2025-11-05
-- =====================================================

-- 1. Agregar device_sn a dispositivos (si no existe)
ALTER TABLE dispositivos 
ADD COLUMN IF NOT EXISTS device_sn VARCHAR(50) UNIQUE;

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_dispositivos_device_sn ON dispositivos(device_sn);

-- 2. Agregar enroll_id a empleado_dispositivo_map (si no existe)
ALTER TABLE empleado_dispositivo_map
ADD COLUMN IF NOT EXISTS enroll_id INTEGER;

-- Crear índice compuesto
CREATE INDEX IF NOT EXISTS idx_empleado_enroll ON empleado_dispositivo_map(id_profesional, enroll_id);

-- 3. Crear tabla de cola de comandos biométricos
CREATE TABLE IF NOT EXISTS comandos_biometricos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_sn VARCHAR(50) NOT NULL,
  comando_tipo VARCHAR(50) NOT NULL, -- 'setuserinfo', 'setusername', 'deleteuser', etc.
  comando_json JSONB NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'enviado', 'error', 'completado'
  intentos INTEGER DEFAULT 0,
  error_mensaje TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  procesado_at TIMESTAMPTZ,
  completado_at TIMESTAMPTZ,
  
  -- Metadata adicional
  profesional_id UUID REFERENCES profesionales_sanitarios(id),
  enroll_id INTEGER,
  creado_por UUID REFERENCES auth.users(id)
);

-- Índices para la cola de comandos
CREATE INDEX IF NOT EXISTS idx_comandos_estado ON comandos_biometricos(estado, created_at);
CREATE INDEX IF NOT EXISTS idx_comandos_device ON comandos_biometricos(device_sn, estado);
CREATE INDEX IF NOT EXISTS idx_comandos_profesional ON comandos_biometricos(profesional_id);

-- 4. RLS para comandos_biometricos
ALTER TABLE comandos_biometricos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read comandos"
  ON comandos_biometricos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('SUPER_ADMINISTRADOR', 'ADMIN_CENTRO_SANITARIO')
    )
  );

CREATE POLICY "Service role can manage comandos"
  ON comandos_biometricos FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 5. Función para limpiar comandos antiguos (más de 7 días completados)
CREATE OR REPLACE FUNCTION limpiar_comandos_antiguos()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM comandos_biometricos
  WHERE estado = 'completado'
  AND completado_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- 6. Comentarios para documentación
COMMENT ON TABLE comandos_biometricos IS 'Cola de comandos para sincronizar con dispositivos biométricos vía WebSocket';
COMMENT ON COLUMN comandos_biometricos.comando_tipo IS 'Tipo de comando: setuserinfo, setusername, deleteuser, setdevlock, etc.';
COMMENT ON COLUMN comandos_biometricos.comando_json IS 'JSON completo del comando a enviar al dispositivo';
COMMENT ON COLUMN comandos_biometricos.estado IS 'Estado del comando: pendiente, enviado, error, completado';
