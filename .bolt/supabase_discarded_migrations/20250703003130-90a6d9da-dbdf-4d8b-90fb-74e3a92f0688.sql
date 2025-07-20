-- Crear bucket para fotos de carnet si no existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('fotos-carnet', 'fotos-carnet', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para el bucket de fotos carnet
CREATE POLICY "Permitir lectura pública de fotos carnet"
ON storage.objects FOR SELECT
USING (bucket_id = 'fotos-carnet');

CREATE POLICY "Permitir subida de fotos carnet"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'fotos-carnet');

CREATE POLICY "Permitir actualización de fotos carnet"
ON storage.objects FOR UPDATE
USING (bucket_id = 'fotos-carnet');