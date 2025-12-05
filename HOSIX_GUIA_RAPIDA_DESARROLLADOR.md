# HOSIX - Guía Rápida para Desarrolladores
## Referencia Rápida: Cómo Implementar con Supabase

> **Versión**: 1.0  
> **Fecha**: 2025-02-05  
> **Para**: Desarrolladores trabajando en HOSIX

---

## 🚀 QUICK START

### 1. Crear Edge Function

```bash
# Crear nueva Edge Function
supabase functions new mi-funcion

# Desplegar
supabase functions deploy mi-funcion

# Probar localmente
supabase functions serve mi-funcion
```

### 2. Estructura de Edge Function

```typescript
// supabase/functions/mi-funcion/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // 1. Autenticación
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await supabase.auth.getUser(token)
  
  // 2. Lógica de negocio
  const { data } = await supabase.from('mi_tabla').select('*')
  
  // 3. Retornar respuesta
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

---

## 📚 PATRONES COMUNES

### Patrón 1: CRUD Completo

```typescript
serve(async (req) => {
  const { method } = req
  const url = new URL(req.url)
  const id = url.pathname.split('/').pop()
  
  const supabase = createClient(...)
  
  switch (method) {
    case 'GET':
      if (id) {
        // GET /resource/:id
        const { data } = await supabase
          .from('mi_tabla')
          .select('*')
          .eq('id', id)
          .single()
        return jsonResponse(data)
      } else {
        // GET /resource
        const { data } = await supabase.from('mi_tabla').select('*')
        return jsonResponse(data)
      }
    
    case 'POST':
      // POST /resource
      const body = await req.json()
      const { data } = await supabase
        .from('mi_tabla')
        .insert(body)
        .select()
        .single()
      return jsonResponse(data, 201)
    
    case 'PUT':
      // PUT /resource/:id
      const updateBody = await req.json()
      const { data: updated } = await supabase
        .from('mi_tabla')
        .update(updateBody)
        .eq('id', id)
        .select()
        .single()
      return jsonResponse(updated)
    
    case 'DELETE':
      // DELETE /resource/:id
      await supabase.from('mi_tabla').delete().eq('id', id)
      return jsonResponse({ success: true })
  }
})

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}
```

### Patrón 2: Rate Limiting

```typescript
async function checkRateLimit(userId: string, supabase: any): Promise<boolean> {
  const windowStart = new Date(Math.floor(Date.now() / 60000) * 60000)
  
  const { data: rateLimit } = await supabase
    .from('hosix_rate_limits')
    .select('count')
    .eq('user_id', userId)
    .eq('window_start', windowStart.toISOString())
    .single()
  
  if (rateLimit && rateLimit.count >= 100) {
    return false // Rate limit exceeded
  }
  
  // Incrementar
  await supabase.rpc('increment_rate_limit', {
    p_user_id: userId,
    p_window_start: windowStart.toISOString()
  })
  
  return true
}
```

### Patrón 3: Event Emitter (Realtime)

```typescript
// Emitir evento
await supabase.channel('mi-canal').send({
  type: 'broadcast',
  event: 'mi_evento',
  payload: { data: '...' }
})

// Suscribirse (Frontend)
const channel = supabase.channel('mi-canal')
  .on('broadcast', { event: 'mi_evento' }, (payload) => {
    console.log('Evento recibido:', payload.payload)
  })
  .subscribe()
```

### Patrón 4: Database Function Call

```typescript
// Llamar función de BD
const { data, error } = await supabase.rpc('mi_funcion', {
  p_param1: 'valor1',
  p_param2: 123
})
```

---

## 🔧 UTILIDADES COMUNES

### Helper: Validar Autenticación

```typescript
async function validateAuth(req: Request): Promise<{ user: any; supabase: any } | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return null
  }
  
  return { user, supabase }
}
```

### Helper: Manejo de Errores

```typescript
function errorResponse(message: string, status: number = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

// Uso
try {
  // código
} catch (error) {
  console.error('Error:', error)
  return errorResponse(error.message, 500)
}
```

### Helper: CORS Headers

```typescript
function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type'
  }
}

