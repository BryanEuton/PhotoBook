using Microsoft.AspNetCore.Mvc;
using System.Linq;
using Microsoft.Extensions.Logging;
using PhotoBook.DataManager;
using Microsoft.AspNetCore.Authorization;
using PhotoBook.Creator.Models;
using System.Collections.Generic;
using System;
using System.Diagnostics;
using System.IO;
using PhotoBook.DataManager.Models;
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using NLog;
using PhotoBook.Base;
using PhotoBook.Creator.Filters;
using PhotoBook.Creator.Models.Posts;
using PhotoBook.ImageProcessing;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.Primitives;

namespace PhotoBook.Creator.Controllers
{
    public class FacesController : BaseController
    {
        public readonly Logger Logger = LogManager.GetCurrentClassLogger();

        public FacesController(IConfiguration iConfiguration, DataContext context) : base(iConfiguration, context) { }

        [HttpGet]
        [Route("api/Faces/Get")]
        [AjaxErrorHandler]
        public ContentResult Get(long id)
        {
            var face = Context.Faces
                .Include(f => f.Thumbnail)
                .Include(f => f.Tag)
                .FirstOrDefault( f=> f.Id == id);

            return AjaxResult(face.ToFace());
        }

        [HttpGet]
        [Route("api/Faces/GetFaces")]
        [AjaxErrorHandler]
        public ContentResult GetFaces(long imageId)
        {
            var faces = Context.Faces
                .Include(f=> f.Thumbnail)
                .Include(f => f.Tag)
                .Where(f=> f.ThumbnailId == imageId)
                .ToList();
            
            return AjaxResult(faces.Select(f=> f.ToFace()));
        }

        [HttpPost]
        [Route("api/Faces/Save")]
        [AjaxErrorHandler]
        public ContentResult Save(FaceDto face)
        {
            if (face == null || (face.Id == 0 && !(face.TagId > 0 || !string.IsNullOrWhiteSpace(face.Name))))
            {
                return AjaxFailedResult("Must enter name for face.");
            }
            if (face.Width < 10)
            {
                Logger.Trace($"Invalid width for face.  x: {face.X}, y: {face.Y}, w: {face.Width}, h: {face.Height}");
                return AjaxFailedResult("Width must be greater than 10.");
            }
            if (face.Height < 10)
            {
                Logger.Trace($"Invalid height for face.  x: {face.X}, y: {face.Y}, w: {face.Width}, h: {face.Height}");
                return AjaxFailedResult("Height must be greater than 10.");
            }
            var thumbnail = Context.Thumbnails.FirstOrDefault(i => i.Id == face.ImageId);
            if (thumbnail == null)
            {
                return AjaxFailedResult("Image not found.");
            }

            var dbFace = Context.Faces.Include(f => f.Tag).FirstOrDefault(p => p.Id == face.Id);
            var orig = dbFace.ToFace();
            bool moved;
            if (dbFace == null)
            {
                dbFace = new Face
                {
                    IsValid = true,
                    NeedsValidation = false,
                    Haar = Constants.Manual,
                    Thumbnail = thumbnail,
                    ThumbnailId = face.ImageId
                };
                moved = true;
            }
            else
            {
                moved = !(
                    dbFace.RectX == face.X &&
                    dbFace.RectY == face.Y &&
                    dbFace.RectHeight == face.Height &&
                    dbFace.RectWidth == face.Width
                    );

                if (!(face.TagId > 0 || !string.IsNullOrWhiteSpace(face.Name)) && dbFace.TagId.HasValue)
                {
                    face.TagId = dbFace.TagId.Value;
                }
            }

            if (moved)
            {
                dbFace.RectX = face.X;
                dbFace.RectY = face.Y;
                dbFace.RectHeight = face.Height;
                dbFace.RectWidth = face.Width;

                Logger.Trace($"Face Moved.  x: {face.X}, y: {face.Y}, w: {face.Width}, h: {face.Height}, iW: {dbFace.ToFace().ImageWidth}, iH: {dbFace.ToFace().ImageHeight}");

                using (var img = Image.Load(Helpers.GetFullPath(thumbnail)))
                {
                    Helpers.ExifRotate(img);
                    var clone = img.Clone(context => context
                        .Crop(new Rectangle(dbFace.RectX, dbFace.RectY, dbFace.RectWidth, dbFace.RectHeight)));
                    dbFace.Bytes = Helpers.ImageToByteArray(clone);
                }
            }

            if (!string.IsNullOrWhiteSpace(face.Name) && face.TagId <= 0)
            {
                //check for existing tag
                var tag = Context.Tags.FirstOrDefault(t => t.Name == face.Name && t.TagTypeId == Constants.Tags.PersonTagTypeId);
                if (tag != null)
                {
                    face.TagId = tag.Id;
                    face.Name = null;
                    Logger.Trace($"Tag already exists for name {tag.Name}.  Updating reference");
                }
            }
            if (dbFace.Id == 0 || (dbFace.TagId.HasValue && dbFace.TagId != face.TagId))
            {
                //tag doesn't exist currently or it's a different tag than before.
                if (dbFace.TagId.HasValue)
                {
                    RemoveTag(dbFace.TagId.Value, face.ImageId);
                }

                dbFace.Tag = AddTag(face.Name, face.TagId, face.ImageId);
                dbFace.TagId = dbFace.Tag.Id;
            }

            dbFace.IsValid = true;
            dbFace.NeedsValidation = false;
            var message = $"Created Face {face.Name} for {thumbnail.FileName}";
            if (dbFace.Id == 0)
            {
                Context.Faces.Add(dbFace);
                orig = dbFace.ToFace();
                orig.IsValid = false;
            }
            else
            {
                message = $"Updated Face {face.Name} for {thumbnail.FileName}";
                Context.Entry(dbFace).State = EntityState.Modified;
            }
            Context.SaveChanges();

            return AjaxResult(dbFace.ToFace(), message, orig, Url.Action("Save"));
        }

