
-- Actualizar políticas RLS para permitir inserción pública de profesionales
DROP POLICY IF EXISTS "Permitir inserción pública de profesionales" ON public.profesionales_sanitarios;

CREATE POLICY "Permitir inserción pública de profesionales" 
  ON public.profesionales_sanitarios 
  FOR INSERT 
  WITH CHECK (true);

-- Actualizar política de actualización para permitir cambios de estado
DROP POLICY IF EXISTS "Permitir actualización pública de profesionales" ON public.profesionales_sanitarios;

CREATE POLICY "Permitir actualización pública de profesionales" 
  ON public.profesionales_sanitarios 
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);

-- Dar acceso completo de lectura a todas las tablas para el análisis de IA
CREATE POLICY "Permitir lectura pública de distritos" 
  ON public.distrito_sanitario 
  FOR SELECT 
  USING (true);

CREATE POLICY "Permitir lectura pública de nacionalidades" 
  ON public.nacionalidades_mundo 
  FOR SELECT 
  USING (true);

CREATE POLICY "Permitir lectura pública de incidencias" 
  ON public.incidencias_hospitalarias 
  FOR SELECT 
  USING (true);

CREATE POLICY "Permitir lectura pública de notificaciones" 
  ON public.notificaciones_sms 
  FOR SELECT 
  USING (true);

-- Habilitar RLS en tablas que no la tienen
ALTER TABLE public.distrito_sanitario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nacionalidades_mundo ENABLE ROW LEVEL SECURITY;
