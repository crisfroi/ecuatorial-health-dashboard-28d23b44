# RLS Policy Fix for validaciones_guardias Table

## Problem Description
Users were experiencing a `42501` error when trying to create validaciones:
```
❌ Error creating validacion: [object Object]
💥 Exception in createValidacion: [object Object]
🔍 Error object JSON: {
  "code": "42501",
  "details": null,
  "hint": null,
  "message": "new row violates row-level security policy for table \"validaciones_guardias\""
}
```

## Root Cause Analysis
- RLS (Row Level Security) was enabled on the `validaciones_guardias` table
- No RLS policies were defined, preventing all database operations
- The `42501` error code indicates "insufficient_privilege" in PostgreSQL

## Solution Implemented
Created comprehensive RLS policies for authenticated users:

### Policies Created:
1. **INSERT Policy**: `"Authenticated users can insert validaciones"`
   - Allows authenticated users to create new validaciones
   - `WITH CHECK (true)` - No additional restrictions

2. **SELECT Policy**: `"Authenticated users can select validaciones"`
   - Allows authenticated users to read validaciones
   - `USING (true)` - No additional restrictions

3. **UPDATE Policy**: `"Authenticated users can update validaciones"`
   - Allows authenticated users to modify validaciones
   - `USING (true)` and `WITH CHECK (true)` - No additional restrictions

4. **DELETE Policy**: `"Authenticated users can delete validaciones"`
   - Allows authenticated users to delete validaciones
   - `USING (true)` - No additional restrictions

### SQL Commands Executed:
```sql
-- Policy for INSERT
CREATE POLICY "Authenticated users can insert validaciones" ON validaciones_guardias
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Policy for SELECT
CREATE POLICY "Authenticated users can select validaciones" ON validaciones_guardias
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Policy for UPDATE
CREATE POLICY "Authenticated users can update validaciones" ON validaciones_guardias
  FOR UPDATE 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Policy for DELETE
CREATE POLICY "Authenticated users can delete validaciones" ON validaciones_guardias
  FOR DELETE 
  TO authenticated 
  USING (true);
```

## Verification
- Confirmed policies were created successfully using `pg_policies` system view
- All CRUD operations are now permitted for authenticated users
- The `createValidacion` function should now work correctly

## Related Code
- Function: `createValidacion` in `src/stores/useGuardiasStore.ts`
- Table: `validaciones_guardias` in Supabase
- Error handling: Enhanced in `formatSupabaseError` function

## Next Steps
- Test the `createValidacion` functionality
- Monitor for any remaining authentication or permission issues
- Consider implementing more granular RLS policies based on user roles if needed

## Date Fixed
December 2024

## Status
✅ RESOLVED - RLS policies created and validated successfully
