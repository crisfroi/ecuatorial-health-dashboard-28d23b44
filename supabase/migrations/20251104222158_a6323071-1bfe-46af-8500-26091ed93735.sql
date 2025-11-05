
-- Paso 1: Solo migrar datos sin constraint

-- Asegurar columnas
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'asistencia_fichajes' AND column_name = 'profesional_id') THEN
    ALTER TABLE asistencia_fichajes ADD COLUMN profesional_id UUID REFERENCES profesionales_sanitarios(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'asistencia_fichajes' AND column_name = 'centro_salud_id') THEN
    ALTER TABLE asistencia_fichajes ADD COLUMN centro_salud_id UUID REFERENCES centros_salud(id);
  END IF;
END $$;

-- Truncar para empezar limpio
TRUNCATE asistencia_fichajes CASCADE;

-- Migrar datos de records
INSERT INTO asistencia_fichajes (
  enroll_id, device_sn, profesional_id, centro_salud_id,
  time_local, inout, mode, event, temperature, image_url,
  raw_index, created_at
)
SELECT 
  r.enroll_id,
  r.device_serial_num,
  (SELECT id_profesional FROM empleado_dispositivo_map WHERE en_no::text = r.enroll_id::text LIMIT 1),
  (SELECT d.centro_salud_id FROM dispositivos d WHERE d.nombre = r.device_serial_num OR d.tm_no::text = r.device_serial_num LIMIT 1),
  r.records_time,
  r."intOut",
  r.mode,
  r.event,
  r.temperature / 100.0,
  r.image,
  r.id,
  COALESCE(r.created_at, NOW())
FROM records r;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_asistencia_fichajes_enroll_time ON asistencia_fichajes(enroll_id, time_local);
CREATE INDEX IF NOT EXISTS idx_asistencia_fichajes_profesional ON asistencia_fichajes(profesional_id);
CREATE INDEX IF NOT EXISTS idx_asistencia_fichajes_centro ON asistencia_fichajes(centro_salud_id);
CREATE INDEX IF NOT EXISTS idx_asistencia_fichajes_device ON asistencia_fichajes(device_sn);
