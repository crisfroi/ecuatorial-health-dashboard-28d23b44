using System.Net.WebSockets;
using System.Text;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;
using Qiandao.Model.Entity;
using Qiandao.Service;

namespace Qiandao.Web.WebSocketHandler
{
    public static class WebSocketAdapter
    {
        // Main loop to handle an accepted System.Net.WebSockets.WebSocket
        public static async Task HandleWebSocketAsync(WebSocket socket, IServiceProvider services, ILogger logger)
        {
            var buffer = new byte[8192];
            var segment = new ArraySegment<byte>(buffer);

            try
            {
                while (socket.State == WebSocketState.Open)
                {
                    var result = await socket.ReceiveAsync(segment, CancellationToken.None);
                    if (result.MessageType == WebSocketMessageType.Close)
                    {
                        await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None);
                        break;
                    }

                    int count = result.Count;
                    while (!result.EndOfMessage)
                    {
                        if (count >= buffer.Length)
                        {
                            logger.LogWarning("Message too long for buffer");
                            break;
                        }
                        result = await socket.ReceiveAsync(new ArraySegment<byte>(buffer, count, buffer.Length - count), CancellationToken.None);
                        count += result.Count;
                    }

                    var message = Encoding.UTF8.GetString(buffer, 0, count);
                    logger.LogInformation($"Received WS message: {message}");

                    // Process message using services
                    using (var scope = services.CreateScope())
                    {
                        var deviceService = scope.ServiceProvider.GetRequiredService<DeviceService>();
                        var machineCommandService = scope.ServiceProvider.GetRequiredService<Machine_commandService>();
                        var recordService = scope.ServiceProvider.GetRequiredService<RecordService>();
                        var personService = scope.ServiceProvider.GetRequiredService<PersonService>();
                        var enrollinfoService = scope.ServiceProvider.GetRequiredService<EnrollinfoService>();

                        await ProcessMessage(message, deviceService, recordService, personService, enrollinfoService, machineCommandService, socket, logger);
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "WebSocketAdapter: Error handling websocket");
            }
            finally
            {
                try { socket.Dispose(); } catch { }
            }
        }

        private static async Task ProcessMessage(string message,
            DeviceService deviceService, RecordService recordService,
            PersonService personService, EnrollinfoService enrollinfoService,
            Machine_commandService machine_commandService, WebSocket socket, ILogger logger)
        {
            try
            {
                var jsonNode = JObject.Parse(message);
                var cmd = jsonNode.Value<string>("cmd");
                var ret = jsonNode.Value<string>("ret");
                if (cmd != null) ret = cmd;

                switch (ret)
                {
                    case "reg":
                        await GetDeviceInfo(jsonNode, deviceService, socket, logger);
                        break;
                    case "sendlog":
                        // For simplicity, treat as attendance
                        await Task.Run(() => { /* could parse and save logs */ });
                        break;
                    case "sendqrcode":
                        var qrcodeResponse = new { ret = "sendqrcode", result = true, access = 1, enrollid = 10, username = "test" };
                        await SendJsonAsync(socket, qrcodeResponse);
                        break;
                    case "senduser":
                        // delegate to enroll handler (simplified)
                        await Task.Run(() => { });
                        break;
                    default:
                        // Generic handler: update device status
                        await HandleDeviceStatus(jsonNode, deviceService, socket, logger);
                        break;
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "ProcessMessage error");
            }
        }

        private static async Task GetDeviceInfo(JObject jsonNode, DeviceService deviceService, WebSocket socket, ILogger logger)
        {
            var sn = jsonNode.Value<string>("sn");
            if (sn != null)
            {
                var d1 = deviceService.selectDeviceBySerialNum(sn);
                if (d1.Data == null)
                {
                    deviceService.Insert(sn, 1);
                }
                else
                {
                    deviceService.UpdateStatusByPrimaryKey(d1.Data.Id, 1);
                }

                var response = new
                {
                    ret = "reg",
                    result = true,
                    cloudtime = DateTime.Now
                };

                await SendJsonAsync(socket, response);

                var deviceStatus = new DeviceStatus
                {
                    webSocket = socket,
                    status = 1,
                    deviceSn = sn,
                    ConnectionUri = null
                };
                DeviceManager.AddDeviceAndStatus(sn, deviceStatus);
            }
            else
            {
                var errorResponse = new { ret = "reg", result = false, reason = 1 };
                await SendJsonAsync(socket, errorResponse);
                var deviceStatus = new DeviceStatus { webSocket = socket, status = 1, deviceSn = null };
                DeviceManager.AddDeviceAndStatus(deviceStatus.deviceSn ?? Guid.NewGuid().ToString(), deviceStatus);
            }
        }

        private static async Task HandleDeviceStatus(JObject jsonNode, DeviceService deviceService, WebSocket socket, ILogger logger)
        {
            var sn = jsonNode.Value<string>("sn");
            var clientIp = ""; // Not available in this context easily
            var clientPort = 0;
            var deviceStatus = new DeviceStatus { webSocket = socket, deviceSn = sn, status = 1, ConnectionUri = null };
            DeviceManager.AddDeviceAndStatus(sn ?? Guid.NewGuid().ToString(), deviceStatus);
            await Task.CompletedTask;
        }

        private static async Task SendJsonAsync(WebSocket socket, object obj)
        {
            var json = System.Text.Json.JsonSerializer.Serialize(obj);
            var buffer = Encoding.UTF8.GetBytes(json);
            await socket.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true, CancellationToken.None);
        }
    }
}
