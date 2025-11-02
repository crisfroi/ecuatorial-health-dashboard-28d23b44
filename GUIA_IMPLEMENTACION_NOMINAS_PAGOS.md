# 🚀 Guía de Implementación - Sistema Nóminas y Pagos v2

## ⚡ Inicio Rápido (5 minutos)

### 1. Verificar BD está actualizada
```sql
-- Verificar tabla baremos existe
SELECT COUNT(*) FROM baremos;  -- Debe devolver ≥12

-- Verificar columnas en nominas_guardias
SELECT total_bruto, total_neto, cantidad_lineas FROM nominas_guardias LIMIT 1;

-- Verificar columnas en pagos_guardias
SELECT nomina_linea_id, metodo_pago FROM pagos_guardias LIMIT 1;
```

### 2. Integrar nuevo componente en Dashboard
```tsx
// archivo: src/components/guardias/GuardiasDashboard.tsx

// 1. Importar componente V2
import { NominasPaymentSystemV2 } from '@/components/guardias/NominasPaymentSystemV2';

// 2. En el JSX, reemplazar anterior componente:
// ANTES:
// <NominaGuardias />
// <PagosGuardias />

// AHORA:
<NominasPaymentSystemV2
  mes={mesActual}
  ano={anoActual}
  centroId={centroId}
  userRole={userRole}
/>
```

### 3. Test rápido
1. Acceder a Dashboard → Guardias
2. Click en pestaña "Nóminas"
3. Click botón "Calcular Nómina"
4. Esperar a que se complete (2-5 segundos)
5. Verificar que aparece nómina en lista con estado "enviada"

## 📋 Checklist de Implementación

- [ ] **BD**: Tabla `baremos` creada con 12 registros
- [ ] **BD**: Columnas añadidas a `nominas_guardias` (total_bruto, total_neto, etc)
- [ ] **BD**: Columnas añadidas a `nominas_guardias_lineas` (monto_base, bonificaciones, etc)
- [ ] **BD**: Columnas añadidas a `pagos_guardias` (nomina_linea_id, metodo_pago, etc)
- [ ] **BD**: RLS policies aplicadas a 4 tablas (baremos, nominas_guardias, nominas_lineas, pagos_guardias)
- [ ] **Backend**: Edge Function `calculate-nominas-from-guardias` desplegada
- [ ] **Frontend**: Hook `useNominasPaymentSystemV2` importado
- [ ] **Frontend**: Componente `NominasPaymentSystemV2` integrado
- [ ] **Frontend**: Guardias prueba creadas con estado `realizada`
- [ ] **Testing**: Ejecutar flujo completo Guardias → Nóminas → Pagos

## 🔄 Flujo Operacional Día 1

### Mañana (Admin)
1. Crear 5-10 guardias de prueba
   - Estados: `realizada`, `cumplida`
   - Diferentes tipos: ordinarias, fin semana, festivos
2. Verificar en BD: `SELECT * FROM guardias WHERE estado = 'realizada';`

### Mediodía (Director)
1. Ir a Dashboard → Guardias → Nóminas
2. Click "Calcular Nómina" para mes/año actual
3. Esperar cálculo automático
4. Verificar resumen: cantidad profesionales, montos totales

### Tarde (Aprobador)
1. En la lista de nóminas, buscar la "enviada"
2. Click botón verde ✓ (Aprobar)
3. Cambiar a estado "aprobada"

### Mañana siguiente (Tesorero)
1. En nómina aprobada, click "Procesar Pagos Masivos"
2. Sistema crea pagos automáticamente
3. En pestaña "Pagos", confirmar cada pago
4. Registra fecha de procesamiento

## 🧪 Scripts de Testing (Copia y pega en Supabase SQL)

### Test 1: Crear guardias de prueba
```sql
-- Limpiar guardias anteriores (CUIDADO: afecta guardias existentes)
-- DELETE FROM guardias WHERE mes = 6 AND anio = 2024;

-- Crear guardias de prueba
WITH prof_guard AS (
  SELECT id FROM profesionales_guardias LIMIT 5
)
INSERT INTO guardias (
  profesional_guardia_id,
  centro_salud_id,
  fecha_inicio,
  fecha_fin,
  estado,
  tipo_dia,
  horas
)
SELECT
  pg.id,
  (SELECT id FROM centros_salud LIMIT 1),
  '2024-06-01'::timestamp + ((row_number() over (order by pg.id) - 1) || ' days')::interval,
  '2024-06-01'::timestamp + ((row_number() over (order by pg.id) - 1) || ' days')::interval + '8 hours'::interval,
  'realizada',
  CASE 
    WHEN (row_number() over (order by pg.id)) % 3 = 0 THEN 'fin_semana'
    WHEN (row_number() over (order by pg.id)) % 5 = 0 THEN 'festivo'
    ELSE 'ordinario'
  END,
  8.0
FROM prof_guard pg;
```

### Test 2: Verificar guardias creadas
```sql
SELECT 
  COUNT(*) as cantidad,
  estado,
  tipo_dia,
  SUM(horas) as total_horas
FROM guardias
WHERE mes = 6 AND anio = 2024
GROUP BY estado, tipo_dia;
```

