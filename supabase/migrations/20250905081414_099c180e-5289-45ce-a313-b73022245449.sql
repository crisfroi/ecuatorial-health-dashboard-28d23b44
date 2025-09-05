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