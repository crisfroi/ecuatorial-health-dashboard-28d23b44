ALTER TABLE profesionales_sanitarios
ADD COLUMN IF NOT EXISTS numero_tarjeta_rfid VARCHAR(10);

CREATE INDEX IF NOT EXISTS idx_profesionales_rfid
ON profesionales_sanitarios (numero_tarjeta_rfid)
WHERE numero_tarjeta_rfid IS NOT NULL;
