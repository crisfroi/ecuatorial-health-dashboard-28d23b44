# REPORTE DE MIGRACIONES HOSIX

**Fecha**: 12/6/2025, 2:47:57 PM
**URL Supabase**: https://wdieynendfjbkbhfovrx.supabase.co

## 📊 Resumen

- **Total de migraciones**: 44
- **Aplicadas**: 11 (25.0%)
- **Pendientes**: 33 (75.0%)
- **Cobertura de tablas**: 0.0%
- **Tablas aplicadas**: 0/136

## ✅ Migraciones Aplicadas

### 20250122_012_hosix_servicios_tipos_ingreso.sql
- Tablas: 
- Funciones: 0
- Triggers: 0

### 20250720022455_scarlet_wildflower.sql
- Tablas: 
- Funciones: 0
- Triggers: 0

### 20250903133632_e71b88bc-8176-4036-bf62-c209a8880981.sql
- Tablas: 
- Funciones: 1
- Triggers: 0

### 20250905081530_2cb3ea70-ad51-4ac8-83fd-a53de15374ff.sql
- Tablas: 
- Funciones: 0
- Triggers: 0

### 20250906065310_fb428f0d-a4ca-4f3e-bbd1-a98b2916c0d9.sql
- Tablas: 
- Funciones: 0
- Triggers: 0

### 20251008130000_incidents_expediente_trigger.sql
- Tablas: 
- Funciones: 1
- Triggers: 1

### 20251010140000_profesionales_rfid.sql
- Tablas: 
- Funciones: 0
- Triggers: 0

### 20251018_add_unemployment_fields_profesionales.sql
- Tablas: 
- Funciones: 0
- Triggers: 0

### 20251101025757_ddb02cc9-0eed-4c0d-912d-6feb9d1e7115.sql
- Tablas: 
- Funciones: 0
- Triggers: 0

### 20251104222158_a6323071-1bfe-46af-8500-26091ed93735.sql
- Tablas: 
- Funciones: 0
- Triggers: 0

### 20251104222240_847e3cf6-2cd7-4e52-99a2-416d6ab50bcb.sql
- Tablas: 
- Funciones: 1
- Triggers: 1

## ⚠️ Migraciones Pendientes

### 20240101000000_create_biometric_sync_logs.sql
- Tablas faltantes: biometric_sync_logs

### 20241201_dynamic_forms.sql
- Tablas faltantes: dynamic_forms, form_submissions, professional_indicators, professional_indicator_values
- Funciones faltantes: update_updated_at_column, increment_form_submissions_count
- Triggers faltantes: update_dynamic_forms_updated_at, update_professional_indicators_updated_at, update_professional_indicator_values_updated_at, increment_form_submissions_count_trigger

### 20250116_001_hosix_base_schema.sql
- Tablas faltantes: hosix_departamentos, hosix_servicios, hosix_perfiles, hosix_usuarios, hosix_permisos_modulos, hosix_sesiones, hosix_auditoria

### 20250116_002_hosix_pacientes_historia_clinica.sql
- Tablas faltantes: hosix_pacientes, hosix_historia_clinica, hosix_pacientes_contactos, hosix_pacientes_avisos, hosix_pacientes_documentos

### 20250116_003_hosix_urgencias_citas_agendas.sql
- Tablas faltantes: hosix_urgencias_episodios, hosix_urgencias_triage, hosix_agendas, hosix_agendas_horarios, hosix_citas

### 20250116_004_hosix_hospitalizacion_quirofanos_farmacia.sql
- Tablas faltantes: hosix_camas, hosix_hospitalizacion_episodios, hosix_hospitalizacion_traslados, hosix_quirofanos, hosix_quirofanos_intervenciones, hosix_medicamentos, hosix_prescripciones, hosix_dispensaciones

