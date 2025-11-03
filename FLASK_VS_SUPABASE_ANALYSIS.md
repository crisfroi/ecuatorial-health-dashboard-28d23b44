# Análisis Comparativo: FlaskProject Models vs Supabase Database

## 📊 Resumen Ejecutivo

El proyecto de **FlaskProject** contiene modelos simples para un sistema biométrico legacy (control de asistencia), mientras que la base de datos **Supabase** implementa un sistema integral y moderno de gestión de salud. Hay **superposición parcial**, pero son sistemas fundamentalmente diferentes en alcance y complejidad.

---

## 1. TABLA: `person` / `Person.py`

### FlaskProject (SQLAlchemy)
```python
class Person(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    roll_id = db.Column(db.Integer, nullable=False)
```

### Supabase
```sql
CREATE TABLE person (
    id INTEGER PRIMARY KEY,
    name VARCHAR NOT NULL,
    roll_id INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now()
);
```

### Análisis
| Aspecto | Flask | Supabase | Estado |
|---------|-------|----------|--------|
| **Tipo PK** | `db.Integer` | `INTEGER` | ✅ Coincide |
| **name** | `String(80)` | `VARCHAR` | ✅ Compatible (VARCHAR es ilimitado) |
| **roll_id** | `Integer, NOT NULL` | `INTEGER DEFAULT 0` | ⚠️ Flask NO PERMITE nulos, Supabase SÍ |
| **created_at** | ❌ No existe | ✅ Existe | ❌ Falta en Flask |

**Recomendación**: Actualizar Flask para incluir `created_at`.

---

## 2. TABLA: `device` / `Device.py`

### FlaskProject
```python
class Device(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    serial_num = db.Column(db.String(80), unique=True, nullable=False)
    status = db.Column(db.Integer, nullable=False)
```

### Supabase
```sql
CREATE TABLE device (
    id INTEGER PRIMARY KEY,
    serial_num VARCHAR UNIQUE NOT NULL,
    status INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);
```

### Análisis
| Aspecto | Flask | Supabase | Estado |
|---------|-------|----------|--------|
| **serial_num** | `String(80) UNIQUE` | `VARCHAR UNIQUE` | ✅ Coincide |
| **status** | `Integer, NOT NULL` | `INTEGER DEFAULT 0` | ⚠️ Flask obliga NOT NULL, Supabase tiene default |
| **created_at/updated_at** | ❌ No existen | ✅ Existen | ❌ Faltan en Flask |

**Recomendación**: Agregar timestamps a Flask.

---

## 3. TABLA: `enroll_info` / `EnrollInfo.py`

### FlaskProject
```python
class EnrollInfo(db.Model):
    __tablename__ = 'enroll_info'
    id = db.Column(db.Integer, primary_key=True)
    enroll_id = db.Column(db.Integer)
    backupnum = db.Column(db.Integer)
    imagepath = db.Column(db.String)
    signatures = db.Column(db.Text)
```

### Supabase
```sql
CREATE TABLE enroll_info (
    id INTEGER PRIMARY KEY,
    enroll_id INTEGER,
    backupnum INTEGER,
    imagepath VARCHAR,
    signatures TEXT,
    created_at TIMESTAMP DEFAULT now()
);
```

### Análisis
| Aspecto | Flask | Supabase | Estado |
|---------|-------|----------|--------|
| **Estructura** | ✅ Coincide | ✅ Coincide | ✅ Perfecta alineación |
| **Tipos** | ✅ INT, INT, INT, TEXT, TEXT | ✅ INT, INT, INT, TEXT, TEXT | ✅ Compatibles |
| **created_at** | ❌ No existe | ✅ Existe | ❌ Falta en Flask |

**Recomendación**: Agregar `created_at` timestamp.

---

## 4. TABLA: `records` / `Records.py`

