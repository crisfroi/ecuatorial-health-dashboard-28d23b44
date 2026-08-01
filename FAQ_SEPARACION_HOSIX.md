# ❓ HOSIX Separación - Preguntas Frecuentes (FAQ)

---

## 🤔 PREGUNTAS TÉCNICAS

### P: ¿Qué significa \"separación de HOSIX\"?
**R**: Actualmente HOSIX comparte la misma base de datos PostgreSQL con RENAPROSA. \"Separación\" significa:
1. Crear una **BD completamente nueva** (otro proyecto Supabase)
2. Crear un **repositorio Git independiente** para HOSIX
3. Duplicar los maestros necesarios (profesionales, centros) en la nueva BD
4. Sincronizar datos maestros de forma controlada (noche/API)

Resultado: HOSIX puede funcionar **100% independientemente**.

---

### P: ¿Qué datos se \"duplican\"?
**R**: Solo los maestros (datos de referencia):

| Tabla RENAPROSA | Nueva Tabla HOSIX | Registro | Sincronización |
|---|---|---|---|
| `profesionales_sanitarios` | `hosix_profesionales_sanitarios` | ~500 registros | Noche (1 AM UTC) |
| `centros_salud` | `hosix_centros_salud` | ~3-5 registros | Noche (1 AM UTC) |
| `especialidades` | `hosix_especialidades` | ~20 registros | Manual |

Los **datos de HOSIX** (pacientes, episodios, etc.) NO se duplican, son completamente nuevos.

---

### P: ¿Se pierden datos históricos de HOSIX?
**R**: **NO**. Todo el histórico se mantiene:
- Pacientes existentes → Se migran a nueva BD
- Episodios de hospitalizaciones → Se migran completamente
- Auditoría y logs → Se migran

Proceso: `BACKUP` → `EXPORT` → `IMPORT en nueva BD` → `VERIFY`

---

### P: ¿Cuánto tiempo toma la separación?
**R**: 
- **Mínimo**: 3 semanas (solo desarrollo, sin testing exhaustivo)
- **Recomendado**: 4-6 semanas (con testing, docs, training)
- **Con contingencia**: 8 semanas (por problemas imprevistos)

**Línea de tiempo**: 
- Semana 1: Preparación + Auditoría
- Semana 2-3: Desarrollo (SQL + React)
- Semana 4-5: Testing + Staging
- Semana 6: Go-live + Monitoreo

---

### P: ¿Necesito cambiar código en RENAPROSA?
**R**: **Mínimamente**:
- ✅ RENAPROSA sigue igual (no se toca)
- ✅ Puede seguir funcionando independientemente
- ⚠️ Necesita una **Edge Function** para exportar profesionales (5 líneas de código)
- ⚠️ Opcional: REST API endpoint para sincronización

**Impacto en RENAPROSA**: ~0% (totalmente aislado)

---

### P: ¿Qué pasa si falla la sincronización de maestros?
**R**: HOSIX **sigue funcionando** porque:
1. Los maestros están **duplicados localmente** en HOSIX
2. Sincronización es **un-sentido** (RENAPROSA → HOSIX)
3. Cuando nuevos profesionales llegan a RENAPROSA, se sincroniza la noche siguiente

Si falla la sincronización:
- ⚠️ HOSIX usa datos de 24 horas atrás (es aceptable)
- ✅ Se reintenta automáticamente
- 📧 Email de alerta al DevOps

---

### P: ¿Puedo ejecutar HOSIX sin internet / offline?
**R**: **NO** (ya que hoy tampoco):
- HOSIX necesita conexión a Supabase (BD en la nube)
- La separación NO cambia esto
- Si quieres offline: Necesitarías sqlite local (otra fase futura)

---

## 💰 PREGUNTAS DE NEGOCIO

### P: ¿Cuánto cuesta la separación?
**R**: 
- **Tiempo**: 176 horas de desarrollo (~$17,600 @ $100/hora en Ecuador)
- **Supabase**: +$55/mes BD nueva HOSIX (es **barato**)
- **Total Inversión**: ~$20-30K

**Comparar con**:
- Costo de mantener código acoplado: Pérdida futura de oportunidades
- Costo de vender HOSIX como producto: Vale la pena separar

---

### P: ¿Podemos vender HOSIX como producto separado?
**R**: **SÍ, pero solo si está separado**:

Escenario actual (acoplado):
- ❌ Cliente compra HOSIX → Le vendes RENAPROSA también (caro)
- ❌ Cliente quiere solo HOSIX → Imposible (comparte BD)

Después de separación:
- ✅ Vendes HOSIX solo (hospital privado)
- ✅ Vendes RENAPROSA solo (registrador de profesionales)
- ✅ Vendes ambos juntos (instituciones públicas grandes)

**Precio estimado HOSIX**: $50-100K (una instalación)

---

### P: ¿Mejora el performance/velocidad después de separar?
**R**: **Ligeramente**:
- ✅ Menos datos en BD HOSIX = menos carga
- ✅ Índices más pequeños = búsquedas más rápidas
- ✅ Menos RLS policies = menos lógica

