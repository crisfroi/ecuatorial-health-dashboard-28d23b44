import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  initLocalDatabase,
  listPendingOutbox,
  markOutboxConflict,
  markOutboxDone,
  markOutboxRetry,
  getLastPulledAt,
  setLastPulledAt,
  upsertLocalRows,
  listPendingStorage,
  markStorageDone,
  markStorageRetry,
} from '@/lib/localDb';

function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

async function pushOnce(): Promise<void> {
  const pending = await listPendingOutbox(100);
  for (const item of pending) {
    try {
      if (item.op === 'insert') {
        const { error } = await supabase.from(item.table).insert(item.payload as any);
        if (error) throw error;
      } else if (item.op === 'update') {
        const { error } = await supabase.from(item.table).update(item.payload as any).eq('id', item.pk);
        if (error) throw error;
      } else if (item.op === 'delete') {
        const { error } = await supabase.from(item.table).update({ deleted_at: new Date().toISOString() } as any).eq('id', item.pk);
        if (error) throw error;
      }
      await markOutboxDone(item.id);
    } catch (e: any) {
      const msg = e?.message || 'push error';
      if (String(e?.code || '').toUpperCase() === '409' || msg.includes('version')) {
        await markOutboxConflict(item.id, msg);
      } else {
        await markOutboxRetry(item.id, msg);
      }
    }
  }

  // Push storage uploads
  const storageItems = await listPendingStorage(10);
  for (const s of storageItems) {
    try {
      const buffer = Uint8Array.from(atob(s.data_base64), c => c.charCodeAt(0));
      const { error } = await supabase.storage
        .from(s.bucket)
        .upload(s.target_path, buffer as any, { contentType: s.mime_type || undefined, upsert: true });
      if (error) throw error;
      await markStorageDone(s.id);
    } catch (e: any) {
      await markStorageRetry(s.id, e?.message || 'storage push error');
    }
  }
}

async function pullOnce(tables: string[]): Promise<void> {
  const nowIso = new Date().toISOString();
  for (const table of tables) {
    const since = await getLastPulledAt(table);
    const or = since ? `updated_at.gt.${since},deleted_at.gt.${since}` : undefined;
    const query = supabase.from(table).select('*');
    const { data, error } = or ? await query.or(or) : await query.select('*');
    if (!error && Array.isArray(data)) {
      await upsertLocalRows(table, data);
      await setLastPulledAt(table, nowIso);
    }
  }
}

export function useOfflineSync(options?: { intervalMs?: number; tables?: string[] }) {
  const intervalMs = options?.intervalMs ?? 90_000;
  const tables = options?.tables ?? ['profesionales_sanitarios', 'centros_salud'];
  const syncingRef = useRef(false);
  const realtimeRef = useRef<any | null>(null);

  useEffect(() => {
    let timer: any;
    const start = async () => {
      await initLocalDatabase();
      // Setup realtime for tables when online
      if (realtimeRef.current) {
        try { realtimeRef.current.unsubscribe(); } catch {}
        realtimeRef.current = null;
      }
      try {
        const channel = supabase.channel('offline-sync', { config: { broadcast: { self: false }, presence: { key: 'offline-client' } } });
        tables.forEach((t) => {
          channel.on('postgres_changes', { event: '*', schema: 'public', table: t }, async (payload) => {
            try {
              const row: any = payload.new ?? payload.old;
              if (!row) return;
              await upsertLocalRows(t, [row]);
            } catch {}
          });
        });
        realtimeRef.current = channel.subscribe();
      } catch {}
      const tick = async () => {
        if (syncingRef.current || !isOnline()) return;
        syncingRef.current = true;
        try {
          await pushOnce();
          await pullOnce(tables);
        } finally {
          syncingRef.current = false;
        }
      };
      await tick();
      timer = setInterval(tick, intervalMs);
    };
    start();
    return () => {
      if (timer) clearInterval(timer);
      try { realtimeRef.current?.unsubscribe?.(); } catch {}
    };
  }, [intervalMs, tables.join(',')]);
}

