-- Aseguradoras maestro: Fuente única de verdad para todos los nodos HOSIX
CREATE TABLE IF NOT EXISTS public.renaprosa_aseguradoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  direccion TEXT,
  telefono VARCHAR(50),
  email VARCHAR(255),
  contacto VARCHAR(255),
  activo BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsqueda
CREATE INDEX IF NOT EXISTS idx_aseguradoras_codigo ON public.renaprosa_aseguradoras(codigo);
CREATE INDEX IF NOT EXISTS idx_aseguradoras_tipo ON public.renaprosa_aseguradoras(tipo);
CREATE INDEX IF NOT EXISTS idx_aseguradoras_activo ON public.renaprosa_aseguradoras(activo);

-- RLS: Solo admin_renaprosa puede crear/actualizar
ALTER TABLE public.renaprosa_aseguradoras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin RENAPROSA: Crud completo" ON public.renaprosa_aseguradoras
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin_renaprosa')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin_renaprosa');

CREATE POLICY "Lectura pública para HOSIX" ON public.renaprosa_aseguradoras
  FOR SELECT USING (true);

-- Seed de datos de ejemplo
INSERT INTO public.renaprosa_aseguradoras (codigo, nombre, tipo, telefono, email) VALUES
  ('SEG001', 'Seguros Pichincha', 'privada', '+593-2-123456', 'contacto@seguros-pichincha.com'),
  ('SEG002', 'Seguros Ecuatoriales', 'privada', '+593-2-789012', 'contacto@seguros-ecuatoriales.com'),
  ('IESS', 'Instituto Ecuatoriano de Seguridad Social', 'publica', '+593-2-400000', 'info@iess.gob.ec'),
  ('CARITAS', 'Mutual Cáritas', 'mutual', '+593-2-234567', 'info@caritas.com')
ON CONFLICT (codigo) DO NOTHING;
