-- ============================================================================
-- MIGRATION: 20260622_terminology_tables.sql
-- PURPOSE: Create canonical tables for SNOMED CT, LOINC, and AEMPS
-- DATE: 2026-06-22
-- PHASE: 0 (Base Terminológica)
-- ============================================================================

-- ============================================================================
-- SNOMED CT Tables
-- ============================================================================

-- SNOMED Concepts (diagnósticos, síntomas, procedimientos, etc.)
CREATE TABLE IF NOT EXISTS terminology.snomed_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id BIGINT NOT NULL UNIQUE,
  lang TEXT NOT NULL DEFAULT 'es' CHECK (lang IN ('es', 'en')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE terminology.snomed_concepts IS 'SNOMED CT concepts: diagnoses, findings, procedures, etc.';
COMMENT ON COLUMN terminology.snomed_concepts.concept_id IS 'SNOMED CT concept identifier (e.g., 73211009 for diabetes)';
COMMENT ON COLUMN terminology.snomed_concepts.lang IS 'Language code: es (Spanish), en (English)';

-- SNOMED Descriptions (terms/synonyms for concepts - from sct2_Description)
CREATE TABLE IF NOT EXISTS terminology.snomed_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id BIGINT NOT NULL REFERENCES terminology.snomed_concepts(concept_id) ON DELETE CASCADE,
  description_id BIGINT NOT NULL UNIQUE,
  term TEXT NOT NULL,
  description_type TEXT DEFAULT 'SYNONYM' CHECK (description_type IN ('FSN', 'PREFERRED', 'SYNONYM')),
  lang TEXT NOT NULL DEFAULT 'es' CHECK (lang IN ('es', 'en')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE terminology.snomed_descriptions IS 'SNOMED CT descriptions (terms/synonyms) from sct2_Description file. FSN = Fully Specified Name, PREFERRED = preferred term, SYNONYM = alternative names.';
COMMENT ON COLUMN terminology.snomed_descriptions.term IS 'Term text: name, synonym, or FSN';

-- SNOMED Text Definitions (formal clinical definitions - from sct2_TextDefinition)
CREATE TABLE IF NOT EXISTS terminology.snomed_text_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id BIGINT NOT NULL REFERENCES terminology.snomed_concepts(concept_id) ON DELETE CASCADE,
  definition_id BIGINT NOT NULL UNIQUE,
  term TEXT NOT NULL,
  lang TEXT NOT NULL DEFAULT 'es' CHECK (lang IN ('es', 'en')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE terminology.snomed_text_definitions IS 'SNOMED CT text definitions from sct2_TextDefinition file. Contains formal clinical definitions for concepts.';
COMMENT ON COLUMN terminology.snomed_text_definitions.term IS 'Formal clinical definition text';

-- SNOMED Relationships (hierarchy, synonymy, etc.)
CREATE TABLE IF NOT EXISTS terminology.snomed_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_concept_id BIGINT NOT NULL REFERENCES terminology.snomed_concepts(concept_id) ON DELETE CASCADE,
  target_concept_id BIGINT NOT NULL REFERENCES terminology.snomed_concepts(concept_id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE terminology.snomed_relationships IS 'SNOMED CT relationships: is-a (parent), finding-site, associated-morphology, etc.';

-- ============================================================================
-- LOINC Tables (Laboratory tests)
-- ============================================================================

CREATE TABLE IF NOT EXISTS terminology.loinc_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loinc_num TEXT NOT NULL UNIQUE,
  component TEXT,
  property TEXT,
  time_aspect TEXT,
  system TEXT,
  scale_type TEXT,
  method_type TEXT,
  class_code TEXT,
  shortname TEXT,
  long_common_name TEXT,
  related_names TEXT,
  linguistic_variant_es TEXT,
  linguistic_variant_mx TEXT,
  linguistic_variant_ar TEXT,
  variant_sources TEXT,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DEPRECATED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE terminology.loinc_codes IS 'LOINC codes for laboratory tests, observations, and clinical measurements. Includes unified Spanish linguistic variants from España (esES12), México (esMX28), and Argentina (esAR7).';
COMMENT ON COLUMN terminology.loinc_codes.loinc_num IS 'LOINC unique identifier (e.g., 2345-7 for glucose)';
COMMENT ON COLUMN terminology.loinc_codes.component IS 'The analyte or object being measured (Component PART)';
COMMENT ON COLUMN terminology.loinc_codes.property IS 'The characteristic being measured (Property PART)';
COMMENT ON COLUMN terminology.loinc_codes.time_aspect IS 'Timing of the measurement (Time PART)';
COMMENT ON COLUMN terminology.loinc_codes.system IS 'Specimen or sample type (System PART)';
COMMENT ON COLUMN terminology.loinc_codes.scale_type IS 'Type of scale (Quantitative, Ordinal, Nominal, etc.) (Scale PART)';
COMMENT ON COLUMN terminology.loinc_codes.method_type IS 'The method of measurement (Method PART)';
COMMENT ON COLUMN terminology.loinc_codes.linguistic_variant_es IS 'Spanish translation for Spain (esES12)';
COMMENT ON COLUMN terminology.loinc_codes.linguistic_variant_mx IS 'Spanish translation for Mexico (esMX28)';
COMMENT ON COLUMN terminology.loinc_codes.linguistic_variant_ar IS 'Spanish translation for Argentina (esAR7)';
COMMENT ON COLUMN terminology.loinc_codes.variant_sources IS 'Sources that contributed to this record (pipe-separated: es_ES|es_MX|es_AR)';

-- ============================================================================
-- AEMPS Tables (Medications and ATC)
-- ============================================================================

-- AEMPS ATC Codes (Anatomical Therapeutic Chemical Classification)
CREATE TABLE IF NOT EXISTS terminology.aemps_atc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  parent_code TEXT,
  nombre_es TEXT NOT NULL,
  nivel INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE terminology.aemps_atc IS 'ATC (Anatomical Therapeutic Chemical) classification from AEMPS. Hierarchical structure for drug classification.';

-- AEMPS Medications (Nomenclátor Nacional)
CREATE TABLE IF NOT EXISTS terminology.aemps_medicamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cn TEXT NOT NULL UNIQUE,
  ean13 TEXT,
  nombre_comercial TEXT NOT NULL,
  principio_activo TEXT NOT NULL,
  atc_code TEXT REFERENCES terminology.aemps_atc(code) ON DELETE SET NULL,
  forma TEXT,
  via TEXT,
  cnvs TEXT,
  ps TEXT,
  dosis TEXT,
  envase TEXT,
  presentacion TEXT,
  laboratorio TEXT,
  estado TEXT NOT NULL DEFAULT 'COMERCIALIZADO' CHECK (estado IN ('COMERCIALIZADO', 'DESCATALOGADO', 'EN_TRAMITE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE terminology.aemps_medicamentos IS 'AEMPS Nomenclátor Nacional: medications authorized in Spain. Contains EAN, CN (national code), active ingredients, ATC, form, route, etc.';
COMMENT ON COLUMN terminology.aemps_medicamentos.cn IS 'CN: Código Nacional (national medication code from AEMPS)';
COMMENT ON COLUMN terminology.aemps_medicamentos.atc_code IS 'ATC classification code for therapeutic purpose';
COMMENT ON COLUMN terminology.aemps_medicamentos.estado IS 'Market status: COMERCIALIZADO (active), DESCATALOGADO (discontinued), EN_TRAMITE (pending)';

-- ============================================================================
-- Mapping Tables (Curated bridges between terminologies)
-- ============================================================================

-- SNOMED ↔ AEMPS Mappings (diagnoses/findings ↔ medications)
CREATE TABLE IF NOT EXISTS terminology.mapeos_snomed_aemps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snomed_concept_id BIGINT NOT NULL REFERENCES terminology.snomed_concepts(concept_id) ON DELETE CASCADE,
  aemps_medicamento_id UUID NOT NULL REFERENCES terminology.aemps_medicamentos(id) ON DELETE CASCADE,
  mapeo_tipo TEXT DEFAULT 'TRATAMIENTO' CHECK (mapeo_tipo IN ('TRATAMIENTO', 'CONTRAINDICACION', 'ALERGIA', 'INTERACCION')),
  confidence NUMERIC(3,2) DEFAULT 0.50 CHECK (confidence >= 0 AND confidence <= 1),
  status TEXT NOT NULL DEFAULT 'PENDIENTE_REVISION' CHECK (status IN ('PENDIENTE_REVISION', 'VALIDADO', 'RECHAZADO')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE terminology.mapeos_snomed_aemps IS 'Manual-curated mappings between SNOMED diagnoses/findings and AEMPS medications. Confidence score indicates quality of mapping.';

-- SNOMED ↔ LOINC Mappings (findings ↔ lab tests)
CREATE TABLE IF NOT EXISTS terminology.mapeos_snomed_loinc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snomed_concept_id BIGINT NOT NULL REFERENCES terminology.snomed_concepts(concept_id) ON DELETE CASCADE,
  loinc_num TEXT NOT NULL REFERENCES terminology.loinc_codes(loinc_num) ON DELETE CASCADE,
  confidence NUMERIC(3,2) DEFAULT 0.50 CHECK (confidence >= 0 AND confidence <= 1),
  status TEXT NOT NULL DEFAULT 'PENDIENTE_REVISION' CHECK (status IN ('PENDIENTE_REVISION', 'VALIDADO', 'RECHAZADO')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE terminology.mapeos_snomed_loinc IS 'Manual-curated mappings between SNOMED clinical findings/observations and LOINC laboratory codes.';

-- ============================================================================
-- Clinical Search Index View (unified search across all terminologies)
-- ============================================================================

CREATE OR REPLACE VIEW terminology.clinical_search_index AS
SELECT
  'snomed_description'::TEXT as source,
  c.concept_id::TEXT as code,
  d.term as display_name,
  NULL::TEXT as formal_name,
  d.lang,
  'diagnosis,symptom,finding'::TEXT as category,
  to_tsvector('spanish', COALESCE(d.term, '')) as search_vector
FROM terminology.snomed_descriptions d
JOIN terminology.snomed_concepts c ON d.concept_id = c.concept_id
WHERE d.status = 'ACTIVE' AND c.status = 'ACTIVE' AND d.lang = 'es'

UNION ALL

SELECT
  'snomed_definition'::TEXT as source,
  c.concept_id::TEXT as code,
  td.term as display_name,
  td.term as formal_name,
  td.lang,
  'diagnosis,symptom,finding'::TEXT as category,
  to_tsvector('spanish', COALESCE(td.term, '')) as search_vector
FROM terminology.snomed_text_definitions td
JOIN terminology.snomed_concepts c ON td.concept_id = c.concept_id
WHERE td.status = 'ACTIVE' AND c.status = 'ACTIVE' AND td.lang = 'es'

UNION ALL

SELECT 
  'loinc'::TEXT as source,
  loinc_num as code,
  COALESCE(spanish_name_es, component) as display_name,
  component as formal_name,
  'es'::TEXT as lang,
  'laboratory,observation'::TEXT as category,
  to_tsvector('spanish', COALESCE(spanish_name_es, '') || ' ' || COALESCE(component, '')) as search_vector
FROM terminology.loinc_codes
WHERE status_es = 'ACTIVE'

UNION ALL

SELECT 
  'aemps'::TEXT as source,
  cn as code,
  nombre_comercial as display_name,
  principio_activo as formal_name,
  'es'::TEXT as lang,
  'medication'::TEXT as category,
  to_tsvector('spanish', nombre_comercial || ' ' || principio_activo || ' ' || COALESCE(atc_code, '')) as search_vector
FROM terminology.aemps_medicamentos
WHERE estado = 'COMERCIALIZADO';

COMMENT ON VIEW terminology.clinical_search_index IS 'Unified search index across SNOMED, LOINC, and AEMPS. Use for clinical decision support and autocomplete.';

-- ============================================================================
-- Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE terminology.snomed_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminology.snomed_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminology.snomed_text_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminology.snomed_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminology.loinc_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminology.aemps_atc ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminology.aemps_medicamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminology.mapeos_snomed_aemps ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminology.mapeos_snomed_loinc ENABLE ROW LEVEL SECURITY;

-- Permissive policies: everyone authenticated can read; only admin can write
CREATE POLICY "terminology_read_authenticated" ON terminology.snomed_concepts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "terminology_read_authenticated" ON terminology.snomed_descriptions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "terminology_read_authenticated" ON terminology.snomed_text_definitions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "terminology_read_authenticated" ON terminology.snomed_relationships FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "terminology_read_authenticated" ON terminology.loinc_codes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "terminology_read_authenticated" ON terminology.aemps_atc FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "terminology_read_authenticated" ON terminology.aemps_medicamentos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "terminology_read_authenticated" ON terminology.mapeos_snomed_aemps FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "terminology_read_authenticated" ON terminology.mapeos_snomed_loinc FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- Indexes for Search Performance
-- ============================================================================

-- SNOMED indexes
CREATE INDEX idx_snomed_concepts_status ON terminology.snomed_concepts(status) WHERE status = 'ACTIVE';
CREATE INDEX idx_snomed_descriptions_lang ON terminology.snomed_descriptions(lang);
CREATE INDEX idx_snomed_descriptions_status ON terminology.snomed_descriptions(status) WHERE status = 'ACTIVE';
CREATE INDEX idx_snomed_text_definitions_lang ON terminology.snomed_text_definitions(lang);
CREATE INDEX idx_snomed_text_definitions_status ON terminology.snomed_text_definitions(status) WHERE status = 'ACTIVE';
CREATE INDEX idx_snomed_relationships_source ON terminology.snomed_relationships(source_concept_id);
CREATE INDEX idx_snomed_relationships_target ON terminology.snomed_relationships(target_concept_id);

-- LOINC indexes
CREATE INDEX idx_loinc_codes_status_es ON terminology.loinc_codes(status_es) WHERE status_es = 'ACTIVE';
CREATE INDEX idx_loinc_codes_atc ON terminology.loinc_codes(system);

-- AEMPS indexes
CREATE INDEX idx_aemps_atc_parent ON terminology.aemps_atc(parent_code);
CREATE INDEX idx_aemps_medicamentos_atc ON terminology.aemps_medicamentos(atc_code);
CREATE INDEX idx_aemps_medicamentos_estado ON terminology.aemps_medicamentos(estado) WHERE estado = 'COMERCIALIZADO';

-- Mapping indexes
CREATE INDEX idx_mapeos_snomed_aemps_status ON terminology.mapeos_snomed_aemps(status);
CREATE INDEX idx_mapeos_snomed_loinc_status ON terminology.mapeos_snomed_loinc(status);

-- GIN indexes for full-text search (trigram for approximate matching)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_snomed_descriptions_trigram ON terminology.snomed_descriptions USING gin(term gin_trgm_ops);
CREATE INDEX idx_loinc_codes_trigram ON terminology.loinc_codes USING gin(spanish_name_es gin_trgm_ops);
CREATE INDEX idx_aemps_medicamentos_trigram ON terminology.aemps_medicamentos USING gin(nombre_comercial gin_trgm_ops);

-- Full-text search indexes (for tsvector queries)
CREATE INDEX idx_snomed_descriptions_fts ON terminology.snomed_descriptions USING gin(to_tsvector('spanish', term));
CREATE INDEX idx_snomed_text_definitions_fts ON terminology.snomed_text_definitions USING gin(to_tsvector('spanish', term));
CREATE INDEX idx_loinc_codes_fts ON terminology.loinc_codes USING gin(to_tsvector('spanish', COALESCE(spanish_name_es, '') || ' ' || COALESCE(component, '')));
CREATE INDEX idx_aemps_medicamentos_fts ON terminology.aemps_medicamentos USING gin(to_tsvector('spanish', nombre_comercial || ' ' || principio_activo));
