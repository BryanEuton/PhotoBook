using Microsoft.AspNetCore.Mvc;
using NLog;

namespace PhotoBook.Creator.Controllers
{
    public class LogPost
    {
        public string Error { get; set; }
    }

    public class ClientController : ControllerBase
    {
        public readonly Logger Logger = LogManager.GetCurrentClassLogger();

        [HttpPost]
        [Route("api/Client/Log/Error")]
        public ContentResult ErrorOccurred(LogPost data)
        {
            Logger.Error($"Clientside error: {data?.Error}");
            return Content("");
        }
        [HttpGet]
        [Route("api/Client/Cookies/Clear")]
        public ContentResult ClearCookies()
        {
            foreach (var cookie in Request.Cookies.Keys)
            {
                Response.Cookies.Delete(cookie);
            }
            return Content("");
        }
    }
}
