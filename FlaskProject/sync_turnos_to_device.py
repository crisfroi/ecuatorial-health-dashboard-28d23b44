"""
Módulo de sincronización de turnos desde Supabase al dispositivo biométrico.

Este módulo se encarga de:
1. Leer turnos maestros desde Supabase (turnos_maestros)
2. Construir estructura setdevlock para el protocolo WebSocket
3. Enviar comandos al dispositivo vía SendOrderJob

El proceso se ejecuta periódicamente (cada 10 minutos) vía APScheduler.
"""

import json
import traceback
from typing import Optional, Dict, List, Any
from datetime import datetime
from Helpers.log_conf import Logger

logger = Logger()


def construir_comando_setdevlock(turnos: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Construye la estructura setdevlock a partir de turnos maestros.

    Args:
        turnos: Lista de turnos con estructura:
            {
              'id': UUID,
              'nombre_turno': 'Mañana 08-16',
              'hora_inicio': '08:00:00',
              'hora_fin': '16:00:00',
              ...
            }

    Returns:
        Dict con estructura setdevlock:
        {
          "cmd": "setdevlock",
          "dayzone": [...],
          "weekzone": [...]
        }

    Ejemplo:
        Si hay 1 turno (08:00-16:00):
        {
          "cmd": "setdevlock",
          "dayzone": [
            {"day": [{"section": "08:00~16:00"}]}
          ],
          "weekzone": [
            {"week": [
              {"day": 1}, {"day": 1}, {"day": 1},
              {"day": 1}, {"day": 1}, {"day": 1},
              {"day": 1}
            ]}
          ]
        }
    """
    try:
        if not turnos:
            logger.warning("No hay turnos para construir comando setdevlock")
            return None

        # Construir dayzone
        # Cada turno es una sección horaria diferente
        dayzone = []
        for turno in turnos:
            hora_inicio = turno.get('hora_inicio', '08:00:00')[:5]  # "HH:MM"
            hora_fin = turno.get('hora_fin', '16:00:00')[:5]        # "HH:MM"
            
            # Validar formato de horas
            if not _validar_hora(hora_inicio) or not _validar_hora(hora_fin):
                logger.warning(f"Horas inválidas: {hora_inicio}~{hora_fin}")
                continue

            dayzone.append({
                "day": [
                    {"section": f"{hora_inicio}~{hora_fin}"}
                ]
            })

        if not dayzone:
            logger.warning("No se pudieron construir dayzones válidos")
            return None

        # Construir weekzone
        # Mapear todos los días (lunes-domingo) al mismo dayzone[0]
        weekzone = [{
            "week": [
                {"day": 1} for _ in range(7)  # Todos los días usan dayzone[0]
            ]
        }]

        # Comando final
        comando = {
            "cmd": "setdevlock",
            "dayzone": dayzone,
            "weekzone": weekzone
        }

        logger.info(f"Comando setdevlock construido: {len(dayzone)} zona(s), {len(turnos)} turno(s)")
        return comando

    except Exception as e:
        logger.error(f"Error construyendo setdevlock: {e}\n{traceback.format_exc()}")
        return None


def _validar_hora(hora_str: str) -> bool:
    """
    Valida que una hora tenga formato correcto HH:MM.

    Args:
        hora_str: String de hora (ej: "08:00")

    Returns:
        True si es válido, False si no
    """
    try:
        parts = hora_str.split(':')
        if len(parts) != 2:
            return False
        
        hh = int(parts[0])
        mm = int(parts[1])
        
        return 0 <= hh <= 23 and 0 <= mm <= 59
    except (ValueError, AttributeError):
        return False


def obtener_turnos_para_dispositivo(supabase_client, dispositivo_id: str) -> Optional[List[Dict[str, Any]]]:
    """
    Obtiene los turnos maestros activos para un dispositivo específico.

    Args:
        supabase_client: Cliente Supabase
        dispositivo_id: UUID del dispositivo

    Returns:
        Lista de turnos o None si hay error
    """
    try:
        response = supabase_client.table('turnos_maestros') \
            .select('*') \
            .eq('dispositivo_id', dispositivo_id) \
            .eq('sync_a_dispositivo', True) \
            .eq('activo', True) \
            .order('hora_inicio', { 'ascending': True }) \
            .execute()

        if not response.data:
            logger.debug(f"No hay turnos activos para dispositivo: {dispositivo_id}")
            return []

        logger.info(f"✅ Obtenidos {len(response.data)} turnos para dispositivo")
        return response.data

    except Exception as e:
        logger.error(f"Error obteniendo turnos: {e}\n{traceback.format_exc()}")
        return None


def sync_turnos_a_dispositivo(
    supabase_client,
    device_sn: str,
    send_order_job=None
) -> bool:
    """
    Sincroniza turnos maestros al dispositivo vía WebSocket setdevlock.

    Flujo:
    1. Buscar dispositivo por SN en Supabase
    2. Obtener turnos maestros para ese dispositivo
    3. Construir comando setdevlock
    4. Enviar vía SendOrderJob (que envía por WebSocket)

    Args:
        supabase_client: Cliente Supabase configurado
        device_sn: Serial number del dispositivo (ej: "ZK001", "AYTE09049036")
        send_order_job: Instancia de SendOrderJob (opcional, se crea si no se proporciona)

    Returns:
        True si se sincronizó exitosamente, False si hubo error
    """
    try:
        logger.info(f"Iniciando sync de turnos para dispositivo: {device_sn}")

        # 1. Buscar dispositivo por SN
        dispositivo_response = supabase_client.table('dispositivos') \
            .select('id') \
            .eq('device_sn', device_sn) \
            .limit(1) \
            .execute()

        if not dispositivo_response.data:
            logger.warning(f"⚠️  Dispositivo no encontrado por SN: {device_sn}")
            return False

        dispositivo_id = dispositivo_response.data[0]['id']
        logger.debug(f"Dispositivo encontrado: {dispositivo_id}")

        # 2. Obtener turnos maestros
        turnos = obtener_turnos_para_dispositivo(supabase_client, dispositivo_id)
        
        if turnos is None:
            logger.error(f"❌ Error obtener turnos para: {device_sn}")
            return False

        if not turnos:
            logger.info(f"ℹ️  Sin turnos activos para sincronizar: {device_sn}")
            return True  # No es error, simplemente no hay nada que sincronizar

        # 3. Construir comando setdevlock
        comando = construir_comando_setdevlock(turnos)
        
        if not comando:
            logger.error(f"❌ Error construyendo comando para: {device_sn}")
            return False

        # 4. Enviar al dispositivo
        if send_order_job is None:
            # Importar aquí para evitar circular imports
            try:
                from job.SendOrderJob import SendOrderJob
                send_order_job = SendOrderJob()
            except Exception as e:
                logger.error(f"Error inicializando SendOrderJob: {e}")
                return False

        # SendOrderJob.send_command_to_device espera:
        # - device_sn: string
        # - command: dict (será convertido a JSON)
        success = send_order_job.send_command_to_device(device_sn, comando)

        if success:
            logger.info(f"✅ Turnos sincronizados exitosamente a: {device_sn}")
            return True
        else:
            logger.error(f"❌ Error enviando comando al dispositivo: {device_sn}")
            return False

    except Exception as e:
        logger.error(f"Error en sync_turnos_a_dispositivo: {e}\n{traceback.format_exc()}")
        return False


def sync_turnos_a_todos_dispositivos(supabase_client, send_order_job=None) -> Dict[str, Any]:
    """
    Sincroniza turnos a TODOS los dispositivos activos.

    Se ejecuta periódicamente vía APScheduler (cada 10 minutos).

    Args:
        supabase_client: Cliente Supabase
        send_order_job: Instancia de SendOrderJob (opcional)

    Returns:
        Dict con estadísticas:
        {
          'total_dispositivos': int,
          'sincronizados': int,
          'errores': int,
          'timestamp': str
        }
    """
    try:
        logger.info("=" * 60)
        logger.info("🔄 SYNC PERIÓDICO DE TURNOS INICIADO")
        logger.info("=" * 60)

        # Obtener todos los dispositivos activos
        dispositivos_response = supabase_client.table('dispositivos') \
            .select('device_sn') \
            .eq('activo', True) \
            .execute()

        if not dispositivos_response.data:
            logger.info("ℹ️  No hay dispositivos activos")
            return {
                'total_dispositivos': 0,
                'sincronizados': 0,
                'errores': 0,
                'timestamp': datetime.now().isoformat()
            }

        dispositivos = dispositivos_response.data
        sincronizados = 0
        errores = 0

        for dispositivo in dispositivos:
            device_sn = dispositivo['device_sn']
            
            try:
                if sync_turnos_a_dispositivo(supabase_client, device_sn, send_order_job):
                    sincronizados += 1
                else:
                    errores += 1
            except Exception as e:
                logger.error(f"Error en sync para {device_sn}: {e}")
                errores += 1

        # Resumen
        resultado = {
            'total_dispositivos': len(dispositivos),
            'sincronizados': sincronizados,
            'errores': errores,
            'timestamp': datetime.now().isoformat()
        }

        logger.info("=" * 60)
        logger.info(f"📊 RESUMEN SYNC:")
        logger.info(f"   Total dispositivos: {resultado['total_dispositivos']}")
        logger.info(f"   ✅ Sincronizados: {sincronizados}")
        logger.info(f"   ❌ Errores: {errores}")
        logger.info(f"   ⏰ Timestamp: {resultado['timestamp']}")
        logger.info("=" * 60)

        return resultado

    except Exception as e:
        logger.error(f"Error en sync_turnos_a_todos_dispositivos: {e}\n{traceback.format_exc()}")
        return {
            'total_dispositivos': 0,
            'sincronizados': 0,
            'errores': 1,
            'timestamp': datetime.now().isoformat()
        }


# ================================================================
# TESTING / DEBUG
# ================================================================

if __name__ == "__main__":
    """
    Script de prueba local.
    
    Uso:
        python FlaskProject/sync_turnos_to_device.py
    
    Nota: Requiere supabase_client configurado.
    """
    print("Módulo sync_turnos_to_device cargado.")
    print("Para usar, importar desde app.py:")
    print("  from sync_turnos_to_device import sync_turnos_a_todos_dispositivos")
