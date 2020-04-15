using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using NLog;

namespace PhotoBook.Creator.Filters
{
    /// <summary>
    /// Custom attributes for handling errors associated with an ajax request
    /// </summary>
    public class AjaxErrorHandlerAttribute : ExceptionFilterAttribute
    {
        public static Logger Logger = LogManager.GetCurrentClassLogger();
        /// <summary>
        /// Handles the exception
        /// </summary>
        /// <param name="filterContext">context of the exception being thrown</param>
        public override void OnException(ExceptionContext filterContext)
        {
            var exception = filterContext.Exception;
            filterContext.ExceptionHandled = true;
            Logger.Error(exception, $"Ajax error: {exception.Message}. {exception}");
            if (exception is DbUpdateConcurrencyException)
            {
                var ex = (DbUpdateConcurrencyException)exception;
                if (ex.InnerException != null)
                {
                    exception = ex.InnerException;
                }
                Logger.Error(ex, $"Database concurrency exception: {ex.Message} { ex}");
                filterContext.Result = new JsonResult(new
                {
                    success = false,
#if DEBUG || TEST
                    error = ex.ToString(),
                    //entites = entities
                    entities = ex.Entries.Select(e => new { type = e.Entity.GetType().Name })
#else
                        error = ex.Message
#endif

                }, new JsonSerializerOptions
                {
                    WriteIndented = true,
                });
            }
            else
            {
                filterContext.Result = new JsonResult(new
                {
                    success = false,
#if DEBUG || TEST
                    error = exception.ToString()
#else
                        error = exception.Message
#endif

                }, new JsonSerializerOptions
                {
                    WriteIndented = true,
                });
            }
            filterContext.HttpContext.Response.StatusCode = (int)HttpStatusCode.BadRequest;
        }
    }
}