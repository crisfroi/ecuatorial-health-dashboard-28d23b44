using Microsoft.AspNetCore.Mvc;
using Qiandao.Service;

namespace Qiandao.Web.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly Db _db;

        public HomeController(ILogger<HomeController> logger, Db db)
        {
            _logger = logger;
            _db = db;
        }

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

        /// <summary>
        /// Health check endpoint for monitoring and Render deployment
        /// </summary>
        [HttpGet("/health")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public IActionResult Health()
        {
            try
            {
                // Test database connection
                _db.Database.CanConnect();

                return Ok(new
                {
                    status = "healthy",
                    timestamp = DateTime.UtcNow,
                    environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "unknown",
                    service = "Qiandao SDK"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Health check failed");
                return StatusCode(503, new
                {
                    status = "unhealthy",
                    message = ex.Message,
                    timestamp = DateTime.UtcNow
                });
            }
        }
    }
}
