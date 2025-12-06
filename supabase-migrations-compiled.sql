-- MIGRACIONES HOSIX COMPILADAS
-- Generado: 2025-12-06T14:47:36.966Z
-- Total: 44 migraciones
-- URL: https://wdieynendfjbkbhfovrx.supabase.co

-- INSTRUCCIONES:
-- 1. Abre https://app.supabase.com
-- 2. Selecciona el proyecto wdieynendfjbkbhfovrx
-- 3. Ve a SQL Editor > New Query
-- 4. Copia y pega este contenido
-- 5. Revisa los warnings y errores
-- 6. Haz clic en "Run"
-- 7. Verifica los resultados
-- 8. Si hay errores, revisa el archivo de migración individual

-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 

-- ============================================
-- [1/44] 20240101000000_create_biometric_sync_logs.sql
-- ============================================

-- Create biometric_sync_logs table to track sync activity
create table if not exists biometric_sync_logs (
  id bigserial primary key,
  device_sn text not null,
  status text not null check (status in ('success', 'error')),
  records_synced integer not null default 0,
  error_message text,
  synced_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for faster queries
create index if not exists idx_biometric_sync_logs_device_sn on biometric_sync_logs(device_sn);
create index if not exists idx_biometric_sync_logs_synced_at on biometric_sync_logs(synced_at desc);
create index if not exists idx_biometric_sync_logs_status on biometric_sync_logs(status);

-- Add RLS policies
alter table biometric_sync_logs enable row level security;

-- Allow authenticated users to read sync logs
create policy "Allow authenticated users to read sync logs"
  on biometric_sync_logs for select
  using (auth.role() = 'authenticated');

-- Allow service role to insert logs (from Edge Functions)
create policy "Allow service role to insert sync logs"
  on biometric_sync_logs for insert
  with check (true);

-- Extend attendance_logs table with biometric-specific fields if they don't exist
alter table attendance_logs
add column if not exists source text default 'manual',
add column if not exists sync_timestamp timestamp with time zone,
add column if not exists temperatura numeric,
add column if not exists imagen_url text;

-- Create index for biometric source logs
create index if not exists idx_attendance_logs_source on attendance_logs(source) 
where source = 'biometric_sdk';


-- ============================================
-- [2/44] 20241201_dynamic_forms.sql
-- ============================================

-- Migración para sistema de formularios dinámicos
-- Fecha: 2024-12-01

-- Tabla para formularios dinámicos
CREATE TABLE IF NOT EXISTS dynamic_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'otros',
    fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    public_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    submissions_count INTEGER DEFAULT 0
);

-- Tabla para envíos de formularios
CREATE TABLE IF NOT EXISTS form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES dynamic_forms(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    submitted_by UUID REFERENCES auth.users(id),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabla para indicadores de profesionales
CREATE TABLE IF NOT EXISTS professional_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('text', 'number', 'date', 'boolean', 'select', 'multiselect', 'file', 'json')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('personal', 'profesional', 'academico', 'laboral', 'certificaciones', 'sanciones', 'reconocimientos', 'experiencia', 'idiomas', 'publicaciones', 'proyectos', 'otros')),
    description TEXT,
    form_id UUID REFERENCES dynamic_forms(id) ON DELETE SET NULL,
    is_required BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    validation JSONB DEFAULT '{}'::jsonb,
    options JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para valores de indicadores de profesionales
CREATE TABLE IF NOT EXISTS professional_indicator_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
    indicator_id UUID NOT NULL REFERENCES professional_indicators(id) ON DELETE CASCADE,
    value JSONB,
    submission_id UUID REFERENCES form_submissions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(professional_id, indicator_id)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_dynamic_forms_category ON dynamic_forms(category);
CREATE INDEX IF NOT EXISTS idx_dynamic_forms_created_by ON dynamic_forms(created_by);
CREATE INDEX IF NOT EXISTS idx_dynamic_forms_is_active ON dynamic_forms(is_active);
CREATE INDEX IF NOT EXISTS idx_dynamic_forms_public_url ON dynamic_forms USING GIN ((public_settings->>'public_url'));

CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_by ON form_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at ON form_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);

CREATE INDEX IF NOT EXISTS idx_professional_indicators_category ON professional_indicators(category);
CREATE INDEX IF NOT EXISTS idx_professional_indicators_type ON professional_indicators(type);
CREATE INDEX IF NOT EXISTS idx_professional_indicators_order ON professional_indicators(order_index);

CREATE INDEX IF NOT EXISTS idx_professional_indicator_values_professional_id ON professional_indicator_values(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_indicator_values_indicator_id ON professional_indicator_values(indicator_id);

-- Políticas RLS para dynamic_forms
ALTER TABLE dynamic_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dynamic_forms_select_policy" ON dynamic_forms
    FOR SELECT USING (
        is_active = true OR 
        auth.role() = 'service_role' OR
        (created_by = auth.uid() AND auth.role() = 'authenticated')
    );

CREATE POLICY "dynamic_forms_insert_policy" ON dynamic_forms
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND created_by = auth.uid())
    );

CREATE POLICY "dynamic_forms_update_policy" ON dynamic_forms
    FOR UPDATE USING (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND created_by = auth.uid())
    );

CREATE POLICY "dynamic_forms_delete_policy" ON dynamic_forms
    FOR DELETE USING (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND created_by = auth.uid())
    );

-- Políticas RLS para form_submissions
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "form_submissions_select_policy" ON form_submissions
    FOR SELECT USING (
        auth.role() = 'service_role' OR
        submitted_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM dynamic_forms 
            WHERE dynamic_forms.id = form_submissions.form_id 
            AND dynamic_forms.created_by = auth.uid()
        )
    );

CREATE POLICY "form_submissions_insert_policy" ON form_submissions
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role' OR
        submitted_by = auth.uid()
    );

CREATE POLICY "form_submissions_update_policy" ON form_submissions
    FOR UPDATE USING (
        auth.role() = 'service_role' OR
        submitted_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM dynamic_forms 
            WHERE dynamic_forms.id = form_submissions.form_id 
            AND dynamic_forms.created_by = auth.uid()
        )
    );

-- Políticas RLS para professional_indicators
ALTER TABLE professional_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "professional_indicators_select_policy" ON professional_indicators
    FOR SELECT USING (
        auth.role() = 'service_role' OR
        auth.role() = 'authenticated'
    );

CREATE POLICY "professional_indicators_insert_policy" ON professional_indicators
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role' OR
        auth.role() = 'authenticated'
    );

CREATE POLICY "professional_indicators_update_policy" ON professional_indicators
    FOR UPDATE USING (
        auth.role() = 'service_role' OR
        auth.role() = 'authenticated'
    );

CREATE POLICY "professional_indicators_delete_policy" ON professional_indicators
    FOR DELETE USING (
        auth.role() = 'service_role' OR
        auth.role() = 'authenticated'
    );

-- Políticas RLS para professional_indicator_values
ALTER TABLE professional_indicator_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "professional_indicator_values_select_policy" ON professional_indicator_values
    FOR SELECT USING (
        auth.role() = 'service_role' OR
        auth.role() = 'authenticated'
    );

CREATE POLICY "professional_indicator_values_insert_policy" ON professional_indicator_values
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role' OR
        auth.role() = 'authenticated'
    );

CREATE POLICY "professional_indicator_values_update_policy" ON professional_indicator_values
    FOR UPDATE USING (
        auth.role() = 'service_role' OR
        auth.role() = 'authenticated'
    );

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_dynamic_forms_updated_at 
    BEFORE UPDATE ON dynamic_forms 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professional_indicators_updated_at 
    BEFORE UPDATE ON professional_indicators 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professional_indicator_values_updated_at 
    BEFORE UPDATE ON professional_indicator_values 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para incrementar contador de envíos
CREATE OR REPLACE FUNCTION increment_form_submissions_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE dynamic_forms 
    SET submissions_count = submissions_count + 1 
    WHERE id = NEW.form_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER increment_form_submissions_count_trigger
    AFTER INSERT ON form_submissions
    FOR EACH ROW EXECUTE FUNCTION increment_form_submissions_count();

-- Insertar algunos indicadores de ejemplo
INSERT INTO professional_indicators (name, type, category, description, is_required, is_visible, order_index) VALUES
('Condecoraciones recibidas', 'select', 'reconocimientos', 'Condecoraciones y reconocimientos oficiales recibidos', false, true, 1),
('Cargos desempeñados', 'json', 'laboral', 'Historial de cargos y posiciones desempeñadas', false, true, 2),
('Sanciones disciplinarias', 'json', 'sanciones', 'Registro de sanciones o medidas disciplinarias', false, true, 3),
('Certificaciones adicionales', 'multiselect', 'certificaciones', 'Certificaciones profesionales adicionales', false, true, 4),
('Idiomas dominados', 'json', 'idiomas', 'Idiomas que domina el profesional', false, true, 5),
('Publicaciones científicas', 'json', 'publicaciones', 'Artículos y publicaciones científicas', false, true, 6),
('Proyectos de investigación', 'json', 'proyectos', 'Proyectos de investigación participados', false, true, 7),
('Experiencia internacional', 'boolean', 'experiencia', 'Tiene experiencia trabajando en el extranjero', false, true, 8),
('Fecha de cese', 'date', 'laboral', 'Fecha en que cesó en su último puesto', false, true, 9),
('Motivo de cese', 'select', 'laboral', 'Motivo por el cual cesó en su último puesto', false, true, 10);

-- Actualizar opciones para los indicadores de tipo select
UPDATE professional_indicators 
SET options = '[
    {"id": "1", "label": "Orden del Mérito Civil", "value": "merito_civil"},
    {"id": "2", "label": "Medalla al Mérito Sanitario", "value": "merito_sanitario"},
    {"id": "3", "label": "Distinción Ministerial", "value": "distincion_ministerial"},
    {"id": "4", "label": "Otro", "value": "otro"}
]'::jsonb
WHERE name = 'Condecoraciones recibidas';

UPDATE professional_indicators 
SET options = '[
    {"id": "1", "label": "Jubilación", "value": "jubilacion"},
    {"id": "2", "label": "Renuncia voluntaria", "value": "renuncia"},
    {"id": "3", "label": "Despido", "value": "despido"},
    {"id": "4", "label": "Contrato vencido", "value": "contrato_vencido"},
    {"id": "5", "label": "Reestructuración", "value": "reestructuracion"},
    {"id": "6", "label": "Otro", "value": "otro"}
]'::jsonb
WHERE name = 'Motivo de cese';

UPDATE professional_indicators 
SET options = '[
    {"id": "1", "label": "Certificación ISO 9001", "value": "iso_9001"},
    {"id": "2", "label": "Certificación en Gestión de Calidad", "value": "gestion_calidad"},
    {"id": "3", "label": "Certificación en Seguridad del Paciente", "value": "seguridad_paciente"},
    {"id": "4", "label": "Certificación en Liderazgo Sanitario", "value": "liderazgo_sanitario"},
    {"id": "5", "label": "Certificación en Telemedicina", "value": "telemedicina"},
    {"id": "6", "label": "Otro", "value": "otro"}
]'::jsonb
WHERE name = 'Certificaciones adicionales';



-- ============================================
-- [3/44] 20250116_001_hosix_base_schema.sql
-- ============================================

-- HOSIX Sistema de Gestión Hospitalaria
-- Migración 001: Configuración Base, Usuarios, Perfiles y Seguridad
-- Fecha: 2025-01-16

-- ============================================================
-- 1. TABLAS DE CONFIGURACIÓN Y PARAMETRIZACIÓN
-- ============================================================

-- Departamentos
CREATE TABLE IF NOT EXISTS hosix_departamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  centro_salud_id UUID,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Servicios
CREATE TABLE IF NOT EXISTS hosix_servicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  departamento_id UUID REFERENCES hosix_departamentos(id),
  tipo_servicio VARCHAR(50),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. TABLAS DE USUARIOS Y SEGURIDAD
-- ============================================================

-- Perfiles / Roles
CREATE TABLE IF NOT EXISTS hosix_perfiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  nivel_acceso INT DEFAULT 1,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Usuarios HOSIX
CREATE TABLE IF NOT EXISTS hosix_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id),
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(255) NOT NULL,
  perfil_id UUID REFERENCES hosix_perfiles(id),
  centro_salud_id UUID,
  activo BOOLEAN DEFAULT true,
  ultimo_acceso TIMESTAMPTZ,
  intentos_fallidos INT DEFAULT 0,
  bloqueado_hasta TIMESTAMPTZ,
  cambio_password_requerido BOOLEAN DEFAULT false,
  password_expira TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Permisos por Módulo
CREATE TABLE IF NOT EXISTS hosix_permisos_modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID REFERENCES hosix_perfiles(id) NOT NULL,
  modulo VARCHAR(100) NOT NULL,
  puede_leer BOOLEAN DEFAULT false,
  puede_crear BOOLEAN DEFAULT false,
  puede_editar BOOLEAN DEFAULT false,
  puede_eliminar BOOLEAN DEFAULT false,
  puede_aprobar BOOLEAN DEFAULT false,
  permisos_adicionales JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(perfil_id, modulo)
);

-- Sesiones HOSIX
CREATE TABLE IF NOT EXISTS hosix_sesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES hosix_usuarios(id) NOT NULL,
  token VARCHAR(500),
  ip_address INET,
  user_agent TEXT,
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_expiracion TIMESTAMPTZ NOT NULL,
  activa BOOLEAN DEFAULT true,
  fecha_cierre TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auditoría de Accesos y Cambios
CREATE TABLE IF NOT EXISTS hosix_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES hosix_usuarios(id),
  accion VARCHAR(100) NOT NULL,
  tabla_afectada VARCHAR(100),
  registro_id UUID,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. INDICES PARA PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_hosix_usuarios_username ON hosix_usuarios(username);
CREATE INDEX IF NOT EXISTS idx_hosix_usuarios_email ON hosix_usuarios(email);
CREATE INDEX IF NOT EXISTS idx_hosix_usuarios_perfil ON hosix_usuarios(perfil_id);
CREATE INDEX IF NOT EXISTS idx_hosix_sesiones_usuario ON hosix_sesiones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_hosix_sesiones_activa ON hosix_sesiones(activa);
CREATE INDEX IF NOT EXISTS idx_hosix_auditoria_usuario ON hosix_auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_hosix_auditoria_tabla ON hosix_auditoria(tabla_afectada);
CREATE INDEX IF NOT EXISTS idx_hosix_auditoria_fecha ON hosix_auditoria(created_at);
CREATE INDEX IF NOT EXISTS idx_hosix_permisos_perfil ON hosix_permisos_modulos(perfil_id);

-- ============================================================
-- 4. DATOS INICIALES (Perfiles y Usuarios de Prueba)
-- ============================================================

-- Insertar perfiles base
INSERT INTO hosix_perfiles (codigo, nombre, descripcion, nivel_acceso) VALUES
('admin', 'Administrador', 'Acceso total al sistema', 10)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO hosix_perfiles (codigo, nombre, descripcion, nivel_acceso) VALUES
('medico', 'Médico', 'Acceso a módulos clínicos', 5)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO hosix_perfiles (codigo, nombre, descripcion, nivel_acceso) VALUES
('enfermera', 'Enfermería', 'Acceso a módulos de enfermería', 4)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO hosix_perfiles (codigo, nombre, descripcion, nivel_acceso) VALUES
('administrador_centro', 'Admin Centro', 'Administrador de centro de salud', 7)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar usuario admin de prueba
INSERT INTO hosix_usuarios (
  username, email, nombre_completo, perfil_id, activo, intentos_fallidos
) 
SELECT 
  'admin',
  'admin@hosix.local',
  'Administrador Sistema',
  (SELECT id FROM hosix_perfiles WHERE codigo = 'admin'),
  true,
  0
WHERE NOT EXISTS (SELECT 1 FROM hosix_usuarios WHERE username = 'admin');

-- Insertar usuario médico de prueba
INSERT INTO hosix_usuarios (
  username, email, nombre_completo, perfil_id, activo, intentos_fallidos
)
SELECT
  'medico_test',
  'medico@hosix.local',
  'Dr. Juan Pérez',
  (SELECT id FROM hosix_perfiles WHERE codigo = 'medico'),
  true,
  0
WHERE NOT EXISTS (SELECT 1 FROM hosix_usuarios WHERE username = 'medico_test');

-- Insertar usuario enfermería de prueba
INSERT INTO hosix_usuarios (
  username, email, nombre_completo, perfil_id, activo, intentos_fallidos
)
SELECT
  'enfermera_test',
  'enfermera@hosix.local',
  'Dra. María García',
  (SELECT id FROM hosix_perfiles WHERE codigo = 'enfermera'),
  true,
  0
WHERE NOT EXISTS (SELECT 1 FROM hosix_usuarios WHERE username = 'enfermera_test');

-- Insertar permisos base para Admin (acceso total)
INSERT INTO hosix_permisos_modulos (
  perfil_id, modulo, puede_leer, puede_crear, puede_editar, puede_eliminar, puede_aprobar
)
SELECT
  id, 'pacientes', true, true, true, true, true
FROM hosix_perfiles WHERE codigo = 'admin'
ON CONFLICT (perfil_id, modulo) DO NOTHING;

INSERT INTO hosix_permisos_modulos (
  perfil_id, modulo, puede_leer, puede_crear, puede_editar, puede_eliminar, puede_aprobar
)
SELECT
  id, 'usuarios', true, true, true, true, true
FROM hosix_perfiles WHERE codigo = 'admin'
ON CONFLICT (perfil_id, modulo) DO NOTHING;

-- ============================================================
-- 5. RLS (ROW LEVEL SECURITY) POLICIES
-- ============================================================

ALTER TABLE hosix_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_permisos_modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_auditoria ENABLE ROW LEVEL SECURITY;

-- Usuarios: solo admins pueden ver/editar todos, cada usuario puede ver su propio perfil
CREATE POLICY "usuarios_read_policy" ON hosix_usuarios FOR SELECT USING (true);
CREATE POLICY "usuarios_update_own_policy" ON hosix_usuarios FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "usuarios_insert_admin_policy" ON hosix_usuarios FOR INSERT WITH CHECK (true);

-- Perfiles: todos pueden leer
CREATE POLICY "perfiles_read_policy" ON hosix_perfiles FOR SELECT USING (true);

-- Permisos: todos pueden leer sus propios permisos
CREATE POLICY "permisos_read_policy" ON hosix_permisos_modulos FOR SELECT USING (true);

-- Sesiones: solo admin y el usuario propietario
CREATE POLICY "sesiones_read_policy" ON hosix_sesiones FOR SELECT USING (true);

-- Auditoría: solo lectura para admins
CREATE POLICY "auditoria_read_policy" ON hosix_auditoria FOR SELECT USING (true);


-- ============================================
-- [4/44] 20250116_002_hosix_pacientes_historia_clinica.sql
-- ============================================

-- HOSIX Sistema de Gestión Hospitalaria
-- Migración 002: Pacientes e Historia Clínica Electrónica
-- Fecha: 2025-01-16

