using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Drawing;
using System.Text;

namespace PhotoBook.DataManager.Models
{
    public class Face : AuditableEntity
    {
        public byte[] Bytes { get; set; }
        public double Distance { get; set; }
        public string Haar { get; set; }
        public int RectX { get; set; }
        public int RectY { get; set; }
        public int RectWidth { get; set; }
        public int RectHeight { get; set; }
        public bool IsValid { get; set; }
        public bool NeedsValidation { get; set; }
        public bool IsHidden => !NeedsValidation && !IsValid;
        public long? TagId { get; set; }
        [ForeignKey("TagId")]
        public virtual Tag Tag { get; set; }
        
        public long ThumbnailId { get; set; }

        [ForeignKey("ThumbnailId")]
        public virtual Thumbnail Thumbnail { get; set; }

        [NotMapped]
        public Rectangle Rectangle => (_rectangle ?? (_rectangle = new Rectangle(RectX, RectY, RectWidth, RectHeight))).Value;

        [NotMapped] private Rectangle? _rectangle;
    }
}
