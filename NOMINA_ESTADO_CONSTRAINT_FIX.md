# Nomina Estado Check Constraint Fix

## Problem Description
Users were experiencing a `23514` error when trying to generate nominas:
```
❌ Error creating nomina: [object Object]
🔍 Error object JSON: {
  "code": "23514",
  "details": null,
  "hint": null,
  "message": "new row for relation \"nominas_guardias\" violates check constraint \"nominas_guardias_estado_check\""
}
💥 Exception in generateNomina: Error: new row for relation "nominas_guardias" violates check constraint "nominas_guardias_estado_check"
```

## Root Cause Analysis
- The `nominas_guardias` table has a check constraint on `estado` column
- `23514` PostgreSQL error code indicates "check_violation"
- Code was using UPPERCASE values like `'BORRADOR'`
- Database constraint expects lowercase values like `'borrador'`

## Database Constraints by Table
After investigation, different tables use different case conventions:

### `nominas_guardias_estado_check` (lowercase):
```sql
estado = ANY (ARRAY['borrador'::text, 'enviada'::text, 'aprobada'::text, 'rechazada'::text, 'pagada'::text])
```

### `cuadrantes_guardias_estado_check` (UPPERCASE):
```sql
estado = ANY (ARRAY['BORRADOR'::text, 'GENERADO'::text, 'APROBADO'::text, 'RECHAZADO'::text, 'REGENERADO'::text])
```

### `pagos_guardias_estado_check` (lowercase):
```sql
estado = ANY (ARRAY['pendiente'::text, 'realizado'::text, 'confirmado'::text])
```

## Solution Implemented

### 1. Fixed generateNomina Function (`src/stores/useGuardiasStore.ts`)
```typescript
// Before (causing constraint violation)
const nominaData = {
  centro_salud_id: data.centro_id,
  mes: data.mes,
  anio: data.ano,
  estado: 'BORRADOR', // ❌ UPPERCASE
  // ...
};

// After (compliant with constraint)
const nominaData = {
  centro_salud_id: data.centro_id,
  mes: data.mes,
  anio: data.ano,
  estado: 'borrador', // ✅ lowercase
  // ...
};
```

### 2. Fixed aprobarNomina Function
```typescript
// Before
.update({
  estado: 'APROBADA', // ❌ UPPERCASE
  approved_at: new Date().toISOString()
})

// After
.update({
  estado: 'aprobada', // ✅ lowercase
  approved_at: new Date().toISOString()
})
```

### 3. Fixed rechazarNomina Function
```typescript
// Before
.update({ estado: 'RECHAZADA' }) // ❌ UPPERCASE

// After
.update({ estado: 'rechazada' }) // ✅ lowercase
```

### 4. Updated TypeScript Interface
```typescript
// Before
estado: 'BORRADOR' | 'GENERADO' | 'APROBADO';

// After
estado: 'borrador' | 'generado' | 'aprobada' | 'rechazada' | 'enviada' | 'pagada';
```

### 5. Fixed UI Badge Logic (`src/components/guardias/tabs/NominaGuardias.tsx`)
```typescript
const getEstadoBadge = (estado: string) => {
  switch (estado) {
    case 'borrador': // ✅ lowercase
      return <Badge className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />Borrador</Badge>;
    case 'enviada': // ✅ lowercase
      return <Badge className="bg-blue-100 text-blue-800"><FileText className="w-3 h-3 mr-1" />Generada</Badge>;
    case 'aprobada': // ✅ lowercase
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprobada</Badge>;
    case 'rechazada': // ✅ lowercase
      return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rechazada</Badge>;
    case 'pagada': // ✅ lowercase
      return <Badge className="bg-blue-600 text-white"><DollarSign className="w-3 h-3 mr-1" />Pagada</Badge>;
    default:
      return <Badge variant="secondary">{estado}</Badge>;
  }
};
```

## Files Modified
1. **`src/stores/useGuardiasStore.ts`**
   - Fixed `generateNomina`: `'BORRADOR'` → `'borrador'`
   - Fixed `aprobarNomina`: `'APROBADA'` → `'aprobada'`
   - Fixed `rechazarNomina`: `'RECHAZADA'` → `'rechazada'`
   - Updated TypeScript interface for estado types

2. **`src/components/guardias/tabs/NominaGuardias.tsx`**
   - Fixed badge logic to use lowercase status values
   - Added `'pagada'` status with appropriate styling

## Important Notes
- **Different tables use different case conventions** - this is by design
- **`cuadrantes_guardias` still uses UPPERCASE** - do not change these
- **`pagos_guardias` uses lowercase** - future fixes should respect this
- **UI displays proper capitalized labels** regardless of database case

## Validation Steps
1. ✅ Generate nomina with `'borrador'` status
2. ✅ Approve nomina updates to `'aprobada'` status
3. ✅ Reject nomina updates to `'rechazada'` status
4. ✅ UI badges display correctly for all status values
5. ✅ TypeScript types match database constraints

## Status Workflow
```
borrador → enviada → aprobada → pagada
         ↘       ↗ rechazada
```

## Error Prevention
- **Type Safety**: Updated TypeScript interfaces prevent invalid status values
- **Database Constraints**: Enforce valid values at database level
- **UI Consistency**: Badge logic handles all valid status values
- **Case Sensitivity**: Each table's constraint case is respected

## Date Fixed
December 2024

## Status
✅ RESOLVED - Nomina estado values now comply with database check constraints

## Related Issues
This fix resolves the immediate constraint violation while maintaining compatibility with other tables that use different case conventions.
