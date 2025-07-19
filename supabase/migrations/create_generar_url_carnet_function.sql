-- Create the missing generar_url_carnet_profesional function
CREATE OR REPLACE FUNCTION public.generar_url_carnet_profesional(professional_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    base_url text;
    professional_record record;
BEGIN
    -- Get the base URL from environment or use default
    base_url := 'https://e326d7762bce426c8bb8967ed29b2b1f-a259c40a761b4ead8bf1e652e.fly.dev';
    
    -- Get professional data
    SELECT * INTO professional_record
    FROM profesionales_sanitarios
    WHERE id = professional_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Professional with ID % not found', professional_uuid;
    END IF;
    
    -- Update URLs for the professional
    UPDATE profesionales_sanitarios
    SET 
        url_codigo_barras = CASE 
            WHEN codigo_barras IS NOT NULL 
            THEN base_url || '/storage/v1/object/public/carnets/barcode_' || id::text || '.png'
            ELSE NULL
        END,
        url_pdf = base_url || '/storage/v1/object/public/carnets/carnet_' || id::text || '.pdf',
        url_codigo_barras_expediente = CASE 
            WHEN codigo_expediente IS NOT NULL 
            THEN base_url || '/storage/v1/object/public/expedientes/barcode_' || codigo_expediente || '.png'
            ELSE NULL
        END,
        updated_at = NOW()
    WHERE id = professional_uuid;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error and return false instead of throwing
        RAISE WARNING 'Error in generar_url_carnet_profesional: %', SQLERRM;
        RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.generar_url_carnet_profesional(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generar_url_carnet_profesional(uuid) TO service_role;

-- Create trigger to automatically call this function when relevant fields change
CREATE OR REPLACE FUNCTION trigger_generar_url_carnet()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only call the function if the professional is being approved or carnet-related fields change
    IF (NEW.estado_solicitud = 'Aprobado' AND OLD.estado_solicitud != 'Aprobado') OR
       (NEW.estado_solicitud = 'Pendiente de Firma' AND OLD.estado_solicitud != 'Pendiente de Firma') OR
       (NEW.numero_carnet_profesional IS NOT NULL AND OLD.numero_carnet_profesional IS NULL) OR
       (NEW.codigo_barras IS NOT NULL AND OLD.codigo_barras IS NULL) OR
       (NEW.codigo_expediente IS NOT NULL AND OLD.codigo_expediente IS NULL) THEN
        
        -- Call the URL generation function
        PERFORM generar_url_carnet_profesional(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS tr_generar_url_carnet ON profesionales_sanitarios;

-- Create the trigger
CREATE TRIGGER tr_generar_url_carnet
    AFTER UPDATE ON profesionales_sanitarios
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generar_url_carnet();
