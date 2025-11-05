"""
Data validation module for Flask biometric SDK alignment with Supabase.
Ensures data consistency across both databases.
"""

from datetime import datetime


class ValidationError(Exception):
    """Custom exception for validation errors"""
    pass


def validate_record(record_data):
    """
    Validate a record before insertion into the database.
    
    Args:
        record_data: Dictionary containing record data
        
    Raises:
        ValidationError: If validation fails
    """
    if not isinstance(record_data, dict):
        raise ValidationError("record_data must be a dictionary")
    
    # Required fields
    required_fields = ['enroll_id', 'records_time', 'mode', 'intOut', 'event', 'device_serial_num']
    for field in required_fields:
        if field not in record_data or record_data[field] is None:
            raise ValidationError(f"Missing required field: {field}")
    
    # Validate enroll_id
    enroll_id = record_data.get('enroll_id')
    if not isinstance(enroll_id, (int, float)):
        raise ValidationError(f"enroll_id must be numeric, got {type(enroll_id)}")
    
    # Validate records_time format
    records_time = record_data.get('records_time')
    if isinstance(records_time, str):
        try:
            datetime.fromisoformat(records_time.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            raise ValidationError(f"Invalid records_time format: {records_time}")
    elif not isinstance(records_time, datetime):
        raise ValidationError(f"records_time must be datetime or ISO string, got {type(records_time)}")
    
    # Validate mode
    mode = record_data.get('mode')
    if not isinstance(mode, int):
        raise ValidationError(f"mode must be integer, got {type(mode)}")
    
    # Validate intOut (IN=0 or OUT=1)
    int_out = record_data.get('intOut')
    if not isinstance(int_out, int):
        raise ValidationError(f"intOut must be integer, got {type(int_out)}")
    if int_out not in [0, 1]:
        raise ValidationError(f"intOut must be 0 (IN) or 1 (OUT), got {int_out}")
    
    # Validate event
    event = record_data.get('event')
    if not isinstance(event, int):
        raise ValidationError(f"event must be integer, got {type(event)}")
    
    # Validate temperature if present
    if record_data.get('temperature') is not None:
        temperature = record_data.get('temperature')
        try:
            temp_float = float(temperature)
            if not (30 <= temp_float <= 42):
                raise ValidationError(f"Temperature out of range (30-42°C): {temperature}")
        except (TypeError, ValueError):
            raise ValidationError(f"Invalid temperature value: {temperature}")
    
    return True


def validate_person(person_data):
    """
    Validate a person record before insertion.
    
    Args:
        person_data: Dictionary containing person data
        
    Raises:
        ValidationError: If validation fails
    """
    if not isinstance(person_data, dict):
        raise ValidationError("person_data must be a dictionary")
    
    # Validate required fields
    if 'name' not in person_data or not person_data['name']:
        raise ValidationError("name is required")
    
    if not isinstance(person_data['name'], str):
        raise ValidationError(f"name must be string, got {type(person_data['name'])}")
    
    # Validate roll_id if present
    if person_data.get('roll_id') is not None:
        roll_id = person_data.get('roll_id')
        if not isinstance(roll_id, int):
            raise ValidationError(f"roll_id must be integer, got {type(roll_id)}")
    
    return True


def validate_device(device_data):
    """
    Validate a device record before insertion.
    
    Args:
        device_data: Dictionary containing device data
        
    Raises:
        ValidationError: If validation fails
    """
    if not isinstance(device_data, dict):
        raise ValidationError("device_data must be a dictionary")
    
    # Validate serial_num
    if 'serial_num' not in device_data or not device_data['serial_num']:
        raise ValidationError("serial_num is required")
    
    if not isinstance(device_data['serial_num'], str):
        raise ValidationError(f"serial_num must be string, got {type(device_data['serial_num'])}")
    
    # Validate status if present
    if device_data.get('status') is not None:
        status = device_data.get('status')
        if not isinstance(status, int):
            raise ValidationError(f"status must be integer, got {type(status)}")
    
    return True


def validate_enroll_info(enroll_info_data):
    """
    Validate an enroll info record before insertion.
    
    Args:
        enroll_info_data: Dictionary containing enroll info data
        
    Raises:
        ValidationError: If validation fails
    """
    if not isinstance(enroll_info_data, dict):
        raise ValidationError("enroll_info_data must be a dictionary")
    
    # Validate enroll_id
    if 'enroll_id' not in enroll_info_data:
        raise ValidationError("enroll_id is required")
    
    enroll_id = enroll_info_data.get('enroll_id')
    if not isinstance(enroll_id, int):
        raise ValidationError(f"enroll_id must be integer, got {type(enroll_id)}")
    
    # Validate backupnum if present
    if enroll_info_data.get('backupnum') is not None:
        backupnum = enroll_info_data.get('backupnum')
        if not isinstance(backupnum, int):
            raise ValidationError(f"backupnum must be integer, got {type(backupnum)}")
    
    return True


def validate_machine_command(command_data):
    """
    Validate a machine command before insertion.
    
    Args:
        command_data: Dictionary containing command data
        
    Raises:
        ValidationError: If validation fails
    """
    if not isinstance(command_data, dict):
        raise ValidationError("command_data must be a dictionary")
    
    # Validate serial
    if 'serial' not in command_data or not command_data['serial']:
        raise ValidationError("serial is required")
    
    if not isinstance(command_data['serial'], str):
        raise ValidationError(f"serial must be string, got {type(command_data['serial'])}")
    
    # Validate name
    if 'name' not in command_data or not command_data['name']:
        raise ValidationError("name is required")
    
    if not isinstance(command_data['name'], str):
        raise ValidationError(f"name must be string, got {type(command_data['name'])}")
    
    # Validate content
    if 'content' not in command_data or not command_data['content']:
        raise ValidationError("content is required")
    
    return True
