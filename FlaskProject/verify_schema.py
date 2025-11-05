"""
Schema verification tool to align Flask database with Supabase.
Compares table structures and reports differences.
"""

from database import db
from sqlalchemy import inspect
from Models.Person import Person
from Models.Device import Device
from Models.Records import Record
from Models.EnrollInfo import EnrollInfo
from Models.AccessDay import AccessDay
from Models.AccessWeek import AccessWeek
from Models.MachineCommand import MachineCommand


def get_flask_schema():
    """
    Extract database schema from Flask SQLAlchemy models.
    
    Returns:
        Dictionary with table names and their column information
    """
    inspector = inspect(db.engine)
    tables = {}
    
    try:
        for table_name in inspector.get_table_names():
            columns = {}
            for column in inspector.get_columns(table_name):
                columns[column['name']] = {
                    'type': str(column['type']),
                    'nullable': column['nullable'],
                    'default': str(column['default']) if column['default'] is not None else None,
                }
            tables[table_name] = columns
    except Exception as e:
        print(f"Error inspecting Flask schema: {e}")
        return {}
    
    return tables


def print_flask_schema():
    """
    Print Flask database schema in human-readable format.
    """
    schema = get_flask_schema()
    
    print("\n" + "="*70)
    print("FLASK DATABASE SCHEMA")
    print("="*70 + "\n")
    
    for table_name, columns in sorted(schema.items()):
        print(f"📋 TABLE: {table_name}")
        print("-" * 70)
        
        for col_name, col_info in sorted(columns.items()):
            nullable = "NULL" if col_info['nullable'] else "NOT NULL"
            print(f"  • {col_name:25} {col_info['type']:20} {nullable}")
        
        print()


def compare_models_with_supabase_reference():
    """
    Compare Flask models with expected Supabase schema.
    This provides recommendations for alignment.
    """
    flask_schema = get_flask_schema()
    
    # Expected Supabase tables and key columns
    supabase_reference = {
        'person': ['id', 'name', 'roll_id', 'created_at', 'updated_at'],
        'device': ['id', 'serial_num', 'status', 'created_at', 'updated_at'],
        'records': [
            'id', 'enroll_id', 'records_time', 'mode', 'intOut', 'event',
            'device_serial_num', 'temperature', 'image', 'created_at', 'updated_at',
            'verify_mode', 'year', 'month', 'day', 'hour', 'minute', 'second',
            'workcode', 'reserved'
        ],
        'enroll_info': ['id', 'enroll_id', 'backupnum', 'imagepath', 'signatures', 'created_at', 'updated_at'],
        'access_day': [
            'id', 'serial', 'name',
            'start_time1', 'end_time1', 'start_time2', 'end_time2',
            'start_time3', 'end_time3', 'start_time4', 'end_time4',
            'start_time5', 'end_time5', 'created_at', 'updated_at'
        ],
        'access_week': ['id', 'serial', 'name', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'created_at', 'updated_at'],
        'machine_command': [
            'id', 'serial', 'name', 'content', 'status', 'send_status',
            'err_count', 'run_time', 'gmt_crate', 'gmt_modified', 'created_at', 'updated_at'
        ],
    }
    
    print("\n" + "="*70)
    print("SCHEMA ALIGNMENT REPORT")
    print("="*70 + "\n")
    
    for table_name in sorted(supabase_reference.keys()):
        expected_cols = set(supabase_reference[table_name])
        
        if table_name not in flask_schema:
            print(f"❌ TABLE MISSING: {table_name}")
            print(f"   Expected columns: {', '.join(sorted(expected_cols))}")
            print()
            continue
        
        actual_cols = set(flask_schema[table_name].keys())
        
        missing = expected_cols - actual_cols
        extra = actual_cols - expected_cols
        
        status = "✅" if not missing and not extra else "⚠️" if missing else "ℹ️"
        
        print(f"{status} TABLE: {table_name}")
        
        if missing:
            print(f"   ❌ Missing columns: {', '.join(sorted(missing))}")
        
        if extra:
            print(f"   ℹ️  Extra columns (local): {', '.join(sorted(extra))}")
        
        if not missing and not extra:
            print(f"   ✅ Perfect alignment with Supabase schema")
        
        print()


def verify_timestamps():
    """
    Verify that all models have created_at and updated_at timestamps.
    """
    schema = get_flask_schema()
    
    print("\n" + "="*70)
    print("TIMESTAMP VERIFICATION")
    print("="*70 + "\n")
    
    required_timestamps = {'created_at', 'updated_at'}
    
    for table_name, columns in sorted(schema.items()):
        col_names = set(columns.keys())
        has_timestamps = required_timestamps.issubset(col_names)
        
        status = "✅" if has_timestamps else "❌"
        print(f"{status} {table_name:20} {', '.join(sorted(required_timestamps & col_names)) or 'MISSING'}")


def generate_migration_recommendations():
    """
    Generate SQL migration recommendations to align Flask with Supabase.
    """
    schema = get_flask_schema()
    
    print("\n" + "="*70)
    print("MIGRATION RECOMMENDATIONS")
    print("="*70 + "\n")
    
    supabase_reference = {
        'person': ['id', 'name', 'roll_id', 'created_at', 'updated_at'],
        'device': ['id', 'serial_num', 'status', 'created_at', 'updated_at'],
        'records': [
            'id', 'enroll_id', 'records_time', 'mode', 'intOut', 'event',
            'device_serial_num', 'temperature', 'image', 'created_at', 'updated_at',
            'verify_mode', 'year', 'month', 'day', 'hour', 'minute', 'second',
            'workcode', 'reserved'
        ],
    }
    
    print("If migrations are needed, execute:")
    print("\n```bash")
    print("cd FlaskProject")
    print("flask db migrate -m 'Add timestamps and align with Supabase schema'")
    print("flask db upgrade")
    print("```\n")


def main():
    """Run all verification checks."""
    print("\n🔍 Starting Flask-Supabase Schema Alignment Verification...\n")
    
    try:
        print_flask_schema()
        compare_models_with_supabase_reference()
        verify_timestamps()
        generate_migration_recommendations()
        
        print("\n" + "="*70)
        print("✅ VERIFICATION COMPLETE")
        print("="*70 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error during verification: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
