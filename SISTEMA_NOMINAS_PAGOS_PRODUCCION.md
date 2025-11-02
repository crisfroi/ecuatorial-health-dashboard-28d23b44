# Sistema de Nóminas y Pagos de Guardias - Producción v2

## 📋 Descripción General

Sistema completo y funcional para gestión de nóminas y pagos derivados de guardias médicas. Integra cálculo automático desde guardias realizadas, generación de nóminas, aprobación y procesamiento de pagos.

**Estado**: ✅ LISTO PARA PRODUCCIÓN

## 🏗 Arquitectura

### Base de Datos
```
Guardias (guardias)
    ↓
    ├→ Nóminas (nominas_guardias)
    │   ├→ Líneas Nómina (nominas_guardias_lineas)
    │   └→ [usa] Baremos (baremos)
    │
    └→ Pagos (pagos_guardias)
        └→ Confirma líneas nómina
```

### Tablas Principales

#### 1. **baremos** (Tarifas Base)
```sql
- id: UUID
- nombre: TEXT (ej: "Tarifa Estándar Especialista")
- categoria_profesional: TEXT (especialista, general_licenciado, tecnico_diplomado, auxiliar)
- tipo_guardia: TEXT (fisica, localizable, administrativa)
- tipo_dia: TEXT (ordinario, fin_semana, festivo)
- monto_base: NUMERIC (tarifa hora base)
- bonificacion_guardia: NUMERIC (10%)
- bonificacion_fin_semana: NUMERIC (25%)
- bonificacion_festivo: NUMERIC (50%)
- porcentaje_descuentos: NUMERIC (10%)
- estado: TEXT (vigente, inactivo)
```

**Baremos Precargados**: 12 tarifas (4 categorías × 3 tipos de día)

#### 2. **nominas_guardias** (Nóminas)
```sql
- id: UUID
- mes: INTEGER (1-12)
- anio: INTEGER
- centro_salud_id: UUID (opcional)
- estado: TEXT (borrador, enviada, aprobada, rechazada, pagada)
- total_bruto: NUMERIC (monto sin descuentos)
- total_neto: NUMERIC (monto final)
- total_descuentos: NUMERIC
- cantidad_lineas: INTEGER (profesionales)
- periodo: TEXT (formato "mes/ano")
- observaciones: TEXT
- created_at: TIMESTAMP
```

#### 3. **nominas_guardias_lineas** (Detalle Nómina)
```sql
- id: UUID
- nomina_id: UUID (FK → nominas_guardias)
- profesional_guardia_id: UUID (FK → profesionales_guardias)
- categoria: TEXT
- guardias_ordinarias: INTEGER
- guardias_fines_semana: INTEGER
- guardias_festivos: INTEGER
- monto_base: NUMERIC
- bonificacion_guardia: NUMERIC
- bonificacion_fin_semana: NUMERIC
- bonificacion_festivo: NUMERIC
- descuentos: NUMERIC
- total_linea: NUMERIC
- monto_neto: NUMERIC
- detalles: TEXT
```

#### 4. **pagos_guardias** (Pagos)
```sql
- id: UUID
- nomina_id: UUID (FK)
- nomina_linea_id: UUID (FK)
- profesional_guardia_id: UUID (FK)
- importe: NUMERIC
- forma_pago: TEXT (transfer_trabajador, transfer_hospital, efectivo, cheque, deposito)
- estado: TEXT (pendiente, realizado, confirmado)
- referencia_pago: TEXT
- fecha_pago: DATE
- fecha_aprobacion: TIMESTAMP
- fecha_procesamiento: TIMESTAMP
- observaciones: TEXT
- created_at: TIMESTAMP
```

## 🔄 Flujo de Operación

### Paso 1: Cálculo de Nómina (Automático)
1. Usuario con rol `DIRECTIVO_CENTRO_SANITARIO` o `SUPER_ADMINISTRADOR` hace clic en "Calcular Nómina"
2. Se invoca Edge Function `calculate-nominas-from-guardias`
3. Función obtiene:
   - Guardias con `estado = 'realizada'` o `'cumplida'`
   - Baremos vigentes para cada categoría
4. Calcula por profesional:
   - Cantidad guardias ordinarias, fin de semana, festivos
   - Montos con bonificaciones según tipo de día
   - Descuentos aplicados
