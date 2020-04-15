using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PhotoBook.Creator.Models.Posts
{
    public class PostSearchRequest
    {
        [JsonProperty("start")]
        public DateTime Start { get; set; }
        
        [JsonProperty("end")]
        public DateTime? End { get; set; }

        [JsonProperty("noTags")]
        public bool NoTags { get; set; }
        [JsonProperty("tags")]
        public List<long> Tags { get; set; } = new List<long>();
        
        [JsonProperty("states")]
        public List<string> States { get; set; } = new List<string>();
        
        [JsonProperty("cities")]
        public List<string> Cities { get; set; } = new List<string>();
        
        [JsonProperty("locations")]
        public List<long> Locations { get; set; } = new List<long>();
        
        [JsonProperty("pageSize")]
        public int PageSize { get; set; }
        
        [JsonProperty("page")]
        public int Page { get; set; }
        
        [JsonProperty("orderDetails")]
        public List<OrderByDto> OrderDetails { get; set; } = new List<OrderByDto>();

        [JsonProperty("showHidden")]
        public bool ShowHidden { get; set; }

        public bool OutOfOrder { get; set; }
    }
}
