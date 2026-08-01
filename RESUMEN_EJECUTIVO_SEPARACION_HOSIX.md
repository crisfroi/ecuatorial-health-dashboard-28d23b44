# 🎯 HOSIX - Resumen Ejecutivo para Separación

**Para**: Equipo de Dirección / DevOps  
**Fecha**: May 26, 2026  
**Propósito**: Decisión de arquitectura e inversión  

---

## EL PROBLEMA EN 30 SEGUNDOS

**HOY**: HOSIX (Sistema Hospitalario) + RENAPROSA (Registro de Profesionales) comparten:
- ❌ **UNA SOLA BD PostgreSQL** en Supabase
- ❌ **MISMAS CREDENCIALES** de autenticación
- ❌ **ACOPLAMIENTO FUERTE** en 40+ referencias SQL

**IMPACTO**:
- No puedes escalar HOSIX sin afectar RENAPROSA
- Falla en HOSIX detiene RENAPROSA (y viceversa)
- Imposible comercializar HOSIX como producto independiente

---

## LA SOLUCIÓN

### Opción A: Separación Completa ✅ **RECOMENDADA**
- HOSIX en **nuevo repositorio** `git clone hostpital-management`
- HOSIX con **propia BD PostgreSQL** (nuevo proyecto Supabase)
- Mantener **sincronización nocturna** de maestros (profesionales, centros)

**Costo**: 176 horas (~4 semanas), 1-3 desarrolladores  
**Resultado**: HOSIX puede escalar, vender o deployar independientemente  

### Opción B: Mantener Junto (No Recomendado)
- Todo sigue igual (acoplado)
- Plus: Ahorra 4 semanas de desarrollo
- Minus: Limita crecimiento futuro

### Opción C: FDW PostgreSQL (Avanzado)
- HOSIX accede a RENAPROSA vía Foreign Data Wrapper
- Costo: 6-8 semanas, requiere DevOps senior
- Beneficio: Datos sincronizados en real-time (pero lento)

---

## CRONOGRAMA RECOMENDADO (Opción A)

```
SEMANA 1:  Preparación + Auditoría SQL
SEMANA 2-3: Refactorización SQL (40+ referencias)
SEMANA 3-4: Refactorización React (180+ componentes)
SEMANA 5:   Infraestructura (Supabase + Git + CI/CD)
SEMANA 6:   Sincronización + Testing
           ↓
PRODUCCIÓN: Fin de Junio
```

---

## IMPACTO EN NEGOCIO

### VENTAJAS DE SEPARAR
✅ **Venta de HOSIX**: Puedes vender como software independiente (precio: $50-100K)  
✅ **Escalabilidad**: HOSIX crece sin límites de BD compartida  
✅ **Confiabilidad**: Falla de HOSIX NO detiene RENAPROSA  
✅ **Velocidad**: Equipos independientes = deployments más frecuentes  
✅ **Costo**: Supabase es barato (~$55/mes por BD), vale la inversión  

### DESVENTAJAS
❌ **Costo Inicial**: ~$20-30K en desarrollo (176 horas)  
❌ **Tiempo**: 4-6 semanas sin nuevas features  
❌ **Complejidad**: Necesita sincronización de datos  

### ROI (Return on Investment)
- Inversión: $30K
- Beneficio (venta HOSIX): $50-100K
- **Payback: 1-2 años**

---

## DECISIÓN REQUERIDA

**¿Separamos HOSIX ahora o después?**

| Criterio | Ahora | Después |
|----------|-------|---------|
| Costo | $30K | $50K+ (más código) |
| Tiempo | 4 semanas | 6-8 semanas |
| Riesgo | Medio (migramos juntos) | Alto (más código = más bugs) |
| Oportunidad | Vender HOSIX junio | Esperar más |

**Recomendación**: **HACER AHORA** (costo/riesgo menores, oportunidad comercial)

---

## PRÓXIMAS ACCIONES

1. **HOY**: Aprobación de dirección para iniciar Fase 1
2. **MAÑANA**: Junta de planificación técnica (4h)
3. **PRÓXIMA SEMANA**: Comienza desarrollo (Fase 1 en paralelo)

---

## CONTACTO

📧 Para preguntas técnicas: Ver archivo `SEPARACION_HOSIX_NUEVO_REPO.md` (documento completo)

---

## APÉNDICE: DATOS TÉCNICOS

### Estructura Actual
```
SERMED2/
├── src/
│   ├── pages/Hosix/           ← 10 páginas HOSIX
│   ├── components/hosix/       ← 180+ componentes
│   ├── hooks/useHosix*.ts      ← 15 hooks
│   └── stores/hosix*.ts        ← 3 stores
├── supabase/
│   └── migrations/             ← 44 migraciones SQL
└── .env                        ← Credenciales compartidas ❌
```

### Referenciascruzadas
- `profesionales_sanitarios`: 40+ referencias (CRÍTICA)
- `centros_salud`: 25+ referencias (MEDIA)
- `especialidades`: 5+ referencias (BAJA)
- `auth.users`: 1+ referencias (integrada)

### Volúmenes de Datos
- Profesionales: ~500-1000 registros
- Centros de salud: ~3-5 registros
- Episodios de pacientes (HOSIX): ~10K-50K registros/año
- Fichas biométricas (HOSIX): ~500K-1M registros/mes

---

**Documento Preparado por**: GitHub Copilot (análisis automático)  
**Validación Pendiente**: Revisión técnica del CTO
