using Microsoft.AspNetCore.Mvc;
using Qiandao.Model.Entity;
using Qiandao.Model.Request;
using Qiandao.Model.Response;
using Qiandao.Service;
using Qiandao.Web.WebSocketHandler;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Qiandao.Web.Controllers
{
    [Route("api/")]
    [ApiController]
    public class DeviceController : ControllerBase
    {

        private readonly ILogger<DeviceController> _logger;
        private readonly DeviceService? deviceServer;
        private readonly PersonService? personService;
        private readonly EnrollinfoService? enrollinfoService;
        private readonly Access_dayService? access_dayService;
        private readonly Access_weekService? accessWeekService;
        private readonly RecordService recordService;
        private readonly DeviceManager _deviceManager; // Agregado
        public DeviceController(ILogger<DeviceController> logger, DeviceService deviceServer, PersonService personService, EnrollinfoService enrollinfoService, Access_dayService? access_dayService, Access_weekService? accessWeekService, RecordService recordService, DeviceManager deviceManager) // Agregado deviceManager
        {
            _logger = logger;
            this.deviceServer = deviceServer;
            this.personService = personService;
            this.enrollinfoService = enrollinfoService;
            this.access_dayService = access_dayService;
            this.accessWeekService = accessWeekService;
            this.recordService = recordService;
            _deviceManager = deviceManager; // Asignado
        }
        private IActionResult View()
        {
            throw new NotImplementedException();
        }
        [HttpGet("device")]
        public async Task<IActionResult> GetDevice()
        {
            if (deviceServer == null)
            {
                return BadRequest("deviceServer service not initialized.");
            }
            ResponseModel rm =await deviceServer.GetdeviceallList();
            return Ok(new { code = 0, msg = "success", count = rm.Data.Count, data = rm.Data });
        }
        /// <summary>
        /// 从设备中删除指定的人
        /// </summary>
        /// <param name="enrollId">注册ID</param>
        /// <param name="deviceSn">设备序列号</param>
        /// <returns></returns>
        [HttpGet("deletePersonFromDevice")]
        public IActionResult DeletePersonFromDevice(int enrollId, string deviceSn)
        {
            if (personService == null)
            {
                return BadRequest("personService service not initialized.");
            }
            // 假设有一个方法用于删除人员
            ResponseModel model = personService.DeleteUserInfoFromDevice(enrollId, deviceSn);
            if (model.Code == 200)
            {
                return Ok(new { code = 0, msg = "delete success" });
            }
            else
            {
                return BadRequest(new { code = 1, msg = "delete fail" });
            }
        }
        //    /* 获取单个用户 */
        [HttpGet("sendGetUserInfo")]
        public IActionResult sendGetUserInfo(int enrollId, int backupNum, string deviceSn)
        {
            if (this.deviceServer == null)
            {
                return BadRequest("deviceServer service not initialized.");
            }
            // 假设有一个方法用于删除人员
            ResponseModel model = this.deviceServer.addGetOneUserCommand(enrollId, backupNum, deviceSn);
            if (model.Code == 200)
            {
                return Ok(new { code = 0, msg = "down success" });
            }
            else
            {
                return BadRequest(new { code = 1, msg = "down fail" });
            }
        }
        [HttpGet("sendWs")]
        public async Task<IActionResult> sendWs(string deviceSn)
        {
            if (deviceServer == null)
            {
                return BadRequest("deviceServer service not initialized.");
            }
            ResponseModel model =await deviceServer.sendWs(deviceSn);
            if (model.Code == 200)
            {
                return Ok(new { code = 0, msg = "success" });
            }
            else
            {
                return BadRequest(new { code = 1, msg = "fail" });
            }
        }
        [HttpGet("getUserInfo")]
        public async  Task<IActionResult> getUserInfo(string deviceSn)
        {
            if (personService == null)
            {
                return BadRequest("personService service not initialized.");
            }
           ResponseModel model =await personService.getUserInfo(deviceSn);
            if (model.Code == 200)
            {
                return Ok(new { code = 0, msg = "success" });
            }
            else
            {
                return BadRequest(new { code = 1, msg = "fail" });
            }
        }

        [HttpGet("setPersonToDevice")]
        public IActionResult setPersonToDevice(string deviceSn)
        {
            if (personService == null)
            {
                return BadRequest("personService service not initialized.");
            }
            personService.setUserToDevice2(deviceSn);
                return Ok(new { code = 0, msg = "success" });
           
        }

        [HttpGet("accessDays")]
        public async Task<IActionResult> accessDays()
        {
            if (access_dayService == null)
            {
                return BadRequest("access_dayService service not initialized.");
            }
            ResponseModel model =await access_dayService.Getaccess_dayList();
            if (model.Code == 200)
            {
                return Ok(new { code = 0, msg = "success", accessdays = model.Data });
            }
            else
            {
                return BadRequest(new { code = 1, msg = "fail" });
            }
        }
        //重写
        [HttpGet("accessWeek")]
        public async Task<IActionResult> accessWeek(int id)
        {
            if (accessWeekService == null)
            {
                return BadRequest("accessWeekService service not initialized.");
            }
            ResponseModel model =  accessWeekService.selectByPrimaryKey(id);
            if (model.Code == 200)
            {
                return Ok(new { code = 0, msg = "success", accessweek = model.Data });
            }
            else
            {
                return BadRequest(new { code = 1, msg = "fail" });
            }
        }
        [HttpPost("setAccessDay")]
        public async Task<IActionResult> setAccessDay([FromBody] Model.Request.Addaccess_day accessDay, string deviceSn)
        {
            if (accessDay == null)
            {
                return BadRequest("Access_day  is null.");
            }
            if (access_dayService == null)
            {
                return BadRequest("access_dayService service not initialized.");
            }
            if (deviceServer == null)
            {
                return BadRequest("deviceServer service not initialized.");
            }
            if (access_dayService.selectByPrimaryKey(accessDay.Id).Data != null)
            {
                access_dayService.UpdateAddaccess_day(accessDay);
            }
            else
            {
                access_dayService.Addaccess_day(accessDay);
            }

            ResponseModel deviceModel =await deviceServer.GetdeviceallList(deviceSn);
            if (deviceModel.Data != null)
            {
                List<Device> deviceList = deviceModel.Data;
                if (deviceList != null)
                {
                    ResponseModel model = await access_dayService.SetAccessDay(deviceList);
                    if (model.Code == 200)
                    {
                        return Ok(new { code = 0, msg = "success", Data = model.Data });
                    }
                    else
                    {
                        return BadRequest(new { code = 1, msg = "fail" });
                    }
                }
                else
                {
                    return BadRequest(new { code = 1, msg = "fail" });
                }
            }
            else
            {
                return BadRequest(new { code = 1, msg = "fail" });
            }
        }
        [HttpPost("setAccessWeek")]
        public async Task<IActionResult> setAccessWeek([FromBody] Addaccess_week accessWeek, string deviceSn)
        {

            if (accessWeekService == null)
            {
                return BadRequest("accessWeekService service not initialized.");
            }
            if (deviceServer == null)
            {
                return BadRequest("deviceServer service not initialized.");
            }
            if (accessWeekService.selectByPrimaryKey(accessWeek.Id).Code == 200)
            {
                accessWeekService.updateByPrimaryKey(accessWeek);
            }
            else
            {
                accessWeekService.Addaccess_week(accessWeek);
            }
                ResponseModel deviceModel = await deviceServer.GetdeviceallList(deviceSn);
                if (deviceModel.Data != null)
                {
                    List<Device> deviceList = deviceModel.Data;
                    if (deviceList != null)
                    {
                        ResponseModel model = await accessWeekService.SetAccessWeek(deviceList);
                        if (model.Code == 200)
                        {
                            return Ok(new { code = 0, msg = "success", Data = model.Data });
                        }
                        else
                        {
                            return BadRequest(new { code = 1, msg = "fail" });
                        }
                    }
                    else
                    {
                        return BadRequest(new { code = 1, msg = "fail" });
                    }
                }
                else
                {
                    return BadRequest(new { code = 1, msg = "fail" });
                }
            
        }
        [HttpPost("setLocckGroup")]
        public async Task<IActionResult> setLocckGroup([FromBody] LockGroup lockGroup, string deviceSn)
        {
            if (deviceServer == null)
            {
                return BadRequest("deviceServer service not initialized.");
            }
            if (enrollinfoService == null)
            {
                return BadRequest("enrollinfoService service not initialized.");
            }
            ResponseModel deviceModel =await  deviceServer.GetdeviceallList(deviceSn);
            if (deviceModel.Data != null)
            {
                List<Device> deviceList = deviceModel.Data;
                if (deviceList != null)
                {
                    ResponseModel model = enrollinfoService.SetLockGroup(lockGroup, deviceList);
                    if (model.Code == 200)
                    {
                        return Ok(new { code = 0, msg = "success" });
                    }
                    else
                    {
                        return BadRequest(new { code = 1, msg = "fail" });
                    }
                }
                else
                {
                    return BadRequest(new { code = 1, msg = "fail" });
                }
            }
            else
            {
                return BadRequest(new { code = 1, msg = "fail" });
            }
        }
        [HttpPost("setUserLock")]
        public async Task<IActionResult> setUserLock([FromBody] UserLock userLock, string deviceSn)
        {
            if (deviceServer == null)
            {
                return BadRequest("deviceServer service not initialized.");
            }
            if (enrollinfoService == null)
            {
                return BadRequest("enrollinfoService service not initialized.");
            }
            ResponseModel deviceModel =await deviceServer.GetdeviceallList(deviceSn);
            if (deviceModel.Data != null)
            {
                List<Device> deviceList = deviceModel.Data;
                if (deviceList != null)
                {
                    ResponseModel model = enrollinfoService.SetUserLock(userLock, deviceList);
                    if (model.Code == 200)
                    {
                        return Ok(new { code = 0, msg = "success" });
                    }
                    else
                    {
                        return BadRequest(new { code = 1, msg = "fail" });
                    }
                }
                else
                {
                    return BadRequest(new { code = 1, msg = "fail" });
                }
            }
            else
            {
                return BadRequest(new { code = 1, msg = "fail" });
            }
        }

        [HttpGet("getDeviceInfo")]
        public IActionResult getDeviceInfo(string deviceSn)
        {
            if (deviceSn == null)
            {
                return BadRequest("deviceSn not initialized.");
            }
            if (enrollinfoService == null)
            {
                return BadRequest("enrollinfoService Server not initialized.");
            }
            ResponseModel model = enrollinfoService.GetDeviceInfo(deviceSn);
            if (model.Code == 200)
            {
                return Ok(new { code = 0, msg = "success" });
            }
            else
            {
                return BadRequest(new { code = 1, msg = "fail" });
            }
        }
        [HttpGet("openDoor")]
        public IActionResult openDoor(int doorNum, string deviceSn)
        {
            if (doorNum == 0)
            {
                return BadRequest("doorNum not initialized.");
            }
            if (deviceSn == null)
            {
                return BadRequest("deviceSn not initialized.");
            }
            if (enrollinfoService == null)
            {
                return BadRequest("enrollinfoService server not initialized.");
            }
            ResponseModel model = enrollinfoService.OpenDoor(doorNum, deviceSn);
            if (model.Code == 200)
            {
                return Ok(new { code = 0, msg = "success" });
            }
            else
            {
                return BadRequest(new { code = 1, msg = "fail" });
            }
        }

        [HttpGet("getDevLock")]
        public IActionResult getDevLock(string deviceSn)
        {
            if (deviceSn == null)
            {
                return BadRequest("deviceSn not initialized.");
            }
            if (enrollinfoService == null)
            {
                return BadRequest("enrollinfoService Server not initialized.");
            }
            ResponseModel model = enrollinfoService.getDevLock(deviceSn);
            if (model.Code == 200)
            {
                return Ok(new { code = 0, msg = "success" });
            }
            else
            {
                return BadRequest(new { code = 1, msg = "fail" });
            }
        }
        [HttpGet("geUSerLock")]
        public IActionResult getUSerLock(int enrollId, string deviceSn)
        {
            if (enrollId == 0)
            {
                return BadRequest("doorNum not initialized.");
            }
            if (deviceSn == null)
            {
                return BadRequest("deviceSn not initialized.");
            }
            if (enrollinfoService == null)
            {
                return BadRequest("enrollinfoService server not initialized.");
            }
            ResponseModel model = enrollinfoService.getUSerLock(enrollId, deviceSn);
            if (model.Code == 200)
            {
                return Ok(new { code = 0, msg = "success" });
            }
            else
            {
                return BadRequest(new { code = 1, msg = "fail" });
            }
        }
        [HttpGet("cleanAdmin")]
        public IActionResult cleanAdmin(string deviceSn)
        {
            if (deviceSn == null)
            {
                return BadRequest("deviceSn not initialized.");
            }
            if (enrollinfoService == null)
            {
                return BadRequest("enrollinfoService server not initialized.");
            }
            ResponseModel model = enrollinfoService.cleanAdmin(deviceSn);
            if (model.Code == 200)
            {
                return Ok(new { code = 0, msg = "success" });
            }
            else
            {
                return BadRequest(new { code = 1, msg = "fail" });
            }
        }
        [HttpGet("synchronizeTime")]
        public async Task<IActionResult> synchronizeTime(string deviceSn)
        {
            if (deviceSn == null)
            {
                return BadRequest("deviceSn not initialized.");
            }
            if (enrollinfoService == null)
            {
                return BadRequest("enrollinfoService server not initialized.");
            }
            DateTime dt = DateTime.Now;
            string message = "{\"cmd\":\"settime\",\"cloudtime\":\"" + dt + "\"}";
            if (await _deviceManager.GetDeviceSocketBySn(deviceSn) != null) // Usar _deviceManager
            {
             await   _deviceManager.SendMessageToDeviceStatusAsync(deviceSn, message); // Usar _deviceManager
                return Ok(new { code = 0, msg = "successs" });
            }
            else { return Ok(new { code = 1, msg = "error" }); }
        }
        [HttpGet("records")]
        public IActionResult records(int page, int limit, string? deviceSn)
        {
            if (recordService == null)
            {
                return BadRequest("recordService server not initialized.");
            }
            ResponseModel model = recordService.GetAllLogFromDB(page, limit, deviceSn);
            ResponseModel modelx = recordService.GetAllLogFromDB(1, 100000, deviceSn);
            if (model.Code == 200)
            {
                return Ok(new { code = 0, msg = "成功", data = model.Data, count = modelx.Data.Count });
            }
            else
            {
                return BadRequest(new { code = 1, msg = "失败" });
            }
        }
        [HttpGet("getAllLog")]
        public IActionResult getAllLog(string? deviceSn)
        {
            if (deviceSn == null)
            {
                return BadRequest("deviceSn not initialized.");
            }
            ResponseModel model = recordService.GetrecordList(deviceSn);
            if (model.Code == 200)
            {
                return Ok(new { code = 0, msg = "成功", data = model.Data, count = model.Data.Count });
            }
            else
            {
                return BadRequest(new { code = 1, msg = "失败" });
            }
        }

        [HttpGet("getNewLog")]
        public IActionResult getNewLog(string? deviceSn)
        {
            if (enrollinfoService == null)
            {
                return BadRequest("enrollinfoService server not initialized.");
            }
            if (deviceSn == null)
            {
                return BadRequest("deviceSn not initialized.");
            }
            ResponseModel model = enrollinfoService.getNewLog(deviceSn);
            if (model.Code == 200)
            {
                return Ok(new { code = 0, msg = "成功" });
            }
            else
            {
                return BadRequest(new { code = 1, msg = "失败" });
            }
        }
        [HttpGet("collectLog")]
        public IActionResult collectLog(string? deviceSn)
        {
            if (enrollinfoService == null)
            {
                return BadRequest("enrollinfoService server not initialized.");
            }
            if (deviceSn == null)
            {
                return BadRequest("deviceSn not initialized.");
            }
            ResponseModel model = enrollinfoService.collectLog(deviceSn);
            if (model.Code == 200)
            {
                return Ok(new { code = 0, msg = "成功" });
            }
            else
            {
                return BadRequest(new { code = 1, msg = "失败" });
            }
        }
    }
}
