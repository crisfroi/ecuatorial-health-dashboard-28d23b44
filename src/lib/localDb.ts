import type { Database as SupabaseDatabase } from '@/integrations/supabase/types';

export type SyncTableName = keyof SupabaseDatabase['public']['Tables'];

export type OutboxOperation = 'insert' | 'update' | 'delete';

export interface OutboxItem {
  id: string;
  table: SyncTableName | string;
  op: OutboxOperation;
  pk: string;
  version?: number | null;
  payload?: unknown;
  createdAt: string;
  status: 'pending' | 'done' | 'conflict' | 'error';
  errorMessage?: string | null;
}

export interface SyncMetaRow {
  table: string;
  lastPulledAt: string | null;
}

export interface LocalRecordBase {
  id: string;
  updated_at?: string | null;
  version?: number | null;
  deleted_at?: string | null;
}

export const LOCAL_DB_URL = 'sqlite:renaprosa.db';

// Tauri SQL types at runtime
// We import dynamically to avoid breaking non-Tauri environments
let dbPromise: Promise<any> | null = null;

export function isTauri(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__TAURI__;
}

async function getDb(): Promise<any> {
  if (!dbPromise) {
    if (!isTauri()) {
      throw new Error('Local DB not available outside Tauri runtime');
    }
    try {
      const importSql = new Function("return import('@tauri-apps/plugin-sql')");
      const mod: any = await importSql();
      const Database = (mod?.default ?? mod);
      dbPromise = Database.load(LOCAL_DB_URL);
    } catch (e) {
      throw new Error(`Failed to load Tauri SQL plugin: ${e}`);
    }
  }
  return dbPromise;
}

export async function initLocalDatabase(): Promise<void> {
  const db = await getDb();
  await db.execute(
    `CREATE TABLE IF NOT EXISTS sync_meta (
      table_name TEXT PRIMARY KEY,
      last_pulled_at TEXT
    )`
  );

  await db.execute(
    `CREATE TABLE IF NOT EXISTS outbox (
      id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL,
      op TEXT NOT NULL,
      pk TEXT NOT NULL,
      version INTEGER,
      payload TEXT,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      error_message TEXT
    )`
  );

  await db.execute(
    `CREATE TABLE IF NOT EXISTS local_cache (
      table_name TEXT NOT NULL,
      id TEXT NOT NULL,
      json TEXT NOT NULL,
      updated_at TEXT,
      deleted_at TEXT,
      PRIMARY KEY (table_name, id)
    )`
  );

  await db.execute(
    `CREATE TABLE IF NOT EXISTS storage_outbox (
      id TEXT PRIMARY KEY,
      bucket TEXT NOT NULL,
      target_path TEXT NOT NULL,
      mime_type TEXT,
      data_base64 TEXT NOT NULL,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      error_message TEXT
    )`
  );
}

export async function getLastPulledAt(table: string): Promise<string | null> {
  const db = await getDb();
  const rows = await db.select(
    `SELECT last_pulled_at FROM sync_meta WHERE table_name = ?`,
    [table]
  );
  return rows?.[0]?.last_pulled_at ?? null;
}

