using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Newtonsoft.Json;

namespace PhotoBook.Creator.Models
{
    public class CommentDto
    {
        public long Id { get; set; }
        public string Text { get; set; }
        public string CreatedBy { get; set; }
        public long ThumbnailId { get; set; }
        public bool CanEdit { get; set; }
        public bool CanDelete { get; set; }
    }
}