5. Crea `nominas_guardias` + `nominas_guardias_lineas`

### Paso 2: Aprobación (Manual)
1. Nómina generada en estado `enviada`
2. Usuario `PERSONALIDAD_MINISTERIAL` o `SUPER_ADMINISTRADOR` revisa
3. Cambia estado a `aprobada` o `rechazada`
4. Si rechaza: regresa a `borrador` para correcciones

### Paso 3: Procesamiento de Pagos (Automático)
1. Desde nómina `aprobada`, usuario con rol `TESORERO` hace clic "Procesar Pagos Masivos"
2. Se crean automáticamente registros en `pagos_guardias`
3. Un pago por cada línea de nómina
4. Pagos en estado `pendiente`

### Paso 4: Confirmación de Pagos (Manual)
1. Usuario `TESORERO` revisa pagos pendientes
2. Confirma cada pago → estado `confirmado`
3. Se registra `fecha_procesamiento`
4. Nómina pasa a estado `pagada`

## 📦 Componentes

### Componente Principal: `NominasPaymentSystemV2`
```tsx
import { NominasPaymentSystemV2 } from '@/components/guardias/NominasPaymentSystemV2';

<NominasPaymentSystemV2
  mes={6}
  ano={2024}
  centroId={centroId}  // opcional
  userRole="SUPER_ADMINISTRADOR"
/>
```

**Features**:
- 5 KPI cards (Total, Aprobadas, Neto, Pagado, Pendiente)
- 3 pestañas: Nóminas, Pagos, Resumen
- Tabla interactiva con acciones contextuales
- Gráficos de distribución y análisis
- Exporta a Excel y JSON

### Hook: `useNominasPaymentSystem`
```tsx
const {
  nominas,              // Array de nóminas
  nominasLineas,        // Líneas detalladas
  pagos,                // Array de pagos
  resumen,              // Objeto ResumenNominas
  
  calcularNomina,       // (params) → void
  aprobarNomina,        // (id) → void
  rechazarNomina,       // (id) → void
  procesarPagosMasivosDesdeNomina, // (id) → void
  confirmarPago,        // (id) → void
  exportarNomina,       // (id, 'pdf'|'excel') → void
  
  loading,
  isCalculandoNomina,
} = useNominasPaymentSystem(mes, ano, centroId);
```

### Edge Function: `calculate-nominas-from-guardias`
```bash
POST /functions/v1/calculate-nominas-from-guardias

Payload:
{
  "mes": 6,
  "ano": 2024,
  "centro_id": "uuid-optional",
  "profesional_guardia_id": "uuid-optional"
}

Response:
{
  "success": true,
  "nomina_id": "uuid",
  "lineas_calculadas": [...],
  "total_profesionales": 15,
  "monto_total_bruto": 45000,
  "monto_total_neto": 40500,
  "mensaje": "✅ Nómina calculada exitosamente..."
}
```

## 🔐 Control de Acceso (RLS Policies)

| Rol | nominas_guardias | nominas_lineas | pagos_guardias |
|-----|------------------|----------------|----------------|
| SUPER_ADMINISTRADOR | ✅ Todo | ✅ Todo | ✅ Todo |
| PERSONALIDAD_MINISTERIAL | ✅ Todo | ✅ Todo | ✅ Lectura |
| TESORERO | ✅ Lectura | ✅ Todo | ✅ Todo |
| DIRECTIVO_CENTRO_SANITARIO | ✅ Su centro | ✅ Su centro | ✅ Su centro |
| PROFESIONAL | ✗ | ✅ Propio | ✅ Propio |

## 🧮 Algoritmo de Cálculo

Para cada profesional en el período:

```
Guardias ordinarias: 1.0x tarifa
Guardias fin de semana: 1.25x tarifa (25% bonus)
Guardias festivos: 1.5x tarifa (50% bonus)

Bonificación por cantidad: +10% si ≥5 guardias

Ejemplo:
- Categoría: Especialista
- Tarifa base: $150/hora
- 3 guardias ordinarias = 3h → $150 × 3 = $450
- 1 guardia fin semana = 1h → $150 × 1.25 = $187.50
- Bonificación cantidad (4 guardias): ($450 + $187.50) × 0.10 = $63.75

Subtotal: $450 + $187.50 + $63.75 = $701.25
Descuentos (10%): -$70.13
NETO: $631.12
```

