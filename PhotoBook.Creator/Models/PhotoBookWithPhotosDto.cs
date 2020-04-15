using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace PhotoBook.Creator.Models
{
    public class PhotoBookWithPhotosDto : PhotoBookDto
    {
        public List<ImageDto> Photos { get; set; } = new List<ImageDto>();
    }
}