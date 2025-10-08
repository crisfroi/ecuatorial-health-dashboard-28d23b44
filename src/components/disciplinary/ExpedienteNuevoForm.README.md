# ExpedienteNuevoForm

Componente React (TypeScript + Tailwind + shadcn/ui) para abrir un nuevo expediente disciplinario desde el dashboard.

## Flujo funcional
1. Selección del profesional (autocomplete con `profesionales_sanitarios`).
2. Redacción del motivo y carga de documento soporte (PDF/imagen) al bucket `expedientes` (Storage).
3. Llamada a la Edge Function `/functions/v1/expediente-abrir` que:
   - Valida que el usuario tenga rol "Autoridad Disciplinaria".
   - Inserta en `expedientes_disciplinarios`.
   - Registra la acción en `historial_acciones_expediente`.
4. Notificación (toast) y limpieza del formulario.

## Seguridad
- Writes ejecutados por Edge Function con Service Role (RLS activo en tablas).
- El bucket `expedientes` es público solo para lectura del archivo; la subida sucede autenticada.

## Integraciones
- Supabase Auth: `supabase.auth.getSession()` para extraer el `access_token` y pasarlo a la invocación de la función.
- Supabase Storage: `expedientes` para archivo soporte.
- Tablero: renderizado bajo pestaña "Expedientes" del `Dashboard`.

## Registro automático de incidencias
Existe una migración SQL que crea el trigger `trg_incident_to_expediente` en `incidencias_hospitalarias`:
- Si se inserta una incidencia con `id_profesional`, busca un expediente abierto/en revisión del profesional.
- Si no existe, crea uno automáticamente.
- Inserta en `historial_acciones_expediente` la acción `incidencia_registrada`.

## Enlaces públicos de formularios
- El dominio base se obtiene con `getAppBaseUrl()` para construir URLs de `/form/:slug` consistentes en producción.
- El slug se genera automáticamente al crear/guardar formularios si no existe.

## Extensión
- Añadir cambio de estado y resolución con nuevas acciones en `historial_acciones_expediente`.
- Adjuntar múltiples archivos soporte por expediente.
- Métricas y filtros por estado, centro y fecha.
