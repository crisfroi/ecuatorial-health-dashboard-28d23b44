-- Add unemployment and recent graduate fields to profesionales_sanitarios
ALTER TABLE public.profesionales_sanitarios
  ADD COLUMN IF NOT EXISTS meses_en_paro INTEGER,
  ADD COLUMN IF NOT EXISTS ultimo_trabajo TEXT,
  ADD COLUMN IF NOT EXISTS recien_graduado BOOLEAN DEFAULT FALSE;

