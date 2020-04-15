using System.IO;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using PhotoBook.DataManager;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using NLog;
using PhotoBook.Common;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.Primitives;

namespace PhotoBook.Creator.Controllers
{
    [Authorize(AuthenticationSchemes = "cookies")]
    public class ImagesController : ControllerBase
    {
        public readonly Logger Logger = LogManager.GetCurrentClassLogger();
        protected readonly DataContext Context;
        public IConfiguration Configuration { get; }

        public ImagesController(IConfiguration iConfiguration, DataContext context)
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
        private string _photosLocation;
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
        
        public Common.Helpers Helpers => _helpers ??= new Common.Helpers(PhotosLocation, Configuration, new HttpContextAccessor(), Configuration["ConnectionStrings:PhotoBookConnection"]);

        private Helpers _helpers;


        // GET: Images
        [ResponseCache(Duration = /* 1 month */ 2592000)]
        [HttpGet("images/get/{id}")]
        public ActionResult Get([FromRoute] long id)
        {
            var image = Context.Thumbnails.FirstOrDefault(t => t.Id == id);
            return File(image?.Bytes ?? new byte[0], "image/jpg");
        }

        [ResponseCache(Duration = /* 1 month */ 2592000)]
        [HttpGet("images/full/{id}")]
        public ActionResult Full(long id)
        {
            var image = Context.Thumbnails
                .Include(t=> t.FileSystemFolder)
                .FirstOrDefault(t => t.Id == id);

            if (image == null)
            {
                return new NotFoundResult();
            }
            var fileName = Helpers.GetFullPath(image);
            if (!System.IO.File.Exists(fileName))
            {
                return new NotFoundResult();
            }
            using (var img = Image.Load(fileName))
            {
                Helpers.ExifRotate(img);
                
                var bytes = Helpers.ImageToByteArray(img);
                return File(bytes, "image/jpg", image.FileName);
            }
        }

        [HttpGet]
        [Route("images/face/{id}")]
        public ActionResult Face(int id)
        {
            var image = Context.Faces.FirstOrDefault(t => t.Id == id);
            return File(image?.Bytes ?? new byte[0], "image/jpg");
        }

        [HttpGet]
        [Route("images/get/{id}/face")]
        public ActionResult InMemoryFace(long id, [FromQuery] double x, [FromQuery] double y, [FromQuery] double w, [FromQuery] double h)
        {
            var image = Context.Thumbnails.Include(t=> t.FileSystemFolder).FirstOrDefault(t => t.Id == id);
            if (image != null)
            {
                var img = Image.Load(Helpers.GetFullPath(image));
                img.Mutate(i => i
                    .AutoOrient()
                    .Crop(new Rectangle((int)x, (int)y, (int)w, (int)h)));
                using (var ms = new MemoryStream())
                {
                    img.SaveAsJpeg(ms);
                    return File(ms.ToArray(), "image/jpg");
                }
            }

            return NotFound();
        }
    }
}
