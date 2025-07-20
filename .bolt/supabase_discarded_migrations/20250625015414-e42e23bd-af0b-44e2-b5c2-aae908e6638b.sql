
-- Crear la tabla de profesionales sanitarios
CREATE TABLE public.profesionales_sanitarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Información personal básica
  nombre_completo TEXT NOT NULL,
  nombre TEXT,
  apellidos TEXT,
  fecha_nacimiento DATE,
  edad INTEGER,
  genero VARCHAR(20) CHECK (genero IN ('MASCULINO', 'FEMENINO', 'M', 'F')),
  nacionalidad TEXT,
  gentilicio TEXT,
  domicilio TEXT,
  
  -- Documentación
  numero_dip TEXT,
  numero_pasaporte TEXT,
  numero_documento TEXT,
  tipo_documento VARCHAR(20) CHECK (tipo_documento IN ('DNI', 'DIP', 'PASAPORTE')),
  telefono TEXT,
  
  -- Información profesional
  area_profesional TEXT NOT NULL,
  prefijo_area VARCHAR(10),
  especialidad TEXT,
  numero_carnet_profesional TEXT UNIQUE,
  fecha_validez_carnet DATE,
  
  -- Ubicación y trabajo
  lugar_trabajo TEXT,
  provincia TEXT,
  distrito TEXT,
  distrito_sanitario TEXT,
  categoria_centro TEXT,
  tipo_sector VARCHAR(20) CHECK (tipo_sector IN ('Público', 'Privado')),
  puesto_responsabilidad TEXT,
  
  -- Estado y proceso
  estado_solicitud VARCHAR(20) CHECK (estado_solicitud IN ('Pendiente', 'Aprobado', 'Rechazado', 'Revisando')) DEFAULT 'Pendiente',
  estado_trabajo VARCHAR(50),
  fecha_solicitud DATE,
  fecha_revision DATE,
  fecha_aprobacion DATE,
  fecha_aprobacion_carnet DATE,
  motivo_rechazo TEXT,
  ultima_modificacion_por TEXT,
  
  -- Formación académica
  titulacion_especifica_1 TEXT,
  tipo_formacion_1 TEXT,
  institucion_1 TEXT,
  periodo_formacion_1 TEXT,
  pais_formacion_1 TEXT,
  año_graduacion INTEGER,
  
  titulacion_especifica_2 TEXT,
  tipo_formacion_2 TEXT,
  institucion_2 TEXT,
  periodo_formacion_2 TEXT,
  pais_formacion_2 TEXT,
  
  titulo_adjunto_1 TEXT,
  titulo_adjunto_2 TEXT,
  
  -- Cooperación internacional
  pertenece_brigada_medica BOOLEAN DEFAULT FALSE,
  tipo_cooperacion TEXT,
  brigada_cooperacion TEXT,
  
  -- Situación laboral
  año_inicio_paro INTEGER,
  meses_en_paro INTEGER DEFAULT 0,
  
  -- Documentos y códigos
  codigo_expediente TEXT UNIQUE,
  numero_correlativo INTEGER,
  autonumerico_interno INTEGER,
  codigo_barras TEXT,
  url_codigo_barras TEXT,
  
  -- URLs de documentos
  foto_carnet TEXT,
  url_pdf TEXT,
  url_carta_resolucion TEXT,
  pdf_formulario TEXT,
  copia_dip TEXT,
  copia_pasaporte TEXT,
  
  -- Campos de auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  creada TEXT,
  created_time TEXT
);

-- Crear índices para optimizar consultas
CREATE INDEX idx_profesionales_area_profesional ON public.profesionales_sanitarios(area_profesional);
CREATE INDEX idx_profesionales_estado_solicitud ON public.profesionales_sanitarios(estado_solicitud);
CREATE INDEX idx_profesionales_provincia ON public.profesionales_sanitarios(provincia);
CREATE INDEX idx_profesionales_distrito ON public.profesionales_sanitarios(distrito);
CREATE INDEX idx_profesionales_genero ON public.profesionales_sanitarios(genero);
CREATE INDEX idx_profesionales_tipo_sector ON public.profesionales_sanitarios(tipo_sector);
CREATE INDEX idx_profesionales_fecha_validez ON public.profesionales_sanitarios(fecha_validez_carnet);
CREATE INDEX idx_profesionales_nombre_completo ON public.profesionales_sanitarios(nombre_completo);
CREATE INDEX idx_profesionales_codigo_expediente ON public.profesionales_sanitarios(codigo_expediente);

-- Crear función para actualizar el campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar automáticamente updated_at
CREATE TRIGGER update_profesionales_updated_at
    BEFORE UPDATE ON public.profesionales_sanitarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.profesionales_sanitarios ENABLE ROW LEVEL SECURITY;

-- Crear políticas básicas de RLS (por ahora permisivas para desarrollo)
CREATE POLICY "Permitir lectura pública de profesionales" 
  ON public.profesionales_sanitarios 
  FOR SELECT 
  USING (true);

CREATE POLICY "Permitir inserción pública de profesionales" 
  ON public.profesionales_sanitarios 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Permitir actualización pública de profesionales" 
  ON public.profesionales_sanitarios 
  FOR UPDATE 
  USING (true);

-- Crear función para calcular edad automáticamente
CREATE OR REPLACE FUNCTION calcular_edad()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.fecha_nacimiento IS NOT NULL THEN
        NEW.edad = EXTRACT(YEAR FROM AGE(NEW.fecha_nacimiento));
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para calcular edad automáticamente
CREATE TRIGGER trigger_calcular_edad
    BEFORE INSERT OR UPDATE ON public.profesionales_sanitarios
    FOR EACH ROW
    EXECUTE FUNCTION calcular_edad();
