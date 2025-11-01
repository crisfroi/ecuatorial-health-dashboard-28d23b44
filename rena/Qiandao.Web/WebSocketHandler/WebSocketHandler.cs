using System.Text;
using Qiandao.Model.Entity;
using Qiandao.Model.Response;
using Qiandao.Service;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using WebSocketSharp;
using WebSocketSharp.Server;
using Microsoft.IdentityModel.Tokens;



namespace Qiandao.Web.WebSocketHandler
{
    public class WebSocketHandler : WebSocketBehavior
    {
        private ILogger<WebSocketHandler> _logger;
        private IServiceProvider _serviceProvider;
        private string _clientIp;
        private int _clientPort;

        public WebSocketHandler(ILogger<WebSocketHandler> logger, IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }
      
        protected override async void OnOpen()
        {
            try
            {
                await Task.Delay(100);  // 延迟 100 毫秒，等待连接完全建立
               // base.OnOpen();
                var clientPath = Context?.RequestUri?.PathAndQuery;  // 确保 Context 已经初始化
                if (clientPath != null)
                {
                    _logger.LogInformation($"Client connected with path: {clientPath}");
                }
                else
                {
                    _logger.LogError("Client path is null.");
                }
         //       var remoteEndpoint = Context?.UserEndPoint;
                var remoteEndpoint = Context?.UserEndPoint ?? null; // 或者使用其他逻辑处理

                if (remoteEndpoint != null)
                {
                    _clientIp = remoteEndpoint.Address.ToString();
                    _clientPort = remoteEndpoint.Port; // 使用整数类型存储端口
                    Console.WriteLine($"Someone Socket conn: {_clientIp}:{_clientPort}");
                    _logger.LogInformation($"WebSocket connected from {_clientIp}:{_clientPort}");
                }
                else
                {
                    Console.WriteLine("Failed to retrieve remote endpoint.");
                    _logger.LogWarning("Failed to retrieve remote endpoint.");
                }

            }
            catch (Exception ex)
            {
                _logger.LogError($"Error during WebSocket connection establishment: {ex.Message}");
            }
        }

        protected override async void OnMessage(MessageEventArgs e)
        {
            base.OnMessage(e);
            string message = e.Data;
            Console.WriteLine("----Ask message----" + message);
            _logger.LogInformation("----Ask message---- " + message);
            var clientPath = Context?.RequestUri?.PathAndQuery;  // 确保 Context 已经初始化
            if (clientPath != null)
            {
                _logger.LogInformation($"Client connected with path: {clientPath}");
            }
            else
            {
                _logger.LogError("Client path is null.");
            }
            var remoteEndpoint = Context?.UserEndPoint;
            if (remoteEndpoint != null)
            {
                _clientIp = remoteEndpoint.Address.ToString();
                _clientPort = remoteEndpoint.Port; // 使用整数类型存储端口
                Console.WriteLine($"Someone Socket conn: {_clientIp}:{_clientPort}");
                _logger.LogInformation($"WebSocket connected from {_clientIp}:{_clientPort}");
            }
            else
            {
                Console.WriteLine("Failed to retrieve remote endpoint.");
                _logger.LogWarning("Failed to retrieve remote endpoint.");
            }
            using (var scope = _serviceProvider.CreateScope())
            {
                var deviceService = scope.ServiceProvider.GetRequiredService<DeviceService>();
                var machineCommandService = scope.ServiceProvider.GetRequiredService<Machine_commandService>();
                var recordService = scope.ServiceProvider.GetRequiredService<RecordService>();
                var personService = scope.ServiceProvider.GetRequiredService<PersonService>();
                var enrollinfoService = scope.ServiceProvider.GetRequiredService<EnrollinfoService>();
                 await ProcessMessage(message, deviceService, recordService, personService, enrollinfoService, machineCommandService, _clientIp, _clientPort);
            }
        }
        public  void SendMessage(string message)
        {
            if (State == WebSocketSharp.WebSocketState.Open)
            {
                
                 Send(message);
            }
            else
            {
                Console.WriteLine("WebSocket is not open.");
                _logger.LogInformation("WebSocket is not open.");
            }
        }
  
