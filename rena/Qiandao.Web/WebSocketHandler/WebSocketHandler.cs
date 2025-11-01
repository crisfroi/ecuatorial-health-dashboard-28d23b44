using System.Text;
using Qiandao.Model.Entity;
using Qiandao.Model.Response;
using Qiandao.Service;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Microsoft.IdentityModel.Tokens;
using System.Net.WebSockets;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using System.Threading;
using System.Collections.Concurrent;
using System.Net;
using Microsoft.AspNetCore.Http; // Agregado para HttpContext

namespace Qiandao.Web.WebSocketHandler
{
    public class WebSocketHandler
    {
        private readonly ILogger<WebSocketHandler> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly DeviceManager _deviceManager; // Restaurado

        public WebSocketHandler(ILogger<WebSocketHandler> logger, IServiceProvider serviceProvider, DeviceManager deviceManager) // Restaurado
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
            _deviceManager = deviceManager; // Asignado
        }

        public async Task HandleWebSocketAsync(HttpContext context, System.Net.WebSockets.WebSocket webSocket)
        {
            var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "";
            var clientPort = context.Connection.RemotePort;

            _logger.LogInformation($"WebSocket connected from {clientIp}:{clientPort}");

            // Aquí debes agregar el WebSocket a tu DeviceManager
            // Necesitas una forma de identificar el dispositivo desde el WebSocket para agregarlo al DeviceManager
            // Por ahora, lo agregaremos de forma genérica o esperaremos un mensaje de registro del dispositivo.
            // await _deviceManager.AddDeviceAndStatus(deviceSn, new DeviceStatus { webSocket = webSocket, status = 1, deviceSn = deviceSn, ConnectionUri = $"ws://{clientIp}:{clientPort}" });

            var buffer = new byte[1024 * 4];
            WebSocketReceiveResult result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

            while (!result.CloseStatus.HasValue)
            {
                var message = Encoding.UTF8.GetString(buffer, 0, result.Count);
                _logger.LogInformation($"----Ask message---- {message}");

                // Process the message (similar to your OnMessage logic)
                using (var scope = _serviceProvider.CreateScope())
                {
                    var deviceService = scope.ServiceProvider.GetRequiredService<DeviceService>();
                    var machineCommandService = scope.ServiceProvider.GetRequiredService<Machine_commandService>();
                    var recordService = scope.ServiceProvider.GetRequiredService<RecordService>();
                    var personService = scope.ServiceProvider.GetRequiredService<PersonService>();
                    var enrollinfoService = scope.ServiceProvider.GetRequiredService<EnrollinfoService>();

                    await ProcessMessage(message, deviceService, recordService, personService, enrollinfoService, machineCommandService, clientIp, clientPort, webSocket);
                }

                result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
            }

            await webSocket.CloseAsync(result.CloseStatus.Value,
                                     result.CloseStatusDescription,
                                     CancellationToken.None);

            _logger.LogInformation($"WebSocket closed: {clientIp}:{clientPort}");
            // Aquí debes remover el WebSocket de tu DeviceManager
            await _deviceManager.RemoveDeviceByWebSocket(webSocket); // Usar instancia inyectada
        }

