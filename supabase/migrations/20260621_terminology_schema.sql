-- ============================================================================
-- MIGRATION: 20260621_terminology_schema.sql
-- PURPOSE: Create terminology schema for SNOMED/LOINC/AEMPS canonical storage
-- DATE: 2026-06-21
-- PHASE: 0 (Base Terminológica)
-- ============================================================================

-- Create schema for all terminology-related tables
CREATE SCHEMA IF NOT EXISTS terminology;

-- Grant access to authenticated users (RLS will control row-level access)
GRANT USAGE ON SCHEMA terminology TO anon, authenticated;
GRANT CREATE ON SCHEMA terminology TO authenticated;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA terminology GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA terminology GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA terminology GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

-- Helpful comment
COMMENT ON SCHEMA terminology IS 'Canonical storage for clinical terminologies: SNOMED CT, LOINC, AEMPS/ATC. All tables use RLS for access control.';
