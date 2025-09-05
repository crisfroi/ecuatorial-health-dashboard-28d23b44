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