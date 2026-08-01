# HOSIX Separation

This directory contains the HOSIX-specific Supabase client boundary for the application.

## What changed

- `src/integrations/supabase/client.ts` now routes `/hosix/*` browser traffic to a dedicated HOSIX client.
- `src/integrations/supabase/hosixClient.ts` contains a separate Supabase connection for HOSIX.
- `.env.example` now includes `VITE_HOSIX_SUPABASE_URL` and `VITE_HOSIX_SUPABASE_ANON_KEY`.

## Environment variables

- `VITE_HOSIX_SUPABASE_URL`
- `VITE_HOSIX_SUPABASE_ANON_KEY`

If these are not provided, HOSIX falls back to the general `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Runtime behavior

- When the browser path starts with `/hosix`, the shared `supabase` export will use the HOSIX client.
- Non-HOSIX routes continue to use the primary shared Supabase client.
