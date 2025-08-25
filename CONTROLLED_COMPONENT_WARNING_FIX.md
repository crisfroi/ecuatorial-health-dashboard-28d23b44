# Fix for Controlled Component Warning in PagosGuardias

## Problem
React warning: "A component is changing an uncontrolled input to be controlled. This is likely caused by the value changing from undefined to a defined value."

## Root Cause
Property name mismatch between the `formData` state and the form fields in the JSX:

**Initial state had:**
- `profesional_guardia_id` but form used `profesional_id`
- `importe` but form used `monto`  
- `forma_pago` but form used `metodo_pago`
- Missing `referencia_pago` property

This caused form fields to have `undefined` values initially, triggering the controlled component warning.

## Solution Applied

### 1. Fixed Initial State
Updated `formData` to include all required properties with default values:

```javascript
const [formData, setFormData] = useState({
  nomina_id: '',
  profesional_guardia_id: '',
  profesional_id: '',           // ✅ Added
  importe: 0,
  monto: 0,                     // ✅ Added
  forma_pago: 'TRANSFERENCIA',
  metodo_pago: 'TRANSFERENCIA', // ✅ Added
  comprobante_url: '',
  referencia_pago: '',          // ✅ Added
  observaciones: ''
});
```

### 2. Updated handleEdit Function
Enhanced to provide fallback values and handle property name variations:

```javascript
const handleEdit = (pago: any) => {
  setFormData({
    nomina_id: pago.nomina_id || '',
    profesional_id: pago.profesional_id || pago.profesional_guardia_id || '',
    monto: pago.monto || pago.importe || 0,
    metodo_pago: pago.metodo_pago || pago.forma_pago || 'TRANSFERENCIA',
    referencia_pago: pago.referencia_pago || '',
    // ... other fields with fallbacks
  });
};
```

### 3. Updated resetForm Function
Ensured all form fields are reset with defined values:

```javascript
const resetForm = () => {
  setFormData({
    nomina_id: '',
    profesional_id: '',
    monto: 0,
    metodo_pago: 'TRANSFERENCIA',
    referencia_pago: '',
    observaciones: ''
    // ... all fields with defined defaults
  });
};
```

## Impact
- ✅ Eliminated controlled component warning
- ✅ Consistent form field behavior
- ✅ Better user experience with predictable form state
- ✅ All inputs now start as controlled components from initialization

## Files Modified
- `src/components/guardias/tabs/PagosGuardias.tsx`

## Testing
The controlled component warning should no longer appear when:
- Opening the form dialog
- Editing existing payments
- Resetting the form
- Switching between create/edit modes

## Date
Applied: $(date)
