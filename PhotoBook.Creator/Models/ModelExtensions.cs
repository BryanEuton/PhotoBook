using System;
using System.Linq;
using System.Threading.Tasks;
using Common.IdentityManager.Models;
using Microsoft.AspNetCore.Identity;
using PhotoBook.DataManager.Models;

namespace PhotoBook.Creator.Models
{
    public static class ModelExtensions
    {
        public static PhotoBookDto ToPhotoBookDto(this DataManager.Models.PhotoBook photoBook)
        {
            return new PhotoBookDto
            {
                Id = photoBook.Id,
                TimeFrame = photoBook.TimeFrame,
                Title = photoBook.Title,
                NumPhotos = photoBook.Photos.Count
            };
        }
        public static PhotoBookWithPhotosDto ToPhotoBookWithPhotosDto(this DataManager.Models.PhotoBook photoBook)
        {
            return new PhotoBookWithPhotosDto
            {
                Id = photoBook.Id,
                TimeFrame = photoBook.TimeFrame,
                Title = photoBook.Title,
                NumPhotos = photoBook.Photos.Count,
                //Photos = photoBook.Photos.Select(p=> p.Thumbnail.ToImageDto()).ToList()
            };
        }

        public static FileSystemFolderDto ToFolderDto(this FileSystemFolder folder)
        {
            var bits = folder.Path.Split('\\', StringSplitOptions.RemoveEmptyEntries).ToList();
            return new FileSystemFolderDto
            {
                Id = folder.Id,
                Path = folder.Path,
                Name = bits.Last()
            };
        }
        public static ImageDto ToImageDto(this Thumbnail thumbnail)
        {
            var tags = thumbnail.TagThumbnails.ToList().Select(t => t.Tag.ToTagDto()).ToList();
            return new ImageDto
            {
                Id = thumbnail.Id,
                FileSystemFolderId = thumbnail.FileSystemFolderId,
                FileName = thumbnail.FileName,
                Taken = thumbnail.FileCreateDateTime.ToShortDateString(),
                TakenTime = thumbnail.FileCreateDateTime.ToShortTimeString(),
                Tags = tags.Select(t=> t.Id).ToList(),
                TagTypes = tags.Select(t => t.Type).Distinct().ToList(),
                PhotoBooks = thumbnail.PhotoBooks.Select(pb=> pb.PhotoBookId).ToList(),
                Comments = thumbnail.Comments.Select(c=> c.Id).ToList(),
                Faces = thumbnail.Faces.Where(f=> !f.IsHidden).Select(f=> f.ToFace()).ToList(),
                Width = thumbnail.ImageWidth,
                Height = thumbnail.ImageHeight,
                Latitude = thumbnail.Latitude ?? thumbnail.Location?.Latitude,
                Longitude = thumbnail.Longitude ?? thumbnail.Location?.Longitude,
                LocationId = thumbnail.LocationId,
                Location = thumbnail.Location?.ToLocationDto()
            };
        }
        
        public static LocationDto ToLocationDto(this Location location)
        {
            if (location == null)
            {
                return null;
            }

            return new LocationDto
            {
                Id = location.Id,
                Name = location.Name,
                PlaceId = location.PlaceId,
                Latitude = location.Latitude,
                Longitude = location.Longitude,
                StreetNumber = location.StreetNumber,
                StreetAddress = location.StreetAddress,
                Neighborhood = location.Neighborhood,
                City = location.City,
                State= location.State,
                County = location.County,
                PostalCode = location.PostalCode,
                Country = location.Country
            };
        }
        public static CityDto ToCityDto(this Location location)
        {
            if (location == null)
            {
                return null;
            }

            return new CityDto
            {
                Name = location.City,
                State = location.State
            };
        }
        public static LocationComponentDto ToLocationComponentDto(this GoogleAddressComponent component)
        {
            return new LocationComponentDto
            {
                Name = component.LongName
            };
        }

        public static TagDto ToTagDto(this Tag tag)
        {
            return new TagDto
            {
                Id = tag.Id,
                Name = tag.Name,
                Type = tag?.TagType.Name
            };
        }


        public static FaceDto ToFace(this Face face)
        {
            if (face == null)
            {
                return null;
            }
            return new FaceDto
            {
                ImageId = face.Thumbnail.Id,
                Id = face.Id,
                TagId = face.TagId ?? 0,
                Distance = face.Distance,
                IsValid = face.IsValid,
                IsNew = face.NeedsValidation,
                IsHidden = face.IsHidden,
                Name = face.Tag?.Name,
                X = face.RectX,
                Y = face.RectY,
                Width = face.RectWidth,
                Height = face.RectHeight,
                ImageWidth = face.Thumbnail.ImageWidth,
                ImageHeight = face.Thumbnail.ImageHeight
            };
        }

        public static async Task<CommentDto> ToCommentDto(this Comment comment, UserManager<ApplicationUser> userManager, string currentUser)
        {
            var createdBy = await userManager.FindByNameAsync(comment.CreatedBy);
            return new CommentDto
            {
                Id = comment.Id,
                ThumbnailId = comment.ThumbnailId,
                Text = comment.Text,
                CreatedBy = createdBy?.DisplayName ?? createdBy?.FullName,
                CanEdit = comment.CreatedBy == currentUser,
                CanDelete= comment.CreatedBy == currentUser
            };
        }
    }
}