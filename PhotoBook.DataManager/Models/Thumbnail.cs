using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace PhotoBook.DataManager.Models
{

    public class Thumbnail : AuditableEntity
    {
        public string FileName { get; set; }
        public long FileSystemFolderId { get; set; }
        public byte[] Bytes { get; set; }
        public bool Hide { get; set; }
        public bool Scanned { get; set; }
        public int ImageWidth { get; set; }
        public int ImageHeight { get; set; }
        public DateTime FileCreateDateTime { get; set; }
        /// <summary>
        /// An image's latitude and longitude stores where the image was taken from.
        /// This can also be updated to the lat/long of a place from Google Maps.
        /// </summary>
        public float? Latitude { get; set; }
        public float? Longitude { get; set; }
        public bool LatLongFromImage { get; set; }
        /// <summary>
        /// Altitude stored in meters.
        /// </summary>
        public float? Altitude { get; set; }
        [ForeignKey("FileSystemFolderId")]
        public virtual FileSystemFolder FileSystemFolder { get; set; }
        public virtual ICollection<TagThumbnail> TagThumbnails { get; set; } = new HashSet<TagThumbnail>();
        public virtual ICollection<PhotoItem> PhotoBooks { get; set; } = new HashSet<PhotoItem>();
        public virtual ICollection<Face> Faces { get; set; } = new HashSet<Face>();
        public long? LocationId { get; set; }
        [ForeignKey("LocationId")]
        public virtual Location Location { get; set; }
        public virtual ICollection<Comment> Comments { get; set; } = new HashSet<Comment>();
    }
}