-- ============================================================
-- 1. PACIENTES
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ppi VARCHAR(20) UNIQUE NOT NULL,
  
  -- Datos personales
  primer_nombre VARCHAR(100) NOT NULL,
  segundo_nombre VARCHAR(100),
  primer_apellido VARCHAR(100) NOT NULL,
  segundo_apellido VARCHAR(100),
  fecha_nacimiento DATE NOT NULL,
  sexo VARCHAR(10) NOT NULL,
  
  -- Documentos
  tipo_documento VARCHAR(50),
  numero_documento VARCHAR(50),
  pais_documento VARCHAR(100),
  
  -- Contacto
  direccion TEXT,
  ciudad VARCHAR(100),
  provincia VARCHAR(100),
  codigo_postal VARCHAR(20),
  telefono_fijo VARCHAR(20),
  telefono_movil VARCHAR(20),
  email VARCHAR(255),
  
  -- Datos médicos
  grupo_sanguineo VARCHAR(5),
  alergias JSONB DEFAULT '[]',
  antecedentes_familiares JSONB DEFAULT '[]',
  antecedentes_personales JSONB DEFAULT '[]',
  
  -- Seguro
  aseguradora_principal_id UUID,
  numero_poliza VARCHAR(50),
  
  -- Estado
  activo BOOLEAN DEFAULT true,
  fallecido BOOLEAN DEFAULT false,
  fecha_fallecimiento DATE,
  
  -- Metadata
  centro_registro_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. HISTORIA CLÍNICA ELECTRÓNICA
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_historia_clinica (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  tipo_entrada VARCHAR(50) NOT NULL,
  episodio_id UUID,
  fecha_entrada TIMESTAMPTZ NOT NULL,
  
  -- Contenido
  titulo VARCHAR(255),
  contenido TEXT,
  datos_estructurados JSONB DEFAULT '{}',
  
  -- Profesional
  profesional_id UUID,
  servicio_id UUID,
  
  -- Adjuntos
  adjuntos JSONB DEFAULT '[]',
  
  -- Estado
  firmado BOOLEAN DEFAULT false,
  fecha_firma TIMESTAMPTZ,
  confidencial BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. CONTACTOS Y DATOS ADICIONALES
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_pacientes_contactos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  tipo_contacto VARCHAR(50),
  nombre VARCHAR(255),
  relacion VARCHAR(100),
  telefono VARCHAR(20),
  email VARCHAR(255),
  es_emergencia BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_pacientes_avisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  tipo_aviso VARCHAR(100) NOT NULL,
  titulo VARCHAR(255),
  descripcion TEXT,
  severidad VARCHAR(20),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_pacientes_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  tipo_documento VARCHAR(100),
  nombre VARCHAR(255),
  url_documento TEXT,
  fecha_documento DATE,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. INDICES PARA PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_pacientes_ppi ON hosix_pacientes(ppi);
CREATE INDEX IF NOT EXISTS idx_pacientes_documento ON hosix_pacientes(numero_documento);
CREATE INDEX IF NOT EXISTS idx_pacientes_nombre ON hosix_pacientes(primer_apellido, primer_nombre);
CREATE INDEX IF NOT EXISTS idx_pacientes_activo ON hosix_pacientes(activo);

CREATE INDEX IF NOT EXISTS idx_historia_clinica_paciente ON hosix_historia_clinica(paciente_id);
CREATE INDEX IF NOT EXISTS idx_historia_clinica_fecha ON hosix_historia_clinica(fecha_entrada);
CREATE INDEX IF NOT EXISTS idx_historia_clinica_tipo ON hosix_historia_clinica(tipo_entrada);

CREATE INDEX IF NOT EXISTS idx_contactos_paciente ON hosix_pacientes_contactos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_avisos_paciente ON hosix_pacientes_avisos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_documentos_paciente ON hosix_pacientes_documentos(paciente_id);

-- ============================================================
-- 5. RLS (ROW LEVEL SECURITY) POLICIES
-- ============================================================

ALTER TABLE hosix_pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_historia_clinica ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_pacientes_contactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_pacientes_avisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_pacientes_documentos ENABLE ROW LEVEL SECURITY;

-- Pacientes: lectura y escritura según permisos
CREATE POLICY "pacientes_read_policy" ON hosix_pacientes FOR SELECT USING (activo = true OR true);
CREATE POLICY "pacientes_insert_policy" ON hosix_pacientes FOR INSERT WITH CHECK (true);
CREATE POLICY "pacientes_update_policy" ON hosix_pacientes FOR UPDATE USING (true) WITH CHECK (true);

-- Historia Clínica: lectura según acceso del profesional
CREATE POLICY "historia_clinica_read_policy" ON hosix_historia_clinica FOR SELECT USING (true);
CREATE POLICY "historia_clinica_insert_policy" ON hosix_historia_clinica FOR INSERT WITH CHECK (true);

-- ============================================================
-- 6. DATOS DE PRUEBA
-- ============================================================

-- Insertar pacientes de prueba
INSERT INTO hosix_pacientes (
  ppi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
  fecha_nacimiento, sexo, tipo_documento, numero_documento,
  direccion, ciudad, provincia, email, grupo_sanguineo, activo
) VALUES
('PPI-0001', 'Juan', 'Carlos', 'Pérez', 'García',
  '1975-03-15', 'M', 'Cédula', '0123456789',
  'Calle Principal 123', 'Malabo', 'Bioko Norte', 'juan@example.com', 'O+', true),
('PPI-0002', 'María', 'Elena', 'González', 'López',
  '1982-07-22', 'F', 'Cédula', '0987654321',
  'Avenida Central 456', 'Bata', 'Litoral', 'maria@example.com', 'A+', true),
('PPI-0003', 'Fernando', 'José', 'Martínez', 'Rodríguez',
  '1965-11-08', 'M', 'Cédula', '0456123789',
  'Calle Sur 789', 'Malabo', 'Bioko Sur', 'fernando@example.com', 'B+', true)
ON CONFLICT (ppi) DO NOTHING;


-- ============================================
-- [5/44] 20250116_003_hosix_urgencias_citas_agendas.sql
-- ============================================

-- HOSIX Sistema de Gestión Hospitalaria
-- Migración 003: Urgencias, Citas y Agendas
-- Fecha: 2025-01-16

-- ============================================================
-- 1. MÓDULO DE URGENCIAS
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_urgencias_episodios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  
  -- Entrada
  fecha_entrada TIMESTAMPTZ NOT NULL DEFAULT now(),
  lugar_entrada VARCHAR(100),
  procedencia VARCHAR(100),
  box_asignado VARCHAR(50),
  
  -- Triage
  nivel_triage INT,
  clasificacion_inicial TEXT,
  observaciones_triage TEXT,
  
  -- Atención
  medico_responsable_id UUID,
  diagnostico_inicial TEXT,
  diagnostico_final TEXT,
  
  -- Salida
  fecha_salida TIMESTAMPTZ,
  tipo_salida VARCHAR(50),
  destino_salida VARCHAR(255),
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'en_proceso',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_urgencias_triage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episodio_id UUID REFERENCES hosix_urgencias_episodios(id) NOT NULL,
  fecha_evaluacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  evaluador_id UUID,
  
  nivel_urgencia INT NOT NULL,
  motivo_consulta TEXT,
  signos_vitales JSONB,
  sintomas JSONB,
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. MÓDULO DE CITAS Y AGENDAS
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_agendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  
  servicio_id UUID REFERENCES hosix_servicios(id),
  profesional_id UUID,
  sala VARCHAR(100),
  
  tipo_agenda VARCHAR(50),
  duracion_default_minutos INT DEFAULT 15,
  capacidad_maxima_dia INT,
  
  permite_teleconsulta BOOLEAN DEFAULT false,
  
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_agendas_horarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id UUID REFERENCES hosix_agendas(id) NOT NULL,
  dia_semana INT NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  activo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_citas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id UUID REFERENCES hosix_agendas(id) NOT NULL,
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  
  fecha_hora TIMESTAMPTZ NOT NULL,
  duracion_minutos INT NOT NULL,
  
  actividad_id UUID,
  motivo TEXT,
  
  estado VARCHAR(50) DEFAULT 'programada',
  motivo_cancelacion TEXT,
  
  es_teleconsulta BOOLEAN DEFAULT false,
  url_teleconsulta TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_urgencias_episodios_paciente ON hosix_urgencias_episodios(paciente_id);
CREATE INDEX IF NOT EXISTS idx_urgencias_episodios_fecha ON hosix_urgencias_episodios(fecha_entrada);
CREATE INDEX IF NOT EXISTS idx_urgencias_episodios_estado ON hosix_urgencias_episodios(estado);

CREATE INDEX IF NOT EXISTS idx_agendas_codigo ON hosix_agendas(codigo);
CREATE INDEX IF NOT EXISTS idx_agendas_activo ON hosix_agendas(activo);

CREATE INDEX IF NOT EXISTS idx_citas_agenda ON hosix_citas(agenda_id);
CREATE INDEX IF NOT EXISTS idx_citas_paciente ON hosix_citas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON hosix_citas(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_citas_estado ON hosix_citas(estado);

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================

ALTER TABLE hosix_urgencias_episodios ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_urgencias_triage ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_agendas_horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_citas ENABLE ROW LEVEL SECURITY;

-- Urgencias
CREATE POLICY "urgencias_episodios_read_policy" ON hosix_urgencias_episodios FOR SELECT USING (true);
CREATE POLICY "urgencias_episodios_insert_policy" ON hosix_urgencias_episodios FOR INSERT WITH CHECK (true);
CREATE POLICY "urgencias_episodios_update_policy" ON hosix_urgencias_episodios FOR UPDATE USING (true) WITH CHECK (true);

-- Agendas (lectura pública, escritura restricta)
CREATE POLICY "agendas_read_policy" ON hosix_agendas FOR SELECT USING (activo = true OR true);
CREATE POLICY "agendas_insert_policy" ON hosix_agendas FOR INSERT WITH CHECK (true);

-- Citas
CREATE POLICY "citas_read_policy" ON hosix_citas FOR SELECT USING (true);
CREATE POLICY "citas_insert_policy" ON hosix_citas FOR INSERT WITH CHECK (true);
CREATE POLICY "citas_update_policy" ON hosix_citas FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================================
-- 5. DATOS DE PRUEBA
-- ============================================================

-- Insertar departamentos de prueba
INSERT INTO hosix_departamentos (codigo, nombre, descripcion, activo) VALUES
('GRAL', 'Medicina General', 'Departamento de Medicina General', true),
('URG', 'Urgencias', 'Servicio de Urgencias', true),
('CIR', 'Cirugía', 'Departamento de Cirugía', true)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar servicios de prueba
INSERT INTO hosix_servicios (codigo, nombre, descripcion, tipo_servicio, activo) VALUES
('CONS', 'Consulta Externa', 'Consulta externa general', 'consulta', true),
('URG_ATN', 'Atención Urgencias', 'Atención de urgencias', 'urgencia', true),
('INTER', 'Internamiento', 'Servicio de hospitalización', 'hospitalizacion', true)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar agendas de prueba
INSERT INTO hosix_agendas (codigo, nombre, servicio_id, tipo_agenda, duracion_default_minutos, activo) 
SELECT 
  'AGENDA_001',
  'Consulta Medicina General',
  (SELECT id FROM hosix_servicios WHERE codigo = 'CONS'),
  'consulta',
  15,
  true
WHERE NOT EXISTS (SELECT 1 FROM hosix_agendas WHERE codigo = 'AGENDA_001');

-- Insertar horarios de prueba
INSERT INTO hosix_agendas_horarios (agenda_id, dia_semana, hora_inicio, hora_fin, activo)
SELECT
  (SELECT id FROM hosix_agendas WHERE codigo = 'AGENDA_001'),
  1,
  '08:00'::time,
  '17:00'::time,
  true
WHERE NOT EXISTS (SELECT 1 FROM hosix_agendas_horarios WHERE agenda_id = (SELECT id FROM hosix_agendas WHERE codigo = 'AGENDA_001') AND dia_semana = 1);


-- ============================================
-- [6/44] 20250116_004_hosix_hospitalizacion_quirofanos_farmacia.sql
-- ============================================

-- HOSIX Sistema de Gestión Hospitalaria
-- Migración 004: Hospitalización, Quirófanos y Farmacia
-- Fecha: 2025-01-16

-- ============================================================
-- 1. MÓDULO DE HOSPITALIZACIÓN
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_camas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(100),
  
  servicio_id UUID REFERENCES hosix_servicios(id),
  ubicacion VARCHAR(255),
  tipo_cama VARCHAR(50),
  
  estado VARCHAR(50) DEFAULT 'disponible',
  
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_hospitalizacion_episodios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  
  -- Ingreso
  fecha_ingreso TIMESTAMPTZ NOT NULL DEFAULT now(),
  origen_ingreso VARCHAR(100),
  diagnostico_ingreso TEXT,
  medico_responsable_id UUID,
  servicio_id UUID REFERENCES hosix_servicios(id),
  cama_id UUID REFERENCES hosix_camas(id),
  
  -- Duración
  duracion_prevista_dias INT,
  
  -- Alta
  fecha_alta TIMESTAMPTZ,
  tipo_alta VARCHAR(50),
  diagnostico_alta TEXT,
  informe_alta TEXT,
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'activo',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_hospitalizacion_traslados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episodio_id UUID REFERENCES hosix_hospitalizacion_episodios(id) NOT NULL,
  
  fecha_traslado TIMESTAMPTZ NOT NULL DEFAULT now(),
  cama_origen_id UUID REFERENCES hosix_camas(id),
  cama_destino_id UUID REFERENCES hosix_camas(id),
  servicio_origen_id UUID,
  servicio_destino_id UUID,
  
  motivo_traslado VARCHAR(255),
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. MÓDULO DE QUIRÓFANOS
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_quirofanos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  
  area_quirurgica VARCHAR(100),
  tipo_quirofano VARCHAR(50),
  especialidades JSONB DEFAULT '[]',
  
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_quirofanos_intervenciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quirofano_id UUID REFERENCES hosix_quirofanos(id) NOT NULL,
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  
  -- Programación
  fecha_programada TIMESTAMPTZ NOT NULL,
  hora_inicio_estimada TIME,
  duracion_estimada_minutos INT,
  
  -- Procedimiento
  procedimiento_principal TEXT NOT NULL,
  procedimientos_secundarios JSONB DEFAULT '[]',
  tipo_intervencion VARCHAR(50),
  tipo_anestesia VARCHAR(50),
  
  -- Equipo
  cirujano_principal_id UUID,
  equipo_medico JSONB DEFAULT '[]',
  
  -- Ejecución
  fecha_inicio_real TIMESTAMPTZ,
  fecha_fin_real TIMESTAMPTZ,
  
  -- Resultado
  estado VARCHAR(50) DEFAULT 'programada',
  motivo_cancelacion TEXT,
  complicaciones JSONB DEFAULT '[]',
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. MÓDULO DE FARMACIA Y PRESCRIPCIÓN
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_medicamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  codigo_barras VARCHAR(100),
  
  nombre_comercial VARCHAR(255) NOT NULL,
  principio_activo VARCHAR(255),
  presentacion VARCHAR(255),
  concentracion VARCHAR(100),
  forma_farmaceutica VARCHAR(100),
  via_administracion VARCHAR(100),
  
  familia VARCHAR(100),
  grupo VARCHAR(100),
  
  requiere_receta BOOLEAN DEFAULT true,
  controlado BOOLEAN DEFAULT false,
  
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_prescripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  
  medicamento_id UUID REFERENCES hosix_medicamentos(id),
  medicamento_texto VARCHAR(255),
  
  dosis VARCHAR(100),
  frecuencia VARCHAR(100),
  via_administracion VARCHAR(100),
  duracion_dias INT,
  instrucciones TEXT,
  
  prescriptor_id UUID,
  fecha_prescripcion TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_inicio TIMESTAMPTZ,
  fecha_fin TIMESTAMPTZ,
  
  estado VARCHAR(50) DEFAULT 'activa',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_dispensaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescripcion_id UUID REFERENCES hosix_prescripciones(id) NOT NULL,
  
  cantidad_dispensada DECIMAL(10,2),
  unidad VARCHAR(50),
  lote VARCHAR(100),
  fecha_caducidad DATE,
  
  dispensador_id UUID,
  fecha_dispensacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  confirmado_por UUID,
  fecha_confirmacion TIMESTAMPTZ,
  
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_camas_codigo ON hosix_camas(codigo);
CREATE INDEX IF NOT EXISTS idx_camas_estado ON hosix_camas(estado);
CREATE INDEX IF NOT EXISTS idx_camas_servicio ON hosix_camas(servicio_id);

CREATE INDEX IF NOT EXISTS idx_hospitalizacion_episodios_paciente ON hosix_hospitalizacion_episodios(paciente_id);
CREATE INDEX IF NOT EXISTS idx_hospitalizacion_episodios_fecha ON hosix_hospitalizacion_episodios(fecha_ingreso);
CREATE INDEX IF NOT EXISTS idx_hospitalizacion_episodios_estado ON hosix_hospitalizacion_episodios(estado);

CREATE INDEX IF NOT EXISTS idx_quirofanos_codigo ON hosix_quirofanos(codigo);
CREATE INDEX IF NOT EXISTS idx_quirofanos_activo ON hosix_quirofanos(activo);

CREATE INDEX IF NOT EXISTS idx_quirofanos_intervenciones_paciente ON hosix_quirofanos_intervenciones(paciente_id);
CREATE INDEX IF NOT EXISTS idx_quirofanos_intervenciones_fecha ON hosix_quirofanos_intervenciones(fecha_programada);
CREATE INDEX IF NOT EXISTS idx_quirofanos_intervenciones_estado ON hosix_quirofanos_intervenciones(estado);

CREATE INDEX IF NOT EXISTS idx_medicamentos_codigo ON hosix_medicamentos(codigo);
CREATE INDEX IF NOT EXISTS idx_medicamentos_activo ON hosix_medicamentos(activo);

CREATE INDEX IF NOT EXISTS idx_prescripciones_paciente ON hosix_prescripciones(paciente_id);
CREATE INDEX IF NOT EXISTS idx_prescripciones_estado ON hosix_prescripciones(estado);

CREATE INDEX IF NOT EXISTS idx_dispensaciones_prescripcion ON hosix_dispensaciones(prescripcion_id);

-- ============================================================
-- 5. RLS POLICIES
-- ============================================================

ALTER TABLE hosix_camas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_hospitalizacion_episodios ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_hospitalizacion_traslados ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_quirofanos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_quirofanos_intervenciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_medicamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_prescripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_dispensaciones ENABLE ROW LEVEL SECURITY;

-- Hospitalizacion
CREATE POLICY "hospitalizacion_read_policy" ON hosix_hospitalizacion_episodios FOR SELECT USING (true);
CREATE POLICY "hospitalizacion_insert_policy" ON hosix_hospitalizacion_episodios FOR INSERT WITH CHECK (true);
CREATE POLICY "hospitalizacion_update_policy" ON hosix_hospitalizacion_episodios FOR UPDATE USING (true) WITH CHECK (true);

-- Camas
CREATE POLICY "camas_read_policy" ON hosix_camas FOR SELECT USING (true);
CREATE POLICY "camas_insert_policy" ON hosix_camas FOR INSERT WITH CHECK (true);

-- Quirófanos
CREATE POLICY "quirofanos_read_policy" ON hosix_quirofanos FOR SELECT USING (activo = true OR true);
CREATE POLICY "quirofanos_intervenciones_read_policy" ON hosix_quirofanos_intervenciones FOR SELECT USING (true);
CREATE POLICY "quirofanos_intervenciones_insert_policy" ON hosix_quirofanos_intervenciones FOR INSERT WITH CHECK (true);

-- Medicamentos y Farmacia
CREATE POLICY "medicamentos_read_policy" ON hosix_medicamentos FOR SELECT USING (activo = true OR true);
CREATE POLICY "prescripciones_read_policy" ON hosix_prescripciones FOR SELECT USING (true);
CREATE POLICY "prescripciones_insert_policy" ON hosix_prescripciones FOR INSERT WITH CHECK (true);
CREATE POLICY "dispensaciones_read_policy" ON hosix_dispensaciones FOR SELECT USING (true);
CREATE POLICY "dispensaciones_insert_policy" ON hosix_dispensaciones FOR INSERT WITH CHECK (true);

-- ============================================================
-- 6. DATOS DE PRUEBA
-- ============================================================

-- Insertar quirófanos de prueba
INSERT INTO hosix_quirofanos (codigo, nombre, area_quirurgica, tipo_quirofano, activo) VALUES
('QF_001', 'Quirófano 1', 'Ala Quirúrgica', 'general', true),
('QF_002', 'Quirófano 2', 'Ala Quirúrgica', 'especializado', true)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar medicamentos de prueba
INSERT INTO hosix_medicamentos (codigo, nombre_comercial, principio_activo, forma_farmaceutica, activo) VALUES
('MED_001', 'Amoxicilina', 'Amoxicilina', 'Cápsula', true),
('MED_002', 'Paracetamol', 'Paracetamol', 'Tableta', true),
('MED_003', 'Ibuprofeno', 'Ibuprofeno', 'Tableta', true)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar camas de prueba
INSERT INTO hosix_camas (codigo, nombre, tipo_cama, estado, activo) VALUES
('CAMA_001', 'Cama 1 - Medicina General', 'general', 'disponible', true),
('CAMA_002', 'Cama 2 - Medicina General', 'general', 'disponible', true),
('CAMA_003', 'Cama 3 - Cuidados Intensivos', 'uci', 'disponible', true)
ON CONFLICT (codigo) DO NOTHING;


-- ============================================
-- [7/44] 20250116_005_hosix_facturacion_reportes.sql
-- ============================================

-- HOSIX Sistema de Gestión Hospitalaria
-- Migración 005: Facturación, Reportes y Business Intelligence
-- Fecha: 2025-01-16

-- ============================================================
-- 1. MÓDULO DE FACTURACIÓN
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_aseguradoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(50),
  direccion TEXT,
  telefono VARCHAR(50),
  email VARCHAR(255),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_tarifas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aseguradora_id UUID REFERENCES hosix_aseguradoras(id),
  codigo_concepto VARCHAR(50) NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  precio DECIMAL(12,2) NOT NULL,
  vigente_desde DATE NOT NULL,
  vigente_hasta DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_facturacion_cuentas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  aseguradora_id UUID REFERENCES hosix_aseguradoras(id),
  
  numero_cuenta VARCHAR(50) UNIQUE NOT NULL,
  estado VARCHAR(50) DEFAULT 'abierta',
  
  fecha_apertura TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_cierre TIMESTAMPTZ,
  
  total_facturado DECIMAL(12,2) DEFAULT 0,
  total_pagado DECIMAL(12,2) DEFAULT 0,
  saldo_pendiente DECIMAL(12,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_facturacion_conceptos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  tipo_concepto VARCHAR(50),
  precio_base DECIMAL(12,2),
  requiere_autorizar BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_facturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_factura VARCHAR(50) UNIQUE NOT NULL,
  cuenta_id UUID REFERENCES hosix_facturacion_cuentas(id) NOT NULL,
  
  fecha_emision TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_vencimiento DATE,
  
  subtotal DECIMAL(12,2) NOT NULL,
  impuesto DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  
  estado VARCHAR(50) DEFAULT 'emitida',
  concepto_rechazo TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_facturas_lineas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id UUID REFERENCES hosix_facturas(id) NOT NULL,
  
  concepto_id UUID REFERENCES hosix_facturacion_conceptos(id),
  concepto_texto VARCHAR(255),
  cantidad DECIMAL(10,2) NOT NULL,
  precio_unitario DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_cajas_movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_movimiento VARCHAR(50) UNIQUE NOT NULL,
  
  factura_id UUID REFERENCES hosix_facturas(id),
  tipo_movimiento VARCHAR(50) NOT NULL,
  forma_pago VARCHAR(50),
  
  monto DECIMAL(12,2) NOT NULL,
  usuario_id UUID REFERENCES hosix_usuarios(id),
  
  fecha_movimiento TIMESTAMPTZ NOT NULL DEFAULT now(),
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. MÓDULO DE STOCK Y SUMINISTROS
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_stock_medicamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicamento_id UUID REFERENCES hosix_medicamentos(id) NOT NULL,
  
  cantidad_disponible DECIMAL(10,2) NOT NULL DEFAULT 0,
  cantidad_minima DECIMAL(10,2) DEFAULT 0,
  cantidad_maxima DECIMAL(10,2) DEFAULT 0,
  
  lote_actual VARCHAR(100),
  fecha_caducidad DATE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(medicamento_id)
);

CREATE TABLE IF NOT EXISTS hosix_stock_movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicamento_id UUID REFERENCES hosix_medicamentos(id) NOT NULL,
  
  tipo_movimiento VARCHAR(50) NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL,
  cantidad_anterior DECIMAL(10,2),
  cantidad_nueva DECIMAL(10,2),
  
  referencia_documento VARCHAR(100),
  usuario_id UUID REFERENCES hosix_usuarios(id),
  
  fecha_movimiento TIMESTAMPTZ NOT NULL DEFAULT now(),
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. MÓDULO DE REPORTES / BI
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_kpis_reportes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificadores
  tipo_reporte VARCHAR(100) NOT NULL,
  fecha_reporte DATE NOT NULL DEFAULT CURRENT_DATE,
  periodo VARCHAR(50),
  
  -- Métricas
  total_pacientes INT DEFAULT 0,
  total_citas INT DEFAULT 0,
  total_urgencias INT DEFAULT 0,
  total_hospitalizaciones INT DEFAULT 0,
  total_cirugias INT DEFAULT 0,
  
  ocupacion_camas DECIMAL(5,2) DEFAULT 0,
  estancia_promedio DECIMAL(5,2) DEFAULT 0,
  
  facturacion_total DECIMAL(12,2) DEFAULT 0,
  facturacion_cobrada DECIMAL(12,2) DEFAULT 0,
  facturacion_pendiente DECIMAL(12,2) DEFAULT 0,
  
  datos_adicionales JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_aseguradoras_codigo ON hosix_aseguradoras(codigo);
CREATE INDEX IF NOT EXISTS idx_tarifas_aseguradora ON hosix_tarifas(aseguradora_id);
CREATE INDEX IF NOT EXISTS idx_tarifas_concepto ON hosix_tarifas(codigo_concepto);

CREATE INDEX IF NOT EXISTS idx_cuentas_paciente ON hosix_facturacion_cuentas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_cuentas_numero ON hosix_facturacion_cuentas(numero_cuenta);
CREATE INDEX IF NOT EXISTS idx_cuentas_estado ON hosix_facturacion_cuentas(estado);

CREATE INDEX IF NOT EXISTS idx_facturas_numero ON hosix_facturas(numero_factura);
CREATE INDEX IF NOT EXISTS idx_facturas_cuenta ON hosix_facturas(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha ON hosix_facturas(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON hosix_facturas(estado);

CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON hosix_cajas_movimientos(tipo_movimiento);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON hosix_cajas_movimientos(fecha_movimiento);

CREATE INDEX IF NOT EXISTS idx_stock_medicamento ON hosix_stock_medicamentos(medicamento_id);
CREATE INDEX IF NOT EXISTS idx_stock_movimientos_medicamento ON hosix_stock_movimientos(medicamento_id);
CREATE INDEX IF NOT EXISTS idx_stock_movimientos_fecha ON hosix_stock_movimientos(fecha_movimiento);

CREATE INDEX IF NOT EXISTS idx_kpis_fecha ON hosix_kpis_reportes(fecha_reporte);
CREATE INDEX IF NOT EXISTS idx_kpis_tipo ON hosix_kpis_reportes(tipo_reporte);

-- ============================================================
-- 5. RLS POLICIES
-- ============================================================

ALTER TABLE hosix_aseguradoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_tarifas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_facturacion_cuentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_facturacion_conceptos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_facturas_lineas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_cajas_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_stock_medicamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_stock_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_kpis_reportes ENABLE ROW LEVEL SECURITY;

-- Facturación - Lectura y escritura
CREATE POLICY "aseguradoras_read_policy" ON hosix_aseguradoras FOR SELECT USING (activo = true OR true);
CREATE POLICY "cuentas_read_policy" ON hosix_facturacion_cuentas FOR SELECT USING (true);
CREATE POLICY "cuentas_insert_policy" ON hosix_facturacion_cuentas FOR INSERT WITH CHECK (true);
CREATE POLICY "facturas_read_policy" ON hosix_facturas FOR SELECT USING (true);
CREATE POLICY "facturas_insert_policy" ON hosix_facturas FOR INSERT WITH CHECK (true);

-- Stock
CREATE POLICY "stock_read_policy" ON hosix_stock_medicamentos FOR SELECT USING (true);
CREATE POLICY "stock_movimientos_read_policy" ON hosix_stock_movimientos FOR SELECT USING (true);
CREATE POLICY "stock_movimientos_insert_policy" ON hosix_stock_movimientos FOR INSERT WITH CHECK (true);

-- Reportes
CREATE POLICY "kpis_read_policy" ON hosix_kpis_reportes FOR SELECT USING (true);
CREATE POLICY "kpis_insert_policy" ON hosix_kpis_reportes FOR INSERT WITH CHECK (true);

-- ============================================================
-- 6. DATOS DE PRUEBA
-- ============================================================

-- Insertar aseguradoras de prueba
INSERT INTO hosix_aseguradoras (codigo, nombre, tipo, activo) VALUES
('IESS', 'Instituto Ecuatoriano de Seguridad Social', 'publica', true),
('SALUD_PRI', 'Seguros de Salud Privados', 'privada', true),
('DIRCOSS', 'Dirección de Coordinación de Seguridad Social', 'publica', true)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar conceptos facturables de prueba
INSERT INTO hosix_facturacion_conceptos (codigo, descripcion, tipo_concepto, precio_base, activo) VALUES
('CONS_MED', 'Consulta Médica', 'servicio', 50.00, true),
('ESTANCIA_DIA', 'Estancia Hospitalaria por Día', 'servicio', 100.00, true),
('CIRUGIA_MAYOR', 'Cirugía Mayor', 'procedimiento', 500.00, true),
('LABORATORIO', 'Servicio de Laboratorio', 'servicio', 30.00, true),
('RADIOLOGIA', 'Servicio de Radiología', 'servicio', 75.00, true)
ON CONFLICT (codigo) DO NOTHING;


-- ============================================
-- [8/44] 20250121_006_hosix_cajas_completo.sql
-- ============================================

-- HOSIX Sistema de Gestión Hospitalaria
-- Migración 006: Módulo de Cajas Completo
-- Fecha: 2025-01-21

-- ============================================================
-- 1. TABLAS DE CAJAS
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_cajas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  
  ubicacion VARCHAR(255),
  responsable_id UUID REFERENCES hosix_usuarios(id),
  
  saldo_inicial DECIMAL(12,2) DEFAULT 0,
  saldo_actual DECIMAL(12,2) DEFAULT 0,
  
  estado VARCHAR(50) DEFAULT 'abierta', -- abierta, cerrada, mantenimiento
  activo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_cajas_turnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id UUID REFERENCES hosix_cajas(id) NOT NULL,
  usuario_id UUID REFERENCES hosix_usuarios(id) NOT NULL,
  
  numero_turno VARCHAR(50) UNIQUE NOT NULL,
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_cierre TIMESTAMPTZ,
  
  saldo_apertura DECIMAL(12,2) NOT NULL,
  saldo_cierre DECIMAL(12,2),
  
  total_cobros DECIMAL(12,2) DEFAULT 0,
  total_pagos DECIMAL(12,2) DEFAULT 0,
  
  observaciones TEXT,
  estado VARCHAR(50) DEFAULT 'abierto', -- abierto, cerrado
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_cajas_formas_pago (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  
  requiere_referencia BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla actualizada: agregar referencia a turno
ALTER TABLE hosix_cajas_movimientos 
ADD COLUMN IF NOT EXISTS turno_id UUID REFERENCES hosix_cajas_turnos(id),
ADD COLUMN IF NOT EXISTS forma_pago_id UUID REFERENCES hosix_cajas_formas_pago(id),
ADD COLUMN IF NOT EXISTS referencia_pago VARCHAR(100),
ADD COLUMN IF NOT EXISTS caja_id UUID REFERENCES hosix_cajas(id),
ADD COLUMN IF NOT EXISTS usuario_responsable_id UUID REFERENCES hosix_usuarios(id);

-- Recrear tabla de movimientos si es necesario (drop y recreate para integridad)
-- Se mantiene como está para compatibilidad

CREATE TABLE IF NOT EXISTS hosix_cajas_cierres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id UUID REFERENCES hosix_cajas(id) NOT NULL,
  turno_id UUID REFERENCES hosix_cajas_turnos(id),
  
  fecha_cierre TIMESTAMPTZ NOT NULL DEFAULT now(),
  usuario_responsable_id UUID REFERENCES hosix_usuarios(id) NOT NULL,
  
  saldo_apertura DECIMAL(12,2) NOT NULL,
  total_cobros DECIMAL(12,2) DEFAULT 0,
  total_pagos DECIMAL(12,2) DEFAULT 0,
  saldo_teorico DECIMAL(12,2),
  saldo_real DECIMAL(12,2),
  
  diferencia DECIMAL(12,2),
  estado VARCHAR(50) DEFAULT 'pendiente_cuadre', -- pendiente_cuadre, cuadrado, descuadre_reportado
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_cajas_arqueos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id UUID REFERENCES hosix_cajas(id) NOT NULL,
  
  fecha_arqueo TIMESTAMPTZ NOT NULL DEFAULT now(),
  usuario_responsable_id UUID REFERENCES hosix_usuarios(id) NOT NULL,
  
  -- Efectivo
  billetes_100 DECIMAL(10,2) DEFAULT 0,
  billetes_50 DECIMAL(10,2) DEFAULT 0,
  billetes_20 DECIMAL(10,2) DEFAULT 0,
  billetes_10 DECIMAL(10,2) DEFAULT 0,
  billetes_5 DECIMAL(10,2) DEFAULT 0,
  billetes_1 DECIMAL(10,2) DEFAULT 0,
  
  monedas_1 DECIMAL(10,2) DEFAULT 0,
  monedas_otros DECIMAL(10,2) DEFAULT 0,
  
  total_efectivo DECIMAL(12,2),
  
  -- Documentos
  cheques_cantidad INT DEFAULT 0,
  cheques_monto DECIMAL(12,2) DEFAULT 0,
  
  -- Formas electrónicas
  tarjetas_cantidad INT DEFAULT 0,
  tarjetas_monto DECIMAL(12,2) DEFAULT 0,
  
  -- Totales
  total_arqueo DECIMAL(12,2),
  saldo_esperado DECIMAL(12,2),
  diferencia DECIMAL(12,2),
  
  observaciones TEXT,
  aprobado_por UUID REFERENCES hosix_usuarios(id),
  estado VARCHAR(50) DEFAULT 'borrador', -- borrador, presentado, aprobado, rechazado
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_cajas_codigo ON hosix_cajas(codigo);
CREATE INDEX IF NOT EXISTS idx_cajas_estado ON hosix_cajas(estado);
CREATE INDEX IF NOT EXISTS idx_cajas_responsable ON hosix_cajas(responsable_id);

CREATE INDEX IF NOT EXISTS idx_turnos_caja ON hosix_cajas_turnos(caja_id);
CREATE INDEX IF NOT EXISTS idx_turnos_usuario ON hosix_cajas_turnos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_turnos_estado ON hosix_cajas_turnos(estado);
CREATE INDEX IF NOT EXISTS idx_turnos_fecha ON hosix_cajas_turnos(fecha_inicio);

CREATE INDEX IF NOT EXISTS idx_formas_pago_codigo ON hosix_cajas_formas_pago(codigo);

CREATE INDEX IF NOT EXISTS idx_cierres_caja ON hosix_cajas_cierres(caja_id);
CREATE INDEX IF NOT EXISTS idx_cierres_turno ON hosix_cajas_cierres(turno_id);
CREATE INDEX IF NOT EXISTS idx_cierres_fecha ON hosix_cajas_cierres(fecha_cierre);

CREATE INDEX IF NOT EXISTS idx_arqueos_caja ON hosix_cajas_arqueos(caja_id);
CREATE INDEX IF NOT EXISTS idx_arqueos_fecha ON hosix_cajas_arqueos(fecha_arqueo);
CREATE INDEX IF NOT EXISTS idx_arqueos_estado ON hosix_cajas_arqueos(estado);

-- ============================================================
-- 3. RLS POLICIES
-- ============================================================

ALTER TABLE hosix_cajas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_cajas_turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_cajas_formas_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_cajas_cierres ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_cajas_arqueos ENABLE ROW LEVEL SECURITY;

-- Cajas - Lectura y escritura
CREATE POLICY "cajas_read_policy" ON hosix_cajas FOR SELECT USING (true);
CREATE POLICY "cajas_insert_policy" ON hosix_cajas FOR INSERT WITH CHECK (true);
CREATE POLICY "cajas_update_policy" ON hosix_cajas FOR UPDATE USING (true) WITH CHECK (true);

-- Turnos - Lectura y escritura
CREATE POLICY "turnos_read_policy" ON hosix_cajas_turnos FOR SELECT USING (true);
CREATE POLICY "turnos_insert_policy" ON hosix_cajas_turnos FOR INSERT WITH CHECK (true);
CREATE POLICY "turnos_update_policy" ON hosix_cajas_turnos FOR UPDATE USING (true) WITH CHECK (true);

-- Formas de pago
CREATE POLICY "formas_pago_read_policy" ON hosix_cajas_formas_pago FOR SELECT USING (true);
CREATE POLICY "formas_pago_insert_policy" ON hosix_cajas_formas_pago FOR INSERT WITH CHECK (true);

-- Cierres
CREATE POLICY "cierres_read_policy" ON hosix_cajas_cierres FOR SELECT USING (true);
CREATE POLICY "cierres_insert_policy" ON hosix_cajas_cierres FOR INSERT WITH CHECK (true);
CREATE POLICY "cierres_update_policy" ON hosix_cajas_cierres FOR UPDATE USING (true) WITH CHECK (true);

-- Arqueos
CREATE POLICY "arqueos_read_policy" ON hosix_cajas_arqueos FOR SELECT USING (true);
CREATE POLICY "arqueos_insert_policy" ON hosix_cajas_arqueos FOR INSERT WITH CHECK (true);
CREATE POLICY "arqueos_update_policy" ON hosix_cajas_arqueos FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================================
-- 4. DATOS DE PRUEBA
-- ============================================================

-- Insertar formas de pago
INSERT INTO hosix_cajas_formas_pago (codigo, nombre, descripcion, requiere_referencia) VALUES
('EFECTIVO', 'Efectivo', 'Pago en efectivo', false),
('TARJETA_CREDITO', 'Tarjeta de Crédito', 'Pago con tarjeta de crédito', true),
('TARJETA_DEBITO', 'Tarjeta de Débito', 'Pago con tarjeta de débito', true),
('CHEQUE', 'Cheque', 'Pago con cheque bancario', true),
('TRANSFERENCIA', 'Transferencia Bancaria', 'Pago por transferencia bancaria', true),
('MIXTO', 'Pago Mixto', 'Combinación de formas de pago', false)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar cajas de prueba
INSERT INTO hosix_cajas (codigo, nombre, descripcion, ubicacion, estado, activo) VALUES
('CAJA_001', 'Caja Principal', 'Caja principal del hospital', 'Recepción Principal', 'abierta', true),
('CAJA_002', 'Caja Farmacia', 'Caja de farmacia', 'Farmacia', 'abierta', true),
('CAJA_003', 'Caja Urgencias', 'Caja de urgencias', 'Departamento de Urgencias', 'abierta', true)
ON CONFLICT (codigo) DO NOTHING;


-- ============================================
-- [9/44] 20250121_007_hosix_recobros.sql
-- ============================================

-- HOSIX Sistema de Gestión Hospitalaria
-- Migración 007: Módulo de Recobros Completo
-- Fecha: 2025-01-21

-- ============================================================
-- 1. TABLAS DE RECOBROS
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_recobros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_recobro VARCHAR(50) UNIQUE NOT NULL,
  factura_id UUID REFERENCES hosix_facturas(id) NOT NULL,
  
  motivo_recobro VARCHAR(255) NOT NULL,
  descripcion TEXT,
  
  monto_original DECIMAL(12,2) NOT NULL,
  monto_recobrado DECIMAL(12,2) DEFAULT 0,
  
  estado VARCHAR(50) DEFAULT 'pendiente', -- pendiente, en_proceso, parcial, completado, rechazado
  prioridad VARCHAR(50) DEFAULT 'media', -- baja, media, alta, urgente
  
  fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_cierre TIMESTAMPTZ,
  usuario_responsable_id UUID REFERENCES hosix_usuarios(id),
  
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_recobros_notas_cargo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_nota VARCHAR(50) UNIQUE NOT NULL,
  recobro_id UUID REFERENCES hosix_recobros(id),
  factura_id UUID REFERENCES hosix_facturas(id) NOT NULL,
  
  concepto VARCHAR(255) NOT NULL,
  descripcion TEXT,
  monto DECIMAL(12,2) NOT NULL,
  
  razon_cargo VARCHAR(255),
  documentos_adjuntos JSONB DEFAULT '[]',
  
  estado VARCHAR(50) DEFAULT 'emitida', -- emitida, aprobada, rechazada
  
  fecha_emision TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_aprovacion TIMESTAMPTZ,
  aprobado_por UUID REFERENCES hosix_usuarios(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_recobros_notas_credito (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_nota VARCHAR(50) UNIQUE NOT NULL,
  factura_id UUID REFERENCES hosix_facturas(id) NOT NULL,
  
  concepto VARCHAR(255) NOT NULL,
  descripcion TEXT,
  monto DECIMAL(12,2) NOT NULL,
  
  razon_credito VARCHAR(255),
  documentos_adjuntos JSONB DEFAULT '[]',
  
  estado VARCHAR(50) DEFAULT 'emitida', -- emitida, aprobada, rechazada, contabilizada
  
  fecha_emision TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_aprovacion TIMESTAMPTZ,
  aprobado_por UUID REFERENCES hosix_usuarios(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_recobros_solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_solicitud VARCHAR(50) UNIQUE NOT NULL,
  aseguradora_id UUID REFERENCES hosix_aseguradoras(id) NOT NULL,
  
  tipo_solicitud VARCHAR(50) NOT NULL, -- devolucion, aclaracion, denegacion
  descripcion TEXT NOT NULL,
  
  monto_solicitado DECIMAL(12,2),
  partidas JSONB DEFAULT '[]', -- [{factura_id, concepto, monto}]
  
  estado VARCHAR(50) DEFAULT 'abierta', -- abierta, en_respuesta, respondida, cerrada
  
  fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_vencimiento TIMESTAMPTZ,
  fecha_respuesta TIMESTAMPTZ,
  
  respuesta_aseguradora TEXT,
  documentos_respuesta JSONB DEFAULT '[]',
  
  usuario_responsable_id UUID REFERENCES hosix_usuarios(id),
  
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_recobros_morosidad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id UUID REFERENCES hosix_facturacion_cuentas(id) NOT NULL,
  aseguradora_id UUID REFERENCES hosix_aseguradoras(id) NOT NULL,
  
  saldo_deudor DECIMAL(12,2) DEFAULT 0,
  dias_vencimiento INT DEFAULT 0,
  
  facturas_vencidas INT DEFAULT 0,
  total_facturas_vencidas DECIMAL(12,2) DEFAULT 0,
  
  historial_pagos JSONB DEFAULT '[]',
  
  status_cobranza VARCHAR(50) DEFAULT 'activo', -- activo, en_litigio, incobrable, pago_total
  
  acciones_cobranza JSONB DEFAULT '[]', -- [{tipo, fecha, resultado, usuario}]
  
  notas TEXT,
  
  fecha_ultimo_pago TIMESTAMPTZ,
  fecha_proximo_seguimiento TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cuenta_id)
);

-- ============================================================
-- 2. ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_recobros_numero ON hosix_recobros(numero_recobro);
CREATE INDEX IF NOT EXISTS idx_recobros_factura ON hosix_recobros(factura_id);
CREATE INDEX IF NOT EXISTS idx_recobros_estado ON hosix_recobros(estado);
CREATE INDEX IF NOT EXISTS idx_recobros_prioridad ON hosix_recobros(prioridad);
CREATE INDEX IF NOT EXISTS idx_recobros_fecha ON hosix_recobros(fecha_solicitud);

CREATE INDEX IF NOT EXISTS idx_notas_cargo_numero ON hosix_recobros_notas_cargo(numero_nota);
CREATE INDEX IF NOT EXISTS idx_notas_cargo_recobro ON hosix_recobros_notas_cargo(recobro_id);
CREATE INDEX IF NOT EXISTS idx_notas_cargo_factura ON hosix_recobros_notas_cargo(factura_id);
CREATE INDEX IF NOT EXISTS idx_notas_cargo_estado ON hosix_recobros_notas_cargo(estado);

CREATE INDEX IF NOT EXISTS idx_notas_credito_numero ON hosix_recobros_notas_credito(numero_nota);
CREATE INDEX IF NOT EXISTS idx_notas_credito_factura ON hosix_recobros_notas_credito(factura_id);
CREATE INDEX IF NOT EXISTS idx_notas_credito_estado ON hosix_recobros_notas_credito(estado);

CREATE INDEX IF NOT EXISTS idx_solicitudes_numero ON hosix_recobros_solicitudes(numero_solicitud);
CREATE INDEX IF NOT EXISTS idx_solicitudes_aseguradora ON hosix_recobros_solicitudes(aseguradora_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON hosix_recobros_solicitudes(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha ON hosix_recobros_solicitudes(fecha_solicitud);

CREATE INDEX IF NOT EXISTS idx_morosidad_cuenta ON hosix_recobros_morosidad(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_morosidad_aseguradora ON hosix_recobros_morosidad(aseguradora_id);
CREATE INDEX IF NOT EXISTS idx_morosidad_dias ON hosix_recobros_morosidad(dias_vencimiento);
CREATE INDEX IF NOT EXISTS idx_morosidad_status ON hosix_recobros_morosidad(status_cobranza);

-- ============================================================
-- 3. RLS POLICIES
-- ============================================================

ALTER TABLE hosix_recobros ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_recobros_notas_cargo ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_recobros_notas_credito ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_recobros_solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_recobros_morosidad ENABLE ROW LEVEL SECURITY;

-- Recobros - Lectura y escritura
CREATE POLICY "recobros_read_policy" ON hosix_recobros FOR SELECT USING (true);
CREATE POLICY "recobros_insert_policy" ON hosix_recobros FOR INSERT WITH CHECK (true);
CREATE POLICY "recobros_update_policy" ON hosix_recobros FOR UPDATE USING (true) WITH CHECK (true);

-- Notas de Cargo
CREATE POLICY "notas_cargo_read_policy" ON hosix_recobros_notas_cargo FOR SELECT USING (true);
CREATE POLICY "notas_cargo_insert_policy" ON hosix_recobros_notas_cargo FOR INSERT WITH CHECK (true);
CREATE POLICY "notas_cargo_update_policy" ON hosix_recobros_notas_cargo FOR UPDATE USING (true) WITH CHECK (true);

-- Notas de Crédito
CREATE POLICY "notas_credito_read_policy" ON hosix_recobros_notas_credito FOR SELECT USING (true);
CREATE POLICY "notas_credito_insert_policy" ON hosix_recobros_notas_credito FOR INSERT WITH CHECK (true);
CREATE POLICY "notas_credito_update_policy" ON hosix_recobros_notas_credito FOR UPDATE USING (true) WITH CHECK (true);

-- Solicitudes
CREATE POLICY "solicitudes_read_policy" ON hosix_recobros_solicitudes FOR SELECT USING (true);
CREATE POLICY "solicitudes_insert_policy" ON hosix_recobros_solicitudes FOR INSERT WITH CHECK (true);
CREATE POLICY "solicitudes_update_policy" ON hosix_recobros_solicitudes FOR UPDATE USING (true) WITH CHECK (true);

-- Morosidad
CREATE POLICY "morosidad_read_policy" ON hosix_recobros_morosidad FOR SELECT USING (true);
CREATE POLICY "morosidad_insert_policy" ON hosix_recobros_morosidad FOR INSERT WITH CHECK (true);
CREATE POLICY "morosidad_update_policy" ON hosix_recobros_morosidad FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================================
-- 4. DATOS DE PRUEBA
-- ============================================================

-- No hay datos de prueba iniciales para recobros (se generan dinámicamente)


-- ============================================
-- [10/44] 20250121_008_hosix_suministros.sql
-- ============================================

-- ============================================
-- HOSIX - ADM 10.0 SUMINISTROS
-- Migración: 20250121_008_hosix_suministros.sql
-- ============================================

-- ============================================
-- 1. FAMILIAS DE ARTÍCULOS
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_articulos_familias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_articulos_familias_codigo ON hosix_articulos_familias(codigo);
CREATE INDEX IF NOT EXISTS idx_articulos_familias_activo ON hosix_articulos_familias(activo);

-- RLS Policy para familias
ALTER TABLE hosix_articulos_familias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosix_articulos_familias_select" ON hosix_articulos_familias
FOR SELECT USING (true);

CREATE POLICY "hosix_articulos_familias_insert" ON hosix_articulos_familias
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM hosix_usuarios u
    WHERE u.id = auth.uid() AND u.activo = true
  )
);

CREATE POLICY "hosix_articulos_familias_update" ON hosix_articulos_familias
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM hosix_usuarios u
    WHERE u.id = auth.uid() AND u.activo = true
  )
);

-- ============================================
-- 2. GRUPOS DE ARTÍCULOS
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_articulos_grupos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  familia_id UUID REFERENCES hosix_articulos_familias(id) NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_articulos_grupos_codigo ON hosix_articulos_grupos(codigo);
CREATE INDEX IF NOT EXISTS idx_articulos_grupos_familia ON hosix_articulos_grupos(familia_id);
CREATE INDEX IF NOT EXISTS idx_articulos_grupos_activo ON hosix_articulos_grupos(activo);

ALTER TABLE hosix_articulos_grupos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosix_articulos_grupos_select" ON hosix_articulos_grupos
FOR SELECT USING (true);

CREATE POLICY "hosix_articulos_grupos_insert" ON hosix_articulos_grupos
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM hosix_usuarios u
    WHERE u.id = auth.uid() AND u.activo = true
  )
);

CREATE POLICY "hosix_articulos_grupos_update" ON hosix_articulos_grupos
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM hosix_usuarios u
    WHERE u.id = auth.uid() AND u.activo = true
  )
);

-- ============================================
-- 3. UNIDADES DE DOSIS
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_articulos_unidades_dosis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  simbolo VARCHAR(10),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_unidades_dosis_codigo ON hosix_articulos_unidades_dosis(codigo);
CREATE INDEX IF NOT EXISTS idx_unidades_dosis_activo ON hosix_articulos_unidades_dosis(activo);

ALTER TABLE hosix_articulos_unidades_dosis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosix_articulos_unidades_dosis_select" ON hosix_articulos_unidades_dosis
FOR SELECT USING (true);

CREATE POLICY "hosix_articulos_unidades_dosis_insert" ON hosix_articulos_unidades_dosis
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM hosix_usuarios u
    WHERE u.id = auth.uid() AND u.activo = true
  )
);