// En respuesta
return new Response(JSON.stringify(data), {
  headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
})
```

---

## 🗄️ DATABASE FUNCTIONS ÚTILES

### Función: Rate Limiting

```sql
CREATE OR REPLACE FUNCTION increment_rate_limit(
  p_user_id UUID,
  p_window_start TIMESTAMPTZ
) RETURNS void AS $$
BEGIN
  INSERT INTO hosix_rate_limits (user_id, window_start, count)
  VALUES (p_user_id, p_window_start, 1)
  ON CONFLICT (user_id, window_start)
  DO UPDATE SET count = hosix_rate_limits.count + 1;
END;
$$ LANGUAGE plpgsql;
```

### Función: Validar Permisos

```sql
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id UUID,
  p_resource VARCHAR,
  p_action VARCHAR
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM hosix_permisos
    WHERE usuario_id = p_user_id
    AND recurso = p_resource
    AND accion = p_action
    AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$ LANGUAGE plpgsql;
```

### Función: Auditoría Automática

```sql
CREATE OR REPLACE FUNCTION audit_log(
  p_user_id UUID,
  p_accion VARCHAR,
  p_tabla VARCHAR,
  p_registro_id UUID,
  p_datos_anteriores JSONB,
  p_datos_nuevos JSONB
) RETURNS void AS $$
DECLARE
  v_hash_anterior VARCHAR(64);
  v_hash_nuevo VARCHAR(64);
BEGIN
  -- Obtener hash anterior
  SELECT hash_contenido INTO v_hash_anterior
  FROM hosix_auditoria_immutable
  ORDER BY id DESC
  LIMIT 1;
  
  -- Calcular hash nuevo
  v_hash_nuevo := encode(
    digest(
      p_user_id::TEXT || p_accion || p_datos_nuevos::TEXT || now()::TEXT,
      'sha256'
    ),
    'hex'
  );
  
  -- Insertar
  INSERT INTO hosix_auditoria_immutable (
    user_id, accion, tabla_afectada, registro_id,
    datos_anteriores, datos_nuevos,
    hash_contenido, hash_anterior
  ) VALUES (
    p_user_id, p_accion, p_tabla, p_registro_id,
    p_datos_anteriores, p_datos_nuevos,
    v_hash_nuevo, v_hash_anterior
  );
END;
$$ LANGUAGE plpgsql;
```

---

## 📡 INTEGRACIONES EXTERNAS

### Twilio (SMS)

```typescript
async function sendSMS(to: string, message: string): Promise<void> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')!
  const fromPhone = Deno.env.get('TWILIO_PHONE')!
  
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        From: fromPhone,
        To: to,
        Body: message
      })
    }
  )
  
  if (!response.ok) {
    throw new Error('Failed to send SMS')
  }
}
```

### SendGrid (Email)

```typescript
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = Deno.env.get('SENDGRID_API_KEY')!
  
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }], subject }],
      from: { email: 'noreply@hosix.health' },
      content: [{ type: 'text/html', value: html }]
    })
  })
  
  if (!response.ok) {
    throw new Error('Failed to send email')
  }
}
```

---

## 🧪 TESTING

### Test de Edge Function Local

```typescript
// tests/mi-funcion.test.ts
import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts'

Deno.test('Mi función - Test básico', async () => {
  const response = await fetch('http://localhost:54321/functions/v1/mi-funcion', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`
    }
  })
  
  const data = await response.json()
  assertEquals(response.status, 200)
  assertEquals(Array.isArray(data), true)
})
```

---

## 📖 RECURSOS

### Documentación Supabase
- Edge Functions: https://supabase.com/docs/guides/functions
- Realtime: https://supabase.com/docs/guides/realtime
- Database Functions: https://supabase.com/docs/guides/database/functions

### Librerías Útiles
- Deno std: https://deno.land/std
- Supabase JS: https://supabase.com/docs/reference/javascript

---

**Última Actualización**: 2025-02-05

