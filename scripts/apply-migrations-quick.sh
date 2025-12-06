#!/bin/bash

################################################################################
#
# SCRIPT RÁPIDO PARA APLICAR MIGRACIONES SQL A SUPABASE
#
# Este script permite aplicar migraciones SQL de HOSIX a Supabase
# de forma rápida y confiable
#
# Uso:
#   bash scripts/apply-migrations-quick.sh
#   bash scripts/apply-migrations-quick.sh --method cli
#   bash scripts/apply-migrations-quick.sh --method psql --connection "..."
#
# Métodos disponibles:
#   - cli       : Supabase CLI (requiere autenticación)
#   - psql      : PostgreSQL directo (requiere psql y connection string)
#   - dashboard : Manual en web (genera script para copiar/pegar)
#   - auto      : Detecta automáticamente el mejor método
#
################################################################################

set -e

# ============================================================
# COLORES Y ESTILOS
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

print_header() {
  echo -e "\n${BOLD}${BLUE}==============================================================${NC}"
  echo -e "${BOLD}${BLUE}  $1${NC}"
  echo -e "${BOLD}${BLUE}==============================================================${NC}\n"
}

print_step() {
  echo -e "\n${BOLD}[*]${NC} $1"
  echo -e "${DIM}$(printf '─%.0s' {1..60})${NC}\n"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# ============================================================
# CONFIGURACIÓN POR DEFECTO
# ============================================================

SUPABASE_URL="https://wdieynendfjbkbhfovrx.supabase.co"
PROJECT_ID="wdieynendfjbkbhfovrx"
MIGRATIONS_DIR="supabase/migrations"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

METHOD="auto"
VERBOSE=false
DRY_RUN=false
FILTER=""

# ============================================================
# PARSEADO DE ARGUMENTOS
# ============================================================

while [[ $# -gt 0 ]]; do
  case $1 in
    --method)
      METHOD="$2"
      shift 2
      ;;
    --filter)
      FILTER="$2"
      shift 2
      ;;
    --connection|--conn)
      CONNECTION_STRING="$2"
      shift 2
      ;;
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help|-h)
      print_header "AYUDA"
      cat << EOF
Opciones disponibles:

  --method METHOD
    Método de aplicación: cli, psql, dashboard, auto (default: auto)

  --filter PATTERN
    Filtrar migraciones por patrón (ej: hosix_)

  --connection STRING
    Connection string para psql (usado con --method psql)

  --verbose, -v
    Mostrar información detallada

  --dry-run
    Simular la ejecución sin aplicar cambios

  --help, -h
    Mostrar esta ayuda

Ejemplos:

  # Método automático (recomendado)
  bash scripts/apply-migrations-quick.sh

  # Usando Supabase CLI
  bash scripts/apply-migrations-quick.sh --method cli

  # Usando psql
  bash scripts/apply-migrations-quick.sh --method psql

  # Solo migraciones HOSIX
  bash scripts/apply-migrations-quick.sh --filter hosix_

EOF
      exit 0
      ;;
    *)
      print_error "Opción desconocida: $1"
      exit 1
      ;;
  esac
done

# ============================================================
# VALIDACIONES INICIALES
# ============================================================

print_header "VERIFICADOR DE MIGRACIONES HOSIX"

print_step "Validando configuración"

if [ ! -d "$PROJECT_DIR/$MIGRATIONS_DIR" ]; then
  print_error "Directorio de migraciones no encontrado: $MIGRATIONS_DIR"
  exit 1
fi

print_success "Directorio de migraciones encontrado"

MIGRATION_COUNT=$(find "$PROJECT_DIR/$MIGRATIONS_DIR" -name "*.sql" -type f ! -path "*/supabase/*" | wc -l)
print_info "Se encontraron $MIGRATION_COUNT migraciones"

# ============================================================
# DETECCIÓN DE MÉTODO AUTOMÁTICO
# ============================================================

if [ "$METHOD" = "auto" ]; then
  print_step "Detectando método disponible"

  if command -v supabase &> /dev/null; then
    print_success "Supabase CLI encontrado"
    METHOD="cli"
  elif command -v psql &> /dev/null; then
    print_success "psql encontrado"
    METHOD="psql"
  else
    print_warning "No se encontró CLI ni psql"
    print_info "Se usará método manual (dashboard)"
    METHOD="dashboard"
  fi

  print_info "Método seleccionado: $METHOD"
fi

# ============================================================
# MÉTODO: SUPABASE CLI
# ============================================================

apply_with_cli() {
  print_step "Aplicando migraciones con Supabase CLI"

  if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI no está instalado"
    print_info "Instala con: npm install -g supabase"
    return 1
  fi

  print_step "Autenticación"
  if [ "$DRY_RUN" = true ]; then
    print_info "DRY RUN: supabase login"
  else
    supabase login
  fi

  print_step "Enlazando proyecto"
  if [ "$DRY_RUN" = true ]; then
    print_info "DRY RUN: supabase link --project-ref $PROJECT_ID"
  else
    supabase link --project-ref "$PROJECT_ID"
  fi

  print_step "Empujando migraciones"
  if [ "$DRY_RUN" = true ]; then
    print_info "DRY RUN: supabase db push"
  else
    supabase db push
  fi

  print_success "Migraciones aplicadas con Supabase CLI"
}

