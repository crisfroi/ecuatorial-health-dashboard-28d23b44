# Flask SDK Biometric Integration - Route Configuration

## Problem Identified

The edge function `sync-biometric-device` was trying to call incorrect endpoint routes that Flask doesn't expose:

```
❌ INCORRECT: /api/device, /api/records, /api/emps (attempted by edge function v10-11)
✅ CORRECT: /device, /records, /emps (what Flask actually exposes)
```

## Flask Endpoints (FlaskProject/app.py)

### 1. Get Devices
```python
@app.route('/device', methods=['GET'])
def get_all_device():
    device_list = get_all_devices()
    device_list = [device.to_dict() for device in device_list]
    return jsons.dump(Msg.success().add("device", device_list))
```
**URL**: `GET https://flaskproject-zg72.onrender.com/device`
**Response**: `{ "success": true, "device": [...] }`

### 2. Get Employees/Persons
```python
@app.route('/emps', methods=['GET'])
def get_all_person_from_db():
    pn = request.args.get('pn', default=1, type=int)
    person_list = select_all()
    # ... process people and enroll info
    return jsons.dump(Msg.success().add("pageInfo", page))
```
**URL**: `GET https://flaskproject-zg72.onrender.com/emps?pn=1`
**Response**: `{ "success": true, "pageInfo": {...} }`

### 3. Get Records/Attendance Logs
```python
@app.route('/records', methods=['GET'])
def get_all_log_from_db():
    pn = request.args.get('pn', default=1, type=int)
    records = select_all_records()
    records = [record.to_dict() for record in records]
    pageInfo = PageInfo(records, 5)
    return jsons.dump(Msg.success().add("pageInfo", pageInfo))
```
**URL**: `GET https://flaskproject-zg72.onrender.com/records?pn=1`
**Response**: `{ "success": true, "pageInfo": {...} }`

## Edge Function Fix (Version 12)

Updated `supabase/functions/sync-biometric-device/index.ts`:

### Before (v10-11)
```typescript
// ❌ WRONG - calling /api/X endpoints
const fullUrl = `${deviceUrl}/api/${endpoint}`;
// Calling: /api/device, /api/record, /api/emps
```

### After (v12)
```typescript
// ✅ CORRECT - calling /X endpoints
const fullUrl = `${deviceUrl}/${endpoint}`;
// Now calling: /device, /records, /emps
```

### Endpoint Mapping in Edge Function
```typescript
case "get-devices": 
  // calls: https://flaskproject-zg72.onrender.com/device

case "get-records": 
  // calls: https://flaskproject-zg72.onrender.com/records

case "get-status": 
  // calls: https://flaskproject-zg72.onrender.com/device
```

## WebSocket API (Also Available)

Flask also exposes a WebSocket API at:
```
ws://https://flaskproject-zg72.onrender.com/pub/chat
```

This handles real-time commands for devices (WebSocket protocol, not HTTP REST).

## Testing the Integration

### 1. Test if Flask endpoints are accessible
```bash
# Get devices
curl "https://flaskproject-zg72.onrender.com/device"

# Get employees
curl "https://flaskproject-zg72.onrender.com/emps?pn=1"

# Get records
curl "https://flaskproject-zg72.onrender.com/records?pn=1"
```

### 2. Test edge function from Supabase
```javascript
// From dashboard or function editor
const { data, error } = await supabase.functions.invoke('sync-biometric-device', {
  body: {
    deviceUrl: 'https://flaskproject-zg72.onrender.com',
    deviceSn: 'AYTE09049036',  // Your device serial
    action: 'get-devices'
  }
});
```

## What's Fixed

✅ Edge function version 12 deployed
✅ Correct endpoint routes: `/device`, `/records`, `/emps`
✅ Proper error handling for missing Flask responses
✅ Consistent data normalization (`en_no` sanitization)
✅ Proper UUID type handling for `id_dispositivo`

## Known Issues (If Any)

If you still see errors:

1. **404 on /device, /emps, /records**
   - Ensure Flask is running on Render
   - Check that the URL is correct in biometric sync component
   - Look at Flask logs on Render console

2. **500 error from Flask**
   - Check Flask app.log on Render
   - May be database connection issues
   - Verify DATABASE_URL environment variable is set

3. **Data not syncing after fix**
   - Ensure `dispositivos` table has an entry with matching device name
   - Check `attendance_logs` table for inserted records
   - Verify RLS policies allow insert operations

## Configuration in React Component

When calling from the UI (e.g., AsistenciaBiometrica.tsx), ensure:

```typescript
const deviceUrl = 'https://flaskproject-zg72.onrender.com';

const response = await supabase.functions.invoke('sync-biometric-device', {
  body: {
    deviceUrl: deviceUrl,        // REQUIRED - Flask SDK URL
    deviceSn: 'AYTE09049036',    // OPTIONAL - Device serial number
    action: 'sync'               // sync | get-devices | get-records | get-status
  }
});
```

## Architecture Overview

```
┌─────────────────────────────────────┐
│  React Dashboard (Asistencia Tab)   │
│  useBiometricSync hook              │
└──────────────┬──────────────────────┘
               │
               ▼
       ┌───────────────────────┐
       │  Supabase Edge Func   │
       │  sync-biometric-      │
       │  device (v12)         │
       └───────────┬───────────┘
               │
               ├─► GET /device (list devices)
               ├─► GET /records (get attendance logs)
               └─► GET /emps (get employees)
               │
               ▼
       ┌───────────────────────┐
       │  Flask SDK on Render  │
       │  flaskproject-zg72    │
       │  PostgreSQL Database  │
       └───────────────────────┘
```

## Next Steps

1. Test the edge function with correct endpoints
2. Verify Flask is responding to GET requests on `/device`, `/records`, `/emps`
3. Monitor biometric data sync in `attendance_logs` table
4. Check employee mapping in `empleado_dispositivo_map` table