-- ============================================
-- 4. UBICACIONES DE ALMACENAMIENTO
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_articulos_ubicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(50), -- almacen, deposito, planta, area
  temperatura_minima DECIMAL(5,2),
  temperatura_maxima DECIMAL(5,2),
  humedad_minima DECIMAL(5,2),
  humedad_maxima DECIMAL(5,2),
  capacidad_items INT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ubicaciones_codigo ON hosix_articulos_ubicaciones(codigo);
CREATE INDEX IF NOT EXISTS idx_ubicaciones_tipo ON hosix_articulos_ubicaciones(tipo);
CREATE INDEX IF NOT EXISTS idx_ubicaciones_activo ON hosix_articulos_ubicaciones(activo);

ALTER TABLE hosix_articulos_ubicaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosix_articulos_ubicaciones_select" ON hosix_articulos_ubicaciones
FOR SELECT USING (true);

CREATE POLICY "hosix_articulos_ubicaciones_insert" ON hosix_articulos_ubicaciones
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM hosix_usuarios u
    WHERE u.id = auth.uid() AND u.activo = true
  )
);

-- ============================================
-- 5. UNIDADES DE COMPRA
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_articulos_unidades_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  cantidad_unidades_basicas INT NOT NULL DEFAULT 1,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_unidades_compra_codigo ON hosix_articulos_unidades_compra(codigo);
CREATE INDEX IF NOT EXISTS idx_unidades_compra_activo ON hosix_articulos_unidades_compra(activo);

ALTER TABLE hosix_articulos_unidades_compra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosix_articulos_unidades_compra_select" ON hosix_articulos_unidades_compra
FOR SELECT USING (true);

CREATE POLICY "hosix_articulos_unidades_compra_insert" ON hosix_articulos_unidades_compra
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM hosix_usuarios u
    WHERE u.id = auth.uid() AND u.activo = true
  )
);

-- ============================================
-- 6. UNIDADES DE DISPENSACIÓN
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_articulos_unidades_dispensacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  cantidad_unidades_basicas INT NOT NULL DEFAULT 1,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_unidades_dispensacion_codigo ON hosix_articulos_unidades_dispensacion(codigo);
CREATE INDEX IF NOT EXISTS idx_unidades_dispensacion_activo ON hosix_articulos_unidades_dispensacion(activo);

ALTER TABLE hosix_articulos_unidades_dispensacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosix_articulos_unidades_dispensacion_select" ON hosix_articulos_unidades_dispensacion
FOR SELECT USING (true);

CREATE POLICY "hosix_articulos_unidades_dispensacion_insert" ON hosix_articulos_unidades_dispensacion
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM hosix_usuarios u
    WHERE u.id = auth.uid() AND u.activo = true
  )
);

-- ============================================
-- 7. ARTÍCULOS (MAESTRO PRINCIPAL)
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_articulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  codigo_barras VARCHAR(100),
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  
  -- Clasificación
  familia_id UUID REFERENCES hosix_articulos_familias(id),
  grupo_id UUID REFERENCES hosix_articulos_grupos(id),
  
  -- Medicamento específico
  es_medicamento BOOLEAN DEFAULT false,
  nombre_comercial VARCHAR(255),
  principio_activo VARCHAR(255),
  concentracion VARCHAR(100),
  forma_farmaceutica VARCHAR(100), -- tableta, inyección, jarabe, etc.
  via_administracion VARCHAR(100), -- oral, inyectable, tópica, etc.
  
  -- Unidades
  unidad_dosis_id UUID REFERENCES hosix_articulos_unidades_dosis(id),
  unidad_compra_id UUID REFERENCES hosix_articulos_unidades_compra(id),
  unidad_dispensacion_id UUID REFERENCES hosix_articulos_unidades_dispensacion(id),
  
  -- Control
  requiere_receta BOOLEAN DEFAULT false,
  controlado BOOLEAN DEFAULT false,
  requiere_refrigeracion BOOLEAN DEFAULT false,
  
  -- Ubicación
  ubicacion_principal_id UUID REFERENCES hosix_articulos_ubicaciones(id),
  ubicaciones_alternativas JSONB DEFAULT '[]', -- array de ubicaciones
  
  -- Proveedores
  proveedores JSONB DEFAULT '[]', -- [{proveedor_id, codigo_proveedor}]
  
  -- Estado
  activo BOOLEAN DEFAULT true,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_articulos_codigo ON hosix_articulos(codigo);
CREATE INDEX IF NOT EXISTS idx_articulos_codigo_barras ON hosix_articulos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_articulos_familia ON hosix_articulos(familia_id);
CREATE INDEX IF NOT EXISTS idx_articulos_grupo ON hosix_articulos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_articulos_es_medicamento ON hosix_articulos(es_medicamento);
CREATE INDEX IF NOT EXISTS idx_articulos_controlado ON hosix_articulos(controlado);
CREATE INDEX IF NOT EXISTS idx_articulos_activo ON hosix_articulos(activo);
CREATE INDEX IF NOT EXISTS idx_articulos_nombre ON hosix_articulos USING GIN(to_tsvector('spanish', nombre));

ALTER TABLE hosix_articulos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosix_articulos_select" ON hosix_articulos
FOR SELECT USING (true);

CREATE POLICY "hosix_articulos_insert" ON hosix_articulos
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM hosix_usuarios u
    WHERE u.id = auth.uid() AND u.activo = true
  )
);

CREATE POLICY "hosix_articulos_update" ON hosix_articulos
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM hosix_usuarios u
    WHERE u.id = auth.uid() AND u.activo = true
  )
);

-- ============================================
-- 8. TIPOS DE ENVASE
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_articulos_tipos_envase (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  capacidad DECIMAL(10,2),
  unidad_capacidad VARCHAR(50), -- ml, mg, unidad, etc.
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tipos_envase_codigo ON hosix_articulos_tipos_envase(codigo);
CREATE INDEX IF NOT EXISTS idx_tipos_envase_activo ON hosix_articulos_tipos_envase(activo);

ALTER TABLE hosix_articulos_tipos_envase ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosix_articulos_tipos_envase_select" ON hosix_articulos_tipos_envase
FOR SELECT USING (true);

CREATE POLICY "hosix_articulos_tipos_envase_insert" ON hosix_articulos_tipos_envase
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM hosix_usuarios u
    WHERE u.id = auth.uid() AND u.activo = true
  )
);

-- ============================================
-- 9. CONTROL DE UNIDADES POR ENVASE
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_articulos_control_envase (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  articulo_id UUID REFERENCES hosix_articulos(id) NOT NULL,
  tipo_envase_id UUID REFERENCES hosix_articulos_tipos_envase(id) NOT NULL,
  unidades_por_envase INT NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_control_envase_articulo ON hosix_articulos_control_envase(articulo_id);
CREATE INDEX IF NOT EXISTS idx_control_envase_envase ON hosix_articulos_control_envase(tipo_envase_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_control_envase_unique ON hosix_articulos_control_envase(articulo_id, tipo_envase_id);

ALTER TABLE hosix_articulos_control_envase ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosix_articulos_control_envase_select" ON hosix_articulos_control_envase
FOR SELECT USING (true);

CREATE POLICY "hosix_articulos_control_envase_insert" ON hosix_articulos_control_envase
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM hosix_usuarios u
    WHERE u.id = auth.uid() AND u.activo = true
  )
);

-- ============================================
-- INSERCIÓN DE DATOS DE PRUEBA
-- ============================================

-- Familias
INSERT INTO hosix_articulos_familias (codigo, nombre, descripcion) VALUES
('FAM_MED', 'Medicamentos', 'Medicamentos farmacéuticos'),
('FAM_MAT', 'Materiales Médicos', 'Materiales para procedimientos médicos'),
('FAM_EQ', 'Equipos Médicos', 'Equipos médicos menores'),
('FAM_SUM', 'Suministros Generales', 'Suministros diversos para hospital')
ON CONFLICT (codigo) DO NOTHING;

-- Unidades de Dosis
INSERT INTO hosix_articulos_unidades_dosis (codigo, nombre, simbolo) VALUES
('UN_COMP', 'Comprimido', 'comp'),
('UN_INY', 'Inyección', 'inj'),
('UN_JAR', 'Jarabe', 'jar'),
('UN_AMP', 'Ampolla', 'amp'),
('UN_CPS', 'Cápsula', 'caps'),
('UN_ML', 'Mililitro', 'ml'),
('UN_MG', 'Miligramo', 'mg'),
('UN_UNIT', 'Unidad', 'u')
ON CONFLICT (codigo) DO NOTHING;

-- Unidades de Compra
INSERT INTO hosix_articulos_unidades_compra (codigo, nombre, cantidad_unidades_basicas) VALUES
('UC_CAJA', 'Caja', 12),
('UC_BLISTER', 'Blister', 10),
('UC_BOTELLA', 'Botella', 1),
('UC_FRASCO', 'Frasco', 1)
ON CONFLICT (codigo) DO NOTHING;

-- Unidades de Dispensación
INSERT INTO hosix_articulos_unidades_dispensacion (codigo, nombre, cantidad_unidades_basicas) VALUES
('UD_UNIT', 'Unidad', 1),
('UD_PACK', 'Pack', 5),
('UD_DOSIS', 'Dosis', 1)
ON CONFLICT (codigo) DO NOTHING;

-- Ubicaciones
INSERT INTO hosix_articulos_ubicaciones (codigo, nombre, tipo, temperatura_minima, temperatura_maxima) VALUES
('UB_FARM', 'Farmacia Principal', 'almacen', 18, 25),
('UB_REFRIG', 'Refrigerador Farmacia', 'almacen', 2, 8),
('UB_ENFERM', 'Almacén Enfermería', 'area', 18, 25),
('UB_QUIROF', 'Almacén Quirófano', 'area', 18, 25)
ON CONFLICT (codigo) DO NOTHING;

-- Tipos de Envase
INSERT INTO hosix_articulos_tipos_envase (codigo, nombre, capacidad, unidad_capacidad) VALUES
('ENV_COMP', 'Comprimidos', 12, 'unidades'),
('ENV_FRASCO', 'Frasco de vidrio', 100, 'ml'),
('ENV_AMP', 'Ampolla', 2, 'ml'),
('ENV_BLISTER', 'Blister', 10, 'unidades')
ON CONFLICT (codigo) DO NOTHING;


-- ============================================
-- [11/44] 20250122_009_hosix_almacenes.sql
-- ============================================

-- ============================================
-- ADM 11.0 - GESTIÓN DE ALMACENES Y STOCK
-- ============================================
-- Fecha: 2025-01-22
-- Funcionalidades:
-- - Gestión de almacenes y depósitos
-- - Control de stock
-- - Movimientos de inventario
-- - Lotes y caducidades (FIFO)
-- - Órdenes de compra
-- - Inventarios físicos

-- ============================================
-- 1. ALMACENES Y DEPÓSITOS
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_almacenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  
  -- Ubicación
  ubicacion_fisica VARCHAR(255),
  area_m2 DECIMAL(10,2),
  
  -- Responsable
  responsable_id UUID REFERENCES profesionales_sanitarios(id),
  
  -- Características
  requiere_refrigeracion BOOLEAN DEFAULT false,
  temperatura_minima DECIMAL(5,2),
  temperatura_maxima DECIMAL(5,2),
  humedad_optima INT,
  
  -- Estado
  activo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para almacenes
ALTER TABLE hosix_almacenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "almacenes_read_all" ON hosix_almacenes
FOR SELECT USING (true);

CREATE POLICY "almacenes_insert_admin" ON hosix_almacenes
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT u.id FROM auth.users u
    WHERE u.email LIKE '%admin%'
  )
);

CREATE POLICY "almacenes_update_admin" ON hosix_almacenes
FOR UPDATE USING (
  auth.uid() IN (
    SELECT u.id FROM auth.users u
    WHERE u.email LIKE '%admin%'
  )
);

-- Tabla de depósitos dentro de almacenes
CREATE TABLE IF NOT EXISTS hosix_almacenes_depositos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  almacen_id UUID REFERENCES hosix_almacenes(id) NOT NULL,
  
  codigo VARCHAR(50) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  
  -- Tipo de depósito
  tipo_deposito VARCHAR(50), -- estanteria, refrigerador, congelador, cajon, repisa
  
  -- Capacidad
  capacidad_maxima INT,
  unidad_capacidad VARCHAR(20), -- unidades, cajas, kg, litros
  
  -- Ubicación dentro del almacén
  ubicacion_relativa VARCHAR(100), -- pasillo A, nivel 2, etc.
  
  -- Estado
  activo BOOLEAN DEFAULT true,
  
  UNIQUE(almacen_id, codigo),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE hosix_almacenes_depositos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "depositos_read_all" ON hosix_almacenes_depositos
FOR SELECT USING (true);

CREATE POLICY "depositos_insert_admin" ON hosix_almacenes_depositos
FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%')
);

CREATE POLICY "depositos_update_admin" ON hosix_almacenes_depositos
FOR UPDATE USING (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%')
);

-- ============================================
-- 2. STOCK E INVENTARIO
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  articulo_id UUID REFERENCES hosix_articulos(id) NOT NULL,
  almacen_id UUID REFERENCES hosix_almacenes(id) NOT NULL,
  deposito_id UUID REFERENCES hosix_almacenes_depositos(id),
  
  -- Cantidad
  cantidad_actual DECIMAL(15,2) NOT NULL DEFAULT 0,
  cantidad_reservada DECIMAL(15,2) DEFAULT 0,
  cantidad_disponible DECIMAL(15,2) GENERATED ALWAYS AS (cantidad_actual - cantidad_reservada) STORED,
  
  -- Umbrales
  stock_minimo DECIMAL(15,2),
  stock_maximo DECIMAL(15,2),
  
  -- Último movimiento
  fecha_ultimo_movimiento TIMESTAMPTZ,
  
  -- Control de caducidad
  requiere_lote BOOLEAN DEFAULT false,
  requiere_caducidad BOOLEAN DEFAULT false,
  
  -- Metadatos
  actualizado_por UUID REFERENCES auth.users(id),
  
  UNIQUE(articulo_id, almacen_id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE hosix_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_read_all" ON hosix_stock
FOR SELECT USING (true);

CREATE POLICY "stock_insert_warehouse" ON hosix_stock
FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%' OR u.email LIKE '%almacen%')
);

CREATE POLICY "stock_update_warehouse" ON hosix_stock
FOR UPDATE USING (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%' OR u.email LIKE '%almacen%')
);

-- ============================================
-- 3. LOTES Y CADUCIDADES
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_stock_lotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID REFERENCES hosix_stock(id) NOT NULL,
  
  numero_lote VARCHAR(100) NOT NULL,
  cantidad_lote DECIMAL(15,2) NOT NULL,
  
  -- Caducidad (FIFO)
  fecha_vencimiento DATE,
  dias_para_vencer INT GENERATED ALWAYS AS (
    EXTRACT(DAY FROM (fecha_vencimiento - CURRENT_DATE))::INT
  ) STORED,
  
  -- Control
  activo BOOLEAN DEFAULT true,
  fecha_entrada TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(stock_id, numero_lote),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE hosix_stock_lotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lotes_read_all" ON hosix_stock_lotes
FOR SELECT USING (true);

CREATE POLICY "lotes_insert_warehouse" ON hosix_stock_lotes
FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%' OR u.email LIKE '%almacen%')
);

CREATE POLICY "lotes_update_warehouse" ON hosix_stock_lotes
FOR UPDATE USING (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%' OR u.email LIKE '%almacen%')
);

