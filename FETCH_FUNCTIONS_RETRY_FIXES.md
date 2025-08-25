# Additional Fetch Functions Retry Logic Fixes

## Problem Summary
Additional "TypeError: Failed to fetch" errors were occurring in core Supabase operations:

- `fetchGuardias` - Failed to fetch guardias data for specified month/year
- `fetchCentros` - Failed to fetch centros de salud data  
- `fetchProfesionales` - Failed to fetch profesionales sanitarios data
- `fetchBaremos` - Failed to fetch ajustes baremos data
- `fetchDiasFestivos` - Failed to fetch días festivos data

These functions were missing the retry logic that was previously added to `fetchValidaciones` and `fetchPagos`.

## Root Cause
Network connectivity issues or temporary Supabase service interruptions were causing these critical data-fetching functions to fail without proper error handling or retry mechanisms.

## Solutions Implemented

### 1. Added Retry Logic to fetchGuardias
Applied `retryWithBackoff` to the guardias fetching function:

```typescript
fetchGuardias: async (mes, ano, centroId) => {
  console.log('🔍 Fetching guardias for:', { mes, ano, centroId });
  set({ loading: true, error: null });
  
  try {
    await retryWithBackoff(async () => {
      let query = supabase
        .from('guardias')
        .select(`/* fields */`)
        .order('fecha_inicio', { ascending: false });

      // Date filtering and center filtering logic...
      const { data, error } = await query;

      if (error) {
        console.error('❌ Supabase error in fetchGuardias:', error);
        throw error;
      }

      console.log('✅ Guardias fetched successfully:', data?.length || 0, 'records');
      set({ guardias: data || [], loading: false });
    });
  } catch (error: any) {
    console.error('💥 Exception in fetchGuardias:', error);
    const errorMessage = formatSupabaseError(error);
    set({ error: 'Error al cargar guardias: ' + errorMessage, loading: false });
  }
}
```

### 2. Added Retry Logic to fetchCentros
Applied retry mechanism to centros de salud fetching:

```typescript
fetchCentros: async () => {
  console.log('🏥 Fetching centros de salud...');
  set({ loading: true, error: null });
  
  try {
    await retryWithBackoff(async () => {
      const { data, error } = await supabase
        .from('centros_salud')
        .select(`/* fields */`)
        .eq('estado', 'Activo')
        .order('nombre');

      if (error) {
        console.error('❌ Supabase error in fetchCentros:', error);
        throw error;
      }

      // Data processing and state setting...
    });
  } catch (error: any) {
    // Error handling...
  }
}
```

### 3. Added Retry Logic to fetchProfesionales
Enhanced profesionales sanitarios fetching with retry capability:

```typescript
fetchProfesionales: async (centroId) => {
  console.log('👨‍⚕️ Fetching profesionales for center:', centroId);
  set({ loading: true, error: null });
  
  try {
    await retryWithBackoff(async () => {
      let query = supabase
        .from('profesionales_sanitarios')
        .select(`/* fields */`)
        .eq('estado_solicitud', 'Aprobado')
        .order('nombre_completo');

      if (centroId) {
        query = query.eq('centro_salud_id', centroId);
      }

      // Query execution and data processing...
    });
  } catch (error: any) {
    // Error handling...
  }
}
```

### 4. Added Retry Logic to fetchBaremos
Applied retry mechanism to baremos fetching:

```typescript
fetchBaremos: async () => {
  set({ loading: true });
  
  try {
    await retryWithBackoff(async () => {
      const { data, error } = await supabase
        .from('ajustes_baremos')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Data mapping and state setting...
    });
  } catch (error: any) {
    // Error handling...
  }
}
```

### 5. Added Retry Logic to fetchDiasFestivos
Enhanced días festivos fetching with retry capability:

```typescript
fetchDiasFestivos: async () => {
  console.log('🎆 Fetching días festivos...');
  set({ loading: true, error: null });
  
  try {
    await retryWithBackoff(async () => {
      const { data, error } = await supabase
        .from('dias_festivos')
        .select('*')
        .eq('activo', true)
        .order('fecha');

      if (error) {
        console.error('❌ Supabase error in fetchDiasFestivos:', error);
        throw error;
      }

      // Data processing and state setting...
    });
  } catch (error: any) {
    // Error handling...
  }
}
```

## Functions Now with Retry Logic

### ✅ Complete Coverage
All major fetch functions now have retry logic:

1. **fetchValidaciones** ✅ (Previously implemented)
2. **fetchPagos** ✅ (Previously implemented)
3. **fetchGuardias** ✅ (Newly added)
4. **fetchCentros** ✅ (Newly added)
5. **fetchProfesionales** ✅ (Newly added)
6. **fetchBaremos** ✅ (Newly added)
7. **fetchDiasFestivos** ✅ (Newly added)

### Retry Logic Features
- **Exponential Backoff**: Delays increase with each retry (1s, 2s, 4s)
- **Network Error Detection**: Only retries on network-related failures
- **Maximum Retries**: Up to 3 attempts before giving up
- **Logging**: Console logging for each retry attempt
- **Error Classification**: Distinguishes between network and other errors

## Benefits

### 1. Improved Reliability
- Core data fetching operations are now resilient to temporary network issues
- Automatic recovery from transient connection problems

### 2. Better User Experience
- Users see fewer "failed to fetch" errors
- Application continues working during brief network disruptions
- Consistent error messaging in Spanish

### 3. Reduced Support Burden
- Fewer user reports of random data loading failures
- Self-healing behavior for common connectivity issues

### 4. Enhanced Monitoring
- Console logging provides visibility into retry behavior
- Better error categorization and reporting

## Testing

### Manual Testing Steps
1. Load GuardiasDashboard
2. Navigate between different tabs (triggers various fetch functions)
3. Monitor console for any remaining "Failed to fetch" errors
4. Verify data loads successfully in all tabs

### Network Simulation Testing
1. Use browser dev tools to simulate slow/unstable network
2. Verify retry attempts are logged in console
3. Confirm data eventually loads after network stabilizes
4. Test offline/online transitions

### Expected Behavior
- Initial requests may fail with network errors
- Retry attempts should be logged with increasing delays
- Data should load successfully after network recovers
- User-friendly error messages if all retries fail

## Future Enhancements

### Additional Functions
Consider adding retry logic to:
- `fetchNominas`
- `fetchNominasLineas`
- `fetchProfesionalesGuardias` (if frequently used)

### Configuration Options
- Make retry count configurable
- Add user preference for retry behavior
- Implement circuit breaker pattern for repeated failures

### Monitoring Improvements
- Add metrics collection for retry success/failure rates
- Implement health checks for Supabase connectivity
- Create user notifications for persistent connectivity issues

## Conclusion

The retry logic implementation now covers all critical data fetching operations in the Guardias system. This should significantly reduce the occurrence of "TypeError: Failed to fetch" errors and provide a more reliable user experience, especially in environments with unstable network connectivity.
