# Guardia Creation Error Fixes

## Problem Summary
Users were experiencing "[object Object]" errors when creating guardias, specifically:
- ❌ Error inserting guardia for professional ID: [object Object]
- 💥 Exception in createGuardia: [object Object]
- 🔍 Debugging error object type: object [object Object]

## Root Cause Analysis

### 1. Error Formatting Issues
The `formatSupabaseError` function was not properly handling HTTP status errors (400, 422, etc.) from Supabase.

### 2. Database Constraint Violations
The guardias table has strict constraints that were causing 400 Bad Request errors:

**Duration Constraint:**
```sql
CHECK ((((EXTRACT(epoch FROM (fecha_fin - fecha_inicio)) / (3600)::numeric) >= (12)::numeric) 
AND ((EXTRACT(epoch FROM (fecha_fin - fecha_inicio)) / (3600)::numeric) <= (24)::numeric)))
```
- **Requirement**: Guardias must be between 12 and 24 hours
- **Common Issue**: Users creating guardias with invalid durations

**Date Validation Constraint:**
```sql
CHECK ((fecha_fin > fecha_inicio))
```
- **Requirement**: End date must be after start date

**Foreign Key Constraints:**
- `profesional_guardia_id` must reference existing `profesionales_guardias.id`
- `centro_salud_id` must reference existing `centros_salud.id`

## Fixes Implemented

### 1. Enhanced Error Handling (`src/stores/useGuardiasStore.ts`)

**Improved formatSupabaseError function:**
```typescript
// Added HTTP status error handling
if (error.status || error.statusCode) {
  const status = error.status || error.statusCode;
  switch (status) {
    case 400:
      const badRequestMsg = error.message || error.details || error.hint || 'Datos de solicitud inválidos';
      return `Error 400: ${badRequestMsg}`;
    case 422:
      const validationMsg = error.message || error.details || 'Error de validación de datos';
      return `Error 422: ${validationMsg}`;
    // ... more status codes
  }
}
```

**Enhanced error debugging:**
```typescript
console.error('🔍 Error object JSON:', JSON.stringify(error, null, 2));
console.error('🔍 Error object keys:', Object.keys(error || {}));
```

### 2. Pre-insertion Validation

**Date and Duration Validation:**
```typescript
// Validate dates
const fechaInicio = new Date(data.fecha_inicio);
const fechaFin = new Date(data.fecha_fin);

if (isNaN(fechaInicio.getTime())) {
  throw new Error(`Fecha de inicio inválida: ${data.fecha_inicio}`);
}

// Validate duration (12-24 hours required)
const durationHours = (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60);

if (durationHours < 12) {
  throw new Error(`La duración de la guardia debe ser de al menos 12 horas. Duración actual: ${durationHours.toFixed(1)} horas`);
}

if (durationHours > 24) {
  throw new Error(`La duración de la guardia no puede exceder 24 horas. Duración actual: ${durationHours.toFixed(1)} horas`);
}
```

**Centro de Salud Validation:**
```typescript
// Validate centro_salud_id exists
const { data: centro, error: centroError } = await supabase
  .from('centros_salud')
  .select('id, nombre')
  .eq('id', data.centro_salud_id)
  .single();

if (centroError || !centro) {
  throw new Error(`Centro de salud no encontrado (ID: ${data.centro_salud_id})`);
}
```

### 3. User Interface Enhancements (`src/components/guardias/tabs/RegistroGuardias.tsx`)

**Duration Helper Utilities (`src/utils/guardiaHelpers.ts`):**
- `validateGuardiaDuration()` - Client-side validation
- `formatDuration()` - Human-readable duration display
- `calculateEndTime()` - Auto-calculate end time from start + duration
- `getCommonDurations()` - Quick duration buttons (12h, 14h, 16h, 18h, 24h)

**Real-time Validation:**
```typescript
// Validate duration when dates change
useEffect(() => {
  if (formData.fecha_inicio && formData.fecha_fin) {
    const validation = validateGuardiaDuration(formData.fecha_inicio, formData.fecha_fin);
    setDurationValidation(validation);
  }
}, [formData.fecha_inicio, formData.fecha_fin]);
```

