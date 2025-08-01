
-- Crear tabla para controlar la generación de carnets y evitar duplicados
CREATE TABLE IF NOT EXISTS public.carnets_generados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profesional_id UUID NOT NULL REFERENCES profesionales_sanitarios(id) ON DELETE CASCADE,
  url_carnet TEXT NOT NULL,
  fecha_generacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profesional_id)
);

-- Habilitar RLS
ALTER TABLE public.carnets_generados ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura
CREATE POLICY "Permitir lectura pública de carnets generados" 
  ON public.carnets_generados 
  FOR SELECT 
  USING (true);

-- Política para permitir inserción
CREATE POLICY "Permitir inserción de carnets generados" 
  ON public.carnets_generados 
  FOR INSERT 
  WITH CHECK (true);

-- Función para generar carnet cuando cambie a "Pendiente de Firma"
CREATE OR REPLACE FUNCTION public.trigger_generar_carnet_automatico()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    carnet_existente UUID;
BEGIN
    -- Verificar si el estado cambió a 'Pendiente de Firma'
    IF NEW.estado_solicitud = 'Pendiente de Firma' AND 
       (OLD.estado_solicitud IS NULL OR OLD.estado_solicitud != 'Pendiente de Firma') THEN
        
        -- Verificar que tenga los campos requeridos
        IF NEW.id_profesional_unico IS NOT NULL AND 
           NEW.url_codigo_barras IS NOT NULL THEN
            
            -- Verificar que no exista ya un carnet generado
            SELECT id INTO carnet_existente 
            FROM public.carnets_generados 
            WHERE profesional_id = NEW.id;
            
            IF carnet_existente IS NULL THEN
                -- Insertar en cola de generación de carnets
                INSERT INTO public.cola_generacion_carnets (
                    profesional_id, 
                    estado, 
                    intentos, 
                    created_at
                ) VALUES (
                    NEW.id, 
                    'pendiente', 
                    0, 
                    CURRENT_TIMESTAMP
                );
                
                -- Log de la acción
                INSERT INTO public.logs_sistema (accion, descripcion, error)
                VALUES (
                    'CARNET_PROGRAMADO', 
                    'Carnet programado para generación automática - ID: ' || NEW.id::text,
                    false
                );
            ELSE
                -- Log si ya existe
                INSERT INTO public.logs_sistema (accion, descripcion, error)
                VALUES (
                    'CARNET_YA_EXISTE', 
                    'Intento de generar carnet duplicado evitado - ID: ' || NEW.id::text,
                    false
                );
            END IF;
        ELSE
            -- Log si faltan campos requeridos
            INSERT INTO public.logs_sistema (accion, descripcion, error)
            VALUES (
                'CARNET_FALTAN_DATOS', 
                'No se puede generar carnet, faltan datos - ID: ' || NEW.id::text || 
                ' - ID Profesional: ' || COALESCE(NEW.id_profesional_unico, 'NULL') ||
                ' - Código Barras: ' || COALESCE(NEW.url_codigo_barras, 'NULL'),
                true
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Crear el trigger
DROP TRIGGER IF EXISTS tr_generar_carnet_automatico ON profesionales_sanitarios;
CREATE TRIGGER tr_generar_carnet_automatico
    AFTER UPDATE ON profesionales_sanitarios
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generar_carnet_automatico();

-- Función para marcar carnet como generado y evitar duplicados
CREATE OR REPLACE FUNCTION public.marcar_carnet_generado(
    p_profesional_id UUID,
    p_url_carnet TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insertar en tabla de carnets generados
    INSERT INTO public.carnets_generados (profesional_id, url_carnet)
    VALUES (p_profesional_id, p_url_carnet)
    ON CONFLICT (profesional_id) 
    DO UPDATE SET 
        url_carnet = EXCLUDED.url_carnet,
        fecha_generacion = NOW();
    
    -- Actualizar el estado en cola de generación
    UPDATE public.cola_generacion_carnets
    SET estado = 'completado', 
        url_carnet = p_url_carnet,
        updated_at = NOW()
    WHERE profesional_id = p_profesional_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO public.logs_sistema (accion, descripcion, error)
        VALUES (
            'ERROR_MARCAR_CARNET', 
            'Error al marcar carnet como generado: ' || SQLERRM,
            true
        );
        RETURN FALSE;
END;
$$;
