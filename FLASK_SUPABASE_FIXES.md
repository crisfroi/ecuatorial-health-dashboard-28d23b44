# Correcciones Prácticas: Alineación Flask ↔ Supabase

## 🎯 Plan de Acción

Este documento proporciona las correcciones específicas que Flask necesita para alinearse con Supabase.

---

## CORRECCIÓN 1: Agregar Timestamps a Todos los Modelos

### Problema
- Supabase tiene `created_at` y `updated_at` en casi todas las tablas
- Flask carece de estos campos
- Dificulta auditoría y sincronización

### Solución

Crear un **base model mixin**:

```python
# FlaskProject/Models/BaseModel.py
from database import db
from datetime import datetime

class BaseModel(db.Model):
    """Base model with common fields"""
    __abstract__ = True
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
```

### Aplicar a cada modelo:

**Person.py:**
```python
from Models.BaseModel import BaseModel

class Person(BaseModel):
    __tablename__ = 'person'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    roll_id = db.Column(db.Integer, default=0)  # Cambiar: permitir default
```

**Device.py:**
```python
class Device(BaseModel):
    __tablename__ = 'device'
    
    id = db.Column(db.Integer, primary_key=True)
    serial_num = db.Column(db.String(80), unique=True, nullable=False)
    status = db.Column(db.Integer, default=0)  # Cambiar: agregar default
```

**EnrollInfo.py:**
```python
class EnrollInfo(BaseModel):
    __tablename__ = 'enroll_info'
    
    id = db.Column(db.Integer, primary_key=True)
    enroll_id = db.Column(db.Integer)
    backupnum = db.Column(db.Integer)
    imagepath = db.Column(db.String)
    signatures = db.Column(db.Text)
```

**Record.py (Records):**
```python
class Record(BaseModel):
    __tablename__ = 'records'
    
    id = db.Column(db.Integer, primary_key=True)
    enroll_id = db.Column(db.Integer)  # Cambiar: permitir nullable
    records_time = db.Column(db.DateTime, nullable=False)
    mode = db.Column(db.Integer)
    intOut = db.Column(db.Integer)
    event = db.Column(db.Integer)
    device_serial_num = db.Column(db.String(50))
    temperature = db.Column(db.Float)
    image = db.Column(db.String(255))
    
    # Campos nuevos (alineados con Supabase)
    verify_mode = db.Column(db.Integer)
    year = db.Column(db.Integer)
    month = db.Column(db.Integer)
    day = db.Column(db.Integer)
    hour = db.Column(db.Integer)
    minute = db.Column(db.Integer)
    second = db.Column(db.Integer)
    workcode = db.Column(db.Integer)
    reserved = db.Column(db.Integer)
```

**AccessDay.py:**
```python
class AccessDay(BaseModel):
    __tablename__ = 'access_day'
    
    id = db.Column(db.Integer, primary_key=True)
    # Decisión: ¿Mantener serial/name o remover?
    # Por ahora, mantener para compatibilidad
    serial = db.Column(db.String)
    name = db.Column(db.String)
    
    # Los 3 primeros rangos (alineados con Supabase)
    time1_start = db.Column(db.String)
    time1_end = db.Column(db.String)
    time2_start = db.Column(db.String)
    time2_end = db.Column(db.String)
    time3_start = db.Column(db.String)
    time3_end = db.Column(db.String)
    
    # Mantener los 2 rangos extras (local only, no en Supabase)
    time4_start = db.Column(db.String)
    time4_end = db.Column(db.String)
    time5_start = db.Column(db.String)
    time5_end = db.Column(db.String)
```

**AccessWeek.py:**
```python
class AccessWeek(BaseModel):
    __tablename__ = 'access_week'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Mantener serial/name (aún no está en Supabase, pero no daña)
    serial = db.Column(db.String)
    name = db.Column(db.String)
    
    # Nombres de días alineados con Supabase (sun, mon, tue, etc.)
    sun = db.Column(db.Integer)
    mon = db.Column(db.Integer)
    tue = db.Column(db.Integer)
    wed = db.Column(db.Integer)
    thu = db.Column(db.Integer)
    fri = db.Column(db.Integer)
    sat = db.Column(db.Integer)
```