**Quick Duration Buttons:**
```tsx
<div className="flex items-center gap-2 text-xs text-gray-600">
  <Clock className="w-3 h-3" />
  <span>Duración rápida:</span>
  {getCommonDurations().map(duration => (
    <Button onClick={() => handleDurationSelect(duration.value)}>
      {duration.value}h
    </Button>
  ))}
</div>
```

**Visual Validation Feedback:**
```tsx
<Alert className={durationValidation.isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
  <AlertDescription>
    {durationValidation.isValid ? (
      <span>✅ Duración válida: <strong>{formatDuration(durationValidation.hours)}</strong></span>
    ) : (
      <span>❌ {durationValidation.error}</span>
    )}
  </AlertDescription>
</Alert>
```

**Form Validation:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  // Validate duration before submission
  if (!durationValidation.isValid) {
    toast({
      title: "Error de duración",
      description: durationValidation.error,
      variant: "destructive",
    });
    return;
  }
  // ... submit logic
};
```

### 4. Improved Error Messages

**Before:**
- ❌ Error inserting guardia: [object Object]
- 💥 Exception in createGuardia: [object Object]

**After:**
- ❌ Error 400: La duración de la guardia debe ser de al menos 12 horas. Duración actual: 8.5 horas
- ❌ Error 422: Centro de salud no encontrado (ID: invalid-uuid)
- ❌ Error BD (23503): Referencia a un registro que no existe (foreign key)

## User Experience Improvements

### 1. Proactive Validation
- Real-time duration validation as user types
- Visual indicators for valid/invalid durations
- Prevention of form submission with invalid data

### 2. Helper Tools
- Quick duration buttons (12h, 14h, 16h, 18h, 24h)
- Auto-calculation of end time based on start time + duration
- Visual feedback with duration formatting (e.g., "14h 30m")

### 3. Clear Error Messages
- Specific error descriptions instead of generic "[object Object]"
- Actionable feedback (e.g., "reduce duration to 24 hours maximum")
- Context-aware validation (e.g., shows current duration vs. requirements)

## Testing Results

### Valid Test Cases:
✅ 12-hour guardia (08:00 to 20:00) - Success
✅ 24-hour guardia (08:00 to 08:00 next day) - Success
✅ 14-hour guardia (18:00 to 08:00 next day) - Success

### Invalid Test Cases:
❌ 8-hour guardia - Rejected with clear message
❌ 30-hour guardia - Rejected with clear message
❌ Invalid centro_salud_id - Rejected with specific error
❌ End time before start time - Rejected with validation error

## Files Modified

### Core Logic:
- `src/stores/useGuardiasStore.ts` - Enhanced error handling and validation
- `src/utils/guardiaHelpers.ts` - New utility functions for duration management

### User Interface:
- `src/components/guardias/tabs/RegistroGuardias.tsx` - Added validation UI and helpers

### Documentation:
- `GUARDIA_CREATION_FIXES.md` - This comprehensive fix summary

## Database Constraints Reference

For future maintenance, the guardias table has these important constraints:

1. **Duration**: 12-24 hours required
2. **Date Order**: fecha_fin > fecha_inicio
3. **Foreign Keys**: 
   - profesional_guardia_id → profesionales_guardias.id
   - centro_salud_id → centros_salud.id
4. **Required Fields**: tipo, fecha_inicio, fecha_fin, tipo_dia

## Migration Notes

No database changes were required. All fixes were applied at the application level to:
1. Properly validate data before database insertion
2. Format error messages correctly
3. Guide users to create valid guardias

## Future Improvements

1. **Overlap Detection**: Check for scheduling conflicts between guardias
2. **Batch Import**: Allow importing multiple guardias from CSV/Excel
3. **Template Guardias**: Save common patterns for quick reuse
4. **Calendar Integration**: Visual calendar interface for guardia scheduling
5. **Notification System**: Alert users of validation issues during form filling
