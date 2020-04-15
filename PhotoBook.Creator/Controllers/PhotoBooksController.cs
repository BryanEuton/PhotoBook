using System;
using System.IO;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using Microsoft.Extensions.Logging;
using PhotoBook.DataManager;
using Microsoft.AspNetCore.Authorization;
using PhotoBook.Creator.Models;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PhotoBook.Creator.Filters;
using PhotoBook.DataManager.Models;

namespace PhotoBook.Creator.Controllers
{
    public class PhotoBooksController : BaseController
    {
        public PhotoBooksController(IConfiguration iConfiguration, DataContext context) : base(iConfiguration, context)
        {}

        [HttpGet]
        [Route("api/PhotoBook/Get")]
        [AjaxErrorHandler]
        // GET: Photos
        public IEnumerable<PhotoBookDto> Get()
        {
            //return _context.PhotoBooks.Include(pb => pb.Photos).Select(pb => pb.ToPhotoBookDto()).ToList();
            return Context.PhotoBooks.Select(photoBook => new PhotoBookDto
            {
                Id = photoBook.Id,
                TimeFrame = photoBook.TimeFrame,
                Title = photoBook.Title,
                NumPhotos = photoBook.Photos.Count
            }).ToList();
        }

        [HttpGet]
        [Route("api/PhotoBook/GetDetails")]
        [AjaxErrorHandler]
        // GET: Photos
        public PhotoBookWithPhotosDto Get(long id)
        {
            var photoBook = Context.PhotoBooks
                .Include(pb => pb.Photos)
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
    }
}
