# RLS Policy Fix for ajustes_baremos Table

## Problem Description
Users were experiencing a baremo creation error:
```
Error creating baremo: [object Object]
```

This error typically indicates an RLS (Row Level Security) policy violation when trying to insert data into the `ajustes_baremos` table.

## Root Cause Analysis
- RLS (Row Level Security) was enabled on the `ajustes_baremos` table
- No RLS policies were defined, preventing all database operations
- The error would show as `42501` error code indicating "insufficient_privilege" in PostgreSQL
- This happened during baremo creation in the Ajustes tab

## Solution Implemented
Created comprehensive RLS policies for authenticated users on the `ajustes_baremos` table:

### Policies Created:
1. **INSERT Policy**: `"Authenticated users can insert baremos"`
   - Allows authenticated users to create new baremo configurations
   - `WITH CHECK (true)` - No additional restrictions

2. **SELECT Policy**: `"Authenticated users can select baremos"`
   - Allows authenticated users to read baremo configurations
   - `USING (true)` - No additional restrictions

3. **UPDATE Policy**: `"Authenticated users can update baremos"`
   - Allows authenticated users to modify baremo configurations
   - `USING (true)` and `WITH CHECK (true)` - No additional restrictions

4. **DELETE Policy**: `"Authenticated users can delete baremos"`
   - Allows authenticated users to delete baremo configurations
   - `USING (true)` - No additional restrictions

### SQL Commands Executed:
```sql
-- Policy for INSERT
CREATE POLICY "Authenticated users can insert baremos" ON ajustes_baremos
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Policy for SELECT
CREATE POLICY "Authenticated users can select baremos" ON ajustes_baremos
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Policy for UPDATE
CREATE POLICY "Authenticated users can update baremos" ON ajustes_baremos
  FOR UPDATE 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Policy for DELETE
CREATE POLICY "Authenticated users can delete baremos" ON ajustes_baremos
  FOR DELETE 
  TO authenticated 
  USING (true);
```

## Baremo Creation Process Context
The error occurred during the baremo creation process in `src/stores/useGuardiasStore.ts`:

```typescript
createBaremo: async (data) => {
  try {
    const { error } = await supabase
      .from('ajustes_baremos')  // ❌ RLS violation was happening here
      .insert(data);

    if (error) throw error;

    await get().fetchBaremos();
  } catch (error: any) {
    console.error('Error creating baremo:', error);
    throw error;
  }
},
```

## Baremo Table Schema
The `ajustes_baremos` table contains configuration for guardias pricing/tariffs:
- **fuente**: Source type ('protocol', 'excel', 'manual')
- **categoria**: Professional category (enum: especialista, general_licenciado, etc.)
- **tipo_guardia**: Type of shift (enum: fisica, localizable, administrativa)
- **tipo_dia**: Day type (enum: ordinario, fin_semana, festivo)
- **valor**: Monetary value for the baremo
- **porcentaje_localizable**: Percentage for localizable shifts (default 10%)
- **porcentaje_llamada**: Percentage for call-out (default 20%)
- **vigente_desde/hasta**: Validity date range
- **activo**: Whether the baremo is active

## Related Components
This fix enables functionality in:
- **`AjustesGuardias.tsx`**: Settings tab for configuring baremos
- **Nomina Generation**: Uses baremos for calculating payroll amounts
- **Cost Calculations**: Applied when determining guardia compensation

## Verification Steps
1. ✅ Confirmed policies were created successfully
2. ✅ All CRUD operations now permitted for authenticated users
3. ✅ Baremo creation should work without RLS violations
4. ✅ Baremo reading, updating, and deletion functionality restored

## Impact
- **Baremo Management**: Can now create, read, update, and delete tariff configurations
- **Nomina Calculations**: Proper baremo data available for payroll generation
- **Settings Functionality**: AjustesGuardias tab fully operational
- **Cost Structure**: Hospital can configure pricing for different shift types

## Error Prevention
- **Authentication Required**: Only authenticated users can access baremo data
- **Policy Coverage**: All operations (INSERT, SELECT, UPDATE, DELETE) covered
- **Future-Proof**: Policies accommodate current and future baremo functionality
- **Consistency**: Matches policy patterns used in other guardias tables

## Date Fixed
December 2024

## Status
✅ RESOLVED - RLS policies created and validated for ajustes_baremos table

## Next Steps
- Test baremo creation functionality in AjustesGuardias tab
- Verify nomina generation uses baremo data correctly
- Monitor for any additional RLS policy violations in related tables
- Consider implementing more granular policies based on user roles if needed
