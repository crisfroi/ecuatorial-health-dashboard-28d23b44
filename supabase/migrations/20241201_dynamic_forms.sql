-- Migración para sistema de formularios dinámicos
-- Fecha: 2024-12-01

-- Tabla para formularios dinámicos
CREATE TABLE IF NOT EXISTS dynamic_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'otros',
    fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    public_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    submissions_count INTEGER DEFAULT 0
);

-- Tabla para envíos de formularios
CREATE TABLE IF NOT EXISTS form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES dynamic_forms(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    submitted_by UUID REFERENCES auth.users(id),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabla para indicadores de profesionales
CREATE TABLE IF NOT EXISTS professional_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('text', 'number', 'date', 'boolean', 'select', 'multiselect', 'file', 'json')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('personal', 'profesional', 'academico', 'laboral', 'certificaciones', 'sanciones', 'reconocimientos', 'experiencia', 'idiomas', 'publicaciones', 'proyectos', 'otros')),
    description TEXT,
    form_id UUID REFERENCES dynamic_forms(id) ON DELETE SET NULL,
    is_required BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    validation JSONB DEFAULT '{}'::jsonb,
    options JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para valores de indicadores de profesionales
CREATE TABLE IF NOT EXISTS professional_indicator_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
    indicator_id UUID NOT NULL REFERENCES professional_indicators(id) ON DELETE CASCADE,
    value JSONB,
    submission_id UUID REFERENCES form_submissions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(professional_id, indicator_id)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_dynamic_forms_category ON dynamic_forms(category);
CREATE INDEX IF NOT EXISTS idx_dynamic_forms_created_by ON dynamic_forms(created_by);
CREATE INDEX IF NOT EXISTS idx_dynamic_forms_is_active ON dynamic_forms(is_active);
CREATE INDEX IF NOT EXISTS idx_dynamic_forms_public_url ON dynamic_forms USING GIN ((public_settings->>'public_url'));

CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_by ON form_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at ON form_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);

CREATE INDEX IF NOT EXISTS idx_professional_indicators_category ON professional_indicators(category);
CREATE INDEX IF NOT EXISTS idx_professional_indicators_type ON professional_indicators(type);
CREATE INDEX IF NOT EXISTS idx_professional_indicators_order ON professional_indicators(order_index);

CREATE INDEX IF NOT EXISTS idx_professional_indicator_values_professional_id ON professional_indicator_values(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_indicator_values_indicator_id ON professional_indicator_values(indicator_id);

-- Políticas RLS para dynamic_forms
ALTER TABLE dynamic_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dynamic_forms_select_policy" ON dynamic_forms
    FOR SELECT USING (
        is_active = true OR 
        auth.role() = 'service_role' OR
        (created_by = auth.uid() AND auth.role() = 'authenticated')
    );

CREATE POLICY "dynamic_forms_insert_policy" ON dynamic_forms
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND created_by = auth.uid())
    );

CREATE POLICY "dynamic_forms_update_policy" ON dynamic_forms
    FOR UPDATE USING (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND created_by = auth.uid())
    );

CREATE POLICY "dynamic_forms_delete_policy" ON dynamic_forms
    FOR DELETE USING (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND created_by = auth.uid())
    );

-- Políticas RLS para form_submissions
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "form_submissions_select_policy" ON form_submissions
    FOR SELECT USING (
        auth.role() = 'service_role' OR
        submitted_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM dynamic_forms 
            WHERE dynamic_forms.id = form_submissions.form_id 
            AND dynamic_forms.created_by = auth.uid()
        )
    );

CREATE POLICY "form_submissions_insert_policy" ON form_submissions
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role' OR
        submitted_by = auth.uid()
    );

CREATE POLICY "form_submissions_update_policy" ON form_submissions
    FOR UPDATE USING (
        auth.role() = 'service_role' OR
        submitted_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM dynamic_forms 
            WHERE dynamic_forms.id = form_submissions.form_id 
            AND dynamic_forms.created_by = auth.uid()
        )
    );

-- Políticas RLS para professional_indicators
ALTER TABLE professional_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "professional_indicators_select_policy" ON professional_indicators
    FOR SELECT USING (
        auth.role() = 'service_role' OR
        auth.role() = 'authenticated'
    );

CREATE POLICY "professional_indicators_insert_policy" ON professional_indicators
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role' OR
        auth.role() = 'authenticated'
    );

CREATE POLICY "professional_indicators_update_policy" ON professional_indicators
    FOR UPDATE USING (
        auth.role() = 'service_role' OR
        auth.role() = 'authenticated'
    );

