
-- Crear tabla de perfiles de usuario con roles y centros asignados
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'OBSERVADOR',
    assigned_center_id UUID REFERENCES public.centros_salud(id),
    department TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS en user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL')
        )
    );

CREATE POLICY "Admins can insert profiles" ON public.user_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL')
        )
    );

CREATE POLICY "Admins can update profiles" ON public.user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL')
        )
    );

-- Crear tabla de configuración de acceso por rol
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL,
    permission TEXT NOT NULL,
    resource TEXT,
    center_restricted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role, permission, resource)
);

-- Insertar permisos base por rol
INSERT INTO public.role_permissions (role, permission, resource, center_restricted) VALUES
-- SUPER_ADMINISTRADOR - Acceso completo
('SUPER_ADMINISTRADOR', 'view_all', 'guardias', false),
('SUPER_ADMINISTRADOR', 'manage_all', 'guardias', false),
('SUPER_ADMINISTRADOR', 'view_all', 'nominas', false),
('SUPER_ADMINISTRADOR', 'manage_all', 'nominas', false),
('SUPER_ADMINISTRADOR', 'manage', 'users', false),

-- PERSONALIDAD_MINISTERIAL - Panel ministerial
('PERSONALIDAD_MINISTERIAL', 'view_all', 'guardias', false),
('PERSONALIDAD_MINISTERIAL', 'validate', 'nominas', false),
('PERSONALIDAD_MINISTERIAL', 'view_all', 'nominas', false),
('PERSONALIDAD_MINISTERIAL', 'view', 'analytics', false),

-- DIRECTIVO_CENTRO_SANITARIO - Solo su centro
('DIRECTIVO_CENTRO_SANITARIO', 'view', 'guardias', true),
('DIRECTIVO_CENTRO_SANITARIO', 'manage', 'guardias', true),
('DIRECTIVO_CENTRO_SANITARIO', 'view', 'nominas', true),
('DIRECTIVO_CENTRO_SANITARIO', 'create', 'guardias', true),

-- HOSPITAL - Red hospitalaria
('HOSPITAL', 'view', 'guardias', true),
('HOSPITAL', 'manage', 'guardias', true),
('HOSPITAL', 'view', 'nominas', true),

-- REVISOR_SOLICITUDES - Solo revisión
('REVISOR_SOLICITUDES', 'view', 'guardias', false),
('REVISOR_SOLICITUDES', 'view', 'professionals', false),

-- OBSERVADOR - Solo lectura
('OBSERVADOR', 'view', 'guardias', false),
('OBSERVADOR', 'view', 'public_data', false)
ON CONFLICT (role, permission, resource) DO NOTHING;

-- Función para obtener permisos de usuario
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id UUID)
RETURNS TABLE (
    role TEXT,
    permission TEXT,
    resource TEXT,
    center_restricted BOOLEAN,
    assigned_center_id UUID
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT 
        rp.role,
        rp.permission,
        rp.resource,
        rp.center_restricted,
        up.assigned_center_id
    FROM public.role_permissions rp
    JOIN public.user_profiles up ON up.role = rp.role
    WHERE up.id = user_id AND up.is_active = true;
$$;

-- Función para verificar si un usuario puede acceder a un recurso
CREATE OR REPLACE FUNCTION public.can_access_resource(
    user_id UUID,
    required_permission TEXT,
    resource_name TEXT,
    target_center_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.get_user_permissions(user_id) p
        WHERE p.permission IN (required_permission, 'manage_all', 'view_all')
        AND (p.resource = resource_name OR p.resource IS NULL)
        AND (
            p.center_restricted = false 
            OR target_center_id IS NULL 
            OR p.assigned_center_id = target_center_id
        )
    );
$$;

-- Actualizar tabla de guardias para mejor control de acceso
ALTER TABLE public.guardias 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Políticas RLS para guardias basadas en roles y centros
DROP POLICY IF EXISTS "Guardias access control" ON public.guardias;
CREATE POLICY "Guardias access control" ON public.guardias
    FOR ALL USING (
        public.can_access_resource(
            auth.uid(), 
            'view', 
            'guardias', 
            centro_salud_id
        )
    )
    WITH CHECK (
        public.can_access_resource(
            auth.uid(), 
            'manage', 
            'guardias', 
            centro_salud_id
        )
    );

-- Tabla para nóminas de guardias
CREATE TABLE IF NOT EXISTS public.nominas_guardias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centro_salud_id UUID REFERENCES public.centros_salud(id) NOT NULL,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    anio INTEGER NOT NULL CHECK (anio >= 2020),
    estado TEXT DEFAULT 'borrador' CHECK (estado IN ('borrador', 'enviada', 'aprobada', 'rechazada', 'pagada')),
    total_importe DECIMAL(12,2) DEFAULT 0,
    total_guardias INTEGER DEFAULT 0,
    total_profesionales INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(centro_salud_id, mes, anio)
);

-- Habilitar RLS en nóminas
ALTER TABLE public.nominas_guardias ENABLE ROW LEVEL SECURITY;

-- Política para nóminas basada en roles
CREATE POLICY "Nominas access control" ON public.nominas_guardias
    FOR ALL USING (
        public.can_access_resource(
            auth.uid(), 
            'view', 
            'nominas', 
            centro_salud_id
        )
    )
    WITH CHECK (
        public.can_access_resource(
            auth.uid(), 
            'manage', 
            'nominas', 
            centro_salud_id
        )
    );

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nominas_guardias_updated_at
    BEFORE UPDATE ON public.nominas_guardias
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
