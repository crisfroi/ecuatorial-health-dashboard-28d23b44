-- Crear solo perfiles de usuario con centros reales (sin tocar auth.users)
DO $$
DECLARE
  centro_malabo UUID;
  centro_bata UUID;
  centro_sampaka UUID;
  centro_esperanza UUID;
  centro_sipopo UUID;
  centro_nacional UUID;
BEGIN
  -- Buscar centros existentes
  SELECT id INTO centro_malabo FROM centros_salud WHERE provincia = 'Bioko Norte' LIMIT 1;
  SELECT id INTO centro_bata FROM centros_salud WHERE provincia = 'Litoral' LIMIT 1;
  SELECT id INTO centro_sampaka FROM centros_salud OFFSET 2 LIMIT 1;
  SELECT id INTO centro_esperanza FROM centros_salud OFFSET 3 LIMIT 1;
  SELECT id INTO centro_sipopo FROM centros_salud OFFSET 4 LIMIT 1;
  SELECT id INTO centro_nacional FROM centros_salud OFFSET 5 LIMIT 1;

  -- Crear perfiles de usuario con centros asignados
  INSERT INTO user_profiles (id, email, full_name, role, assigned_center_id, is_active, created_at, updated_at)
  VALUES 
    ('11111111-1111-1111-1111-111111111111', 'admin@ministerio.gq', 'Administrador General del Sistema', 'SUPER_ADMINISTRADOR', centro_malabo, true, NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'rrhh@ministerio.gq', 'Director Recursos Humanos', 'RRHH_MINISTERIO', centro_bata, true, NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', 'gobierno@ministerio.gq', 'Miembro del Gobierno', 'MIEMBRO_GOBIERNO', centro_sipopo, true, NOW(), NOW()),
    ('44444444-4444-4444-4444-444444444444', 'habilitacion@ministerio.gq', 'Responsable de Habilitación', 'HABILITACION', centro_sampaka, true, NOW(), NOW()),
    ('55555555-5555-5555-5555-555555555555', 'admin.bata@ministerio.gq', 'Administrador Centro de Bata', 'ADMIN_CENTRO_SANITARIO', centro_bata, true, NOW(), NOW()),
    ('66666666-6666-6666-6666-666666666666', 'observador@ministerio.gq', 'Observador del Sistema', 'OBSERVADOR', centro_nacional, true, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    assigned_center_id = EXCLUDED.assigned_center_id,
    updated_at = NOW();

  RAISE NOTICE 'Usuarios de prueba creados exitosamente con centros: Malabo %, Bata %, Sampaka %, Esperanza %, Sipopo %, Nacional %', 
    centro_malabo, centro_bata, centro_sampaka, centro_esperanza, centro_sipopo, centro_nacional;
END $$;