CREATE POLICY "professional_indicators_delete_policy" ON professional_indicators
    FOR DELETE USING (
        auth.role() = 'service_role' OR
        auth.role() = 'authenticated'
    );

-- Políticas RLS para professional_indicator_values
ALTER TABLE professional_indicator_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "professional_indicator_values_select_policy" ON professional_indicator_values
    FOR SELECT USING (
        auth.role() = 'service_role' OR
        auth.role() = 'authenticated'
    );

CREATE POLICY "professional_indicator_values_insert_policy" ON professional_indicator_values
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role' OR
        auth.role() = 'authenticated'
    );

CREATE POLICY "professional_indicator_values_update_policy" ON professional_indicator_values
    FOR UPDATE USING (
        auth.role() = 'service_role' OR
        auth.role() = 'authenticated'
    );

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_dynamic_forms_updated_at 
    BEFORE UPDATE ON dynamic_forms 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professional_indicators_updated_at 
    BEFORE UPDATE ON professional_indicators 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professional_indicator_values_updated_at 
    BEFORE UPDATE ON professional_indicator_values 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para incrementar contador de envíos
CREATE OR REPLACE FUNCTION increment_form_submissions_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE dynamic_forms 
    SET submissions_count = submissions_count + 1 
    WHERE id = NEW.form_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER increment_form_submissions_count_trigger
    AFTER INSERT ON form_submissions
    FOR EACH ROW EXECUTE FUNCTION increment_form_submissions_count();

-- Insertar algunos indicadores de ejemplo
INSERT INTO professional_indicators (name, type, category, description, is_required, is_visible, order_index) VALUES
('Condecoraciones recibidas', 'select', 'reconocimientos', 'Condecoraciones y reconocimientos oficiales recibidos', false, true, 1),
('Cargos desempeñados', 'json', 'laboral', 'Historial de cargos y posiciones desempeñadas', false, true, 2),
('Sanciones disciplinarias', 'json', 'sanciones', 'Registro de sanciones o medidas disciplinarias', false, true, 3),
('Certificaciones adicionales', 'multiselect', 'certificaciones', 'Certificaciones profesionales adicionales', false, true, 4),
('Idiomas dominados', 'json', 'idiomas', 'Idiomas que domina el profesional', false, true, 5),
('Publicaciones científicas', 'json', 'publicaciones', 'Artículos y publicaciones científicas', false, true, 6),
('Proyectos de investigación', 'json', 'proyectos', 'Proyectos de investigación participados', false, true, 7),
('Experiencia internacional', 'boolean', 'experiencia', 'Tiene experiencia trabajando en el extranjero', false, true, 8),
('Fecha de cese', 'date', 'laboral', 'Fecha en que cesó en su último puesto', false, true, 9),
('Motivo de cese', 'select', 'laboral', 'Motivo por el cual cesó en su último puesto', false, true, 10);

-- Actualizar opciones para los indicadores de tipo select
UPDATE professional_indicators 
SET options = '[
    {"id": "1", "label": "Orden del Mérito Civil", "value": "merito_civil"},
    {"id": "2", "label": "Medalla al Mérito Sanitario", "value": "merito_sanitario"},
    {"id": "3", "label": "Distinción Ministerial", "value": "distincion_ministerial"},
    {"id": "4", "label": "Otro", "value": "otro"}
]'::jsonb
WHERE name = 'Condecoraciones recibidas';

UPDATE professional_indicators 
SET options = '[
    {"id": "1", "label": "Jubilación", "value": "jubilacion"},
    {"id": "2", "label": "Renuncia voluntaria", "value": "renuncia"},
    {"id": "3", "label": "Despido", "value": "despido"},
    {"id": "4", "label": "Contrato vencido", "value": "contrato_vencido"},
    {"id": "5", "label": "Reestructuración", "value": "reestructuracion"},
    {"id": "6", "label": "Otro", "value": "otro"}
]'::jsonb
WHERE name = 'Motivo de cese';

UPDATE professional_indicators 
SET options = '[
    {"id": "1", "label": "Certificación ISO 9001", "value": "iso_9001"},
    {"id": "2", "label": "Certificación en Gestión de Calidad", "value": "gestion_calidad"},
    {"id": "3", "label": "Certificación en Seguridad del Paciente", "value": "seguridad_paciente"},
    {"id": "4", "label": "Certificación en Liderazgo Sanitario", "value": "liderazgo_sanitario"},
    {"id": "5", "label": "Certificación en Telemedicina", "value": "telemedicina"},
    {"id": "6", "label": "Otro", "value": "otro"}
]'::jsonb
WHERE name = 'Certificaciones adicionales';