        private async Task ProcessMessage(string message,
                                             DeviceService deviceService, RecordService recordService,
                                             PersonService personService, EnrollinfoService enrollinfoService,
                                             Machine_commandService machine_commandService, string clientIp,
                                             int clientPort, System.Net.WebSockets.WebSocket webSocket)
        {
            try
            {
                JObject jsonNode = JObject.Parse(message);
                var cmd = jsonNode.Value<string>("cmd");
                var ret = jsonNode.Value<string>("ret");
                if (cmd != null) {
                    ret = cmd;
                }

                switch (ret)
                {
                    case "reg":
                        _logger.LogInformation("deviceOn" + jsonNode);
                        await GetDeviceInfo(jsonNode, deviceService, clientIp, clientPort, webSocket);
                        break;
                    case "sendlog":
                        await GetAttendance(jsonNode, recordService, clientIp, clientPort, webSocket);
                        break;
                    case "sendqrcode":
                        var qrcodeResponse = "{\"ret\":\"sendqrcode\",\"result\":true,\"access\":1,\"enrollid\":10,\"username\":\"test\"}";
                        await SendMessage(webSocket, qrcodeResponse);
                        break;
                    case "senduser":
                        await GetEnrollInfo(jsonNode,  personService, enrollinfoService,  clientIp,
                                    clientPort, webSocket);
                        break;
                    case "getuserlist":
                        await GetUserList(jsonNode,  machine_commandService, personService, enrollinfoService,  clientIp,
                                    clientPort, webSocket);
                        break;
                    case "getuserinfo":
                        await GetUserInfo(jsonNode,  enrollinfoService, personService, machine_commandService);
                        await HandleDeviceStatus(jsonNode,  deviceService,  clientIp,
                                    clientPort, webSocket);
                        break;
                    case "setuserinfo":
                        await HandleDeviceStatus(jsonNode,  deviceService,  clientIp,
                                    clientPort, webSocket);
                        await UpdateCommandStatus(jsonNode, "setuserinfo", machine_commandService);
                        break;
                    case "getalllog":
                         await GetAllLog(jsonNode, machine_commandService, recordService, clientIp, clientPort, webSocket);
                        break;
                    case "getnewlog":
                        await GetNewLog(jsonNode,  machine_commandService, recordService, clientIp,
                                    clientPort, webSocket);
                        break;
                    case "deleteuser":
                        await HandleDeviceStatus(jsonNode,  deviceService,  clientIp,
                                    clientPort, webSocket);
                        await UpdateCommandStatus(jsonNode, "deleteuser", machine_commandService);
                        break;
                    case "initsys":
                        await HandleDeviceStatus(jsonNode, deviceService, clientIp, clientPort, webSocket);
                        await UpdateCommandStatus(jsonNode, "initsys", machine_commandService);
                        break;
                    case "setdevlock":
                        await HandleDeviceStatus(jsonNode,  deviceService,  clientIp,
                                    clientPort, webSocket);
                        await UpdateCommandStatus(jsonNode, "setdevlock", machine_commandService);
                        break;
                    case "setuserlock":
                     await   HandleDeviceStatus(jsonNode,  deviceService,  clientIp,
                                    clientPort, webSocket);
                        await UpdateCommandStatus(jsonNode, "setuserlock", machine_commandService);
                        break;
                    case "getdevinfo":
                        await HandleDeviceStatus(jsonNode,  deviceService,  clientIp,
                                    clientPort, webSocket);
                        await UpdateCommandStatus(jsonNode, "getdevinfo", machine_commandService);
                        break;
                    case "setusername":
                        await HandleDeviceStatus(jsonNode,  deviceService,  clientIp,
                                    clientPort, webSocket);
                        await UpdateCommandStatus(jsonNode, "setusername", machine_commandService);
                        break;
                    case "reboot":
                        await HandleDeviceStatus(jsonNode,  deviceService,  clientIp,
                                    clientPort, webSocket);
                        await UpdateCommandStatus(jsonNode, "reboot", machine_commandService);
                        break;
                    case "getdevlock":
                        await HandleDeviceStatus(jsonNode,  deviceService,  clientIp,
                                    clientPort, webSocket);
                        await UpdateCommandStatus(jsonNode, "getdevlock", machine_commandService);
                        break;
                    case "getuserlock":
                        await HandleDeviceStatus(jsonNode,  deviceService,  clientIp,
                                    clientPort, webSocket);
                        await UpdateCommandStatus(jsonNode, "getuserlock", machine_commandService);
                        break;
                    default:
                        await HandleDeviceStatus(jsonNode,  deviceService,  clientIp,
                                    clientPort, webSocket);
                        await UpdateCommandStatus(jsonNode, ret, machine_commandService);
                        break;
                }
            }
            catch (JsonReaderException ex)
            {
                _logger.LogError(ex, "Fail: {Message}", message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fail");
            }
        }

        public async Task SendMessage(System.Net.WebSockets.WebSocket webSocket, string message)
        {
            if (webSocket.State == WebSocketState.Open)
            {
                var encoded = Encoding.UTF8.GetBytes(message);
                await webSocket.SendAsync(new ArraySegment<byte>(encoded, 0, encoded.Length),
                                        WebSocketMessageType.Text, true, CancellationToken.None);
            }
            else
            {
                _logger.LogInformation("WebSocket is not open.");
            }
        }

        private async Task HandleDeviceStatus(JObject jsonNode,  DeviceService deviceService, string clientIp,
                                   int clientPort, System.Net.WebSockets.WebSocket webSocket)
        {
            var sn = jsonNode.Value<string>("sn");
            var deviceStatus = new DeviceStatus { webSocket = webSocket, deviceSn = sn, status = 1, ConnectionUri = $"ws://{clientIp}:{clientPort}" };
            // Actualizar estado del dispositivo
            await _deviceManager.AddDeviceAndStatus(sn, deviceStatus); // Usar instancia inyectada
        }

        private async Task UpdateCommandStatus(JObject jsonNode, string command, Machine_commandService machineCommandService)
        {
            var sn = jsonNode.Value<string>("sn");
           await UpdateCommandStatusx(sn, command, machineCommandService);
        }
        public async Task UpdateCommandStatusx(string serial, string commandType, Machine_commandService machineCommandService)
        {
            if (serial != null)
            {
                var machineCommands = await machineCommandService.FindPendingCommand(1, serial);
                if (machineCommands.Any() && machineCommands.First().Name == commandType)
                {
                  await  machineCommandService.UpdateCommandStatus(1, 0, DateTime.Now, machineCommands.First());
                }
            }
        }

        public async Task GetDeviceInfo(JObject jsonNode,  DeviceService deviceService,string clientIp,
                                   int clientPort, System.Net.WebSockets.WebSocket webSocket)
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
                await SendMessage(webSocket, System.Text.Json.JsonSerializer.Serialize(response));

                var deviceStatus = new DeviceStatus
                {
                    webSocket = webSocket,
                    status = 1,
                    deviceSn = sn,
                    ConnectionUri = $"ws://{clientIp}:{clientPort}"
                };
                // Actualizar estado del dispositivo
                await _deviceManager.AddDeviceAndStatus(sn, deviceStatus); // Usar instancia inyectada
            }
            else
            {
                var errorResponse = new
                {
                    ret = "reg",
                    result = false,
                    reason = 1
                };

                await SendMessage(webSocket, System.Text.Json.JsonSerializer.Serialize(errorResponse));

                var deviceStatus = new DeviceStatus
                {
                    webSocket = webSocket,
                    status = 1,
                    deviceSn = sn,
                    ConnectionUri= $"ws://{clientIp}:{clientPort}"
                };
                // Actualizar estado del dispositivo
                await _deviceManager.AddDeviceAndStatus(sn, deviceStatus); // Usar instancia inyectada
            }
        }
     

        public async Task GetAttendance(JObject jsonNode, RecordService recordService, string clientIp,
                                   int clientPort, System.Net.WebSockets.WebSocket webSocket)
        {
            var sn = jsonNode.Value<string>("sn"); 
            int count = jsonNode.Value<int>("count"); 
            int logIndex = jsonNode.Value<int>("logindex");
            List<Record> recordAll = new List<Record>();
            DeviceStatus deviceStatus = new DeviceStatus();
            bool flag = false;
            if (count > 0)
            {
                JArray records = jsonNode.Value<JArray>("record"); 
                foreach (var item in records)
                {
                    JObject type = item as JObject;
                    long enrollId = type["enrollid"]?.Value<long>() ?? 0;
                    string timeStr = type["time"]?.ToString() ?? "";
                    int mode = type["mode"]?.Value<int>() ?? 0;
                    int inOut = type["inout"]?.Value<int>() ?? 0;
                    int eventCode = type[@"event"]?.Value<int>() ?? 0;
                    double temperature = 0;

                    Record record = new Record
                    {
                        Device_serial_num = sn,
                        Enroll_id = enrollId,
                        Event = eventCode,
                        IntOut = inOut,
                        Mode = mode,
                        Records_time = DateTime.Now,
                        Temperature = temperature,
                    };
                    if (type["temp"] != null)
                    {
                        temperature = type["temp"]?.Value<double>() ?? 0;
                        temperature /= 10;
                        temperature = Math.Round(temperature * 10) / 10;
                        record.Temperature = temperature;
                    }
                    JObject obj = new JObject
                    {
                        ["temperature"] = temperature.ToString(),
                        ["resultStatus"] = enrollId == 99999999 ? 0 : 1,
                        ["IdentifyType"] = "0",
                        ["Mac_addr"] = "",
                        ["SN"] = sn,
                        ["address"] = "",
                        ["birthday"] = "",
                        ["depart"] = "",
                        ["devicename"] = "",
                        ["employee_number"] = "",
                        ["icNum"] = "",
                        ["id"] = sn,
                        ["idNum"] = "",
                        ["idissue"] = "",
                        ["inout"] = inOut,
                        ["location"] = "",
                        ["name"] = "",
                        ["nation"] = "",
                        ["sex"] = "",
                        ["telephone"] = "",
                        ["templatePhoto"] = "",
                        ["time"] = timeStr,
                        ["userid"] = enrollId.ToString(),
                        ["validEnd"] = "",
                        ["validStart"] = ""
                    };
                    if (type["image"] != null)
                    {
                        string picName = Guid.NewGuid().ToString();
                        flag = ImageProcess.Base64ToImage(type["image"]?.ToString() ?? "", $"{picName}.jpg");
                        if (flag)
                        {
                            record.Image = $"{picName}.jpg";
                        }
                    }
                    recordAll.Add(record);
                }

                string response = logIndex >= 0
                    ? $"{{\"ret\":\"sendlog\",\"result\":true,\"count\":{count},\"logindex\":{logIndex},\"cloudtime\":\"{DateTime.Now}\"}}"
                    : $"{{\"ret\":\"sendlog\",\"result\":true,\"cloudtime\":\"{DateTime.Now}\"}}";
           
                await SendMessage(webSocket, response);

                deviceStatus.webSocket = webSocket;
                deviceStatus.status = 1;
                deviceStatus.deviceSn = sn;
                deviceStatus.ConnectionUri = $"ws://{clientIp}:{clientPort}";
                // Actualizar estado del dispositivo
                await _deviceManager.AddDeviceAndStatus(sn, deviceStatus); // Usar instancia inyectada
                foreach (var record in recordAll)
                {
                    if (record != null)
                    {
                      await  recordService.Insert(record);
                    }
                }
            }
            else if (count == 0)
            {
                string response = "{\"ret\":\"sendlog\",\"result\":false,\"reason\":1}";
                await SendMessage(webSocket, response);

                deviceStatus.webSocket = webSocket;
                deviceStatus.status = 1;
                deviceStatus.deviceSn = sn;
                deviceStatus.ConnectionUri = $"ws://{clientIp}:{clientPort}";
                // Actualizar estado del dispositivo
                await _deviceManager.AddDeviceAndStatus(sn, deviceStatus); // Usar instancia inyectada
            }
        }

        private async Task GetEnrollInfo(JObject jsonNode, PersonService personService, EnrollinfoService enrollinfoService, string clientIp,
                                   int clientPort, System.Net.WebSockets.WebSocket webSocket)
        {
            // Crear formateador de fecha
               var sn = jsonNode.Value<string>("sn");
            var signatures1 = jsonNode.Value<string>("record");
            bool flag = false;
            DeviceStatus deviceStatus = new DeviceStatus();
            if (string.IsNullOrEmpty(signatures1))
            {
                var response = "{\"ret\":\"senduser\",\"result\":false,\"reason\":1}";
                await SendMessage(webSocket, response);

                deviceStatus.webSocket = webSocket;
                deviceStatus.status = 1;
                deviceStatus.deviceSn = sn;
                deviceStatus.ConnectionUri = $"ws://{clientIp}:{clientPort}";
                // Actualizar estado del dispositivo
                await _deviceManager.AddDeviceAndStatus(sn, deviceStatus); // Usar instancia inyectada
            }
            else
            {
                int backupnum = jsonNode["backupnum"]?.Value<int>() ?? 0;
                long enrollId = jsonNode["enrollid"]?.Value<long>() ?? 0;
                string? name = jsonNode["name"]?.ToString();
                int rollId = jsonNode["admin"]?.Value<int>() ?? 0;
                string? signatures = jsonNode["record"]?.ToString();

                Person person = new Person
                {
                    Id = enrollId,
                    Name = name,
                    Roll_id = rollId
                };

                if (await personService.SelectByPrimaryKey(enrollId) == null)
                {
                     personService.AddPersonAsync(person);
                }

                Enrollinfo enrollInfo = new Enrollinfo
                {
                    Enroll_id = enrollId,
                    Backupnum = backupnum,
                    Signatures = signatures
                };
                if (signatures.IsNullOrEmpty())
                {
                    return;
                }
                if (backupnum == 50)
                {
                    string picName = Guid.NewGuid().ToString();
                    flag = ImageProcess.Base64ToImage(signatures, $"{picName}.jpg");
                    if (flag)
                    {
                        enrollInfo.ImagePath = $"{picName}.jpg";
                    }
                }

                Enrollinfo existingEnrollInfo = enrollinfoService.SelectByBackupnum(enrollId, backupnum);
                if (existingEnrollInfo == null)
                {
                 await enrollinfoService.Insert(enrollInfo);
                }

                var response = "{\"ret\":\"senduser\",\"result\":true,\"cloudtime\":\"" + DateTime.Now+ "\"}";
                await SendMessage(webSocket, response);

                deviceStatus.webSocket = webSocket;
                deviceStatus.status = 1;
                deviceStatus.deviceSn = sn;
                deviceStatus.ConnectionUri = $"ws://{clientIp}:{clientPort}";
                // Actualizar estado del dispositivo
                await _deviceManager.AddDeviceAndStatus(sn, deviceStatus); // Usar instancia inyectada
            }
        }
        private async Task GetUserList(JToken jsonNode,  Machine_commandService machine_commandService, PersonService personService, EnrollinfoService enrollInfoService, string clientIp,
                                   int clientPort, System.Net.WebSockets.WebSocket webSocket)
        {
            List<UserTemp> userTemps = new List<UserTemp>();
            var result = jsonNode.Value<bool>("result");
            int count;
            JToken records = jsonNode.Value<JArray>("record"); 
            var sn = jsonNode.Value<string>("sn"); 
            DeviceStatus deviceStatus = new DeviceStatus();
            if (result)
            {
                count = jsonNode.Value<int>("count");
                if (count > 0)
                {
                    foreach (JToken record in records.Children())
                    {
                        long enrollId = record.Value<long>("enrollid"); 
                        int admin = record.Value<int>("admin");
                        int backupnum = record.Value<int>("backupnum");
                        UserTemp userTemp = new UserTemp
                        {
                            enrollId = enrollId,
                            admin = admin,
                            backupnum = backupnum
                        };
                        if (await personService.SelectByPrimaryKey(userTemp.enrollId) == null)
                        {
                            Person personTemp = new Person
                            {
                                Id = userTemp.enrollId,
                                Name = "",
                                Roll_id = userTemp.admin
                            };
                            personService.AddPersonAsync(personTemp);
                        }
                        if (enrollInfoService.SelectByBackupnum(userTemp.enrollId, userTemp.backupnum) == null)
                        {
                            Enrollinfo enrollInfo = new Enrollinfo
                            {
                                Enroll_id = userTemp.enrollId,
                                Backupnum = userTemp.backupnum,
                                ImagePath="",
                                Signatures="",
                         
                            };
                          await  enrollInfoService.Insert(enrollInfo);
                        }
                    }

                   
                    deviceStatus.webSocket = webSocket;
                    deviceStatus.status = 1;
                    deviceStatus.deviceSn = sn;
                    var response = "{\"cmd\":\"getuserlist\",\"stn\":false}";
                    await SendMessage(webSocket, response);

                    deviceStatus.ConnectionUri = $"ws://{clientIp}:{clientPort}";
                    // Actualizar estado del dispositivo
                    await _deviceManager.AddDeviceAndStatus(sn, deviceStatus); // Usar instancia inyectada
                }
            }
            if (sn != null)
            {
              await  UpdateCommandStatusx(sn, "getuserlist", machine_commandService);
            }
        }
        public async Task GetUserInfo(JToken jsonNode, EnrollinfoService enrollinfoService, PersonService personService, Machine_commandService machine_Commandservice)
        {
            var result = jsonNode.Value<bool>("result");
            var sn = jsonNode.Value<string>("sn");

            bool flag = false;
            if (result)
            {
                var backupnum = jsonNode.Value<int>("backupnum");
                var signatures1 = jsonNode.Value<string>("record");
                var enrollId = jsonNode.Value<long>("enrollid");
                var name = jsonNode.Value<string>("name");
                var admin = jsonNode.Value<int>("admin");
                var signatures = jsonNode.Value<string>("record");

                var person = new Person
                {
                    Id = enrollId,
                    Name = name,
                    Roll_id = admin
                };
                
                if (signatures.IsNullOrEmpty()) {
                    return;
                }
                var enrollInfo = enrollinfoService.SelectByBackupnum(enrollId, backupnum);
                if (backupnum == 50)
                {
                    var picName = Guid.NewGuid().ToString();
                    flag = ImageProcess.Base64ToImage(signatures, $"{picName}.jpg");
                    if (flag)
                    {
                        enrollInfo.ImagePath = $"{picName}.jpg";
                    }
                }

                if (await personService.SelectByPrimaryKey(enrollId) == null)
                {
                    personService.AddPerson(person);
                }
                else
                {
                  await  personService.UpdateByPrimaryKey(person);
                }
                if (enrollInfo == null)
                {
                    Enrollinfo enrollinfo = new Enrollinfo
                    {
                        Enroll_id = enrollId,
                        Backupnum = backupnum,
                        ImagePath = enrollInfo?.ImagePath,
                        Signatures = signatures
                    };
                 await   enrollinfoService.Insert(enrollinfo);
                }
                else
                {
                    enrollInfo.Signatures = signatures;
                   await  enrollinfoService.updateByPrimaryKeySelective(enrollInfo);
                }
            }
            if (sn != null)
            {
             await   UpdateCommandStatusx(sn, "getuserinfo", machine_Commandservice);
            }
        }

        public async Task updateCommandStatus(string serial, string commandType, Machine_commandService machine_Commandservice)
        {
            if (serial != null)
            {
                List<Machine_command> machineCommand =await  machine_Commandservice.FindPendingCommand(1, serial);
                if (machineCommand.Any() && machineCommand.First().Name.Equals(commandType))
                {
                    DateTime dt = DateTime.Now;
                   await   machine_Commandservice.UpdateCommandStatus(1, 0, dt, machineCommand.First());

                }
            }
        }
        //	// Obtener todos los registros de tarjetas
        private async Task GetAllLog(JToken jsonNode, Machine_commandService machine_commandService, RecordService recordsService, string clientIp,
                                   int clientPort, System.Net.WebSockets.WebSocket webSocket)
        {
            var result = jsonNode.Value<bool>("result");
            var recordAll = new List<Record>();
            var sn = jsonNode.Value<string>("sn");
            if (!sn.IsNullOrEmpty())
            {
                var records = jsonNode["record"];
                var deviceStatus = new DeviceStatus();
                int count;
                bool flag = false;
                if (result)
                {
                    count = jsonNode.Value<int>("count");
                    if (count > 0)
                    {
                        foreach (var type in records.Children())
                        {
                            var enrollId = type.Value<long>("enrollid");
                            var timeStr = type.Value<string>("time");
                            var mode = type.Value<int>("mode");
                            var inOut = type.Value<int>("inout");
                            var eventCode = type.Value<int>("event");
                            double temperature = 0;
                            if (type["temp"] != null)
                            {
                                temperature = type.Value<double>("temp") / 100;
                                temperature = Math.Round(temperature * 10) / 10;
                            }
                            DateTime recordsTime;
                            if (DateTime.TryParse(timeStr, out recordsTime))
                            {
                                var record = new Record
                                {
                                    Enroll_id = enrollId,
                                    Event = eventCode,
                                    IntOut = inOut,
                                    Mode = mode,
                                    Records_time = recordsTime,
                                    Device_serial_num = sn,
                                    Temperature = temperature
                                };
                                recordAll.Add(record);
                            }
                        }
                        var response = "{\"cmd\":\"getalllog\",\"stn\":false}";
                        await SendMessage(webSocket, response);

                        deviceStatus.webSocket = webSocket;
                        deviceStatus.status = 1;
                        deviceStatus.deviceSn = sn;
                        deviceStatus.ConnectionUri = $"ws://{clientIp}:{clientPort}";
                        // Actualizar estado del dispositivo
                        await _deviceManager.AddDeviceAndStatus(sn, deviceStatus); // Usar instancia inyectada
                    }
                }
                foreach (var recordTemp in recordAll)
                {
                  await  recordsService.Insert(recordTemp);
                }
                if (sn != null)
                {
                    await UpdateCommandStatusx(sn, "getalllog", machine_commandService);
                }
            }
        }
        // Obtener nuevos registros
        private async Task GetNewLog(JToken jsonNode,  Machine_commandService machine_commandService, RecordService recordsService, string clientIp,
                                   int clientPort, System.Net.WebSockets.WebSocket webSocket)
        {
            var result = jsonNode.Value<bool>("result");
            var recordAll = new List<Record>();
            var sn = jsonNode.Value<string>("sn");
            var records = jsonNode["record"];
            var deviceStatus = new DeviceStatus();
            int count;
            if (result)
            {
                count = jsonNode.Value<int>("count");
                if (count > 0)
                {
                    foreach (var type in records.Children())
                    {
                        var enrollId = type.Value<long>("enrollid");
                        var timeStr = type.Value<string>("time");
                        var mode = type.Value<int>("mode");
                        var inOut = type.Value<int>("inout");
                        var eventCode = type.Value<int>("event");
                        double temperature = 0;

                        if (type["temp"] != null)
                        {
                            temperature = type.Value<double>("temp") / 100;
                            temperature = Math.Round(temperature * 10) / 10;
                        }
                        DateTime recordsTime;
                        if (DateTime.TryParse(timeStr, out recordsTime))
                        {
                            var record = new Record
                            {
                                Enroll_id = enrollId,
                                Event = eventCode,
                                IntOut = inOut,
                                Mode = mode,
                                Records_time = recordsTime,
                                Device_serial_num = sn,
                                Temperature = temperature
                            };

                            recordAll.Add(record);
                        }
                    }
                    var response = "{\"cmd\":\"getnewlog\",\"stn\":false}";
                    await SendMessage(webSocket, response);

                    deviceStatus.webSocket = webSocket;
                    deviceStatus.status = 1;
                    deviceStatus.deviceSn = sn;
                    deviceStatus.ConnectionUri = $"ws://{clientIp}:{clientPort}";
                    // Actualizar estado del dispositivo
                    await _deviceManager.AddDeviceAndStatus(sn, deviceStatus); // Usar instancia inyectada
                }
            }
            foreach (var recordTemp in recordAll)
            {
             await recordsService.Insert(recordTemp);
            }
            if (sn != null)
            {
              await  UpdateCommandStatusx(sn, "getnewlog", machine_commandService);
            }
        }
    }
}