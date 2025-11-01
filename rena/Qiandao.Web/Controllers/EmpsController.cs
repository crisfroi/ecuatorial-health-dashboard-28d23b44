using Microsoft.AspNetCore.Mvc;
using Qiandao.Model.Entity;
using Qiandao.Model.Response;
using Qiandao.Service;


// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Qiandao.Web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmpsController : ControllerBase
    {
        private readonly ILogger<EmpsController> _logger;
   
        private readonly PersonService? personServer; // 假设这是接口名称
        private readonly EnrollinfoService? enrollinfoService;
        public EmpsController(ILogger<EmpsController> logger,
                             PersonService personServer,
                             EnrollinfoService enrollinfoService)
        {
            _logger = logger;
            this.personServer = personServer;
            this.enrollinfoService = enrollinfoService;
        }
        private IActionResult View()
        {
            throw new NotImplementedException();
        }
        //查询人员
        [HttpGet]
        public IActionResult GetEmps(int page = 1, int limit = 10, string name = "")
        {
            if (personServer == null)
            {
                return BadRequest("Person service not initialized.");
            }

            ResponseModel rm = personServer.GetPersonList(page, limit);
            ResponseModel rmx = personServer.GetPersonList(1, 10000);
            if (rm == null)
            {
                return NotFound("No data found.");
            }
            if (rmx == null)
            {
                return NotFound("No data found.");
            }
            if (rm.Data == null)
            {
                return Ok(new { count = 0, data = new List<Person>() });
            }

            var mappedData = MapPersonsToUserInfos(rm.Data, name);

            return Ok(new { code=0, msg= "success", count = rmx.Data.Count, data = mappedData });
        }

        private List<UserInfo> MapPersonsToUserInfos(List<Person> persons,String name)
        {
            var emps = new List<UserInfo>();
            foreach (var person in persons)
            {
                var userInfo = new UserInfo
                {
                    EnrollId = person.Id,
                    Admin = person.Roll_id,
                    Name = person.Name,
                };
                if (enrollinfoService != null) { 
                var enrollInfo = enrollinfoService.SelectEnrollById(person.Id);
                if (enrollInfo != null)
                {
                    if ((enrollInfo.Data != null)&& (enrollInfo.Data.ImagePath != null)) {
                    userInfo.ImagePath = enrollInfo.Data.ImagePath;
                    }
                }
                emps.Add(userInfo);
                }
            }
            return emps;
        }
    }
}