        [HttpPost]
        [Route("api/Faces/Tag")]
        [AjaxErrorHandler]
        public ContentResult Tag(FaceDto face)
        {
            if (face == null || !(face.TagId > 0 || !string.IsNullOrWhiteSpace(face.Name)))
            {
                return AjaxFailedResult("Must enter name for face.");
            }

            var dbFace = Context.Faces
                .Include(f => f.Tag)
                .Include(f => f.Thumbnail)
                .FirstOrDefault(p => p.Id == face.Id);
            if (dbFace == null)
            {
                return AjaxFailedResult("Face not found.");
            }

            if (!string.IsNullOrWhiteSpace(face.Name) && face.TagId <= 0)
            {
                //check for existing tag
                var tag = Context.Tags.FirstOrDefault(t => t.Name == face.Name && t.TagTypeId == Constants.Tags.PersonTagTypeId);
                if (tag != null)
                {
                    face.TagId = tag.Id;
                    face.Name = tag.Name;
                    Logger.Trace($"Tag already exists for name {tag.Name}.  Updating reference");
                }
            }else if (face.TagId > 0)
            {
                var tag = Context.Tags.FirstOrDefault(t => t.Id== face.TagId && t.TagTypeId == Constants.Tags.PersonTagTypeId);
                if (tag != null)
                {
                    face.Name = tag.Name;
                }
            }

            var thumbnail = dbFace.Thumbnail;
            var message = $"Updated name for face {face.Name} for {thumbnail.FileName}";
            if (dbFace.TagId != face.TagId || face.TagId == 0)
            {
                //tag doesn't exist currently or it's a different tag than before.
                if (dbFace.TagId.HasValue)
                {
                    RemoveTag(dbFace.TagId.Value, face.ImageId);
                }

                dbFace.Tag = AddTag(face.Name, face.TagId, face.ImageId);
                dbFace.TagId = dbFace.Tag.Id;

                dbFace.IsValid = true;
                dbFace.NeedsValidation = false;
                Context.Entry(dbFace).State = EntityState.Modified;
                Context.SaveChanges();
            } else if (!dbFace.IsValid || dbFace.NeedsValidation)
            {
                dbFace.IsValid = true;
                dbFace.NeedsValidation = false;
                Context.Entry(dbFace).State = EntityState.Modified;
                Context.SaveChanges();
            }

            return AjaxResult(dbFace.ToFace(), message);
        }


