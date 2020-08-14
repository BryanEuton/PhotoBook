using System;
using System.IO;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using Microsoft.Extensions.Logging;
using PhotoBook.DataManager;
using Microsoft.AspNetCore.Authorization;
using PhotoBook.Creator.Models;
using System.Collections.Generic;
using System.IO.Compression;
using System.Net.Mime;
using System.Security.Claims;
using IdentityServer4.Extensions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PhotoBook.Creator.Filters;
using PhotoBook.DataManager.Models;

namespace PhotoBook.Creator.Controllers
{
    public class PhotoBooksController : BaseController
    {
        private IHostingEnvironment _env;
        public PhotoBooksController(IHostingEnvironment env, IConfiguration iConfiguration, DataContext context) : base(iConfiguration, context)
        {
            _env = env;
        }

        [HttpGet]
        [Route("api/PhotoBook/Get")]
        [AjaxErrorHandler]
        // GET: Photos
        public IEnumerable<PhotoBookDto> Get()
        {
            var myId = User.GetSubjectId();
            return Context.PhotoBooks
                .Where(p=> (IsAdmin || (IsGuest && p.WhitelistIds.Contains(myId))) && !p.BlacklistIds.Contains(myId))
                .Select(photoBook => photoBook.ToPhotoBookDto()).ToList();
        }

        [HttpGet]
        [Route("api/PhotoBook/GetDetails")]
        [AjaxErrorHandler]
        // GET: Photos
        public PhotoBookWithPhotosDto Get(long id)
        {
            var myId = User.GetSubjectId();
            var photoBook = Context.PhotoBooks
                .Include(pb => pb.Photos)
                .Where(p => (IsAdmin || (IsGuest && p.WhitelistIds.Contains(myId))) && !p.BlacklistIds.Contains(myId))
                .FirstOrDefault(pb => pb.Id == id);
            if (photoBook == null)
            {
                return null;
            }
            var photoBookWithPhotosDto = photoBook.ToPhotoBookWithPhotosDto();
            if (photoBookWithPhotosDto.NumPhotos > 0)
            {
                foreach (var photo in photoBook.Photos)
                {
                    var thumbnail = Context.Thumbnails
                        .Include(t => t.Comments)
                        .Include(t => t.PhotoBooks)
                        .Include(t => t.Faces)
                        .ThenInclude(tt => tt.Tag)
                        .Include(t => t.TagThumbnails)
                        .ThenInclude(tt => tt.Tag)
                        .ThenInclude(tag => tag.TagType)
                        .First(t => photo.ThumbnailId == t.Id);
                    photoBookWithPhotosDto.Photos.Add(thumbnail.ToImageDto());
                }
            }
            return photoBookWithPhotosDto;
        }

        // Add: PhotoItem
        [HttpPost]
        [Route("api/PhotoBook/TogglePhoto")]
        [AjaxErrorHandler]
        public ContentResult TogglePhoto(long photoBookId, long thumbnailId)
        {
            try
            {
                var photoBook = Context.PhotoBooks.Include(pb=> pb.Photos).FirstOrDefault(p => p.Id == photoBookId);
                if (photoBook == null)
                {
                    return AjaxFailedResult("PhotoBook not found.");
                }
                var thumbnail = Context.Thumbnails.FirstOrDefault(t => t.Id == thumbnailId);
                if (thumbnail == null)
                {
                    return AjaxFailedResult("Image not found.");
                }

                var photoItem = photoBook.Photos.FirstOrDefault(p => p.ThumbnailId == thumbnail.Id);
                if (photoItem != null)
                {
                    Context.Entry(photoItem).State = EntityState.Deleted;
                    Context.SaveChanges();
                    return AjaxResult<bool>(false, $"Removed { thumbnail.FileName } from { photoBook.Title }");
                }
                photoItem = new PhotoItem
                {
                    Thumbnail = thumbnail,
                    ThumbnailId = thumbnail.Id,
                    PhotoBookId = photoBook.Id,
                    PhotoBook = photoBook
                };
                photoBook.Photos.Add(photoItem);
                Context.Entry(photoBook).State = EntityState.Modified;
                Context.SaveChanges();
                return AjaxResult<bool>(true, $"Added { thumbnail.FileName } to { photoBook.Title }");

            }
            catch (Exception ex)
            {
                Logger.Error(ex, $"Failed to toggle image {thumbnailId} for photoBook {photoBookId} . {ex.Message}: {ex}");
                return AjaxFailedResult($"Failed to toggle image {thumbnailId} for photoBook {photoBookId} : {ex.Message}");
            }
        }

        [HttpPost]
        [Route("api/PhotoBook/Create")]
        [AjaxErrorHandler]
        public ActionResult Create(PhotoBook.DataManager.Models.PhotoBook photoBook)
        {
            try
            {
                Context.PhotoBooks.Add(photoBook);
                Context.Entry(photoBook).State = EntityState.Added;
                Context.SaveChanges();
                return AjaxResult(photoBook.ToPhotoBookDto(), $"Added photo book {photoBook.Title}");
            }
            catch (Exception ex)
            {
                Logger.Error(ex, $"Failed to create photo book {photoBook.Title}. {ex.Message}: {ex}");
                return AjaxFailedResult($"Failed to create photo book {photoBook.Title}: {ex.Message}");
            }
        }

        [HttpDelete]
        [Route("api/PhotoBook/Delete")]
        [AjaxErrorHandler]
        public ActionResult Delete(int id)
        {
            try
            {
                var photoBook = Context.PhotoBooks.FirstOrDefault(p => p.Id == id);
                if (photoBook == null)
                {
                    return AjaxFailedResult("Photo book not null.");
                }
                Context.Entry(photoBook).State = EntityState.Deleted;
                Context.SaveChanges();

                return AjaxResult(true, $"Deleted photo book {photoBook.Title}");
            }
            catch (Exception ex)
            {
                Logger.Error(ex, $"Failed to delete photo book {id}. {ex.Message}: {ex}");
                return AjaxFailedResult($"Failed to delete photo book {id}: {ex.Message}");
            }

        }