### FlaskProject
```python
class Record(db.Model):
    __tablename__ = 'records'
    id = db.Column(db.Integer, primary_key=True)
    enroll_id = db.Column(db.BigInteger, nullable=False)
    records_time = db.Column(db.DateTime, nullable=False)
    mode = db.Column(db.Integer, nullable=False)
    intOut = db.Column(db.Integer, nullable=False)
    event = db.Column(db.Integer, nullable=False)
    device_serial_num = db.Column(db.String(50))
    temperature = db.Column(db.Float)
    image = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

### Supabase
```sql
CREATE TABLE records (
    id INTEGER PRIMARY KEY,
    enroll_id INTEGER,
    mode INTEGER,
    int_out INTEGER (INOUT_TYPE),
    event INTEGER,
    verify_mode INTEGER,
    year INTEGER, month INTEGER, day INTEGER, hour INTEGER, minute INTEGER, second INTEGER,
    workcode INTEGER,
    reserved INTEGER,
    device_serial_num VARCHAR,
    records_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    temperature FLOAT,
    image VARCHAR
);
```

### Análisis
| Aspecto | Flask | Supabase | Estado |
|---------|-------|----------|--------|
| **id** | `Integer PK` | `Integer PK` | ✅ Coincide |
| **enroll_id** | `BigInteger NOT NULL` | `Integer` | ⚠️ Flask es BigInt, Supabase es Int; Flask obliga NOT NULL |
| **records_time** | `DateTime NOT NULL` | `TIMESTAMP` | ✅ Compatible |
| **mode** | `Integer NOT NULL` | `Integer` | ✅ Compatible |
| **intOut** | `Integer NOT NULL` | `INOUT_TYPE (enum)` | ⚠️ Supabase usa ENUM para "IN"/"OUT", Flask usa Integer |
| **temperature** | `Float nullable` | `Float nullable` | ✅ Coincide |
| **image** | `String(255) nullable` | `VARCHAR nullable` | ✅ Coincide |
| **Columnas extras Supabase** | ❌ year, month, day, hour, minute, second, workcode, reserved, verify_mode | ✅ Existen | ⚠️ Flask no tiene descomposición temporal |

**Recomendación**: 
- Flask debería permitir `enroll_id` nullable
- Considerar usar ENUM en lugar de Integer para `intOut`
- Agregar columnas de fecha descompuesta si se necesita

---

## 5. TABLA: `access_day` / `AccessDay.py`

### FlaskProject
```python
class AccessDay(db.Model):
    __tablename__ = 'access_day'
    id = db.Column(db.Integer, primary_key=True)
    serial = db.Column(db.String)
    name = db.Column(db.String)
    start_time1 to end_time5 (10 columnas de String)
```

### Supabase
```sql
CREATE TABLE access_day (
    id INTEGER PRIMARY KEY,
    time1_start VARCHAR, time1_end VARCHAR,
    time2_start VARCHAR, time2_end VARCHAR,
    time3_start VARCHAR, time3_end VARCHAR,
    created_at TIMESTAMP DEFAULT now()
);
```

### Análisis
| Aspecto | Flask | Supabase | Estado |
|---------|-------|----------|--------|
| **serial, name** | ✅ String | ❌ No existen | ❌ Supabase NO tiene serial/name |
| **Rangos horarios** | `start_time1-5, end_time1-5` (10 campos) | `time1_start/end to time3_start/end` (6 campos) | ⚠️ Flask tiene 5 rangos, Supabase tiene 3 |
| **created_at** | ❌ No existe | ✅ Existe | ❌ Falta en Flask |

**Recomendación**: Hay discrepancia en el número de rangos horarios. Revisar cuál es el número correcto requerido.

---

## 6. TABLA: `access_week` / `AccessWeek.py`

### FlaskProject
```python
class AccessWeek(db.Model):
    __tablename__ = 'access_week'
    id = db.Column(db.Integer, primary_key=True)
    serial = db.Column(db.String)
    name = db.Column(db.String)
    monday, tuesday, wednesday, thursday, friday, saturday, sunday (7 × Integer)
