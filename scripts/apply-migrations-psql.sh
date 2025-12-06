#!/bin/bash

##############################################################################
# Script para aplicar migraciones SQL a Supabase usando psql
#
# Uso:
#   bash scripts/apply-migrations-psql.sh
#   npm run apply-migrations:psql
#
# Requisitos:
#   - psql instalado (PostgreSQL client)
#   - SUPABASE_CONNECTION_STRING o SUPABASE_DB_* configurados
#   - Contraseña de base de datos disponible
##############################################################################

# ============================================================
# COLORES PARA TERMINAL
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ============================================================
# FUNCIONES AUXILIARES
# ============================================================

log_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_header() {
    echo ""
    echo -e "${BOLD}================================================================${NC}"
    echo -e "${BOLD}  $1${NC}"
    echo -e "${BOLD}================================================================${NC}"
    echo ""
}

# ============================================================
# VALIDACIÓN
# ============================================================

validate_setup() {
    log_info "Validando configuración..."

    # Verificar si psql está instalado
    if ! command -v psql &> /dev/null; then
        log_error "psql no está instalado"
        log_info "Instala PostgreSQL client:"
        log_info "  - macOS: brew install postgresql"
        log_info "  - Ubuntu/Debian: sudo apt-get install postgresql-client"
        log_info "  - Windows: Descarga desde https://www.postgresql.org/download/"
        exit 1
    fi
    log_success "psql está instalado"

    # Obtener connection string
    if [ -n "$SUPABASE_CONNECTION_STRING" ]; then
        CONNECTION_STRING="$SUPABASE_CONNECTION_STRING"
        log_success "Usando SUPABASE_CONNECTION_STRING"
    elif [ -n "$SUPABASE_DB_HOST" ] && [ -n "$SUPABASE_DB_USER" ]; then
        PASSWORD="${SUPABASE_DB_PASSWORD:?Error: SUPABASE_DB_PASSWORD no configurada}"
        CONNECTION_STRING="postgresql://${SUPABASE_DB_USER}:${PASSWORD}@${SUPABASE_DB_HOST}:${SUPABASE_DB_PORT:-5432}/${SUPABASE_DB_NAME:-postgres}"
        log_success "Usando SUPABASE_DB_* variables"
    else
        log_error "Connection string no configurada"
        log_info "Configura una de estas opciones en .env:"
        log_info "  1. SUPABASE_CONNECTION_STRING"
        log_info "  2. SUPABASE_DB_HOST, SUPABASE_DB_USER, SUPABASE_DB_PASSWORD"
        exit 1
    fi

    # Verificar directorio de migraciones
    if [ ! -d "supabase/migrations" ]; then
        log_error "Directorio supabase/migrations no encontrado"
        exit 1
    fi
    log_success "Directorio de migraciones encontrado"
}

# ============================================================
# CONECTAR A BD
# ============================================================

test_connection() {
    log_info "Probando conexión a Supabase..."
    
    if psql "$CONNECTION_STRING" -c "SELECT version();" > /dev/null 2>&1; then
        log_success "Conexión exitosa a Supabase"
        return 0
    else
        log_error "No se pudo conectar a Supabase"
        log_info "Verifica que:"
        log_info "  - La contraseña sea correcta"
        log_info "  - Tienes acceso a Supabase"
        log_info "  - La red permite conexiones PostgreSQL"
        exit 1
    fi
}

# ============================================================
# OBTENER MIGRACIONES
# ============================================================

get_migrations() {
    # Obtener lista de archivos .sql ordenados
    find supabase/migrations -maxdepth 1 -name "*.sql" -type f | sort
}

# ============================================================
# APLICAR MIGRACIÓN
# ============================================================

apply_migration() {
    local migration_file="$1"
    local migration_name=$(basename "$migration_file")
    
    log_info "Aplicando: $migration_name"
    
    # Ejecutar migración
    if psql "$CONNECTION_STRING" -f "$migration_file" > /dev/null 2>&1; then
        log_success "Aplicada: $migration_name"
        return 0
    else
        # Intentar con más verbosidad para debugging
        psql "$CONNECTION_STRING" -f "$migration_file" 2>&1 | head -20
        log_warning "Revisar errores en la migración: $migration_name"
        return 1
    fi
}

# ============================================================
# FUNCIÓN PRINCIPAL
# ============================================================

main() {
    log_header "APLICADOR DE MIGRACIONES HOSIX - PSQL"

    # 1. Validar
    log_header "PASO 1: Validación"
    validate_setup

    # 2. Conectar
    log_header "PASO 2: Conexión"
    test_connection

    # 3. Obtener migraciones
    log_header "PASO 3: Descubrimiento de Migraciones"
    migrations=$(get_migrations)
    
    if [ -z "$migrations" ]; then
        log_warning "No se encontraron migraciones"
        exit 0
    fi

    migration_count=$(echo "$migrations" | wc -l)
    log_success "Se encontraron $migration_count migraciones"
    echo "$migrations" | while read -r migration; do
        log_info "  - $(basename "$migration")"
    done

    # 4. Aplicar migraciones recientes
    log_header "PASO 4: Aplicación de Migraciones"
    
    # Aplicar últimas 5 migraciones (las más recientes)
    recent_migrations=$(echo "$migrations" | tail -5)
    
    success_count=0
    error_count=0

    echo "$recent_migrations" | while read -r migration; do
        if [ -n "$migration" ]; then
            if apply_migration "$migration"; then
                ((success_count++))
            else
                ((error_count++))
            fi
        fi
    done

    # 5. Verificación
    log_header "PASO 5: Verificación"
    
    log_info "Buscando tablas HOSIX..."
    table_count=$(psql "$CONNECTION_STRING" -t -c "
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'hosix_%'
    " 2>/dev/null || echo "0")

    if [ "$table_count" -gt "0" ]; then
        log_success "Se encontraron $table_count tablas HOSIX"
    else
        log_warning "No se encontraron tablas HOSIX"
    fi

    # 6. Resumen final
    log_header "RESUMEN FINAL"
    log_success "✓ Proceso completado"
    
    log_info "📌 Próximos pasos:"
    log_info "  1. Verifica en Supabase Dashboard que las tablas existen"
    log_info "  2. Ejecuta: npm run dev"
    log_info "  3. Comprueba la conectividad en la aplicación"

    echo ""
}

# ============================================================
# INICIAR
# ============================================================

main "$@"
