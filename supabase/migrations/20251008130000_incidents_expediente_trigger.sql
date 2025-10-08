-- Auto-register hospital incidents into disciplinary expediente history
-- Function runs with definer privileges to bypass RLS safely. Uses auth.uid() for actor attribution.
CREATE OR REPLACE FUNCTION public.fn_incident_to_expediente()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exp_id uuid;
  v_actor uuid := auth.uid();
BEGIN
  -- Only process incidents linked to a professional
  IF NEW.id_profesional IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find an open/review expediente for this professional
  SELECT e.id INTO v_exp_id
  FROM public.expedientes_disciplinarios e
  WHERE e.profesional_id = NEW.id_profesional
    AND e.estado IN ('abierto','en_revision')
  ORDER BY e.fecha_apertura DESC
  LIMIT 1;

  -- If not found, create a new expediente
  IF v_exp_id IS NULL THEN
    INSERT INTO public.expedientes_disciplinarios (
      profesional_id, motivo, estado, created_by
    ) VALUES (
      NEW.id_profesional,
      CONCAT('Incidencia: ', COALESCE(NEW.titulo_incidencia, 'Incidencia registrada')),
      'abierto',
      v_actor
    ) RETURNING id INTO v_exp_id;

    INSERT INTO public.historial_acciones_expediente (
      expediente_id, accion, comentario, actor_id
    ) VALUES (
      v_exp_id, 'apertura', 'Expediente creado automáticamente por incidente', v_actor
    );
  END IF;

  -- Register the incident in expediente history
  INSERT INTO public.historial_acciones_expediente (
    expediente_id, accion, comentario, actor_id
  ) VALUES (
    v_exp_id,
    'incidencia_registrada',
    CONCAT(
      'Incidencia: ', COALESCE(NEW.titulo_incidencia, ''),
      CASE WHEN NEW.descripcion IS NOT NULL THEN E'\n' || NEW.descripcion ELSE '' END
    ),
    v_actor
  );

  RETURN NEW;
END;
$$;

-- Trigger on hospital incidents table
DROP TRIGGER IF EXISTS trg_incident_to_expediente ON public.incidencias_hospitalarias;
CREATE TRIGGER trg_incident_to_expediente
AFTER INSERT ON public.incidencias_hospitalarias
FOR EACH ROW
EXECUTE FUNCTION public.fn_incident_to_expediente();
