using Qiandao.Model.Entity;
using Qiandao.Service;
using System.Collections.Concurrent;
using System.Text;
using System.Net.WebSockets;

namespace Qiandao.Web.WebSocketHandler
{
    public class SendOrderJob : BackgroundService
    {
        private const int HeartbeatInterval = 30000; // 心跳间隔（毫秒）
        private static Dictionary<string, DeviceStatus> _wdList => DeviceManager.GetInstance();

        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<SendOrderJob> _logger;

        public SendOrderJob(IServiceProvider serviceProvider, ILogger<SendOrderJob> logger)
        {
            _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("SendOrderJob stopping...");
            await base.StopAsync(cancellationToken);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Executing background program...");

            // 启动心跳任务
            var heartbeatTask = SendHeartbeatWithIntervalAsync(stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessDevices(stoppingToken);
                    await Task.Delay(2000, stoppingToken); // 等待一段时间
                }
                catch (TaskCanceledException)
                {
                    _logger.LogInformation("任务被取消时退出循环");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "An error occurred. Restarting...");
                    await Task.Delay(5000, stoppingToken); // 等待几秒再重试
                }
            }

            await heartbeatTask; // 确保心跳任务在停止时完成
            _logger.LogInformation("SendOrderJob stopped.");
        }

        private async Task ProcessDevices(CancellationToken stoppingToken)
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var machineCommandService = scope.ServiceProvider.GetRequiredService<Machine_commandService>();
                var deviceService = scope.ServiceProvider.GetRequiredService<DeviceService>();

                var deviceTasks = _wdList.Select(entry => HandleDevice(entry.Key, machineCommandService, deviceService, stoppingToken));
                await Task.WhenAll(deviceTasks);
            }
        }

        private async Task HandleDevice(string key, Machine_commandService machineCommandService, DeviceService deviceService, CancellationToken stoppingToken)
        {
            if (string.IsNullOrEmpty(key) || !_wdList.TryGetValue(key, out var deviceStatus))
            {
                _logger.LogWarning($"Device with key {key} not found.");
                return;
            }

            var now = DateTime.Now;
            var inSendingCommands = await machineCommandService.FindPendingCommand(0, key);

            if (inSendingCommands?.Count > 0)
            {
                await HandleSendingCommands(deviceStatus, inSendingCommands[0], machineCommandService, deviceService, now);
            }
            else
            {
                var pendingCommands = await machineCommandService.FindPendingCommand(1, key);
                if (pendingCommands?.Count > 0)
                {
                    HandlePendingCommand(deviceStatus, pendingCommands[0], machineCommandService, deviceService, now);
                }
            }
        }

        private async Task HandleSendingCommands(DeviceStatus deviceStatus, Machine_command command, Machine_commandService machineCommandService, DeviceService deviceService, DateTime now)
        {
            if (command != null && !string.IsNullOrEmpty(command.Content))
            {
                await SendAndUpdateCommand(deviceStatus, command, machineCommandService, now);
            }
        }

        private async Task SendAndUpdateCommand(DeviceStatus deviceStatus, Machine_command command, Machine_commandService machineCommandService, DateTime now)
        {
            if (deviceStatus == null || deviceStatus.webSocket == null)
            {
                _logger.LogError("WebSocket is not initialized for device.");
                return;
            }

            try
            {
                _logger.LogInformation($"------Sending command for device {deviceStatus.deviceSn}------: {command.Content}");
                await DeviceManager.SendMessageToDeviceStatusAsync(deviceStatus.deviceSn, command.Content);
                await machineCommandService.UpdateCommandStatus(0, 1, now, command);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send command for device {deviceStatus.deviceSn}.");
            }
        }

        private void HandlePendingCommand(DeviceStatus deviceStatus, Machine_command command, Machine_commandService machineCommandService, DeviceService deviceService, DateTime now)
        {
            if (command.Content != null && now - command.Run_time > TimeSpan.FromSeconds(20))
            {
                if (command.Err_count < 3)
                {
                    command.Err_count++;
                    command.Run_time = now;
                    machineCommandService.updateByPrimaryKey(command);
                    var deviceResponse = deviceService.selectDeviceBySerialNum(command.Serial);
                    if (deviceResponse?.Data?.Status != 0)
                    {
                        SendAndUpdateCommand(deviceStatus, command, machineCommandService, now).GetAwaiter().GetResult();
                    }
                }
                else
                {
                    command.Err_count++;
                    machineCommandService.updateByPrimaryKey(command);
                }
            }
        }

        private async Task SendHeartbeatWithIntervalAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                await SendHeartbeatAsync();  // 发送心跳
                await Task.Delay(HeartbeatInterval, stoppingToken); // 等待心跳间隔
            }
        }

        private async Task SendHeartbeatAsync()
        {
            foreach (var device in _wdList.Values)
            {
                if (device.webSocket == null) continue;
                bool isOpen = false;
                if (device.webSocket is System.Net.WebSockets.WebSocket sysSocket)
                {
                    isOpen = sysSocket.State == System.Net.WebSockets.WebSocketState.Open;
                }
                else
                {
                    // Try WebSocketSharp 'IsAlive' property
                    var prop = device.webSocket.GetType().GetProperty("IsAlive");
                    if (prop != null)
                    {
                        var val = prop.GetValue(device.webSocket);
                        if (val is bool b) isOpen = b;
                    }
                }

                if (isOpen)
                {
                    await DeviceManager.SendMessageToDeviceStatusAsync(device.deviceSn, "heartbeat");
                }
            }
        }

        private async Task ReconnectWebSocket(DeviceStatus deviceStatus, CancellationToken stoppingToken)
        {
            // Use ClientWebSocket to attempt reconnect when needed
            if (string.IsNullOrEmpty(deviceStatus.ConnectionUri))
            {
                _logger.LogWarning($"No ConnectionUri for device {deviceStatus.deviceSn}");
                return;
            }

            deviceStatus.ReconnectAttempts = 0;

            while (deviceStatus.ReconnectAttempts < 5 && !stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var client = new ClientWebSocket())
                    {
                        var uri = new Uri(deviceStatus.ConnectionUri);
                        await client.ConnectAsync(uri, stoppingToken);
                        if (client.State == WebSocketState.Open)
                        {
                            _logger.LogInformation($"Reconnected WebSocket for device {deviceStatus.deviceSn} successfully.");
                            deviceStatus.webSocket = client;
                            deviceStatus.ReconnectAttempts = 0;
                            return;
                        }
                    }
                }
                catch (Exception ex)
                {
                    deviceStatus.ReconnectAttempts++;
                    _logger.LogError(ex, $"Failed to reconnect WebSocket for device {deviceStatus.deviceSn}.");
                    await Task.Delay(5000, stoppingToken);
                }
            }

            _logger.LogWarning($"Max reconnect attempts reached for device {deviceStatus.deviceSn}.");
        }
    }
}