        protected override void OnClose(CloseEventArgs e)
        {
            // Call the base method if needed
            base.OnClose(e);
            Console.WriteLine("WebSocket closed.");
            _logger.LogInformation("WebSocket closed");
            // Access the WebSocket instance from the context
            WebSocketSharp.WebSocket webSocket = Context.WebSocket;
            // Remove the device from the manager
            string? sn = DeviceManager.RemoveDeviceByWebSocket(webSocket);
            if (sn != null)
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var _deviceService = scope.ServiceProvider.GetRequiredService<DeviceService>();
                    // Fetch the device entity by serial number
                    ResponseModel pm = _deviceService.selectDeviceBySerialNum(sn);
                    Device device = pm.Data;
                    if (device != null)
                    {
                        _deviceService.UpdateStatusByPrimaryKey(device.Id, 0);
                    }
                    else
                    {
                        _logger.LogWarning("Device not found for serial number: {SerialNumber}", sn);
                    }
                }
                _logger.LogInformation("WebSocket closed: {RemoteSocketAddress}", this.Context.RequestUri);
            }
        }
        private async Task ProcessMessage(string message,
                                             DeviceService deviceService, RecordService recordService,
                                             PersonService personService, EnrollinfoService enrollinfoService,
                                             Machine_commandService machine_commandService, string clientIp,
                                   int clientPort)
        {
            try
            {
                JObject jsonNode = JObject.Parse(message);
                WebSocketSharp.WebSocket webSocket = Context.WebSocket;
                var cmd = jsonNode.Value<string>("cmd");
                var ret = jsonNode.Value<string>("ret");
                if (cmd != null) {
                    ret = cmd;
                }
                switch (ret)
                {
                    case "reg":
                        _logger.LogInformation("deviceOn" + jsonNode);
                        await GetDeviceInfo(jsonNode, deviceService, clientIp, clientPort);
                        break;
                    case "sendlog":
                        GetAttendance(jsonNode, recordService, clientIp, clientPort);
                        break;
                    case "sendqrcode":
                        var qrcodeResponse = "{\"ret\":\"sendqrcode\",\"result\":true,\"access\":1,\"enrollid\":10,\"username\":\"test\"}";
                        webSocket.Send(Encoding.UTF8.GetBytes(qrcodeResponse));
                        break;
                    case "senduser":
                        GetEnrollInfo(jsonNode,  personService, enrollinfoService,  clientIp,
                                    clientPort);
                        break;
                    case "getuserlist":
                        await GetUserList(jsonNode,  machine_commandService, personService, enrollinfoService,  clientIp,
                                    clientPort);
                        break;
                    case "getuserinfo":
                        GetUserInfo(jsonNode,  enrollinfoService, personService, machine_commandService);
                        await HandleDeviceStatus(jsonNode,  deviceService,  clientIp,
                                    clientPort);
                        break;
                    case "setuserinfo":
                        await HandleDeviceStatus(jsonNode,  deviceService,  clientIp,
                                    clientPort);
                        await UpdateCommandStatus(jsonNode, "setuserinfo", machine_commandService);
                        break;
                    case "getalllog":
                         GetAllLog(jsonNode, machine_commandService, recordService, clientIp, clientPort);
                        break;
                    case "getnewlog":
                        GetNewLog(jsonNode,  machine_commandService, recordService, clientIp,
                                    clientPort);
                        break;
                    case "deleteuser":
                        await HandleDeviceStatus(jsonNode,  deviceService,  clientIp,
                                    clientPort);
                        await UpdateCommandStatus(jsonNode, "deleteuser", machine_commandService);
                        break;
                    case "initsys":
                        await HandleDeviceStatus(jsonNode, deviceService, clientIp, clientPort);
                        await UpdateCommandStatus(jsonNode, "initsys", machine_commandService);
                        break;
                    case "setdevlock":
                        await HandleDeviceStatus(jsonNode,  deviceService,  clientIp,
                                    clientPort);
                        await UpdateCommandStatus(jsonNode, "setdevlock", machine_commandService);
                        break;
                    case "setuserlock":
                     await   HandleDeviceStatus(jsonNode,  deviceService,  clientIp,
                                    clientPort);
                        await UpdateCommandStatus(jsonNode, "setuserlock", machine_commandService);
                        break;
                    case "getdevinfo":
                        await HandleDeviceStatus(jsonNode,  deviceService,  clientIp,
                                    clientPort);
                        await UpdateCommandStatus(jsonNode, "getdevinfo", machine_commandService);
                        break;
                    case "setusername":
                        await HandleDeviceStatus(jsonNode,  deviceService,  clientIp,
                                    clientPort);
                        await UpdateCommandStatus(jsonNode, "setusername", machine_commandService);
                        break;
                    case "reboot":
                        await HandleDeviceStatus(jsonNode,  deviceService,  clientIp,
                                    clientPort);
                        await UpdateCommandStatus(jsonNode, "reboot", machine_commandService);
                        break;
                    case "getdevlock":
                        await HandleDeviceStatus(jsonNode,  deviceService,  clientIp,
                                    clientPort);
                        await UpdateCommandStatus(jsonNode, "getdevlock", machine_commandService);
                        break;
                    case "getuserlock":
                        await HandleDeviceStatus(jsonNode,  deviceService,  clientIp,
                                    clientPort);
                        await UpdateCommandStatus(jsonNode, "getuserlock", machine_commandService);
                        break;
                    default:
                        await HandleDeviceStatus(jsonNode,  deviceService,  clientIp,
                                    clientPort);
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

        private async Task HandleDeviceStatus(JObject jsonNode,  DeviceService deviceService, string clientIp,
                                   int clientPort)
        {
            WebSocketSharp.WebSocket webSocket = Context.WebSocket;
            var sn = jsonNode.Value<string>("sn");
            var deviceStatus = new DeviceStatus { webSocket = webSocket, deviceSn = sn, status = 1, ConnectionUri = $"ws://{clientIp}:{clientPort}" };
            // 更新设备状态
            DeviceManager.AddDeviceAndStatus(sn, deviceStatus);
        }

        private async Task UpdateCommandStatus(JObject jsonNode, string command, Machine_commandService machine_commandService)
        {
            var sn = jsonNode.Value<string>("sn");
           await UpdateCommandStatusx(sn, command, machine_commandService);
        }
        public async Task UpdateCommandStatusx(string serial, string commandType, Machine_commandService machine_commandService)
        {
            if (serial != null)
            {
                var machineCommands = await machine_commandService.FindPendingCommand(1, serial);
                if (machineCommands.Any() && machineCommands.First().Name == commandType)
                {
                  await  machine_commandService.UpdateCommandStatus(1, 0, DateTime.Now, machineCommands.First());
                }
            }
        }

        public async Task GetDeviceInfo(JObject jsonNode,  DeviceService deviceService,string clientIp,
                                   int clientPort)
        {
            WebSocketSharp.WebSocket webSocket = Context.WebSocket;
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
                var responseData = Encoding.UTF8.GetBytes(System.Text.Json.JsonSerializer.Serialize(response));
                webSocket.Send(responseData);
                var deviceStatus = new DeviceStatus
                {
                    webSocket = webSocket,
                    status = 1,
                    deviceSn = sn,
                    ConnectionUri = $"ws://{clientIp}:{clientPort}"
                };
                // 更新设备状态
                DeviceManager.AddDeviceAndStatus(sn, deviceStatus);
            }
            else
            {
                var errorResponse = new
                {
                    ret = "reg",
                    result = false,
                    reason = 1
                };

                var responseData = Encoding.UTF8.GetBytes(System.Text.Json.JsonSerializer.Serialize(errorResponse));
                 webSocket.Send(responseData);
                var deviceStatus = new DeviceStatus
                {
                    webSocket = webSocket,
                    status = 1,
                    deviceSn = sn,
                    ConnectionUri= $"ws://{clientIp}:{clientPort}"
                };
                // 更新设备状态
                DeviceManager.AddDeviceAndStatus(sn, deviceStatus);
            }
        }
     

        public async void GetAttendance(JObject jsonNode, RecordService recordService, string clientIp,
                                   int clientPort)
        {
            var sn = jsonNode.Value<string>("sn"); 
            int count = jsonNode.Value<int>("count"); 
            int logIndex = jsonNode.Value<int>("logindex");
            List<Record> recordAll = new List<Record>();
            DeviceStatus deviceStatus = new DeviceStatus();
            bool flag = false;
            WebSocketSharp.WebSocket webSocket = Context.WebSocket;
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
           
                webSocket.Send(Encoding.UTF8.GetBytes(response));
                deviceStatus.webSocket = webSocket;
                deviceStatus.status = 1;
                deviceStatus.deviceSn = sn;
                deviceStatus.ConnectionUri = $"ws://{clientIp}:{clientPort}";
                // 更新设备状态
                DeviceManager.AddDeviceAndStatus(sn, deviceStatus);
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
                webSocket.Send(Encoding.UTF8.GetBytes(response));
                deviceStatus.webSocket = webSocket;
                deviceStatus.status = 1;
                deviceStatus.deviceSn = sn;
                deviceStatus.ConnectionUri = $"ws://{clientIp}:{clientPort}";
                // 更新设备状态
                DeviceManager.AddDeviceAndStatus(sn, deviceStatus);
            }
        }

        private async void GetEnrollInfo(JObject jsonNode, PersonService personService, EnrollinfoService enrollinfoService, string clientIp,
                                   int clientPort)
        {
            // 创建日期格式化器
               var sn = jsonNode.Value<string>("sn");
            var signatures1 = jsonNode.Value<string>("record");
            bool flag = false;
            DeviceStatus deviceStatus = new DeviceStatus();
            WebSocketSharp.WebSocket webSocket = Context.WebSocket;
            if (string.IsNullOrEmpty(signatures1))
            {
                var response = "{\"ret\":\"senduser\",\"result\":false,\"reason\":1}";
                var responseData = Encoding.UTF8.GetBytes(response);
                webSocket.Send(responseData);

                deviceStatus.webSocket = webSocket;
                deviceStatus.status = 1;
                deviceStatus.deviceSn = sn;
                deviceStatus.ConnectionUri = $"ws://{clientIp}:{clientPort}";
                // 更新设备状态
                DeviceManager.AddDeviceAndStatus(sn, deviceStatus);
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

                if (personService.SelectByPrimaryKey(enrollId) == null)
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
                var responseData = Encoding.UTF8.GetBytes(response);
                webSocket.Send(responseData);

                deviceStatus.webSocket = webSocket;
                deviceStatus.status = 1;
                deviceStatus.deviceSn = sn;
                deviceStatus.ConnectionUri = $"ws://{clientIp}:{clientPort}";
                // 更新设备状态
                DeviceManager.AddDeviceAndStatus(sn, deviceStatus);
            }
        }
        private async Task GetUserList(JToken jsonNode,  Machine_commandService machine_commandService, PersonService personService, EnrollinfoService enrollInfoService, string clientIp,
                                   int clientPort)
        {
            List<UserTemp> userTemps = new List<UserTemp>();
            var result = jsonNode.Value<bool>("result");
            int count;
            JToken records = jsonNode.Value<JArray>("record"); 
            var sn = jsonNode.Value<string>("sn"); 
            DeviceStatus deviceStatus = new DeviceStatus();
            WebSocketSharp.WebSocket webSocket = Context.WebSocket;
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
                        if (personService.SelectByPrimaryKey(userTemp.enrollId).Result == null)
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
                    var responseData = Encoding.UTF8.GetBytes(response);
                    webSocket.Send(responseData);
                    deviceStatus.ConnectionUri = $"ws://{clientIp}:{clientPort}";
                    // 更新设备状态
                    DeviceManager.AddDeviceAndStatus(sn, deviceStatus);
                }
            }
            if (sn != null)
            {
              await  UpdateCommandStatusx(sn, "getuserlist", machine_commandService);
            }
        }
        public async void GetUserInfo(JToken jsonNode, EnrollinfoService enrollinfoService, PersonService personService, Machine_commandService machine_Commandservice)
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

                if (personService.SelectByPrimaryKey(enrollId).Result == null)
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

        public async void updateCommandStatus(string serial, string commandType, Machine_commandService machine_Commandservice)
        {
            if (serial != null)
            {
                List<Machine_command> machineCommand =await  machine_Commandservice.FindPendingCommand(1, serial);
                if (machineCommand.Count() > 0 && machineCommand[0].Name.Equals(commandType))
                {
                    DateTime dt = DateTime.Now;
                   await   machine_Commandservice.UpdateCommandStatus(1, 0, dt, machineCommand[0]);

                }
            }
        }
        //	// 获取全部打卡记录
        private async void GetAllLog(JToken jsonNode, Machine_commandService machine_commandService, RecordService recordsService, string clientIp,
                                   int clientPort)
        {
            var result = jsonNode.Value<bool>("result");
            var recordAll = new List<Record>();
            var sn = jsonNode.Value<string>("sn");
            if (!sn.IsNullOrEmpty())
            {
                var records = jsonNode["record"];
                var deviceStatus = new DeviceStatus();
                int count;
                WebSocketSharp.WebSocket webSocket = Context.WebSocket;
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
                        var responseData = Encoding.UTF8.GetBytes(response);
                        webSocket.Send(responseData);
                        deviceStatus.webSocket = webSocket;
                        deviceStatus.status = 1;
                        deviceStatus.deviceSn = sn;
                        deviceStatus.ConnectionUri = $"ws://{clientIp}:{clientPort}";
                        // 更新设备状态
                        DeviceManager.AddDeviceAndStatus(sn, deviceStatus);
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
        // 获取全部打卡记录
        private async void GetNewLog(JToken jsonNode,  Machine_commandService machine_commandService, RecordService recordsService, string clientIp,
                                   int clientPort)
        {
            var result = jsonNode.Value<bool>("result");
            var recordAll = new List<Record>();
            var sn = jsonNode.Value<string>("sn");
            var records = jsonNode["record"];
            var deviceStatus = new DeviceStatus();
            int count;
            WebSocketSharp.WebSocket webSocket = Context.WebSocket;
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
                    var responseData = Encoding.UTF8.GetBytes(response);
                    webSocket.Send(responseData);
                    deviceStatus.webSocket = webSocket;
                    deviceStatus.status = 1;
                    deviceStatus.deviceSn = sn;
                    deviceStatus.ConnectionUri = $"ws://{clientIp}:{clientPort}";
                    // 更新设备状态
                    DeviceManager.AddDeviceAndStatus(sn, deviceStatus);
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