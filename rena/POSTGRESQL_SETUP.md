# PostgreSQL Setup and Migration Guide

This guide explains how to set up PostgreSQL for the Qiandao Biometric SDK and run the necessary migrations.

## Prerequisites

- PostgreSQL 13+ (or Supabase PostgreSQL)
- `psql` command-line client installed

## Setup Instructions

### Step 1: Get Database Credentials

#### For Local PostgreSQL:
```bash
# Default local connection
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=postgres
```

#### For Supabase:
1. Go to **Project Settings** → **Database**
2. Under **Connection string**, select **URI**
3. Extract credentials:
   ```
   DB_HOST=your-project.pooler.supabase.com  (or direct: your-project.postgres.supabase.co)
   DB_PORT=6543  (pooler) or 5432 (direct)
   DB_USER=postgres.YOUR_PROJECT_ID
   DB_PASSWORD=your_password
   DB_NAME=postgres
   ```

### Step 2: Create Database (if needed)

```bash
# Connect to PostgreSQL as admin
psql -h $DB_HOST -U postgres -p $DB_PORT

# Create database (optional, if using separate DB)
CREATE DATABASE qiandao;

# Create user (optional, if using separate user)
CREATE USER qiandao_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE qiandao TO qiandao_user;

\q
```

### Step 3: Run Migration

#### Option A: Using psql command

```bash
# Run the migration script
psql -h $DB_HOST \
     -U $DB_USER \
     -d $DB_NAME \
     -p $DB_PORT \
     -f rena/migrations/001_initial_schema.sql
```

#### Option B: Copy and paste SQL

1. Connect to your database:
   ```bash
   psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT
   ```

2. Copy and paste the contents of `rena/migrations/001_initial_schema.sql`

3. Run the SQL

### Step 4: Verify Migration

```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT

# List tables
\dt

# Expected tables:
# - device
# - person
# - enrollinfo
# - record
# - access_day
# - access_week
# - machine_command
# - application_logs
# - biometric_sync_logs

# Check table structure
\d device
\d application_logs

# Exit
\q
```

## Environment Configuration

### For Local Development

Edit `rena/Qiandao.Web/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=your_password;Timeout=30;Pooling=true;"
  }
}
```

### For Production (Render)

Set environment variables in Render:

```
DB_HOST=your-project.pooler.supabase.com
DB_PORT=6543
DB_USER=postgres.YOUR_PROJECT_ID
DB_PASSWORD=your_password
DB_NAME=postgres
ASPNETCORE_ENVIRONMENT=Production
```

The connection string will be built from these variables in `appsettings.Production.json`:
```
Host=${DB_HOST};Port=${DB_PORT};Database=${DB_NAME};Username=${DB_USER};Password=${DB_PASSWORD};Timeout=30;Pooling=true;Minimum Pool Size=5;Maximum Pool Size=20;
```

## Troubleshooting

### "Connection refused"

```bash
# Test connectivity
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT

# If fails, check:
# 1. Database is running
# 2. Credentials are correct
# 3. Network/firewall allows connection
# 4. For Supabase: check that connection pooler is enabled
```

### "Tables already exist"

The migration script uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times.

To reset (⚠️ WARNING: Deletes all data):

```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT

DROP TABLE IF EXISTS biometric_sync_logs CASCADE;
DROP TABLE IF EXISTS application_logs CASCADE;
DROP TABLE IF EXISTS machine_command CASCADE;
DROP TABLE IF EXISTS record CASCADE;
DROP TABLE IF EXISTS access_week CASCADE;
DROP TABLE IF EXISTS access_day CASCADE;
DROP TABLE IF EXISTS enrollinfo CASCADE;
DROP TABLE IF EXISTS person CASCADE;
DROP TABLE IF EXISTS device CASCADE;

\q
```

Then re-run the migration.

### "Permission denied"

If using a restricted user, grant permissions:

```bash
psql -h $DB_HOST -U postgres -d $DB_NAME -p $DB_PORT

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO qiandao_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO qiandao_user;
GRANT USAGE ON SCHEMA public TO qiandao_user;

\q
```

## Testing Connection

### From C# Application

The application will test the connection on startup. Check logs for:

```
Starting up the application...
```

If successful, you'll see:

```
Application started. Press Ctrl+C to shut down.
```

### Manual Test

```bash
cd rena/Qiandao.Web
dotnet restore
dotnet run --launch-profile https
```

Visit: `http://localhost:5000/api/device`

Should return: `{"code":0,"msg":"success","count":0,"data":[]}`

## Migration Rollback

To revert a migration, you must manually drop tables or use the reset script above.

Future migrations can be added in `rena/migrations/002_*.sql`, etc.

## Logging

All application logs will be written to:

1. **Console output** - Real-time logs
2. **File logs** - `Logs/app-log-*.txt` (daily rolling)
3. **Database logs** - `application_logs` table (for Serilog)

### View logs in database

```sql
SELECT * FROM application_logs 
ORDER BY timestamp DESC 
LIMIT 20;

SELECT * FROM biometric_sync_logs 
ORDER BY synced_at DESC 
LIMIT 20;
```

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [Entity Framework Core with PostgreSQL](https://www.npgsql.org/efcore/)
