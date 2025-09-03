-- Crear nueva Edge Function para IA Chat Superinteligente
-- Esta función tendrá acceso completo a todas las tablas y relaciones

-- Función para obtener estadísticas completas del sistema
CREATE OR REPLACE FUNCTION public.get_comprehensive_analytics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'schema_info', (
      SELECT json_agg(
        json_build_object(
          'table_name', table_name,
          'columns', (
            SELECT json_agg(
              json_build_object(
                'column_name', column_name,
                'data_type', data_type,
                'is_nullable', is_nullable
              )
            )
            FROM information_schema.columns c2
            WHERE c2.table_name = c1.table_name 
            AND c2.table_schema = 'public'
          )
        )
      )
      FROM (
        SELECT DISTINCT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        ORDER BY table_name
      ) c1
    ),
    'total_profesionales', (SELECT COUNT(*) FROM profesionales_sanitarios),
    'total_centros', (SELECT COUNT(*) FROM centros_salud),
    'total_guardias', (SELECT COUNT(*) FROM guardias),
    'estados_disponibles', (
      SELECT json_agg(DISTINCT estado_solicitud) 
      FROM profesionales_sanitarios 
      WHERE estado_solicitud IS NOT NULL
    ),
    'areas_profesionales', (
      SELECT json_agg(DISTINCT area_profesional) 
      FROM profesionales_sanitarios 
      WHERE area_profesional IS NOT NULL
    ),
    'distritos_sanitarios', (
      SELECT json_agg(DISTINCT distrito_sanitario) 
      FROM profesionales_sanitarios 
      WHERE distrito_sanitario IS NOT NULL
    ),
    'categorias_centros', (
      SELECT json_agg(DISTINCT categoria) 
      FROM centros_salud 
      WHERE categoria IS NOT NULL
    ),
    'provincias', (
      SELECT json_agg(DISTINCT provincia) 
      FROM profesionales_sanitarios 
      WHERE provincia IS NOT NULL
    )
  ) INTO result;
  
  RETURN result;
END;
$$;