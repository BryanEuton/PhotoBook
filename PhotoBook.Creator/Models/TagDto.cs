using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace PhotoBook.Creator.Models
{
    public class TagDto
    {
        public long Id { get; set; }

        [Required(ErrorMessage = "Name is required")]
        [MaxLength(100)]
        public string Name { get; set; }

        [Required(ErrorMessage = "Tag Type is required")]
        [MaxLength(100)]
        public string Type { get; set; }

        public int NumPhotos { get; set; }
    }
}