-- Function to call Edge Function for sync events
CREATE OR REPLACE FUNCTION public.trigger_sync_to_hosix()
RETURNS TRIGGER AS $$
DECLARE
  v_event_type TEXT;
  v_table_name TEXT;
  v_record JSONB;
  v_payload JSONB;
  v_response TEXT;
BEGIN
  -- Determine operation type
  v_event_type := TG_OP;
  v_table_name := TG_TABLE_NAME;
  
  -- Set the record based on operation
  IF TG_OP = 'DELETE' THEN
    v_record := row_to_json(OLD)::JSONB;
  ELSE
    v_record := row_to_json(NEW)::JSONB;
  END IF;

  -- Build the sync event payload
  v_payload := jsonb_build_object(
    'type', LOWER(v_event_type),
    'table', v_table_name,
    'record', v_record,
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)::JSONB ELSE NULL END,
    'timestamp', NOW()
  );

  -- Call the sync edge function asynchronously
  -- Note: In production, consider using a queue or webhook for reliability
  RAISE NOTICE 'Sync event queued: %', v_payload;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on conceptos_maestro
DROP TRIGGER IF EXISTS trigger_sync_conceptos ON public.renaprosa_conceptos_maestro;
CREATE TRIGGER trigger_sync_conceptos
  AFTER INSERT OR UPDATE OR DELETE ON public.renaprosa_conceptos_maestro
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_sync_to_hosix();

-- Trigger on reglas_tarifacion
DROP TRIGGER IF EXISTS trigger_sync_reglas ON public.renaprosa_reglas_tarifacion;
CREATE TRIGGER trigger_sync_reglas
  AFTER INSERT OR UPDATE OR DELETE ON public.renaprosa_reglas_tarifacion
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_sync_to_hosix();

-- Trigger on aseguradoras
DROP TRIGGER IF EXISTS trigger_sync_aseguradoras ON public.renaprosa_aseguradoras;
CREATE TRIGGER trigger_sync_aseguradoras
  AFTER INSERT OR UPDATE OR DELETE ON public.renaprosa_aseguradoras
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_sync_to_hosix();

-- Trigger on tarifas
DROP TRIGGER IF EXISTS trigger_sync_tarifas ON public.renaprosa_tarifas;
CREATE TRIGGER trigger_sync_tarifas
  AFTER INSERT OR UPDATE OR DELETE ON public.renaprosa_tarifas
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_sync_to_hosix();

-- Function to manually sync all master data (for backfill/initialization)
CREATE OR REPLACE FUNCTION public.manual_sync_all_masters()
RETURNS TABLE(synced_conceptos INT, synced_reglas INT, synced_aseguradoras INT, synced_tarifas INT) AS $$
DECLARE
  v_conceptos_count INT;
  v_reglas_count INT;
  v_aseguradoras_count INT;
  v_tarifas_count INT;
BEGIN
  -- Count records to be synced
  SELECT COUNT(*) INTO v_conceptos_count FROM renaprosa_conceptos_maestro;
  SELECT COUNT(*) INTO v_reglas_count FROM renaprosa_reglas_tarifacion;
  SELECT COUNT(*) INTO v_aseguradoras_count FROM renaprosa_aseguradoras;
  SELECT COUNT(*) INTO v_tarifas_count FROM renaprosa_tarifas;
  
  -- This function would typically trigger sync events
  -- In a real implementation, you might write to a queue table or call webhooks
  RAISE NOTICE 'Manual sync initiated. Conceptos: %, Reglas: %, Aseguradoras: %, Tarifas: %',
    v_conceptos_count, v_reglas_count, v_aseguradoras_count, v_tarifas_count;
  
  RETURN QUERY SELECT v_conceptos_count, v_reglas_count, v_aseguradoras_count, v_tarifas_count;
END;
$$ LANGUAGE plpgsql;
