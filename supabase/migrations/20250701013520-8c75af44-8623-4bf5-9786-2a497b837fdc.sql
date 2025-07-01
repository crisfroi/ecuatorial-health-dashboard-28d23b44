
-- Agregar campos para el carnet profesional y manejo de archivos
ALTER TABLE public.profesionales_sanitarios 
ADD COLUMN IF NOT EXISTS foto_carnet TEXT,
ADD COLUMN IF NOT EXISTS numero_carnet_profesional TEXT,
ADD COLUMN IF NOT EXISTS fecha_validez_carnet DATE,
ADD COLUMN IF NOT EXISTS codigo_barras TEXT,
ADD COLUMN IF NOT EXISTS url_codigo_barras TEXT,
ADD COLUMN IF NOT EXISTS fecha_aprobacion_carnet DATE,
ADD COLUMN IF NOT EXISTS titulo_adjunto_1 TEXT,
ADD COLUMN IF NOT EXISTS titulo_adjunto_2 TEXT;

-- Crear función para generar código de barras único
CREATE OR REPLACE FUNCTION public.generar_codigo_barras_unico()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  codigo_base TEXT;
  timestamp_str TEXT;
  random_str TEXT;
  codigo_final TEXT;
BEGIN
  -- Generar timestamp
  timestamp_str := TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');
  
  -- Generar string aleatorio
  random_str := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
  
  -- Combinar para crear código único
  codigo_base := 'GEQ' || timestamp_str || random_str;
  
  -- Asegurar que no existe ya (muy improbable pero por seguridad)
  WHILE EXISTS (SELECT 1 FROM profesionales_sanitarios WHERE codigo_barras = codigo_base) LOOP
    random_str := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
    codigo_base := 'GEQ' || timestamp_str || random_str;
  END LOOP;
  
  RETURN codigo_base;
END;
$$;

-- Crear función para generar carnet cuando cambie a "Pendiente de Firma"
CREATE OR REPLACE FUNCTION public.generar_carnet_profesional()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  prefijo_area VARCHAR(10);
  año_actual INTEGER;
  numero_correlativo INTEGER;
  nuevo_carnet TEXT;
BEGIN
  -- Solo generar carnet cuando el estado cambia a 'Pendiente de Firma'
  IF NEW.estado_solicitud = 'Pendiente de Firma' AND (OLD.estado_solicitud IS NULL OR OLD.estado_solicitud != 'Pendiente de Firma') THEN
    
    -- Generar código de barras único
    IF NEW.codigo_barras IS NULL OR NEW.codigo_barras = '' THEN
      NEW.codigo_barras := public.generar_codigo_barras_unico();
    END IF;
    
    -- Obtener prefijo del área profesional
    CASE 
      WHEN NEW.area_profesional = 'MEDICINA GENERAL' THEN prefijo_area := 'MED';
      WHEN NEW.area_profesional = 'ENFERMERÍA' THEN prefijo_area := 'ENF';
      WHEN NEW.area_profesional = 'FARMACIA' THEN prefijo_area := 'FAR';
      WHEN NEW.area_profesional = 'LABORATORIO' THEN prefijo_area := 'LAB';
      WHEN NEW.area_profesional = 'RADIOLOGÍA' THEN prefijo_area := 'RAD';
      WHEN NEW.area_profesional = 'ODONTOLOGÍA' THEN prefijo_area := 'ODO';
      WHEN NEW.area_profesional = 'NUTRICIÓN' THEN prefijo_area := 'NUT';
      WHEN NEW.area_profesional = 'ESPECIALIDAD' THEN prefijo_area := 'ESP';
      ELSE prefijo_area := 'GEN';
    END CASE;
    
    -- Obtener año actual
    año_actual := EXTRACT(YEAR FROM NOW());
    
    -- Generar número correlativo basado en el área y año
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_carnet_profesional FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO numero_correlativo
    FROM profesionales_sanitarios 
    WHERE numero_carnet_profesional LIKE prefijo_area || '-' || año_actual || '-%';
    
    -- Crear número de carnet: PREFIJO-AÑO-CORRELATIVO
    nuevo_carnet := prefijo_area || '-' || año_actual || '-' || LPAD(numero_correlativo::TEXT, 4, '0');
    NEW.numero_carnet_profesional := nuevo_carnet;
    
    -- Establecer fecha de validez (1 año desde la fecha de aprobación del carnet)
    NEW.fecha_aprobacion_carnet := CURRENT_DATE;
    NEW.fecha_validez_carnet := CURRENT_DATE + INTERVAL '1 year';
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para generar carnet
DROP TRIGGER IF EXISTS trigger_generar_carnet_profesional ON public.profesionales_sanitarios;
CREATE TRIGGER trigger_generar_carnet_profesional
  BEFORE INSERT OR UPDATE ON public.profesionales_sanitarios
  FOR EACH ROW EXECUTE FUNCTION public.generar_carnet_profesional();

-- Crear tabla para búsqueda pública de profesionales
CREATE TABLE IF NOT EXISTS public.busqueda_profesionales_publica (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id UUID REFERENCES public.profesionales_sanitarios(id),
  numero_carnet TEXT,
  nombre_completo TEXT,
  area_profesional TEXT,
  estado_acreditacion TEXT,
  fecha_validez DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_busqueda_numero_carnet ON public.busqueda_profesionales_publica(numero_carnet);
CREATE INDEX IF NOT EXISTS idx_busqueda_nombre ON public.busqueda_profesionales_publica(nombre_completo);

-- Habilitar RLS para búsqueda pública (todos pueden leer)
ALTER TABLE public.busqueda_profesionales_publica ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Búsqueda pública permitida para todos" 
ON public.busqueda_profesionales_publica 
FOR SELECT 
TO public 
USING (true);

-- Función para actualizar tabla de búsqueda pública
CREATE OR REPLACE FUNCTION public.actualizar_busqueda_publica()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Solo actualizar si el profesional está aprobado
  IF NEW.estado_solicitud = 'Aprobado' AND NEW.numero_carnet_profesional IS NOT NULL THEN
    INSERT INTO public.busqueda_profesionales_publica (
      profesional_id,
      numero_carnet,
      nombre_completo,
      area_profesional,
      estado_acreditacion,
      fecha_validez
    ) VALUES (
      NEW.id,
      NEW.numero_carnet_profesional,
      NEW.nombre_completo,
      NEW.area_profesional,
      'Acreditado',
      NEW.fecha_validez_carnet
    )
    ON CONFLICT (profesional_id) DO UPDATE SET
      numero_carnet = NEW.numero_carnet_profesional,
      nombre_completo = NEW.nombre_completo,
      area_profesional = NEW.area_profesional,
      estado_acreditacion = 'Acreditado',
      fecha_validez = NEW.fecha_validez_carnet;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para actualizar búsqueda pública
DROP TRIGGER IF EXISTS trigger_actualizar_busqueda_publica ON public.profesionales_sanitarios;
CREATE TRIGGER trigger_actualizar_busqueda_publica
  AFTER INSERT OR UPDATE ON public.profesionales_sanitarios
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_busqueda_publica();