export async function setLastPulledAt(table: string, iso: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO sync_meta (table_name, last_pulled_at)
     VALUES (?, ?)
     ON CONFLICT(table_name) DO UPDATE SET last_pulled_at=excluded.last_pulled_at`,
    [table, iso]
  );
}

export async function enqueueOutbox(item: Omit<OutboxItem, 'status'>): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO outbox (id, table_name, op, pk, version, payload, created_at, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      item.id,
      item.table,
      item.op,
      item.pk,
      item.version ?? null,
      item.payload ? JSON.stringify(item.payload) : null,
      item.createdAt,
    ]
  );
}

export async function listPendingOutbox(limit = 100): Promise<OutboxItem[]> {
  const db = await getDb();
  const rows = await db.select(
    `SELECT id, table_name, op, pk, version, payload, created_at, status, error_message
     FROM outbox WHERE status = 'pending' ORDER BY created_at ASC LIMIT ?`,
    [limit]
  );
  return (rows || []).map((r: any) => ({
    id: String(r.id),
    table: String(r.table_name),
    op: r.op as OutboxOperation,
    pk: String(r.pk),
    version: r.version == null ? null : Number(r.version),
    payload: r.payload ? JSON.parse(String(r.payload)) : undefined,
    createdAt: String(r.created_at),
    status: r.status,
    errorMessage: r.error_message ?? null,
  }));
}

export async function markOutboxDone(id: string): Promise<void> {
  const db = await getDb();
  await db.execute(`UPDATE outbox SET status = 'done', error_message = NULL WHERE id = ?`, [id]);
}

export async function markOutboxConflict(id: string, message?: string): Promise<void> {
  const db = await getDb();
  await db.execute(`UPDATE outbox SET status = 'conflict', error_message = ? WHERE id = ?`, [message ?? null, id]);
}

export async function markOutboxRetry(id: string, message?: string): Promise<void> {
  const db = await getDb();
  await db.execute(`UPDATE outbox SET status = 'pending', error_message = ? WHERE id = ?`, [message ?? null, id]);
}

export async function clearDoneOutbox(olderThanIso?: string): Promise<void> {
  const db = await getDb();
  if (olderThanIso) {
    await db.execute(`DELETE FROM outbox WHERE status = 'done' AND created_at < ?`, [olderThanIso]);
  } else {
    await db.execute(`DELETE FROM outbox WHERE status = 'done'`);
  }
}

export async function upsertLocalRows(table: string, rows: any[]): Promise<void> {
  const db = await getDb();
  for (const row of rows) {
    const id = String(row.id);
    const updatedAt = row.updated_at ?? null;
    const deletedAt = row.deleted_at ?? null;
    await db.execute(
      `INSERT INTO local_cache (table_name, id, json, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(table_name, id) DO UPDATE SET json=excluded.json, updated_at=excluded.updated_at, deleted_at=excluded.deleted_at`,
      [table, id, JSON.stringify(row), updatedAt, deletedAt]
    );
  }
}

export async function getLocalRows<T = any>(table: string, includeDeleted = false): Promise<T[]> {
  const db = await getDb();
  const rows = await db.select<any>(
    includeDeleted
      ? `SELECT json FROM local_cache WHERE table_name = ?`
      : `SELECT json FROM local_cache WHERE table_name = ? AND (deleted_at IS NULL OR deleted_at = '')`,
    [table]
  );
  return (rows || []).map((r: any) => JSON.parse(String(r.json)) as T);
}

export interface StorageOutboxItem {
  id: string;
  bucket: string;
  target_path: string;
  mime_type?: string | null;
  data_base64: string;
  created_at: string;
  status: 'pending' | 'done' | 'error';
  error_message?: string | null;
}

export async function enqueueStorageUpload(params: {
  id: string;
  bucket: string;
  target_path: string;
  mime_type?: string | null;
  data_base64: string;
  created_at: string;
}): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO storage_outbox (id, bucket, target_path, mime_type, data_base64, created_at, status)
     VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
    [
      params.id,
      params.bucket,
      params.target_path,
      params.mime_type ?? null,
      params.data_base64,
      params.created_at,
    ]
  );
}

export async function listPendingStorage(limit = 20): Promise<StorageOutboxItem[]> {
  const db = await getDb();
  const rows = await db.select<any>(
    `SELECT id, bucket, target_path, mime_type, data_base64, created_at, status, error_message
     FROM storage_outbox WHERE status = 'pending' ORDER BY created_at ASC LIMIT ?`,
    [limit]
  );
  return (rows || []).map((r: any) => ({
    id: String(r.id),
    bucket: String(r.bucket),
    target_path: String(r.target_path),
    mime_type: r.mime_type ?? null,
    data_base64: String(r.data_base64),
    created_at: String(r.created_at),
    status: r.status,
    error_message: r.error_message ?? null,
  }));
}

export async function markStorageDone(id: string): Promise<void> {
  const db = await getDb();
  await db.execute(`UPDATE storage_outbox SET status = 'done', error_message = NULL WHERE id = ?`, [id]);
}

export async function markStorageRetry(id: string, message?: string): Promise<void> {
  const db = await getDb();
  await db.execute(`UPDATE storage_outbox SET status = 'pending', error_message = ? WHERE id = ?`, [message ?? null, id]);
}
