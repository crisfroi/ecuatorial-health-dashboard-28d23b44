using WebSocketSharp;

namespace Qiandao.Model.Entity
{
   public class DeviceStatus
    {
        public string? deviceSn { get; set; }
        public object? webSocket { get; set; }  // Could be System.Net.WebSockets.WebSocket or WebSocketSharp.WebSocket
        public int? status { get; set; }
        public string? ConnectionUri { get; set; }
        public int? ReconnectAttempts { get; set; }
        public override string ToString()
        {
            return $"deviceSn: {this.deviceSn}, status: {this.status}, ConnectionUri: {this.ConnectionUri}, ReconnectAttempts: {this.ReconnectAttempts}";
        }
    }
}
