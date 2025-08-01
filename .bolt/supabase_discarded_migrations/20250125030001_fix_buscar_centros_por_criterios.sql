-- Corregir función para buscar centros por criterios incluyendo conteo correcto de profesionales
-- Esta función ahora incluye profesionales tanto por centro_salud_id como por nombre_centro y lugar_trabajo

CREATE OR REPLACE FUNCTION public.buscar_centros_por_criterios(
  p_nombre_parcial TEXT DEFAULT NULL,
  p_categoria TEXT DEFAULT NULL,
  p_distrito_sanitario TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  nombre TEXT,
  categoria TEXT,
  distrito_sanitario TEXT,
  sector TEXT,
  provincia TEXT,
  distrito TEXT,
  director TEXT,
  telefono TEXT,
  total_profesionales BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.nombre,
    c.categoria,
    c.distrito_sanitario,
    c.sector,
    c.provincia,
    c.distrito,
    c.director,
    c.telefono,
    COALESCE(prof_counts.total_profesionales, 0) as total_profesionales
  FROM public.centros_salud c
  LEFT JOIN (
    SELECT 
      c_inner.id as centro_id,
      COUNT(DISTINCT p.id) as total_profesionales
    FROM public.centros_salud c_inner
    LEFT JOIN public.profesionales_sanitarios p ON (
      p.centro_salud_id = c_inner.id OR
      LOWER(p.nombre_centro) = LOWER(c_inner.nombre) OR
      LOWER(p.lugar_trabajo) = LOWER(c_inner.nombre)
    )
    GROUP BY c_inner.id
  ) prof_counts ON c.id = prof_counts.centro_id
  WHERE 
    (p_nombre_parcial IS NULL OR LOWER(c.nombre) LIKE LOWER('%' || p_nombre_parcial || '%'))
    AND (p_categoria IS NULL OR c.categoria = p_categoria)
    AND (p_distrito_sanitario IS NULL OR c.distrito_sanitario = p_distrito_sanitario)
  ORDER BY c.nombre;
END;
$$;
