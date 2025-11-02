# Biometric Sync Edge Function - Critical Fixes

## Issues Identified & Fixed

### 1. **Invalid Supabase Insert Parameter**
**Problem**: Line 103 used `{ ignoreDuplicates: true }` which doesn't exist in Supabase.js
```typescript
// ❌ BEFORE - This caused insert to fail silently
const { error } = await supabase
  .from("attendance_logs")
  .insert(logs, { ignoreDuplicates: true });
```

**Solution**: Removed the invalid parameter and properly handle errors
```typescript
// ✅ AFTER
const { error: insertError } = await supabase
  .from("attendance_logs")
  .insert(logs);

if (insertError) {
  console.error("Insert error:", insertError);
  return { synced: 0, error: insertError.message };
}
```

### 2. **UUID Type Constraint Violation**
**Problem**: When dispositivo not found, code assigned string to UUID field
```typescript
// ❌ BEFORE - dispositivoId could be undefined, then passed string deviceSn
id_dispositivo: dispositivoId || deviceSn  // deviceSn is string, field needs UUID
```

**Solution**: Validate dispositivo exists before proceeding
```typescript
// ✅ AFTER
if (devError || !dispositivo?.id) {
  const errorMsg = `Dispositivo not found for SN: ${deviceSn || "default"}`;
  console.error(errorMsg);
  return { synced: 0, error: errorMsg };
}
const dispositivoId = dispositivo.id; // Now guaranteed to be UUID
```

### 3. **Inconsistent En_No Normalization**
**Problem**: Edge function used raw `enroll_id` while UI import normalizes it
```typescript
// ❌ BEFORE - No normalization
en_no: `${r.enroll_id}`,  // Raw number: "12345"
```

**Solution**: Normalize like useAsistencia.ts does (digits only, max 10 chars)
```typescript
// ✅ AFTER - Matches UI normalization
const sanitized_en_no = String(r.enroll_id)
  .replace(/\D/g, "")     // Remove non-digits
  .slice(0, 10) || null;  // Max 10 characters
```

### 4. **Unnecessary created_at Assignment**
**Problem**: Passing created_at timestamp when DB has default
```typescript
// ❌ BEFORE - Unnecessary field
created_at: new Date().toISOString(),
```

**Solution**: Let database set created_at via default value
```typescript
// ✅ AFTER - Removed, DB will set it automatically
// created_at field not included in insert
```

## Data Integration Flow

### File Import (useAsistencia.ts)
1. Parse TXT/XLS file
2. Extract en_no and normalize: `String(enRaw).replace(/\D/g, '').slice(0, 10)`
3. Validate TMNo against dispositivo
4. Resolve id_profesional via `empleado_dispositivo_map`
5. Insert into `attendance_logs`

### Biometric SDK Sync (sync-biometric-device)
1. Call SDK endpoint: `GET /api/record`
2. Get dispositivo by name from dispositivos table
3. Normalize en_no same way: `String(r.enroll_id).replace(/\D/g, '').slice(0, 10)`
4. Set id_profesional=null (to be linked later via mapping)
5. Insert into `attendance_logs`

### Data Resolution
After both imports, professional_id must be resolved via:
```sql
SELECT edm.id_profesional 
FROM empleado_dispositivo_map edm
WHERE edm.en_no = attendance_logs.en_no
  AND edm.id_dispositivo = attendance_logs.id_dispositivo
```

## Database Schema (attendance_logs)
```sql
- id (uuid, pk)
- id_dispositivo (uuid, fk → dispositivos)
- id_profesional (uuid, nullable, fk → profesionales_sanitarios)
- en_no (varchar, nullable) - Enrollment number, normalized
- inout (enum: IN|OUT, nullable)
- mode (varchar, nullable) - Biometric mode
- fecha_hora (timestamptz)
- raw_line (text, nullable) - Original record JSON
- source_file (varchar) - Source: "biometric_sdk" or filename
- tm_no (varchar, nullable) - Terminal number
- created_at (timestamptz, default: now())
```

## Verification Checklist

- ✅ Edge function deployed to Supabase (version 10)
- ✅ Removed invalid `ignoreDuplicates: true` parameter
- ✅ Added dispositivo existence validation
- ✅ Normalized en_no consistently with UI imports
- ✅ Fixed UUID field assignments
- ✅ Proper error handling and logging
- ✅ Edge function logs sync activity to `biometric_sync_logs`

## Testing

To test the biometric import:

1. Create a device via UI:
   - Go to Asistencia tab → Dispositivos de Fichaje
   - Name: e.g., "Device-001"
   - Optional: Set ubicación, centro_salud_id

2. Map employee IDs (optional, for id_profesional resolution):
   - Upload Personal.xls with EN_NO → Professional mappings
   - Create mapeos in empleado_dispositivo_map table

3. Import biometric data:
   - Manual file import (TXT/DAT/CSV)
   - OR SDK sync via useBiometricSync hook

4. Verify in database:
   ```sql
   SELECT * FROM attendance_logs 
   WHERE source_file = 'biometric_sdk'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

## Error Handling

The function now properly returns:
- `{ synced: 0, error: "Dispositivo not found..." }` if device not registered
- `{ synced: 0, error: "No records returned from SDK" }` if SDK empty
- `{ synced: N, error: null }` on success
- Database errors properly logged and returned

All errors are also recorded in `biometric_sync_logs` table for audit trail.
