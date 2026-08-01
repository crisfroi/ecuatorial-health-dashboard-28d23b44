-- Registro de sincronización entre nodos
-- Útil para auditoría y control de cambios
CREATE TABLE IF NOT EXISTS public.renaprosa_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nodo_destino VARCHAR(50) NOT NULL,
  tabla_origen VARCHAR(100) NOT NULL,
  registros_afectados INTEGER NOT NULL,
  tipo_sincronizacion VARCHAR(20) NOT NULL,
  estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
  mensaje_error TEXT,
  fecha_sincronizacion TIMESTAMPTZ NOT NULL,
  fecha_completacion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sync_log_nodo ON public.renaprosa_sync_log(nodo_destino);
CREATE INDEX IF NOT EXISTS idx_sync_log_estado ON public.renaprosa_sync_log(estado);
CREATE INDEX IF NOT EXISTS idx_sync_log_fecha ON public.renaprosa_sync_log(fecha_sincronizacion);

-- RLS: Solo admin puede ver
ALTER TABLE public.renaprosa_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin: Lectura de logs" ON public.renaprosa_sync_log
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin_renaprosa', 'admin'));
