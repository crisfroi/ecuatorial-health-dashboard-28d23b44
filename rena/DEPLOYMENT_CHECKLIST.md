# Qiandao SDK Deployment Checklist for Render

This document provides a comprehensive checklist for deploying the Qiandao Biometric SDK to Render with PostgreSQL.

## Pre-Deployment Validation

### ✅ Code Quality

- [ ] All SqlServer references replaced with PostgreSQL (Npgsql)
- [ ] All SqlParameter changed to NpgsqlParameter
- [ ] No hardcoded database credentials in code
- [ ] Db.cs uses `DbContextOptions<Db>` instead of `DbContextOptions`
- [ ] Program.cs uses `UseNpgsql()` instead of `UseSqlServer()`
- [ ] All services updated to use NpgsqlParameter
- [ ] Health check endpoint implemented (`/health`)
- [ ] Logging configured with Serilog

### ✅ Configuration Files

- [ ] `appsettings.Development.json` has local PostgreSQL connection
- [ ] `appsettings.Production.json` uses environment variables
- [ ] Environment variables documented:
  - `DB_HOST`
  - `DB_PORT`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`
  - `ASPNETCORE_ENVIRONMENT=Production`

### ✅ Database Migration

- [ ] Migration file created: `rena/migrations/001_initial_schema.sql`
- [ ] All tables defined in migration
- [ ] Indexes created for performance
- [ ] `application_logs` table created for Serilog
- [ ] `biometric_sync_logs` table created
- [ ] Migration tested on local PostgreSQL
- [ ] PostgreSQL setup guide created: `POSTGRESQL_SETUP.md`
- [ ] Migration scripts created: `run-migrations.sh` and `run-migrations.ps1`

### ✅ Docker Configuration

- [ ] Dockerfile updated to use .NET 8.0
- [ ] Dockerfile creates logs directory: `/app/Logs`
- [ ] Dockerfile exposes port 8080
- [ ] Dockerfile sets `ASPNETCORE_ENVIRONMENT=Production`
- [ ] Dockerfile includes health check
- [ ] Dockerfile uses multi-stage build for optimization
- [ ] Dockerfile can be built without errors:
  ```bash
  docker build -f rena/Dockerfile -t qiandao-sdk:test .
  ```

### ✅ Dependencies

- [ ] `Qiandao.Service.csproj` includes:
  - `Npgsql.EntityFrameworkCore.PostgreSQL`
  - `Npgsql`
  - Removed: `Microsoft.EntityFrameworkCore.SqlServer`

- [ ] `Qiandao.Web.csproj` includes:
  - `Npgsql.EntityFrameworkCore.PostgreSQL`
  - `Serilog.AspNetCore`
  - `Serilog.Sinks.File`
  - `Npgsql`

### ✅ Documentation

- [ ] README.md updated with PostgreSQL info
- [ ] POSTGRESQL_SETUP.md created with detailed setup
- [ ] DEPLOYMENT_CHECKLIST.md created (this file)
- [ ] RENDER_DEPLOYMENT.md updated for current version
- [ ] SETUP_ENVIRONMENT.md updated for PostgreSQL

## Pre-Render Deployment Steps

### Step 1: Local Testing

```bash
# 1. Restore dependencies
cd rena/Qiandao.Web
dotnet restore

# 2. Run migration (local PostgreSQL must be running)
cd ../../scripts
./run-migrations.sh  # or run-migrations.ps1 on Windows

# 3. Build
cd ../Qiandao.Web
dotnet build -c Release

# 4. Run locally
dotnet run --launch-profile https

# 5. Test health endpoint
curl http://localhost:5000/health
# Expected response: {"status":"healthy",...}

# 6. Test API endpoint
curl http://localhost:5000/api/device
# Expected response: {"code":0,"msg":"success","count":0,"data":[]}
```

### Step 2: Docker Local Testing

```bash
# 1. Build Docker image
docker build -f rena/Dockerfile -t qiandao-sdk:local .

# 2. Run container with test database
docker run -d \
  -p 8080:8080 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5432 \
  -e DB_USER=postgres \
  -e DB_PASSWORD=your_password \
  -e DB_NAME=postgres \
  -e ASPNETCORE_ENVIRONMENT=Production \
  --name qiandao-test \
  qiandao-sdk:local

# 3. Wait for startup
sleep 5

# 4. Check logs
docker logs qiandao-test

# 5. Test health endpoint
curl http://localhost:8080/health

# 6. Stop container
docker stop qiandao-test
docker rm qiandao-test
```

### Step 3: Database Preparation on Render

1. **Get Supabase Credentials**
   - Go to Supabase Dashboard → Project Settings → Database
   - Note the connection pooler details

2. **Run Migration**
   ```bash
   export DB_HOST="your-project.pooler.supabase.com"
   export DB_PORT="6543"
   export DB_USER="postgres.YOUR_PROJECT_ID"
   export DB_PASSWORD="your_password"
   export DB_NAME="postgres"
   
   ./scripts/run-migrations.sh
   ```

3. **Verify Tables**
   ```bash
   psql -h your-project.pooler.supabase.com \
        -p 6543 \
        -U postgres.YOUR_PROJECT_ID \
        -d postgres \
        -c "\dt"
   ```

## Render Deployment

### Step 1: Create Render Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository (with rena/ folder)
4. Configure:
   - **Name**: `qiandao-sdk`
   - **Environment**: Docker
   - **Dockerfile Path**: `rena/Dockerfile`
   - **Instance Type**: Starter Pro ($12/mo, recommended for stability)

### Step 2: Set Environment Variables

In Render → qiandao-sdk → Environment:

```
DB_HOST = your-project.pooler.supabase.com
DB_PORT = 6543
DB_USER = postgres.YOUR_PROJECT_ID
DB_PASSWORD = your_supabase_password
DB_NAME = postgres
ASPNETCORE_ENVIRONMENT = Production
```

### Step 3: Deploy

1. Click "Create Web Service"
2. Wait for build to complete (5-10 minutes)
3. Verify status is "Live" (green)
4. Copy the service URL: `https://qiandao-sdk.onrender.com`

