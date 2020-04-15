using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using PhotoBook.DataManager;
using PhotoBook.Creator.Models;
using PhotoBook.Creator.Filters;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace PhotoBook.Creator.Controllers
{
    public class PhotosController : BaseController
    {
        public PhotosController(IConfiguration iConfiguration, DataContext context) : base(iConfiguration, context)
        {}

        [HttpGet]
        [Route("api/Photos/Get")]
        [AjaxErrorHandler]
        // GET: Photos
        public ContentResult Get(long id)
        {
            var thumbnail = Context.Thumbnails
                .Include(t => t.Comments)
                .Include(t => t.PhotoBooks)
                .Include(t => t.Faces).ThenInclude(tt => tt.Tag)
                .Include(t => t.TagThumbnails)
                .ThenInclude(tt => tt.Tag)
                .ThenInclude(tag => tag.TagType)
                .FirstOrDefault(t => t.Id == id);
            if (thumbnail == null)
            {
                return AjaxFailedResult("Image not found.");
            }
            return AjaxResult(thumbnail.ToImageDto());
        }

        // Add: PhotoItem
        [HttpPost]
        [Route("api/Photos/Remove")]
        [AjaxErrorHandler]
        public ContentResult Remove(long id)
        {
            var thumbnail = Context.Thumbnails.FirstOrDefault(t => t.Id == id);
            if (thumbnail == null)
            {
                return AjaxFailedResult("Image not found.");
            }

            thumbnail.Hide = !thumbnail.Hide;
            Context.Entry(thumbnail).State = EntityState.Modified;
            Context.SaveChanges();

            return AjaxResult<bool>(thumbnail.Hide, $"{ thumbnail.FileName } is now {(thumbnail.Hide ? "hidden" : "displayed")}.");
        }


        // GET: Photos
        [Route("api/Photos/Scan")]
        [AjaxErrorHandler]
        public async Task<ContentResult> Scan(long id)
        {
            var imagesToScan = new List<long> { id };
            var thumbnail = Context.Thumbnails.FirstOrDefault(t => t.Id == id);
            if (thumbnail == null)
            {
                return AjaxFailedResult("Image doesn't exist");
            }

            if (thumbnail.LastUpdated.HasValue && (DateTime.Now - thumbnail.LastUpdated.Value).TotalMinutes < 1)
            {
                return AjaxFailedResult("Recently fetched this folder.  Please wait 1 minute.");
            }

            Context.Entry(thumbnail).State = EntityState.Modified;
            Context.SaveChanges();

            var start = DateTime.Now;

            return await Task.Factory.StartNew(() =>
            {
                Thread.CurrentThread.IsBackground = true;
                try
                {
                    Helpers.ScanImages(imagesToScan);
                    using (var dataContext = GetNewDataContext())
                    {
                        var updatedThumbnail = dataContext.Thumbnails
                            .Include(t => t.Comments)
                            .Include(t => t.PhotoBooks)
                            .Include(t => t.Faces).ThenInclude(tt => tt.Tag)
                            .Include(t => t.TagThumbnails)
                            .ThenInclude(tt => tt.Tag)
                            .ThenInclude(tag => tag.TagType)
                            .First(t => t.Id == id);
                        var newFaces = updatedThumbnail.Faces.Count(f => f.Created >= start);
                        var updatedFaces = updatedThumbnail.Faces.Count(f => f.LastUpdated >= start);
                        return AjaxResult(updatedThumbnail.ToImageDto(), $"{newFaces} new faces, {updatedFaces} updated faces");
                    }
                }
                catch (Exception ex)
                {
                    Logger.Error(ex, $"Failed to scan images, {ex.Message}: {ex}");
                    return AjaxFailedResult("Failed to scan images.");
                }
            });
        }
    }
}
