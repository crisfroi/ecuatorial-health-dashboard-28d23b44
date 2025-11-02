# PostgreSQL Migration Runner for Qiandao SDK (PowerShell)
# This script applies database migrations to PostgreSQL on Windows

param(
    [string]$DbHost = $env:DB_HOST,
    [string]$DbPort = $env:DB_PORT,
    [string]$DbUser = $env:DB_USER,
    [string]$DbPassword = $env:DB_PASSWORD,
    [string]$DbName = $env:DB_NAME,
    [string]$MigrationsDir = "$PSScriptRoot\..\migrations"
)

# Set defaults
if (-not $DbHost) { $DbHost = "localhost" }
if (-not $DbPort) { $DbPort = "5432" }
if (-not $DbUser) { $DbUser = "postgres" }
if (-not $DbName) { $DbName = "postgres" }

Write-Host "=== Qiandao SDK PostgreSQL Migration Runner ===" -ForegroundColor Yellow
Write-Host ""

# Check if psql is installed
$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
    Write-Host "ERROR: psql command not found. Please install PostgreSQL." -ForegroundColor Red
    exit 1
}

# Get password if not provided
if (-not $DbPassword) {
    $Credential = Get-Credential -UserName $DbUser -Message "Enter PostgreSQL credentials"
    if ($null -eq $Credential) {
        Write-Host "No credentials provided. Exiting." -ForegroundColor Red
        exit 1
    }
    $DbPassword = $Credential.GetNetworkCredential().Password
}

Write-Host "Connection details:" -ForegroundColor Yellow
Write-Host "  Host: $DbHost"
Write-Host "  Port: $DbPort"
Write-Host "  User: $DbUser"
Write-Host "  Database: $DbName"
Write-Host ""

# Test connection
Write-Host "Testing database connection..." -ForegroundColor Yellow
$env:PGPASSWORD = $DbPassword

try {
    $output = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c "SELECT 1" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Connection successful" -ForegroundColor Green
    } else {
        Write-Host "❌ Connection failed. Please check your credentials." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Connection failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if migrations directory exists
if (-not (Test-Path $MigrationsDir)) {
    Write-Host "ERROR: Migrations directory not found: $MigrationsDir" -ForegroundColor Red
    exit 1
}

# Find all migration files
$migrationFiles = Get-ChildItem -Path $MigrationsDir -Filter "*.sql" | Sort-Object -Property Name

if ($migrationFiles.Count -eq 0) {
    Write-Host "ERROR: No migration files found in $MigrationsDir" -ForegroundColor Red
    exit 1
}

Write-Host "Found $($migrationFiles.Count) migration file(s)" -ForegroundColor Yellow
Write-Host ""

$success = 0
$failed = 0

# Run each migration file
foreach ($file in $migrationFiles) {
    Write-Host -NoNewline "Running $($file.Name)... "
    
    try {
        $output = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $file.FullName 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓" -ForegroundColor Green
            $success++
        } else {
            Write-Host "✗" -ForegroundColor Red
            Write-Host "  Error: $output"
            $failed++
        }
    } catch {
        Write-Host "✗" -ForegroundColor Red
        Write-Host "  Error: $_"
        $failed++
    }
}

Write-Host ""
Write-Host "Migration Results:" -ForegroundColor Cyan
Write-Host "  Successful: $success" -ForegroundColor Green
if ($failed -gt 0) {
    Write-Host "  Failed: $failed" -ForegroundColor Red
}

# Verify tables
Write-Host ""
Write-Host "Verifying tables..." -ForegroundColor Yellow

$expectedTables = @("device", "person", "enrollinfo", "record", "access_day", "access_week", "machine_command", "application_logs", "biometric_sync_logs")

foreach ($table in $expectedTables) {
    try {
        $output = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -t -c "SELECT to_regclass('$table');" 2>&1
        
        if ($output -like "*public.$table*") {
            Write-Host "✓ Table '$table' exists" -ForegroundColor Green
        } else {
            Write-Host "✗ Table '$table' NOT found" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ Error checking table '$table': $_" -ForegroundColor Red
    }
}

Write-Host ""

# Summary
if ($failed -eq 0) {
    Write-Host "✓ All migrations completed successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "✗ Some migrations failed. Please check the errors above." -ForegroundColor Red
    exit 1
}
