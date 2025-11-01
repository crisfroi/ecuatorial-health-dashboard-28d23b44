using Microsoft.AspNetCore.Mvc;

namespace Qiandao.Web.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
        public IActionResult One()
        {
            return View();
        }
        public IActionResult Chat()
        {
            return View();
        }
    }
}
