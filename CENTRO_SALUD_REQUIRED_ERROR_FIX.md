# Fix for "Centro de salud es requerido" Error in createGuardia

## Problem
Error occurring in createGuardia function with stack trace:
```
💥 Exception in createGuardia: Error: Centro de salud es requerido
    at createGuardia (useGuardiasStore.ts:629)
    at async handleSubmit (RegistroGuardias.tsx:114)
```

## Root Cause
The error was caused by insufficient frontend validation in the RegistroGuardias component:

1. **Form Initialization**: `formData.centro_salud_id` was initialized as `selectedCenter || ''`
2. **When `selectedCenter` is null**: The `centro_salud_id` becomes an empty string
3. **Backend Validation**: The createGuardia function has validation: `if (!data.centro_salud_id)` which treats empty string as falsy
4. **Missing Frontend Validation**: The form could be submitted without a center selected, leading to backend error

## Backend Validation Context
The validation exists in useGuardiasStore.ts at two locations:

**Location 1 (lines 628-630):**
```typescript
if (!data.centro_salud_id) {
  throw new Error('Centro de salud es requerido');
}
```

**Location 2 (lines 719-721):**
```typescript
if (!data.centro_salud_id) {
  throw new Error('Centro de salud es requerido');
}
```

## Solution Applied

### 1. Added Frontend Validation
Enhanced the `handleSubmit` function in RegistroGuardias.tsx:

```typescript
// Validate centro_salud_id before submission
if (!formData.centro_salud_id || formData.centro_salud_id.trim() === '') {
  toast({
    title: "Centro de salud requerido",
    description: selectedCenter 
      ? "No se ha podido determinar el centro de salud. Seleccione uno desde el dashboard."
      : "Debe seleccionar un centro de salud del formulario para registrar la guardia",
    variant: "destructive",
  });
  return;
}
```

### 2. Added Professional Validation
Also added validation for profesional_ids to prevent similar issues:

```typescript
// Validate profesional_ids before submission
if (!formData.profesional_ids || formData.profesional_ids.length === 0) {
  toast({
    title: "Profesional requerido",
    description: "Debe seleccionar al menos un profesional para la guardia",
    variant: "destructive",
  });
  return;
}
```

### 3. Enhanced Center Selection Sync
Added useEffect to keep formData in sync when selectedCenter changes:

```typescript
// Update formData when selectedCenter changes
useEffect(() => {
  if (selectedCenter && selectedCenter !== formData.centro_salud_id) {
    setFormData(prev => ({ ...prev, centro_salud_id: selectedCenter }));
  }
}, [selectedCenter]);
```

## Form Behavior Analysis

The form has conditional center selection:

```typescript
{!selectedCenter && (
  <div>
    <Label htmlFor="centro_salud_id">Centro de Salud *</Label>
    <Select
      value={formData.centro_salud_id}
      onValueChange={(value) => setFormData(prev => ({ ...prev, centro_salud_id: value }))}
      required
    >
      <SelectTrigger>
        <SelectValue placeholder="Seleccionar centro" />
      </SelectTrigger>
      <SelectContent>
        {centros.map((centro) => (
          <SelectItem key={centro.id} value={centro.id}>
            {centro.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)}
```

**Two scenarios:**
1. **Center pre-selected** (`selectedCenter` exists): Form uses it automatically, dropdown hidden
2. **No center selected** (`selectedCenter` is null): User must select from dropdown

## Validation Messages

The error message adapts to the scenario:

- **When `selectedCenter` exists but form data is missing**: "No se ha podido determinar el centro de salud. Seleccione uno desde el dashboard."
- **When no `selectedCenter` and user hasn't selected**: "Debe seleccionar un centro de salud del formulario para registrar la guardia"

## Impact
- ✅ Prevents submission of forms without center selection
- ✅ Provides clear user feedback about what's missing
- ✅ Maintains backend validation as final safety check
- ✅ Automatically syncs center when selectedCenter changes
- ✅ Improves user experience with proper error messages

## Files Modified
- `src/components/guardias/tabs/RegistroGuardias.tsx` - Added frontend validation and center sync

## Testing
After this fix:
- Users cannot submit forms without selecting a center
- Clear error messages guide users on what to do
- Form stays in sync when center is selected at dashboard level
- Backend validation serves as final safety check

## Date
Applied: $(date)