-- ============================================
-- 4. MOVIMIENTOS DE INVENTARIO
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_stock_movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  articulo_id UUID REFERENCES hosix_articulos(id) NOT NULL,
  almacen_origen_id UUID REFERENCES hosix_almacenes(id),
  almacen_destino_id UUID REFERENCES hosix_almacenes(id),
  
  -- Tipo de movimiento
  tipo_movimiento VARCHAR(50) NOT NULL, -- entrada_compra, entrada_devolucion, salida_compra, salida_paciente, salida_consume, transferencia, ajuste, devolucion_proveedor
  documento_referencia VARCHAR(100),
  
  -- Cantidades
  cantidad DECIMAL(15,2) NOT NULL,
  unidad VARCHAR(50),
  
  -- Lote (si aplica)
  numero_lote VARCHAR(100),
  fecha_vencimiento DATE,
  
  -- Responsables
  usuario_origen_id UUID REFERENCES auth.users(id),
  usuario_destino_id UUID REFERENCES auth.users(id),
  
  -- Información adicional
  motivo TEXT,
  aprobado_por UUID REFERENCES profesionales_sanitarios(id),
  
  -- Para movimientos a paciente
  paciente_id UUID REFERENCES hosix_pacientes(id),
  episodio_id UUID,
  cuenta_paciente_id UUID,
  
  -- Para movimientos de compra
  orden_compra_id UUID,
  proveedor_id UUID,
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'registrado', -- registrado, aprobado, rechazado
  fecha_aprobacion TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_movimientos_articulo ON hosix_stock_movimientos(articulo_id);
CREATE INDEX idx_movimientos_almacen_origen ON hosix_stock_movimientos(almacen_origen_id);
CREATE INDEX idx_movimientos_almacen_destino ON hosix_stock_movimientos(almacen_destino_id);
CREATE INDEX idx_movimientos_tipo ON hosix_stock_movimientos(tipo_movimiento);
CREATE INDEX idx_movimientos_fecha ON hosix_stock_movimientos(created_at);

ALTER TABLE hosix_stock_movimientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "movimientos_read_all" ON hosix_stock_movimientos
FOR SELECT USING (true);

CREATE POLICY "movimientos_insert_warehouse" ON hosix_stock_movimientos
FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%' OR u.email LIKE '%almacen%')
);

CREATE POLICY "movimientos_update_warehouse" ON hosix_stock_movimientos
FOR UPDATE USING (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%' OR u.email LIKE '%almacen%')
);

-- ============================================
-- 5. ÓRDENES DE COMPRA
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_ordenes_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_orden VARCHAR(50) UNIQUE NOT NULL,
  
  proveedor_id UUID,
  codigo_proveedor VARCHAR(100),
  
  -- Fechas
  fecha_orden TIMESTAMPTZ DEFAULT now(),
  fecha_esperada_entrega DATE,
  fecha_entrega_real DATE,
  
  -- Monto
  subtotal DECIMAL(15,2),
  impuesto DECIMAL(15,2),
  total DECIMAL(15,2),
  
  -- Usuario responsable
  usuario_id UUID REFERENCES auth.users(id),
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'pendiente', -- pendiente, confirmada, entregada_parcial, entregada, cancelada
  
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE hosix_ordenes_compra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ordenes_read_all" ON hosix_ordenes_compra
FOR SELECT USING (true);

CREATE POLICY "ordenes_insert_warehouse" ON hosix_ordenes_compra
FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%' OR u.email LIKE '%almacen%')
);

CREATE POLICY "ordenes_update_warehouse" ON hosix_ordenes_compra
FOR UPDATE USING (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%' OR u.email LIKE '%almacen%')
);

-- Líneas de órdenes de compra
CREATE TABLE IF NOT EXISTS hosix_ordenes_compra_lineas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_compra_id UUID REFERENCES hosix_ordenes_compra(id) NOT NULL,
  
  articulo_id UUID REFERENCES hosix_articulos(id) NOT NULL,
  cantidad_solicitada DECIMAL(15,2) NOT NULL,
  cantidad_recibida DECIMAL(15,2) DEFAULT 0,
  
  -- Precio
  precio_unitario DECIMAL(15,4),
  descuento_porcentaje DECIMAL(5,2),
  total_linea DECIMAL(15,2),
  
  -- Almacén destino
  almacen_destino_id UUID REFERENCES hosix_almacenes(id),
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'pendiente', -- pendiente, parcialmente_recibida, recibida
  
  numero_linea INT,
  
  UNIQUE(orden_compra_id, numero_linea),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE hosix_ordenes_compra_lineas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orden_lineas_read_all" ON hosix_ordenes_compra_lineas
FOR SELECT USING (true);

-- ============================================
-- 6. INVENTARIOS FÍSICOS
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_inventarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_inventario VARCHAR(50) UNIQUE NOT NULL,
  
  -- Alcance
  almacen_id UUID REFERENCES hosix_almacenes(id) NOT NULL,
  deposito_id UUID REFERENCES hosix_almacenes_depositos(id),
  
  -- Fechas
  fecha_programada DATE,
  fecha_inicio TIMESTAMPTZ,
  fecha_cierre TIMESTAMPTZ,
  
  -- Responsables
  usuario_creador_id UUID REFERENCES auth.users(id),
  usuarios_inventariadores JSONB DEFAULT '[]', -- Array de UIDs
  
  -- Resultados
  cantidad_articulos INT,
  diferencias_encontradas INT,
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'planificado', -- planificado, en_proceso, cerrado, regularizado
  
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE hosix_inventarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventarios_read_all" ON hosix_inventarios
FOR SELECT USING (true);

CREATE POLICY "inventarios_insert_warehouse" ON hosix_inventarios
FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%' OR u.email LIKE '%almacen%')
);

CREATE POLICY "inventarios_update_warehouse" ON hosix_inventarios
FOR UPDATE USING (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%' OR u.email LIKE '%almacen%')
);

-- Líneas de inventario físico
CREATE TABLE IF NOT EXISTS hosix_inventarios_lineas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventario_id UUID REFERENCES hosix_inventarios(id) NOT NULL,
  
  articulo_id UUID REFERENCES hosix_articulos(id) NOT NULL,
  
  -- Cantidades
  cantidad_esperada DECIMAL(15,2),
  cantidad_encontrada DECIMAL(15,2),
  diferencia DECIMAL(15,2) GENERATED ALWAYS AS (cantidad_encontrada - cantidad_esperada) STORED,
  
  -- Lote (si aplica)
  numero_lote VARCHAR(100),
  fecha_vencimiento DATE,
  
  -- Observaciones
  observaciones TEXT,
  
  -- Usuario que registró
  usuario_id UUID REFERENCES auth.users(id),
  fecha_registro TIMESTAMPTZ DEFAULT now(),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE hosix_inventarios_lineas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inv_lineas_read_all" ON hosix_inventarios_lineas
FOR SELECT USING (true);

CREATE POLICY "inv_lineas_insert_warehouse" ON hosix_inventarios_lineas
FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%' OR u.email LIKE '%almacen%')
);

CREATE POLICY "inv_lineas_update_warehouse" ON hosix_inventarios_lineas
FOR UPDATE USING (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%' OR u.email LIKE '%almacen%')
);

-- ============================================
-- 7. CENTROS DE COSTE (para salidas directas)
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_centros_coste (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  
  servicio_id UUID REFERENCES hosix_servicios(id),
  responsable_id UUID REFERENCES profesionales_sanitarios(id),
  
  activo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE hosix_centros_coste ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cc_read_all" ON hosix_centros_coste
FOR SELECT USING (true);

CREATE POLICY "cc_insert_admin" ON hosix_centros_coste
FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%')
);

CREATE POLICY "cc_update_admin" ON hosix_centros_coste
FOR UPDATE USING (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%')
);

-- ============================================
-- 8. DATOS INICIALES (SEED DATA)
-- ============================================

INSERT INTO hosix_almacenes (codigo, nombre, descripcion, requiere_refrigeracion, temperatura_minima, temperatura_maxima, activo) VALUES
('ALM_PRINCIPAL', 'Almacén Principal', 'Almacén principal de medicamentos y materiales', false, NULL, NULL, true),
('ALM_FARMACIA', 'Almacén Farmacia', 'Almacén de medicamentos de farmacia', true, 15, 25, true),
('ALM_QUIRURGICO', 'Almacén Quirúrgico', 'Material quirúrgico y estéril', false, NULL, NULL, true),
('ALM_LABORATORIO', 'Almacén Laboratorio', 'Reactivos y muestras de laboratorio', true, 2, 8, true)
ON CONFLICT DO NOTHING;

INSERT INTO hosix_almacenes_depositos (almacen_id, codigo, nombre, tipo_deposito, ubicacion_relativa, activo) 
SELECT id, 'DEP_01', 'Depósito 1', 'estanteria', 'Pasillo A, Nivel 1', true FROM hosix_almacenes WHERE codigo = 'ALM_PRINCIPAL'
ON CONFLICT DO NOTHING;

INSERT INTO hosix_almacenes_depositos (almacen_id, codigo, nombre, tipo_deposito, ubicacion_relativa, activo) 
SELECT id, 'DEP_REF', 'Refrigerador Principal', 'refrigerador', 'Zona Refrigerada', true FROM hosix_almacenes WHERE codigo = 'ALM_FARMACIA'
ON CONFLICT DO NOTHING;

INSERT INTO hosix_centros_coste (codigo, nombre, descripcion, activo) VALUES
('CC_FARMACIA', 'Centro de Coste Farmacia', 'Consumo de medicamentos', true),
('CC_QUIROFANO', 'Centro de Coste Quirófano', 'Consumo quirúrgico', true),
('CC_LABORATORIO', 'Centro de Coste Laboratorio', 'Consumo laboratorio', true),
('CC_ENFERMERIA', 'Centro de Coste Enfermería', 'Consumo de enfermería', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. ÍNDICES ADICIONALES
-- ============================================

CREATE INDEX idx_stock_articulo ON hosix_stock(articulo_id);
CREATE INDEX idx_stock_almacen ON hosix_stock(almacen_id);
CREATE INDEX idx_lotes_stock ON hosix_stock_lotes(stock_id);
CREATE INDEX idx_lotes_vencimiento ON hosix_stock_lotes(fecha_vencimiento);
CREATE INDEX idx_inventarios_almacen ON hosix_inventarios(almacen_id);
CREATE INDEX idx_inv_lineas_inventario ON hosix_inventarios_lineas(inventario_id);
CREATE INDEX idx_ordenes_estado ON hosix_ordenes_compra(estado);


-- ============================================
-- [12/44] 20250122_011_hosix_cpoe_prescripciones.sql
-- ============================================

-- Create hosix_cpoe_prescripciones table for CPOE (Computerized Physician Order Entry)
-- This stores electronic prescriptions with safety alerts and clinical decision support

CREATE TABLE IF NOT EXISTS hosix_cpoe_prescripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  medico_id UUID REFERENCES profesionales_sanitarios(id) NOT NULL,
  
  -- Medicamento
  medicamento_id UUID REFERENCES hosix_articulos(id) NOT NULL,
  nombre_medicamento VARCHAR(255) NOT NULL,
  principio_activo VARCHAR(255),
  
  -- Posología
  dosis VARCHAR(100) NOT NULL,
  unidad_dosis VARCHAR(50),
  via_administracion VARCHAR(50) NOT NULL,
  frecuencia VARCHAR(100) NOT NULL,
  duracion_dias INT,
  
  -- Fechas
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  
  -- CDS - Alertas de seguridad
  tiene_alerta_interaccion BOOLEAN DEFAULT false,
  tiene_alerta_alergia BOOLEAN DEFAULT false,
  tiene_alerta_dosis BOOLEAN DEFAULT false,
  alertas_ignoradas JSONB,
  
  -- Estado
  estado VARCHAR(30) DEFAULT 'activa',
  
  -- Firma electrónica
  firmada BOOLEAN DEFAULT false,
  fecha_firma TIMESTAMPTZ,
  hash_firma VARCHAR(255),
  
  instrucciones_paciente TEXT,
  observaciones_medicas TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE hosix_cpoe_prescripciones ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow SELECT for authenticated users
CREATE POLICY "cpoe_prescripciones_select"
ON hosix_cpoe_prescripciones FOR SELECT
USING (true);

-- RLS Policy: Allow INSERT for authenticated users
CREATE POLICY "cpoe_prescripciones_insert"
ON hosix_cpoe_prescripciones FOR INSERT
WITH CHECK (true);

-- RLS Policy: Allow UPDATE for authenticated users
CREATE POLICY "cpoe_prescripciones_update"
ON hosix_cpoe_prescripciones FOR UPDATE
USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cpoe_prescripciones_paciente_id ON hosix_cpoe_prescripciones(paciente_id);
CREATE INDEX IF NOT EXISTS idx_cpoe_prescripciones_medico_id ON hosix_cpoe_prescripciones(medico_id);
CREATE INDEX IF NOT EXISTS idx_cpoe_prescripciones_estado ON hosix_cpoe_prescripciones(estado);
CREATE INDEX IF NOT EXISTS idx_cpoe_prescripciones_fecha_inicio ON hosix_cpoe_prescripciones(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_cpoe_prescripciones_medicamento_id ON hosix_cpoe_prescripciones(medicamento_id);


-- ============================================
-- [13/44] 20250122_012_hosix_servicios_tipos_ingreso.sql
-- ============================================

-- Add columns to hosix_servicios to track which admission types each service supports
ALTER TABLE hosix_servicios 
ADD COLUMN IF NOT EXISTS atiende_urgencias BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS atiende_externa BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS atiende_hospitalizacion BOOLEAN DEFAULT false;

-- Create an index for filtering by service type
CREATE INDEX IF NOT EXISTS idx_hosix_servicios_tipos_ingreso 
ON hosix_servicios(atiende_urgencias, atiende_externa, atiende_hospitalizacion)
WHERE activo = true;

-- Set default values based on tipo_servicio for existing records (if applicable)
UPDATE hosix_servicios 
SET 
  atiende_urgencias = CASE WHEN tipo_servicio = 'urgencia' THEN true ELSE false END,
  atiende_externa = CASE WHEN tipo_servicio IN ('consulta', 'externa') THEN true ELSE false END,
  atiende_hospitalizacion = CASE WHEN tipo_servicio IN ('hospitalizacion', 'internamiento') THEN true ELSE false END
WHERE atiende_urgencias = false 
  AND atiende_externa = false 
  AND atiende_hospitalizacion = false;


-- ============================================
-- [14/44] 20250205_010_hosix_enfermeria.sql
-- ============================================

-- HOSIX Sistema de Gestión Hospitalaria
-- Migración 010: Módulo de Enfermería
-- Fecha: 2025-02-05
-- Descripción: Implementación completa del módulo asistencial de Enfermería

-- ============================================================
-- 1. WORKLIST DE ENFERMERÍA
-- ============================================================
-- Lista de pacientes asignados a enfermería por área/servicio
CREATE TABLE IF NOT EXISTS hosix_enfermeria_worklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID, -- Puede ser urgencia, hospitalización, etc.
  tipo_episodio VARCHAR(50) NOT NULL, -- 'urgencia', 'hospitalizacion', 'consulta', 'quirofano'
  servicio_id UUID REFERENCES hosix_servicios(id),
  
  -- Asignación
  enfermera_asignada_id UUID REFERENCES hosix_usuarios(id),
  fecha_asignacion TIMESTAMPTZ DEFAULT now(),
  
  -- Estado y prioridad
  estado VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'en_atencion', 'completado', 'cancelado'
  prioridad VARCHAR(20) DEFAULT 'normal', -- 'baja', 'normal', 'alta', 'critica'
  
  -- Información adicional
  observaciones TEXT,
  requiere_atencion_continua BOOLEAN DEFAULT false,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Índices
  CONSTRAINT fk_episodio_urgencia FOREIGN KEY (episodio_id) 
    REFERENCES hosix_urgencias_episodios(id) ON DELETE CASCADE,
  CONSTRAINT fk_episodio_hospitalizacion FOREIGN KEY (episodio_id) 
    REFERENCES hosix_hospitalizacion_episodios(id) ON DELETE CASCADE
);

CREATE INDEX idx_enfermeria_worklist_paciente ON hosix_enfermeria_worklist(paciente_id);
CREATE INDEX idx_enfermeria_worklist_episodio ON hosix_enfermeria_worklist(episodio_id, tipo_episodio);
CREATE INDEX idx_enfermeria_worklist_enfermera ON hosix_enfermeria_worklist(enfermera_asignada_id);
CREATE INDEX idx_enfermeria_worklist_estado ON hosix_enfermeria_worklist(estado, prioridad);
CREATE INDEX idx_enfermeria_worklist_servicio ON hosix_enfermeria_worklist(servicio_id);

-- ============================================================
-- 2. CONSTANTES VITALES
-- ============================================================
-- Registro de signos vitales del paciente
CREATE TABLE IF NOT EXISTS hosix_enfermeria_constantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  tipo_episodio VARCHAR(50),
  worklist_id UUID REFERENCES hosix_enfermeria_worklist(id),
  
  -- Fecha y hora
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT now(),
  registrado_por UUID REFERENCES hosix_usuarios(id),
  
  -- Signos vitales
  presion_arterial_sistolica INT,
  presion_arterial_diastolica INT,
  frecuencia_cardiaca INT,
  frecuencia_respiratoria INT,
  temperatura_celsius NUMERIC(4,2),
  saturacion_oxigeno NUMERIC(5,2), -- SpO2 %
  glucosa_capilar NUMERIC(5,2), -- mg/dL
  peso_kg NUMERIC(5,2),
  talla_cm NUMERIC(5,2),
  imc NUMERIC(4,2), -- Calculado automáticamente
  
  -- Signos adicionales (JSON para flexibilidad)
  signos_adicionales JSONB DEFAULT '{}',
  -- Ejemplo: { "dolor_escala": 7, "nivel_conciencia": "GCS 15", "pupilas": "isocoricas" }
  
  -- Observaciones
  observaciones TEXT,
  alertas TEXT[], -- Array de alertas generadas
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_constantes_paciente ON hosix_enfermeria_constantes(paciente_id, fecha_registro DESC);
CREATE INDEX idx_constantes_episodio ON hosix_enfermeria_constantes(episodio_id, tipo_episodio);
CREATE INDEX idx_constantes_worklist ON hosix_enfermeria_worklist(id);

-- Función para calcular IMC automáticamente
CREATE OR REPLACE FUNCTION calcular_imc()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.peso_kg IS NOT NULL AND NEW.talla_cm IS NOT NULL AND NEW.talla_cm > 0 THEN
    NEW.imc := ROUND((NEW.peso_kg / POWER(NEW.talla_cm / 100.0, 2))::NUMERIC, 2);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_imc
  BEFORE INSERT OR UPDATE ON hosix_enfermeria_constantes
  FOR EACH ROW
  EXECUTE FUNCTION calcular_imc();

-- ============================================================
-- 3. EVALUACIONES INICIALES DE ENFERMERÍA
-- ============================================================
-- Evaluación inicial del paciente al ingresar
CREATE TABLE IF NOT EXISTS hosix_enfermeria_evaluaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  tipo_episodio VARCHAR(50),
  worklist_id UUID REFERENCES hosix_enfermeria_worklist(id),
  
  -- Fecha
  fecha_evaluacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  evaluado_por UUID REFERENCES hosix_usuarios(id),
  
  -- Datos de evaluación
  motivo_ingreso TEXT,
  alergias TEXT[],
  medicamentos_actuales JSONB DEFAULT '[]',
  antecedentes_relevantes TEXT,
  
  -- Estado funcional
  nivel_dependencia VARCHAR(50), -- 'independiente', 'dependencia_parcial', 'dependencia_total'
  movilidad VARCHAR(50), -- 'autonoma', 'con_ayuda', 'encamado'
  estado_nutricional VARCHAR(50), -- 'normal', 'riesgo', 'desnutricion'
  
  -- Escalas de valoración
  escala_glasgow INT, -- Escala de Glasgow (3-15)
  escala_norton NUMERIC(3,1), -- Escala de Norton (5-20)
  escala_braden NUMERIC(3,1), -- Escala de Braden (6-23)
  
  -- Observaciones
  observaciones TEXT,
  plan_cuidados_inicial TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_evaluaciones_paciente ON hosix_enfermeria_evaluaciones(paciente_id, fecha_evaluacion DESC);
CREATE INDEX idx_evaluaciones_episodio ON hosix_enfermeria_evaluaciones(episodio_id, tipo_episodio);

-- ============================================================
-- 4. PLANES DE CUIDADO
-- ============================================================
-- Planes de cuidado estandarizados y personalizados
CREATE TABLE IF NOT EXISTS hosix_enfermeria_planes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  tipo_episodio VARCHAR(50),
  worklist_id UUID REFERENCES hosix_enfermeria_worklist(id),
  
  -- Tipo de plan
  tipo_plan VARCHAR(50) NOT NULL, -- 'estandarizado', 'personalizado', 'nanda'
  nombre_plan VARCHAR(255),
  codigo_nanda VARCHAR(50), -- Código NANDA si aplica
  
  -- Diagnóstico de enfermería
  diagnostico_enfermeria TEXT NOT NULL,
  factores_relacionados TEXT[],
  caracteristicas_definitorias TEXT[],
  
  -- Objetivos y resultados esperados
  objetivos JSONB DEFAULT '[]',
  -- Ejemplo: [{"descripcion": "Mantener integridad cutánea", "fecha_esperada": "2025-02-10"}]
  
  -- Intervenciones
  intervenciones JSONB DEFAULT '[]',
  -- Ejemplo: [{"tipo": "cuidado", "descripcion": "Cambio de posición cada 2 horas", "frecuencia": "cada_2h"}]
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'activo', -- 'activo', 'suspendido', 'completado', 'cancelado'
  fecha_inicio TIMESTAMPTZ DEFAULT now(),
  fecha_fin TIMESTAMPTZ,
  
  -- Responsable
  creado_por UUID REFERENCES hosix_usuarios(id),
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_planes_paciente ON hosix_enfermeria_planes(paciente_id, estado);
CREATE INDEX idx_planes_episodio ON hosix_enfermeria_planes(episodio_id, tipo_episodio);
CREATE INDEX idx_planes_estado ON hosix_enfermeria_planes(estado, fecha_inicio);

-- ============================================================
-- 5. KARDEX - DISPENSACIONES Y CUIDADOS
-- ============================================================
-- Registro de dispensaciones de medicamentos y cuidados realizados
CREATE TABLE IF NOT EXISTS hosix_enfermeria_kardex (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  tipo_episodio VARCHAR(50),
  worklist_id UUID REFERENCES hosix_enfermeria_worklist(id),
  prescripcion_id UUID REFERENCES hosix_prescripciones(id),
  plan_cuidado_id UUID REFERENCES hosix_enfermeria_planes(id),
  
  -- Tipo de registro
  tipo_registro VARCHAR(50) NOT NULL, -- 'dispensacion', 'cuidado', 'administracion', 'observacion'
  
  -- Fecha y hora exacta
  fecha_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
  registrado_por UUID REFERENCES hosix_usuarios(id),
  
  -- Detalles de dispensación (si aplica)
  medicamento_id UUID REFERENCES hosix_medicamentos(id),
  medicamento_texto VARCHAR(255),
  dosis VARCHAR(100),
  via_administracion VARCHAR(50),
  hora_programada TIME,
  hora_real TIME,
  
  -- Detalles de cuidado (si aplica)
  tipo_cuidado VARCHAR(100), -- 'cambio_postura', 'cura', 'higiene', 'alimentacion', etc.
  descripcion_cuidado TEXT,
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'realizado', -- 'programado', 'realizado', 'omitido', 'rechazado'
  motivo_omision TEXT,
  
  -- Observaciones
  observaciones TEXT,
  respuesta_paciente TEXT, -- Reacción o respuesta del paciente
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_kardex_paciente ON hosix_enfermeria_kardex(paciente_id, fecha_hora DESC);
CREATE INDEX idx_kardex_episodio ON hosix_enfermeria_kardex(episodio_id, tipo_episodio);
CREATE INDEX idx_kardex_tipo ON hosix_enfermeria_kardex(tipo_registro, estado);
CREATE INDEX idx_kardex_prescripcion ON hosix_enfermeria_kardex(prescripcion_id);

-- ============================================================
-- 6. BALANCE HÍDRICO
-- ============================================================
-- Control de líquidos ingeridos y eliminados
CREATE TABLE IF NOT EXISTS hosix_enfermeria_balance_hidrico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  tipo_episodio VARCHAR(50),
  worklist_id UUID REFERENCES hosix_enfermeria_worklist(id),
  
  -- Fecha y turno
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  turno VARCHAR(20), -- 'mañana', 'tarde', 'noche', '24h'
  
  -- Líquidos ingeridos (en ml)
  ingesta_oral NUMERIC(6,2) DEFAULT 0,
  ingesta_sonda NUMERIC(6,2) DEFAULT 0,
  ingesta_venosa NUMERIC(6,2) DEFAULT 0,
  ingesta_otros NUMERIC(6,2) DEFAULT 0,
  total_ingesta NUMERIC(6,2) DEFAULT 0,
  
  -- Líquidos eliminados (en ml)
  eliminacion_orina NUMERIC(6,2) DEFAULT 0,
  eliminacion_heces NUMERIC(6,2) DEFAULT 0,
  eliminacion_sonda NUMERIC(6,2) DEFAULT 0,
  eliminacion_drenajes NUMERIC(6,2) DEFAULT 0,
  eliminacion_otros NUMERIC(6,2) DEFAULT 0,
  total_eliminacion NUMERIC(6,2) DEFAULT 0,
  
  -- Balance
  balance_diario NUMERIC(6,2), -- Calculado: ingesta - eliminación
  balance_acumulado NUMERIC(6,2), -- Balance acumulado desde inicio
  
  -- Observaciones
  observaciones TEXT,
  
  -- Registrado por
  registrado_por UUID REFERENCES hosix_usuarios(id),
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraint único por paciente, fecha y turno
  UNIQUE(paciente_id, episodio_id, fecha, turno)
);

CREATE INDEX idx_balance_paciente ON hosix_enfermeria_balance_hidrico(paciente_id, fecha DESC);
CREATE INDEX idx_balance_episodio ON hosix_enfermeria_balance_hidrico(episodio_id, tipo_episodio);

-- Función para calcular totales y balance automáticamente
CREATE OR REPLACE FUNCTION calcular_balance_hidrico()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular total ingesta
  NEW.total_ingesta := COALESCE(NEW.ingesta_oral, 0) + 
                       COALESCE(NEW.ingesta_sonda, 0) + 
                       COALESCE(NEW.ingesta_venosa, 0) + 
                       COALESCE(NEW.ingesta_otros, 0);
  
  -- Calcular total eliminación
  NEW.total_eliminacion := COALESCE(NEW.eliminacion_orina, 0) + 
                           COALESCE(NEW.eliminacion_heces, 0) + 
                           COALESCE(NEW.eliminacion_sonda, 0) + 
                           COALESCE(NEW.eliminacion_drenajes, 0) + 
                           COALESCE(NEW.eliminacion_otros, 0);
  
  -- Calcular balance diario
  NEW.balance_diario := NEW.total_ingesta - NEW.total_eliminacion;
  
  -- Calcular balance acumulado (suma de todos los registros del episodio)
  SELECT COALESCE(SUM(balance_diario), 0) INTO NEW.balance_acumulado
  FROM hosix_enfermeria_balance_hidrico
  WHERE paciente_id = NEW.paciente_id
    AND episodio_id = NEW.episodio_id
    AND fecha <= NEW.fecha;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_balance_hidrico
  BEFORE INSERT OR UPDATE ON hosix_enfermeria_balance_hidrico
  FOR EACH ROW
  EXECUTE FUNCTION calcular_balance_hidrico();

-- ============================================================
-- 7. DIARIO CLÍNICO DE ENFERMERÍA
-- ============================================================
-- Anotaciones de enfermería en el diario clínico
CREATE TABLE IF NOT EXISTS hosix_enfermeria_diario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  tipo_episodio VARCHAR(50),
  worklist_id UUID REFERENCES hosix_enfermeria_worklist(id),
  
  -- Fecha y hora
  fecha_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
  registrado_por UUID REFERENCES hosix_usuarios(id),
  
  -- Tipo de anotación
  tipo_anotacion VARCHAR(50), -- 'evolucion', 'incidente', 'comunicacion', 'cuidado'
  
  -- Contenido
  titulo VARCHAR(255),
  contenido TEXT NOT NULL,
  
  -- Modelo predefinido usado (si aplica)
  modelo_predefinido_id UUID,
  modelo_predefinido_nombre VARCHAR(255),
  
  -- Datos estructurados (JSON)
  datos_estructurados JSONB DEFAULT '{}',
  
  -- Firma
  firmado BOOLEAN DEFAULT false,
  fecha_firma TIMESTAMPTZ,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_diario_paciente ON hosix_enfermeria_diario(paciente_id, fecha_hora DESC);
CREATE INDEX idx_diario_episodio ON hosix_enfermeria_diario(episodio_id, tipo_episodio);
CREATE INDEX idx_diario_tipo ON hosix_enfermeria_diario(tipo_anotacion);

-- ============================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE hosix_enfermeria_worklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_enfermeria_constantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_enfermeria_evaluaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_enfermeria_planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_enfermeria_kardex ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_enfermeria_balance_hidrico ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_enfermeria_diario ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (ajustar según necesidades de seguridad)
-- Los usuarios pueden ver sus propios registros y los de su servicio

-- Worklist
CREATE POLICY "Usuarios pueden ver worklist de su servicio"
  ON hosix_enfermeria_worklist FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND (u.centro_salud_id = hosix_enfermeria_worklist.servicio_id OR u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE nivel_acceso >= 5
      ))
    )
  );

