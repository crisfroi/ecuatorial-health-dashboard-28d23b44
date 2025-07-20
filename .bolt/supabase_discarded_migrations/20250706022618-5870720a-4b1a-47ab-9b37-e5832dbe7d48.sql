
-- Crear secuencia para códigos de expediente únicos
CREATE SEQUENCE IF NOT EXISTS public.codigo_expediente_seq START WITH 1;

-- Función para generar código de expediente único
CREATE OR REPLACE FUNCTION public.generar_codigo_expediente_unico()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  fecha_actual TEXT;
  numero_secuencial INTEGER;
  codigo_expediente TEXT;
BEGIN
  -- Obtener fecha actual en formato YYYYMMDD
  fecha_actual := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Obtener siguiente número de la secuencia
  numero_secuencial := nextval('public.codigo_expediente_seq');
  
  -- Generar código: EXP-YYYYMMDD-NNNNNN (6 dígitos)
  codigo_expediente := 'EXP-' || fecha_actual || '-' || LPAD(numero_secuencial::TEXT, 6, '0');
  
  RETURN codigo_expediente;
END;
$$;

-- Trigger para generar código de expediente al insertar
CREATE OR REPLACE FUNCTION public.set_codigo_expediente_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Solo generar si no existe ya un código de expediente
  IF NEW.codigo_expediente IS NULL OR NEW.codigo_expediente = '' THEN
    NEW.codigo_expediente := public.generar_codigo_expediente_unico();
  END IF;
  RETURN NEW;
END;
$$;

-- Crear trigger para auto-generar código de expediente
DROP TRIGGER IF EXISTS trigger_set_codigo_expediente ON profesionales_sanitarios;
CREATE TRIGGER trigger_set_codigo_expediente
  BEFORE INSERT ON profesionales_sanitarios
  FOR EACH ROW EXECUTE FUNCTION public.set_codigo_expediente_on_insert();
