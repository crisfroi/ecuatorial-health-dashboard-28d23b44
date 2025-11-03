"""
Migration script to sync data from Supabase to Flask local database.
Use this script to populate Flask database with existing Supabase data.

Usage:
    python migrate_from_supabase.py
"""

import os
import sys
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

from database import db, app
from Models.Person import Person, insert_person
from Models.Device import Device, insert_device
from Models.Records import Record, insert_record2
from Models.EnrollInfo import EnrollInfo, insert_enroll_info
from Models.AccessDay import AccessDay, insert_access_day
from Models.AccessWeek import AccessWeek, insert_access_week
from Models.MachineCommand import MachineCommand, insert_machine_command


def migrate_records(supabase_records):
    """
    Migrate attendance records from Supabase to Flask.
    
    Args:
        supabase_records: List of record dictionaries from Supabase
    """
    print("\n📝 Migrating Records...")
    count = 0
    errors = 0
    
    try:
        for record_data in supabase_records:
            try:
                record_dict = {
                    'enroll_id': record_data.get('enroll_id'),
                    'records_time': record_data.get('records_time'),
                    'mode': record_data.get('mode'),
                    'intOut': record_data.get('int_out', record_data.get('intOut')),
                    'event': record_data.get('event'),
                    'device_serial_num': record_data.get('device_serial_num'),
                    'temperature': record_data.get('temperature'),
                    'image': record_data.get('image'),
                    'verify_mode': record_data.get('verify_mode'),
                    'year': record_data.get('year'),
                    'month': record_data.get('month'),
                    'day': record_data.get('day'),
                    'hour': record_data.get('hour'),
                    'minute': record_data.get('minute'),
                    'second': record_data.get('second'),
                    'workcode': record_data.get('workcode'),
                    'reserved': record_data.get('reserved'),
                }
                
                record_id = insert_record2(**record_dict)
                count += 1
                
                if count % 100 == 0:
                    print(f"  ✓ {count} records migrated...")
                    
            except Exception as e:
                errors += 1
                print(f"  ⚠️  Error migrating record: {e}")
        
        print(f"  ✅ Successfully migrated {count} records ({errors} errors)")
        
    except Exception as e:
        print(f"  ❌ Error during records migration: {e}")
        import traceback
        traceback.print_exc()


def migrate_devices(supabase_devices):
    """
    Migrate devices from Supabase to Flask.
    
    Args:
        supabase_devices: List of device dictionaries from Supabase
    """
    print("\n📱 Migrating Devices...")
    count = 0
    errors = 0
    
    try:
        for device_data in supabase_devices:
            try:
                insert_device(
                    serial_num=device_data.get('serial_num'),
                    status=device_data.get('status', 0)
                )
                count += 1
            except Exception as e:
                errors += 1
                print(f"  ⚠️  Error migrating device {device_data.get('id')}: {e}")
        
        print(f"  ✅ Successfully migrated {count} devices ({errors} errors)")
        
    except Exception as e:
        print(f"  ❌ Error during devices migration: {e}")
        import traceback
        traceback.print_exc()


def migrate_persons(supabase_persons):
    """
    Migrate persons from Supabase to Flask.
    
    Args:
        supabase_persons: List of person dictionaries from Supabase
    """
    print("\n👥 Migrating Persons...")
    count = 0
    errors = 0
    
    try:
        for person_data in supabase_persons:
            try:
                insert_person(
                    id=person_data.get('id'),
                    name=person_data.get('name'),
                    roll_id=person_data.get('roll_id', 0)
                )
                count += 1
            except Exception as e:
                errors += 1
                print(f"  ⚠️  Error migrating person {person_data.get('id')}: {e}")
        
        print(f"  ✅ Successfully migrated {count} persons ({errors} errors)")
        
    except Exception as e:
        print(f"  ❌ Error during persons migration: {e}")
        import traceback
        traceback.print_exc()


def migrate_enroll_info(supabase_enroll_info):
    """
    Migrate enroll info from Supabase to Flask.
    
    Args:
        supabase_enroll_info: List of enroll info dictionaries from Supabase
    """
    print("\n🔐 Migrating Enroll Info...")
    count = 0
    errors = 0
    
    try:
        for enroll_data in supabase_enroll_info:
            try:
                insert_enroll_info(
                    enroll_id=enroll_data.get('enroll_id'),
                    backupnum=enroll_data.get('backupnum'),
                    imagepath=enroll_data.get('imagepath'),
                    signatures=enroll_data.get('signatures')
                )
                count += 1
            except Exception as e:
                errors += 1
                print(f"  ⚠️  Error migrating enroll info: {e}")
        
        print(f"  ✅ Successfully migrated {count} enroll info records ({errors} errors)")
        
    except Exception as e:
        print(f"  ❌ Error during enroll info migration: {e}")
        import traceback
        traceback.print_exc()


