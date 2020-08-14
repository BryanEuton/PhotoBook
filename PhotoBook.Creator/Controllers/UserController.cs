using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Common.IdentityManager.Models;
using Microsoft.AspNetCore.Identity;
using PhotoBook.DataManager;
using PhotoBook.Creator.Filters;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PhotoBook.Creator.Models;
using PhotoBook.DataManager.Models;

namespace PhotoBook.Creator.Controllers
{
    public class UserController : BaseController
    {
        private readonly UserManager<ApplicationUser> _userManager;
        public UserController(IConfiguration iConfiguration, DataContext context,
            UserManager<ApplicationUser> userManager) : base(iConfiguration, context)
        {
            _userManager = userManager;
        }

        [HttpGet]
        [Route("api/Users/Get")]
        [AjaxErrorHandler]
        // GET: Users
        public ContentResult Get()
        {
            if (!IsAdmin)
            {
                return AjaxFailedResult("Restricted call.  You must be an admin.");
            }

            var users = _userManager.Users.Where(u => u.IsActive).ToList();
            return AjaxResult(users.Select(u => u.ToUserDto()).ToList());
        }
    }
}
