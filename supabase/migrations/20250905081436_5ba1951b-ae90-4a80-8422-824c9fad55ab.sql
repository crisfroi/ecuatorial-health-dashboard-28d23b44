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