**MachineCommand.py:**
```python
class MachineCommand(BaseModel):
    __tablename__ = 'machine_command'
    
    id = db.Column(db.Integer, primary_key=True)
    serial = db.Column(db.String(80))  # Cambiar: permitir nullable
    name = db.Column(db.String(80))    # Cambiar: permitir nullable
    content = db.Column(db.Text)       # Cambiar: Text en lugar de String(255)
    status = db.Column(db.Integer, default=0)       # Cambiar: agregar default
    send_status = db.Column(db.Integer, default=0)  # Cambiar: agregar default
    err_count = db.Column(db.Integer, default=0)    # Cambiar: agregar default
    
    # Mantener run_time si se usa localmente
    run_time = db.Column(db.DateTime, default=datetime.utcnow)
    gmt_crate = db.Column(db.DateTime, default=datetime.utcnow)
    gmt_modified = db.Column(db.DateTime, default=datetime.utcnow)
```

---

## CORRECCIÓN 2: Usar ENUMs Apropiadamente

### Problema
- Flask usa `Integer` para campos que deberían ser ENUM (como `intOut` en records)
- Supabase define correctamente `INOUT_TYPE` como ENUM

### Solución

**Records.py - Usar ENUM:**
```python
from sqlalchemy import Enum as SQLEnum
from enum import Enum

class InOutType(str, Enum):
    IN = "IN"
    OUT = "OUT"

class Record(BaseModel):
    __tablename__ = 'records'
    
    # En lugar de:
    # intOut = db.Column(db.Integer)
    
    # Usar:
    inout = db.Column(SQLEnum(InOutType), name='inout_type')
```

---

## CORRECCIÓN 3: Migration Script de Supabase a Flask

### Para sincronizar datos existentes en Supabase:

```python
# FlaskProject/migrate_from_supabase.py
from supabase import create_client
from database import db
from Models.Person import Person
from Models.Device import Device
from Models.Records import Record
from Models.EnrollInfo import EnrollInfo

SUPABASE_URL = "https://wdieynendfjbkbhfovrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def migrate_records():
    """Migrar registros desde Supabase a Flask"""
    response = supabase.table('records').select('*').execute()
    
    for record_data in response.data:
        record = Record(
            enroll_id=record_data['enroll_id'],
            records_time=record_data['records_time'],
            mode=record_data['mode'],
            inout=record_data.get('int_out'),  # Nota: cambio de nombre
            event=record_data['event'],
            device_serial_num=record_data.get('device_serial_num'),
            temperature=record_data.get('temperature'),
            image=record_data.get('image'),
            verify_mode=record_data.get('verify_mode'),
            year=record_data.get('year'),
            month=record_data.get('month'),
            day=record_data.get('day'),
            hour=record_data.get('hour'),
            minute=record_data.get('minute'),
            second=record_data.get('second'),
            workcode=record_data.get('workcode'),
            reserved=record_data.get('reserved'),
        )
        db.session.add(record)
    
    db.session.commit()
    print("✅ Records migrados exitosamente")

def migrate_devices():
    """Migrar dispositivos desde Supabase a Flask"""
    response = supabase.table('device').select('*').execute()
    
    for device_data in response.data:
        device = Device(
            id=device_data['id'],
            serial_num=device_data['serial_num'],
            status=device_data['status']
        )
        db.session.add(device)
    
    db.session.commit()
    print("✅ Devices migrados exitosamente")

if __name__ == '__main__':
    migrate_records()
    migrate_devices()
```

---

## CORRECCIÓN 4: Sincronización Bidireccional (Listener)

Para mantener ambas bases de datos sincronizadas:

```python
# FlaskProject/sync_with_supabase.py
from supabase import create_client
from database import db
from Models.Records import Record
import json

SUPABASE_URL = "https://wdieynendfjbkbhfovrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def push_new_records_to_supabase():
    """Enviar nuevos registros de Flask a Supabase"""
    # Obtener registros creados en la última hora
    from datetime import datetime, timedelta
    
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    new_records = Record.query.filter(Record.created_at > one_hour_ago).all()
    
    for record in new_records:
        data = {
            'enroll_id': record.enroll_id,
            'records_time': record.records_time.isoformat(),
            'mode': record.mode,
            'int_out': record.inout.value if record.inout else None,
            'event': record.event,
            'device_serial_num': record.device_serial_num,
            'temperature': record.temperature,
            'image': record.image,
        }
        
        supabase.table('records').insert(data).execute()
        print(f"✅ Record {record.id} sincronizado a Supabase")

def pull_new_records_from_supabase():
    """Obtener nuevos registros de Supabase"""
    response = supabase.table('records').select('*').order('created_at', desc=True).limit(100).execute()
    
    for record_data in response.data:
        # Verificar si existe en Flask
        existing = Record.query.filter_by(id=record_data.get('id')).first()
        if not existing:
            record = Record(
                enroll_id=record_data['enroll_id'],
                records_time=record_data['records_time'],
                # ... mapear otros campos
            )
            db.session.add(record)
    
    db.session.commit()
    print("✅ Registros de Supabase sincronizados")

# Ejecutar periódicamente (ej: cada 5 minutos con APScheduler)
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()
scheduler.add_job(push_new_records_to_supabase, 'interval', minutes=5)
scheduler.add_job(pull_new_records_from_supabase, 'interval', minutes=5)
scheduler.start()
```

