using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Newtonsoft.Json;

namespace PhotoBook.Creator.Models
{
    public class UndoResponse<T>
    {
        [JsonProperty("url")]
        public string Url { get; set; }
        
        [JsonProperty("args")]
        public T Args { get; set; }
    }
}