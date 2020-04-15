using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace PhotoBook.DataManager.Models
{
    public class Tag : AuditableEntity
    {
        [Required(ErrorMessage = "Name is required")]
        [MaxLength(100)]
        public string Name { get; set; }

        public virtual ICollection<TagThumbnail> TagThumbnails { get; set; } = new HashSet<TagThumbnail>();

        public long TagTypeId { get; set; }
        [ForeignKey("TagTypeId")]
        public virtual TagType TagType { get; set; }
    }
}
