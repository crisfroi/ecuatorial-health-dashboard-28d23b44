"""
Sincronización de comandos biométricos desde Supabase a dispositivos.

Este script se ejecuta periódicamente (cada 10-30 segundos) via APScheduler
para procesar comandos pendientes en la tabla comandos_biometricos y enviarlos
a los dispositivos biométricos via WebSocket.

Autor: Sistema
Fecha: 2025-11-05
"""

import json
from datetime import datetime
from typing import List, Dict, Any
from Helpers.log_conf import Logger
from web_socket.WebSocketPool import WebSocketPool

logger = Logger()


class ComandosBiometricosSync:
    """Sincronizador de comandos biométricos Supabase -> Dispositivos"""

    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def obtener_comandos_pendientes(self, limit=50) -> List[Dict[str, Any]]:
        """
        Obtiene comandos pendientes de la cola en Supabase.
        
        Args:
            limit: Número máximo de comandos a procesar por ejecución
            
        Returns:
            Lista de comandos pendientes
        """
        try:
            response = self.supabase.table('comandos_biometricos') \
                .select('*') \
                .eq('estado', 'pendiente') \
                .lt('intentos', 3) \
                .order('created_at', desc=False) \
                .limit(limit) \
                .execute()
            
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"Error obteniendo comandos pendientes: {e}")
            return []

    def procesar_comando(self, comando: Dict[str, Any]) -> bool:
        """
        Procesa un comando individual enviándolo al dispositivo vía WebSocket.
        
        Args:
            comando: Diccionario con datos del comando
            
        Returns:
            True si se envió exitosamente, False si falló
        """
        comando_id = comando['id']
        device_sn = comando['device_sn']
        comando_json = comando['comando_json']
        
        try:
            # Verificar que el dispositivo esté conectado
            device_status = WebSocketPool.get_device_status(device_sn)
            
            if not device_status or not device_status.websocket:
                logger.warning(f"Dispositivo {device_sn} no conectado. Comando {comando_id} esperará.")
                
                # Incrementar intentos
                self.supabase.table('comandos_biometricos') \
                    .update({
                        'intentos': comando['intentos'] + 1,
                        'error_mensaje': 'Dispositivo no conectado'
                    }) \
                    .eq('id', comando_id) \
                    .execute()
                
                return False
            
            # Convertir comando_json a string si es necesario
            mensaje = json.dumps(comando_json) if isinstance(comando_json, dict) else comando_json
            
            # Enviar comando vía WebSocket
            import asyncio
            asyncio.run(WebSocketPool.send_message_to_device_status(device_sn, mensaje))
            
            logger.info(f"✅ Comando {comando_id} enviado a {device_sn}")
            
            # Marcar como enviado
            self.supabase.table('comandos_biometricos') \
                .update({
                    'estado': 'enviado',
                    'procesado_at': datetime.now().isoformat(),
                    'intentos': comando['intentos'] + 1
                }) \
                .eq('id', comando_id) \
                .execute()
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error procesando comando {comando_id}: {e}")
            
            # Marcar como error
            self.supabase.table('comandos_biometricos') \
                .update({
                    'estado': 'error',
                    'intentos': comando['intentos'] + 1,
                    'error_mensaje': str(e)
                }) \
                .eq('id', comando_id) \
                .execute()
            
            return False

    def procesar_lote(self) -> Dict[str, int]:
        """
        Procesa un lote de comandos pendientes.
        
        Returns:
            Diccionario con estadísticas de procesamiento
        """
        comandos = self.obtener_comandos_pendientes()
        
        stats = {
            'total': len(comandos),
            'enviados': 0,
            'fallidos': 0,
            'no_conectados': 0
        }
        
        for comando in comandos:
            exito = self.procesar_comando(comando)
            if exito:
                stats['enviados'] += 1
            else:
                if comando.get('error_mensaje') == 'Dispositivo no conectado':
                    stats['no_conectados'] += 1
                else:
                    stats['fallidos'] += 1
        
        if stats['total'] > 0:
            logger.info(f"""
            ============================================================
            📊 SYNC COMANDOS BIOMÉTRICOS:
               Total comandos: {stats['total']}
               ✅ Enviados: {stats['enviados']}
               ⏳ Dispositivos offline: {stats['no_conectados']}
               ❌ Errores: {stats['fallidos']}
               🕐 Timestamp: {datetime.now().isoformat()}
            ============================================================
            """)
        
        return stats

    def marcar_comando_completado(self, device_sn: str, comando_ret: Dict[str, Any]):
        """
        Marca un comando como completado cuando el dispositivo responde.
        
        Args:
            device_sn: Serial number del dispositivo
            comando_ret: Respuesta del dispositivo (e.g., {"ret": "setuserinfo", "result": true})
        """
        try:
            comando_tipo = comando_ret.get('ret')
            result = comando_ret.get('result')
            
            if not comando_tipo:
                return
            
            # Buscar comando enviado más reciente de este tipo y dispositivo
            response = self.supabase.table('comandos_biometricos') \
                .select('id') \
                .eq('device_sn', device_sn) \
                .eq('comando_tipo', comando_tipo) \
                .eq('estado', 'enviado') \
                .order('procesado_at', desc=True) \
                .limit(1) \
                .execute()
            
            if response.data and len(response.data) > 0:
                comando_id = response.data[0]['id']
                
                if result:
                    self.supabase.table('comandos_biometricos') \
                        .update({
                            'estado': 'completado',
                            'completado_at': datetime.now().isoformat()
                        }) \
                        .eq('id', comando_id) \
                        .execute()
                    
                    logger.info(f"✅ Comando {comando_id} completado exitosamente")
                else:
                    self.supabase.table('comandos_biometricos') \
                        .update({
                            'estado': 'error',
                            'error_mensaje': 'Dispositivo respondió con result=false'
                        }) \
                        .eq('id', comando_id) \
                        .execute()
                    
                    logger.warning(f"⚠️ Comando {comando_id} falló en dispositivo")
        
        except Exception as e:
            logger.error(f"Error marcando comando completado: {e}")

    def limpiar_comandos_antiguos(self):
        """Limpia comandos completados de más de 7 días"""
        try:
            result = self.supabase.rpc('limpiar_comandos_antiguos').execute()
            deleted_count = result.data if result.data else 0
            
            if deleted_count > 0:
                logger.info(f"🧹 Limpiados {deleted_count} comandos antiguos")
        except Exception as e:
            logger.error(f"Error limpiando comandos antiguos: {e}")


def sync_comandos_periodico(supabase_client):
    """
    Función principal para sincronización periódica de comandos.
    Se ejecuta cada 10-30 segundos vía APScheduler.
    """
    try:
        syncer = ComandosBiometricosSync(supabase_client)
        syncer.procesar_lote()
        
        # Limpiar comandos antiguos una vez por hora (1 de cada ~120 ejecuciones)
        import random
        if random.randint(1, 120) == 1:
            syncer.limpiar_comandos_antiguos()
    
    except Exception as e:
        logger.error(f"Error en sync_comandos_periodico: {e}")
