#!/bin/bash
# RUN_PARSERS.sh - Ejecuta todos los parsers de terminología
# Uso: bash RUN_PARSERS.sh

set -e  # Exit on error

echo "=========================================="
echo "FASE 0: Ejecutar Parsers de Terminología"
echo "=========================================="
echo ""

# Create output directory
mkdir -p data
echo "✓ Directorio 'data/' creado"
echo ""

# SNOMED Parser
echo "1. Parseando SNOMED CT Spanish (100 conceptos)..."
python3 scripts/parse_snomed.py \
  --input-dir "../HOSIX-GEPROSALUD/snomed ct/SnomedCT_SpanishRelease-es_PRODUCTION_20260510T120000Z" \
  --output-dir "data" \
  --test-count 100

if [ $? -eq 0 ]; then
  echo "✓ SNOMED parsing completado"
  echo "   - data/snomed_concepts.csv"
  echo "   - data/snomed_descriptions.csv"
  echo "   - data/snomed_relationships.csv"
else
  echo "✗ Error en SNOMED parsing"
  exit 1
fi
echo ""

# LOINC Parser
echo "2. Parseando LOINC 2.82 + variantes esES/esMX (50 códigos)..."
python3 scripts/parse_loinc.py \
  --input-dir "../HOSIX-GEPROSALUD/Loinc_2.82" \
  --output-dir "data" \
  --test-count 50

if [ $? -eq 0 ]; then
  echo "✓ LOINC parsing completado"
  echo "   - data/loinc_codes.csv"
else
  echo "✗ Error en LOINC parsing"
  exit 1
fi
echo ""

# AEMPS Parser
echo "3. Parseando AEMPS (50 medicamentos)..."
python3 scripts/parse_aemps.py \
  --input-dir "../HOSIX-GEPROSALUD/aemps" \
  --output-dir "data" \
  --test-count 50

if [ $? -eq 0 ]; then
  echo "✓ AEMPS parsing completado"
  echo "   - data/aemps_atc.csv"
  echo "   - data/aemps_medicamentos.csv"
else
  echo "✗ Error en AEMPS parsing"
  exit 1
fi
echo ""

echo "=========================================="
echo "✓ TODOS LOS PARSERS COMPLETADOS"
echo "=========================================="
echo ""
echo "Archivos generados en: SERMED2/data/"
echo ""
echo "Próximos pasos:"
echo "1. Aplica migrations en Supabase SQL Editor:"
echo "   - supabase/migrations/20260621_terminology_schema.sql"
echo "   - supabase/migrations/20260622_terminology_tables.sql"
echo ""
echo "2. Ejecuta los INSERT statements:"
echo "   - Abre supabase/migrations/20260622_load_test_data.sql"
echo "   - Copia y ejecuta en Supabase SQL Editor"
echo ""