        [HttpPost]
        [Route("api/Faces/Validate")]
        [AjaxErrorHandler]
        public ContentResult Validate(long id)
        {
            var face = Context.Faces.Include(f => f.Thumbnail).Include(f => f.Tag).FirstOrDefault(p => p.Id == id);
            if (face == null)
            {
                return AjaxFailedResult("Face not found.");
            }

            var message = $"Validated face: {face.TagId} for {face.Thumbnail.FileName}";
            if (!face.IsValid || face.NeedsValidation)
            {
                face.IsValid = true;
            }
            else
            {
                face.IsValid = false;
                message = $"Reverted face validation: {face.TagId} for {face.Thumbnail.FileName}";
            }
            face.NeedsValidation = false;
            Context.Entry(face).State = EntityState.Modified;
            Context.SaveChanges();

            return AjaxResult(face.ToFace(), message);
        }
        [HttpPost]
        [Route("api/Faces/Remove")]
        [AjaxErrorHandler]
        public ContentResult ToggleRemove(long id)
        {
            var face = Context.Faces.Include(f=> f.Thumbnail).Include(f=> f.Tag).FirstOrDefault(f => f.Id == id);
            if (face == null)
            {
                return AjaxFailedResult("Face not found.");
            }

            var orig = face.ToFace();
            var thumbnail = face.Thumbnail;
            if (thumbnail == null)
            {
                return AjaxFailedResult("Image not found.");
            }
            var remove = face.IsValid || face.NeedsValidation;

            if (remove)
            {
                if (face.TagId.HasValue)
                {
                    RemoveTag(face.TagId.Value, face.ThumbnailId);
                }
                //set so that it is never displayed again. 
                //This will allow the FaceDetector to not keep adding this face.
                face.IsValid = false;
            }
            else
            {
                //"add" it back
                if (face.TagId.HasValue)
                {
                    AddTag(null, face.TagId.Value, face.ThumbnailId);
                }
                face.IsValid = true;
            }
            face.NeedsValidation = false;
            Context.Entry(face).State = EntityState.Modified;
            Context.SaveChanges();
                        
            //result of true means face was "removed".  Otherwise it will be added back.
            return AjaxResult(face.ToFace(), $"{(remove ? "Removed" : "Added")} Face { face.Id }", null, Url.Action("ToggleRemove", new { id }));
        }

        [HttpPost]
        [Route("api/Faces/RemoveAll")]
        [AjaxErrorHandler]
        public ContentResult RemoveAll(int thumbnailId)
        {
            var thumbnail = Context.Thumbnails
                                .Include(t=> t.Faces)
                                .FirstOrDefault(i => i.Id == thumbnailId);
            if (thumbnail == null)
            {
                return AjaxFailedResult("Image not found.");
            }

            if (thumbnail.Faces.Any())
            {
                foreach (var face in thumbnail.Faces.ToList())
                {
                    face.IsValid = false;
                    face.NeedsValidation = false;
                    Context.Entry(face).State = EntityState.Modified;
                }

                var personTags = Context.TagThumbnails.Where(tt => 
                        tt.ThumbnailId == thumbnailId &&
                        tt.Tag.TagTypeId == Constants.Tags.PersonTagTypeId)
                    .ToList();
                foreach (var personTag in personTags)
                {
                    Context.TagThumbnails.Remove(personTag);
                }
                Context.Entry(thumbnail).State = EntityState.Modified;
                Context.SaveChanges();
            }

            return AjaxResult<bool>(true, $"Removed All Faces for { thumbnail.FileName }");
        }