## 🚀 Uso en Dashboard

```tsx
// En GuardiasDashboard.tsx
import { NominasPaymentSystemV2 } from '@/components/guardias/NominasPaymentSystemV2';

export function GuardiasDashboard() {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const userRole = useUserRole();

  return (
    <div>
      <NominasPaymentSystemV2
        mes={mes}
        ano={ano}
        userRole={userRole}
      />
    </div>
  );
}
```

## 📊 Casos de Uso

### Caso 1: Generar Nómina
```
1. Seleccionar mes/año
2. Click "Calcular Nómina"
3. Sistema obtiene guardias realizadas
4. Genera automáticamente nómina en estado "enviada"
5. Se envía notificación a aprobadores
```

### Caso 2: Aprobar y Procesar Pagos
```
1. Aprobador revisa nómina
2. Click "Aprobar" → estado = "aprobada"
3. Tesorero hace click "Procesar Pagos Masivos"
4. Se crean pagos automáticamente en estado "pendiente"
5. Tesorero confirma pagos uno por uno
6. Sistema registra fecha y referencia
7. Nómina pasa a "pagada"
```

### Caso 3: Exportar Nómina
```
1. Click ícono descarga en nómina
2. Elige formato: Excel (CSV) o JSON
3. Se descarga archivo con detalles completos
4. Profesionales pueden consultar sus líneas
```

## 🧪 Testing

### Test 1: Cálculo básico
```
- Crear 5 guardias de diferentes tipos
- Calcular nómina
- Verificar: totales = suma de líneas
- Verificar: descuentos = 10% bruto
```

### Test 2: Flujo completo
```
1. Calcular → estado "enviada"
2. Aprobar → estado "aprobada"  
3. Procesar pagos → 5 pagos en "pendiente"
4. Confirmar todos → estado "confirmado"
5. Verificar nómina → estado "pagada"
```

### Test 3: Permisos
```
- PROFESIONAL no puede ver nóminas ajenas
- DIRECTIVO no puede ver centros ajenos
- TESORERO no puede cambiar estados de nóminas
```

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| "No se encontraron guardias" | Verificar que guardias tengan `estado = 'realizada'` |
| "No se encontraron baremos" | Crear baremos vigentes en tabla `baremos` |
| Nómina desaparece | Verificar RLS policies del usuario |
| Pagos no se crean | Confirmar nómina está en estado `aprobada` |

## 📈 Métricas y KPIs

- **Tasa Cumplimiento**: % nóminas aprobadas del total
- **Monto Pendiente**: Diferencia entre neto total y pagado
- **Número Profesionales**: Líneas de nómina (1 por profesional)
- **Tiempo Procesamiento**: Desde cálculo a pago confirmado

## 🔧 Configuración

### Variables de Entorno
```
SUPABASE_URL=https://wdieynendfjbkbhfovrx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
```

### Baremos Personalizados
Agregar nuevos baremos directamente en tabla `baremos`:
```sql
INSERT INTO baremos (nombre, categoria_profesional, tipo_guardia, tipo_dia, monto_base, ...)
VALUES ('Mi Tarifa', 'especialista', 'fisica', 'ordinario', 200.00, ...);
```

## 📝 Notas Importantes

1. **Guardias duplicadas**: El sistema cuenta todas las guardias sin deduplicación
2. **Modificaciones post-aprobación**: No permitidas por RLS
3. **Período**: Sistema trabaja por mes/año completo
4. **Descuentos fijos**: 10% de descuentos automáticos (configurable en baremo)
5. **Horario**: No diferencia entre turnos dentro del día

## 🔐 Seguridad

- ✅ RLS habilitado en todas las tablas
- ✅ Validación de roles en frontend y backend
- ✅ Edge Function con Service Role Key (segura)
- ✅ No se exponen salarios entre profesionales
- ✅ Auditoría con timestamps automáticos

## 📞 Soporte

Si encuentras problemas:
1. Revisar logs en Supabase → Edge Functions
2. Verificar estado de guardias: `SELECT estado FROM guardias WHERE mes=${mes} AND ano=${ano};`
3. Verificar baremos vigentes: `SELECT * FROM baremos WHERE estado = 'vigente';`
4. Revisar RLS policies de usuario actual

---

**Versión**: 2.0  
**Última actualización**: 2024  
**Estado**: ✅ Production Ready
