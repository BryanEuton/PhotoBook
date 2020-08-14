using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PhotoBook.Creator.Models.Posts
{
    public class PostNewLocationRequest
    {
        [JsonProperty("thumbnailId")]
        public long ThumbnailId { get; set; }
        
        [JsonProperty("placeId")]
        public string PlaceId{ get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        public float Lat { get; set; }

        [JsonProperty("lng")]
        public float Lng { get; set; }

        [JsonProperty("components")]
        public List<GoogleAddressComponentDto> Components { get; set; }
    }
}