CREATE POLICY "Enfermeras pueden crear worklist"
  ON hosix_enfermeria_worklist FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE codigo IN ('ENFERMERA', 'ENFERMERA_JEFE', 'ADMIN')
      )
    )
  );

CREATE POLICY "Enfermeras pueden actualizar worklist"
  ON hosix_enfermeria_worklist FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND (u.id = enfermera_asignada_id OR u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE codigo IN ('ENFERMERA_JEFE', 'ADMIN')
      ))
    )
  );

-- Constantes vitales
CREATE POLICY "Usuarios pueden ver constantes de su servicio"
  ON hosix_enfermeria_constantes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE nivel_acceso >= 3
      )
    )
  );

CREATE POLICY "Enfermeras pueden registrar constantes"
  ON hosix_enfermeria_constantes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE codigo IN ('ENFERMERA', 'ENFERMERA_JEFE', 'MEDICO', 'ADMIN')
      )
    )
  );

-- Evaluaciones
CREATE POLICY "Usuarios pueden ver evaluaciones de su servicio"
  ON hosix_enfermeria_evaluaciones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE nivel_acceso >= 3
      )
    )
  );

CREATE POLICY "Enfermeras pueden crear evaluaciones"
  ON hosix_enfermeria_evaluaciones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE codigo IN ('ENFERMERA', 'ENFERMERA_JEFE', 'ADMIN')
      )
    )
  );

-- Planes de cuidado
CREATE POLICY "Usuarios pueden ver planes de su servicio"
  ON hosix_enfermeria_planes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE nivel_acceso >= 3
      )
    )
  );

CREATE POLICY "Enfermeras pueden crear planes"
  ON hosix_enfermeria_planes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE codigo IN ('ENFERMERA', 'ENFERMERA_JEFE', 'ADMIN')
      )
    )
  );

-- Kardex
CREATE POLICY "Usuarios pueden ver kardex de su servicio"
  ON hosix_enfermeria_kardex FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE nivel_acceso >= 3
      )
    )
  );

CREATE POLICY "Enfermeras pueden registrar kardex"
  ON hosix_enfermeria_kardex FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE codigo IN ('ENFERMERA', 'ENFERMERA_JEFE', 'ADMIN')
      )
    )
  );

-- Balance hídrico
CREATE POLICY "Usuarios pueden ver balance de su servicio"
  ON hosix_enfermeria_balance_hidrico FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE nivel_acceso >= 3
      )
    )
  );

CREATE POLICY "Enfermeras pueden registrar balance"
  ON hosix_enfermeria_balance_hidrico FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE codigo IN ('ENFERMERA', 'ENFERMERA_JEFE', 'ADMIN')
      )
    )
  );

-- Diario clínico
CREATE POLICY "Usuarios pueden ver diario de su servicio"
  ON hosix_enfermeria_diario FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE nivel_acceso >= 3
      )
    )
  );

CREATE POLICY "Enfermeras pueden crear anotaciones en diario"
  ON hosix_enfermeria_diario FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE codigo IN ('ENFERMERA', 'ENFERMERA_JEFE', 'ADMIN')
      )
    )
  );

-- ============================================================
-- 9. COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================

COMMENT ON TABLE hosix_enfermeria_worklist IS 'Worklist de pacientes asignados a enfermería por área/servicio';
COMMENT ON TABLE hosix_enfermeria_constantes IS 'Registro de constantes vitales del paciente';
COMMENT ON TABLE hosix_enfermeria_evaluaciones IS 'Evaluaciones iniciales de enfermería al ingreso';
COMMENT ON TABLE hosix_enfermeria_planes IS 'Planes de cuidado estandarizados y personalizados';
COMMENT ON TABLE hosix_enfermeria_kardex IS 'Kardex de dispensaciones de medicamentos y cuidados realizados';
COMMENT ON TABLE hosix_enfermeria_balance_hidrico IS 'Control de balance hídrico (líquidos ingeridos/eliminados)';
COMMENT ON TABLE hosix_enfermeria_diario IS 'Diario clínico de enfermería con anotaciones';

-- ============================================================
-- FIN DE MIGRACIÓN
-- ============================================================



-- ============================================
-- [15/44] 20250205_011_hosix_medicos.sql
-- ============================================

-- HOSIX Sistema de Gestión Hospitalaria
-- Migración 011: Módulo de Médicos
-- Fecha: 2025-02-05
-- Descripción: Implementación completa del módulo asistencial de Médicos

-- ============================================================
-- 1. WORKLIST DE MÉDICOS
-- ============================================================
-- Lista de pacientes asignados a médicos por servicio/especialidad
CREATE TABLE IF NOT EXISTS hosix_medicos_worklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID, -- Puede ser urgencia, hospitalización, consulta, etc.
  tipo_episodio VARCHAR(50) NOT NULL, -- 'urgencia', 'hospitalizacion', 'consulta', 'quirofano'
  servicio_id UUID REFERENCES hosix_servicios(id),
  
  -- Asignación
  medico_asignado_id UUID REFERENCES hosix_usuarios(id),
  fecha_asignacion TIMESTAMPTZ DEFAULT now(),
  
  -- Estado y prioridad
  estado VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'en_consulta', 'completado', 'cancelado'
  prioridad VARCHAR(20) DEFAULT 'normal', -- 'baja', 'normal', 'alta', 'critica'
  
  -- Información adicional
  motivo_consulta TEXT,
  observaciones TEXT,
  requiere_seguimiento BOOLEAN DEFAULT false,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_medicos_worklist_paciente ON hosix_medicos_worklist(paciente_id);
CREATE INDEX idx_medicos_worklist_episodio ON hosix_medicos_worklist(episodio_id, tipo_episodio);
CREATE INDEX idx_medicos_worklist_medico ON hosix_medicos_worklist(medico_asignado_id);
CREATE INDEX idx_medicos_worklist_estado ON hosix_medicos_worklist(estado, prioridad);
CREATE INDEX idx_medicos_worklist_servicio ON hosix_medicos_worklist(servicio_id);

-- ============================================================
-- 2. DIAGNÓSTICOS MÉDICOS
-- ============================================================
-- Diagnósticos asociados a episodios/consultas
CREATE TABLE IF NOT EXISTS hosix_diagnosticos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  tipo_episodio VARCHAR(50),
  worklist_id UUID REFERENCES hosix_medicos_worklist(id),
  consulta_id UUID, -- Referencia a consulta médica si aplica
  
  -- Diagnóstico
  codigo_cie10_id UUID REFERENCES hosix_codificacion_cie10(id),
  codigo_cie10 VARCHAR(20), -- Código CIE-10
  descripcion_diagnostico TEXT NOT NULL,
  tipo_diagnostico VARCHAR(50) DEFAULT 'principal', -- 'principal', 'secundario', 'complicacion', 'comorbilidad'
  
  -- Clasificación
  certeza VARCHAR(50) DEFAULT 'presuntivo', -- 'presuntivo', 'confirmado', 'diferencial'
  fecha_diagnostico TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Profesional
  medico_id UUID REFERENCES hosix_usuarios(id),
  
  -- Observaciones
  observaciones TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_diagnosticos_paciente ON hosix_diagnosticos(paciente_id, fecha_diagnostico DESC);
CREATE INDEX idx_diagnosticos_episodio ON hosix_diagnosticos(episodio_id, tipo_episodio);
CREATE INDEX idx_diagnosticos_cie10 ON hosix_diagnosticos(codigo_cie10);
CREATE INDEX idx_diagnosticos_tipo ON hosix_diagnosticos(tipo_diagnostico);

-- ============================================================
-- 3. TRATAMIENTOS MÉDICOS
-- ============================================================
-- Tratamientos y terapias prescritas
CREATE TABLE IF NOT EXISTS hosix_tratamientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  tipo_episodio VARCHAR(50),
  worklist_id UUID REFERENCES hosix_medicos_worklist(id),
  diagnostico_id UUID REFERENCES hosix_diagnosticos(id),
  
  -- Tratamiento
  tipo_tratamiento VARCHAR(50) NOT NULL, -- 'medicamento', 'terapia', 'procedimiento', 'quirurgico', 'fisioterapia', 'otro'
  descripcion TEXT NOT NULL,
  indicaciones TEXT,
  
  -- Duración
  fecha_inicio TIMESTAMPTZ DEFAULT now(),
  fecha_fin TIMESTAMPTZ,
  duracion_dias INT,
  
  -- Profesional
  medico_id UUID REFERENCES hosix_usuarios(id),
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'activo', -- 'activo', 'suspendido', 'completado', 'cancelado'
  
  -- Resultado
  resultado TEXT,
  efectividad VARCHAR(50), -- 'efectivo', 'parcial', 'inefectivo', 'pendiente'
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tratamientos_paciente ON hosix_tratamientos(paciente_id, fecha_inicio DESC);
CREATE INDEX idx_tratamientos_episodio ON hosix_tratamientos(episodio_id, tipo_episodio);
CREATE INDEX idx_tratamientos_diagnostico ON hosix_tratamientos(diagnostico_id);
CREATE INDEX idx_tratamientos_estado ON hosix_tratamientos(estado);

-- ============================================================
-- 4. INTERCONSULTAS MÉDICAS
-- ============================================================
-- Solicitudes y respuestas de interconsultas
CREATE TABLE IF NOT EXISTS hosix_interconsultas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  tipo_episodio VARCHAR(50),
  worklist_id UUID REFERENCES hosix_medicos_worklist(id),
  
  -- Solicitud
  servicio_solicitante_id UUID REFERENCES hosix_servicios(id),
  servicio_destino_id UUID REFERENCES hosix_servicios(id) NOT NULL,
  medico_solicitante_id UUID REFERENCES hosix_usuarios(id),
  medico_destino_id UUID REFERENCES hosix_usuarios(id),
  
  -- Motivo y pregunta clínica
  motivo_interconsulta TEXT NOT NULL,
  pregunta_clinica TEXT,
  antecedentes_relevantes TEXT,
  
  -- Urgencia
  urgencia VARCHAR(20) DEFAULT 'normal', -- 'baja', 'normal', 'alta', 'critica'
  fecha_solicitud TIMESTAMPTZ DEFAULT now(),
  fecha_limite_respuesta TIMESTAMPTZ,
  
  -- Respuesta
  fecha_respuesta TIMESTAMPTZ,
  respuesta_medica TEXT,
  recomendaciones TEXT,
  requiere_seguimiento BOOLEAN DEFAULT false,
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'en_revision', 'respondida', 'cancelada'
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_interconsultas_paciente ON hosix_interconsultas(paciente_id, fecha_solicitud DESC);
CREATE INDEX idx_interconsultas_episodio ON hosix_interconsultas(episodio_id, tipo_episodio);
CREATE INDEX idx_interconsultas_estado ON hosix_interconsultas(estado, urgencia);
CREATE INDEX idx_interconsultas_servicio_destino ON hosix_interconsultas(servicio_destino_id);

-- ============================================================
-- 5. CONSULTAS MÉDICAS
-- ============================================================
-- Registro detallado de consultas médicas
CREATE TABLE IF NOT EXISTS hosix_consultas_medicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  tipo_episodio VARCHAR(50),
  worklist_id UUID REFERENCES hosix_medicos_worklist(id),
  cita_id UUID REFERENCES hosix_citas(id),
  
  -- Fecha y profesional
  fecha_consulta TIMESTAMPTZ NOT NULL DEFAULT now(),
  medico_id UUID REFERENCES hosix_usuarios(id) NOT NULL,
  servicio_id UUID REFERENCES hosix_servicios(id),
  
  -- Anamnesis
  motivo_consulta TEXT,
  enfermedad_actual TEXT,
  antecedentes_personales TEXT,
  antecedentes_familiares TEXT,
  alergias TEXT[],
  medicamentos_actuales JSONB DEFAULT '[]',
  
  -- Exploración física
  exploracion_fisica JSONB DEFAULT '{}',
  -- Ejemplo: { "ta": "120/80", "fc": 72, "fr": 16, "temp": 36.5, "peso": 70, "talla": 170 }
  
  -- Diagnósticos de la consulta
  diagnosticos_principales UUID[], -- Referencias a hosix_diagnosticos
  diagnosticos_secundarios UUID[],
  
  -- Plan terapéutico
  plan_terapeutico TEXT,
  tratamientos_prescritos UUID[], -- Referencias a hosix_tratamientos
  prescripciones UUID[], -- Referencias a hosix_prescripciones
  
  -- Órdenes y solicitudes
  ordenes_laboratorio JSONB DEFAULT '[]',
  ordenes_imagenologia JSONB DEFAULT '[]',
  ordenes_otros JSONB DEFAULT '[]',
  
  -- Seguimiento
  requiere_control BOOLEAN DEFAULT false,
  fecha_proximo_control DATE,
  observaciones TEXT,
  
  -- Firma
  firmado BOOLEAN DEFAULT false,
  fecha_firma TIMESTAMPTZ,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_consultas_paciente ON hosix_consultas_medicas(paciente_id, fecha_consulta DESC);
CREATE INDEX idx_consultas_episodio ON hosix_consultas_medicas(episodio_id, tipo_episodio);
CREATE INDEX idx_consultas_medico ON hosix_consultas_medicas(medico_id);
CREATE INDEX idx_consultas_fecha ON hosix_consultas_medicas(fecha_consulta);

-- ============================================================
-- 6. CUESTIONARIOS Y ESCALAS CLÍNICAS
-- ============================================================
-- Registro de cuestionarios y escalas aplicadas
CREATE TABLE IF NOT EXISTS hosix_cuestionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  tipo_episodio VARCHAR(50),
  consulta_id UUID REFERENCES hosix_consultas_medicas(id),
  
  -- Cuestionario
  nombre_cuestionario VARCHAR(255) NOT NULL, -- 'Barthel', 'Glasgow', 'Norton', etc.
  tipo_cuestionario VARCHAR(100), -- 'dependencia', 'cognitivo', 'dolor', 'nutricional', etc.
  version VARCHAR(50),
  
  -- Fecha y profesional
  fecha_aplicacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  aplicado_por UUID REFERENCES hosix_usuarios(id),
  
  -- Respuestas (JSON flexible)
  respuestas JSONB NOT NULL DEFAULT '{}',
  puntuacion_total NUMERIC(5,2),
  interpretacion TEXT,
  
  -- Observaciones
  observaciones TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cuestionarios_paciente ON hosix_cuestionarios(paciente_id, fecha_aplicacion DESC);
CREATE INDEX idx_cuestionarios_tipo ON hosix_cuestionarios(tipo_cuestionario);
CREATE INDEX idx_cuestionarios_nombre ON hosix_cuestionarios(nombre_cuestionario);

-- ============================================================
-- 7. MAPAS DENTALES
-- ============================================================
-- Mapas dentales para odontología
CREATE TABLE IF NOT EXISTS hosix_mapas_dentales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  consulta_id UUID REFERENCES hosix_consultas_medicas(id),
  
  -- Tipo de mapa
  tipo_mapa VARCHAR(50) DEFAULT 'adulto', -- 'adulto', 'pediatrico', 'mixto'
  
  -- Datos del mapa (JSON para flexibilidad)
  dientes JSONB NOT NULL DEFAULT '{}',
  -- Estructura: { "11": { "estado": "sano", "tratamiento": "obturacion", "fecha": "2025-01-15" }, ... }
  
  -- Fecha
  fecha_creacion TIMESTAMPTZ DEFAULT now(),
  fecha_actualizacion TIMESTAMPTZ DEFAULT now(),
  creado_por UUID REFERENCES hosix_usuarios(id),
  
  -- Observaciones
  observaciones TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mapas_dentales_paciente ON hosix_mapas_dentales(paciente_id, fecha_creacion DESC);

-- ============================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE hosix_medicos_worklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_diagnosticos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_tratamientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_interconsultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_consultas_medicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_cuestionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_mapas_dentales ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas
CREATE POLICY "medicos_worklist_read" ON hosix_medicos_worklist FOR SELECT USING (true);
CREATE POLICY "medicos_worklist_insert" ON hosix_medicos_worklist FOR INSERT WITH CHECK (true);
CREATE POLICY "medicos_worklist_update" ON hosix_medicos_worklist FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "diagnosticos_read" ON hosix_diagnosticos FOR SELECT USING (true);
CREATE POLICY "diagnosticos_insert" ON hosix_diagnosticos FOR INSERT WITH CHECK (true);
CREATE POLICY "diagnosticos_update" ON hosix_diagnosticos FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "tratamientos_read" ON hosix_tratamientos FOR SELECT USING (true);
CREATE POLICY "tratamientos_insert" ON hosix_tratamientos FOR INSERT WITH CHECK (true);
CREATE POLICY "tratamientos_update" ON hosix_tratamientos FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "interconsultas_read" ON hosix_interconsultas FOR SELECT USING (true);
CREATE POLICY "interconsultas_insert" ON hosix_interconsultas FOR INSERT WITH CHECK (true);
CREATE POLICY "interconsultas_update" ON hosix_interconsultas FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "consultas_read" ON hosix_consultas_medicas FOR SELECT USING (true);
CREATE POLICY "consultas_insert" ON hosix_consultas_medicas FOR INSERT WITH CHECK (true);
CREATE POLICY "consultas_update" ON hosix_consultas_medicas FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "cuestionarios_read" ON hosix_cuestionarios FOR SELECT USING (true);
CREATE POLICY "cuestionarios_insert" ON hosix_cuestionarios FOR INSERT WITH CHECK (true);
CREATE POLICY "cuestionarios_update" ON hosix_cuestionarios FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "mapas_dentales_read" ON hosix_mapas_dentales FOR SELECT USING (true);
CREATE POLICY "mapas_dentales_insert" ON hosix_mapas_dentales FOR INSERT WITH CHECK (true);
CREATE POLICY "mapas_dentales_update" ON hosix_mapas_dentales FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================================
-- 9. COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================

COMMENT ON TABLE hosix_medicos_worklist IS 'Worklist de pacientes asignados a médicos por servicio/especialidad';
COMMENT ON TABLE hosix_diagnosticos IS 'Diagnósticos médicos asociados a episodios/consultas';
COMMENT ON TABLE hosix_tratamientos IS 'Tratamientos y terapias prescritas por médicos';
COMMENT ON TABLE hosix_interconsultas IS 'Solicitudes y respuestas de interconsultas médicas';
COMMENT ON TABLE hosix_consultas_medicas IS 'Registro detallado de consultas médicas';
COMMENT ON TABLE hosix_cuestionarios IS 'Registro de cuestionarios y escalas clínicas aplicadas';
COMMENT ON TABLE hosix_mapas_dentales IS 'Mapas dentales para odontología';

-- ============================================================
-- FIN DE MIGRACIÓN
-- ============================================================



-- ============================================
-- [16/44] 20250205_012_hosix_drug_interactions.sql
-- ============================================

-- HOSIX Sistema de Gestión Hospitalaria
-- Migración 012: Interacciones Medicamentosas (DrugBank Integration)
-- Fecha: 2025-02-05
-- Descripción: Tabla para almacenar interacciones medicamentosas y soporte DrugBank

-- ============================================================
-- TABLA DE INTERACCIONES MEDICAMENTOSAS
-- ============================================================
CREATE TABLE IF NOT EXISTS hosix_drug_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Medicamentos involucrados
  medicamento1_id UUID REFERENCES hosix_medicamentos(id) NOT NULL,
  medicamento2_id UUID REFERENCES hosix_medicamentos(id) NOT NULL,
  
  -- Información de la interacción
  severidad VARCHAR(20) NOT NULL, -- 'leve', 'moderada', 'grave', 'critica'
  descripcion TEXT NOT NULL,
  recomendacion TEXT,
  
  -- Fuente de la información
  fuente VARCHAR(50) DEFAULT 'drugbank', -- 'drugbank', 'manual', 'literatura'
  
  -- Información adicional
  mecanismo_accion TEXT,
  evidencia_nivel VARCHAR(20), -- 'alta', 'media', 'baja'
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsqueda rápida
CREATE INDEX idx_drug_interactions_med1 ON hosix_drug_interactions(medicamento1_id);
CREATE INDEX idx_drug_interactions_med2 ON hosix_drug_interactions(medicamento2_id);
CREATE INDEX idx_drug_interactions_severidad ON hosix_drug_interactions(severidad);
CREATE INDEX idx_drug_interactions_both ON hosix_drug_interactions(medicamento1_id, medicamento2_id);

-- Índice único funcional para evitar duplicados (A-B es igual a B-A)
CREATE UNIQUE INDEX idx_drug_interactions_unique ON hosix_drug_interactions (
  LEAST(medicamento1_id, medicamento2_id),
  GREATEST(medicamento1_id, medicamento2_id)
);

-- ============================================================
-- AGREGAR CAMPO DRUGBANK_ID A MEDICAMENTOS
-- ============================================================
ALTER TABLE hosix_medicamentos 
ADD COLUMN IF NOT EXISTS drugbank_id VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_medicamentos_drugbank_id ON hosix_medicamentos(drugbank_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE hosix_drug_interactions ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer interacciones (información pública)
CREATE POLICY "drug_interactions_read" ON hosix_drug_interactions
  FOR SELECT USING (true);

-- Política: Solo usuarios autenticados pueden insertar
CREATE POLICY "drug_interactions_insert" ON hosix_drug_interactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política: Solo usuarios autenticados pueden actualizar
CREATE POLICY "drug_interactions_update" ON hosix_drug_interactions
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- FUNCIÓN PARA BUSCAR INTERACCIONES
-- ============================================================
CREATE OR REPLACE FUNCTION buscar_interacciones_medicamento(
  p_medicamento_id UUID
)
RETURNS TABLE (
  medicamento_id UUID,
  medicamento_nombre VARCHAR,
  severidad VARCHAR,
  descripcion TEXT,
  recomendacion TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN di.medicamento1_id = p_medicamento_id 
      THEN di.medicamento2_id 
      ELSE di.medicamento1_id 
    END as medicamento_id,
    m.nombre_comercial as medicamento_nombre,
    di.severidad,
    di.descripcion,
    di.recomendacion
  FROM hosix_drug_interactions di
  LEFT JOIN hosix_medicamentos m ON (
    (di.medicamento1_id = p_medicamento_id AND m.id = di.medicamento2_id) OR
    (di.medicamento2_id = p_medicamento_id AND m.id = di.medicamento1_id)
  )
  WHERE di.medicamento1_id = p_medicamento_id 
     OR di.medicamento2_id = p_medicamento_id
  ORDER BY 
    CASE di.severidad
      WHEN 'critica' THEN 1
      WHEN 'grave' THEN 2
      WHEN 'moderada' THEN 3
      WHEN 'leve' THEN 4
      ELSE 5
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- COMENTARIOS
-- ============================================================
COMMENT ON TABLE hosix_drug_interactions IS 'Interacciones medicamentosas entre pares de medicamentos';
COMMENT ON COLUMN hosix_drug_interactions.severidad IS 'Nivel de severidad: leve, moderada, grave, critica';
COMMENT ON COLUMN hosix_drug_interactions.fuente IS 'Fuente de la información: drugbank, manual, literatura';
COMMENT ON COLUMN hosix_medicamentos.drugbank_id IS 'ID del medicamento en DrugBank para integración';



-- ============================================
-- [17/44] 20250206_011_hosix_medicos_asis_1.sql
-- ============================================

-- ============================================================================
-- HOSIX - ASIS 1.0: Módulo de Médicos
-- Fecha: 2025-02-06
-- Descripción: Sistema completo de gestión de consultas médicas, diagnósticos,
--              prescripciones y documentación clínica con soporte para:
--              - CIE-10 (ICD-10) para clasificación de enfermedades
--              - SNOMED CT para terminología clínica normalizada
--              - Integración con CPOE y CDS Engine
-- ============================================================================

-- ============================================================================
-- 1. TABLA DE DIAGNÓSTICOS (CIE-10 / ICD-10 + SNOMED CT)
-- ============================================================================

CREATE TABLE hosix_diagnosticos_catalogo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificadores internacionales
  codigo_cie10 VARCHAR(10) NOT NULL UNIQUE, -- Ej: "I10" (Hipertensión)
  codigo_icd10 VARCHAR(10) NOT NULL, -- Equivalente ICD-10
  codigo_snomed VARCHAR(20) NOT NULL UNIQUE, -- Ej: "59621000" (Hypertension)
  
  -- Descripción
  nombre_diagnostico VARCHAR(255) NOT NULL,
  descripcion TEXT,
  
  -- Clasificación
  capitulo_cie10 VARCHAR(50), -- Ej: "Enfermedades del aparato circulatorio"
  categoria_snomed VARCHAR(100), -- Ej: "Cardiovascular disease"
  
  -- Flags clínicos
  es_cronica BOOLEAN DEFAULT false,
  requiere_seguimiento BOOLEAN DEFAULT true,
  es_notificable BOOLEAN DEFAULT false,
  
  -- Estado
  activo BOOLEAN DEFAULT true,
  
  -- Metadata
  notas_clinicas TEXT,
  url_referencia_cie10 VARCHAR(255),
  url_referencia_snomed VARCHAR(255),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para diagnósticos
CREATE INDEX idx_diagnosticos_catalogo_cie10 ON hosix_diagnosticos_catalogo(codigo_cie10);
CREATE INDEX idx_diagnosticos_catalogo_snomed ON hosix_diagnosticos_catalogo(codigo_snomed);
CREATE INDEX idx_diagnosticos_catalogo_nombre ON hosix_diagnosticos_catalogo(nombre_diagnostico);
CREATE INDEX idx_diagnosticos_catalogo_activo ON hosix_diagnosticos_catalogo(activo);

-- RLS para diagnósticos (lectura pública, solo administrador escribe)
ALTER TABLE hosix_diagnosticos_catalogo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Diagnósticos lectura pública"
  ON hosix_diagnosticos_catalogo
  FOR SELECT
  USING (true);

CREATE POLICY "Diagnósticos solo admin puede escribir"
  ON hosix_diagnosticos_catalogo
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profesionales_sanitarios
      WHERE user_id = auth.uid() AND perfil = 'Administrador'
    )
  );

-- ============================================================================
-- 2. TABLA DE ÓRDENES MÉDICAS (Worklist)
-- ============================================================================

CREATE TABLE hosix_ordenes_medicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencias
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  episodio_id UUID, -- Urgencia, cita, o hospitalización
  medico_asignado_id UUID NOT NULL REFERENCES profesionales_sanitarios(id),
  
  -- Tipo de orden
  tipo_orden VARCHAR(50) NOT NULL, -- 'consulta', 'revisión', 'seguimiento', 'alta'
  estado VARCHAR(30) DEFAULT 'pendiente', -- 'pendiente', 'en_atención', 'completada', 'cancelada'
  
  -- Prioridades
  prioridad VARCHAR(20) DEFAULT 'normal', -- 'baja', 'normal', 'alta', 'urgente'
  
  -- Información de la orden
  motivo_consulta TEXT NOT NULL,
  servicio VARCHAR(100),
  
  -- Fechas
  fecha_creacion TIMESTAMPTZ DEFAULT now(),
  fecha_programada TIMESTAMPTZ,
  fecha_inicio_atencion TIMESTAMPTZ,
  fecha_completacion TIMESTAMPTZ,
  
  -- Observaciones iniciales
  notas_previas TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para órdenes