```

### Supabase
```sql
CREATE TABLE access_week (
    id INTEGER PRIMARY KEY,
    sun INTEGER, mon INTEGER, tue INTEGER, wed INTEGER,
    thu INTEGER, fri INTEGER, sat INTEGER,
    created_at TIMESTAMP DEFAULT now()
);
```

### Análisis
| Aspecto | Flask | Supabase | Estado |
|---------|-------|----------|--------|
| **Días de semana** | ✅ 7 Integer | ✅ 7 Integer | ✅ Coincide (solo nombres diferentes) |
| **serial, name** | ✅ String | ❌ No existen | ❌ Supabase NO tiene serial/name |
| **created_at** | ❌ No existe | ✅ Existe | ❌ Falta en Flask |

**Recomendación**: Sincronizar presencia/ausencia de campos `serial` y `name`.

---

## 7. TABLA: `machine_command` / `MachineCommand.py`

### FlaskProject
```python
class MachineCommand(db.Model):
    __tablename__ = 'machine_command'
    id = db.Column(db.Integer, primary_key=True)
    serial = db.Column(db.String(80), nullable=False)
    name = db.Column(db.String(80), nullable=False)
    content = db.Column(db.String(255), nullable=False)
    status = db.Column(db.Integer, nullable=False)
    send_status = db.Column(db.Integer, nullable=False)
    err_count = db.Column(db.Integer, nullable=False)
    run_time = db.Column(db.DateTime, nullable=False)
    gmt_crate = db.Column(db.DateTime, nullable=False)
    gmt_modified = db.Column(db.DateTime, nullable=False)
