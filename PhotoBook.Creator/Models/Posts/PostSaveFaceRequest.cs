using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PhotoBook.Creator.Models.Posts
{
    public class PostSaveFaceRequest
    {
        [JsonProperty("name")]
        public string Name { get; set; }
        
        [JsonProperty("imageId")]
        public long ImageId { get; set; }
        
        [JsonProperty("id")]
        public long Id { get; set; }
        
        [JsonProperty("x")]
        public float X { get; set; }
        
        [JsonProperty("y")]
        public float Y { get; set; }
        
        [JsonProperty("width")]
        public float Width { get; set; }

        [JsonProperty("height")]
        public float Height { get; set; }

        public int RectX => (int) X;
        public int RectY => (int)X;
        public int RectWidth => (int)X;
        public int RectHeight => (int)X;
    }
}
