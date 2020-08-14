using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PhotoBook.DataManager.Models
{

    public class Comment : AuditableEntity
    {
        [MaxLength(250)]
        public string Text { get; set; }

        public long ThumbnailId { get; set; }
        
        [ForeignKey("ThumbnailId")]
        public virtual Thumbnail Thumbnail { get; set; }
    }
}
