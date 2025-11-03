-- Create records table for biometric device attendance data
-- This table stores raw attendance records from biometric devices

CREATE TABLE IF NOT EXISTS public.records (
  id SERIAL PRIMARY KEY,
  enroll_id BIGINT NOT NULL,
  records_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  mode INTEGER NOT NULL,
  "intOut" INTEGER NOT NULL,
  event INTEGER NOT NULL,
  device_serial_num VARCHAR(50),
  temperature DOUBLE PRECISION,
  image VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_records_enroll_id ON public.records(enroll_id);
CREATE INDEX IF NOT EXISTS idx_records_time ON public.records(records_time DESC);
CREATE INDEX IF NOT EXISTS idx_records_device_sn ON public.records(device_serial_num);
CREATE INDEX IF NOT EXISTS idx_records_created_at ON public.records(created_at DESC);

-- Enable RLS
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read records
DROP POLICY IF EXISTS "Allow authenticated users to read records" ON public.records;
CREATE POLICY "Allow authenticated users to read records"
  ON public.records FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Allow service role to insert records (from Flask API)
DROP POLICY IF EXISTS "Allow service role to insert records" ON public.records;
CREATE POLICY "Allow service role to insert records"
  ON public.records FOR INSERT
  WITH CHECK (true);

-- Policy: Allow service role to update records
DROP POLICY IF EXISTS "Allow service role to update records" ON public.records;
CREATE POLICY "Allow service role to update records"
  ON public.records FOR UPDATE
  USING (true) WITH CHECK (true);