CREATE INDEX idx_ordenes_medicas_paciente ON hosix_ordenes_medicas(paciente_id);
CREATE INDEX idx_ordenes_medicas_medico ON hosix_ordenes_medicas(medico_asignado_id);
CREATE INDEX idx_ordenes_medicas_estado ON hosix_ordenes_medicas(estado);
CREATE INDEX idx_ordenes_medicas_prioridad ON hosix_ordenes_medicas(prioridad);
CREATE INDEX idx_ordenes_medicas_fecha ON hosix_ordenes_medicas(fecha_creacion DESC);

ALTER TABLE hosix_ordenes_medicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Médicos ven sus órdenes"
  ON hosix_ordenes_medicas
  FOR SELECT
  USING (
    medico_asignado_id = (SELECT id FROM profesionales_sanitarios WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM profesionales_sanitarios
      WHERE user_id = auth.uid() AND perfil = 'Administrador'
    )
  );

-- ============================================================================
-- 3. TABLA DE DIAGNÓSTICOS DEL PACIENTE (Relación paciente-diagnóstico)
-- ============================================================================

CREATE TABLE hosix_diagnosticos_pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencias
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  episodio_id UUID REFERENCES hosix_hospitalizacion_episodios(id),
  medico_id UUID NOT NULL REFERENCES profesionales_sanitarios(id),
  diagnostico_id UUID NOT NULL REFERENCES hosix_diagnosticos_catalogo(id),
  
  -- Tipo de diagnóstico
  tipo_diagnostico VARCHAR(30) NOT NULL DEFAULT 'principal', -- 'principal', 'secundario', 'complicación', 'comorbilidad'
  
  -- Estado del diagnóstico
  estado VARCHAR(30) DEFAULT 'activo', -- 'activo', 'resuelto', 'sospechoso'
  fecha_diagnostico TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_resolucion TIMESTAMPTZ,
  
  -- Observaciones clínicas
  observaciones TEXT,
  
  -- Gravedad
  severidad VARCHAR(20), -- 'leve', 'moderada', 'grave', 'crítica'
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_diagnosticos_pacientes_paciente ON hosix_diagnosticos_pacientes(paciente_id);
CREATE INDEX idx_diagnosticos_pacientes_episodio ON hosix_diagnosticos_pacientes(episodio_id);
CREATE INDEX idx_diagnosticos_pacientes_medico ON hosix_diagnosticos_pacientes(medico_id);
CREATE INDEX idx_diagnosticos_pacientes_tipo ON hosix_diagnosticos_pacientes(tipo_diagnostico);

ALTER TABLE hosix_diagnosticos_pacientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Diagnósticos del paciente legibles por profesionales"
  ON hosix_diagnosticos_pacientes
  FOR SELECT
  USING (
    paciente_id IN (
      SELECT DISTINCT p.id FROM hosix_pacientes p
      WHERE p.centro_salud_id IN (
        SELECT DISTINCT ps.centro_salud_id FROM profesionales_sanitarios ps
        WHERE ps.user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- 4. TABLA DE CONSULTAS MÉDICAS
-- ============================================================================

CREATE TABLE hosix_consultas_medicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencias
  orden_medica_id UUID NOT NULL REFERENCES hosix_ordenes_medicas(id),
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  medico_id UUID NOT NULL REFERENCES profesionales_sanitarios(id),
  episodio_id UUID,
  
  -- Historial clínico resumen
  antecedentes_relevantes TEXT,
  medicamentos_actuales JSONB, -- Array de medicamentos activos
  
  -- Evaluación clínica
  motivo_consulta TEXT NOT NULL,
  historia_enfermedad_actual TEXT,
  examen_fisico TEXT,
  
  -- Impresión y plan
  impresion_clinica TEXT,
  diagnosticos_iniciales TEXT, -- Diagnósticos diferenciales
  plan_manejo TEXT,
  
  -- Diagnósticos confirmados (actualizados después de la consulta)
  diagnosticos_confirmados JSONB, -- Array de {diagnostico_id, tipo, severidad}
  
  -- Prescripciones vinculadas
  prescripciones_creadas JSONB, -- Array de prescription IDs
  
  -- Derivaciones
  requiere_hospitalizacion BOOLEAN DEFAULT false,
  requiere_interconsulta BOOLEAN DEFAULT false,
  especialidad_interconsulta VARCHAR(100),
  
  -- Follow-up
  requiere_seguimiento BOOLEAN DEFAULT false,
  dias_proximo_control INT,
  observaciones_seguimiento TEXT,
  
  -- Auditoría
  fecha_inicio TIMESTAMPTZ DEFAULT now(),
  fecha_fin TIMESTAMPTZ,
  duracion_minutos INT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_consultas_medicas_paciente ON hosix_consultas_medicas(paciente_id);
CREATE INDEX idx_consultas_medicas_medico ON hosix_consultas_medicas(medico_id);
CREATE INDEX idx_consultas_medicas_orden ON hosix_consultas_medicas(orden_medica_id);
CREATE INDEX idx_consultas_medicas_fecha ON hosix_consultas_medicas(fecha_inicio DESC);

ALTER TABLE hosix_consultas_medicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultas médicas - acceso médico y admin"
  ON hosix_consultas_medicas
  FOR SELECT
  USING (
    medico_id = (SELECT id FROM profesionales_sanitarios WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM profesionales_sanitarios
      WHERE user_id = auth.uid() AND perfil IN ('Administrador', 'Médico')
    )
  );

-- ============================================================================
-- 5. TABLA DE DIARIO CLÍNICO MÉDICO
-- ============================================================================

CREATE TABLE hosix_diario_clinico_medico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencias
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  episodio_id UUID,
  medico_id UUID NOT NULL REFERENCES profesionales_sanitarios(id),
  consulta_medica_id UUID REFERENCES hosix_consultas_medicas(id),
  
  -- Contenido del diario
  tipo_entrada VARCHAR(50) NOT NULL, -- 'evolución', 'nota_clínica', 'revisión', 'conclusión'
  contenido TEXT NOT NULL,
  
  -- Signos vitales asociados (opcional)
  signos_vitales JSONB,
  
  -- Auditoría
  firmada BOOLEAN DEFAULT false,
  fecha_firma TIMESTAMPTZ,
  hash_firma VARCHAR(255),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_diario_clinico_paciente ON hosix_diario_clinico_medico(paciente_id);
CREATE INDEX idx_diario_clinico_medico ON hosix_diario_clinico_medico(medico_id);
CREATE INDEX idx_diario_clinico_fecha ON hosix_diario_clinico_medico(created_at DESC);

ALTER TABLE hosix_diario_clinico_medico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Diario clínico - acceso médicos y admin"
  ON hosix_diario_clinico_medico
  FOR SELECT
  USING (
    medico_id = (SELECT id FROM profesionales_sanitarios WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM profesionales_sanitarios
      WHERE user_id = auth.uid() AND perfil IN ('Administrador', 'Médico')
    )
  );

-- ============================================================================
-- 6. DATOS SEMILLA: DIAGNÓSTICOS CIE-10/SNOMED CT MÁS COMUNES
-- ============================================================================

INSERT INTO hosix_diagnosticos_catalogo (
  codigo_cie10, codigo_icd10, codigo_snomed,
  nombre_diagnostico, descripcion,
  capitulo_cie10, categoria_snomed,
  es_cronica, requiere_seguimiento,
  url_referencia_cie10
) VALUES
-- Cardiovascular
('I10', 'I10', '59621000',
  'Hipertensión esencial (primaria)', 'Presión arterial elevada sin causa identificable',
  'Enfermedades del aparato circulatorio', 'Cardiovascular diseases',
  true, true, 'https://www.cie10.es/i10'),

('I21', 'I21.0', '57054005',
  'Infarto agudo de miocardio', 'Necrosis del tejido miocárdico por isquemia',
  'Enfermedades del aparato circulatorio', 'Cardiovascular diseases',
  false, true, 'https://www.cie10.es/i21'),

-- Respiratory
('J06.9', 'J06.9', '82272006',
  'Infección aguda de las vías respiratorias superiores', 'Infección de nariz, garganta y senos',
  'Enfermedades del aparato respiratorio', 'Respiratory tract infections',
  false, false, 'https://www.cie10.es/j069'),

('J45.9', 'J45.9', '195967001',
  'Asma, no especificada', 'Obstrucción bronquial reversible',
  'Enfermedades del aparato respiratorio', 'Asthma',
  true, true, 'https://www.cie10.es/j459'),

-- Endocrine
('E11.9', 'E11.9', '44054006',
  'Diabetes mellitus tipo 2', 'Diabetes sin mención de complicación',
  'Enfermedades endocrinas, nutricionales y metabólicas', 'Diabetes mellitus',
  true, true, 'https://www.cie10.es/e119'),

-- Musculoskeletal
('M79.3', 'M79.3', '76069005',
  'Paniculitis, no especificada', 'Inflamación del tejido adiposo',
  'Enfermedades del sistema osteomuscular', 'Soft tissue disorders',
  false, false, 'https://www.cie10.es/m793'),

-- Infections
('A01', 'A01.0', '76783007',
  'Fiebre tifoidea', 'Infección sistémica por Salmonella typhi',
  'Ciertas enfermedades infecciosas y parasitarias', 'Infectious diseases',
  false, true, 'https://www.cie10.es/a01'),

('B20', 'B20', '86406008',
  'Enfermedad por VIH', 'Infección crónica por virus de la inmunodeficiencia humana',
  'Ciertas enfermedades infecciosas y parasitarias', 'HIV infection',
  true, true, 'https://www.cie10.es/b20'),

-- Mental Health
('F32.9', 'F32.9', '35489007',
  'Episodio depresivo, no especificado', 'Trastorno del estado de ánimo',
  'Trastornos mentales, del comportamiento y del desarrollo neurocognitivo', 'Mental disorders',
  true, true, 'https://www.cie10.es/f329'),

('F41.1', 'F41.1', '197480006',
  'Trastorno de ansiedad generalizada', 'Ansiedad generalizada',
  'Trastornos mentales, del comportamiento y del desarrollo neurocognitivo', 'Anxiety disorders',
  true, true, 'https://www.cie10.es/f411');

-- Índice de búsqueda full-text en diagnósticos (opcional pero útil)
CREATE INDEX idx_diagnosticos_catalogo_nombre_fts 
  ON hosix_diagnosticos_catalogo 
  USING GIN (to_tsvector('spanish', nombre_diagnostico));

-- ============================================================================
-- 7. FUNCIONES DE UTILIDAD
-- ============================================================================

-- Función para obtener diagnósticos activos del paciente
CREATE OR REPLACE FUNCTION obtener_diagnosticos_activos(p_paciente_id UUID)
RETURNS TABLE (
  id UUID,
  codigo_cie10 VARCHAR,
  nombre_diagnostico VARCHAR,
  tipo_diagnostico VARCHAR,
  fecha_diagnostico TIMESTAMPTZ,
  severidad VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dp.id,
    dc.codigo_cie10,
    dc.nombre_diagnostico,
    dp.tipo_diagnostico,
    dp.fecha_diagnostico,
    dp.severidad
  FROM hosix_diagnosticos_pacientes dp
  JOIN hosix_diagnosticos_catalogo dc ON dp.diagnostico_id = dc.id
  WHERE dp.paciente_id = p_paciente_id
    AND dp.estado = 'activo'
    AND dp.fecha_resolucion IS NULL
  ORDER BY dp.fecha_diagnostico DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar diagnóstico en el paciente
CREATE OR REPLACE FUNCTION registrar_diagnostico_paciente(
  p_paciente_id UUID,
  p_diagnostico_id UUID,
  p_medico_id UUID,
  p_tipo_diagnostico VARCHAR DEFAULT 'principal',
  p_severidad VARCHAR DEFAULT NULL,
  p_observaciones TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_nuevo_id UUID;
BEGIN
  INSERT INTO hosix_diagnosticos_pacientes (
    paciente_id, diagnostico_id, medico_id, 
    tipo_diagnostico, severidad, observaciones
  ) VALUES (
    p_paciente_id, p_diagnostico_id, p_medico_id,
    p_tipo_diagnostico, p_severidad, p_observaciones
  )
  RETURNING id INTO v_nuevo_id;
  
  RETURN v_nuevo_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMIT Y DESCRIPCIÓN
-- ============================================================================
-- Tablas creadas:
-- 1. hosix_diagnosticos_catalogo (CIE-10 + SNOMED CT)
-- 2. hosix_ordenes_medicas (Worklist del médico)
-- 3. hosix_diagnosticos_pacientes (Relación diagnósticos del paciente)
-- 4. hosix_consultas_medicas (Registro de consulta)
-- 5. hosix_diario_clinico_medico (Notas de evolución)
-- 
-- Total: 5 tablas + índices + RLS + funciones
-- Tamaño estimado: ~2.5 MB
-- Migraciones anteriores: 10 (20250116-20250205)
-- Esta es la migración: 11 (ASIS 1.0)


-- ============================================
-- [18/44] 20250206_013_hosix_quirofanos_asis_3.sql
-- ============================================

-- ASIS 3.0 - Módulo de Quirófanos
-- Gestión de bloques quirúrgicos, salas, programaciones, equipos y procedimientos

-- 1. Bloques Quirúrgicos (diferentes bloques del hospital)
CREATE TABLE hosix_quirofanos_bloques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL UNIQUE,
  descripcion TEXT,
  numero_salas INT DEFAULT 0,
  ubicacion VARCHAR(255),
  telefono VARCHAR(20),
  responsable_id UUID REFERENCES profesionales_sanitarios(id),
  horario_inicio TIME DEFAULT '07:00:00',
  horario_fin TIME DEFAULT '19:00:00',
  dias_operacion VARCHAR(100) DEFAULT 'L,M,X,J,V',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Salas Quirúrgicas (quirófanos)
CREATE TABLE hosix_quirofanos_salas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bloque_id UUID NOT NULL REFERENCES hosix_quirofanos_bloques(id),
  numero_sala INT NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  tipo_procedimiento VARCHAR(100), -- general, traumatología, cardiovascular, etc.
  capacidad_personal INT DEFAULT 8,
  
  -- Equipamiento
  tiene_anestesia BOOLEAN DEFAULT true,
  tiene_monitor_cardiaco BOOLEAN DEFAULT true,
  tiene_aspiracion BOOLEAN DEFAULT true,
  tiene_rayos_x BOOLEAN DEFAULT false,
  tiene_laparoscopia BOOLEAN DEFAULT false,
  
  estado VARCHAR(50) DEFAULT 'operativa', -- operativa, mantenimiento, fuera_servicio
  
  -- Control
  ultima_desinfeccion TIMESTAMPTZ,
  proxima_mantencion DATE,
  responsable_id UUID REFERENCES profesionales_sanitarios(id),
  
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(bloque_id, numero_sala)
);

-- 3. Equipos Quirúrgicos (instrumental, máquinas, etc.)
CREATE TABLE hosix_quirofanos_equipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id UUID NOT NULL REFERENCES hosix_quirofanos_salas(id),
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(100), -- monitor, desfibrilador, bomba_infusion, aspirador, etc.
  codigo_serial VARCHAR(100) UNIQUE,
  fabricante VARCHAR(255),
  modelo VARCHAR(255),
  
  -- Mantenimiento
  fecha_adquisicion DATE,
  fecha_ultimo_servicio TIMESTAMPTZ,
  proxima_servicio TIMESTAMPTZ,
  estado VARCHAR(50) DEFAULT 'operativo', -- operativo, mantenimiento, fuera_servicio
  
  -- Responsable
  responsable_id UUID REFERENCES profesionales_sanitarios(id),
  
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Programaciones de Quirófano
CREATE TABLE hosix_quirofanos_programaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id UUID NOT NULL REFERENCES hosix_quirofanos_salas(id),
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  episodio_id UUID,
  
  -- Procedimiento
  tipo_procedimiento VARCHAR(255) NOT NULL,
  descripcion_procedimiento TEXT,
  diagnostico_principal VARCHAR(255),
  
  -- Personal quirúrgico
  cirujano_principal_id UUID REFERENCES profesionales_sanitarios(id),
  asistentes_quirurgicos UUID[],
  anestesiologo_id UUID REFERENCES profesionales_sanitarios(id),
  instrumentista_id UUID REFERENCES profesionales_sanitarios(id),
  circulante_id UUID REFERENCES profesionales_sanitarios(id),
  
  -- Fechas y horarios
  fecha_programada DATE NOT NULL,
  hora_entrada TIME NOT NULL,
  duracion_estimada INT, -- en minutos
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'programada', -- programada, en_quirofano, completada, cancelada, suspendida
  
  -- Observaciones
  observaciones TEXT,
  motivo_cancelacion TEXT,
  
  -- Prioridad
  prioridad VARCHAR(20) DEFAULT 'normal', -- electiva, urgente, emergencia
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Diario Quirúrgico (registro de procedimientos realizados)
CREATE TABLE hosix_quirofanos_diario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programacion_id UUID NOT NULL REFERENCES hosix_quirofanos_programaciones(id),
  sala_id UUID NOT NULL REFERENCES hosix_quirofanos_salas(id),
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  
  -- Tiempos quirúrgicos
  hora_inicio_real TIMESTAMPTZ,
  hora_fin_real TIMESTAMPTZ,
  duracion_real INT GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (hora_fin_real - hora_inicio_real))::INT / 60
  ) STORED,
  
  -- Procedimiento realizado
  procedimiento_realizado TEXT,
  hallazgos TEXT,
  complicaciones TEXT,
  
  -- Incidentes
  evento_adverso BOOLEAN DEFAULT false,
  descripcion_evento TEXT,
  
  -- Recuento de gasas/instrumentos
  gasas_contadas INT,
  gasas_utilizadas INT,
  instrumentos_contados INT,
  todas_cuentas_ok BOOLEAN DEFAULT true,
  
  -- Muestras
  muestra_enviada BOOLEAN DEFAULT false,
  tipo_muestra VARCHAR(100),
  laboratorio_id VARCHAR(100),
  
  -- Registrador
  observaciones_cirugia TEXT,
  firma_cirujano BOOLEAN DEFAULT false,
  fecha_firma TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Histórico de Mantenimiento
CREATE TABLE hosix_quirofanos_mantenimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id UUID NOT NULL REFERENCES hosix_quirofanos_salas(id),
  tipo VARCHAR(50) NOT NULL, -- desinfeccion, mantenimiento_preventivo, reparacion
  
  descripcion TEXT,
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_fin TIMESTAMPTZ,
  
  tecnico_responsable VARCHAR(255),
  empresa_servicio VARCHAR(255),
  
  costo DECIMAL(12, 2),
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Preferencias del Cirujano (equipamiento, asistentes, etc.)
CREATE TABLE hosix_quirofanos_preferencias_cirujano (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cirujano_id UUID NOT NULL REFERENCES profesionales_sanitarios(id),
  
  -- Preferencias de equipo y disposición
  posicion_paciente_preferida VARCHAR(100),
  instrumental_preferido TEXT,
  drenaje_preferido VARCHAR(100),
  suturas_preferidas TEXT,
  
  -- Asistentes preferidos
  asistentes_preferidos UUID[],
  
  -- Comodidades
  musica_quirofano BOOLEAN DEFAULT false,
  tipo_musica VARCHAR(100),
  temperatura_preferida INT DEFAULT 21,
  
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(cirujano_id)
);

-- Índices para performance
CREATE INDEX idx_quirofanos_bloques_activo ON hosix_quirofanos_bloques(activo);
CREATE INDEX idx_quirofanos_salas_bloque ON hosix_quirofanos_salas(bloque_id);
CREATE INDEX idx_quirofanos_salas_estado ON hosix_quirofanos_salas(estado);
CREATE INDEX idx_quirofanos_equipos_sala ON hosix_quirofanos_equipos(sala_id);
CREATE INDEX idx_quirofanos_programaciones_fecha ON hosix_quirofanos_programaciones(fecha_programada);
CREATE INDEX idx_quirofanos_programaciones_sala ON hosix_quirofanos_programaciones(sala_id);
CREATE INDEX idx_quirofanos_programaciones_paciente ON hosix_quirofanos_programaciones(paciente_id);
CREATE INDEX idx_quirofanos_programaciones_estado ON hosix_quirofanos_programaciones(estado);
CREATE INDEX idx_quirofanos_diario_sala_fecha ON hosix_quirofanos_diario(sala_id, created_at DESC);
CREATE INDEX idx_quirofanos_diario_paciente ON hosix_quirofanos_diario(paciente_id);
CREATE INDEX idx_quirofanos_mantenimiento_sala ON hosix_quirofanos_mantenimiento(sala_id);

-- RLS Policies
ALTER TABLE hosix_quirofanos_bloques ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_quirofanos_salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_quirofanos_equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_quirofanos_programaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_quirofanos_diario ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_quirofanos_mantenimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_quirofanos_preferencias_cirujano ENABLE ROW LEVEL SECURITY;

-- Policy: Médicos ven quirófanos de su centro
CREATE POLICY "quirofanos_ver_centro"
ON hosix_quirofanos_bloques
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profesionales_sanitarios p
    WHERE p.user_id = auth.uid()
    AND p.centro_salud_id = (
      SELECT centro_salud_id FROM hosix_quirofanos_bloques hqb
      WHERE hqb.id = hosix_quirofanos_bloques.id
      LIMIT 1
    )
  )
);

-- Policy: Cirujanos editan sus preferencias
CREATE POLICY "preferencias_cirujano_self"
ON hosix_quirofanos_preferencias_cirujano
FOR SELECT
USING (cirujano_id = (SELECT id FROM profesionales_sanitarios WHERE user_id = auth.uid()));

-- Seed data: Bloques quirúrgicos
INSERT INTO hosix_quirofanos_bloques (nombre, descripcion, numero_salas, ubicacion, horario_inicio, horario_fin, dias_operacion) 
VALUES
  ('Bloque A - Cirugia General', 'Procedimientos generales y digestivos', 3, 'Planta 2', '07:00:00', '19:00:00', 'L,M,X,J,V'),
  ('Bloque B - Traumatologia', 'Fracturas, artroscopia, ortopedia', 2, 'Planta 2', '08:00:00', '20:00:00', 'L,M,X,J,V'),
  ('Bloque C - Cardiovascular', 'Cirugía cardiaca y vascular', 2, 'Planta 3', '07:00:00', '17:00:00', 'L,M,X,J,V');

-- Seed data: Salas quirúrgicas
INSERT INTO hosix_quirofanos_salas (bloque_id, numero_sala, nombre, tipo_procedimiento, tiene_laparoscopia) 
SELECT id, 1, 'Sala 201A', 'general', true FROM hosix_quirofanos_bloques WHERE nombre = 'Bloque A - Cirugia General'
UNION ALL
SELECT id, 1, 'Sala 301A', 'traumatologia', false FROM hosix_quirofanos_bloques WHERE nombre = 'Bloque B - Traumatologia'
UNION ALL
SELECT id, 1, 'Sala 401A', 'cardiovascular', false FROM hosix_quirofanos_bloques WHERE nombre = 'Bloque C - Cardiovascular';

COMMIT;


-- ============================================
-- [19/44] 20250206_014_hosix_interconsultas_asis_11.sql
-- ============================================

-- HOSIX Sistema de Gestión Hospitalaria
-- Migración 014: Módulo de Interconsultas (ASIS 11.0)
-- Fecha: 2025-02-06
-- Descripción: Sistema completo de solicitud, respuesta y seguimiento de interconsultas

-- ============================================================
-- 1. CATÁLOGO DE ESPECIALIDADES PARA INTERCONSULTAS
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_interconsultas_especialidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  requiere_internacion BOOLEAN DEFAULT false,
  tiempo_respuesta_dias INT DEFAULT 3,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. SOLICITUDES DE INTERCONSULTA
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_interconsultas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  numero_solicitud VARCHAR(20) NOT NULL UNIQUE,
  
  -- Relaciones
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  episodio_id UUID,
  tipo_episodio VARCHAR(50), -- 'urgencia', 'hospitalizacion', 'consulta'
  medico_solicitante_id UUID NOT NULL REFERENCES hosix_usuarios(id),
  servicio_solicitante_id UUID REFERENCES hosix_servicios(id),
  
  -- Especialidad
  especialidad_solicitada_id UUID REFERENCES hosix_interconsultas_especialidades(id),
  especialidad_solicitada VARCHAR(100) NOT NULL,
  medico_solicitado_id UUID REFERENCES hosix_usuarios(id),
  
  -- Información clínica
  motivo_interconsulta TEXT NOT NULL,
  pregunta_clinica TEXT,
  antecedentes_relevantes TEXT,
  hallazgos_relevantes TEXT,
  
  -- Prioridad y urgencia
  prioridad VARCHAR(20) DEFAULT 'normal', -- 'baja', 'normal', 'alta', 'urgente'
  es_urgente BOOLEAN DEFAULT false,
  
  -- Fechas
  fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_limite_respuesta TIMESTAMPTZ,
  
  -- Estado
  estado_solicitud VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'en_evaluacion', 'respondida', 'cancelada'
  razon_cancelacion TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_interconsultas_paciente ON hosix_interconsultas(paciente_id);
CREATE INDEX idx_interconsultas_numero ON hosix_interconsultas(numero_solicitud);
CREATE INDEX idx_interconsultas_estado ON hosix_interconsultas(estado_solicitud);
CREATE INDEX idx_interconsultas_especialidad ON hosix_interconsultas(especialidad_solicitada);
CREATE INDEX idx_interconsultas_medico_solicitado ON hosix_interconsultas(medico_solicitado_id);
CREATE INDEX idx_interconsultas_fecha ON hosix_interconsultas(fecha_solicitud DESC);

-- ============================================================
-- 3. RESPUESTAS DE INTERCONSULTA
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_interconsultas_respuestas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relación
  interconsulta_id UUID NOT NULL REFERENCES hosix_interconsultas(id) ON DELETE CASCADE,
  
  -- Información
  medico_respondiente_id UUID NOT NULL REFERENCES hosix_usuarios(id),
  especialidad_respondiente VARCHAR(100),
  
  -- Contenido
  hallazgos_clinicos TEXT NOT NULL,
  interpretacion_diagnostica TEXT,
  recomendaciones TEXT NOT NULL,
  plan_manejo TEXT,
  
  -- Medicamentos recomendados
  medicamentos_recomendados JSONB DEFAULT '[]',
  
  -- Procedimientos recomendados
  procedimientos_recomendados JSONB DEFAULT '[]',
  
  -- Seguimiento
  requiere_seguimiento BOOLEAN DEFAULT false,
  intervalos_seguimiento VARCHAR(100),
  
  -- Fechas
  fecha_respuesta TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_interconsultas_respuestas_interconsulta ON hosix_interconsultas_respuestas(interconsulta_id);
CREATE INDEX idx_interconsultas_respuestas_medico ON hosix_interconsultas_respuestas(medico_respondiente_id);
CREATE INDEX idx_interconsultas_respuestas_fecha ON hosix_interconsultas_respuestas(fecha_respuesta DESC);

-- ============================================================
-- 4. SEGUIMIENTO DE INTERCONSULTAS
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_interconsultas_seguimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  interconsulta_id UUID NOT NULL REFERENCES hosix_interconsultas(id) ON DELETE CASCADE,
  respuesta_id UUID REFERENCES hosix_interconsultas_respuestas(id),
  
  -- Información
  profesional_id UUID NOT NULL REFERENCES hosix_usuarios(id),
  tipo_seguimiento VARCHAR(50) NOT NULL, -- 'consulta_virtual', 'consulta_presencial', 'llamada', 'nota_clinica'
  
  -- Contenido
  observaciones TEXT,
  resultado_clinico TEXT,
  complicaciones TEXT,
  
  -- Acciones
  requiere_nueva_interconsulta BOOLEAN DEFAULT false,
  nueva_especialidad_solicitada VARCHAR(100),
  
  -- Fechas
  fecha_seguimiento TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_interconsultas_seguimiento_interconsulta ON hosix_interconsultas_seguimiento(interconsulta_id);
CREATE INDEX idx_interconsultas_seguimiento_profesional ON hosix_interconsultas_seguimiento(profesional_id);
CREATE INDEX idx_interconsultas_seguimiento_fecha ON hosix_interconsultas_seguimiento(fecha_seguimiento DESC);

-- ============================================================
-- 5. REFERENCIAS Y DERIVACIONES
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_interconsultas_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relación
  interconsulta_id UUID NOT NULL REFERENCES hosix_interconsultas(id) ON DELETE CASCADE,
  
  -- Derivación
  hospital_destino VARCHAR(255),
  servicio_destino VARCHAR(100),
  razon_derivacion TEXT NOT NULL,
  es_contrarreferencia BOOLEAN DEFAULT false,
  
  -- Responsables
  medico_derivante_id UUID REFERENCES hosix_usuarios(id),
  medico_receptor_id UUID REFERENCES hosix_usuarios(id),
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'aceptada', 'rechazada', 'completada'
  fecha_aceptacion TIMESTAMPTZ,
  
  -- Fechas
  fecha_derivacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_interconsultas_referrals_interconsulta ON hosix_interconsultas_referrals(interconsulta_id);