---

## CORRECCIÓN 5: Validación de Datos

Agregar validadores para asegurar consistencia:

```python
# FlaskProject/validators.py
from flask import abort

def validate_record(record_data):
    """Validar un registro antes de insertarlo"""
    
    # Requeridos
    if not record_data.get('enroll_id'):
        abort(400, "enroll_id es requerido")
    
    if not record_data.get('records_time'):
        abort(400, "records_time es requerido")
    
    # Validar ENUM
    if record_data.get('inout'):
        if record_data['inout'] not in ['IN', 'OUT']:
            abort(400, "inout debe ser 'IN' o 'OUT'")
    
    # Validar temperatura (rango sensato)
    if record_data.get('temperature'):
        if not (30 <= float(record_data['temperature']) <= 42):
            abort(400, "Temperatura fuera de rango (30-42°C)")
    
    return True

# Usar en rutas Flask:
@app.route('/api/records', methods=['POST'])
def create_record():
    data = request.json
    validate_record(data)
    
    record = Record(**data)
    db.session.add(record)
    db.session.commit()
    
    return jsonify(record.to_dict()), 201
```

---

## CORRECCIÓN 6: Schema Allineation Query

Para verificar que Flask coincide con Supabase:

```python
# FlaskProject/verify_schema.py
from database import db
from sqlalchemy import inspect
from supabase import create_client

def get_flask_schema():
    """Obtener schema de Flask"""
    inspector = inspect(db.engine)
    
    tables = {}
    for table_name in inspector.get_table_names():
        columns = {}
        for column in inspector.get_columns(table_name):
            columns[column['name']] = {
                'type': str(column['type']),
                'nullable': column['nullable'],
            }
        tables[table_name] = columns
    
    return tables

def get_supabase_schema():
    """Obtener schema de Supabase via MCP"""
    # Usar mcp__supabase__list_tables
    return supabase_tables_data

def compare_schemas():
    """Comparar ambos esquemas"""
    flask_schema = get_flask_schema()
    supabase_schema = get_supabase_schema()
    
    print("\n=== COMPARACIÓN DE SCHEMAS ===\n")
    
    for table_name in ['records', 'device', 'person', 'enroll_info']:
        print(f"\n📋 Tabla: {table_name}")
        
        flask_cols = set(flask_schema.get(table_name, {}).keys())
        supabase_cols = set(supabase_schema.get(table_name, {}).keys())
        
        missing_in_flask = supabase_cols - flask_cols
        missing_in_supabase = flask_cols - supabase_cols
        
        if missing_in_flask:
            print(f"  ❌ Faltan en Flask: {missing_in_flask}")
        
        if missing_in_supabase:
            print(f"  ⚠️  Extras en Flask (no en Supabase): {missing_in_supabase}")
        
        if not missing_in_flask and not missing_in_supabase:
            print(f"  ✅ Perfectamente alineada")

if __name__ == '__main__':
    compare_schemas()
```

---

## 🎬 Ejecución Recomendada

### Paso 1: Actualizar Modelos
```bash
# 1. Crear BaseModel.py con timestamps
# 2. Heredar BaseModel en todos los modelos
# 3. Cambiar constraints según correcciones arriba
```

### Paso 2: Crear Migrations de Alembic
```bash
cd FlaskProject
flask db migrate -m "Add timestamps and align with Supabase schema"
flask db upgrade
```

### Paso 3: Validar Schema
```bash
python verify_schema.py
```

### Paso 4: Migrar Datos (si es necesario)
```bash
python migrate_from_supabase.py
```

### Paso 5: Activar Sincronización
```bash
# En app.py
from sync_with_supabase import scheduler
scheduler.start()
```

---

## ✅ Checklist Final

- [ ] BaseModel creado con timestamps
- [ ] Todos los modelos heredan de BaseModel
- [ ] Constraints actualizados (nullable, defaults)
- [ ] ENUMs implementados correctamente
- [ ] Migration script ejecutado
- [ ] Schema validation pasada
- [ ] Sincronización bidireccional funcionando
- [ ] Tests unitarios actualizados
- [ ] Documentación de cambios creada

---

**Última actualización**: Análisis MCP Supabase  
**Estado**: Listo para implementación