```

### Supabase
```sql
CREATE TABLE machine_command (
    id INTEGER PRIMARY KEY,
    name VARCHAR,
    status INTEGER DEFAULT 0,
    send_status INTEGER DEFAULT 0,
    err_count INTEGER DEFAULT 0,
    serial VARCHAR,
    content TEXT,
    gmt_crate TIMESTAMP DEFAULT now(),
    gmt_modified TIMESTAMP DEFAULT now()
);
```

### Análisis
| Aspecto | Flask | Supabase | Estado |
|---------|-------|----------|--------|
| **serial** | `String(80) NOT NULL` | `VARCHAR nullable` | ⚠️ Flask obliga, Supabase nullable |
| **name** | `String(80) NOT NULL` | `VARCHAR nullable` | ⚠️ Flask obliga, Supabase nullable |
| **content** | `String(255) NOT NULL` | `TEXT nullable` | ⚠️ Flask String(255), Supabase TEXT (más flexible) |
| **status/send_status** | `Integer NOT NULL` | `Integer DEFAULT 0` | ⚠️ Flask obliga, Supabase tiene default |
| **run_time** | ✅ DateTime NOT NULL | ❌ No existe | ❌ Supabase NO tiene run_time |
| **gmt_crate, gmt_modified** | ✅ DateTime NOT NULL | ✅ DateTime DEFAULT now() | ⚠️ Flask obliga manualmente |

**Recomendación**: 
- Revisar si `run_time` es realmente necesario en Supabase
- Permitir valores nullable en Flask o agregar defaults

---

## 8. MODELOS NUEVOS EN SUPABASE (No en Flask)

### Tablas biométricas nuevas:
- ✅ **asistencia_fichajes** - Registros de entrada/salida detallados
- ✅ **asistencia_dispositivos** - Dispositivos biométricos por centro
- ✅ **asistencia_enroll_map** - Mapeo enroll_id ↔ profesional_id
- ✅ **cuadrantes_biometricos** - Cuadrantes de asistencia

### Tablas de gestión de salud (no existen en Flask):
- ✅ **profesionales_sanitarios** - Info completa de profesionales
- ✅ **guardias** - Gestión de guardias médicas
- ✅ **nominas_guardias** - Nóminas de guardias
- ✅ **expedientes_disciplinarios** - Expedientes disciplinarios
- ✅ **centros_salud** - Centros de salud
- Y muchas otras...

---

## 9. MAPEO DE TIPOS

### Tipos en Flask → Tipos en Supabase

| Flask | Supabase | Compatibilidad |
|-------|----------|---|
| `db.Integer` | `INTEGER / INT4` | ✅ Directa |
| `db.BigInteger` | `BIGINT / INT8` | ✅ Directa |
| `db.String(n)` | `VARCHAR(n) / CHARACTER VARYING` | ✅ Directa |
| `db.String` (sin tamaño) | `VARCHAR / TEXT` | ✅ Flexible |
| `db.Text` | `TEXT` | ✅ Directa |
| `db.DateTime` | `TIMESTAMP / TIMESTAMP WITH TIME ZONE` | ✅ Compatible |
| `db.Float` | `FLOAT / FLOAT8 / NUMERIC` | ✅ Compatible |
| `db.Boolean` | `BOOLEAN / BOOL` | ✅ Directa |
| ❌ Enum (en Flask) | `USER-DEFINED ENUM` | ⚠️ No bien usado en Flask |
| ❌ JSON (en Flask) | `JSONB` | ⚠️ Flask tiene SQLAlchemy-JSON |

---

## 10. CONCLUSIONES Y RECOMENDACIONES

### ✅ Lo que COINCIDE:
1. **Estructura básica** - Las tablas comunes (person, device, enroll_info, records, access_day, access_week) tienen campos correspondientes
2. **Tipos principales** - Integer, String, DateTime, Float son directamente compatibles
3. **Propósito biométrico** - Ambos sistemas maneja fichayes, dispositivos, usuarios

### ⚠️ Discrepancias CRÍTICAS:

1. **Columnas faltantes en Flask:**
   - `created_at` / `updated_at` en varias tablas
   - `run_time` en machine_command (Supabase no la tiene)
   - Columnas decomposición temporal en records (year, month, day, etc.)

2. **Diferencias de constraints:**
   - Flask: muchos campos con `NOT NULL` obligatorio
   - Supabase: más flexible con `DEFAULT` values y `nullable` fields

3. **Enums no utilizados en Flask:**
   - Flask usa Integer para `intOut` (debería ser ENUM "IN"/"OUT")
   - Supabase define correctamente como `INOUT_TYPE`

4. **Discordancia en access_day:**
   - Flask: 5 rangos horarios (start_time1-5, end_time1-5)
   - Supabase: 3 rangos horarios (time1, time2, time3)

### 🔧 Acciones Recomendadas:

1. **PRIORITARIO**: Sincronizar timestamps
   ```python
   # Agregar a todos los modelos:
   created_at = db.Column(db.DateTime, default=datetime.utcnow)
   updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
   ```

2. **IMPORTANTE**: Revisar constraints
   - Permitir más fields nullable en Flask para alinearse con Supabase
   - Agregar DEFAULT values donde corresponda

3. **MEJORA**: Usar ENUMs en lugar de Integers donde sea apropiado
   ```python
   # En lugar de: intOut = db.Column(db.Integer)
   # Usar: inout = db.Column(db.Enum('IN', 'OUT', name='inout_type'))
   ```

4. **VALIDACIÓN**: Confirmar número correcto de rangos en access_day
   - ¿Flask necesita 5 rangos o Supabase debería tener 5?

5. **NUEVA ARQUITECTURA**: Las tablas nuevas en Supabase (profesionales_sanitarios, guardias, etc.) muestran que el sistema ha evolucionado de "biometría pura" a "gestión integral de salud". Flask necesitaría refactorización mayor.

---

## 11. MATRIZ RESUMEN

| Tabla | Flask ✅ | Supabase ✅ | Alineación | Prioritario |
|-------|----------|-----------|-----------|-------------|
| person | Sí | Sí | 80% | Agregar timestamps |
| device | Sí | Sí | 85% | Agregar timestamps, mejorar constraints |
| enroll_info | Sí | Sí | 95% | Agregar created_at |
| records | Sí | Sí | 70% | Agregar campos descompuestos, usar ENUM |
| access_day | Sí | Sí | 50% | Sincronizar # de rangos |
| access_week | Sí | Sí | 85% | Sincronizar serial/name |
| machine_command | Sí | Sí | 75% | Revisar run_time, mejorar constraints |

---

**Generado**: Análisis MCP Supabase  
**Recomendación Final**: Antes de cualquier migración, revisar la intención de campos divergentes (ej: run_time en machine_command, número de rangos en access_day).