# ============================================================
# MÉTODO: PSQL
# ============================================================

apply_with_psql() {
  print_step "Aplicando migraciones con psql"

  if ! command -v psql &> /dev/null; then
    print_error "psql no está instalado"
    print_info "Instala PostgreSQL client en tu sistema"
    return 1
  fi

  if [ -z "$CONNECTION_STRING" ]; then
    if [ -z "$SUPABASE_CONNECTION_STRING" ]; then
      print_warning "Connection string no configurada"
      print_info "Configurar: SUPABASE_CONNECTION_STRING=postgresql://..."
      print_info "O usar: --connection 'postgresql://...'"
      return 1
    fi
    CONNECTION_STRING="$SUPABASE_CONNECTION_STRING"
  fi

  print_info "Conectando a: $(echo $CONNECTION_STRING | sed 's/:.*@/@/g')"

  MIGRATION_FILES=$(find "$PROJECT_DIR/$MIGRATIONS_DIR" -name "*.sql" -type f ! -path "*/supabase/*" | sort)

  COUNT=0
  for file in $MIGRATION_FILES; do
    if [ -n "$FILTER" ] && ! [[ "$(basename $file)" =~ $FILTER ]]; then
      continue
    fi

    COUNT=$((COUNT + 1))
    print_info "Aplicando: $(basename $file)"

    if [ "$DRY_RUN" = true ]; then
      print_warning "DRY RUN: archivo sería ejecutado"
    else
      psql "$CONNECTION_STRING" -f "$file" 2>&1 | sed 's/^/    /'
      if [ $? -eq 0 ]; then
        print_success "✓ $(basename $file)"
      else
        print_error "✗ $(basename $file)"
        return 1
      fi
    fi
  done

  print_info "Total de migraciones aplicadas: $COUNT"
  print_success "Migraciones aplicadas con psql"
}

# ============================================================
# MÉTODO: DASHBOARD (MANUAL)
# ============================================================

apply_with_dashboard() {
  print_step "Generando script para Supabase Dashboard"

  SCRIPT_FILE="$PROJECT_DIR/supabase-migration-$(date +%s).sql"

  cat > "$SCRIPT_FILE" << 'HEADER'
-- Script de migraciones HOSIX generado automáticamente
-- Fecha: $(date)
-- URL: https://supabase.com/dashboard
-- Instrucciones:
--   1. Abre https://app.supabase.com
--   2. Selecciona el proyecto: wdieynendfjbkbhfovrx
--   3. Ve a SQL Editor > New Query
--   4. Copia y pega este contenido
--   5. Haz clic en "Run"
--   6. Verifica los resultados

HEADER

  MIGRATION_FILES=$(find "$PROJECT_DIR/$MIGRATIONS_DIR" -name "*.sql" -type f ! -path "*/supabase/*" | sort)

  COUNT=0
  for file in $MIGRATION_FILES; do
    if [ -n "$FILTER" ] && ! [[ "$(basename $file)" =~ $FILTER ]]; then
      continue
    fi

    COUNT=$((COUNT + 1))
    echo "" >> "$SCRIPT_FILE"
    echo "-- =================================================" >> "$SCRIPT_FILE"
    echo "-- $(basename $file)" >> "$SCRIPT_FILE"
    echo "-- =================================================" >> "$SCRIPT_FILE"
    echo "" >> "$SCRIPT_FILE"
    cat "$file" >> "$SCRIPT_FILE"
    echo "" >> "$SCRIPT_FILE"
  done

  print_success "Script generado: $SCRIPT_FILE"
  print_info "Tamaño: $(du -h $SCRIPT_FILE | cut -f1)"
  print_info "Migraciones incluidas: $COUNT"

  print_step "Próximos pasos"
  print_info "1. Abre: https://app.supabase.com"
  print_info "2. Proyecto: $PROJECT_ID"
  print_info "3. SQL Editor > New Query"
  print_info "4. Copia el contenido de: $(basename $SCRIPT_FILE)"
  print_info "5. Pega y ejecuta"

  if [ "$VERBOSE" = true ]; then
    print_info "\nContenido del script (primeras líneas):"
    head -20 "$SCRIPT_FILE" | sed 's/^/  /'
  fi
}

# ============================================================
# SELECCIÓN DE MÉTODO Y EJECUCIÓN
# ============================================================

print_header "APLICANDO MIGRACIONES"

case $METHOD in
  cli)
    apply_with_cli
    ;;
  psql)
    apply_with_psql
    ;;
  dashboard)
    apply_with_dashboard
    ;;
  *)
    print_error "Método desconocido: $METHOD"
    exit 1
    ;;
esac

EXIT_CODE=$?

# ============================================================
# RESUMEN FINAL
# ============================================================

print_header "RESUMEN"

if [ $EXIT_CODE -eq 0 ]; then
  if [ "$DRY_RUN" = true ]; then
    print_warning "DRY RUN completado sin aplicar cambios"
  else
    print_success "Migraciones aplicadas correctamente"

    print_step "Próximos pasos"
    print_info "1. Verifica en Supabase Dashboard que las tablas existan"
    print_info "2. Ejecuta: npm run dev"
    print_info "3. Abre: http://localhost:5173"
  fi
else
  print_error "Ocurrió un error durante la aplicación"
  exit 1
fi

echo ""
