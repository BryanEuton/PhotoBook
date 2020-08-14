using System;
using System.Collections.Generic;
using System.Text;

namespace PhotoBook.DataManager.Models
{
    public class TagThumbnail
    {

        public long TagId { get; set; }
        public Tag Tag { get; set; }

        public long ThumbnailId { get; set; }
        public Thumbnail Thumbnail { get; set; }
    }
}
