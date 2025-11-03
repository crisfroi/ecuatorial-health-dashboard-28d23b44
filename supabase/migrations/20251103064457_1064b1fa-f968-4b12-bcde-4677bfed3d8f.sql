-- Crear tablas necesarias para el SDK Flask de dispositivos biométricos
-- Estas tablas permiten que el SDK se comunique con los dispositivos

-- Tabla de dispositivos (equivalente a la tabla device del SDK)
CREATE TABLE IF NOT EXISTS public.device (
  id SERIAL PRIMARY KEY,
  serial_num VARCHAR(80) UNIQUE NOT NULL,
  status INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de personas (usuarios del sistema biométrico)
CREATE TABLE IF NOT EXISTS public.person (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  roll_id INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de información de registro biométrico
CREATE TABLE IF NOT EXISTS public.enroll_info (
  id SERIAL PRIMARY KEY,
  enroll_id INTEGER NOT NULL REFERENCES public.person(id) ON DELETE CASCADE,
  backupnum INTEGER NOT NULL,
  signatures TEXT,
  imagepath VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(enroll_id, backupnum)
);

-- Tabla de registros de asistencia desde dispositivo
CREATE TABLE IF NOT EXISTS public.record (
  id SERIAL PRIMARY KEY,
  enroll_id INTEGER,
  mode INTEGER,
  int_out INTEGER,
  event INTEGER,
  verify_mode INTEGER,
  year INTEGER,
  month INTEGER,
  day INTEGER,
  hour INTEGER,
  minute INTEGER,
  second INTEGER,
  workcode INTEGER,
  reserved INTEGER,
  device_serial_num VARCHAR(80),
  record_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de comandos para enviar a dispositivos
CREATE TABLE IF NOT EXISTS public.machine_command (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  status INTEGER DEFAULT 0,
  send_status INTEGER DEFAULT 0,
  err_count INTEGER DEFAULT 0,
  serial VARCHAR(80),
  content TEXT,
  gmt_crate TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  gmt_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de días de acceso
CREATE TABLE IF NOT EXISTS public.access_day (
  id INTEGER PRIMARY KEY,
  time1_start VARCHAR(20),
  time1_end VARCHAR(20),
  time2_start VARCHAR(20),
  time2_end VARCHAR(20),
  time3_start VARCHAR(20),
  time3_end VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de semanas de acceso
CREATE TABLE IF NOT EXISTS public.access_week (
  id INTEGER PRIMARY KEY,
  sun INTEGER,
  mon INTEGER,
  tue INTEGER,
  wed INTEGER,
  thu INTEGER,
  fri INTEGER,
  sat INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de grupos de bloqueo
CREATE TABLE IF NOT EXISTS public.lock_group (
  id INTEGER PRIMARY KEY,
  access_week_id INTEGER,
  lock1 INTEGER,
  lock2 INTEGER,
  lock3 INTEGER,
  lock4 INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de bloqueos de usuario
CREATE TABLE IF NOT EXISTS public.user_lock (
  id SERIAL PRIMARY KEY,
  enroll_id INTEGER REFERENCES public.person(id) ON DELETE CASCADE,
  lock_group_id INTEGER,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_device_serial_num ON public.device(serial_num);
CREATE INDEX IF NOT EXISTS idx_enroll_info_enroll_id ON public.enroll_info(enroll_id);
CREATE INDEX IF NOT EXISTS idx_record_enroll_id ON public.record(enroll_id);
CREATE INDEX IF NOT EXISTS idx_record_device_serial ON public.record(device_serial_num);
CREATE INDEX IF NOT EXISTS idx_record_time ON public.record(record_time);
CREATE INDEX IF NOT EXISTS idx_machine_command_serial ON public.machine_command(serial);
CREATE INDEX IF NOT EXISTS idx_machine_command_status ON public.machine_command(status, send_status);

-- RLS para seguridad (permitir acceso a usuarios autenticados)
ALTER TABLE public.device ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enroll_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_command ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir todo a usuarios autenticados por ahora)
CREATE POLICY "Allow authenticated users full access to device"
  ON public.device FOR ALL
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow authenticated users full access to person"
  ON public.person FOR ALL
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow authenticated users full access to enroll_info"
  ON public.enroll_info FOR ALL
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow authenticated users full access to record"
  ON public.record FOR ALL
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow authenticated users full access to machine_command"
  ON public.machine_command FOR ALL
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Trigger para actualizar updated_at en device
CREATE OR REPLACE FUNCTION update_device_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER device_updated_at_trigger
  BEFORE UPDATE ON public.device
  FOR EACH ROW
  EXECUTE FUNCTION update_device_updated_at();