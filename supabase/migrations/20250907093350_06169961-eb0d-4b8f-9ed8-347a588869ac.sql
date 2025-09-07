-- Crear tabla para solicitudes de establecimientos sanitarios
CREATE TABLE IF NOT EXISTS public.solicitudes_establecimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_solicitud TEXT UNIQUE,
  numero_registro TEXT,
  
  -- Datos del establecimiento
  nombre_establecimiento TEXT NOT NULL,
  categoria TEXT NOT NULL, -- Hospital, Centro de Salud, Clínica, etc.
  tipo_servicio TEXT NOT NULL, -- Público, Privado, Mixto
  provincia TEXT NOT NULL,
  distrito_sanitario TEXT,
  direccion TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  director_responsable TEXT,
  
  -- Servicios y capacidad
  servicios_ofrecidos TEXT[],
  numero_camas INTEGER DEFAULT 0,
  areas_especializadas TEXT[],
  equipamiento_medico TEXT[],
  
  -- Fotos y documentos
  fotos_establecimiento TEXT[], -- URLs de fotos en Supabase Storage
  documentos_adicionales TEXT[], -- URLs de documentos en Supabase Storage
  
  -- Estado y seguimiento
  estado TEXT DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Revisando', 'Pendiente de Firma', 'Autorizado', 'Rechazado')),
  motivo_rechazo TEXT,
  fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT now(),
  fecha_revision TIMESTAMP WITH TIME ZONE,
  fecha_autorizacion TIMESTAMP WITH TIME ZONE,
  
  -- Auditoría
  solicitante_id UUID REFERENCES auth.users(id),
  revisor_id UUID,
  autorizador_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Observaciones
  observaciones TEXT,
  notas_revision TEXT
);

-- RLS para solicitudes de establecimientos
ALTER TABLE public.solicitudes_establecimientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden crear solicitudes de establecimientos"
ON public.solicitudes_establecimientos
FOR INSERT
WITH CHECK (solicitante_id = auth.uid());

CREATE POLICY "Usuarios pueden ver sus solicitudes de establecimientos"
ON public.solicitudes_establecimientos
FOR SELECT
USING (solicitante_id = auth.uid() OR is_admin_user());

CREATE POLICY "Solo administradores pueden actualizar solicitudes de establecimientos"
ON public.solicitudes_establecimientos
FOR UPDATE
USING (is_admin_user());

-- Función para generar número de solicitud automático
CREATE OR REPLACE FUNCTION public.generar_numero_solicitud_establecimiento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  fecha_actual TEXT;
  numero_secuencial INTEGER;
  nuevo_numero TEXT;
BEGIN
  -- Obtener fecha actual en formato YYYYMMDD
  fecha_actual := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Obtener siguiente número de secuencia para establecimientos
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_solicitud FROM '\d+$') AS INTEGER)), 0) + 1 
  INTO numero_secuencial
  FROM public.solicitudes_establecimientos 
  WHERE numero_solicitud LIKE 'EST-' || fecha_actual || '-%';
  
  -- Generar número: EST-YYYYMMDD-NNNN (4 dígitos)
  nuevo_numero := 'EST-' || fecha_actual || '-' || LPAD(numero_secuencial::TEXT, 4, '0');
  
  NEW.numero_solicitud := nuevo_numero;
  RETURN NEW;
END;
$$;

-- Trigger para generar número automático
CREATE TRIGGER trigger_generar_numero_solicitud_establecimiento
  BEFORE INSERT ON public.solicitudes_establecimientos
  FOR EACH ROW
  EXECUTE FUNCTION public.generar_numero_solicitud_establecimiento();

-- Función para generar número de registro al autorizar
CREATE OR REPLACE FUNCTION public.generar_numero_registro_establecimiento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  fecha_actual TEXT;
  numero_secuencial INTEGER;
  nuevo_numero TEXT;
BEGIN
  -- Solo generar si el estado cambia a 'Autorizado' y no tiene número de registro
  IF NEW.estado = 'Autorizado' AND OLD.estado != 'Autorizado' AND NEW.numero_registro IS NULL THEN
    -- Obtener fecha actual en formato YYYYMMDD
    fecha_actual := TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Obtener siguiente número de secuencia para registros
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_registro FROM '\d+$') AS INTEGER)), 0) + 1 
    INTO numero_secuencial
    FROM public.solicitudes_establecimientos 
    WHERE numero_registro LIKE 'REG-' || fecha_actual || '-%';
    
    -- Generar número: REG-YYYYMMDD-NNNN (4 dígitos)
    nuevo_numero := 'REG-' || fecha_actual || '-' || LPAD(numero_secuencial::TEXT, 4, '0');
    
    NEW.numero_registro := nuevo_numero;
    NEW.fecha_autorizacion := NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para generar número de registro
CREATE TRIGGER trigger_generar_numero_registro_establecimiento
  BEFORE UPDATE ON public.solicitudes_establecimientos
  FOR EACH ROW
  EXECUTE FUNCTION public.generar_numero_registro_establecimiento();

-- Actualizar centros_salud para tener número de registro cuando se aprueban los pendientes
ALTER TABLE public.centros_salud ADD COLUMN IF NOT EXISTS numero_registro TEXT;
ALTER TABLE public.centros_salud ADD COLUMN IF NOT EXISTS fecha_registro TIMESTAMP WITH TIME ZONE;

-- Función para generar número de registro para centros existentes al aprobar
CREATE OR REPLACE FUNCTION public.generar_numero_registro_centro()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  fecha_actual TEXT;
  numero_secuencial INTEGER;
  nuevo_numero TEXT;
BEGIN
  -- Solo generar si el estado cambia a 'Activo' y no tiene número de registro
  IF NEW.estado = 'Activo' AND (OLD.estado IS NULL OR OLD.estado != 'Activo') AND NEW.numero_registro IS NULL THEN
    -- Obtener fecha actual en formato YYYYMMDD
    fecha_actual := TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Obtener siguiente número de secuencia para registros de centros
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_registro FROM '\d+$') AS INTEGER)), 0) + 1 
    INTO numero_secuencial
    FROM public.centros_salud 
    WHERE numero_registro LIKE 'CEN-' || fecha_actual || '-%';
    
    -- Generar número: CEN-YYYYMMDD-NNNN (4 dígitos)
    nuevo_numero := 'CEN-' || fecha_actual || '-' || LPAD(numero_secuencial::TEXT, 4, '0');
    
    NEW.numero_registro := nuevo_numero;
    NEW.fecha_registro := NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para generar número de registro en centros
CREATE TRIGGER trigger_generar_numero_registro_centro
  BEFORE UPDATE ON public.centros_salud
  FOR EACH ROW
  EXECUTE FUNCTION public.generar_numero_registro_centro();

-- Trigger para updated_at en solicitudes_establecimientos
CREATE TRIGGER update_solicitudes_establecimientos_updated_at
  BEFORE UPDATE ON public.solicitudes_establecimientos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();