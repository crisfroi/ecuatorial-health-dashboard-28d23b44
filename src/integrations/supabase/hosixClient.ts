import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export const HOSIX_SUPABASE_URL =
  import.meta.env.VITE_HOSIX_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  'https://wdieynendfjbkbhfovrx.supabase.co';
export const HOSIX_SUPABASE_ANON_KEY =
  import.meta.env.VITE_HOSIX_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWV5bmVuZGZqYmtiaGZvdnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODI5MjEsImV4cCI6MjA2NjM1ODkyMX0.yFnLHavy8wzVjlg3sAI2mEG-XGDCV5FSr7OQsMefxL8';

if (!HOSIX_SUPABASE_URL) {
  console.error('❌ VITE_HOSIX_SUPABASE_URL or VITE_SUPABASE_URL is not defined');
  throw new Error('Missing HOSIX Supabase URL environment variable');
}

if (!HOSIX_SUPABASE_ANON_KEY) {
  console.error('❌ VITE_HOSIX_SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY is not defined');
  throw new Error('Missing HOSIX Supabase anon key environment variable');
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const resilientFetch: typeof fetch = async (input, init = {}) => {
  const maxAttempts = 3;
  const baseTimeoutMs = 12000;
  let lastError: any = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), baseTimeoutMs * (attempt + 1));

    try {
      const resp = await fetch(input, {
        ...init,
        cache: 'no-store',
        keepalive: true,
        signal: controller.signal,
        headers: {
          ...(init.headers || {}),
          'X-Client-Info': 'hosix-dashboard',
        },
        mode: 'cors',
      } as RequestInit);

      clearTimeout(timeout);

      if ([429, 502, 503, 504].includes(resp.status)) {
        lastError = new Error(`HTTP ${resp.status}`);
        await sleep(300 * (attempt + 1));
        continue;
      }

      return resp;
    } catch (err: any) {
      clearTimeout(timeout);
      lastError = err;
      const msg = err?.name === 'AbortError' ? 'Timeout' : err?.message || 'Failed to fetch';
      console.warn(`resilientFetch attempt ${attempt + 1}/${maxAttempts} -> ${msg}`);
      if (attempt < maxAttempts - 1) {
        await sleep(300 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('Unknown fetch error');
};

export const supabase = createClient<Database>(HOSIX_SUPABASE_URL, HOSIX_SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'hosix.supabase.auth.token',
    storage: window.localStorage,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'hosix-dashboard',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  fetch: resilientFetch,
});

export const hosixSupabase = supabase;

let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;

supabase.auth.onAuthStateChange((event, session) => {
  console.log('🔐 HOSIX auth state changed:', event, session?.user?.id ? 'User logged in' : 'No user');

  if (event === 'SIGNED_IN') {
    connectionAttempts = 0;
  }
});

export const executeSupabaseQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  context: string = 'Unknown HOSIX query'
): Promise<{ data: T | null; error: any }> => {
  try {
    console.log(`🔍 Executing HOSIX Supabase query: ${context}`);
    const startTime = Date.now();
    const result = await queryFn();
    const duration = Date.now() - startTime;
    console.log(`⏱️ HOSIX query "${context}" completed in ${duration}ms`);

    if (result.error) {
      console.error(`❌ HOSIX query "${context}" failed:`, result.error);
      connectionAttempts++;
      if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
        console.error(`🚨 Max HOSIX connection attempts (${MAX_CONNECTION_ATTEMPTS}) reached for context: ${context}`);
      }
    } else {
      connectionAttempts = 0;
    }

    return result;
  } catch (error: any) {
    console.error(`💥 HOSIX query "${context}" threw exception:`, error);
    connectionAttempts++;
    return {
      data: null,
      error: {
        message: error.message || 'Unknown error',
        details: error.stack || error.toString(),
        hint: 'Check network connectivity and HOSIX Supabase configuration',
        code: error.code || 'QUERY_EXCEPTION',
      },
    };
  }
};

export const getConnectionStatus = () => ({
  attempts: connectionAttempts,
  isHealthy: connectionAttempts < MAX_CONNECTION_ATTEMPTS,
  maxAttempts: MAX_CONNECTION_ATTEMPTS,
});