        [HttpPost]
        [Route("api/Faces/PagedResults")]
        [AjaxErrorHandler]
        public PagedResults<List<FaceDto>> PagedSearchResults(PostSearchFaceRequest postFaceRequest)
        {
            try
            {
                if (postFaceRequest == null || postFaceRequest.Status < 1 || postFaceRequest.Status > 3)
                {
                    return new PagedResults<List<FaceDto>>(new List<FaceDto>(), 0);
                    //return AjaxFailedResult("Invalid status selected");
                }

                if (postFaceRequest.Page < 0)
                {
                    postFaceRequest.Page = 1;
                }

                var query = Context.Faces.Include(f=> f.Thumbnail).Include(f => f.Tag).Where(f =>
                    (postFaceRequest.Tags.Count == 0|| postFaceRequest.Tags.Contains(f.TagId.Value)) &&
                    ((!f.IsValid && !f.NeedsValidation && postFaceRequest.Status == Constants.FaceStatus.Hidden) ||
                     ((f.IsValid  || f.NeedsValidation)&& postFaceRequest.Status == Constants.FaceStatus.Visible) ||
                     (f.NeedsValidation && postFaceRequest.Status == Constants.FaceStatus.New) ||
                     (f.IsValid && !f.NeedsValidation && postFaceRequest.Status == Constants.FaceStatus.Validated))
                );

                var photos = query
                    .OrderByDescending(i => i.LastUpdated ?? i.Created)
                    .Skip(postFaceRequest.PageSize * (postFaceRequest.Page - 1))
                    .Take(postFaceRequest.PageSize).ToList()
                    .Select(s => s.ToFace()).ToList();

                return new PagedResults<List<FaceDto>>(photos, query.Count());
            }
            catch (Exception ex)
            {
                Logger.Error(ex, $"Failed to get faces: {ex.Message}: {ex}");
                //return AjaxFailedResult($"Failed to faces: {ex.Message}");
                return new PagedResults<List<FaceDto>>(new List<FaceDto>(),0 );
            }
        }

