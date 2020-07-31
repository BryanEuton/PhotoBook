using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Newtonsoft.Json;

namespace PhotoBook.Creator.Models
{
    public class ImageDto
    {
        public long Id { get; set; }
        public long FileSystemFolderId { get; set; }
        public string FileName { get; set; }
        public string Taken { get; set; }
        public string TakenTime { get; set; }
        public List<long> Tags { get; set; }
        public List<string> TagTypes { get; set; }
        public List<long> PhotoBooks { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
        public List<long> Faces { get; set; }
        public float? Latitude { get; set; }
        public float? Longitude { get; set; }
        public long? LocationId { get; set; }
        public LocationDto Location { get; set; }
        public List<long> Comments { get; set; }
    }
}