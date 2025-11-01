using Qiandao.Model.Entity;
using System.Text;
using WebSocketSharp;

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
        /// <summary>
        /// 获取带有状态的 WebSocket
        /// </summary>
        /// <param name="deviceSn">设备序列号</param>
        /// <returns>WebSocket 对象</returns>
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

        /// <summary>
        /// 添加设备及其状态
        /// </summary>
        /// <param name="deviceSn">设备序列号</param>
        /// <param name="deviceStatus">设备状态</param>
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

        //向带状态的用户单个用户发送数据
        public static async Task SendMessageToDeviceStatusAsync(string sn, string message)
        {
            lock (_lock)
            {
                if (WsDevice.TryGetValue(sn, out var deviceStatus))
                {
                    var conn = deviceStatus.webSocket;
                    if (conn != null)
                    {
                        try
                        {
                            conn.Send(Encoding.UTF8.GetBytes(message));
                        }
                        catch (Exception ex)
                        {
                            // Handle exceptions (e.g., logging)
                            Console.WriteLine($"SendAsync failed: {ex.Message}");
                        }
                    }
                }
            }
        }

        //移除带状态的设备
        public static bool RemoveDeviceStatus(string sn)
        {
            lock (_lock)
            {
                return WsDevice.Remove(sn);
            }
        }

        //移除带状态的设备（通过 WebSocket）
        public static string? RemoveDeviceByWebSocket(WebSocket webSocket)
        {
            lock (_lock)
            {
                foreach (var entry in WsDevice.ToList()) // Use ToList() to avoid modifying the collection while iterating
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

        //获取序列号（通过 WebSocket）
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

        //判断状态
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

        //发送消息给所有设备
        public static void SendMessageToAllDeviceFreeAsync(string message)
        {
            lock (_lock)
            {
                foreach (var deviceStatus in WsDevice.Values.ToList()) // Use ToList() to avoid modifying the collection while iterating
                {
                    if (deviceStatus.webSocket != null)
                    {
                        try
                        {
                            deviceStatus.webSocket.Send(message);
                        }
                        catch (Exception ex)
                        {
                            // Handle exceptions (e.g., logging)
                            Console.WriteLine($"SendAsync failed: {ex.Message}");
                        }
                    }
                }
            }
        }
    }
}