        [HttpPost]
        [Route("api/Faces/Find")]
        [AjaxErrorHandler]
        public PagedResults<List<FaceDto>> FindRelated(PostFindFaceRequest postFindFaceRequest)
        {
            try
            {
                if (postFindFaceRequest == null || postFindFaceRequest.Limit <= 0)
                {
                    return new PagedResults<List<FaceDto>>(new List<FaceDto>(), 0);
                }
                
                var trainingImages = Context.Faces.AsNoTracking().Where(f => f.IsValid && (!postFindFaceRequest.TagId.HasValue || f.TagId == postFindFaceRequest.TagId)).ToList();
                if (postFindFaceRequest.TagId.HasValue)
                {
                    var otherFaces = Context.Faces.Where(f => f.TagId != postFindFaceRequest.TagId).Select(f => f.TagId).Distinct().ToList();
                    Logger.Trace($"Adding {otherFaces.Count} other tags to training images.");
                    foreach(var tagId in otherFaces)
                    {
                        trainingImages.AddRange(Context.Faces.AsNoTracking().Where(f => f.IsValid && f.TagId == tagId).OrderByDescending(f=> f.Thumbnail.FileCreateDateTime).Take(20).ToList());
                    }
                }

                using (var recognizer = Helpers.SetupFacialRecognition(Context, trainingImages))
                {
                    List<Face> facesToRecognize;
                    if (postFindFaceRequest.SearchExisting)
                    {
                        facesToRecognize = Context.Faces
                            .Include(f => f.Thumbnail).AsNoTracking()
                            .Where(f =>
                                f.NeedsValidation &&
                                (!f.Thumbnail.Scanned || postFindFaceRequest.SearchScanned) &&
                                f.Thumbnail.FileCreateDateTime >= postFindFaceRequest.Start &&
                                (postFindFaceRequest.End == null || f.Thumbnail.FileCreateDateTime <= postFindFaceRequest.End.Value)
                            ).Take(postFindFaceRequest.Limit)
                            .ToList();
                    }
                    else
                    {
                        facesToRecognize = new List<Face>();
                        var thumbnailsToSearch = Context.Thumbnails.AsNoTracking().Where(t =>
                                !t.Hide &&
                                (!t.Scanned || postFindFaceRequest.SearchScanned) &&
                                t.FileCreateDateTime >= postFindFaceRequest.Start &&
                                (postFindFaceRequest.End == null ||
                                 t.FileCreateDateTime <= postFindFaceRequest.End.Value))
                            .Take(postFindFaceRequest.Limit)
                            .Select(t=> t.Id)
                            .ToList();
                        foreach (var id in thumbnailsToSearch)
                        {
                            var newFaces = GetNewFacesToRecognize(recognizer, id, postFindFaceRequest.MaxDistance, postFindFaceRequest.MinWidth);
                            Logger.Trace($"Found {newFaces.Count} new faces for thumbnail {id}.");
                            facesToRecognize.AddRange(newFaces);
                        }
                    }
                    var faces = facesToRecognize
                        .Select(face => recognizer.IdentifyFace(face).ToFace())
                        .Where(face => face != null && (face.TagId == postFindFaceRequest.TagId || !postFindFaceRequest.TagId.HasValue))
                        .OrderBy(face => face.Distance)
                        .ToList();
                    return new PagedResults<List<FaceDto>>(faces, faces.Count());
                }
            }
            catch (Exception ex)
            {
                Logger.Error(ex, $"Failed to find faces: {ex.Message}: {ex}");
                return new PagedResults<List<FaceDto>>(new List<FaceDto>(), 0);
            }
        }

