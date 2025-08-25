# Fix for Pago Creation UUID Validation Error

## Problem
Error creating pago: [object Object] with details showing:
- Code: 22P02 (invalid text representation)
- Message: "invalid input syntax for type uuid: \"\""

## Root Cause
Multiple issues were causing the UUID validation error:

1. **Empty String UUIDs**: Form fields were passing empty strings `""` instead of `null` for UUID fields
2. **Property Name Mismatch**: Form used different property names than database expected:
   - Form: `profesional_id` → Database: `profesional_guardia_id`
   - Form: `monto` → Database: `importe`
   - Form: `metodo_pago` → Database: `forma_pago`
3. **Invalid Enum Values**: Form used values not matching database constraints:
   - Form: `'TRANSFERENCIA'` → Database: `'transfer_trabajador'`
   - Form: `'aprobado'` → Database: `'realizado'`

## Database Constraints
**forma_pago** must be one of:
- `'transfer_trabajador'`
- `'transfer_hospital'`
- `'efectivo'`
- `'cheque'`

**estado** must be one of:
- `'pendiente'`
- `'realizado'`
- `'confirmado'`

## Solution Applied

### 1. Enhanced createPago Function
Added data validation and property mapping:

```javascript
const pagoData = {
  nomina_id: data.nomina_id && data.nomina_id.trim() !== '' ? data.nomina_id : null,
  profesional_guardia_id: data.profesional_guardia_id && data.profesional_guardia_id.trim() !== '' 
    ? data.profesional_guardia_id 
    : (data.profesional_id && data.profesional_id.trim() !== '' ? data.profesional_id : null),
  forma_pago: data.forma_pago || data.metodo_pago || 'transfer_trabajador',
  importe: data.importe || data.monto || 0,
  // ... other fields with null conversion
};

// Added validation
if (!pagoData.nomina_id) throw new Error('Debe seleccionar una nómina');
if (!pagoData.profesional_guardia_id) throw new Error('Debe seleccionar un profesional');
if (!pagoData.importe || pagoData.importe <= 0) throw new Error('El importe debe ser mayor a 0');
```

### 2. Updated Form Component
Fixed PagosGuardias.tsx to use correct database values:

**Initial State:**
```javascript
forma_pago: 'transfer_trabajador', // ✅ Valid DB value
metodo_pago: 'transfer_trabajador', // ✅ Valid DB value
```

**Form Options:**
```javascript
<SelectItem value="transfer_trabajador">Transferencia al Trabajador</SelectItem>
<SelectItem value="transfer_hospital">Transferencia al Hospital</SelectItem>
<SelectItem value="efectivo">Efectivo</SelectItem>
<SelectItem value="cheque">Cheque</SelectItem>
```

**Estado Options:**
```javascript
<SelectItem value="pendiente">Pendientes</SelectItem>
<SelectItem value="realizado">Realizados</SelectItem>
<SelectItem value="confirmado">Confirmados</SelectItem>
```

### 3. Updated Store Functions
Fixed `aprobarPago` and `rechazarPago` to use correct states:

```javascript
aprobarPago: async (id) => {
  await get().updatePago(id, {
    estado: 'realizado', // ✅ Valid DB value (was 'aprobado')
    fecha_pago: new Date().toISOString()
  });
},

rechazarPago: async (id) => {
  await get().updatePago(id, { 
    estado: 'pendiente', // ✅ Reset to pending with note
    observaciones: 'Pago rechazado - requiere revisión'
  });
}
```

### 4. Updated UI Components
- Fixed badge functions to display correct values
- Updated filter options to match database constraints
- Updated tab labels and content to use correct terminology
- Added backwards compatibility for existing data

## Impact
- ✅ Fixed UUID validation error
- ✅ Form submissions now work correctly
- ✅ Data consistency with database constraints
- ✅ Proper property name mapping
- ✅ Enhanced validation and error messages
- ✅ UI terminology matches database values

## Files Modified
- `src/stores/useGuardiasStore.ts` - Enhanced createPago, aprobarPago, rechazarPago
- `src/components/guardias/tabs/PagosGuardias.tsx` - Form fields, options, badges, filters

## Testing
After this fix:
- Payment creation should work without UUID errors
- Form dropdowns show correct options
- Status changes use valid database values
- Filters work with actual data

## Date
Applied: $(date)
