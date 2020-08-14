using Microsoft.AspNetCore.Mvc;
using System.Linq;
using Microsoft.Extensions.Logging;
using PhotoBook.DataManager;
using Microsoft.AspNetCore.Authorization;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using PhotoBook.Creator.Filters;
using PhotoBook.Creator.Models;

namespace PhotoBook.Creator.Controllers
{
    public class FoldersController : BaseController
    {
        public FoldersController(IConfiguration iConfiguration, DataContext context) : base(iConfiguration, context)
        { }

        [HttpGet("[action]")]
        [AjaxErrorHandler]
        // GET: Photos
        public IEnumerable<FileSystemFolderDto> Get()
        {
            return Context.FileSystemFolders.ToList().Select(f => f.ToFolderDto()).ToList();
        }
    }
}
