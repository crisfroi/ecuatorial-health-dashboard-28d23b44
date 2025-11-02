#!/bin/bash

# PostgreSQL Migration Runner for Qiandao SDK
# This script applies database migrations to PostgreSQL

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-postgres}"
MIGRATIONS_DIR="$(dirname "$0")/../migrations"

echo -e "${YELLOW}=== Qiandao SDK PostgreSQL Migration Runner ===${NC}"
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ psql command not found. Please install PostgreSQL client tools.${NC}"
    exit 1
fi

# Get password if not set
if [ -z "$DB_PASSWORD" ]; then
    echo -e "${YELLOW}Enter PostgreSQL password for user '$DB_USER':${NC}"
    read -s DB_PASSWORD
    export PGPASSWORD="$DB_PASSWORD"
else
    export PGPASSWORD="$DB_PASSWORD"
fi

echo ""
echo "Connection details:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo ""

# Test connection
echo -e "${YELLOW}Testing database connection...${NC}"
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" &> /dev/null; then
    echo -e "${GREEN}✓ Connection successful${NC}"
else
    echo -e "${RED}❌ Connection failed. Please check your credentials.${NC}"
    exit 1
fi

echo ""

# Run migrations
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo -e "${RED}❌ Migrations directory not found: $MIGRATIONS_DIR${NC}"
    exit 1
fi

# Find and run all migration files
MIGRATION_FILES=$(find "$MIGRATIONS_DIR" -name "*.sql" | sort)

if [ -z "$MIGRATION_FILES" ]; then
    echo -e "${RED}❌ No migration files found in $MIGRATIONS_DIR${NC}"
    exit 1
fi

MIGRATION_COUNT=$(echo "$MIGRATION_FILES" | wc -l)
echo -e "${YELLOW}Found $MIGRATION_COUNT migration file(s)${NC}"
echo ""

SUCCESS=0
FAILED=0

for migration_file in $MIGRATION_FILES; do
    migration_name=$(basename "$migration_file")
    echo -n "Running $migration_name... "
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file" &> /dev/null; then
        echo -e "${GREEN}✓${NC}"
        ((SUCCESS++))
    else
        echo -e "${RED}✗${NC}"
        ((FAILED++))
    fi
done

echo ""
echo "Migration Results:"
echo -e "  ${GREEN}Successful: $SUCCESS${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "  ${RED}Failed: $FAILED${NC}"
fi

# Verify tables were created
echo ""
echo -e "${YELLOW}Verifying tables...${NC}"

EXPECTED_TABLES=("device" "person" "enrollinfo" "record" "access_day" "access_week" "machine_command" "application_logs" "biometric_sync_logs")

for table in "${EXPECTED_TABLES[@]}"; do
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT to_regclass('$table');" | grep -q "public.${table}"; then
        echo -e "${GREEN}✓${NC} Table '$table' exists"
    else
        echo -e "${RED}✗${NC} Table '$table' NOT found"
    fi
done

echo ""
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All migrations completed successfully!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some migrations failed. Please check the errors above.${NC}"
    exit 1
fi
