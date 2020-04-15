using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace PhotoBook.DataManager.Models
{
    public class PhotoBook : AuditableEntity
    {
        [Required(ErrorMessage = "Title is required")]
        [MaxLength(100)]
        public string Title { get; set; }

        [Required(ErrorMessage = "TimeFrame is required")]
        [MaxLength(100)]
        public string TimeFrame { get; set; }

        public virtual ICollection<PhotoItem> Photos { get; set; } = new HashSet<PhotoItem>();
    }
}
