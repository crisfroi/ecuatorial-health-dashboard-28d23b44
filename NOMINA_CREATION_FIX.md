# Nomina Creation Fix - Centro Salud ID Requirement

## Problem Description
Users were experiencing a `23502` error when trying to generate nominas:
```
❌ Error creating nomina: [object Object]
🔍 Error object JSON: {
  "code": "23502",
  "details": null,
  "hint": null,
  "message": "null value in column \"centro_salud_id\" of relation \"nominas_guardias\" violates not-null constraint"
}
💥 Exception in generateNomina: Error: null value in column "centro_salud_id" of relation "nominas_guardias" violates not-null constraint
```

## Root Cause Analysis
- The `nominas_guardias` table has a NOT NULL constraint on `centro_salud_id`
- The UI was allowing users to generate nominas without selecting a center
- When `selectedCenter` was null, the `generateNomina` function passed `null` to the database
- `23502` PostgreSQL error code indicates "not_null_violation"

## Solution Implemented

### 1. Backend Validation (`src/stores/useGuardiasStore.ts`)
```typescript
// Added validation before creating nomina
if (!data.centro_id) {
  throw new Error('Debe seleccionar un centro de salud para generar la nómina');
}

// Changed from nullable to required
const nominaData = {
  centro_salud_id: data.centro_id, // Previously: data.centro_id || null
  mes: data.mes,
  anio: data.ano,
  // ... rest of data
};
```

### 2. Frontend Validation (`src/components/guardias/tabs/NominaGuardias.tsx`)
```typescript
const handleGenerateNomina = async () => {
  if (!selectedCenter) {
    toast({
      title: "Error",
      description: "Debe seleccionar un centro de salud para generar la nómina.",
      variant: "destructive"
    });
    return;
  }
  // ... continue with generation
};
```

### 3. UI Improvements
- **Button State**: Disabled generate button when no center is selected
- **Visual Feedback**: Added warning icon and message when center is not selected
- **Enhanced Messages**: Clear explanation of center requirement
- **Color Coding**: Green checkmark for selected center, red warning for missing center

### 4. Auto-Selection Feature (`src/components/guardias/GuardiasDashboard.tsx`)
```typescript
// Import AuthContext to access user profile
import { useAuthContext } from '@/contexts/AuthContext';

// Auto-select user's assigned center
const [selectedCenter, setSelectedCenter] = useState<string | null>(user?.assigned_center_id || null);

// Effect to auto-select when user data loads
useEffect(() => {
  if (user?.assigned_center_id && !selectedCenter) {
    setSelectedCenter(user.assigned_center_id);
  }
}, [user?.assigned_center_id, selectedCenter]);
```

## Files Modified
1. **`src/stores/useGuardiasStore.ts`**
   - Added validation for `centro_id` before nomina creation
   - Removed nullable fallback for `centro_salud_id`

2. **`src/components/guardias/tabs/NominaGuardias.tsx`**
   - Added frontend validation with toast notification
   - Disabled generate button when no center selected
   - Enhanced UI messages and visual feedback

3. **`src/components/guardias/GuardiasDashboard.tsx`**
   - Added AuthContext import and user access
   - Auto-select user's assigned center when available
   - Added effect to monitor user's assigned center

## User Experience Improvements
- **Clear Error Messages**: Users now see specific validation errors
- **Visual Indicators**: Clear color-coded status for center selection
- **Auto-Selection**: Users with assigned centers get them pre-selected
- **Prevented Invalid Actions**: Cannot generate nomina without center selection

## Database Constraint Compliance
The fix ensures compliance with the database schema:
```sql
-- nominas_guardias table constraint
centro_salud_id uuid NOT NULL REFERENCES centros_salud(id)
```

## Testing Scenarios
1. ✅ User with assigned center: Auto-selects center, can generate nomina
2. ✅ User without assigned center: Must select center before generation
3. ✅ No center selected: Clear validation error, disabled generate button
4. ✅ Center selected: Successful nomina generation
5. ✅ Backend validation: Prevents null center_salud_id at database level

## Error Prevention
- **Frontend**: Early validation prevents unnecessary API calls
- **Backend**: Server-side validation ensures data integrity
- **UI**: Clear guidance prevents user confusion
- **Auto-Selection**: Reduces manual steps for users with assigned centers

## Date Fixed
December 2024

## Status
✅ RESOLVED - Centro salud ID requirement properly enforced with comprehensive validation and user experience improvements
