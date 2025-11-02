using Qiandao.Model.Entity;
using System.Text;
using System.Net.WebSockets;

namespace Qiandao.Web.WebSocketHandler
{
    public class DeviceManager
    {
        private static readonly object _lock = new object();
        public static readonly Dictionary<string, DeviceStatus> WsDevice = new Dictionary<string, DeviceStatus>();
        public static Dictionary<string, DeviceStatus> GetInstance()
        {
            return WsDevice;
        }

        public static WebSocket? GetDeviceSocketBySn(string deviceSn)
        {
            lock (_lock)
            {
                if (WsDevice.TryGetValue(deviceSn, out var deviceStatus))
                {
                    return deviceStatus.webSocket;
                }
                return null;
            }
        }

        public static void AddDeviceAndStatus(string deviceSn, DeviceStatus deviceStatus)
        {
            lock (_lock)
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
        }

        // 向带状态的单个设备发送数据（使用 System.Net.WebSockets）
        public static async Task SendMessageToDeviceStatusAsync(string sn, string message)
        {
            DeviceStatus? deviceStatus = null;
            lock (_lock)
            {
                WsDevice.TryGetValue(sn, out deviceStatus);
            }

            if (deviceStatus?.webSocket != null)
            {
                try
                {
                    var socket = deviceStatus.webSocket;
                    if (socket.State == WebSocketState.Open)
                    {
                        var buffer = Encoding.UTF8.GetBytes(message);
                        var segment = new ArraySegment<byte>(buffer);
                        await socket.SendAsync(segment, WebSocketMessageType.Text, true, CancellationToken.None);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"SendAsync failed: {ex.Message}");
                }
            }
        }

        public static bool RemoveDeviceStatus(string sn)
        {
            lock (_lock)
            {
                return WsDevice.Remove(sn);
            }
        }

        // 移除设备（通过 System.Net.WebSockets.WebSocket）
        public static string? RemoveDeviceByWebSocket(WebSocket webSocket)
        {
            lock (_lock)
            {
                foreach (var entry in WsDevice.ToList())
                {
                    if (entry.Value.webSocket == webSocket)
                    {
                        WsDevice.Remove(entry.Key);
                        return entry.Key;
                    }
                }
                return null;
            }
        }

        public static string? GetSerialNumber(WebSocket webSocket)
        {
            lock (_lock)
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
        }

        public static DeviceStatus? GetDeviceStatus(string sn)
        {
            lock (_lock)
            {
                if (WsDevice.TryGetValue(sn, out var deviceStatus))
                {
                    return deviceStatus;
                }
                return null;
            }
        }

        // 发送消息给所有设备
        public static async Task SendMessageToAllDeviceFreeAsync(string message)
        {
            List<DeviceStatus> snapshot;
            lock (_lock)
            {
                snapshot = WsDevice.Values.ToList();
            }

            foreach (var deviceStatus in snapshot)
            {
                if (deviceStatus.webSocket != null && deviceStatus.webSocket.State == WebSocketState.Open)
                {
                    try
                    {
                        var buffer = Encoding.UTF8.GetBytes(message);
                        await deviceStatus.webSocket.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true, CancellationToken.None);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"SendAsync failed: {ex.Message}");
                    }
                }
            }
        }
    }
}
