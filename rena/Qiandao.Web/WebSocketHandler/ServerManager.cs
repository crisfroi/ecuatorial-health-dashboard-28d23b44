namespace Qiandao.Web.WebSocketHandler
{
    using System.Net.Sockets;
    using WebSocketSharp.Server;
    using Microsoft.Extensions.Logging;
    using System.Net.WebSockets;

    public class ServerManager : IDisposable
    {
        private WebSocketServer? _webSocketServer;
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<WebSocketHandler> _logger;
        private bool _disposed;

        public ServerManager(ILogger<WebSocketHandler> logger, IServiceProvider serviceProvider)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
            _logger.LogInformation("ServerManager initialized.");
        }

        // 启动 WebSocket 服务器
        public void Start()
        {
            if (_webSocketServer != null && _webSocketServer.IsListening)
            {
                Close();
            }

            int port = GetPort();
            _webSocketServer = new WebSocketServer($"ws://0.0.0.0:{port}");

            // 使用 IServiceProvider 动态创建 WebSocketHandler 实例
            _webSocketServer.AddWebSocketService<WebSocketHandler>(
                "/pub/chat",
                () => new WebSocketHandler(_logger, _serviceProvider));

            try
            {
                _webSocketServer.Start();
                _logger.LogInformation($"WebSocket server started on port {port}.");
            }
            catch (SocketException ex)
            {
                _logger.LogError(ex, "Failed to start WebSocket server.");
            }
        }

        // 获取端口号
        private static int GetPort()
        {
            return int.Parse(Program.GetConfiguration().GetValue<string>("SocketServer:Port"));
        }

        // 关闭服务器
        public void Close()
        {
            if (_webSocketServer != null && _webSocketServer.IsListening)
            {
                _webSocketServer.Stop();
                _logger.LogInformation("WebSocket server stopped.");
            }
        }

        // 关闭所有连接
        public async Task CloseAllConnectionsAsync(List<WebSocket> connections)
        {
            foreach (var webSocket in connections)
            {
                if (webSocket.State == WebSocketState.Open)
                {
                    await webSocket.CloseAsync(
                        WebSocketCloseStatus.NormalClosure,
                        "Server shutting down",
                        CancellationToken.None);
                }
            }
        }

        // 重启服务器
        public void Restart()
        {
            _logger.LogInformation("Restarting WebSocket server...");
            Close();

            // Implement a delay or retry mechanism here if needed
            Task.Delay(500).ContinueWith(_ => Start());
        }

        // 实现 IDisposable 接口，确保服务器停止并释放资源
        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        protected virtual void Dispose(bool disposing)
        {
            if (_disposed)
                return;

            if (disposing)
            {
                // 释放托管资源
                Close();
                _webSocketServer = null;
            }

            _disposed = true;
        }
    }
}
