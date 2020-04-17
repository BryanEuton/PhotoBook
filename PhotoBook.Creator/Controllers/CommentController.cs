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
    public class CommentController : BaseController
    {
        private readonly UserManager<ApplicationUser> _userManager;
        public CommentController(IConfiguration iConfiguration, DataContext context,
            UserManager<ApplicationUser> userManager) : base(iConfiguration, context)
        {
            _userManager = userManager;
        }

        [HttpGet]
        [Route("api/Comment/Get")]
        [AjaxErrorHandler]
        // GET: Photos
        public async Task<ContentResult> Get(long thumbnailId)
        {
            var comments = Context.Comments.Where(c => c.ThumbnailId == thumbnailId)
                .ToList();
            var dto = new List<CommentDto>();
            foreach (var comment in comments)
            {
                dto.Add(await comment.ToCommentDto(_userManager, GetUserName));
            }
            return AjaxResult(dto);
        }

        [HttpGet]
        [Route("api/Comment/Load")]
        [AjaxErrorHandler]
        // GET: Photos
        public async Task<ContentResult> LoadAsync(long[] ids)
        {
            var comments = Context.Comments
                .Where(t => ids.Contains(t.Id))
                .ToList();

            var dto = new List<CommentDto>();
            foreach (var comment in comments)
            {
                dto.Add(await comment.ToCommentDto(_userManager, GetUserName));
            }
            return AjaxResult(dto);
        }

        [HttpPost]
        [Route("api/Comment/Create")]
        [AjaxErrorHandler]
        public async Task<ContentResult> Create(Comment comment)
        {
            try
            {
                if (comment == null)
                {
                    return AjaxFailedResult("Comment is null.");
                }
                if (!Context.Thumbnails.Any(t=> t.Id == comment.ThumbnailId))
                {
                    return AjaxFailedResult("Thumbnail doesn't exist.");
                }

                if (Context.Comments.Any(c => c.Text == comment.Text && c.ThumbnailId == comment.ThumbnailId && c.CreatedBy == GetUserName))
                {
                    return AjaxFailedResult("Comment already exists.");
                }
                
                Context.Comments.Add(comment);
                Context.SaveChanges();
                return AjaxResult(await comment.ToCommentDto(_userManager, GetUserName), $"Added comment: {comment.Text}");
            }
            catch (Exception ex)
            {
                Logger.Error(ex, $"Failed to create comment {comment.Text}. {ex.Message}: {ex}");
                return AjaxFailedResult($"Failed to create comment {comment.Text}: {ex.Message}");
            }
        }

        [HttpDelete]
        [Route("api/Comment/Delete")]
        [AjaxErrorHandler]
        public ContentResult Delete(long id)
        {
            try
            {
                var comment = Context.Comments.FirstOrDefault(c => c.Id == id);

                if (comment == null)
                {
                    return AjaxFailedResult("Comment not found.");
                }

                if (comment.CreatedBy != GetUserName)
                {
                    return AjaxFailedResult("Unable to delete other people's comments.");
                }

                Context.Comments.Remove(comment);
                Context.SaveChanges();

                return AjaxResult(true, $"Deleted comment {comment.Text}");
            }
            catch (Exception ex)
            {
                Logger.Error(ex, $"Failed to delete comment {id}. {ex.Message}: {ex}");
                return AjaxFailedResult($"Failed to delete comment {id}: {ex.Message}");
            }
        }

        [HttpPost]
        [Route("api/Comment/Update")]
        [AjaxErrorHandler]
        public async Task<ContentResult> Update(Comment comment)
        {
            if (comment == null)
            {
                return AjaxFailedResult("Comment is null.");
            }
            try
            {
                var context = GetNewDataContext();
                var dbComment = context.Comments.FirstOrDefault(p => p.Id == comment.Id);
                if (dbComment == null)
                {
                    return AjaxFailedResult("Unable to find comment");
                }

                if (dbComment.CreatedBy != GetUserName)
                {
                    return AjaxFailedResult("Unable to update other people's comments.");
                }
                
                if (Context.Comments.Any(c => c.Id != dbComment.Id && c.Text == comment.Text && c.ThumbnailId == comment.ThumbnailId && c.CreatedBy == GetUserName))
                {
                    return AjaxFailedResult("Comment already exists.");
                }

                if (dbComment.Text != comment.Text)
                {
                    dbComment.Text = comment.Text;
                    context.Entry(dbComment).State = EntityState.Modified;
                    context.SaveChanges();
                }

                return AjaxResult(await comment.ToCommentDto(_userManager, GetUserName), $"Updated comment {comment.Id}");
            }
            catch (Exception ex)
            {
                Logger.Error(ex, $"Failed to update comment {comment.Id}. {ex.Message}: {ex}");
                return AjaxFailedResult($"Failed to update comment {comment.Id}: {ex.Message}");
            }
        }
    }
}