### 20250116_005_hosix_facturacion_reportes.sql
- Tablas faltantes: hosix_aseguradoras, hosix_tarifas, hosix_facturacion_cuentas, hosix_facturacion_conceptos, hosix_facturas, hosix_facturas_lineas, hosix_cajas_movimientos, hosix_stock_medicamentos, hosix_stock_movimientos, hosix_kpis_reportes

### 20250121_006_hosix_cajas_completo.sql
- Tablas faltantes: hosix_cajas, hosix_cajas_turnos, hosix_cajas_formas_pago, hosix_cajas_cierres, hosix_cajas_arqueos

### 20250121_007_hosix_recobros.sql
- Tablas faltantes: hosix_recobros, hosix_recobros_notas_cargo, hosix_recobros_notas_credito, hosix_recobros_solicitudes, hosix_recobros_morosidad

### 20250121_008_hosix_suministros.sql
- Tablas faltantes: hosix_articulos_familias, hosix_articulos_grupos, hosix_articulos_unidades_dosis, hosix_articulos_ubicaciones, hosix_articulos_unidades_compra, hosix_articulos_unidades_dispensacion, hosix_articulos, hosix_articulos_tipos_envase, hosix_articulos_control_envase

### 20250122_009_hosix_almacenes.sql
- Tablas faltantes: hosix_almacenes, hosix_almacenes_depositos, hosix_stock, hosix_stock_lotes, hosix_stock_movimientos, hosix_ordenes_compra, hosix_ordenes_compra_lineas, hosix_inventarios, hosix_inventarios_lineas, hosix_centros_coste

### 20250122_011_hosix_cpoe_prescripciones.sql
- Tablas faltantes: hosix_cpoe_prescripciones

### 20250205_010_hosix_enfermeria.sql
- Tablas faltantes: hosix_enfermeria_worklist, hosix_enfermeria_constantes, hosix_enfermeria_evaluaciones, hosix_enfermeria_planes, hosix_enfermeria_kardex, hosix_enfermeria_balance_hidrico, hosix_enfermeria_diario
- Funciones faltantes: calcular_imc, calcular_balance_hidrico
- Triggers faltantes: trigger_calcular_imc, trigger_calcular_balance_hidrico

### 20250205_011_hosix_medicos.sql
- Tablas faltantes: hosix_medicos_worklist, hosix_diagnosticos, hosix_tratamientos, hosix_interconsultas, hosix_consultas_medicas, hosix_cuestionarios, hosix_mapas_dentales

### 20250205_012_hosix_drug_interactions.sql
- Tablas faltantes: hosix_drug_interactions
- Funciones faltantes: buscar_interacciones_medicamento

### 20250206_011_hosix_medicos_asis_1.sql
- Tablas faltantes: hosix_diagnosticos_catalogo, hosix_ordenes_medicas, hosix_diagnosticos_pacientes, hosix_consultas_medicas, hosix_diario_clinico_medico
- Funciones faltantes: obtener_diagnosticos_activos, registrar_diagnostico_paciente

### 20250206_013_hosix_quirofanos_asis_3.sql
- Tablas faltantes: hosix_quirofanos_bloques, hosix_quirofanos_salas, hosix_quirofanos_equipos, hosix_quirofanos_programaciones, hosix_quirofanos_diario, hosix_quirofanos_mantenimiento, hosix_quirofanos_preferencias_cirujano

### 20250206_014_hosix_interconsultas_asis_11.sql
- Tablas faltantes: hosix_interconsultas_especialidades, hosix_interconsultas, hosix_interconsultas_respuestas, hosix_interconsultas_seguimiento, hosix_interconsultas_referrals, hosix_interconsultas_comunicaciones
- Funciones faltantes: generar_numero_interconsulta, trigger_generar_numero_interconsulta, trigger_actualizar_estado_interconsulta
- Triggers faltantes: trigger_numero_interconsulta, trigger_actualizar_estado_al_responder