### Test 3: Verificar nómina calculada
```sql
SELECT 
  ng.id,
  ng.estado,
  ng.cantidad_lineas,
  ng.total_bruto,
  ng.total_neto,
  COUNT(ngl.id) as lineas_reales
FROM nominas_guardias ng
LEFT JOIN nominas_guardias_lineas ngl ON ng.id = ngl.nomina_id
WHERE ng.mes = 6 AND ng.anio = 2024
GROUP BY ng.id, ng.estado, ng.cantidad_lineas, ng.total_bruto, ng.total_neto;
```

### Test 4: Verificar pagos creados
```sql
SELECT
  COUNT(*) as cantidad_pagos,
  estado,
  SUM(importe) as total_importe
FROM pagos_guardias
WHERE nomina_id = (
  SELECT id FROM nominas_guardias 
  WHERE mes = 6 AND anio = 2024 
  LIMIT 1
)
GROUP BY estado;
```

## 🚨 Troubleshooting Común

### Problema: "No se encontraron guardias"
**Solución**:
```sql
-- Verificar estado de guardias
SELECT DISTINCT estado FROM guardias LIMIT 10;

-- Crear guardia de prueba
INSERT INTO guardias (
  profesional_guardia_id,
  centro_salud_id,
  fecha_inicio,
  fecha_fin,
  estado,
  horas
) VALUES (
  (SELECT id FROM profesionales_guardias LIMIT 1),
  (SELECT id FROM centros_salud LIMIT 1),
  now(),
  now() + interval '8 hours',
  'realizada',
  8
);
```

### Problema: "No se encontraron baremos"
**Solución**:
```sql
-- Verificar baremos
SELECT COUNT(*) FROM baremos WHERE estado = 'vigente';

-- Si está vacío, el sistema debería haber insertado 12 automáticamente
-- Reintentar insertar:
INSERT INTO baremos (nombre, estado, categoria_profesional, tipo_guardia, tipo_dia, monto_base)
VALUES ('Tarifa Test', 'vigente', 'general_licenciado', 'fisica', 'ordinario', 100.00);
```

### Problema: Nómina desaparece después de calcular
**Solución**: 
- Verificar RLS policy: `SELECT * FROM nominas_guardias;` sin filtro
- Si falla, es un problema de permisos
- Verificar rol del usuario actual: `SELECT auth.jwt() -> 'role';`

### Problema: Edge Function no responde
**Solución**:
1. Verificar logs en Supabase Dashboard → Edge Functions
2. Confirmar URL de función es correcta
3. Verificar variables de entorno (SUPABASE_URL, SERVICE_ROLE_KEY)

## 📊 Monitoreo Post-Implementación

### Verificaciones Diarias
```sql
-- Total de guardias sin procesar
SELECT COUNT(*) FROM guardias WHERE estado IN ('realizada', 'cumplida');

-- Nóminas pendientes de aprobación
SELECT COUNT(*) FROM nominas_guardias WHERE estado = 'enviada';

-- Pagos pendientes
SELECT COUNT(*), SUM(importe) 
FROM pagos_guardias 
WHERE estado IN ('pendiente', 'realizado');
```

### Métricas Mensuales
```sql
-- Efectividad del sistema
SELECT
  COUNT(DISTINCT CASE WHEN estado = 'aprobada' THEN id END) as aprobadas,
  COUNT(DISTINCT CASE WHEN estado = 'pagada' THEN id END) as pagadas,
  COUNT(*) as total,
  (COUNT(DISTINCT CASE WHEN estado = 'pagada' THEN id END) * 100 / COUNT(*)) as porcentaje_pagadas
FROM nominas_guardias
WHERE mes = EXTRACT(MONTH FROM now())::int
  AND anio = EXTRACT(YEAR FROM now())::int;
```

## 🔐 Configuración de Roles para Testing

Para testing completo, asignar roles:
- **Usuario 1**: SUPER_ADMINISTRADOR → prueba todo
- **Usuario 2**: PERSONALIDAD_MINISTERIAL → apruebaaguardias
- **Usuario 3**: TESORERO → procesa pagos
- **Usuario 4**: PROFESIONAL → ve solo sus datos

## ✅ Confirmación de Éxito

Tu sistema está listo cuando:

✅ Puedes crear guardias con estado `realizada`  
✅ Click "Calcular Nómina" genera nómina en 2-5 segundos  
✅ Nómina aparece con estado "enviada" y montos correctos  
✅ Puedes cambiar estado a "aprobada"  
✅ Puedes procesar pagos masivos  
✅ Pagos aparecen en estado "pendiente"  
✅ Puedes confirmar pagos  
✅ Diferentes roles ven diferentes datos (RLS funciona)  
✅ Puedes exportar nómina a Excel  

## 📞 Próximos Pasos

1. **Configurar baremos reales**: Actualizar montos en tabla `baremos`
2. **Crear integraciones**: Conectar con sistema de bancos para pagos automáticos
3. **Alertas**: Configurar notificaciones para aprobadores
4. **Auditoría**: Crear tabla de auditoría para cambios de estado
5. **Reportes**: Crear reportes mensuales automáticos

---

**Tiempo estimado de implementación**: 30 minutos  
**Complejidad**: Media  
**Riesgo**: Bajo (sandbox BD disponible)  

¡Listo para producción! 🚀
