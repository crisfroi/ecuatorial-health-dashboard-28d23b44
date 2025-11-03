"""
Bidirectional synchronization module between Flask and Supabase.
Keeps both databases in sync automatically.

NOTE: This module is NOT activated by default in app.py.
To enable sync, uncomment the initialization code in app.py.

Usage in app.py:
    from sync_with_supabase import start_sync_scheduler
    
    @app.before_request
    def init_sync():
        if not hasattr(g, 'sync_initialized'):
            start_sync_scheduler()
            g.sync_initialized = True
"""

import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any

# Try to import optional dependencies
try:
    from apscheduler.schedulers.background import BackgroundScheduler
    SCHEDULER_AVAILABLE = True
except ImportError:
    SCHEDULER_AVAILABLE = False
    print("⚠️  APScheduler not available. Install with: pip install apscheduler")


class SyncLogger:
    """Simple logging for sync operations."""
    
    @staticmethod
    def log(message: str, level: str = "INFO"):
        """Log a sync message."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [SYNC/{level}] {message}")


def push_new_records_to_supabase(supabase_client=None):
    """
    Push newly created records from Flask to Supabase asistencia_fichajes.

    This function queries for records created in the last hour and syncs them,
    enriching with professional and center data via mapping tables.

    Args:
        supabase_client: Supabase client instance (for testing/optional)
    """
    if supabase_client is None:
        SyncLogger.log("Supabase client not configured. Skipping push.", "WARN")
        return

    try:
        from Models.Records import Record
        from database import app

        with app.app_context():
            # Find records created in last hour
            one_hour_ago = datetime.utcnow() - timedelta(hours=1)
            new_records = Record.query.filter(Record.created_at > one_hour_ago).all()

            synced_count = 0
            for record in new_records:
                try:
                    # Enrich record with profesional_id and centro_salud_id from mapping
                    profesional_id = None
                    centro_salud_id = None

                    # Try to fetch mapping from Supabase
                    try:
                        mapping_response = supabase_client.table('empleado_dispositivo_map') \
                            .select('id_profesional, id_dispositivo') \
                            .eq('en_no', str(record.enroll_id)) \
                            .limit(1) \
                            .execute()

                        if mapping_response.data and len(mapping_response.data) > 0:
                            profesional_id = mapping_response.data[0].get('id_profesional')
                            dispositivo_id = mapping_response.data[0].get('id_dispositivo')

                            # Get center from dispositivo if needed
                            if dispositivo_id:
                                device_response = supabase_client.table('asistencia_dispositivos') \
                                    .select('centro_salud_id') \
                                    .eq('id', dispositivo_id) \
                                    .limit(1) \
                                    .execute()

                                if device_response.data and len(device_response.data) > 0:
                                    centro_salud_id = device_response.data[0].get('centro_salud_id')
                    except Exception as mapping_err:
                        SyncLogger.log(f"Warning: Could not fetch mapping for enroll_id {record.enroll_id}: {mapping_err}", "WARN")

                    # Prepare data for asistencia_fichajes table
                    data = {
                        'enroll_id': record.enroll_id,
                        'device_sn': record.device_serial_num,
                        'profesional_id': profesional_id,
                        'centro_salud_id': centro_salud_id,
                        'time_local': record.records_time.isoformat(),
                        'inout': record.intOut,  # 0=IN, 1=OUT
                        'mode': record.mode,
                        'event': record.event,
                        'temperature': record.temperature / 100.0 if record.temperature else None,  # Standardize to Celsius
                        'image_url': record.image,
                        'source_type': 'biometrico',  # Mark as biometric source
                        'raw_index': record.workcode,
                    }

                    # Insert to asistencia_fichajes in Supabase
                    supabase_client.table('asistencia_fichajes').insert(data).execute()
                    synced_count += 1

                except Exception as e:
                    SyncLogger.log(f"Error syncing record {record.id}: {e}", "ERROR")

            if synced_count > 0:
                SyncLogger.log(f"✅ Pushed {synced_count} records to asistencia_fichajes", "INFO")

    except Exception as e:
        SyncLogger.log(f"Error in push_new_records_to_supabase: {e}", "ERROR")


def pull_new_records_from_supabase(supabase_client=None):
    """
    Pull newly created records from Supabase to Flask.
    
    Args:
        supabase_client: Supabase client instance
    """
    if supabase_client is None:
        SyncLogger.log("Supabase client not configured. Skipping pull.", "WARN")
        return
    
    try:
        from Models.Records import Record
        from database import db, app
        
        with app.app_context():
            # Fetch recent records from Supabase
            response = supabase_client.table('records') \
                .select('*') \
                .order('created_at', desc=True) \
                .limit(100) \
                .execute()
            
            synced_count = 0
            for record_data in response.data:
                try:
                    # Check if record already exists
                    existing = Record.query.filter_by(id=record_data.get('id')).first()
                    
                    if not existing:
                        # Create new record
                        record = Record(
                            enroll_id=record_data.get('enroll_id'),
                            records_time=record_data.get('records_time'),
                            mode=record_data.get('mode'),
                            intOut=record_data.get('int_out'),
                            event=record_data.get('event'),
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
                        synced_count += 1
                
                except Exception as e:
                    db.session.rollback()
                    SyncLogger.log(f"Error pulling record: {e}", "ERROR")
            
            if synced_count > 0:
                SyncLogger.log(f"✅ Pulled {synced_count} records from Supabase", "INFO")
    
    except Exception as e:
        SyncLogger.log(f"Error in pull_new_records_from_supabase: {e}", "ERROR")


def sync_devices(supabase_client=None):
    """
    Sync devices between Flask and Supabase.
    
    Args:
        supabase_client: Supabase client instance
    """
    if supabase_client is None:
        return
    
    try:
        from Models.Device import Device
        from database import db, app
        
        with app.app_context():
            # Push updated devices to Supabase
            devices = Device.query.all()
            
            for device in devices:
                try:
                    supabase_client.table('device') \
                        .upsert({
                            'id': device.id,
                            'serial_num': device.serial_num,
                            'status': device.status,
                            'updated_at': device.updated_at.isoformat(),
                        }) \
                        .execute()
                except Exception as e:
                    SyncLogger.log(f"Error syncing device {device.id}: {e}", "ERROR")
    
    except Exception as e:
        SyncLogger.log(f"Error in sync_devices: {e}", "ERROR")


class SyncScheduler:
    """
    Background task scheduler for bidirectional synchronization.
    
    Usage:
        scheduler = SyncScheduler()
        scheduler.start()  # Start background sync
        scheduler.stop()   # Stop background sync
    """
    
    def __init__(self, supabase_client=None, sync_interval: int = 5):
        """
        Initialize the sync scheduler.
        
        Args:
            supabase_client: Supabase client instance
            sync_interval: Sync interval in minutes (default: 5)
        """
        self.supabase_client = supabase_client
        self.sync_interval = sync_interval
        self.scheduler = None
        self.is_running = False
    
    def start(self):
        """Start the background scheduler."""
        if not SCHEDULER_AVAILABLE:
            SyncLogger.log("APScheduler not available. Cannot start scheduler.", "ERROR")
            return False
        
        if self.is_running:
            SyncLogger.log("Scheduler already running", "WARN")
            return True
        
        try:
            self.scheduler = BackgroundScheduler()
            
            # Add jobs
            self.scheduler.add_job(
                func=push_new_records_to_supabase,
                args=[self.supabase_client],
                trigger="interval",
                minutes=self.sync_interval,
                id="push_records",
                name="Push new records to Supabase",
                replace_existing=True,
            )
            
            self.scheduler.add_job(
                func=pull_new_records_from_supabase,
                args=[self.supabase_client],
                trigger="interval",
                minutes=self.sync_interval,
                id="pull_records",
                name="Pull new records from Supabase",
                replace_existing=True,
            )
            
            self.scheduler.add_job(
                func=sync_devices,
                args=[self.supabase_client],
                trigger="interval",
                minutes=self.sync_interval * 2,  # Sync devices less frequently
                id="sync_devices",
                name="Sync devices",
                replace_existing=True,
            )
            
            self.scheduler.start()
            self.is_running = True
            
            SyncLogger.log(f"✅ Sync scheduler started (interval: {self.sync_interval}m)", "INFO")
            return True
        
        except Exception as e:
            SyncLogger.log(f"Error starting scheduler: {e}", "ERROR")
            return False
    
    def stop(self):
        """Stop the background scheduler."""
        if self.scheduler and self.is_running:
            self.scheduler.shutdown()
            self.is_running = False
            SyncLogger.log("Sync scheduler stopped", "INFO")


# Global scheduler instance (not started by default)
_scheduler = None


def start_sync_scheduler(supabase_client=None, sync_interval: int = 5) -> bool:
    """
    Start the bidirectional sync scheduler.
    
    Call this function in app.py to enable sync:
        from sync_with_supabase import start_sync_scheduler
        start_sync_scheduler()
    
    Args:
        supabase_client: Supabase client instance (optional)
        sync_interval: Sync interval in minutes
    
    Returns:
        True if scheduler started successfully
    """
    global _scheduler
    
    if _scheduler is None:
        _scheduler = SyncScheduler(supabase_client, sync_interval)
    
    return _scheduler.start()


def stop_sync_scheduler():
    """Stop the bidirectional sync scheduler."""
    global _scheduler
    
    if _scheduler:
        _scheduler.stop()
        _scheduler = None


def is_sync_running() -> bool:
    """Check if sync scheduler is running."""
    global _scheduler
    return _scheduler is not None and _scheduler.is_running
