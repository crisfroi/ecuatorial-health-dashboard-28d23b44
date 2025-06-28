
-- Tabla para rastrear las notificaciones SMS enviadas
CREATE TABLE public.notificaciones_sms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profesional_id UUID REFERENCES profesionales_sanitarios(id) ON DELETE CASCADE NOT NULL,
  telefono TEXT NOT NULL,
  tipo_notificacion TEXT NOT NULL, -- '30_dias_antes', '10_dias_despues', 'vencimiento'
  fecha_envio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  estado TEXT NOT NULL DEFAULT 'enviado', -- 'enviado', 'fallido'
  mensaje_sid TEXT, -- ID del mensaje de Twilio
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para optimizar consultas
CREATE INDEX idx_notificaciones_sms_profesional_id ON public.notificaciones_sms(profesional_id);
CREATE INDEX idx_notificaciones_sms_tipo ON public.notificaciones_sms(tipo_notificacion);
CREATE INDEX idx_notificaciones_sms_fecha ON public.notificaciones_sms(fecha_envio);

-- Habilitar RLS
ALTER TABLE public.notificaciones_sms ENABLE ROW LEVEL SECURITY;

-- Política para permitir a todos los usuarios autenticados leer sus notificaciones
CREATE POLICY "Users can view SMS notifications" 
  ON public.notificaciones_sms 
  FOR SELECT 
  USING (true);

-- Política para permitir insertar notificaciones (para el sistema)
CREATE POLICY "System can create SMS notifications" 
  ON public.notificaciones_sms 
  FOR INSERT 
  WITH CHECK (true);

-- Función para obtener el conteo de notificaciones por profesional
CREATE OR REPLACE FUNCTION public.get_notification_count(p_profesional_id UUID)
RETURNS TABLE(
  total_notificaciones BIGINT,
  notificaciones_30_dias BIGINT,
  notificaciones_10_dias BIGINT,
  ultima_notificacion TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_notificaciones,
    COUNT(*) FILTER (WHERE tipo_notificacion = '30_dias_antes') as notificaciones_30_dias,
    COUNT(*) FILTER (WHERE tipo_notificacion = '10_dias_despues') as notificaciones_10_dias,
    MAX(fecha_envio) as ultima_notificacion
  FROM public.notificaciones_sms 
  WHERE profesional_id = p_profesional_id;
END;
$$;

-- Actualizar la función para generar códigos de barras únicos
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

-- Trigger para generar código de barras automáticamente al insertar
CREATE OR REPLACE FUNCTION public.set_codigo_barras()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.codigo_barras IS NULL OR NEW.codigo_barras = '' THEN
    NEW.codigo_barras := public.generar_codigo_barras_unico();
  END IF;
  RETURN NEW;
END;
$$;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_set_codigo_barras ON profesionales_sanitarios;
CREATE TRIGGER trigger_set_codigo_barras
  BEFORE INSERT OR UPDATE ON profesionales_sanitarios
  FOR EACH ROW EXECUTE FUNCTION public.set_codigo_barras();

-- Actualizar registros existentes sin código de barras
UPDATE profesionales_sanitarios 
SET codigo_barras = public.generar_codigo_barras_unico()
WHERE codigo_barras IS NULL OR codigo_barras = '';