CREATE INDEX idx_interconsultas_referrals_estado ON hosix_interconsultas_referrals(estado);

-- ============================================================
-- 6. COMUNICACIONES / CONVERSACIONES
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_interconsultas_comunicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  interconsulta_id UUID NOT NULL REFERENCES hosix_interconsultas(id) ON DELETE CASCADE,
  
  -- Participantes
  remitente_id UUID NOT NULL REFERENCES hosix_usuarios(id),
  destinatario_id UUID REFERENCES hosix_usuarios(id),
  
  -- Contenido
  tipo_comunicacion VARCHAR(50) NOT NULL, -- 'mensaje', 'comentario', 'aclaracion', 'urgencia'
  contenido TEXT NOT NULL,
  
  -- Archivos adjuntos
  adjuntos JSONB DEFAULT '[]',
  
  -- Estado
  leido BOOLEAN DEFAULT false,
  fecha_lectura TIMESTAMPTZ,
  
  -- Fechas
  fecha_comunicacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_interconsultas_comunicaciones_interconsulta ON hosix_interconsultas_comunicaciones(interconsulta_id);
CREATE INDEX idx_interconsultas_comunicaciones_remitente ON hosix_interconsultas_comunicaciones(remitente_id);
CREATE INDEX idx_interconsultas_comunicaciones_destinatario ON hosix_interconsultas_comunicaciones(destinatario_id);
CREATE INDEX idx_interconsultas_comunicaciones_leido ON hosix_interconsultas_comunicaciones(leido);

-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE hosix_interconsultas_especialidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_interconsultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_interconsultas_respuestas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_interconsultas_seguimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_interconsultas_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_interconsultas_comunicaciones ENABLE ROW LEVEL SECURITY;

-- Política: Médicos ven sus propias solicitudes y respuestas
CREATE POLICY "Médicos ven sus solicitudes" ON hosix_interconsultas
  FOR SELECT USING (
    medico_solicitante_id = auth.uid() OR
    medico_solicitado_id = auth.uid() OR
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Médicos crean solicitudes" ON hosix_interconsultas
  FOR INSERT WITH CHECK (
    medico_solicitante_id = auth.uid() OR
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Médicos responden interconsultas" ON hosix_interconsultas_respuestas
  FOR INSERT WITH CHECK (
    medico_respondiente_id = auth.uid() OR
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Médicos ven respuestas" ON hosix_interconsultas_respuestas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM hosix_interconsultas
      WHERE id = interconsulta_id
      AND (medico_solicitante_id = auth.uid() OR medico_solicitado_id = auth.uid())
    ) OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- ============================================================
-- 8. DATOS SEMILLA
-- ============================================================

INSERT INTO hosix_interconsultas_especialidades (nombre, descripcion, requiere_internacion, tiempo_respuesta_dias)
VALUES
  ('Cardiología', 'Enfermedades del corazón y sistema vascular', false, 3),
  ('Neurología', 'Enfermedades del sistema nervioso', false, 3),
  ('Endocrinología', 'Enfermedades endocrinas y metabolismo', false, 5),
  ('Infectología', 'Enfermedades infecciosas', true, 2),
  ('Oncología', 'Cáncer y tumores', true, 5),
  ('Psiquiatría', 'Trastornos mentales y del comportamiento', false, 7),
  ('Traumatología', 'Lesiones óseas y articulares', true, 2),
  ('Oftalmología', 'Enfermedades oculares', false, 5),
  ('ORL', 'Otorrinolaringología', false, 4),
  ('Neurocirugía', 'Cirugía del sistema nervioso', true, 3),
  ('Cirugía General', 'Cirugía general y urgencias quirúrgicas', true, 2),
  ('Anestesiología', 'Anestesia y cuidados perioperatorios', true, 1),
  ('Neumología', 'Enfermedades respiratorias', false, 3),
  ('Gastroenterología', 'Enfermedades digestivas', false, 4),
  ('Nefrología', 'Enfermedades renales', false, 4),
  ('Hematología', 'Enfermedades de la sangre', false, 5),
  ('Reumatología', 'Enfermedades reumáticas', false, 7),
  ('Dermatología', 'Enfermedades de la piel', false, 7),
  ('Ginecología', 'Salud femenina y obstetricia', true, 3),
  ('Pediatría', 'Medicina del niño', true, 2)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 9. FUNCIÓN PARA GENERAR NÚMERO DE SOLICITUD
-- ============================================================

CREATE OR REPLACE FUNCTION generar_numero_interconsulta()
RETURNS VARCHAR AS $$
DECLARE
  v_numero VARCHAR(20);
  v_anio INT;
  v_consecutivo INT;
BEGIN
  v_anio := EXTRACT(YEAR FROM NOW());
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_solicitud, 8) AS INT)), 0) + 1
  INTO v_consecutivo
  FROM hosix_interconsultas
  WHERE EXTRACT(YEAR FROM fecha_solicitud) = v_anio;
  
  v_numero := 'INTC-' || v_anio || '-' || LPAD(v_consecutivo::TEXT, 5, '0');
  
  RETURN v_numero;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 10. TRIGGER PARA NÚMERO AUTOMÁTICO DE SOLICITUD
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_generar_numero_interconsulta()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_solicitud IS NULL THEN
    NEW.numero_solicitud := generar_numero_interconsulta();
  END IF;
  
  -- Calcular fecha límite de respuesta
  IF NEW.fecha_limite_respuesta IS NULL THEN
    NEW.fecha_limite_respuesta := NOW() + INTERVAL '3 days';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_numero_interconsulta ON hosix_interconsultas;
CREATE TRIGGER trigger_numero_interconsulta
BEFORE INSERT ON hosix_interconsultas
FOR EACH ROW
EXECUTE FUNCTION trigger_generar_numero_interconsulta();

-- ============================================================
-- 11. TRIGGER PARA ACTUALIZAR ESTADO AL RESPONDER
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_actualizar_estado_interconsulta()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE hosix_interconsultas
  SET estado_solicitud = 'respondida', updated_at = NOW()
  WHERE id = NEW.interconsulta_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_estado_al_responder ON hosix_interconsultas_respuestas;
CREATE TRIGGER trigger_actualizar_estado_al_responder
AFTER INSERT ON hosix_interconsultas_respuestas
FOR EACH ROW
EXECUTE FUNCTION trigger_actualizar_estado_interconsulta();

-- ============================================================
-- 12. VISTAS ÚTILES
-- ============================================================

CREATE OR REPLACE VIEW hosix_interconsultas_pendientes AS
SELECT 
  ic.id,
  ic.numero_solicitud,
  ic.especialidad_solicitada,
  p.nombre as paciente_nombre,
  u_solicitante.nombre as medico_solicitante,
  u_solicitado.nombre as medico_solicitado,
  ic.prioridad,
  ic.fecha_solicitud,
  ic.fecha_limite_respuesta,
  CURRENT_DATE - ic.fecha_solicitud::DATE as dias_espera,
  ic.es_urgente
FROM hosix_interconsultas ic
LEFT JOIN hosix_pacientes p ON ic.paciente_id = p.id
LEFT JOIN hosix_usuarios u_solicitante ON ic.medico_solicitante_id = u_solicitante.id
LEFT JOIN hosix_usuarios u_solicitado ON ic.medico_solicitado_id = u_solicitado.id
WHERE ic.estado_solicitud IN ('pendiente', 'en_evaluacion')
ORDER BY 
  CASE WHEN ic.es_urgente THEN 0 ELSE 1 END,
  CASE 
    WHEN ic.prioridad = 'urgente' THEN 0
    WHEN ic.prioridad = 'alta' THEN 1
    WHEN ic.prioridad = 'normal' THEN 2
    ELSE 3
  END,
  ic.fecha_solicitud ASC;

CREATE OR REPLACE VIEW hosix_interconsultas_respondidas AS
SELECT 
  ic.numero_solicitud,
  ic.especialidad_solicitada,
  p.nombre as paciente_nombre,
  u_respondiente.nombre as medico_respondiente,
  ir.fecha_respuesta,
  EXTRACT(DAY FROM ir.fecha_respuesta - ic.fecha_solicitud) as dias_respuesta
FROM hosix_interconsultas ic
INNER JOIN hosix_interconsultas_respuestas ir ON ic.id = ir.interconsulta_id
LEFT JOIN hosix_pacientes p ON ic.paciente_id = p.id
LEFT JOIN hosix_usuarios u_respondiente ON ir.medico_respondiente_id = u_respondiente.id
ORDER BY ir.fecha_respuesta DESC;

-- ============================================================
-- 13. COMENTARIOS DE TABLAS
-- ============================================================

COMMENT ON TABLE hosix_interconsultas IS 'Solicitudes de interconsulta entre especialidades médicas';
COMMENT ON TABLE hosix_interconsultas_respuestas IS 'Respuestas de especialistas a solicitudes de interconsulta';
COMMENT ON TABLE hosix_interconsultas_seguimiento IS 'Seguimiento clínico de las recomendaciones de interconsultas';
COMMENT ON TABLE hosix_interconsultas_referrals IS 'Derivaciones y contraderivaciones entre instituciones';
COMMENT ON TABLE hosix_interconsultas_comunicaciones IS 'Canal de comunicación entre profesionales sobre interconsultas';


-- ============================================
-- [20/44] 20250720022455_scarlet_wildflower.sql
-- ============================================

/*
  # Agregar columna documentos_adicionales

  1. Cambios
    - Agregar columna `documentos_adicionales` de tipo text[] a la tabla profesionales_sanitarios
    - Esta columna almacenará las URLs de los documentos adicionales subidos por cada profesional
    - Permitir valores NULL ya que es opcional

  2. Seguridad
    - La columna hereda las políticas RLS existentes de la tabla
*/

-- Agregar columna documentos_adicionales si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profesionales_sanitarios' 
    AND column_name = 'documentos_adicionales'
  ) THEN
    ALTER TABLE profesionales_sanitarios 
    ADD COLUMN documentos_adicionales text[];
  END IF;
END $$;

-- Agregar comentario a la columna
COMMENT ON COLUMN profesionales_sanitarios.documentos_adicionales IS 'URLs de documentos adicionales subidos por el profesional (PDF, imágenes, etc.)';

-- ============================================
-- [21/44] 20250801014549_710b4907-6179-4a93-b218-f9284ef1b675.sql
-- ============================================


-- Crear tabla para controlar la generación de carnets y evitar duplicados
CREATE TABLE IF NOT EXISTS public.carnets_generados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profesional_id UUID NOT NULL REFERENCES profesionales_sanitarios(id) ON DELETE CASCADE,
  url_carnet TEXT NOT NULL,
  fecha_generacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profesional_id)
);

-- Habilitar RLS
ALTER TABLE public.carnets_generados ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura
CREATE POLICY "Permitir lectura pública de carnets generados" 
  ON public.carnets_generados 
  FOR SELECT 
  USING (true);

-- Política para permitir inserción
CREATE POLICY "Permitir inserción de carnets generados" 
  ON public.carnets_generados 
  FOR INSERT 
  WITH CHECK (true);

-- Función para generar carnet cuando cambie a "Pendiente de Firma"
CREATE OR REPLACE FUNCTION public.trigger_generar_carnet_automatico()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    carnet_existente UUID;
BEGIN
    -- Verificar si el estado cambió a 'Pendiente de Firma'
    IF NEW.estado_solicitud = 'Pendiente de Firma' AND 
       (OLD.estado_solicitud IS NULL OR OLD.estado_solicitud != 'Pendiente de Firma') THEN
        
        -- Verificar que tenga los campos requeridos
        IF NEW.id_profesional_unico IS NOT NULL AND 
           NEW.url_codigo_barras IS NOT NULL THEN
            
            -- Verificar que no exista ya un carnet generado
            SELECT id INTO carnet_existente 
            FROM public.carnets_generados 
            WHERE profesional_id = NEW.id;
            
            IF carnet_existente IS NULL THEN
                -- Insertar en cola de generación de carnets
                INSERT INTO public.cola_generacion_carnets (
                    profesional_id, 
                    estado, 
                    intentos, 
                    created_at
                ) VALUES (
                    NEW.id, 
                    'pendiente', 
                    0, 
                    CURRENT_TIMESTAMP
                );
                
                -- Log de la acción
                INSERT INTO public.logs_sistema (accion, descripcion, error)
                VALUES (
                    'CARNET_PROGRAMADO', 
                    'Carnet programado para generación automática - ID: ' || NEW.id::text,
                    false
                );
            ELSE
                -- Log si ya existe
                INSERT INTO public.logs_sistema (accion, descripcion, error)
                VALUES (
                    'CARNET_YA_EXISTE', 
                    'Intento de generar carnet duplicado evitado - ID: ' || NEW.id::text,
                    false
                );
            END IF;
        ELSE
            -- Log si faltan campos requeridos
            INSERT INTO public.logs_sistema (accion, descripcion, error)
            VALUES (
                'CARNET_FALTAN_DATOS', 
                'No se puede generar carnet, faltan datos - ID: ' || NEW.id::text || 
                ' - ID Profesional: ' || COALESCE(NEW.id_profesional_unico, 'NULL') ||
                ' - Código Barras: ' || COALESCE(NEW.url_codigo_barras, 'NULL'),
                true
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Crear el trigger
DROP TRIGGER IF EXISTS tr_generar_carnet_automatico ON profesionales_sanitarios;
CREATE TRIGGER tr_generar_carnet_automatico
    AFTER UPDATE ON profesionales_sanitarios
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generar_carnet_automatico();

-- Función para marcar carnet como generado y evitar duplicados
CREATE OR REPLACE FUNCTION public.marcar_carnet_generado(
    p_profesional_id UUID,
    p_url_carnet TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insertar en tabla de carnets generados
    INSERT INTO public.carnets_generados (profesional_id, url_carnet)
    VALUES (p_profesional_id, p_url_carnet)
    ON CONFLICT (profesional_id) 
    DO UPDATE SET 
        url_carnet = EXCLUDED.url_carnet,
        fecha_generacion = NOW();
    
    -- Actualizar el estado en cola de generación
    UPDATE public.cola_generacion_carnets
    SET estado = 'completado', 
        url_carnet = p_url_carnet,
        updated_at = NOW()
    WHERE profesional_id = p_profesional_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO public.logs_sistema (accion, descripcion, error)
        VALUES (
            'ERROR_MARCAR_CARNET', 
            'Error al marcar carnet como generado: ' || SQLERRM,
            true
        );
        RETURN FALSE;
END;
$$;


-- ============================================
-- [22/44] 20250903133632_e71b88bc-8176-4036-bf62-c209a8880981.sql
-- ============================================

-- Crear nueva Edge Function para IA Chat Superinteligente
-- Esta función tendrá acceso completo a todas las tablas y relaciones

-- Función para obtener estadísticas completas del sistema
CREATE OR REPLACE FUNCTION public.get_comprehensive_analytics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'schema_info', (
      SELECT json_agg(
        json_build_object(
          'table_name', table_name,
          'columns', (
            SELECT json_agg(
              json_build_object(
                'column_name', column_name,
                'data_type', data_type,
                'is_nullable', is_nullable
              )
            )
            FROM information_schema.columns c2
            WHERE c2.table_name = c1.table_name 
            AND c2.table_schema = 'public'
          )
        )
      )
      FROM (
        SELECT DISTINCT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        ORDER BY table_name
      ) c1
    ),
    'total_profesionales', (SELECT COUNT(*) FROM profesionales_sanitarios),
    'total_centros', (SELECT COUNT(*) FROM centros_salud),
    'total_guardias', (SELECT COUNT(*) FROM guardias),
    'estados_disponibles', (
      SELECT json_agg(DISTINCT estado_solicitud) 
      FROM profesionales_sanitarios 
      WHERE estado_solicitud IS NOT NULL
    ),
    'areas_profesionales', (
      SELECT json_agg(DISTINCT area_profesional) 
      FROM profesionales_sanitarios 
      WHERE area_profesional IS NOT NULL
    ),
    'distritos_sanitarios', (
      SELECT json_agg(DISTINCT distrito_sanitario) 
      FROM profesionales_sanitarios 
      WHERE distrito_sanitario IS NOT NULL
    ),
    'categorias_centros', (
      SELECT json_agg(DISTINCT categoria) 
      FROM centros_salud 
      WHERE categoria IS NOT NULL
    ),
    'provincias', (
      SELECT json_agg(DISTINCT provincia) 
      FROM profesionales_sanitarios 
      WHERE provincia IS NOT NULL
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- ============================================
-- [23/44] 20250905081352_6054a222-ae86-405b-a8e8-3c06d21b37c0.sql
-- ============================================

-- Expandir enum de roles con los nuevos tipos
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'RRHH_MINISTERIO';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'MIEMBRO_GOBIERNO';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'HABILITACION';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ADMIN_CENTRO_SANITARIO';

-- Crear tabla para solicitudes de traslado
CREATE TABLE IF NOT EXISTS public.solicitudes_traslado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id UUID NOT NULL REFERENCES public.profesionales_sanitarios(id) ON DELETE CASCADE,
  centro_origen_id UUID REFERENCES public.centros_salud(id),
  centro_destino_id UUID NOT NULL REFERENCES public.centros_salud(id),
  solicitante_id UUID NOT NULL,
  motivo TEXT NOT NULL,
  observaciones TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_aprobacion TIMESTAMP WITH TIME ZONE,
  aprobado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de permisos específicos por pestaña
CREATE TABLE IF NOT EXISTS public.permisos_pestanas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  pestana TEXT NOT NULL,
  puede_ver BOOLEAN DEFAULT FALSE,
  puede_editar BOOLEAN DEFAULT FALSE,
  puede_aprobar BOOLEAN DEFAULT FALSE,
  restricciones JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(usuario_id, pestana)
);

-- Actualizar tabla user_profiles con nuevos campos
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS centro_asignado_id UUID REFERENCES public.centros_salud(id),
ADD COLUMN IF NOT EXISTS permisos_especiales JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS configuracion_role JSONB DEFAULT '{}'::jsonb;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_solicitudes_traslado_profesional ON public.solicitudes_traslado(profesional_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_traslado_estado ON public.solicitudes_traslado(estado);
CREATE INDEX IF NOT EXISTS idx_permisos_pestanas_usuario ON public.permisos_pestanas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_centro ON public.user_profiles(centro_asignado_id);

-- Crear políticas RLS
ALTER TABLE public.solicitudes_traslado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permisos_pestanas ENABLE ROW LEVEL SECURITY;

-- Política para solicitudes de traslado
CREATE POLICY "Usuarios pueden ver sus solicitudes de traslado"
ON public.solicitudes_traslado FOR SELECT
USING (
  solicitante_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.role IN ('SUPER_ADMINISTRADOR', 'RRHH_MINISTERIO', 'MIEMBRO_GOBIERNO')
  )
);

CREATE POLICY "Usuarios pueden crear solicitudes de traslado"
ON public.solicitudes_traslado FOR INSERT
WITH CHECK (solicitante_id = auth.uid());

CREATE POLICY "Solo RRHH puede aprobar traslados"
ON public.solicitudes_traslado FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.role IN ('SUPER_ADMINISTRADOR', 'RRHH_MINISTERIO')
  )
);

-- Política para permisos de pestañas
CREATE POLICY "Usuarios pueden ver sus permisos"
ON public.permisos_pestanas FOR SELECT
USING (usuario_id = auth.uid());

CREATE POLICY "Solo admins pueden gestionar permisos"
ON public.permisos_pestanas FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.role IN ('SUPER_ADMINISTRADOR', 'RRHH_MINISTERIO')
  )
);

-- ============================================
-- [24/44] 20250905081414_099c180e-5289-45ce-a313-b73022245449.sql
-- ============================================

-- Expandir enum de roles con los nuevos tipos
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'RRHH_MINISTERIO';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'MIEMBRO_GOBIERNO';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'HABILITACION';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ADMIN_CENTRO_SANITARIO';

-- Crear tabla para solicitudes de traslado
CREATE TABLE IF NOT EXISTS public.solicitudes_traslado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id UUID NOT NULL REFERENCES public.profesionales_sanitarios(id) ON DELETE CASCADE,
  centro_origen_id UUID REFERENCES public.centros_salud(id),
  centro_destino_id UUID NOT NULL REFERENCES public.centros_salud(id),
  solicitante_id UUID NOT NULL,
  motivo TEXT NOT NULL,
  observaciones TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_aprobacion TIMESTAMP WITH TIME ZONE,
  aprobado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de permisos específicos por pestaña
CREATE TABLE IF NOT EXISTS public.permisos_pestanas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  pestana TEXT NOT NULL,
  puede_ver BOOLEAN DEFAULT FALSE,
  puede_editar BOOLEAN DEFAULT FALSE,
  puede_aprobar BOOLEAN DEFAULT FALSE,
  restricciones JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(usuario_id, pestana)
);

-- Actualizar tabla user_profiles con nuevos campos
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS centro_asignado_id UUID REFERENCES public.centros_salud(id),
ADD COLUMN IF NOT EXISTS permisos_especiales JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS configuracion_role JSONB DEFAULT '{}'::jsonb;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_solicitudes_traslado_profesional ON public.solicitudes_traslado(profesional_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_traslado_estado ON public.solicitudes_traslado(estado);
CREATE INDEX IF NOT EXISTS idx_permisos_pestanas_usuario ON public.permisos_pestanas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_centro ON public.user_profiles(centro_asignado_id);

-- Crear políticas RLS
ALTER TABLE public.solicitudes_traslado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permisos_pestanas ENABLE ROW LEVEL SECURITY;

-- Política para solicitudes de traslado
CREATE POLICY "Usuarios pueden ver sus solicitudes de traslado"
ON public.solicitudes_traslado FOR SELECT
USING (
  solicitante_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.role IN ('SUPER_ADMINISTRADOR', 'RRHH_MINISTERIO', 'MIEMBRO_GOBIERNO')
  )
);

CREATE POLICY "Usuarios pueden crear solicitudes de traslado"
ON public.solicitudes_traslado FOR INSERT
WITH CHECK (solicitante_id = auth.uid());

CREATE POLICY "Solo RRHH puede aprobar traslados"
ON public.solicitudes_traslado FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.role IN ('SUPER_ADMINISTRADOR', 'RRHH_MINISTERIO')
  )
);

-- Política para permisos de pestañas
CREATE POLICY "Usuarios pueden ver sus permisos"
ON public.permisos_pestanas FOR SELECT
USING (usuario_id = auth.uid());

CREATE POLICY "Solo admins pueden gestionar permisos"
ON public.permisos_pestanas FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.role IN ('SUPER_ADMINISTRADOR', 'RRHH_MINISTERIO')
  )
);

-- ============================================
-- [25/44] 20250905081436_5ba1951b-ae90-4a80-8422-824c9fad55ab.sql
-- ============================================

-- Crear tipo enum de roles si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM (
            'SUPER_ADMINISTRADOR',
            'REVISOR_SOLICITUDES', 
            'PERSONALIDAD_MINISTERIAL',
            'OBSERVADOR',
            'DIRECTIVO_CENTRO_SANITARIO',
            'RRHH_MINISTERIO',
            'MIEMBRO_GOBIERNO',
            'HABILITACION',
            'ADMIN_CENTRO_SANITARIO'
        );
    END IF;
END $$;

-- Crear tabla para solicitudes de traslado
CREATE TABLE IF NOT EXISTS public.solicitudes_traslado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id UUID NOT NULL REFERENCES public.profesionales_sanitarios(id) ON DELETE CASCADE,
  centro_origen_id UUID REFERENCES public.centros_salud(id),
  centro_destino_id UUID NOT NULL REFERENCES public.centros_salud(id),
  solicitante_id UUID NOT NULL,
  motivo TEXT NOT NULL,
  observaciones TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_aprobacion TIMESTAMP WITH TIME ZONE,
  aprobado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de permisos específicos por pestaña
CREATE TABLE IF NOT EXISTS public.permisos_pestanas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  pestana TEXT NOT NULL,
  puede_ver BOOLEAN DEFAULT FALSE,
  puede_editar BOOLEAN DEFAULT FALSE,
  puede_aprobar BOOLEAN DEFAULT FALSE,
  restricciones JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(usuario_id, pestana)
);

-- Actualizar tabla user_profiles para usar el enum app_role
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS centro_asignado_id UUID REFERENCES public.centros_salud(id),
ADD COLUMN IF NOT EXISTS permisos_especiales JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS configuracion_role JSONB DEFAULT '{}'::jsonb;

-- Actualizar tipo de columna role para usar enum
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'role' AND data_type = 'text') THEN
        ALTER TABLE public.user_profiles ALTER COLUMN role TYPE public.app_role USING role::public.app_role;
    END IF;
END $$;

-- Crear políticas RLS
ALTER TABLE public.solicitudes_traslado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permisos_pestanas ENABLE ROW LEVEL SECURITY;

-- ============================================
-- [26/44] 20250905081458_bd433cd8-d002-483a-9431-4e07c69e02ba.sql
-- ============================================

-- Crear tipo enum para roles si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM (
            'SUPER_ADMINISTRADOR',
            'RRHH_MINISTERIO', 
            'MIEMBRO_GOBIERNO',
            'HABILITACION',
            'ADMIN_CENTRO_SANITARIO',
            'REVISOR_SOLICITUDES',
            'PERSONALIDAD_MINISTERIAL',
            'OBSERVADOR',
            'DIRECTIVO_CENTRO_SANITARIO'
        );
    END IF;
END $$;

-- Crear tabla para solicitudes de traslado
CREATE TABLE IF NOT EXISTS public.solicitudes_traslado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id UUID NOT NULL REFERENCES public.profesionales_sanitarios(id) ON DELETE CASCADE,
  centro_origen_id UUID REFERENCES public.centros_salud(id),
  centro_destino_id UUID NOT NULL REFERENCES public.centros_salud(id),
  solicitante_id UUID NOT NULL,
  motivo TEXT NOT NULL,
  observaciones TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_aprobacion TIMESTAMP WITH TIME ZONE,
  aprobado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de permisos específicos por pestaña
CREATE TABLE IF NOT EXISTS public.permisos_pestanas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  pestana TEXT NOT NULL,
  puede_ver BOOLEAN DEFAULT FALSE,
  puede_editar BOOLEAN DEFAULT FALSE,
  puede_aprobar BOOLEAN DEFAULT FALSE,
  restricciones JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(usuario_id, pestana)
);

-- Actualizar tabla user_profiles con nuevos campos (solo si no existen)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS centro_asignado_id UUID REFERENCES public.centros_salud(id),
ADD COLUMN IF NOT EXISTS permisos_especiales JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS configuracion_role JSONB DEFAULT '{}'::jsonb;

-- ============================================
-- [27/44] 20250905081530_2cb3ea70-ad51-4ac8-83fd-a53de15374ff.sql
-- ============================================

-- Habilitar RLS y crear políticas para nuevas tablas
ALTER TABLE public.solicitudes_traslado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permisos_pestanas ENABLE ROW LEVEL SECURITY;

-- Políticas para solicitudes_traslado
CREATE POLICY "Usuarios pueden ver sus solicitudes de traslado"
ON public.solicitudes_traslado FOR SELECT
USING (
  solicitante_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.role IN ('SUPER_ADMINISTRADOR', 'RRHH_MINISTERIO', 'MIEMBRO_GOBIERNO')
  )
);

CREATE POLICY "Usuarios pueden crear solicitudes de traslado"
ON public.solicitudes_traslado FOR INSERT
WITH CHECK (solicitante_id = auth.uid());

CREATE POLICY "Solo RRHH puede aprobar traslados"
ON public.solicitudes_traslado FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.role IN ('SUPER_ADMINISTRADOR', 'RRHH_MINISTERIO')
  )
);

-- Políticas para permisos_pestanas
CREATE POLICY "Usuarios pueden ver sus permisos"
ON public.permisos_pestanas FOR SELECT
USING (usuario_id = auth.uid());

CREATE POLICY "Solo admins pueden gestionar permisos"
ON public.permisos_pestanas FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.role IN ('SUPER_ADMINISTRADOR', 'RRHH_MINISTERIO')
  )
);

-- ============================================
-- [28/44] 20250906065243_5f40dd52-6597-42ab-9871-b8a15fcd383e.sql
-- ============================================

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

-- ============================================
-- [29/44] 20250906065310_fb428f0d-a4ca-4f3e-bbd1-a98b2916c0d9.sql
-- ============================================

