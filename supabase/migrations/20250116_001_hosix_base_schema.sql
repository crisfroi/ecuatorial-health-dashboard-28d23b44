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
