# ============================================================================
# SERMED2: Run SNOMED, LOINC, and AEMPS Parsers
# ============================================================================
# IMPORTANTE: Ajusta las rutas según dónde tengas los archivos descomprimidos
# ============================================================================

# Definir rutas (AJUSTA ESTAS RUTAS A TU ENTORNO)
$SNOMED_DIR = "C:\path\to\SNOMED_CT\SnomedCT_SpanishExtension-es_INT_Production_20260510T120000Z"
$LOINC_DIR = "C:\path\to\LOINC\loinc-2.82"
$AEMPS_DIR = "C:\path\to\AEMPS"
$OUTPUT_DIR = "$(Get-Location)\output_parsed"

# Crear directorio de output
New-Item -ItemType Directory -Force -Path $OUTPUT_DIR | Out-Null
Write-Host "Output directory: $OUTPUT_DIR" -ForegroundColor Green

# ============================================================================
# 1. EJECUTAR PARSER DE SNOMED CT
# ============================================================================
Write-Host "`n========== PARSING SNOMED CT ==========" -ForegroundColor Cyan
Write-Host "Input: $SNOMED_DIR" -ForegroundColor Gray
python scripts/parse_snomed_correct.py --input-dir "$SNOMED_DIR" --output-dir "$OUTPUT_DIR"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ SNOMED parser exitoso" -ForegroundColor Green
} else {
    Write-Host "✗ SNOMED parser falló (exit code: $LASTEXITCODE)" -ForegroundColor Red
}

# ============================================================================
# 2. EJECUTAR PARSER DE LOINC
# ============================================================================
Write-Host "`n========== PARSING LOINC ==========" -ForegroundColor Cyan
Write-Host "Input: $LOINC_DIR" -ForegroundColor Gray
python scripts/parse_loinc.py --input-dir "$LOINC_DIR" --output-dir "$OUTPUT_DIR"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ LOINC parser exitoso" -ForegroundColor Green
} else {
    Write-Host "✗ LOINC parser falló (exit code: $LASTEXITCODE)" -ForegroundColor Red
}

# ============================================================================
# 3. EJECUTAR PARSER DE AEMPS
# ============================================================================
Write-Host "`n========== PARSING AEMPS ==========" -ForegroundColor Cyan
Write-Host "Input: $AEMPS_DIR" -ForegroundColor Gray
python scripts/parse_aemps.py --input-dir "$AEMPS_DIR" --output-dir "$OUTPUT_DIR"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ AEMPS parser exitoso" -ForegroundColor Green
} else {
    Write-Host "✗ AEMPS parser falló (exit code: $LASTEXITCODE)" -ForegroundColor Red
}

# ============================================================================
# 4. LISTAR ARCHIVOS GENERADOS
# ============================================================================
Write-Host "`n========== ARCHIVOS GENERADOS ==========" -ForegroundColor Cyan
Get-ChildItem -Path "$OUTPUT_DIR" -Filter "*.csv" | ForEach-Object {
    $size = (Get-Item $_.FullName).Length / 1MB
    Write-Host "  - $($_.Name): $('{0:N2}' -f $size) MB"
}

Write-Host "`nCompleted!" -ForegroundColor Green