def migrate_access_days(supabase_access_days):
    """
    Migrate access days from Supabase to Flask.
    
    Args:
        supabase_access_days: List of access day dictionaries from Supabase
    """
    print("\n📅 Migrating Access Days...")
    count = 0
    errors = 0
    
    try:
        for access_day_data in supabase_access_days:
            try:
                access_day = AccessDay(
                    id=access_day_data.get('id'),
                    serial=access_day_data.get('serial'),
                    name=access_day_data.get('name'),
                    start_time1=access_day_data.get('time1_start'),
                    end_time1=access_day_data.get('time1_end'),
                    start_time2=access_day_data.get('time2_start'),
                    end_time2=access_day_data.get('time2_end'),
                    start_time3=access_day_data.get('time3_start'),
                    end_time3=access_day_data.get('time3_end'),
                    start_time4=access_day_data.get('time4_start'),
                    end_time4=access_day_data.get('time4_end'),
                    start_time5=access_day_data.get('time5_start'),
                    end_time5=access_day_data.get('time5_end'),
                )
                db.session.add(access_day)
                db.session.commit()
                count += 1
            except Exception as e:
                db.session.rollback()
                errors += 1
                print(f"  ⚠️  Error migrating access day: {e}")
        
        print(f"  ✅ Successfully migrated {count} access days ({errors} errors)")
        
    except Exception as e:
        print(f"  ❌ Error during access days migration: {e}")
        import traceback
        traceback.print_exc()


def migrate_access_weeks(supabase_access_weeks):
    """
    Migrate access weeks from Supabase to Flask.
    
    Args:
        supabase_access_weeks: List of access week dictionaries from Supabase
    """
    print("\n📆 Migrating Access Weeks...")
    count = 0
    errors = 0
    
    try:
        for access_week_data in supabase_access_weeks:
            try:
                access_week = AccessWeek(
                    id=access_week_data.get('id'),
                    serial=access_week_data.get('serial'),
                    name=access_week_data.get('name'),
                    monday=access_week_data.get('mon'),
                    tuesday=access_week_data.get('tue'),
                    wednesday=access_week_data.get('wed'),
                    thursday=access_week_data.get('thu'),
                    friday=access_week_data.get('fri'),
                    saturday=access_week_data.get('sat'),
                    sunday=access_week_data.get('sun'),
                )
                db.session.add(access_week)
                db.session.commit()
                count += 1
            except Exception as e:
                db.session.rollback()
                errors += 1
                print(f"  ⚠️  Error migrating access week: {e}")
        
        print(f"  ✅ Successfully migrated {count} access weeks ({errors} errors)")
        
    except Exception as e:
        print(f"  ❌ Error during access weeks migration: {e}")
        import traceback
        traceback.print_exc()


def main():
    """
    Main migration function.
    
    NOTE: This script requires manual configuration with Supabase data.
    Modify the supabase_data dictionaries below with actual data from Supabase.
    """
    print("\n" + "="*70)
    print("FLASK ← SUPABASE DATA MIGRATION")
    print("="*70)
    
    print("\n⚠️  IMPORTANT: This script requires manual configuration.")
    print("Please fetch data from Supabase and populate the variables below.\n")
    
    # Example data structures - replace with actual Supabase data
    supabase_records = []  # Fetch from Supabase: SELECT * FROM records
    supabase_devices = []  # Fetch from Supabase: SELECT * FROM device
    supabase_persons = []  # Fetch from Supabase: SELECT * FROM person
    supabase_enroll_info = []  # Fetch from Supabase: SELECT * FROM enroll_info
    supabase_access_days = []  # Fetch from Supabase: SELECT * FROM access_day
    supabase_access_weeks = []  # Fetch from Supabase: SELECT * FROM access_week
    
    with app.app_context():
        try:
            # Run migrations
            if supabase_devices:
                migrate_devices(supabase_devices)
            
            if supabase_persons:
                migrate_persons(supabase_persons)
            
            if supabase_enroll_info:
                migrate_enroll_info(supabase_enroll_info)
            
            if supabase_records:
                migrate_records(supabase_records)
            
            if supabase_access_days:
                migrate_access_days(supabase_access_days)
            
            if supabase_access_weeks:
                migrate_access_weeks(supabase_access_weeks)
            
            print("\n" + "="*70)
            print("✅ MIGRATION COMPLETE")
            print("="*70 + "\n")
            
        except Exception as e:
            print(f"\n❌ Migration failed: {e}")
            import traceback
            traceback.print_exc()


if __name__ == '__main__':
    main()