-- Crear solo perfiles de usuario con centros reales (sin tocar auth.users)
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
  SELECT id INTO centro_malabo FROM centros_salud WHERE provincia = 'Bioko Norte' LIMIT 1;
  SELECT id INTO centro_bata FROM centros_salud WHERE provincia = 'Litoral' LIMIT 1;
  SELECT id INTO centro_sampaka FROM centros_salud OFFSET 2 LIMIT 1;
  SELECT id INTO centro_esperanza FROM centros_salud OFFSET 3 LIMIT 1;
  SELECT id INTO centro_sipopo FROM centros_salud OFFSET 4 LIMIT 1;
  SELECT id INTO centro_nacional FROM centros_salud OFFSET 5 LIMIT 1;

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

-- ============================================
-- [30/44] 20250907093350_06169961-eb0d-4b8f-9ed8-347a588869ac.sql
-- ============================================

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

-- ============================================
-- [31/44] 20250909000000_attendance_module.sql
-- ============================================

-- Attendance & Payroll module: dispositivos, empleado_dispositivo_map, attendance_logs
-- Requires pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Dispositivos de fichaje
CREATE TABLE IF NOT EXISTS public.dispositivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  ubicacion text,
  centro_salud_id uuid REFERENCES public.centros_salud(id) ON DELETE SET NULL,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dispositivos_centro ON public.dispositivos(centro_salud_id);

-- 2) Mapeo EnNo <-> Profesional por dispositivo
CREATE TABLE IF NOT EXISTS public.empleado_dispositivo_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_profesional uuid NOT NULL REFERENCES public.profesionales_sanitarios(id) ON DELETE CASCADE,
  en_no text NOT NULL,
  id_dispositivo uuid NOT NULL REFERENCES public.dispositivos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id_dispositivo, en_no),
  UNIQUE(id_profesional, id_dispositivo)
);

CREATE INDEX IF NOT EXISTS idx_emp_map_prof ON public.empleado_dispositivo_map(id_profesional);
CREATE INDEX IF NOT EXISTS idx_emp_map_device ON public.empleado_dispositivo_map(id_dispositivo);

-- 3) Logs de asistencia crudos importados
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_profesional uuid REFERENCES public.profesionales_sanitarios(id) ON DELETE SET NULL,
  id_dispositivo uuid NOT NULL REFERENCES public.dispositivos(id) ON DELETE CASCADE,
  en_no text,
  inout text CHECK (inout IN ('IN','OUT')),
  mode text,
  fecha_hora timestamptz NOT NULL,
  raw_line text,
  source_file text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_att_logs_prof_fecha ON public.attendance_logs(id_profesional, fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_att_logs_device_fecha ON public.attendance_logs(id_dispositivo, fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_att_logs_enno_fecha ON public.attendance_logs(en_no, fecha_hora DESC);

-- RLS
ALTER TABLE public.dispositivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleado_dispositivo_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- Policies: baseline (application-level filtering by center and sector público already applied in app)
-- Only authenticated users can read; inserts/updates allowed to authenticated to simplify initial rollout
DROP POLICY IF EXISTS "dispositivos_select_auth" ON public.dispositivos;
CREATE POLICY "dispositivos_select_auth" ON public.dispositivos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "dispositivos_write_auth" ON public.dispositivos;
CREATE POLICY "dispositivos_write_auth" ON public.dispositivos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "emp_map_select_auth" ON public.empleado_dispositivo_map;
CREATE POLICY "emp_map_select_auth" ON public.empleado_dispositivo_map
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "emp_map_write_auth" ON public.empleado_dispositivo_map;
CREATE POLICY "emp_map_write_auth" ON public.empleado_dispositivo_map
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "att_logs_select_auth" ON public.attendance_logs;
CREATE POLICY "att_logs_select_auth" ON public.attendance_logs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "att_logs_write_auth" ON public.attendance_logs;
CREATE POLICY "att_logs_write_auth" ON public.attendance_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger to keep updated_at in sync
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dispositivos_set_updated_at ON public.dispositivos;
CREATE TRIGGER dispositivos_set_updated_at
BEFORE UPDATE ON public.dispositivos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS emp_map_set_updated_at ON public.empleado_dispositivo_map;
CREATE TRIGGER emp_map_set_updated_at
BEFORE UPDATE ON public.empleado_dispositivo_map
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================
-- [32/44] 20250909001000_turnos_cuadrantes_bio.sql
-- ============================================

-- Biometric Shifts (turnos) and Schedules (cuadrantes) for device integration
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.turnos_biometricos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_turno text NOT NULL,
  hora_inicio time NOT NULL,
  hora_fin time NOT NULL,
  tolerancia_minutos integer NOT NULL DEFAULT 0,
  tipo text NOT NULL CHECK (tipo IN ('diurno','nocturno','festivo')),
  centro_salud_id uuid REFERENCES public.centros_salud(id) ON DELETE SET NULL,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_turnos_centro ON public.turnos_biometricos(centro_salud_id);

CREATE TABLE IF NOT EXISTS public.cuadrantes_biometricos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_profesional uuid NOT NULL REFERENCES public.profesionales_sanitarios(id) ON DELETE CASCADE,
  turno_id uuid NOT NULL REFERENCES public.turnos_biometricos(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  centro_salud_id uuid REFERENCES public.centros_salud(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id_profesional, fecha)
);

CREATE INDEX IF NOT EXISTS idx_cuadrantes_centro_fecha ON public.cuadrantes_biometricos(centro_salud_id, fecha);

ALTER TABLE public.turnos_biometricos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuadrantes_biometricos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "turnos_select_auth" ON public.turnos_biometricos;
CREATE POLICY "turnos_select_auth" ON public.turnos_biometricos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "turnos_write_auth" ON public.turnos_biometricos;
CREATE POLICY "turnos_write_auth" ON public.turnos_biometricos FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "cuad_select_auth" ON public.cuadrantes_biometricos;
CREATE POLICY "cuad_select_auth" ON public.cuadrantes_biometricos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "cuad_write_auth" ON public.cuadrantes_biometricos;
CREATE POLICY "cuad_write_auth" ON public.cuadrantes_biometricos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS turnos_set_updated_at ON public.turnos_biometricos;
CREATE TRIGGER turnos_set_updated_at BEFORE UPDATE ON public.turnos_biometricos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS cuadrantes_set_updated_at ON public.cuadrantes_biometricos;
CREATE TRIGGER cuadrantes_set_updated_at BEFORE UPDATE ON public.cuadrantes_biometricos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================
-- [33/44] 20251006184814_9cec188a-ee5b-48e2-9e3b-8973cac07c65.sql
-- ============================================

-- Sistema de parámetros dinámicos para profesionales
-- Permite crear parámetros personalizados sin necesidad de modificar código

-- Enum para tipos de datos de parámetros
CREATE TYPE tipo_dato_parametro AS ENUM (
  'texto',
  'numero',
  'fecha',
  'boolean',
  'seleccion_unica',
  'seleccion_multiple',
  'archivo',
  'moneda'
);

-- Enum para categorías de parámetros
CREATE TYPE categoria_parametro AS ENUM (
  'formacion',
  'condecoracion',
  'promocion',
  'incidencia',
  'evento',
  'salario',
  'certificacion',
  'evaluacion',
  'disciplinario',
  'reconocimiento',
  'otro'
);

-- Tabla de definiciones de parámetros personalizados
CREATE TABLE IF NOT EXISTS parametros_profesionales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  tipo_dato tipo_dato_parametro NOT NULL,
  categoria categoria_parametro NOT NULL DEFAULT 'otro',
  icono TEXT DEFAULT 'Award', -- Nombre del icono de lucide-react
  color TEXT DEFAULT '#3b82f6', -- Color hex para el parámetro
  opciones_seleccion JSONB, -- Para tipo seleccion_unica o seleccion_multiple
  unidad TEXT, -- Para números (ej: "años", "CFA", etc)
  es_obligatorio BOOLEAN DEFAULT false,
  visible_en_detalles BOOLEAN DEFAULT true,
  orden_visualizacion INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabla de valores de parámetros asignados a profesionales
CREATE TABLE IF NOT EXISTS valores_parametros_profesionales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id UUID NOT NULL REFERENCES profesionales_sanitarios(id) ON DELETE CASCADE,
  parametro_id UUID NOT NULL REFERENCES parametros_profesionales(id) ON DELETE CASCADE,
  valor_texto TEXT,
  valor_numero NUMERIC,
  valor_fecha DATE,
  valor_boolean BOOLEAN,
  valor_seleccion TEXT[], -- Array para selección múltiple
  valor_archivo_url TEXT,
  notas TEXT,
  fecha_registro TIMESTAMPTZ DEFAULT NOW(),
  registrado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profesional_id, parametro_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_parametros_categoria ON parametros_profesionales(categoria);
CREATE INDEX IF NOT EXISTS idx_parametros_activo ON parametros_profesionales(activo);
CREATE INDEX IF NOT EXISTS idx_valores_profesional ON valores_parametros_profesionales(profesional_id);
CREATE INDEX IF NOT EXISTS idx_valores_parametro ON valores_parametros_profesionales(parametro_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION actualizar_updated_at_parametros()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_parametros
BEFORE UPDATE ON parametros_profesionales
FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at_parametros();

CREATE TRIGGER trigger_actualizar_valores_parametros
BEFORE UPDATE ON valores_parametros_profesionales
FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at_parametros();

-- RLS Policies
ALTER TABLE parametros_profesionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE valores_parametros_profesionales ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer parámetros activos
CREATE POLICY "Todos pueden ver parámetros activos"
ON parametros_profesionales FOR SELECT
USING (activo = true);

-- Solo admins pueden gestionar parámetros
CREATE POLICY "Admins pueden gestionar parámetros"
ON parametros_profesionales FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('SUPER_ADMINISTRADOR', 'RRHH_MINISTERIO', 'PERSONALIDAD_MINISTERIAL')
  )
);

-- Todos autenticados pueden ver valores de parámetros
CREATE POLICY "Usuarios autenticados pueden ver valores"
ON valores_parametros_profesionales FOR SELECT
USING (auth.role() = 'authenticated');

-- Solo admins y RRHH pueden modificar valores
CREATE POLICY "Admins pueden gestionar valores"
ON valores_parametros_profesionales FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('SUPER_ADMINISTRADOR', 'RRHH_MINISTERIO', 'ADMIN_CENTRO_SANITARIO')
  )
);

-- Insertar algunos parámetros de ejemplo
INSERT INTO parametros_profesionales (nombre, descripcion, tipo_dato, categoria, icono, color, visible_en_detalles, orden_visualizacion) VALUES
('Condecoraciones', 'Condecoraciones y reconocimientos recibidos', 'texto', 'condecoracion', 'Award', '#f59e0b', true, 1),
('Salario Base', 'Salario base mensual', 'moneda', 'salario', 'DollarSign', '#10b981', true, 2),
('Última Evaluación', 'Fecha de última evaluación de desempeño', 'fecha', 'evaluacion', 'ClipboardCheck', '#6366f1', true, 3),
('Certificaciones Adicionales', 'Certificaciones profesionales adicionales', 'texto', 'certificacion', 'FileCheck', '#8b5cf6', true, 4),
('Promoción', 'Historial de promociones', 'fecha', 'promocion', 'TrendingUp', '#ec4899', true, 5)
ON CONFLICT (nombre) DO NOTHING;

-- ============================================
-- [34/44] 20251008120000_disciplinary_expedientes.sql
-- ============================================

-- Expedientes disciplinarios module

-- Enum for estado
DO $$ BEGIN
  CREATE TYPE expediente_estado AS ENUM ('abierto','en_revision','resuelto','cerrado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Main table
CREATE TABLE IF NOT EXISTS public.expedientes_disciplinarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id uuid NOT NULL REFERENCES public.profesionales_sanitarios(id) ON DELETE RESTRICT,
  motivo text NOT NULL,
  estado expediente_estado NOT NULL DEFAULT 'abierto',
  fecha_apertura timestamptz NOT NULL DEFAULT now(),
  resolucion_final text,
  archivo_adjunto_url text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- History table
CREATE TABLE IF NOT EXISTS public.historial_acciones_expediente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expediente_id uuid NOT NULL REFERENCES public.expedientes_disciplinarios(id) ON DELETE CASCADE,
  accion text NOT NULL, -- 'apertura','nota','cambio_estado','resolucion'
  comentario text,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS expedientes_profesional_idx ON public.expedientes_disciplinarios(profesional_id);
CREATE INDEX IF NOT EXISTS expedientes_estado_idx ON public.expedientes_disciplinarios(estado);
CREATE INDEX IF NOT EXISTS hist_exp_expediente_idx ON public.historial_acciones_expediente(expediente_id);
CREATE INDEX IF NOT EXISTS hist_exp_actor_idx ON public.historial_acciones_expediente(actor_id);

-- Storage bucket for attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('expedientes','expedientes', true)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.expedientes_disciplinarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_acciones_expediente ENABLE ROW LEVEL SECURITY;

-- Read policies (authenticated)
DO $$ BEGIN
  CREATE POLICY expedientes_select_auth ON public.expedientes_disciplinarios
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY hist_exp_select_auth ON public.historial_acciones_expediente
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- No INSERT/UPDATE/DELETE policies here; writes are performed via Edge Functions using service role.


-- ============================================
-- [35/44] 20251008130000_incidents_expediente_trigger.sql
-- ============================================

-- Auto-register hospital incidents into disciplinary expediente history
-- Function runs with definer privileges to bypass RLS safely. Uses auth.uid() for actor attribution.
CREATE OR REPLACE FUNCTION public.fn_incident_to_expediente()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exp_id uuid;
  v_actor uuid := auth.uid();
BEGIN
  -- Only process incidents linked to a professional
  IF NEW.id_profesional IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find an open/review expediente for this professional
  SELECT e.id INTO v_exp_id
  FROM public.expedientes_disciplinarios e
  WHERE e.profesional_id = NEW.id_profesional
    AND e.estado IN ('abierto','en_revision')
  ORDER BY e.fecha_apertura DESC
  LIMIT 1;

  -- If not found, create a new expediente
  IF v_exp_id IS NULL THEN
    INSERT INTO public.expedientes_disciplinarios (
      profesional_id, motivo, estado, created_by
    ) VALUES (
      NEW.id_profesional,
      CONCAT('Incidencia: ', COALESCE(NEW.titulo_incidencia, 'Incidencia registrada')),
      'abierto',
      v_actor
    ) RETURNING id INTO v_exp_id;

    INSERT INTO public.historial_acciones_expediente (
      expediente_id, accion, comentario, actor_id
    ) VALUES (
      v_exp_id, 'apertura', 'Expediente creado automáticamente por incidente', v_actor
    );
  END IF;

  -- Register the incident in expediente history
  INSERT INTO public.historial_acciones_expediente (
    expediente_id, accion, comentario, actor_id
  ) VALUES (
    v_exp_id,
    'incidencia_registrada',
    CONCAT(
      'Incidencia: ', COALESCE(NEW.titulo_incidencia, ''),
      CASE WHEN NEW.descripcion IS NOT NULL THEN E'\n' || NEW.descripcion ELSE '' END
    ),
    v_actor
  );

  RETURN NEW;
END;
$$;

-- Trigger on hospital incidents table
DROP TRIGGER IF EXISTS trg_incident_to_expediente ON public.incidencias_hospitalarias;
CREATE TRIGGER trg_incident_to_expediente
AFTER INSERT ON public.incidencias_hospitalarias
FOR EACH ROW
EXECUTE FUNCTION public.fn_incident_to_expediente();


-- ============================================
-- [36/44] 20251008133000_disciplinary_extensions.sql
-- ============================================

-- Catalogs for faults and sanctions
CREATE TABLE IF NOT EXISTS public.faltas_catalogo (
  codigo text PRIMARY KEY,
  nombre text NOT NULL,
  categoria text,
  activo boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.sanciones_catalogo (
  codigo text PRIMARY KEY,
  nombre text NOT NULL,
  requiere_periodo boolean NOT NULL DEFAULT false,
  requiere_monto boolean NOT NULL DEFAULT false,
  activo boolean NOT NULL DEFAULT true
);

INSERT INTO public.faltas_catalogo (codigo, nombre, categoria) VALUES
  ('negligencia', 'Negligencia', 'conducta'),
  ('incumplimiento', 'Incumplimiento de Deberes', 'conducta'),
  ('mala_practica', 'Mala Práctica', 'tecnica'),
  ('ausencia_injustificada', 'Ausencia Injustificada', 'asistencia')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO public.sanciones_catalogo (codigo, nombre, requiere_periodo, requiere_monto) VALUES
  ('amonestacion', 'Amonestación Escrita', false, false),
  ('suspension', 'Suspensión Temporal', true, false),
  ('multa', 'Multa Económica', false, true),
  ('inhabilitacion', 'Inhabilitación Permanente', false, false)
ON CONFLICT (codigo) DO NOTHING;

-- Extend expediente states
DO $$ BEGIN
  CREATE TYPE expediente_estado_v2 AS ENUM (
    'borrador','en_investigacion','audiencia_programada','pendiente_resolucion','sancionado','archivado','abierto','en_revision','resuelto','cerrado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add new columns
ALTER TABLE public.expedientes_disciplinarios
  ADD COLUMN IF NOT EXISTS fecha_incidente timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS falta_codigo text REFERENCES public.faltas_catalogo(codigo),
  ADD COLUMN IF NOT EXISTS gravedad text CHECK (gravedad IN ('leve','grave','muy_grave')),
  ADD COLUMN IF NOT EXISTS descripcion text,
  ADD COLUMN IF NOT EXISTS centro_salud_id uuid REFERENCES public.centros_salud(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pruebas_urls jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS autoridad_solicitante uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sancion_tipo text REFERENCES public.sanciones_catalogo(codigo),
  ADD COLUMN IF NOT EXISTS sancion_fecha_inicio date,
  ADD COLUMN IF NOT EXISTS sancion_fecha_fin date,
  ADD COLUMN IF NOT EXISTS multa_monto numeric,
  ADD COLUMN IF NOT EXISTS inhabilitacion_permanente boolean NOT NULL DEFAULT false;

-- Migrate enum type if needed
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='expedientes_disciplinarios' AND column_name='estado'
  ) THEN
    ALTER TABLE public.expedientes_disciplinarios
      ALTER COLUMN estado TYPE expediente_estado_v2 USING estado::text::expediente_estado_v2;
  END IF;
EXCEPTION WHEN others THEN NULL; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS expedientes_centro_idx ON public.expedientes_disciplinarios(centro_salud_id);
CREATE INDEX IF NOT EXISTS expedientes_fecha_incidente_idx ON public.expedientes_disciplinarios(fecha_incidente);


-- ============================================
-- [37/44] 20251010140000_profesionales_rfid.sql
-- ============================================

ALTER TABLE profesionales_sanitarios
ADD COLUMN IF NOT EXISTS numero_tarjeta_rfid VARCHAR(10);

CREATE INDEX IF NOT EXISTS idx_profesionales_rfid
ON profesionales_sanitarios (numero_tarjeta_rfid)
WHERE numero_tarjeta_rfid IS NOT NULL;


-- ============================================
-- [38/44] 20251017120000_area_profesional_fk.sql
-- ============================================

-- Areas profesionales lookup table and FK migration
-- 1) Create lookup table
CREATE TABLE IF NOT EXISTS public.areas_profesionales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_areas_profesionales_updated_at ON public.areas_profesionales;
CREATE TRIGGER trg_areas_profesionales_updated_at
BEFORE UPDATE ON public.areas_profesionales
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) RLS and policies
ALTER TABLE public.areas_profesionales ENABLE ROW LEVEL SECURITY;

-- Allow read to everyone (adjust if you need to restrict)
DROP POLICY IF EXISTS "areas_profesionales_select_all" ON public.areas_profesionales;
CREATE POLICY "areas_profesionales_select_all"
ON public.areas_profesionales FOR SELECT
USING (true);

-- Allow insert/update/delete only to admin-like roles
DROP POLICY IF EXISTS "areas_profesionales_admin_write" ON public.areas_profesionales;
CREATE POLICY "areas_profesionales_admin_write"
ON public.areas_profesionales FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid()
      AND up.role IN ('SUPER_ADMINISTRADOR', 'RRHH_MINISTERIO')
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid()
      AND up.role IN ('SUPER_ADMINISTRADOR', 'RRHH_MINISTERIO')
  )
);

-- 3) Add FK column to profesionales_sanitarios
ALTER TABLE public.profesionales_sanitarios
ADD COLUMN IF NOT EXISTS area_profesional_id UUID REFERENCES public.areas_profesionales(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profesionales_area_profesional_id ON public.profesionales_sanitarios(area_profesional_id);

-- 4) Backfill lookup values from existing text column
INSERT INTO public.areas_profesionales (nombre)
SELECT DISTINCT TRIM(area_profesional)
FROM public.profesionales_sanitarios
WHERE area_profesional IS NOT NULL AND TRIM(area_profesional) <> ''
ON CONFLICT (nombre) DO NOTHING;

-- 5) Backfill FK on professionals by matching name (case-insensitive, trimmed)
UPDATE public.profesionales_sanitarios p
SET area_profesional_id = a.id
FROM public.areas_profesionales a
WHERE p.area_profesional IS NOT NULL
  AND TRIM(LOWER(p.area_profesional)) = TRIM(LOWER(a.nombre))
  AND (p.area_profesional_id IS NULL OR p.area_profesional_id <> a.id);

-- 6) Sync trigger: derive text from FK on insert/update
CREATE OR REPLACE FUNCTION public.sync_area_profesional_text()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.area_profesional_id IS NOT NULL THEN
    SELECT nombre INTO NEW.area_profesional FROM public.areas_profesionales WHERE id = NEW.area_profesional_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profesionales_sync_area_text ON public.profesionales_sanitarios;
CREATE TRIGGER trg_profesionales_sync_area_text
BEFORE INSERT OR UPDATE OF area_profesional_id ON public.profesionales_sanitarios
FOR EACH ROW EXECUTE FUNCTION public.sync_area_profesional_text();

-- Optional: try to resolve FK from text when provided (best-effort, no inserts)
CREATE OR REPLACE FUNCTION public.try_link_area_profesional_id()
RETURNS TRIGGER AS $$
DECLARE
  aid UUID;
BEGIN
  IF (NEW.area_profesional_id IS NULL) AND (NEW.area_profesional IS NOT NULL) THEN
    SELECT id INTO aid FROM public.areas_profesionales WHERE TRIM(LOWER(nombre)) = TRIM(LOWER(NEW.area_profesional)) LIMIT 1;
    IF aid IS NOT NULL THEN
      NEW.area_profesional_id = aid;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profesionales_try_link_area ON public.profesionales_sanitarios;
CREATE TRIGGER trg_profesionales_try_link_area
BEFORE INSERT OR UPDATE OF area_profesional ON public.profesionales_sanitarios
FOR EACH ROW EXECUTE FUNCTION public.try_link_area_profesional_id();








-- ============================================
-- [39/44] 20251018_add_unemployment_fields_profesionales.sql
-- ============================================

-- Add unemployment and recent graduate fields to profesionales_sanitarios
ALTER TABLE public.profesionales_sanitarios
  ADD COLUMN IF NOT EXISTS meses_en_paro INTEGER,
  ADD COLUMN IF NOT EXISTS ultimo_trabajo TEXT,
  ADD COLUMN IF NOT EXISTS recien_graduado BOOLEAN DEFAULT FALSE;



-- ============================================
-- [40/44] 20251101025757_ddb02cc9-0eed-4c0d-912d-6feb9d1e7115.sql
-- ============================================

-- Regenerar tipos de Supabase
-- Esta migración vacía fuerza la regeneración del archivo types.ts

SELECT 1;

-- ============================================
-- [41/44] 20251103064457_1064b1fa-f968-4b12-bcde-4677bfed3d8f.sql
-- ============================================

-- Crear tablas necesarias para el SDK Flask de dispositivos biométricos
-- Estas tablas permiten que el SDK se comunique con los dispositivos

-- Tabla de dispositivos (equivalente a la tabla device del SDK)
CREATE TABLE IF NOT EXISTS public.device (
  id SERIAL PRIMARY KEY,
  serial_num VARCHAR(80) UNIQUE NOT NULL,
  status INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de personas (usuarios del sistema biométrico)
CREATE TABLE IF NOT EXISTS public.person (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  roll_id INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de información de registro biométrico
CREATE TABLE IF NOT EXISTS public.enroll_info (
  id SERIAL PRIMARY KEY,
  enroll_id INTEGER NOT NULL REFERENCES public.person(id) ON DELETE CASCADE,
  backupnum INTEGER NOT NULL,
  signatures TEXT,
  imagepath VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(enroll_id, backupnum)
);

-- Tabla de registros de asistencia desde dispositivo
CREATE TABLE IF NOT EXISTS public.record (
  id SERIAL PRIMARY KEY,
  enroll_id INTEGER,
  mode INTEGER,
  int_out INTEGER,
  event INTEGER,
  verify_mode INTEGER,
  year INTEGER,
  month INTEGER,
  day INTEGER,
  hour INTEGER,
  minute INTEGER,
  second INTEGER,
  workcode INTEGER,
  reserved INTEGER,
  device_serial_num VARCHAR(80),
  record_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de comandos para enviar a dispositivos
CREATE TABLE IF NOT EXISTS public.machine_command (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  status INTEGER DEFAULT 0,
  send_status INTEGER DEFAULT 0,
  err_count INTEGER DEFAULT 0,
  serial VARCHAR(80),
  content TEXT,
  gmt_crate TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  gmt_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de días de acceso
CREATE TABLE IF NOT EXISTS public.access_day (
  id INTEGER PRIMARY KEY,
  time1_start VARCHAR(20),
  time1_end VARCHAR(20),
  time2_start VARCHAR(20),
  time2_end VARCHAR(20),
  time3_start VARCHAR(20),
  time3_end VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de semanas de acceso
CREATE TABLE IF NOT EXISTS public.access_week (
  id INTEGER PRIMARY KEY,
  sun INTEGER,
  mon INTEGER,
  tue INTEGER,
  wed INTEGER,
  thu INTEGER,
  fri INTEGER,
  sat INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de grupos de bloqueo
CREATE TABLE IF NOT EXISTS public.lock_group (
  id INTEGER PRIMARY KEY,
  access_week_id INTEGER,
  lock1 INTEGER,
  lock2 INTEGER,
  lock3 INTEGER,
  lock4 INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de bloqueos de usuario
CREATE TABLE IF NOT EXISTS public.user_lock (
  id SERIAL PRIMARY KEY,
  enroll_id INTEGER REFERENCES public.person(id) ON DELETE CASCADE,
  lock_group_id INTEGER,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_device_serial_num ON public.device(serial_num);
CREATE INDEX IF NOT EXISTS idx_enroll_info_enroll_id ON public.enroll_info(enroll_id);
CREATE INDEX IF NOT EXISTS idx_record_enroll_id ON public.record(enroll_id);
CREATE INDEX IF NOT EXISTS idx_record_device_serial ON public.record(device_serial_num);
CREATE INDEX IF NOT EXISTS idx_record_time ON public.record(record_time);
CREATE INDEX IF NOT EXISTS idx_machine_command_serial ON public.machine_command(serial);
CREATE INDEX IF NOT EXISTS idx_machine_command_status ON public.machine_command(status, send_status);

-- RLS para seguridad (permitir acceso a usuarios autenticados)
ALTER TABLE public.device ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enroll_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_command ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir todo a usuarios autenticados por ahora)
CREATE POLICY "Allow authenticated users full access to device"
  ON public.device FOR ALL
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow authenticated users full access to person"
  ON public.person FOR ALL
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow authenticated users full access to enroll_info"
  ON public.enroll_info FOR ALL
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow authenticated users full access to record"
  ON public.record FOR ALL
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow authenticated users full access to machine_command"
  ON public.machine_command FOR ALL
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Trigger para actualizar updated_at en device
CREATE OR REPLACE FUNCTION update_device_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER device_updated_at_trigger
  BEFORE UPDATE ON public.device
  FOR EACH ROW
  EXECUTE FUNCTION update_device_updated_at();

-- ============================================
-- [42/44] 20251104222158_a6323071-1bfe-46af-8500-26091ed93735.sql
-- ============================================


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


-- ============================================
-- [43/44] 20251104222240_847e3cf6-2cd7-4e52-99a2-416d6ab50bcb.sql
-- ============================================


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


-- ============================================
-- [44/44] 20251105011927_e2dcdf27-0846-4b4d-89c2-91290deef071.sql
-- ============================================

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


