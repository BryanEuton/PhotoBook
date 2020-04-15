using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace PhotoBook.Creator.Models
{
    public class PhotoBookDto
    {
        public long Id { get; set; }

        [Required(ErrorMessage = "Title is required")]
        [MaxLength(100)]
        public string Title { get; set; }

        [Required(ErrorMessage = "TimeFrame is required")]
        [MaxLength(100)]
        public string TimeFrame { get; set; }

        public DateTime Created { get; set; }
        public DateTime Updated { get; set; }
        public int NumPhotos { get; set; }
    }
}