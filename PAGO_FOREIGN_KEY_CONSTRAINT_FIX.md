# Fix for Pago Creation Foreign Key Constraint Error

## Problem
Error creating pago: [object Object] with details showing:
- Code: 23503 (foreign key constraint violation)
- Message: "insert or update on table \"pagos_guardias\" violates foreign key constraint \"pagos_guardias_profesional_guardia_id_fkey\""
- Details: "Key is not present in table \"profesionales_guardias\"."

## Root Cause
The PagosGuardias form was using `profesionales` data from `profesionales_sanitarios` table, but the `pagos_guardias` table requires a `profesional_guardia_id` that exists in the `profesionales_guardias` table.

**Table Relationship:**
- `profesionales_sanitarios` → Contains basic professional info
- `profesionales_guardias` → Contains guardias-specific info (references `profesional_id` from `profesionales_sanitarios`)
- `pagos_guardias.profesional_guardia_id` → Must reference `profesionales_guardias.id`

## Solution Applied

### 1. Added ProfesionalGuardia Interface
```typescript
export interface ProfesionalGuardia {
  id: string;
  profesional_id: string;
  nombre_completo?: string; // Joined from profesionales_sanitarios
  categoria: 'especialista' | 'general_licenciado' | 'tecnico_diplomado' | 'auxiliar' | 'subalterno' | 'odepac' | 'secre_asist_pacientes' | 'caja';
  unidad_servicio: string;
  banco?: string;
  iban_cuenta?: string;
  activo: boolean;
  telefono_guardias?: string;
  email_guardias?: string;
}
```

### 2. Added Store State and Function
**Added to store state:**
```typescript
profesionalesGuardias: ProfesionalGuardia[];
```

**Added fetchProfesionalesGuardias function:**
```typescript
fetchProfesionalesGuardias: async (centroId) => {
  let query = supabase
    .from('profesionales_guardias')
    .select(`
      id,
      profesional_id,
      categoria,
      unidad_servicio,
      banco,
      iban_cuenta,
      activo,
      telefono_guardias,
      email_guardias,
      profesionales_sanitarios!inner (
        id,
        nombre_completo,
        centro_salud_id
      )
    `)
    .eq('activo', true);

  if (centroId) {
    query = query.eq('profesionales_sanitarios.centro_salud_id', centroId);
  }
  // ... process and return data
}
```

### 3. Updated PagosGuardias Component
**Updated imports and store usage:**
```typescript
const {
  profesionalesGuardias,
  fetchProfesionalesGuardias,
  // ... other imports
} = useGuardiasStore();
```

**Updated useEffect:**
```typescript
useEffect(() => {
  fetchPagos(selectedMonth, selectedYear, selectedCenter);
  fetchNominas(selectedMonth, selectedYear, selectedCenter);
  fetchProfesionalesGuardias(selectedCenter); // ✅ Added
}, [selectedMonth, selectedYear, selectedCenter]);
```

**Updated form dropdown:**
```typescript
<Select
  value={formData.profesional_guardia_id}
  onValueChange={(value) => setFormData(prev => ({ 
    ...prev, 
    profesional_guardia_id: value, 
    profesional_id: value 
  }))}
  required
>
  <SelectContent>
    {profesionalesGuardias.map((prof) => (
      <SelectItem key={prof.id} value={prof.id}>
        {prof.nombre_completo} - {prof.categoria} ({prof.unidad_servicio})
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Updated handleEdit function:**
```typescript
const handleEdit = (pago: any) => {
  setFormData({
    profesional_guardia_id: pago.profesional_guardia_id || '',
    profesional_id: pago.profesional_guardia_id || '', // Use profesional_guardia_id as primary
    // ... other fields
  });
};
```

### 4. Enhanced User Experience
The dropdown now shows:
- Professional name
- Category (especialista, general_licenciado, etc.)
- Service unit (Radiología, Psicología, etc.)

Example: "CRISOLOGO MBA AZEME ANDEME - general_licenciado (Radiología)"

## Benefits
- ✅ Fixed foreign key constraint violation
- ✅ Only shows professionals who are set up for guardias system
- ✅ Provides more context in professional selection (category + unit)
- ✅ Ensures data integrity by using correct table relationships
- ✅ Better error prevention by showing only valid options

## Database Query Used
The new function uses a JOIN to get professional info:

```sql
SELECT 
  pg.id,
  pg.profesional_id,
  pg.categoria,
  pg.unidad_servicio,
  ps.nombre_completo
FROM profesionales_guardias pg
INNER JOIN profesionales_sanitarios ps ON pg.profesional_id = ps.id
WHERE pg.activo = true
  AND (ps.centro_salud_id = ? OR ? IS NULL)
ORDER BY ps.nombre_completo;
```

## Files Modified
- `src/stores/useGuardiasStore.ts` - Added interface, state, and fetch function
- `src/components/guardias/tabs/PagosGuardias.tsx` - Updated to use profesionalesGuardias

## Testing
After this fix:
- Payment creation should work without foreign key errors
- Form shows only professionals who are in guardias system
- Better professional identification with category and service unit

## Date
Applied: $(date)
