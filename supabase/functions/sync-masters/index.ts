import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SyncEvent {
  type: "insert" | "update" | "delete";
  table: "renaprosa_conceptos_maestro" | "renaprosa_reglas_tarifacion" | "renaprosa_aseguradoras" | "renaprosa_tarifas";
  record: any;
  old_record?: any;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const event: SyncEvent = await req.json();
    
    const renaprosaUrl = Deno.env.get("RENAPROSA_URL");
    const renaprosaAnonKey = Deno.env.get("RENAPROSA_ANON_KEY");
    const hosixUrl = Deno.env.get("HOSIX_URL");
    const hosixServiceKey = Deno.env.get("HOSIX_SERVICE_ROLE_KEY");

    if (!renaprosaUrl || !renaprosaAnonKey || !hosixUrl || !hosixServiceKey) {
      throw new Error("Missing environment variables for sync");
    }

    const hosixClient = createClient(hosixUrl, hosixServiceKey);

    console.log(`[SYNC] Processing ${event.type} event for table ${event.table}`);

    // Determine target replica table in HOSIX
    const replicaTableMap: Record<string, string> = {
      "renaprosa_conceptos_maestro": "hosix_replica_conceptos_maestro",
      "renaprosa_reglas_tarifacion": "hosix_replica_reglas_tarifacion",
      "renaprosa_aseguradoras": "hosix_replica_aseguradoras",
      "renaprosa_tarifas": "hosix_replica_tarifas",
    };

    const replicaTable = replicaTableMap[event.table];
    if (!replicaTable) {
      throw new Error(`No replica table mapping for ${event.table}`);
    }

    let result;

    if (event.type === "insert") {
      // For inserts, copy the record with source tracking
      const insertPayload = {
        ...event.record,
        synced_at: new Date().toISOString(),
        synced_from: "RENAPROSA",
      };

      const { error } = await hosixClient
        .from(replicaTable)
        .insert([insertPayload]);

      if (error) {
        console.error(`[SYNC] Insert error:`, error);
        throw error;
      }

      result = { synced: true, operation: "insert", table: replicaTable };
    } else if (event.type === "update") {
      // For updates, update the replica record
      const updatePayload = {
        ...event.record,
        synced_at: new Date().toISOString(),
      };

      const { error } = await hosixClient
        .from(replicaTable)
        .update(updatePayload)
        .eq("id", event.record.id);

      if (error) {
        console.error(`[SYNC] Update error:`, error);
        throw error;
      }

      result = { synced: true, operation: "update", table: replicaTable };
    } else if (event.type === "delete") {
      // For deletes, soft-delete or mark as deleted (if supported)
      const { error } = await hosixClient
        .from(replicaTable)
        .delete()
        .eq("id", event.record.id);

      if (error) {
        console.error(`[SYNC] Delete error:`, error);
        throw error;
      }

      result = { synced: true, operation: "delete", table: replicaTable };
    }

    // Log the sync event
    const { error: logError } = await hosixClient
      .from("hosix_sync_log")
      .insert([
        {
          tabla_origen: event.table,
          tabla_destino: replicaTable,
          tipo_operacion: event.type,
          record_id: event.record.id,
          estado: "completado",
          timestamp: new Date().toISOString(),
        },
      ]);

    if (logError) {
      console.warn("[SYNC] Log error (non-critical):", logError);
    }

    console.log("[SYNC] Success:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[SYNC] Error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
