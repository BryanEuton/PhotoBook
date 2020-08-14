using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PhotoBook.Creator.Models.Posts
{
    public class PostSearchFaceRequest
    {
        [JsonProperty("tags")]
        public List<long> Tags { get; set; } = new List<long>();
        
        [JsonProperty("pageSize")]
        public int PageSize { get; set; }
        
        [JsonProperty("page")]
        public int Page { get; set; }
        
        [JsonProperty("status")]
        public int Status { get; set; }
    }
}