        [HttpPost]
        [Route("api/PhotoBook/Update")]
        [AjaxErrorHandler]
        public ActionResult Update(PhotoBook.DataManager.Models.PhotoBook photoBook)
        {
            try
            {
                var dbPhotoBook = Context.PhotoBooks.FirstOrDefault(p => p.Id == photoBook.Id);
                if (dbPhotoBook == null)
                {
                    return AjaxFailedResult("Photo book not found.");
                }
                dbPhotoBook.Title = photoBook.Title;
                dbPhotoBook.TimeFrame = photoBook.TimeFrame;
                dbPhotoBook.Whitelist = photoBook.Whitelist;
                dbPhotoBook.Blacklist = photoBook.Blacklist;

                Context.Entry(dbPhotoBook).State = EntityState.Modified;
                Context.SaveChanges();

                return AjaxResult(dbPhotoBook.ToPhotoBookDto(), $"Updated photo book{dbPhotoBook.Title}");

            }
            catch (Exception ex)
            {
                Logger.Error(ex, $"Failed to update photo book {photoBook.Title}. {ex.Message}: {ex}");
                return AjaxFailedResult($"Failed to update photo book {photoBook.Title}: {ex.Message}");
            }
        }

        // Publish: PhotoBook
        /// <summary>
        /// This will create a folder of the PhotoBook name in the PhotoBooksLocation folder.  Add/Update any images currently in this folder.
        /// </summary>
        /// <param name="id">PhotoBook Id</param>
        /// <returns>Success</returns>
        [HttpPost]
        [Route("api/PhotoBook/Publish")]
        [AjaxErrorHandler]
        public ContentResult Publish(int id)
        {
            var photoBook = Context.PhotoBooks
                .Include(pb => pb.Photos)
                .ThenInclude(p => p.Thumbnail)
                .FirstOrDefault(p => p.Id == id);
            if (photoBook == null)
            {
                return AjaxFailedResult("PhotoBook doesn't exist");
            }
            var photoBooksLocation = Configuration["ImageProcessing:PhotoBooksLocation"];
            if (string.IsNullOrWhiteSpace(photoBooksLocation))
            {
                return AjaxFailedResult("PhotoBooksLocation not found");
            }
            var dir = Path.Combine(photoBooksLocation, photoBook.Title);
            if (!Directory.Exists(dir))
            {
                Directory.CreateDirectory(dir);
            }
            else
            {
                var files = Directory.GetFiles(dir).ToList();
                foreach (var file in files)
                {
                    System.IO.File.Delete(file);
                }
            }

            foreach (var photo in photoBook.Photos.Where(p => p.Thumbnail != null && !p.Thumbnail.Hide))
            {
                var origPath = Helpers.GetFullPath(photo.Thumbnail);
                if (System.IO.File.Exists(origPath))
                {
                    var dest = Path.Combine(dir, photo.Thumbnail.FileName);
                    var idx = 0;
                    while (System.IO.File.Exists(dest))
                    {
                        dest = Path.Combine(dir, $"{++idx}_{photo.Thumbnail.FileName}");
                    }
                    System.IO.File.Copy(origPath, dest, true);
                }
            }

            return AjaxResult<bool>(true, $"{photoBook.Title} Published to {dir}");
        }

        [Authorize(AuthenticationSchemes = "cookies")]
        [ResponseCache(Duration = /* 1 month */ 2592000)]
        [HttpGet("photobooks/{id}/download")]
        // GET: Photos
        public ActionResult Download(long id)
        {
            var photoBook = Context.PhotoBooks
                .Include(pb=> pb.Photos)
                .ThenInclude(p=> p.Thumbnail)
                .FirstOrDefault(pb=> pb.Id == id);
            if (photoBook == null)
            {
                return new NotFoundResult();
            }

            var root = _env.WebRootPath;
            var tmp = Path.Combine(root, "tmp");
            if (!Directory.Exists(tmp))
            {
                Directory.CreateDirectory(tmp);
            }

            var photoBookTempName = Path.Combine(tmp, photoBook.Id + ".zip");
            if (System.IO.File.Exists(photoBookTempName))
            {
                var fileInfo = new System.IO.FileInfo(photoBookTempName);
                if (photoBook.LastUpdated.HasValue && fileInfo.LastWriteTime < photoBook.LastUpdated.Value)
                {
                    System.IO.File.Delete(photoBookTempName);
                }
            }
            if (!System.IO.File.Exists(photoBookTempName))
            {
                try
                {
                    using (var fs = new FileStream(photoBookTempName, FileMode.Create))
                    {
                        using (var zip = new ZipArchive(fs, ZipArchiveMode.Create, true))
                        {
                            foreach (var photo in photoBook.Photos)
                            {
                                var path = Helpers.GetFullPath(photo.Thumbnail);
                                if (System.IO.File.Exists(path))
                                {
                                    zip.CreateEntryFromFile(path, photo.Thumbnail.FileName);
                                }
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    Logger.Error(ex, $"Failed zipping the photobook { id}: {photoBook.Title} due to: {ex.Message}: {ex}");
                }
            }
            if (System.IO.File.Exists(photoBookTempName))
            {
                var relativePath = "tmp/" + photoBook.Id + ".zip";
                return File(relativePath, "application/zip", photoBook.Title + ".zip");
            }
            return new NotFoundResult();
        }
    }
}
