using Qiandao.Model.Entity;
using Qiandao.Service;
using System.Collections.Concurrent;
using System.Text;
using System.Net.WebSockets;
using System.Threading;
using System.Linq; // Necesario para .Select()

namespace Qiandao.Web.WebSocketHandler
{
    public class SendOrderJob : BackgroundService
    {
        private const int HeartbeatInterval = 30000; // Intervalo de latido (milisegundos)

        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<SendOrderJob> _logger;
        private readonly DeviceManager _deviceManager; // Restaurado

        public SendOrderJob(IServiceProvider serviceProvider, ILogger<SendOrderJob> logger, DeviceManager deviceManager) // Restaurado
        {
            _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _deviceManager = deviceManager; // Asignado
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("SendOrderJob stopping...");
            await base.StopAsync(cancellationToken);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Executing background program...");

            // Start heartbeat task
            var heartbeatTask = SendHeartbeatWithIntervalAsync(stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessDevices(stoppingToken);
                    await Task.Delay(2000, stoppingToken); // Esperar un período
                }
                catch (TaskCanceledException)
                {
                    _logger.LogInformation("Tarea cancelada, saliendo del bucle.");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Ocurrió un error. Reiniciando...");
                    await Task.Delay(5000, stoppingToken); // Esperar unos segundos antes de reintentar
                }
            }

            await heartbeatTask; // Asegurar que la tarea de latido se complete al detenerse
            _logger.LogInformation("SendOrderJob stopped.");
        }

        private async Task ProcessDevices(CancellationToken stoppingToken)
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var machineCommandService = scope.ServiceProvider.GetRequiredService<Machine_commandService>();
                var deviceService = scope.ServiceProvider.GetRequiredService<DeviceService>();

                var deviceTasks = _deviceManager.WsDevice.Select(entry => HandleDevice(entry.Key, machineCommandService, deviceService, stoppingToken)); // Usar _deviceManager.WsDevice
                await Task.WhenAll(deviceTasks);
            }
        }

        private async Task HandleDevice(string key, Machine_commandService machineCommandService, DeviceService deviceService, CancellationToken stoppingToken)
        {
            DeviceStatus? deviceStatus = await _deviceManager.GetDeviceStatus(key); // Usar _deviceManager.GetDeviceStatus
            if (string.IsNullOrEmpty(key) || deviceStatus == null)
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
                    await HandlePendingCommand(deviceStatus, pendingCommands[0], machineCommandService, deviceService, now);
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
            if (deviceStatus == null || deviceStatus.webSocket == null || deviceStatus.webSocket.State != WebSocketState.Open)
            {
                _logger.LogError("WebSocket is not open or initialized for device.");
                return;
            }

            try
            {
                _logger.LogInformation($"------Sending command for device {deviceStatus.deviceSn}------: {command.Content}");
                var buffer = Encoding.UTF8.GetBytes(command.Content);
                await deviceStatus.webSocket.SendAsync(new ArraySegment<byte>(buffer, 0, buffer.Length), WebSocketMessageType.Text, true, CancellationToken.None);
                await machineCommandService.UpdateCommandStatus(0, 1, now, command);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send command for device {deviceStatus.deviceSn}.");
            }
        }

        private async Task HandlePendingCommand(DeviceStatus deviceStatus, Machine_command command, Machine_commandService machineCommandService, DeviceService deviceService, DateTime now)
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
                        await SendAndUpdateCommand(deviceStatus, command, machineCommandService, now);
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
                await SendHeartbeatAsync();  // Enviar latido
                await Task.Delay(HeartbeatInterval, stoppingToken); // Esperar intervalo de latido
            }
        }

        private async Task SendHeartbeatAsync()
        {
            // La lógica real del latido se puede implementar aquí
            // Por ejemplo: iterar a través de dispositivos y enviar mensaje de latido
            foreach (var device in _deviceManager.WsDevice.Values) // Usar _deviceManager.WsDevice
            {
                if (device.webSocket != null && device.webSocket.State == WebSocketState.Open)
                {
                    // Enviar mensaje de latido
                    var buffer = Encoding.UTF8.GetBytes("heartbeat");
                    await device.webSocket.SendAsync(new ArraySegment<byte>(buffer, 0, buffer.Length), WebSocketMessageType.Text, true, CancellationToken.None);
                }
            }
        }
    }
}
