import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface SyncRequest {
  deviceSn?: string;
  deviceUrl?: string;
  action: "sync" | "get-devices" | "get-records" | "get-status";
}

interface BiometricRecord {
  id: string;
  enroll_id: number;
  records_time: string;
  mode?: number;
  int_out?: number;
  event?: number;
  device_serial_num: string;
  temperature?: number;
  image?: string;
}

// Proxy calls to the Qiandao SDK running on Render
async function callSdkEndpoint(
  deviceUrl: string,
  endpoint: string
): Promise<any> {
  try {
    const fullUrl = `${deviceUrl}/api/${endpoint}`;
    console.log(`Calling SDK endpoint: ${fullUrl}`);

    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`SDK API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error calling SDK endpoint:`, error);
    throw error;
  }
}

// Sync records from device to Supabase
async function syncRecords(
  supabase: any,
  deviceUrl: string,
  deviceSn: string
): Promise<{ synced: number; error?: string }> {
  try {
    // Get records from SDK
    const sdkResponse = await callSdkEndpoint(deviceUrl, "record");

    if (!sdkResponse?.data) {
      return { synced: 0, error: "No records returned from SDK" };
    }

    // Get dispositivo ID from device serial
    const { data: dispositivo } = await supabase
      .from("dispositivos")
      .select("id")
      .eq("nombre", deviceSn || "default")
      .single();

    const dispositivoId = dispositivo?.id;

    // Transform and insert into attendance_logs
    const records: BiometricRecord[] = sdkResponse.data;
    const logs = records
      .filter((r) => r.device_serial_num === deviceSn || !deviceSn)
      .map((r) => ({
        id_dispositivo: dispositivoId || deviceSn,
        id_profesional: null, // Will be linked via empleado_dispositivo_map later
        en_no: `${r.enroll_id}`,
        inout: r.int_out === 1 ? "IN" : r.int_out === 0 ? "OUT" : null,
        mode: `${r.mode || 0}`,
        fecha_hora: r.records_time,
        raw_line: JSON.stringify(r),
        source_file: "biometric_sdk",
        tm_no: deviceSn,
        created_at: new Date().toISOString(),
      }));

    if (logs.length === 0) {
      return { synced: 0 };
    }

    // Insert records (allow duplicates to be handled by existence check)
    // Use INSERT without conflict strategy to avoid overwriting manual imports
    const { data, error } = await supabase
      .from("attendance_logs")
      .insert(logs, { ignoreDuplicates: true });

    if (error && error.code !== "23505") {
      // 23505 is duplicate key error - that's OK
      console.error("Insert error:", error);
      return { synced: logs.length, error: error.message };
    }

    return { synced: logs.length };
  } catch (error: any) {
    console.error("Sync error:", error);
    return { synced: 0, error: error.message };
  }
}

// Log sync activity
async function logSyncActivity(
  supabase: any,
  deviceSn: string,
  status: string,
  recordsCount: number,
  error?: string
): Promise<void> {
  try {
    await supabase.from("biometric_sync_logs").insert({
      device_sn: deviceSn,
      status: status,
      records_synced: recordsCount,
      error_message: error || null,
      synced_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to log sync activity:", err);
  }
}

async function handler(req: Request): Promise<Response> {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { deviceSn, deviceUrl, action } = (await req.json()) as SyncRequest;

    // Validate required fields
    if (!deviceUrl) {
      return new Response(
        JSON.stringify({
          error: "Missing required field: deviceUrl",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let result: any = {};

    switch (action) {
      case "sync": {
        const sn = deviceSn || "default";
        console.log(`Starting sync for device: ${sn}`);

        const syncResult = await syncRecords(supabase, deviceUrl, sn);
        result = syncResult;

        // Log the sync activity
        await logSyncActivity(
          supabase,
          sn,
          syncResult.error ? "error" : "success",
          syncResult.synced,
          syncResult.error
        );
        break;
      }

      case "get-devices": {
        const response = await callSdkEndpoint(deviceUrl, "device");
        result = { devices: response.data || [] };
        break;
      }

      case "get-records": {
        const sn = deviceSn || "";
        const endpoint = sn
          ? `record?deviceSn=${encodeURIComponent(sn)}`
          : "record";
        const response = await callSdkEndpoint(deviceUrl, endpoint);
        result = { records: response.data || [] };
        break;
      }

      case "get-status": {
        const devicesResponse = await callSdkEndpoint(deviceUrl, "device");
        result = {
          status: "connected",
          devices: (devicesResponse.data || []).length,
          timestamp: new Date().toISOString(),
        };
        break;
      }

      default: {
        return new Response(
          JSON.stringify({
            error: `Unknown action: ${action}`,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Handler error:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

Deno.serve(handler);
