using Qiandao.Model.Entity;
using System.Text;
using System.Net.WebSockets;
using System.Threading;
using System.Collections.Generic;

namespace Qiandao.Web.WebSocketHandler
{
    public class DeviceManager // Eliminado 'static'
    {
        private readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1); // Eliminado 'static'
        public readonly Dictionary<string, DeviceStatus> WsDevice = new Dictionary<string, DeviceStatus>(); // Eliminado 'static'

        public DeviceManager() // Constructor de instancia
        {
            // Constructor vacío, o podrías inicializar algo aquí si fuera necesario.
        }

        /// <summary>
        /// Obtener WebSocket con estado
        /// </summary>
        /// <param name="deviceSn">Número de serie del dispositivo</param>
        /// <returns>Objeto WebSocket</returns>
        public async Task<System.Net.WebSockets.WebSocket?> GetDeviceSocketBySn(string deviceSn) // Eliminado 'static'
        {
            await _semaphore.WaitAsync();
            try
            {
                if (WsDevice.TryGetValue(deviceSn, out var deviceStatus))
                {
                    return deviceStatus.webSocket;
                }
                return null;
            }
            finally
            {
                _semaphore.Release();
            }
        }

        /// <summary>
        /// Agregar dispositivo y su estado
        /// </summary>
        /// <param name="deviceSn">Número de serie del dispositivo</param>
        /// <param name="deviceStatus">Estado del dispositivo</param>
        public async Task AddDeviceAndStatus(string deviceSn, DeviceStatus deviceStatus) // Eliminado 'static'
        {
            await _semaphore.WaitAsync();
            try
            {
                if (!WsDevice.ContainsKey(deviceSn))
                {
                    WsDevice.Add(deviceSn, deviceStatus);
                }
                else
                {
                    WsDevice[deviceSn] = deviceStatus;
                }
            }
            finally
            {
                _semaphore.Release();
            }
        }

        // Enviar datos a un único usuario con estado
        public async Task SendMessageToDeviceStatusAsync(string sn, string message) // Eliminado 'static'
        {
            await _semaphore.WaitAsync();
            try
            {
                if (WsDevice.TryGetValue(sn, out var deviceStatus))
                {
                    var conn = deviceStatus.webSocket;
                    if (conn != null && conn.State == WebSocketState.Open)
                    {
                        try
                        {
                            var buffer = Encoding.UTF8.GetBytes(message);
                            await conn.SendAsync(new ArraySegment<byte>(buffer, 0, buffer.Length), WebSocketMessageType.Text, true, CancellationToken.None);
                        }
                        catch (Exception ex)
                        {
                            // Handle exceptions (e.g., logging)
                            Console.WriteLine($"SendAsync failed: {ex.Message}");
                        }
                    }
                }
            }
            finally
            {
                _semaphore.Release();
            }
        }

        // Eliminar dispositivo con estado
        public async Task<bool> RemoveDeviceStatus(string sn) // Eliminado 'static'
        {
            await _semaphore.WaitAsync();
            try
            {
                return WsDevice.Remove(sn);
            }
            finally
            {
                _semaphore.Release();
            }
        }

        // Eliminar dispositivo con estado (a través de WebSocket)
        public async Task<string?> RemoveDeviceByWebSocket(System.Net.WebSockets.WebSocket webSocket) // Eliminado 'static'
        {
            await _semaphore.WaitAsync();
            try
            {
                string? removedSn = null;
                foreach (var entry in WsDevice.ToList()) // Use ToList() to avoid modifying the collection while iterating
                {
                    if (entry.Value.webSocket == webSocket)
                    {
                        WsDevice.Remove(entry.Key);
                        removedSn = entry.Key;
                        break;
                    }
                }
                return removedSn;
            }
            finally
            {
                _semaphore.Release();
            }
        }

        // Obtener número de serie (a través de WebSocket)
        public async Task<string?> GetSerialNumber(System.Net.WebSockets.WebSocket webSocket) // Eliminado 'static'
        {
            await _semaphore.WaitAsync();
            try
            {
                foreach (var deviceStatus in WsDevice.Values)
                {
                    if (deviceStatus.webSocket == webSocket)
                    {
                        return deviceStatus.deviceSn;
                    }
                }
                return null;
            }
            finally
            {
                _semaphore.Release();
            }
        }

        // Verificar estado
        public async Task<DeviceStatus?> GetDeviceStatus(string sn) // Eliminado 'static'
        {
            await _semaphore.WaitAsync();
            try
            {
                if (WsDevice.TryGetValue(sn, out var deviceStatus))
                {
                    return deviceStatus;
                }
                return null;
            }
            finally
            {
                _semaphore.Release();
            }
        }

        // Enviar mensaje a todos los dispositivos libres
        public async Task SendMessageToAllDeviceFreeAsync(string message) // Eliminado 'static'
        {
            await _semaphore.WaitAsync();
            try
            {
                foreach (var deviceStatus in WsDevice.Values.ToList()) // Use ToList() to avoid modifying the collection while iterating
                {
                    if (deviceStatus.webSocket != null && deviceStatus.webSocket.State == WebSocketState.Open)
                    {
                        try
                        {
                            var buffer = Encoding.UTF8.GetBytes(message);
                            await deviceStatus.webSocket.SendAsync(new ArraySegment<byte>(buffer, 0, buffer.Length), WebSocketMessageType.Text, true, CancellationToken.None);
                        }
                        catch (Exception ex)
                        {
                            // Handle exceptions (e.g., logging)
                            Console.WriteLine($"SendAsync failed: {ex.Message}");
                        }
                    }
                }
            }
            finally
            {
                _semaphore.Release();
            }
        }
    }
}
