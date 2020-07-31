using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Newtonsoft.Json;

namespace PhotoBook.Creator.Models
{
    public class PagedResults<T> : JsonResponse<T>
    {
        public PagedResults(T results, int totalResults, string message = null) : base(true, results, null, default(T), message)
        {
            TotalResults = totalResults;
        }

        [JsonProperty("totalResults")]
        public int TotalResults { get; set; }
    }
}