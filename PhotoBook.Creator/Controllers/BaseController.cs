using System;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using Microsoft.Extensions.Logging;
using PhotoBook.DataManager;
using Microsoft.AspNetCore.Authorization;
using System.Collections.Generic;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using PhotoBook.Creator.Models;
using NLog;
using NLog.Extensions.Logging;
using PhotoBook.Common;

namespace PhotoBook.Creator.Controllers
{
    [Authorize(AuthenticationSchemes = "jwt")]
    [ApiController]
    public class BaseController : ControllerBase
    {
        private readonly Logger _logger = LogManager.GetCurrentClassLogger();
        protected readonly DataContext Context;
        public IConfiguration Configuration { get; }
        public BaseController(IConfiguration iConfiguration, DataContext context)
        {
            JsonConvert.DefaultSettings = () => new JsonSerializerSettings
            {
#if !RELEASE
                Formatting = Formatting.Indented,
#endif
                TypeNameHandling = TypeNameHandling.Objects,
                ContractResolver = new CamelCasePropertyNamesContractResolver()
            };
            Configuration = iConfiguration;
            Context = context;
        }

        protected DataContext GetNewDataContext()
        {
            var loggingFactory = new LoggerFactory(new[] { new NLogLoggerProvider() });
            var builder = new DbContextOptionsBuilder<DataContext>();
            builder.UseLoggerFactory(loggingFactory);
            builder.UseSqlServer(Configuration["ConnectionStrings:PhotoBookConnection"]);
#if DEBUG
            builder.EnableSensitiveDataLogging(true);
#endif
            return new DataContext(builder.Options, new HttpContextAccessor());
        }

        protected string GetUserName => User.FindFirstValue(ClaimTypes.NameIdentifier);
        protected bool IsAdmin => User.FindFirstValue("isAdmin")?.Equals("True", StringComparison.CurrentCultureIgnoreCase) ?? true;
        protected bool IsGuest => User.FindFirstValue("isGuest")?.Equals("True", StringComparison.CurrentCultureIgnoreCase) ?? true;
        public Common.Helpers Helpers => _helpers ??= new Common.Helpers(PhotosLocation, Configuration, new HttpContextAccessor(), Configuration["ConnectionStrings:PhotoBookConnection"]);

        private string _photosLocation;
        private Helpers _helpers;

        public string PhotosLocation
        {
            get
            {
                if (string.IsNullOrEmpty(_photosLocation))
                {
                    _photosLocation = Configuration["ImageProcessing:PhotosLocation"];
                }
                return _photosLocation;
            }
        }
        protected ContentResult AjaxResult<T>(T obj, string message = null, T undoArgs = default(T), string undoUrl = null)
        {
            return Content(JsonConvert.SerializeObject(new JsonResponse<T>(true, obj, undoUrl, undoArgs, message)), "application/json");
        }
        protected ContentResult AjaxFailedResult(string message)
        {
            return Content(JsonConvert.SerializeObject(new JsonResponse<string>(false, null, null, null, message)), "application/json");
        }
        protected ContentResult AjaxResult<T>(T obj, int totalResults, string message = null)
        {
            return Content(JsonConvert.SerializeObject(new PagedResults<T>(obj, totalResults, message)), "application/json");
        }
    }
}
