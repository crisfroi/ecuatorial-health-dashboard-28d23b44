-- Create biometric_sync_logs table to track sync activity
create table if not exists biometric_sync_logs (
  id bigserial primary key,
  device_sn text not null,
  status text not null check (status in ('success', 'error')),
  records_synced integer not null default 0,
  error_message text,
  synced_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for faster queries
create index if not exists idx_biometric_sync_logs_device_sn on biometric_sync_logs(device_sn);
create index if not exists idx_biometric_sync_logs_synced_at on biometric_sync_logs(synced_at desc);
create index if not exists idx_biometric_sync_logs_status on biometric_sync_logs(status);

-- Add RLS policies
alter table biometric_sync_logs enable row level security;

-- Allow authenticated users to read sync logs
create policy "Allow authenticated users to read sync logs"
  on biometric_sync_logs for select
  using (auth.role() = 'authenticated');

-- Allow service role to insert logs (from Edge Functions)
create policy "Allow service role to insert sync logs"
  on biometric_sync_logs for insert
  with check (true);

-- Extend attendance_logs table with biometric-specific fields if they don't exist
alter table attendance_logs
add column if not exists source text default 'manual',
add column if not exists sync_timestamp timestamp with time zone,
add column if not exists temperatura numeric,
add column if not exists imagen_url text;

-- Create index for biometric source logs
create index if not exists idx_attendance_logs_source on attendance_logs(source) 
where source = 'biometric_sdk';