## Post-Deployment Validation

### ✅ Health Checks

```bash
# Test health endpoint
curl https://qiandao-sdk.onrender.com/health

# Expected response:
# {"status":"healthy","timestamp":"...","environment":"Production","service":"Qiandao SDK"}
```

### ✅ API Endpoints

```bash
# List devices
curl https://qiandao-sdk.onrender.com/api/device
# Expected: {"code":0,"msg":"success","count":0,"data":[]}

# Get records
curl https://qiandao-sdk.onrender.com/api/records?page=1&limit=10
# Expected: {"code":0,"msg":"成功","data":[],"count":0}
```

### ✅ Database Connection

1. Check Render logs for connection errors:
   - Render Dashboard → qiandao-sdk → Logs
   - Look for "Connection successful" message

2. Verify in Supabase:
   ```sql
   SELECT * FROM application_logs 
   ORDER BY timestamp DESC 
   LIMIT 5;
   ```

### ✅ Monitoring

1. **Render Logs**
   - Monitor real-time logs in Render Dashboard
   - Check for errors or warnings

2. **Database Logs**
   - Query `application_logs` table for application events
   - Query `biometric_sync_logs` for sync operations

3. **Error Handling**
   - Test with invalid requests to verify error logging
   - Check logs appear in database

## Troubleshooting

### Service Won't Start

**Logs show "Connection refused"**:
- Verify DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in Render environment
- Ensure PostgreSQL migration was run
- Test connection locally: `psql -h $DB_HOST -U $DB_USER`

**Logs show "Tables not found"**:
- Migration didn't run
- Run migration script again
- Verify migration file exists: `rena/migrations/001_initial_schema.sql`

### Slow Startup

- Normal on Render Starter plan (first cold start can be 30+ seconds)
- Upgrade to Starter Pro for better performance

### Out of Memory

- Upgrade Render instance type
- Check for memory leaks in logs
- Consider using connection pooling settings in `appsettings.Production.json`

### Database Timeout

- Increase `Timeout` in connection string (set to 30 seconds)
- Use connection pooler port (6543) instead of direct port (5432)
- Verify connection string has correct format

## Performance Optimization

### Database Connection Pooling

Already configured in `appsettings.Production.json`:
```
Pooling=true;Minimum Pool Size=5;Maximum Pool Size=20;
```

### Caching

Consider adding caching layers for frequently accessed data:
- Redis (optional)
- In-memory cache (app)

### Logging Level

For production, logging is set to `Information` level.
- Reduce to `Warning` for high traffic
- Keep `Information` for debugging issues

### Database Indexes

All critical indexes created in migration:
- `device.serial_num`
- `record.device_serial_num`
- `record.enroll_id`
- `record.records_time`
- `application_logs.timestamp`
- `biometric_sync_logs.device_sn`

## Maintenance

### Regular Tasks

1. **Daily**: Monitor logs in Render and Supabase
2. **Weekly**: Check application_logs table size:
   ```sql
   SELECT pg_size_pretty(pg_total_relation_size('application_logs'));
   ```
3. **Monthly**: Archive old logs if needed:
   ```sql
   DELETE FROM application_logs WHERE timestamp < NOW() - INTERVAL '90 days';
   ```

### Updates

1. Test locally before deploying
2. Update code
3. Push to GitHub
4. Render auto-deploys (can be disabled in settings)
5. Or manually trigger deployment in Render Dashboard

### Backup

- Supabase PostgreSQL backups are automatic
- Enable point-in-time recovery in Supabase settings
- Regular manual exports recommended:
  ```bash
  pg_dump -h host -U user -d database > backup.sql
  ```

## Rollback Procedure

If deployment fails:

1. **Render Dashboard** → qiandao-sdk → "Current Deployment"
2. Click the previous deployment to rollback
3. Or redeploy from specific GitHub commit

## Support

### Resources

- [Render Documentation](https://render.com/docs)
- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [Npgsql Documentation](https://www.npgsql.org/)
- [ASP.NET Core on Render](https://render.com/docs/deploy-dotnet)

### Debugging

1. Enable detailed logging in `appsettings.Production.json`
2. Check Render logs in real-time
3. Query database logs
4. Use `curl` to test endpoints manually

## Success Criteria

- [ ] Dockerfile builds without errors
- [ ] Render deployment shows "Live" status
- [ ] Health check endpoint responds with "healthy" status
- [ ] API endpoints return data without 500 errors
- [ ] Database connection is established
- [ ] Logs are written to application_logs table
- [ ] No error messages in Render logs
- [ ] Service is accessible from external URL

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: ✅ Ready for Production