### 20250801014549_710b4907-6179-4a93-b218-f9284ef1b675.sql
- Tablas faltantes: carnets_generados
- Funciones faltantes: trigger_generar_carnet_automatico, marcar_carnet_generado
- Triggers faltantes: tr_generar_carnet_automatico

### 20250905081352_6054a222-ae86-405b-a8e8-3c06d21b37c0.sql
- Tablas faltantes: solicitudes_traslado, permisos_pestanas

### 20250905081414_099c180e-5289-45ce-a313-b73022245449.sql
- Tablas faltantes: solicitudes_traslado, permisos_pestanas

### 20250905081436_5ba1951b-ae90-4a80-8422-824c9fad55ab.sql
- Tablas faltantes: solicitudes_traslado, permisos_pestanas

### 20250905081458_bd433cd8-d002-483a-9431-4e07c69e02ba.sql
- Tablas faltantes: solicitudes_traslado, permisos_pestanas

### 20250906065243_5f40dd52-6597-42ab-9871-b8a15fcd383e.sql
- Tablas faltantes: solicitudes_establecimientos
- Funciones faltantes: update_solicitudes_establecimientos_updated_at
- Triggers faltantes: update_solicitudes_establecimientos_updated_at

### 20250907093350_06169961-eb0d-4b8f-9ed8-347a588869ac.sql
- Tablas faltantes: solicitudes_establecimientos
- Funciones faltantes: generar_numero_solicitud_establecimiento, generar_numero_registro_establecimiento, generar_numero_registro_centro
- Triggers faltantes: trigger_generar_numero_solicitud_establecimiento, trigger_generar_numero_registro_establecimiento, trigger_generar_numero_registro_centro, update_solicitudes_establecimientos_updated_at

### 20250909000000_attendance_module.sql
- Tablas faltantes: dispositivos, empleado_dispositivo_map, attendance_logs
- Funciones faltantes: set_updated_at
- Triggers faltantes: dispositivos_set_updated_at, emp_map_set_updated_at

### 20250909001000_turnos_cuadrantes_bio.sql
- Tablas faltantes: turnos_biometricos, cuadrantes_biometricos
- Funciones faltantes: set_updated_at
- Triggers faltantes: turnos_set_updated_at, cuadrantes_set_updated_at

### 20251006184814_9cec188a-ee5b-48e2-9e3b-8973cac07c65.sql
- Tablas faltantes: parametros_profesionales, valores_parametros_profesionales
- Funciones faltantes: actualizar_updated_at_parametros
- Triggers faltantes: trigger_actualizar_parametros, trigger_actualizar_valores_parametros

### 20251008120000_disciplinary_expedientes.sql
- Tablas faltantes: expedientes_disciplinarios, historial_acciones_expediente

### 20251008133000_disciplinary_extensions.sql
- Tablas faltantes: faltas_catalogo, sanciones_catalogo

### 20251017120000_area_profesional_fk.sql
- Tablas faltantes: areas_profesionales
- Funciones faltantes: set_updated_at, sync_area_profesional_text, try_link_area_profesional_id
- Triggers faltantes: trg_areas_profesionales_updated_at, trg_profesionales_sync_area_text, trg_profesionales_try_link_area

### 20251103064457_1064b1fa-f968-4b12-bcde-4677bfed3d8f.sql
- Tablas faltantes: device, person, enroll_info, record, machine_command, access_day, access_week, lock_group, user_lock
- Funciones faltantes: update_device_updated_at
- Triggers faltantes: device_updated_at_trigger

### 20251105011927_e2dcdf27-0846-4b4d-89c2-91290deef071.sql
- Tablas faltantes: comandos_biometricos
- Funciones faltantes: limpiar_comandos_antiguos

## ❌ Tablas Faltantes