        private List<Face> GetNewFacesToRecognize(FacialRecognition recognizer, long thumbnailId, double maxDistance, double minWidth)
        {
            Logger.Trace($"GetNewFacesToRecognize started for {thumbnailId} with {maxDistance} distance and {minWidth} width.");
            var start = DateTime.Now;
            try
            {
                var thumbnail = Context.Thumbnails
                    .Include(t => t.FileSystemFolder)
                    .Include(t => t.Faces)
                    .First(t => t.Id == thumbnailId);

                using (var img = Image.Load(Helpers.GetFullPath(thumbnail)))
                {
                    Helpers.ExifRotate(img);
                    using (var imageStream = new MemoryStream())
                    {
                        img.SaveAsBmp(imageStream);


                        Logger.Trace($"Scanning image {thumbnail.FileName} for new faces");

                        var foundRectangles = thumbnail.Faces.Select(f => f.Rectangle)
                            .ToList();
                        var faces = recognizer.Recognize(foundRectangles, imageStream);
                        var sideFaces = recognizer.Recognize(foundRectangles, imageStream,
                            FacialRecognition.HaarCascadeSideProfile);

                        using (var flippedStream = new MemoryStream())
                        {
                            img.Mutate(x => x.RotateFlip(RotateMode.None, FlipMode.Horizontal));
                            img.SaveAsBmp(flippedStream);

                            var flipped = foundRectangles.Select(k =>
                                new System.Drawing.Rectangle(k.X + k.Width + thumbnail.ImageWidth, k.Y, k.Width,
                                    k.Height)).ToList();
                            var leftSideFaces = recognizer.Recognize(flipped, flippedStream,
                                FacialRecognition.HaarCascadeSideProfile);
                            foreach (var face in leftSideFaces)
                            {
                                //need to flip the images back.
                                face.RectX = thumbnail.ImageWidth - face.RectWidth - face.RectX;
                            }

                            Logger.Trace($"Found {leftSideFaces.Count} flipped faces. {sideFaces.Count}");

                            faces.AddRange(sideFaces);
                            faces.AddRange(leftSideFaces);
                        }

                        var filtered = new List<Face>();
                        foreach (var face in faces)
                        {
                            if ((face.Distance <= maxDistance || face.RectWidth > minWidth ||
                                 face.RectHeight > minWidth) && !filtered.Any(f =>
                                f.Rectangle.Contains(face.Rectangle) || face.Rectangle.Contains(f.Rectangle) ||
                                Helpers.Overlaps(f.Rectangle, face.Rectangle, 70)))
                            {
                                filtered.Add(face);
                                face.Thumbnail = thumbnail;
                            }
                        }

                        var newFaces = filtered.Where(f =>
                            !thumbnail.Faces.Any(i =>
                                f.Rectangle.Contains(i.Rectangle) ||
                                i.Rectangle.Contains(f.Rectangle) ||
                                (i.Rectangle.IntersectsWith(f.Rectangle) &&
                                 Helpers.Overlaps(i.Rectangle, f.Rectangle, 70))
                            )
                        ).ToList();
                        if (newFaces.Count != filtered.Count)
                        {
                            Logger.Trace($"Removed {filtered.Count - newFaces.Count} faces due to already existing");
                        }

                        foreach (var face in newFaces)
                        {
                            var filePath = Path.Combine(Configuration["ImageProcessing:FacesToLocalPath"], "Dynamic");
                            if (!Directory.Exists(filePath))
                            {
                                Directory.CreateDirectory(filePath);
                            }

                            using (var tmp = Image.Load(new MemoryStream(face.Bytes)))
                            {
                                tmp.Save(Path.Combine(filePath, $"{face.TagId}_{Guid.NewGuid():N}.jpg"));
                            }
                        }
                        return newFaces;
                    }

                    
                }
            }
            catch (Exception ex)
            {
                Logger.Error(ex, $"Failed to get new faces: {ex.Message}\n:{ex}");
                return new List<Face>();
            }
            finally
            {
                Logger.Trace($"GetNewFacesToRecognize completed for {thumbnailId} in {(DateTime.Now - start).Milliseconds} ms.");
            }
            
        }
        
        private Tag AddTag(string personName, long tagId, long thumbnailId)
        {
            var tag = Context.Tags.FirstOrDefault(t =>
                t.Id == tagId || (tagId == 0 && t.Name == personName && t.TagTypeId == Constants.Tags.PersonTagTypeId));
            var thumbnail = Context.Thumbnails.First(t=> t.Id == thumbnailId);
            if (tag == null)
            {
                if (string.IsNullOrWhiteSpace(personName))
                {
                    throw new Exception("Name is empty or wasn't found.");
                }
                //new tag
                tag = new Tag
                {
                    Name = personName,
                    TagTypeId = Constants.Tags.PersonTagTypeId
                };
                Context.Tags.Add(tag);
                Context.TagThumbnails.Add(new TagThumbnail
                    {Tag = tag, TagId = tag.Id, Thumbnail = thumbnail, ThumbnailId = thumbnail.Id});
            }
            else
            {
                var tagThumbnail = Context.TagThumbnails.FirstOrDefault(tt =>
                    tt.ThumbnailId == thumbnailId &&
                    tt.TagId == tag.Id);
                if (tagThumbnail == null)
                {
                    Context.TagThumbnails.Add(new TagThumbnail
                        { Tag = tag, TagId = tag.Id, Thumbnail = thumbnail, ThumbnailId = thumbnail.Id });
                }
            }

            return tag;
        }
        private void RemoveTag(long tagId, long thumbnailId)
        {
            var tagThumbnail = Context.TagThumbnails.FirstOrDefault(tt =>
                tt.ThumbnailId == thumbnailId &&
                tt.TagId == tagId);
            if (tagThumbnail != null)
            {
                Context.TagThumbnails.Remove(tagThumbnail);
            }
        }
    }
}
