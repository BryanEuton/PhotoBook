using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhotoBook.Creator.Models;
using PhotoBook.DataManager;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using PhotoBook.Base;
using PhotoBook.Creator.Filters;
using PhotoBook.DataManager.Models;

namespace PhotoBook.Creator.Controllers
{
    public class TagController : BaseController
    {
        public TagController(IConfiguration iConfiguration, DataContext context) : base(iConfiguration, context)
        { }

        [HttpGet]
        [Route("api/Tag/Get")]
        [AjaxErrorHandler]
        // GET: Photos
        public IEnumerable<TagDto> Get()
        {
            return Context.Tags.Select(tag => new TagDto
            {
                Id = tag.Id,
                Name = tag.Name,
                Type = tag.TagType.Name,
                NumPhotos = tag.TagThumbnails.Count()
            }).ToList();
        }

        // AddToPhoto
        [HttpPost]
        [Route("api/Tag/ToggleTagImage")]
        [AjaxErrorHandler]
        public ContentResult ToggleTagImage(long tagId, long thumbnailId)
        {
            try
            {
                var tag = Context.Tags.Include(t=> t.TagThumbnails).FirstOrDefault(p => p.Id == tagId);
                if (tag == null)
                {
                    return AjaxFailedResult("Tag not found.");
                }

                var thumbnail = Context.Thumbnails.FirstOrDefault(t => t.Id == thumbnailId);
                if (thumbnail == null)
                {
                    return AjaxFailedResult("Image not found.");
                }

                var tagged = tag.TagThumbnails.FirstOrDefault(t => t.ThumbnailId == thumbnail.Id && t.TagId == tagId);
                if (tagged != null)
                {
                    tag.TagThumbnails.Remove(tagged);
                    Context.Entry(tag).State = EntityState.Modified;
                    Context.SaveChanges();
                    return AjaxResult<bool>(false, $"Removed {thumbnail.FileName} from {tag.Name}");
                }
                tagged = new TagThumbnail{Tag = tag, TagId = tagId, Thumbnail = thumbnail, ThumbnailId =  thumbnailId};
                tag.TagThumbnails.Add(tagged);
                Context.Entry(tag).State = EntityState.Modified;
                Context.SaveChanges();
                return AjaxResult<bool>(true, $"Added {thumbnail.FileName} to {tag.Name}");
            }
            catch (Exception ex)
            {
                Logger.Error(ex, $"Failed to toggle tag {tagId} for image {thumbnailId}. {ex.Message}: {ex}");
                return AjaxFailedResult($"Failed to toggle tag {tagId} for image {thumbnailId}: {ex.Message}");
            }
        }

        
        [HttpPost]
        [Route("api/Tag/Create")]
        [AjaxErrorHandler]
        public ContentResult Create(TagDto tag)
        {
            try
            {
                if (tag == null)
                {
                    return AjaxFailedResult("Tag is null.");
                }

                if (Context.Tags.Any(t => t.Name == tag.Name && t.TagType.Name == tag.Type))
                {
                    return AjaxFailedResult("Tag already exists.");
                }
                var dbTag = new Tag
                {
                    Name = tag.Name
                };
                var tagType = Context.TagTypes.FirstOrDefault(t => t.Name == tag.Type);
                if (tagType == null)
                {
                    dbTag.TagType = new TagType
                    {
                        Name = tag.Type
                    };
                    Context.TagTypes.Add(dbTag.TagType);
                }
                else
                {
                    dbTag.TagTypeId = tagType.Id;
                    dbTag.TagType = tagType;
                }
                Context.Tags.Add(dbTag);
                Context.SaveChanges();

                return AjaxResult(dbTag.ToTagDto(), $"Added tag {tag.Name}");
            }
            catch (Exception ex)
            {
                Logger.Error(ex, $"Failed to create tag {tag.Name}. {ex.Message}: {ex}");
                return AjaxFailedResult($"Failed to create tag {tag.Name}: {ex.Message}");
            }
        }

        [HttpDelete]
        [Route("api/Tag/Delete")]
        [AjaxErrorHandler]
        public ContentResult Delete(long id)
        {
            try
            {
                var tag = Context.Tags.Include(t=> t.TagType).FirstOrDefault(t => t.Id == id);

                if (tag == null)
                {
                    return AjaxFailedResult("Tag not found.");
                }

                if (tag.Id == Constants.Tags.UnknownTagId)
                {
                    return AjaxFailedResult("Cannot delete tag.");
                }

                Context.Tags.Remove(tag);
                var otherTags = Context.Tags.Any(t => t.TagTypeId == tag.TagTypeId && t.Id != tag.Id);
                if (!otherTags)
                {
                    Context.TagTypes.Remove(tag.TagType);
                }
                Context.SaveChanges();

                return AjaxResult(true, $"Deleted tag {tag.Name}");
            }
            catch (Exception ex)
            {
                Logger.Error(ex, $"Failed to delete tag {id}. {ex.Message}: {ex}");
                return AjaxFailedResult($"Failed to delete tag {id}: {ex.Message}");
            }
        }

        [HttpPost]
        [Route("api/Tag/Update")]
        [AjaxErrorHandler]
        public ContentResult Update(TagDto tag)
        {
            try
            {
                if (tag == null)
                {
                    return AjaxFailedResult("Tag is null.");
                }

                var dbTag = Context.Tags.Include(t=> t.TagType).FirstOrDefault(p => p.Id == tag.Id);
                if (dbTag == null)
                {
                    return AjaxFailedResult("Unable to find tag");
                }
                dbTag.Name = tag.Name;
                if (dbTag.TagType.Name != tag.Type)
                {
                    var tagType = Context.TagTypes.FirstOrDefault(t => t.Name == tag.Type);
                    if (Context.Tags.Any(t => t.Id != dbTag.Id && t.TagTypeId == dbTag.TagTypeId))
                    {
                        //TagType is tied to a different tag.
                        if (tagType == null)
                        {
                            tagType = new TagType
                            {
                                Name = tag.Type
                            };

                            Context.TagTypes.Add(tagType);
                            Context.Entry(tagType).State = EntityState.Added;
                        }
                        dbTag.TagType = tagType;
                        dbTag.TagTypeId = tagType.Id;
                    }
                    else
                    {
                        if (tagType == null)
                        {
                            dbTag.TagType.Name = tag.Type;
                            Context.Entry(dbTag.TagType).State = EntityState.Modified;
                        }
                        else
                        {
                            Context.Entry(dbTag.TagType).State = EntityState.Deleted;

                            dbTag.TagType = tagType;
                            dbTag.TagTypeId = tagType.Id;
                        }
                    }
                }
                Context.Entry(dbTag).State = EntityState.Modified;
                Context.SaveChanges();

                return AjaxResult(dbTag.ToTagDto(), $"Updated tag {tag.Name}");
            }
            catch (Exception ex)
            {
                Logger.Error(ex, $"Failed to update tag {tag.Name}. {ex.Message}: {ex}");
                return AjaxFailedResult($"Failed to update tag {tag.Name}: {ex.Message}");
            }
        }
    }
}
