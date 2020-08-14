using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PhotoBook.Creator.Models.Posts
{
    public class PostFindFaceRequest
    {
        [JsonProperty("tagId")]
        public long? TagId { get; set; }
        [JsonProperty("start")]
        public DateTime Start { get; set; }

        [JsonProperty("end")]
        public DateTime? End { get; set; }

        [JsonProperty("searchExisting")]
        public bool SearchExisting { get; set; }

        [JsonProperty("searchScanned")]
        public bool SearchScanned { get; set; }

        [JsonProperty("maxDistance")]
        public double MaxDistance { get; set; }

        [JsonProperty("minWidth")]
        public double MinWidth { get; set; }

        [JsonProperty("limit")]
        public int Limit { get; set; }
    }
}