**Mejora estimada**: 10-15% (no es transformacional)

**Beneficio real**: Escalabilidad = Cuando crezcas, HOSIX crece sin afectar RENAPROSA

---

## 🛠️ PREGUNTAS OPERACIONALES

### P: ¿Qué pasa durante la migración? ¿Se cae HOSIX?
**R**: 
- **Planificación**: Hacemos migración a las 2 AM UTC (horario bajo)
- **Duración**: ~1-2 horas (downtime estimado)
- **Proceso**:
  1. Aviso 1 semana antes a usuarios
  2. Backup de ambas BDs
  3. Ejecutar migración en automatización (scripts)
  4. Validar integridad (checksums)
  5. Deploy nueva versión frontend + backend
  6. Smoke tests (checamos que ande)
  7. Rollback plan (si algo falla, volvemos atrás en 15 min)

---

### P: ¿Necesito capacitar al equipo?
**R**: **Poco**:
- Desarrolladores: 4h de workshop (nada cambia en código)
- DevOps: 2h (nueva BD, nuevo deploy pipeline)
- Usuarios finales: 0h (interfaz igual)

---

### P: ¿Cuál es el plan de rollback?
**R**: Si algo falla:
1. Revertir deploy (volver a versión anterior): 5 minutos
2. Restaurar BD desde backup: 10 minutos
3. Validar que HOSIX funciona: 5 minutos
**Total**: 20 minutos downtime máximo

---

### P: ¿Cómo se sincroniza después de separado?
**R**: **Automático** cada noche:

```
1:00 AM UTC
  ↓
Supabase Cron Job dispara
  ↓
Edge Function: \"sync-profesionales-from-renaprosa\"
  ↓
Lee profesionales_sanitarios de RENAPROSA
  ↓
UPSERT en hosix_profesionales_sanitarios
  ↓
Envía email con resumen (50 profesionales sincronizados)
  ↓
Si error: Reintenta cada 30 minutos
```

---

## ✅ PREGUNTAS DE DECISIÓN

### P: ¿Debemos hacerlo AHORA o ESPERAR?
**R**: **AHORA** es mejor porque:

| Factor | Ahora | Después |
|--------|-------|---------|
| **Costo** | $30K | $50K+ (más código acoplado) |
| **Tiempo** | 4 sem | 8+ sem (refactor mayor) |
| **Riesgo** | Medio | Alto (más lineas de código) |
| **Oportunidad** | ✅ Vender HOSIX junio | ❌ Esperar 6+ meses |

**Decisión**: Separar **dentro de 1 mes** (junio 2026)

---

### P: ¿Qué pasa si NO separamos?
**R**: 
- ✅ Ahorramos 4 semanas de desarrollo
- ❌ HOSIX sigue acoplado a RENAPROSA
- ❌ No podemos escalar HOSIX sin afectar RENAPROSA
- ❌ No podemos vender HOSIX como producto
- ❌ Cuando crezca, costo de refactor será 2x más caro

**Es como**: Construir una casa con dos usos en un lote, vs construir separado. Después será muy caro separar.

---

### P: ¿Cuál es el beneficio principal?
**R**: **FLEXIBILIDAD ESTRATÉGICA**

Hoy:
- RENAPROSA + HOSIX = un producto
- Un cliente = dos productos juntos

Después de separar:
- RENAPROSA = producto A (precio $X)
- HOSIX = producto B (precio $Y)
- Cliente elige qué compra: A, B, o A+B

**Potencial de negocio**: +150-300% (múltiples mercados)

---

## 📞 PREGUNTAS SIN RESPUESTA CLARA

### P: ¿Y si nuestra infraestructura no aguanta dos Supabase projects?
**R**: Supabase escala infinitamente. No es problema. Costo: +$55/mes

---

### P: ¿Puedo mantener integración en tiempo real?
**R**: SÍ, pero:
- Opción A: Sincronización nocturna (simple, recomendado)
- Opción B: REST API entre proyectos (complejo)
- Opción C: FDW PostgreSQL (muy técnico, requiere DevOps senior)

Recomendación: Opción A (es suficiente)

---

### P: ¿Qué pasa con las credenciales de usuarios HOSIX?
**R**: 
- Usuarios HOSIX se recrean en nuevo Supabase
- Sus passwords se resetean (email con token de reset)
- Sesiones activas se pierden (necesitan login nuevo)
- Es normal (una migración de usuarios estándar)

---

## 🎬 CONCLUSIÓN

**La separación es posible, beneficiosa y necesaria**:
- ✅ Técnicamente viable
- ✅ Comercialmente justificada
- ✅ Riesgo aceptable (con plan de rollback)
- ✅ ROI positivo en 1-2 años

**Recomendación**: Aprobar inversión, comenzar Fase 1 en 1 semana

---

**Documento generado automáticamente**  
**Última actualización**: May 26, 2026