- biometric_sync_logs
- dynamic_forms
- form_submissions
- professional_indicators
- professional_indicator_values
- hosix_departamentos
- hosix_servicios
- hosix_perfiles
- hosix_usuarios
- hosix_permisos_modulos
- hosix_sesiones
- hosix_auditoria
- hosix_pacientes
- hosix_historia_clinica
- hosix_pacientes_contactos
- hosix_pacientes_avisos
- hosix_pacientes_documentos
- hosix_urgencias_episodios
- hosix_urgencias_triage
- hosix_agendas
- hosix_agendas_horarios
- hosix_citas
- hosix_camas
- hosix_hospitalizacion_episodios
- hosix_hospitalizacion_traslados
- hosix_quirofanos
- hosix_quirofanos_intervenciones
- hosix_medicamentos
- hosix_prescripciones
- hosix_dispensaciones
- hosix_aseguradoras
- hosix_tarifas
- hosix_facturacion_cuentas
- hosix_facturacion_conceptos
- hosix_facturas
- hosix_facturas_lineas
- hosix_cajas_movimientos
- hosix_stock_medicamentos
- hosix_stock_movimientos
- hosix_kpis_reportes
- hosix_cajas
- hosix_cajas_turnos
- hosix_cajas_formas_pago
- hosix_cajas_cierres
- hosix_cajas_arqueos
- hosix_recobros
- hosix_recobros_notas_cargo
- hosix_recobros_notas_credito
- hosix_recobros_solicitudes
- hosix_recobros_morosidad
- hosix_articulos_familias
- hosix_articulos_grupos
- hosix_articulos_unidades_dosis
- hosix_articulos_ubicaciones
- hosix_articulos_unidades_compra
- hosix_articulos_unidades_dispensacion
- hosix_articulos
- hosix_articulos_tipos_envase
- hosix_articulos_control_envase
- hosix_almacenes
- hosix_almacenes_depositos
- hosix_stock
- hosix_stock_lotes
- hosix_ordenes_compra
- hosix_ordenes_compra_lineas
- hosix_inventarios
- hosix_inventarios_lineas
- hosix_centros_coste
- hosix_cpoe_prescripciones
- hosix_enfermeria_worklist
- hosix_enfermeria_constantes
- hosix_enfermeria_evaluaciones
- hosix_enfermeria_planes
- hosix_enfermeria_kardex
- hosix_enfermeria_balance_hidrico
- hosix_enfermeria_diario
- hosix_medicos_worklist
- hosix_diagnosticos
- hosix_tratamientos
- hosix_interconsultas
- hosix_consultas_medicas
- hosix_cuestionarios
- hosix_mapas_dentales
- hosix_drug_interactions
- hosix_diagnosticos_catalogo
- hosix_ordenes_medicas
- hosix_diagnosticos_pacientes
- hosix_diario_clinico_medico
- hosix_quirofanos_bloques
- hosix_quirofanos_salas
- hosix_quirofanos_equipos
- hosix_quirofanos_programaciones
- hosix_quirofanos_diario
- hosix_quirofanos_mantenimiento
- hosix_quirofanos_preferencias_cirujano
- hosix_interconsultas_especialidades
- hosix_interconsultas_respuestas
- hosix_interconsultas_seguimiento
- hosix_interconsultas_referrals
- hosix_interconsultas_comunicaciones
- carnets_generados
- solicitudes_traslado
- permisos_pestanas
- solicitudes_establecimientos
- dispositivos
- empleado_dispositivo_map
- attendance_logs
- turnos_biometricos
- cuadrantes_biometricos
- parametros_profesionales
- valores_parametros_profesionales
- expedientes_disciplinarios
- historial_acciones_expediente
- faltas_catalogo
- sanciones_catalogo
- areas_profesionales
- device
- person
- enroll_info
- record
- machine_command
- access_day
- access_week
- lock_group
- user_lock
- comandos_biometricos

## 📝 Recomendaciones

1. Aplicar las migraciones pendientes:
   ```bash
   npm run apply-migrations:mcp
   ```
2. O ejecutar el script SQL generado en Supabase Dashboard
