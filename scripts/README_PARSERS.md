# Parsers de Terminología Clínica

Scripts Python para canonicalizar SNOMED CT, LOINC 2.82 y AEMPS en CSV listo para importar a Supabase.

## Requisitos

- Python 3.8+
- No hay dependencias externas (solo csv, xml.etree, pathlib, logging)

## Scripts

### 1. parse_snomed.py
Parsea SNOMED CT Spanish Release (formato RF2) en tablas de conceptos, descripciones y relaciones.

**Entrada:** Directorio SNOMED con estructura `Snapshot/Terminology/`  
**Salida:** 3 CSV files

```bash
python parse_snomed.py \
  --input-dir "/path/to/snomed ct/SnomedCT_SpanishRelease-es_PRODUCTION_20260510T120000Z" \
  --output-dir "./data" \
  --test-count 100
```

**Opciones:**
- `--input-dir`: Ruta al directorio raíz de SNOMED (obligatorio)
- `--output-dir`: Directorio de salida (obligatorio)
- `--test-count`: Limitar a N conceptos para testing (opcional; default: todos)

**Salida:**
- `snomed_concepts.csv`: concept_id, lang, status
- `snomed_descriptions.csv`: concept_id, description_id, term, fsn, description_type, lang, status
- `snomed_relationships.csv`: source_concept_id, target_concept_id, relationship_type, status

**Ejemplo de test:** `--test-count 100` parsea 100 conceptos diagnósticos frecuentes en ~30 segundos.

---

### 2. parse_loinc.py
Parsea LOINC 2.82 integrando variantes lingüísticas españolas (esES, esMX).

**Entrada:** Directorio LOINC con `LoincTable/Loinc.csv` y `AccessoryFiles/LinguisticVariants/`  
**Salida:** 1 CSV unificado

```bash
python parse_loinc.py \
  --input-dir "/path/to/Loinc_2.82" \
  --output-dir "./data" \
  --test-count 50
```

**Opciones:**
- `--input-dir`: Ruta al directorio raíz de LOINC (obligatorio)
- `--output-dir`: Directorio de salida (obligatorio)
- `--test-count`: Limitar a N códigos para testing (opcional; default: todos)

**Salida:**
- `loinc_codes.csv`: loinc_num, component, property, system, spanish_name_es, spanish_name_mx, status_es, status_mx

**Notas:**
- Si esES o esMX no existen, se usa component como fallback
- La salida siempre incluye ambas columnas de traducción (puede estar NULL)

---

### 3. parse_aemps.py
Parsea nomenclátor AEMPS y diccionario ATC en formato XML o CSV.

**Entrada:** Directorio AEMPS con archivos `*ATC*.xml` y `*Prescripcion*.xml`  
**Salida:** 2 CSV files

```bash
python parse_aemps.py \
  --input-dir "/path/to/aemps" \
  --output-dir "./data" \
  --test-count 50
```

**Opciones:**
- `--input-dir`: Ruta al directorio raíz de AEMPS (obligatorio)
- `--output-dir`: Directorio de salida (obligatorio)
- `--test-count`: Limitar a N medicamentos para testing (opcional; default: todos)

**Salida:**
- `aemps_atc.csv`: code, parent_code, nombre_es, nivel
- `aemps_medicamentos.csv`: cn, ean13, nombre_comercial, principio_activo, atc_code, forma, via, cnvs, ps, dosis, envase, presentacion, laboratorio, estado

**Notas:**
- Busca archivos automáticamente (no requiere rutas exactas)
- Soporta fallback XML→CSV si XML falla
- CN (Código Nacional) es la clave única de medicamento

---

## Flujo de Ejecución Completo

### 1. Parsear datos de prueba (100 + 50 + 50 registros)
```bash
# SNOMED: 100 conceptos
python parse_snomed.py \
  --input-dir HOSIX-GEPROSALUD/snomed\ ct/SnomedCT_SpanishRelease-es_PRODUCTION_20260510T120000Z \
  --output-dir data \
  --test-count 100

# LOINC: 50 códigos
python parse_loinc.py \
  --input-dir HOSIX-GEPROSALUD/Loinc_2.82 \
  --output-dir data \
  --test-count 50

# AEMPS: 50 medicamentos
python parse_aemps.py \
  --input-dir HOSIX-GEPROSALUD/aemps \
  --output-dir data \
  --test-count 50
```

### 2. Aplicar migrations en Supabase
1. Abrir https://app.supabase.com → SQL Editor
2. Copiar y ejecutar `supabase/migrations/20260621_terminology_schema.sql`
3. Copiar y ejecutar `supabase/migrations/20260622_terminology_tables.sql`

### 3. Importar CSV a Supabase
```sql
-- En Supabase SQL Editor:
\COPY terminology.snomed_concepts FROM 'data/snomed_concepts.csv' WITH CSV HEADER;
\COPY terminology.snomed_descriptions FROM 'data/snomed_descriptions.csv' WITH CSV HEADER;
\COPY terminology.snomed_relationships FROM 'data/snomed_relationships.csv' WITH CSV HEADER;
\COPY terminology.loinc_codes FROM 'data/loinc_codes.csv' WITH CSV HEADER;
\COPY terminology.aemps_atc FROM 'data/aemps_atc.csv' WITH CSV HEADER;
\COPY terminology.aemps_medicamentos FROM 'data/aemps_medicamentos.csv' WITH CSV HEADER;
```

### 4. Validar importación
```sql
-- Búsqueda SNOMED
SELECT COUNT(*) FROM terminology.snomed_concepts;
SELECT * FROM terminology.snomed_concepts LIMIT 3;

-- Búsqueda LOINC
SELECT COUNT(*) FROM terminology.loinc_codes;
SELECT * FROM terminology.loinc_codes WHERE spanish_name_es IS NOT NULL LIMIT 3;

-- Búsqueda AEMPS
SELECT COUNT(*) FROM terminology.aemps_medicamentos;
SELECT * FROM terminology.aemps_medicamentos LIMIT 3;
```

---

## Troubleshooting

### "Could not find SNOMED/LOINC/AEMPS files"
- Verificar ruta `--input-dir`
- Para SNOMED: debe existir `Snapshot/Terminology/sct2_*.txt`
- Para LOINC: debe existir `LoincTable/Loinc.csv`
- Para AEMPS: buscar archivos XML con `*ATC*` o `*Prescripcion*`

### "Error parsing XML"
- Verificar encoding (deben estar en UTF-8)
- Si XML está mal formado, el parser intenta fallback a CSV
- Revisar logs de error para detalles

### "Constraint violation on import"
- Verificar que `concept_id`, `loinc_num`, `cn` sean únicos en CSV
- Validar foreign keys: `atc_code` debe existir en `aemps_atc`
- Revisar si hay duplicados en el archivo

---

## Performance

**Tiempos típicos de parseo (en laptop estándar):**
- SNOMED 100 conceptos: ~10-20 segundos
- SNOMED 500K conceptos: ~2-3 minutos
- LOINC 50 códigos: ~1-2 segundos
- LOINC full (90K+): ~10-15 segundos
- AEMPS 50 medicamentos: ~1-2 segundos
- AEMPS full (50K+): ~5-10 segundos

Para carga masiva a Supabase, usar `--test-count` primero para validar estructura.

---

**Última actualización:** 21 Junio 2026  
**Versión:** Fase 0 (Base Terminológica)
