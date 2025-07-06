
-- Función para buscar centros por criterios
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
    COUNT(p.id) as total_profesionales
  FROM public.centros_salud c
  LEFT JOIN public.profesionales_sanitarios p ON c.id = p.centro_salud_id
  WHERE 
    (p_nombre_parcial IS NULL OR LOWER(c.nombre) LIKE LOWER('%' || p_nombre_parcial || '%'))
    AND (p_categoria IS NULL OR c.categoria = p_categoria)
    AND (p_distrito_sanitario IS NULL OR c.distrito_sanitario = p_distrito_sanitario)
  GROUP BY c.id, c.nombre, c.categoria, c.distrito_sanitario, c.sector, c.provincia, c.distrito
  ORDER BY c.nombre;
END;
$$;

-- Función para obtener profesionales por centro
CREATE OR REPLACE FUNCTION public.obtener_profesionales_por_centro(
  p_centro_id UUID,
  p_area_profesional TEXT DEFAULT NULL,
  p_estado_solicitud TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  nombre_completo TEXT,
  area_profesional TEXT,
  estado_solicitud TEXT,
  telefono TEXT,
  fecha_alta DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.nombre_completo,
    p.area_profesional,
    p.estado_solicitud,
    p.telefono,
    p.fecha_alta
  FROM public.profesionales_sanitarios p
  WHERE 
    p.centro_salud_id = p_centro_id
    AND (p_area_profesional IS NULL OR p.area_profesional = p_area_profesional)
    AND (p_estado_solicitud IS NULL OR p.estado_solicitud = p_estado_solicitud)
  ORDER BY p.nombre_completo;
END;
$$;
