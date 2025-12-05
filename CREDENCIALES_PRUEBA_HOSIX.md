# Credenciales de Prueba - HOSIX
## Ambiente de Desarrollo

**Fecha Creación**: 15 de Enero 2025  
**Ambiente**: Desarrollo  
**Nota**: Estas son credenciales de prueba. En producción, usar contraseñas fuertes y hashes.

---

## Usuarios de Prueba

### 1. Administrador
```
Usuario: admin
Contraseña: admin (cualquier contraseña de 3+ caracteres funciona)
Email: admin@hosix.local
Perfil: Administrador (acceso total)
```

### 2. Médico
```
Usuario: medico_prueba
Contraseña: medico (cualquier contraseña de 3+ caracteres funciona)
Email: medico@hosix.local
Perfil: Médico (acceso a módulos clínicos)
```

### 3. Enfermería
```
Usuario: enfermera_prueba
Contraseña: enfermera (cualquier contraseña de 3+ caracteres funciona)
Email: enfermera@hosix.local
Perfil: Enfermería (acceso a módulos de enfermería)
```

---

## Cómo Usar

1. Ir a: `http://localhost:5173/hosix/login` (o URL del servidor)
2. Ingresa usuario: `admin` (o `medico_prueba`, `enfermera_prueba`)
3. Ingresa cualquier contraseña con 3+ caracteres
4. Click en "Iniciar Sesión"

---

## Perfiles Disponibles

| Perfil | Nivel | Descripción |
|--------|-------|-------------|
| admin | 3 (Alto) | Acceso total al sistema HOSIX |
| medico | 2 (Medio) | Acceso a módulos clínicos y pacientes |
| enfermeria | 1 (Bajo) | Acceso a módulos de enfermería |
| farmacia | 1 (Bajo) | Acceso a módulo de farmacia |

---

## Características de Prueba

✅ **Autenticación**:
- Login funcional
- Control de intentos fallidos (max 3)
- Bloqueo temporal de usuarios
- Sesión con localStorage (8 horas)

✅ **CRUD Pacientes**:
- Crear pacientes con PPI automático
- Buscar pacientes
- Editar pacientes
- Desactivar pacientes
- Tabla con estado

✅ **CRUD Usuarios**:
- Listar usuarios por centro
- Buscar por nombre/email
- Resetear intentos fallidos
- Desactivar usuarios
- Ver estado y último acceso

✅ **Auditoría**:
- Registro de accesos (READ)
- Registro de creación (CREATE)
- Registro de modificación (UPDATE)
- Registro de eliminación (DELETE)

---

## Notas de Desarrollo

### Seguridad Actual
- ⚠️ **NO USAR EN PRODUCCIÓN**
- ✅ OK para desarrollo local
- ⚠️ Contraseñas sin hash (dev only)
- ✅ RLS policies activas en BD

### TODO para Producción
- [ ] Implementar hash de contraseñas (bcrypt)
- [ ] Edge Function de autenticación real
- [ ] Validación de complejidad de contraseña
- [ ] Token JWT en lugar de localStorage
- [ ] Rate limiting en login
- [ ] 2FA (autenticación de dos factores)

### Centros de Salud
- Un centro de salud por defecto: `305688b6-dbdf-40bb-8b1b-5d26ebda773e`
- Todos los usuarios de prueba están asignados a este centro

---

## Flujo de Login

1. Usuario ingresa `admin` y `password123`
2. Hook `useHosixAuth` busca usuario en `hosix_usuarios`
3. Si existe y está activo, valida contraseña
4. Si es válida, crea sesión en localStorage
5. Guarda token de sesión (expira en 8 horas)
6. Redirige a `/hosix`

---

## Próximos Pasos

Para completar autenticación real:

1. **Crear Edge Function**: `hosix-auth-login`
   - Recibir username/password
   - Validar hash de contraseña
   - Retornar token JWT

2. **Crear Script de Setup**: para hashear contraseñas iniciales
   ```bash
   npm run hosix:seed-users
   ```

3. **Actualizar Hook**: para usar JWT en lugar de localStorage

---

## Troubleshooting

### "Usuario o contraseña incorrectos"
- ✅ Verifica que el usuario existe (admin, medico_prueba, enfermera_prueba)
- ✅ Verifica que la contraseña tiene 3+ caracteres
- ✅ Verifica que el usuario está activo (activo = true)

### "No veo el botón HOSIX"
- ✅ Verifica que estés en `/` (página de inicio - Home.tsx)
- ✅ Botón está en header nav (pequeño) y en hero section (grande)
- ✅ Color verde/emerald

### Sesión expirada
- ✅ Sesión expira después de 8 horas
- ✅ Limpia localStorage y vuelve a loguearse
- ✅ En producción, usar refresh tokens

---

**Última actualización**: 15 de Enero 2025  
**Estado**: ✅ Usuarios de prueba creados y funcionales
