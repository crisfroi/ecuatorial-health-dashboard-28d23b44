
-- Trigger y constraint (corregido)

-- Función de sincronización
CREATE OR REPLACE FUNCTION sync_records_to_asistencia_fichajes()
RETURNS TRIGGER AS $$
DECLARE
  v_profesional_id UUID;
  v_centro_id UUID;
BEGIN
  SELECT id_profesional INTO v_profesional_id
  FROM empleado_dispositivo_map 
  WHERE en_no::text = NEW.enroll_id::text 
  LIMIT 1;
  
  SELECT centro_salud_id INTO v_centro_id
  FROM dispositivos 
  WHERE nombre = NEW.device_serial_num OR tm_no::text = NEW.device_serial_num
  LIMIT 1;
  
  INSERT INTO asistencia_fichajes (
    enroll_id, device_sn, profesional_id, centro_salud_id,
    time_local, inout, mode, event, temperature, image_url,
    raw_index, created_at
  ) VALUES (
    NEW.enroll_id, NEW.device_serial_num, v_profesional_id, v_centro_id,
    NEW.records_time, NEW."intOut", NEW.mode, NEW.event,
    NEW.temperature / 100.0, NEW.image, NEW.id,
    COALESCE(NEW.created_at, NOW())
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_records_to_fichajes ON records;
CREATE TRIGGER trigger_sync_records_to_fichajes
  AFTER INSERT OR UPDATE ON records
  FOR EACH ROW
  EXECUTE FUNCTION sync_records_to_asistencia_fichajes();

-- Limpiar duplicados con row_number
DELETE FROM asistencia_fichajes
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY enroll_id, time_local, device_sn ORDER BY created_at) as rn
    FROM asistencia_fichajes
  ) t WHERE rn > 1
);

-- Constraint único
ALTER TABLE asistencia_fichajes DROP CONSTRAINT IF EXISTS unique_fichaje;
ALTER TABLE asistencia_fichajes ADD CONSTRAINT unique_fichaje UNIQUE (enroll_id, time_local, device_sn);
