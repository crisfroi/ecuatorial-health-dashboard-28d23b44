-- EJECUCIÓN 1: Base SQL + Usuarios de Prueba con Centros Reales

-- Crear usuarios de prueba para cada rol con centros reales de la BD
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'admin@ministerio.gq', NOW(), NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'rrhh@ministerio.gq', NOW(), NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'gobierno@ministerio.gq', NOW(), NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', 'habilitacion@ministerio.gq', NOW(), NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555', 'admin.bata@ministerio.gq', NOW(), NOW(), NOW()),
  ('66666666-6666-6666-6666-666666666666', 'observador@ministerio.gq', NOW(), NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  updated_at = NOW();

-- Obtener IDs de centros reales para asignar a usuarios
DO $$
DECLARE
  centro_malabo UUID;
  centro_bata UUID;
  centro_sampaka UUID;
  centro_esperanza UUID;
  centro_sipopo UUID;
  centro_nacional UUID;
BEGIN
  -- Buscar centros existentes
  SELECT id INTO centro_malabo FROM centros_salud WHERE nombre ILIKE '%malabo%' AND categoria ILIKE '%regional%' LIMIT 1;
  SELECT id INTO centro_bata FROM centros_salud WHERE nombre ILIKE '%bata%' AND (categoria ILIKE '%regional%' OR categoria ILIKE '%hospital%') LIMIT 1;
  SELECT id INTO centro_sampaka FROM centros_salud WHERE nombre ILIKE '%sampaka%' LIMIT 1;
  SELECT id INTO centro_esperanza FROM centros_salud WHERE nombre ILIKE '%esperanza%' LIMIT 1;
  SELECT id INTO centro_sipopo FROM centros_salud WHERE nombre ILIKE '%sipopo%' LIMIT 1;
  SELECT id INTO centro_nacional FROM centros_salud WHERE nombre ILIKE '%nacional%' LIMIT 1;

  -- Si no hay centros específicos, usar los primeros disponibles
  IF centro_malabo IS NULL THEN
    SELECT id INTO centro_malabo FROM centros_salud WHERE provincia = 'Bioko Norte' LIMIT 1;
  END IF;
  
  IF centro_bata IS NULL THEN
    SELECT id INTO centro_bata FROM centros_salud WHERE provincia = 'Litoral' LIMIT 1;
  END IF;
  
  IF centro_sampaka IS NULL THEN
    SELECT id INTO centro_sampaka FROM centros_salud OFFSET 2 LIMIT 1;
  END IF;
  
  IF centro_esperanza IS NULL THEN
    SELECT id INTO centro_esperanza FROM centros_salud OFFSET 3 LIMIT 1;
  END IF;
  
  IF centro_sipopo IS NULL THEN
    SELECT id INTO centro_sipopo FROM centros_salud OFFSET 4 LIMIT 1;
  END IF;
  
  IF centro_nacional IS NULL THEN
    SELECT id INTO centro_nacional FROM centros_salud OFFSET 5 LIMIT 1;
  END IF;

  -- Crear perfiles de usuario con centros asignados
  INSERT INTO user_profiles (id, email, full_name, role, assigned_center_id, is_active, created_at, updated_at)
  VALUES 
    ('11111111-1111-1111-1111-111111111111', 'admin@ministerio.gq', 'Administrador General del Sistema', 'SUPER_ADMINISTRADOR', centro_malabo, true, NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'rrhh@ministerio.gq', 'Director Recursos Humanos', 'RRHH_MINISTERIO', centro_bata, true, NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', 'gobierno@ministerio.gq', 'Miembro del Gobierno', 'MIEMBRO_GOBIERNO', centro_sipopo, true, NOW(), NOW()),
    ('44444444-4444-4444-4444-444444444444', 'habilitacion@ministerio.gq', 'Responsable de Habilitación', 'HABILITACION', centro_sampaka, true, NOW(), NOW()),
    ('55555555-5555-5555-5555-555555555555', 'admin.bata@ministerio.gq', 'Administrador Centro de Bata', 'ADMIN_CENTRO_SANITARIO', centro_bata, true, NOW(), NOW()),
    ('66666666-6666-6666-6666-666666666666', 'observador@ministerio.gq', 'Observador del Sistema', 'OBSERVADOR', centro_nacional, true, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    assigned_center_id = EXCLUDED.assigned_center_id,
    updated_at = NOW();

  RAISE NOTICE 'Usuarios de prueba creados exitosamente con centros: Malabo %, Bata %, Sampaka %, Esperanza %, Sipopo %, Nacional %', 
    centro_malabo, centro_bata, centro_sampaka, centro_esperanza, centro_sipopo, centro_nacional;
END $$;

-- Crear tabla de solicitudes de establecimiento para la fase 5
CREATE TABLE IF NOT EXISTS public.solicitudes_establecimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_establecimiento TEXT NOT NULL,
  tipo_establecimiento TEXT NOT NULL, -- Hospital, Centro de Salud, Clínica, etc.
  categoria TEXT NOT NULL, -- Nacional, Regional, Rural, etc.
  sector TEXT NOT NULL DEFAULT 'Público', -- Público, Privado, Mixto
  provincia TEXT NOT NULL,
  distrito TEXT NOT NULL,
  distrito_sanitario TEXT,
  direccion_completa TEXT NOT NULL,
  telefono TEXT,
  email_contacto TEXT,
  nombre_responsable TEXT NOT NULL,
  cargo_responsable TEXT NOT NULL,
  documento_responsable TEXT,
  servicios_ofrecidos TEXT[], -- Array de servicios que ofrecerá
  especialidades TEXT[], -- Array de especialidades médicas
  numero_camas INTEGER DEFAULT 0,
  numero_consultorios INTEGER DEFAULT 0,
  equipamiento_basico TEXT[],
  justificacion TEXT NOT NULL, -- Por qué es necesario este establecimiento
  poblacion_beneficiada INTEGER,
  documentos_adjuntos TEXT[], -- URLs de documentos subidos
  estado_solicitud TEXT DEFAULT 'Recibida' CHECK (estado_solicitud IN ('Recibida', 'En Revisión', 'Aprobada', 'Rechazada', 'Requiere Información')),
  motivo_rechazo TEXT,
  notas_revision TEXT,
  fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_revision TIMESTAMP WITH TIME ZONE,
  fecha_aprobacion TIMESTAMP WITH TIME ZONE,
  revisor_id UUID REFERENCES user_profiles(id),
  aprobado_por UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en solicitudes de establecimiento
ALTER TABLE public.solicitudes_establecimientos ENABLE ROW LEVEL SECURITY;

-- Política para que cualquiera pueda crear solicitudes
CREATE POLICY "Cualquiera puede crear solicitudes de establecimiento" ON public.solicitudes_establecimientos
  FOR INSERT WITH CHECK (true);

-- Política para que usuarios autenticados puedan ver solicitudes
CREATE POLICY "Usuarios autenticados pueden ver solicitudes" ON public.solicitudes_establecimientos
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para que solo admins puedan actualizar solicitudes
CREATE POLICY "Solo admins pueden actualizar solicitudes" ON public.solicitudes_establecimientos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.id = auth.uid() 
      AND up.role IN ('SUPER_ADMINISTRADOR', 'RRHH_MINISTERIO', 'MIEMBRO_GOBIERNO', 'HABILITACION')
    )
  );

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_solicitudes_establecimientos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_solicitudes_establecimientos_updated_at ON public.solicitudes_establecimientos;
CREATE TRIGGER update_solicitudes_establecimientos_updated_at
  BEFORE UPDATE ON public.solicitudes_establecimientos
  FOR EACH ROW EXECUTE FUNCTION update_solicitudes_establecimientos_updated_at();